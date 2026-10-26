"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ShoppingBag,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { NewSaleModal, ProductCatalogItem } from "./NewSaleModal";
import { SaleReceiptModal, SaleDetail } from "./SaleReceiptModal";

export interface SaleListItem {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  cashReceived: number;
  changeAmount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: Date;
  itemsCount: number;
  items: Array<{
    id: string;
    productId: string | null;
    productNameSnapshot: string;
    unitPriceSnapshot: number;
    quantity: number;
    subtotal: number;
  }>;
}

interface SalesListViewProps {
  initialSales: SaleListItem[];
  initialSummary: {
    todayTotal: number;
    todayCount: number;
    yesterdayTotal: number;
    allTimeTotal: number;
    allTimeCount: number;
  };
  products: ProductCatalogItem[];
}

export function SalesListView({
  initialSales,
  initialSummary,
  products,
}: SalesListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "all">("today");

  // Modals
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<SaleDetail | null>(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return initialSales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (dateFilter === "today") {
        const isToday =
          saleDate.getDate() === today.getDate() &&
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === "yesterday") {
        const isYesterday =
          saleDate.getDate() === yesterday.getDate() &&
          saleDate.getMonth() === yesterday.getMonth() &&
          saleDate.getFullYear() === yesterday.getFullYear();
        if (!isYesterday) return false;
      }

      // Search query
      if (!q) return true;
      const matchReceipt = sale.receiptNumber.toLowerCase().includes(q);
      const matchItem = sale.items.some((i) =>
        i.productNameSnapshot.toLowerCase().includes(q)
      );
      return matchReceipt || matchItem;
    });
  }, [initialSales, searchQuery, dateFilter]);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* ======================================================== */}
      {/* MINIMALIST SUMMARY BANNER */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium tracking-wide uppercase text-teal-300">
              Benta Ngayong Araw
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5">
              {formatPeso(initialSummary.todayTotal)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Transaksyon</span>
            <span className="text-sm font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-block mt-0.5">
              {initialSummary.todayCount} benta
            </span>
          </div>
        </div>

        {/* Secondary metric: Kahapon */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span>Kahapon: <strong className="text-slate-200 font-mono">{formatPeso(initialSummary.yesterdayTotal)}</strong></span>
          </div>
          <span className="text-[11px] text-slate-500">
            Lahat: {formatPeso(initialSummary.allTimeTotal)}
          </span>
        </div>

        {/* Big Action Button */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={() => setIsNewSaleOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>Magtala ng Bagong Benta</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH & FILTER BAR */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hanapin ang resibo o produkto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
          />
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              dateFilter === "today"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Ngayong Araw
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("yesterday")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              dateFilter === "yesterday"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Kahapon
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              dateFilter === "all"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Lahat
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SALES TRANSACTIONS LIST */}
      {/* ======================================================== */}
      <div className="space-y-2">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-800 mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-800 mb-1">
              {searchQuery
                ? "Walang nahanap na benta"
                : dateFilter === "today"
                ? "Wala pang benta ngayong araw"
                : "Walang nakatalang transaksyon"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
              Pindutin ang &ldquo;Magtala ng Bagong Benta&rdquo; upang magsimula.
            </p>
            <button
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Magtala ng Benta</span>
            </button>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const timeString = new Date(sale.createdAt).toLocaleTimeString(
              "en-PH",
              { hour: "numeric", minute: "numeric", hour12: true }
            );

            // Preview first 2-3 items
            const itemsSummary = sale.items
              .slice(0, 2)
              .map((i) => `${i.quantity}x ${i.productNameSnapshot}`)
              .join(", ");
            const hasMoreItems = sale.items.length > 2;

            return (
              <button
                key={sale.id}
                type="button"
                onClick={() => setSelectedSaleForReceipt(sale)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500 p-3.5 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {sale.receiptNumber}
                      </span>
                      <span className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{timeString}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                      {itemsSummary}
                      {hasMoreItems && (
                        <span className="text-slate-600">
                          {" "}
                          (+{sale.items.length - 2} pa)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Right: Total Amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-teal-900 block">
                        {formatPeso(sale.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-600 block">
                        {sale.itemsCount} piraso
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={products}
      />

      {selectedSaleForReceipt && (
        <SaleReceiptModal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
        />
      )}
    </div>
  );
}
