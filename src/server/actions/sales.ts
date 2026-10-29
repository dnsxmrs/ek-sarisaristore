"use server";

import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSaleSchema,
  CreateSaleInput,
} from "@/lib/validation/sales";
import { Prisma } from "@/generated/prisma/client";
import { getManilaDayBounds } from "@/lib/date";
import { sanitizeError } from "@/lib/errors";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Generate human-friendly unique receipt number: S-YYYYMMDD-XXXX
 */
function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `S-${year}${month}${day}-${random}`;
}

/**
 * Get overall summary stats for Sales (Today's Total, Yesterday, Transaction Count)
 */
export async function getSalesSummary() {
  await connection();
  try {
    const { start: todayStart, end: todayEnd } = getManilaDayBounds(0);
    const { start: yestStart, end: yestEnd } = getManilaDayBounds(-1);

    const [todaySales, yestSales, allSalesAggregate] = await Promise.all([
      prisma.saleTransaction.aggregate({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.saleTransaction.aggregate({
        where: { createdAt: { gte: yestStart, lte: yestEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.saleTransaction.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    return {
      todayTotal: Number(todaySales._sum.totalAmount || 0),
      todayCount: todaySales._count.id || 0,
      yesterdayTotal: Number(yestSales._sum.totalAmount || 0),
      allTimeTotal: Number(allSalesAggregate._sum.totalAmount || 0),
      allTimeCount: allSalesAggregate._count.id || 0,
    };
  } catch (err) {
    console.error("Error getting sales summary:", err);
    return {
      todayTotal: 0,
      todayCount: 0,
      yesterdayTotal: 0,
      allTimeTotal: 0,
      allTimeCount: 0,
    };
  }
}

/**
 * Fetch sales transactions with date filtering and search
 */
export async function getSales(options?: {
  dateFilter?: "today" | "yesterday" | "all";
  query?: string;
  limit?: number;
}) {
  await connection();
  try {
    const dateFilter = options?.dateFilter || "today";
    const query = options?.query?.trim();
    const limit = options?.limit || 50;

    const where: Prisma.SaleTransactionWhereInput = {};

    if (dateFilter === "today") {
      const { start, end } = getManilaDayBounds(0);
      where.createdAt = { gte: start, lte: end };
    } else if (dateFilter === "yesterday") {
      const { start, end } = getManilaDayBounds(-1);
      where.createdAt = { gte: start, lte: end };
    }

    if (query) {
      where.OR = [
        { receiptNumber: { contains: query, mode: "insensitive" } },
        {
          items: {
            some: {
              productNameSnapshot: { contains: query, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const transactions = await prisma.saleTransaction.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const mapped = transactions.map((t) => ({
      id: t.id,
      receiptNumber: t.receiptNumber,
      totalAmount: Number(t.totalAmount),
      cashReceived: Number(t.cashReceived),
      changeAmount: Number(t.changeAmount),
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      createdAt: t.createdAt,
      itemsCount: t.items.reduce((acc, item) => acc + item.quantity, 0),
      items: t.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        unitPriceSnapshot: Number(i.unitPriceSnapshot),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
    }));

    return mapped;
  } catch (err) {
    console.error("Error fetching sales:", err);
    return [];
  }
}

/**
 * Get single sale transaction by ID for receipt viewing
 */
export async function getSaleById(id: string) {
  try {
    const sale = await prisma.saleTransaction.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) return null;

    return {
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      totalAmount: Number(sale.totalAmount),
      cashReceived: Number(sale.cashReceived),
      changeAmount: Number(sale.changeAmount),
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      createdAt: sale.createdAt,
      items: sale.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        unitPriceSnapshot: Number(i.unitPriceSnapshot),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
      })),
    };
  } catch (err) {
    console.error("Error fetching sale by id:", err);
    return null;
  }
}

/**
 * Record a new sale transaction atomically
 */
export async function createSale(
  rawData: CreateSaleInput
): Promise<ActionResult<{ id: string; receiptNumber: string }>> {
  const parsed = createSaleSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Maling datos ng benta.",
      fieldErrors,
    };
  }

  const { items, totalAmount, cashReceived, changeAmount, paymentMethod, notes } =
    parsed.data;

  try {
    const receiptNumber = generateReceiptNumber();

    const createdSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.saleTransaction.create({
        data: {
          receiptNumber,
          totalAmount: new Prisma.Decimal(totalAmount),
          cashReceived: new Prisma.Decimal(cashReceived),
          changeAmount: new Prisma.Decimal(changeAmount),
          paymentMethod,
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId || null,
              productNameSnapshot: item.productNameSnapshot,
              unitPriceSnapshot: new Prisma.Decimal(item.unitPriceSnapshot),
              quantity: item.quantity,
              subtotal: new Prisma.Decimal(item.subtotal),
            })),
          },
        },
      });

      return sale;
    });

    revalidatePath("/sales");

    return {
      success: true,
      data: { id: createdSale.id, receiptNumber: createdSale.receiptNumber },
      message: `Matagumpay na naitala ang benta (${createdSale.receiptNumber})!`,
    };
  } catch (err) {
    console.error("Create sale error:", err);
    return {
      success: false,
      error: sanitizeError(err, "Hindi na-save ang benta. Pakisubukan muli."),
    };
  }
}
