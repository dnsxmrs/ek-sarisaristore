"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ShoppingBag,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { formatManilaRelative } from "@/lib/date";
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

  const averageSale =
    initialSummary.todayCount > 0
      ? initialSummary.todayTotal / initialSummary.todayCount
      : 0;

  return (
    <div className="w-full max-w-md md:max-w-none mx-auto pb-24 md:pb-12 animate-fade-in">
      {/* Top Header on Desktop */}
      <div className="hidden md:flex md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Mga Benta (Sales & Transactions)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Talaan ng mga transaksyon at arawang benta sa tindahan
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewSaleOpen(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="whitespace-nowrap">Magtala ng Bagong Benta</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* METRIC CARDS: DESKTOP (Grid of 4) vs MOBILE (Compact Dark Banner) */}
      {/* ======================================================== */}
      {/* Mobile Banner (< md) */}
      <div className="md:hidden bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium tracking-wide uppercase text-teal-300 whitespace-nowrap shrink-0">
              Benta Ngayong Araw
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5 whitespace-nowrap">
              {formatPeso(initialSummary.todayTotal)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 block whitespace-nowrap">Transaksyon</span>
            <span className="text-sm font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-block mt-0.5 whitespace-nowrap">
              {initialSummary.todayCount} benta
            </span>
          </div>
        </div>

        {/* Secondary metric: Kahapon */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">
              Kahapon: <strong className="text-slate-200 font-mono">{formatPeso(initialSummary.yesterdayTotal)}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 whitespace-nowrap shrink-0">
            Lahat: {formatPeso(initialSummary.allTimeTotal)}
          </span>
        </div>

        {/* Big Action Button on Mobile */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={() => setIsNewSaleOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 font-bold shrink-0" />
            <span className="whitespace-nowrap">Magtala ng Bagong Benta</span>
          </button>
        </div>
      </div>

      {/* Desktop KPI Cards Grid (>= md) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1: Benta Ngayong Araw */}
        <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-teal-300 whitespace-nowrap shrink-0">
              Benta Ngayong Araw
            </span>
            <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap shrink-0">
              {initialSummary.todayCount} benta
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-white my-2.5 whitespace-nowrap">
            {formatPeso(initialSummary.todayTotal)}
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Kabuuang benta ngayong petsa</span>
          </div>
        </div>

        {/* Card 2: Benta Kahapon */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 whitespace-nowrap shrink-0">
            Benta Kahapon
          </span>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 my-2.5 whitespace-nowrap">
            {formatPeso(initialSummary.yesterdayTotal)}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="whitespace-nowrap">Paghahambing sa nakaraang araw</span>
          </div>
        </div>

        {/* Card 3: Lahat ng Benta */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 whitespace-nowrap shrink-0">
              Kabuuang Naitala
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {initialSummary.allTimeCount} transaksyon
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 my-2.5 whitespace-nowrap">
            {formatPeso(initialSummary.allTimeTotal)}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">Kabuuang benta mula umpisa</span>
          </div>
        </div>

        {/* Card 4: Karaniwang Benta (Average Basket) */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 whitespace-nowrap shrink-0">
              Karaniwang Benta
            </span>
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 whitespace-nowrap shrink-0">
              bawat resibo
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 my-2.5 whitespace-nowrap">
            {formatPeso(averageSale)}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <Receipt className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="whitespace-nowrap">Average basket size ngayong araw</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH & FILTER BAR */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
          <input
            type="text"
            placeholder="Hanapin ang resibo o produkto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white min-h-[40px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] shrink-0 cursor-pointer ${
              dateFilter === "today"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Ngayong Araw
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("yesterday")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] shrink-0 cursor-pointer ${
              dateFilter === "yesterday"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Kahapon
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] shrink-0 cursor-pointer ${
              dateFilter === "all"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Lahat
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SALES TRANSACTIONS GRID */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {filteredSales.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-800 mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 shrink-0" />
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
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Magtala ng Benta</span>
            </button>
          </div>
        ) : (
          filteredSales.map((sale) => {
            const timeString = formatManilaRelative(sale.createdAt);

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
                className="w-full text-left bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div>
                  {/* Header: Receipt # and Time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                      {sale.receiptNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="whitespace-nowrap">{timeString}</span>
                    </span>
                  </div>

                  {/* Items summary */}
                  <p className="text-xs text-slate-700 font-medium line-clamp-2 min-h-[2rem]">
                    {itemsSummary}
                    {hasMoreItems && (
                      <span className="text-slate-400 font-normal whitespace-nowrap">
                        {" "}
                        (+{sale.items.length - 2} pa)
                      </span>
                    )}
                  </p>
                </div>

                {/* Footer: Payment Method, Quantity, Total Price */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap shrink-0 ${
                        sale.paymentMethod === "GCASH"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                          : "bg-slate-100 text-slate-600 border border-slate-200/80"
                      }`}
                    >
                      {sale.paymentMethod}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {sale.itemsCount} piraso
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-sm sm:text-base font-bold font-heading text-teal-900 whitespace-nowrap shrink-0">
                      {formatPeso(sale.totalAmount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
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
