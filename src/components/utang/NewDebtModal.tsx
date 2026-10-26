"use client";

import { useState, useTransition } from "react";
import { X, Plus, AlertCircle, Check, UserPlus } from "lucide-react";
import { PhotoEvidenceCapture } from "./PhotoEvidenceCapture";
import { createDebtRecord } from "@/server/actions/utang";

interface CustomerOption {
  id: string;
  name: string;
  nickname?: string | null;
}

interface NewDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  preselectedCustomerId?: string;
  onOpenNewCustomerModal?: () => void;
  onSuccess?: () => void;
}

export function NewDebtModal({
  isOpen,
  onClose,
  customers,
  preselectedCustomerId,
  onOpenNewCustomerModal,
  onSuccess,
}: NewDebtModalProps) {
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCustomerId = customerId || preselectedCustomerId;

    if (!effectiveCustomerId) {
      setFormError("Pumili ng suki na may utang.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Maglagay ng wastong halaga ng utang.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const res = await createDebtRecord({
        customerId: effectiveCustomerId,
        amount: numericAmount,
        description: description.trim() || undefined,
        photoUrl: photoUrl || undefined,
        dueDate: dueDate || undefined,
      });

      if (res.success) {
        // Reset state
        setAmount("");
        setDescription("");
        setPhotoUrl(null);
        setDueDate("");
        onSuccess?.();
        onClose();
      } else {
        setFormError(res.error || "Hindi na-save ang utang.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Plus className="w-4 h-4 font-bold" />
            </div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Maglista ng Utang
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Customer Selection */}
          {!preselectedCustomerId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Suki <span className="text-rose-500">*</span>
                </label>
                {onOpenNewCustomerModal && (
                  <button
                    type="button"
                    onClick={onOpenNewCustomerModal}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Bagong Suki</span>
                  </button>
                )}
              </div>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900 bg-white"
              >
                <option value="">-- Pumili ng Suki --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nickname ? `(${c.nickname})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount (Halaga) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Halaga ng Utang <span className="text-rose-500">*</span>
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

          {/* Photo Evidence Capture (Core requested feature!) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Litrato ng mga Paninda (Ebidensya)
            </label>
            <PhotoEvidenceCapture photoUrl={photoUrl} onChange={setPhotoUrl} />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Mga Kinuha / Listahan (Opsyonal)
            </label>
            <input
              type="text"
              placeholder="hal. 2 sardinas, 1 mantika, 3 itlog"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
            />
          </div>

          {/* Due date (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Kailan Babayaran (Opsyonal)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
            />
          </div>

          {/* Submit Actions */}
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
                  <Check className="w-3.5 h-3.5" />
                  <span>I-save ang Utang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
