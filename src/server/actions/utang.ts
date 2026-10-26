"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  customerSchema,
  debtRecordSchema,
  debtPaymentSchema,
  CustomerInput,
  DebtRecordInput,
  DebtPaymentInput,
} from "@/lib/validation/utang";
import { Prisma } from "@/generated/prisma/client";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Get overall summary stats for the Utang Ledger (Top dashboard banner)
 */
export async function getUtangSummaryStats() {
  try {
    const activeDebts = await prisma.debtRecord.findMany({
      where: {
        status: { in: ["UNPAID", "PARTIAL"] },
        customer: { isActive: true },
      },
      select: {
        amount: true,
        paidAmount: true,
        customerId: true,
      },
    });

    let totalOutstanding = 0;
    const debtorCustomerIds = new Set<string>();

    for (const d of activeDebts) {
      const balance = Number(d.amount) - Number(d.paidAmount);
      if (balance > 0) {
        totalOutstanding += balance;
        debtorCustomerIds.add(d.customerId);
      }
    }

    return {
      totalOutstanding,
      activeDebtorsCount: debtorCustomerIds.size,
    };
  } catch (err) {
    console.error("Error getting utang summary stats:", err);
    return {
      totalOutstanding: 0,
      activeDebtorsCount: 0,
    };
  }
}

/**
 * List all active customers with their computed balance & debt summary
 */
export async function getCustomers(query?: string) {
  try {
    const trimmed = query?.trim();

    const whereClause: Prisma.CustomerWhereInput = {
      isActive: true,
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { nickname: { contains: trimmed, mode: "insensitive" } },
              { phone: { contains: trimmed } },
            ],
          }
        : {}),
    };

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        debts: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const mapped = customers.map((c) => {
      let balance = 0;
      let unpaidCount = 0;
      let hasRecentPhoto = false;
      let lastDebtDate: Date | null = null;

      for (const d of c.debts) {
        const remaining = Number(d.amount) - Number(d.paidAmount);
        if (remaining > 0) {
          balance += remaining;
          unpaidCount++;
          if (d.photoUrl) {
            hasRecentPhoto = true;
          }
        }
        if (!lastDebtDate && d.createdAt) {
          lastDebtDate = d.createdAt;
        }
      }

      return {
        id: c.id,
        name: c.name,
        nickname: c.nickname,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        totalBalance: balance,
        unpaidCount,
        hasRecentPhoto,
        lastDebtDate,
        createdAt: c.createdAt,
      };
    });

    // Sort: Customers with balance first (highest balance to lowest), then alphabetical
    mapped.sort((a, b) => {
      if (b.totalBalance !== a.totalBalance) {
        return b.totalBalance - a.totalBalance;
      }
      return a.name.localeCompare(b.name);
    });

    return mapped;
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

/**
 * Get detailed customer ledger with all debts and payments
 */
export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        debts: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return null;
    }

    let totalBorrowed = 0;
    let totalPaid = 0;
    let currentBalance = 0;

    const formattedDebts = customer.debts.map((d) => {
      const amount = Number(d.amount);
      const paid = Number(d.paidAmount);
      const remaining = Math.max(0, amount - paid);

      totalBorrowed += amount;
      totalPaid += paid;
      currentBalance += remaining;

      return {
        ...d,
        amount,
        paidAmount: paid,
        remainingAmount: remaining,
      };
    });

    const formattedPayments = customer.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));

    return {
      id: customer.id,
      name: customer.name,
      nickname: customer.nickname,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      totalBorrowed,
      totalPaid,
      currentBalance,
      debts: formattedDebts,
      payments: formattedPayments,
    };
  } catch (err) {
    console.error("Error fetching customer by id:", err);
    return null;
  }
}

/**
 * Create a new Customer
 */
