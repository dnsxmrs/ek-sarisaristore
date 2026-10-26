"use client";

import { useEffect } from "react";
import { X, Receipt, Calendar, CreditCard } from "lucide-react";
import { formatPeso } from "@/lib/money";

export interface SaleDetail {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: Date | string;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface SaleReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
}

export function SaleReceiptModal({
  isOpen,
  onClose,
  sale,
}: SaleReceiptModalProps) {
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

  if (!isOpen || !sale) return null;

  const formattedDate = new Date(sale.createdAt).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-slate-900 leading-tight">
                Resibo ng Benta
              </h2>
              <span className="font-mono text-[11px] text-slate-500 block">
                {sale.receiptNumber}
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

        {/* Date and info */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            <span>{sale.paymentMethod}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3">
          {sale.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-1 border-b border-slate-100/70"
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="font-medium text-slate-900 block truncate">
                  {item.productNameSnapshot}
                </span>
                <span className="text-[11px] text-slate-600 font-mono">
                  {item.quantity} x {formatPeso(item.unitPriceSnapshot)}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-900 shrink-0">
                {formatPeso(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Totals */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs mb-4">
          <div className="flex items-center justify-between font-bold text-sm text-slate-900 pt-0.5">
            <span>Kabuuan:</span>
            <span className="font-mono text-base text-teal-800">
              {formatPeso(sale.totalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Binayad (Cash):</span>
            <span className="font-mono font-medium">
              {formatPeso(sale.cashReceived)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1.5">
            <span>Sukli:</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatPeso(sale.changeAmount)}
            </span>
          </div>
        </div>

        {sale.notes && (
          <p className="text-[11px] text-slate-500 italic mb-3 text-center">
            &ldquo;{sale.notes}&rdquo;
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Isara
        </button>
      </div>
    </div>
  );
}
