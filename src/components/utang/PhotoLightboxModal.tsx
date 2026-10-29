"use client";

import { useEffect } from "react";
import { X, Calendar, User, FileText } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/date";

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  customerName?: string;
  amount?: number;
  description?: string | null;
  date?: Date | string;
}

export function PhotoLightboxModal({
  isOpen,
  onClose,
  photoUrl,
  customerName,
  amount,
  description,
  date,
}: PhotoLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  const formattedDate = date ? formatManilaDateTime(date) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-400" />
            <span className="font-heading font-semibold text-sm">
              {customerName || "Ebidensya ng Utang"}
            </span>
            {amount !== undefined && (
              <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full ml-1 font-mono">
                {formatPeso(amount)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[260px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Litrato ng paninda"
            className="max-h-[60vh] w-full object-contain"
          />
        </div>

        {/* Footer info (Minimalist) */}
        {(description || formattedDate) && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex flex-col gap-1">
            {description && (
              <div className="flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span className="text-slate-800 font-medium">{description}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Calendar className="w-3 h-3 text-slate-600" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
