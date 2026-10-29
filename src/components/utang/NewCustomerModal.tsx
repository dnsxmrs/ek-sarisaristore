"use client";

import { useState, useTransition } from "react";
import { X, UserPlus, AlertCircle, Check } from "lucide-react";
import { createCustomer } from "@/server/actions/utang";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: { id: string; name: string }) => void;
}

export function NewCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: NewCustomerModalProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Kinakailangan ang pangalan ng suki.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const res = await createCustomer({
        name: trimmedName,
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive: true,
      });

      if (res.success) {
        onCustomerCreated?.({ id: res.data.id, name: trimmedName });
        // Reset form
        setName("");
        setNickname("");
        setPhone("");
        setEmail("");
        setNotes("");
        onClose();
      } else {
        setFormError(res.error || "Hindi na-save ang suki.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm md:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800 shrink-0">
              <UserPlus className="w-4 h-4 shrink-0" />
            </div>
            <h2 className="font-heading font-bold text-base text-slate-900 whitespace-nowrap">
              Bagong Suki
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pangalan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="hal. Juan dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-sm text-slate-900 transition-all"
            />
          </div>

          {/* Nickname & Contact Number in a clean 2-column row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Palayaw (Opsyonal)
              </label>
              <input
                type="text"
                placeholder="hal. Kuya Juan"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Phone (Opsyonal)
              </label>
              <input
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Email (Opsyonal)
            </label>
            <input
              type="email"
              placeholder="juan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Paalala / Notes (Opsyonal)
            </label>
            <input
              type="text"
              placeholder="hal. Katabing bahay, tuwing Sabado nagbabayad"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900"
            />
          </div>

          {/* Buttons */}
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
                  <span className="whitespace-nowrap">I-save ang Suki</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
