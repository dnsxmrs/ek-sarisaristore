"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  UserPlus,
  Camera,
  ChevronRight,
  BookOpen,
  Phone,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { NewDebtModal, type ProductCatalogItem } from "./NewDebtModal";
import { NewCustomerModal } from "./NewCustomerModal";

export interface CustomerSummaryItem {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  totalBalance: number;
  unpaidCount: number;
  hasRecentPhoto: boolean;
  lastDebtDate: Date | null;
  createdAt: Date;
}

interface UtangListViewProps {
  initialCustomers: CustomerSummaryItem[];
  initialSummary: {
    totalOutstanding: number;
    activeDebtorsCount: number;
  };
  products?: ProductCatalogItem[];
}

export function UtangListView({
  initialCustomers,
  initialSummary,
  products = [],
}: UtangListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"withDebt" | "all">("withDebt");

  // Modals
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialCustomers.filter((c) => {
      // Tab filter
      if (filterTab === "withDebt" && c.totalBalance <= 0) {
        return false;
      }
      // Search filter
      if (!q) return true;
      const matchName = c.name.toLowerCase().includes(q);
      const matchNickname = c.nickname?.toLowerCase().includes(q) || false;
      const matchPhone = c.phone?.includes(q) || false;
      return matchName || matchNickname || matchPhone;
    });
  }, [initialCustomers, searchQuery, filterTab]);

  return (
    <div className="w-full max-w-md md:max-w-none mx-auto pb-24 md:pb-12 animate-fade-in">
      {/* Top Header on Desktop */}
      <div className="hidden md:flex md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Talaan ng Utang (Customer Ledger)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mabilisang listahan ng pautang, patunay na litrato, at bayad ng mga suki
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewCustomerOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 min-h-[44px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="whitespace-nowrap">Bagong Suki</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewDebtOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="whitespace-nowrap">Maglista ng Utang</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* METRIC CARDS: DESKTOP (Grid of 3) vs MOBILE (Compact Dark Banner) */}
      {/* ======================================================== */}
      {/* Mobile Banner (< md) */}
      <div className="md:hidden bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium tracking-wide uppercase text-teal-300 whitespace-nowrap shrink-0">
              Kabuuang Pautang
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5 whitespace-nowrap">
              {formatPeso(initialSummary.totalOutstanding)}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 block whitespace-nowrap">May Utang</span>
            <span className="text-sm font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-block mt-0.5 whitespace-nowrap">
              {initialSummary.activeDebtorsCount} suki
            </span>
          </div>
        </div>

        {/* Action Buttons on Mobile */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsNewDebtOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 font-bold shrink-0" />
            <span className="whitespace-nowrap">Maglista ng Utang</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewCustomerOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Bagong Suki</span>
          </button>
        </div>
      </div>

      {/* Desktop KPI Cards Grid (>= md) */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Kabuuang Pautang */}
        <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-teal-300 whitespace-nowrap shrink-0">
              Kabuuang Pautang
            </span>
            <span className="text-xs font-bold text-rose-300 bg-rose-400/10 px-2.5 py-0.5 rounded-full border border-rose-400/20 whitespace-nowrap shrink-0">
              Kolektahin
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-amber-300 my-2.5 whitespace-nowrap">
            {formatPeso(initialSummary.totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="whitespace-nowrap">Kabuuan ng lahat ng aktibong utang</span>
          </div>
        </div>

        {/* Card 2: Mga May Utang */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 whitespace-nowrap shrink-0">
              Aktibong May Utang
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 whitespace-nowrap shrink-0">
              {initialSummary.activeDebtorsCount} suki
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 my-2.5 whitespace-nowrap">
            {initialSummary.activeDebtorsCount} <span className="text-base font-normal text-slate-400">indibidwal</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <UserPlus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="whitespace-nowrap">
              {initialCustomers.length > 0
                ? `${Math.round((initialSummary.activeDebtorsCount / initialCustomers.length) * 100)}% ng mga suki`
                : "Walang tala"}
            </span>
          </div>
        </div>

        {/* Card 3: Lahat ng Suki */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 whitespace-nowrap shrink-0">
              Nakatalang mga Suki
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              Kabuuan
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 my-2.5 whitespace-nowrap">
            {initialCustomers.length} <span className="text-base font-normal text-slate-400">rehistrado</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5 whitespace-nowrap">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">Profile ng mga suki sa ledger</span>
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
            placeholder="Hanapin ang suki gamit ang pangalan o palayaw..."
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
            onClick={() => setFilterTab("withDebt")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] shrink-0 cursor-pointer ${
              filterTab === "withDebt"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            May Utang ({initialSummary.activeDebtorsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] shrink-0 cursor-pointer ${
              filterTab === "all"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Lahat ng Suki ({initialCustomers.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CUSTOMER UTANG GRID */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-800 mx-auto mb-3">
              <BookOpen className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-800 mb-1">
              {searchQuery
                ? "Walang nahanap na suki"
                : filterTab === "withDebt"
                ? "Walang may utang ngayon!"
                : "Wala pang nakatalang suki"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
              {searchQuery
                ? "Pakisuri ang baybay ng pangalan o palayaw."
                : "Maaari kang maglista ng bagong utang o magdagdag ng bagong suki."}
            </p>
            <button
              type="button"
              onClick={() => setIsNewCustomerOpen(true)}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Magdagdag ng Suki</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const hasDebt = c.totalBalance > 0;
            return (
              <Link
                key={c.id}
                href={`/utang/${c.id}`}
                className="block bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between min-h-[115px]"
              >
                <div>
                  {/* Top: Customer Name & Nickname */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-heading font-semibold text-sm sm:text-base text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                        {c.name}
                      </span>
                      {c.nickname && (
                        <span className="text-xs text-slate-500 font-medium truncate shrink-0">
                          ({c.nickname})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Phone and Photo proof badge */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    {c.phone ? (
                      <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="whitespace-nowrap">{c.phone}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Walang telepono</span>
                    )}
                    {c.hasRecentPhoto && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md font-medium border border-teal-200/60 whitespace-nowrap shrink-0">
                        <Camera className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">Litrato</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Balance & Arrow */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap shrink-0 ${
                        hasDebt
                          ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      }`}
                    >
                      {hasDebt ? `${c.unpaidCount} lista` : "Bayad"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-sm sm:text-base font-bold font-heading whitespace-nowrap ${
                        hasDebt ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {formatPeso(c.totalBalance)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <NewDebtModal
        isOpen={isNewDebtOpen}
        onClose={() => setIsNewDebtOpen(false)}
        customers={initialCustomers.map((c) => ({
          id: c.id,
          name: c.name,
          nickname: c.nickname,
        }))}
        products={products}
        onOpenNewCustomerModal={() => {
          setIsNewDebtOpen(false);
          setIsNewCustomerOpen(true);
        }}
      />

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onCustomerCreated={() => {
          setIsNewDebtOpen(true);
        }}
      />
    </div>
  );
}