export async function createCustomer(rawData: CustomerInput): Promise<ActionResult<{ id: string }>> {
  const parsed = customerSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Maling datos ng suki.",
      fieldErrors,
    };
  }

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        nickname: parsed.data.nickname || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        notes: parsed.data.notes || null,
        isActive: true,
      },
    });

    revalidatePath("/utang");
    return {
      success: true,
      data: { id: newCustomer.id },
      message: `Naitala si ${newCustomer.name} bilang suki!`,
    };
  } catch (err) {
    console.error("Create customer error:", err);
    return {
      success: false,
      error: "Hindi na-save ang suki. Pakisubukan muli.",
    };
  }
}

/**
 * Record a new Debt transaction (Utang) with optional photo evidence
 */
export async function createDebtRecord(
  rawData: DebtRecordInput
): Promise<ActionResult<{ id: string; customerId: string }>> {
  const parsed = debtRecordSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Maling datos ng utang.",
      fieldErrors,
    };
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true, name: true },
    });

    if (!customer) {
      return { success: false, error: "Hindi nahanap ang piniling suki." };
    }

    const newDebt = await prisma.debtRecord.create({
      data: {
        customerId: parsed.data.customerId,
        amount: new Prisma.Decimal(parsed.data.amount),
        paidAmount: new Prisma.Decimal(0),
        status: "UNPAID",
        description: parsed.data.description || null,
        photoUrl: parsed.data.photoUrl || null,
        dueDate: parsed.data.dueDate || null,
      },
    });

    revalidatePath("/utang");
    revalidatePath(`/utang/${parsed.data.customerId}`);

    return {
      success: true,
      data: { id: newDebt.id, customerId: customer.id },
      message: `Matagumpay na nailista ang utang ni ${customer.name}!`,
    };
  } catch (err) {
    console.error("Create debt error:", err);
    return {
      success: false,
      error: "Hindi na-save ang utang. Pakisubukan muli.",
    };
  }
}

/**
 * Record a payment (Bayad o Hulog)
 */
export async function recordPayment(
  rawData: DebtPaymentInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = debtPaymentSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Maling datos ng bayad.",
    };
  }

  const { customerId, debtRecordId, amount, notes } = parsed.data;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create payment entry
      const createdPayment = await tx.debtPayment.create({
        data: {
          customerId,
          debtRecordId: debtRecordId || null,
          amount: new Prisma.Decimal(amount),
          notes: notes || null,
        },
      });

      // 2. If specific debtRecordId is targeted
      if (debtRecordId) {
        const debt = await tx.debtRecord.findUnique({
          where: { id: debtRecordId },
        });

        if (debt) {
          const newPaid = Number(debt.paidAmount) + amount;
          const isFullyPaid = newPaid >= Number(debt.amount);

          await tx.debtRecord.update({
            where: { id: debtRecordId },
            data: {
              paidAmount: new Prisma.Decimal(newPaid),
              status: isFullyPaid ? "PAID" : "PARTIAL",
            },
          });
        }
      } else {
        // 3. FIFO allocation: Apply payment to oldest unpaid/partial debts
        let remainingToApply = amount;
        const unpaidDebts = await tx.debtRecord.findMany({
          where: {
            customerId,
            status: { in: ["UNPAID", "PARTIAL"] },
          },
          orderBy: { createdAt: "asc" },
        });

        for (const d of unpaidDebts) {
          if (remainingToApply <= 0) break;

          const remainingOnDebt = Number(d.amount) - Number(d.paidAmount);
          const applyToThis = Math.min(remainingToApply, remainingOnDebt);

          const updatedPaid = Number(d.paidAmount) + applyToThis;
          const isPaid = updatedPaid >= Number(d.amount);

          await tx.debtRecord.update({
            where: { id: d.id },
            data: {
              paidAmount: new Prisma.Decimal(updatedPaid),
              status: isPaid ? "PAID" : "PARTIAL",
            },
          });

          remainingToApply -= applyToThis;
        }
      }

      return createdPayment;
    });

    revalidatePath("/utang");
    revalidatePath(`/utang/${customerId}`);

    return {
      success: true,
      data: { id: payment.id },
      message: "Matagumpay na naitala ang bayad!",
    };
  } catch (err) {
    console.error("Record payment error:", err);
    return {
      success: false,
      error: "Hindi naitala ang bayad. Pakisubukan muli.",
    };
  }
}
