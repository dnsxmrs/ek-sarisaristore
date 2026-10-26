"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Phone,
  Mail,
  Camera,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { NewDebtModal } from "./NewDebtModal";
import { PaymentModal } from "./PaymentModal";
import { PhotoLightboxModal } from "./PhotoLightboxModal";

export interface DebtItem {
  id: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  description: string | null;
  photoUrl: string | null;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
}

export interface PaymentItem {
  id: string;
  debtRecordId: string | null;
  amount: number;
  notes: string | null;
  createdAt: Date;
}

export interface CustomerLedgerData {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  currentBalance: number;
  totalBorrowed: number;
  totalPaid: number;
  debts: DebtItem[];
  payments: PaymentItem[];
}

interface CustomerLedgerViewProps {
  customer: CustomerLedgerData;
}

export function CustomerLedgerView({ customer }: CustomerLedgerViewProps) {
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Selected photo for Lightbox
  const [lightboxData, setLightboxData] = useState<{
    photoUrl: string;
    amount?: number;
    description?: string | null;
    date?: Date;
  } | null>(null);

  // Combine debts and payments into a single chronological timeline
  type TimelineEntry =
    | { type: "debt"; data: DebtItem; date: Date }
    | { type: "payment"; data: PaymentItem; date: Date };

  const timeline: TimelineEntry[] = [
    ...customer.debts.map((d) => ({
      type: "debt" as const,
      data: d,
      date: new Date(d.createdAt),
    })),
    ...customer.payments.map((p) => ({
      type: "payment" as const,
      data: p,
      date: new Date(p.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* ======================================================== */}
      {/* TOP BAR / BACK LINK */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between">
        <Link
          href="/utang"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bumalik sa Utang</span>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* CUSTOMER PROFILE & BALANCE CARD */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-xl text-white">
              {customer.name}
            </h1>
            {customer.nickname && (
              <span className="text-xs text-teal-300 font-medium block">
                &ldquo;{customer.nickname}&rdquo;
              </span>
            )}

            {/* Phone & Email contacts */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1 hover:text-teal-300 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  <span>{customer.phone}</span>
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1 hover:text-teal-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>{customer.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Current Balance */}
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 block font-medium">
              Natitirang Utang
            </span>
            <span
              className={`text-2xl font-black font-mono tracking-tight block ${
                customer.currentBalance > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {formatPeso(customer.currentBalance)}
            </span>
          </div>
        </div>

        {customer.notes && (
          <p className="mt-3 text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
            {customer.notes}
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsDebtModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>Maglista ng Utang</span>
          </button>
          <button
            type="button"
            disabled={customer.currentBalance <= 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Magtala ng Bayad</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TIMELINE / HISTORY */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-xs tracking-wider uppercase text-slate-500 px-1">
          Kasaysayan ng Utang at Bayad
        </h2>

        {timeline.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-2xs">
            Wala pang nakatalang transaksyon para sa suki na ito.
          </div>
        ) : (
          <div className="space-y-2.5">
            {timeline.map((entry) => {
              if (entry.type === "debt") {
                const debt = entry.data;
                const isPaid = debt.status === "PAID";
                const isPartial = debt.status === "PARTIAL";

                return (
                  <div
                    key={`debt-${debt.id}`}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Status & Date */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : isPartial
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isPaid
                              ? "Bayad na"
                              : isPartial
                              ? `May natitirang ${formatPeso(debt.remainingAmount)}`
                              : "Di pa bayad"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(debt.createdAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })}
                          </span>
                        </div>

                        {/* Description */}
                        {debt.description && (
                          <p className="text-xs font-medium text-slate-800 pt-0.5">
                            {debt.description}
                          </p>
                        )}
                      </div>

                      {/* Debt Amount */}
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-bold text-rose-600 block">
                          +{formatPeso(debt.amount)}
                        </span>
                        {debt.paidAmount > 0 && !isPaid && (
                          <span className="font-mono text-[10px] text-emerald-600 block">
                            (Nabayaran: {formatPeso(debt.paidAmount)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* PHOTO EVIDENCE THUMBNAIL (The star feature!) */}
                    {debt.photoUrl && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxData({
                              photoUrl: debt.photoUrl!,
                              amount: debt.amount,
                              description: debt.description,
                              date: debt.createdAt,
                            })
                          }
                          className="flex items-center gap-2 text-teal-800 hover:text-teal-950 group cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={debt.photoUrl}
                            alt="Ebidensya"
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 group-hover:border-teal-500 shadow-2xs transition-all"
                          />
                          <div className="text-left">
                            <span className="text-xs font-semibold flex items-center gap-1 text-slate-800 group-hover:text-teal-900">
                              <Camera className="w-3 h-3 text-teal-600" />
                              <span>Litrato ng Paninda</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Pindutin para buksan ang buong litrato
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                );
              } else {
                // Payment entry
                const payment = entry.data;
                return (
                  <div
                    key={`payment-${payment.id}`}
                    className="bg-emerald-50/50 rounded-2xl border border-emerald-200/70 p-3.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hulog / Bayad</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(payment.createdAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              hour12: true,
                            })}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-slate-700 italic">
                            {payment.notes}
                          </p>
                        )}
                      </div>

                      {/* Payment Amount */}
                      <span className="font-mono text-sm font-bold text-emerald-700 shrink-0">
                        -{formatPeso(payment.amount)}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <NewDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        customers={[{ id: customer.id, name: customer.name, nickname: customer.nickname }]}
        preselectedCustomerId={customer.id}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        currentBalance={customer.currentBalance}
      />

      {lightboxData && (
        <PhotoLightboxModal
          isOpen={!!lightboxData}
          onClose={() => setLightboxData(null)}
          photoUrl={lightboxData.photoUrl}
          customerName={customer.name}
          amount={lightboxData.amount}
          description={lightboxData.description}
          date={lightboxData.date}
        />
      )}
    </div>
  );
}
