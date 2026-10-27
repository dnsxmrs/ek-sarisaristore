"use server";

import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AnalyticsTimeRange = "today" | "7days" | "30days" | "all";

export interface TopProductMetric {
  name: string;
  quantity: number;
  totalRevenue: number;
}

export interface DailyTrendPoint {
  dayLabel: string;
  dateStr: string;
  totalSales: number;
  transactionCount: number;
}

export interface StoreAnalyticsData {
  timeRange: AnalyticsTimeRange;
  sales: {
    totalRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
    cashSales: number;
    gcashSales: number;
    cashCount: number;
    gcashCount: number;
  };
  utang: {
    totalCollectible: number;
    unpaidCount: number;
    collectedInPeriod: number;
    collectionCount: number;
  };
  inventory: {
    activeProductsCount: number;
    categoriesCount: number;
  };
  topProducts: TopProductMetric[];
  dailyTrend: DailyTrendPoint[];
}

/**
 * Returns date boundary range for a given filter.
 */
function getDateRange(range: AnalyticsTimeRange): { gte?: Date; lte?: Date } | undefined {
  const now = new Date();

  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  if (range === "7days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { gte: start, lte: now };
  }

  if (range === "30days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { gte: start, lte: now };
  }

  return undefined;
}

/**
 * Get highly aggregated, lightweight analytics for reports & dashboard.
 * Optimized so ONLY necessary aggregated numbers are fetched from PostgreSQL.
 */
export async function getStoreAnalytics(
  timeRange: AnalyticsTimeRange = "today"
): Promise<StoreAnalyticsData> {
  try {
    await connection();
  } catch {
    // connection() only applies within active Next request contexts
  }

  try {
    const dateRange = getDateRange(timeRange);
    const salesWhere: Prisma.SaleTransactionWhereInput = dateRange
      ? { createdAt: { gte: dateRange.gte, lte: dateRange.lte } }
      : {};

    const paymentWhere: Prisma.DebtPaymentWhereInput = dateRange
      ? { createdAt: { gte: dateRange.gte, lte: dateRange.lte } }
      : {};

    // 7-day trend start date
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 6);
    trendStart.setHours(0, 0, 0, 0);

    // Parallel aggregate queries directly on PostgreSQL
    const [
      salesAggregate,
      paymentMethodBreakdown,
      uncollectedUtangAgg,
      collectedUtangPeriodAgg,
      activeProductsCount,
      categoriesCount,
      topSaleItems,
      recentTrendTransactions,
    ] = await Promise.all([
      // 1. Overall sales revenue & transaction count
      prisma.saleTransaction.aggregate({
        where: salesWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // 2. Sales by Cash vs GCash
      prisma.saleTransaction.groupBy({
        by: ["paymentMethod"],
        where: salesWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // 3. Current active uncollected utang
      prisma.debtRecord.aggregate({
        where: {
          status: { in: ["UNPAID", "PARTIAL"] },
          customer: { isActive: true },
        },
        _sum: {
          amount: true,
          paidAmount: true,
        },
        _count: { id: true },
      }),

      // 4. Utang payments collected during the selected period
      prisma.debtPayment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 5. Total active products count
      prisma.product.count({ where: { isActive: true } }),

      // 6. Total product categories
      prisma.category.count(),

      // 7. Top 5 selling items by quantity in period
      prisma.saleItem.groupBy({
        by: ["productNameSnapshot"],
        where: dateRange ? { sale: { createdAt: { gte: dateRange.gte, lte: dateRange.lte } } } : undefined,
        _sum: {
          quantity: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),

      // 8. Minimal fields for 7-day trend (only createdAt and totalAmount)
      prisma.saleTransaction.findMany({
        where: { createdAt: { gte: trendStart } },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
    ]);

    // Compute sales totals
    const totalRevenue = Number(salesAggregate._sum.totalAmount || 0);
    const transactionCount = salesAggregate._count.id || 0;
    const averageTransactionValue =
      transactionCount > 0 ? totalRevenue / transactionCount : 0;

    let cashSales = 0;
    let gcashSales = 0;
    let cashCount = 0;
    let gcashCount = 0;

    for (const group of paymentMethodBreakdown) {
      const amount = Number(group._sum.totalAmount || 0);
      const count = group._count.id || 0;
      if (group.paymentMethod.toUpperCase() === "GCASH") {
        gcashSales += amount;
        gcashCount += count;
      } else {
        cashSales += amount;
        cashCount += count;
      }
    }

    // Compute utang collectibles
    const totalDebtPrincipal = Number(uncollectedUtangAgg._sum.amount || 0);
    const totalDebtPaid = Number(uncollectedUtangAgg._sum.paidAmount || 0);
    const totalCollectible = Math.max(0, totalDebtPrincipal - totalDebtPaid);
    const unpaidCount = uncollectedUtangAgg._count.id || 0;

    const collectedInPeriod = Number(collectedUtangPeriodAgg._sum.amount || 0);
    const collectionCount = collectedUtangPeriodAgg._count.id || 0;

    // Map top 5 products
    const topProducts: TopProductMetric[] = topSaleItems.map((item) => ({
      name: item.productNameSnapshot,
      quantity: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.subtotal || 0),
    }));

    // Bucket 7-day trend
    const dayNames = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];
    const monthNames = ["Ene", "Peb", "Mar", "Abr", "May", "Hun", "Hul", "Ago", "Set", "Okt", "Nob", "Dis"];

    const dailyTrend: DailyTrendPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const date = d.getDate();

      const dayLabel = i === 0 ? "Ngayon" : dayNames[d.getDay()];
      const dateStr = `${monthNames[month]} ${date}`;

      // Filter matches from the lightweight in-memory array
      let dayTotal = 0;
      let dayTxCount = 0;

      for (const tx of recentTrendTransactions) {
        const txDate = new Date(tx.createdAt);
        if (
          txDate.getFullYear() === year &&
          txDate.getMonth() === month &&
          txDate.getDate() === date
        ) {
          dayTotal += Number(tx.totalAmount);
          dayTxCount += 1;
        }
      }

      dailyTrend.push({
        dayLabel,
        dateStr,
        totalSales: dayTotal,
        transactionCount: dayTxCount,
      });
    }

    return {
      timeRange,
      sales: {
        totalRevenue,
        transactionCount,
        averageTransactionValue,
        cashSales,
        gcashSales,
        cashCount,
        gcashCount,
      },
      utang: {
        totalCollectible,
        unpaidCount,
        collectedInPeriod,
        collectionCount,
      },
      inventory: {
        activeProductsCount,
        categoriesCount,
      },
      topProducts,
      dailyTrend,
    };
  } catch (err) {
    console.error("Error computing store analytics:", err);
    return {
      timeRange,
      sales: {
        totalRevenue: 0,
        transactionCount: 0,
        averageTransactionValue: 0,
        cashSales: 0,
        gcashSales: 0,
        cashCount: 0,
        gcashCount: 0,
      },
      utang: {
        totalCollectible: 0,
        unpaidCount: 0,
        collectedInPeriod: 0,
        collectionCount: 0,
      },
      inventory: {
        activeProductsCount: 0,
        categoriesCount: 0,
      },
      topProducts: [],
      dailyTrend: [],
    };
  }
}
