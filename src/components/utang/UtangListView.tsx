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
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* ======================================================== */}
      {/* MINIMALIST SUMMARY BANNER */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium tracking-wide uppercase text-teal-300">
              Kabuuang Pautang
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5">
              {formatPeso(initialSummary.totalOutstanding)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">May Utang</span>
            <span className="text-sm font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-block mt-0.5">
              {initialSummary.activeDebtorsCount} suki
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsNewDebtOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>Maglista ng Utang</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewCustomerOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-400" />
            <span>Bagong Suki</span>
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
            placeholder="Hanapin ang suki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
          />
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilterTab("withDebt")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === "withDebt"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            May Utang ({initialSummary.activeDebtorsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === "all"
                ? "bg-teal-800 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Lahat ng Suki ({initialCustomers.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CUSTOMER UTANG LIST */}
      {/* ======================================================== */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-800 mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
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
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Magdagdag ng Suki</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const hasDebt = c.totalBalance > 0;
            return (
              <Link
                key={c.id}
                href={`/utang/${c.id}`}
                className="block bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500 p-3.5 shadow-2xs hover:shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Customer Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-semibold text-sm text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                        {c.name}
                      </span>
                      {c.nickname && (
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          ({c.nickname})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </span>
                      )}
                      {c.hasRecentPhoto && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md font-medium">
                          <Camera className="w-3 h-3" />
                          <span>Litrato</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Balance & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span
                        className={`font-mono text-sm font-bold block ${
                          hasDebt ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatPeso(c.totalBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {hasDebt
                          ? `${c.unpaidCount} lista`
                          : "Walang utang"}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
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
