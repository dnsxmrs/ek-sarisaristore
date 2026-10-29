"use client";

import { useState, useTransition } from "react";
import { X, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { recordPayment } from "@/server/actions/utang";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentBalance: number;
  debtRecordId?: string;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentBalance,
  debtRecordId,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handlePayFull = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Maglagay ng wastong halaga ng bayad.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const res = await recordPayment({
        customerId,
        debtRecordId: debtRecordId || undefined,
        amount: numericAmount,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setAmount("");
        setNotes("");
        onSuccess?.();
        onClose();
      } else {
        setFormError(res.error || "Hindi naitala ang bayad.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm md:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <CheckCircle2 className="w-4 h-4 font-bold shrink-0" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 leading-tight whitespace-nowrap">
                Magtala ng Bayad
              </h2>
              <span className="text-[11px] text-slate-600 block whitespace-nowrap">
                {customerName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Notice */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-600 block">Kasalukuyang Utang:</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {formatPeso(currentBalance)}
            </span>
          </div>
          {currentBalance > 0 && (
            <button
              type="button"
              onClick={handlePayFull}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-100/70 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Bayaran Buo
            </button>
          )}
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Halaga ng Bayad <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-base font-mono">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0.25"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-base font-semibold text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Paalala o Resibo (Opsyonal)
            </label>
            <input
              type="text"
              placeholder="hal. Cash bayad sa tindahan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Kanselahin
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <span>Sine-save...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">I-save ang Bayad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
