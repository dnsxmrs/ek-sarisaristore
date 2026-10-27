"use client";

import { useState, useTransition } from "react";
import {
  TrendingUp,
  Receipt,
  DollarSign,
  Wallet,
  Smartphone,
  Package,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Printer,
  RefreshCw,
  Award,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import {
  StoreAnalyticsData,
  AnalyticsTimeRange,
  getStoreAnalytics,
} from "@/server/actions/analytics";

interface ReportsViewProps {
  initialData: StoreAnalyticsData;
}

export function ReportsView({ initialData }: ReportsViewProps) {
  const [data, setData] = useState<StoreAnalyticsData>(initialData);
  const [selectedRange, setSelectedRange] = useState<AnalyticsTimeRange>(
    initialData.timeRange
  );
  const [isPending, startTransition] = useTransition();

  const handleSelectRange = (range: AnalyticsTimeRange) => {
    setSelectedRange(range);
    startTransition(async () => {
      const updated = await getStoreAnalytics(range);
      setData(updated);
    });
  };

  // Compute payment method percentage
  const totalSales = data.sales.totalRevenue;
  const cashPercent =
    totalSales > 0 ? Math.round((data.sales.cashSales / totalSales) * 100) : 0;
  const gcashPercent = totalSales > 0 ? 100 - cashPercent : 0;

  // Compute highest sales day for 7-day trend normalization
  const maxDaySales = Math.max(
    ...data.dailyTrend.map((d) => d.totalSales),
    1
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-24">
      {/* Top Banner & Range Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
              <TrendingUp className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 leading-tight">
                Ulat ng Negosyo
              </h2>
              <span className="text-[11px] text-slate-500">
                Pagsusuri ng benta at kita
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="I-print o i-save ang ulat"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Time Range Pills */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl">
          {[
            { id: "today", label: "Ngayon" },
            { id: "7days", label: "7 Araw" },
            { id: "30days", label: "30 Araw" },
            { id: "all", label: "Lahat" },
          ].map((tab) => {
            const isActive = selectedRange === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={isPending}
                onClick={() => handleSelectRange(tab.id as AnalyticsTimeRange)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center min-h-[36px] flex items-center justify-center ${
                  isActive
                    ? "bg-white text-teal-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isPending && isActive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />
                ) : (
                  <span>{tab.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Revenue Card */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
          <TrendingUp className="w-40 h-40" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between text-teal-200 text-xs mb-1 font-medium">
            <span>Kabuuang Benta (Gross Sales)</span>
            <span className="bg-teal-950/60 px-2 py-0.5 rounded-full text-[10px] font-mono border border-teal-700/60">
              {data.sales.transactionCount} resibo
            </span>
          </div>

          <div className="text-3xl font-heading font-extrabold tracking-tight mb-3">
            {formatPeso(data.sales.totalRevenue)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-teal-700/60 text-xs">
            <div>
              <span className="text-[11px] text-teal-300 block">Ave. Bawat Customer</span>
              <strong className="font-semibold text-white">
                {formatPeso(data.sales.averageTransactionValue)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-teal-300 block">Siningil sa Utang</span>
              <strong className="font-semibold text-amber-300">
                +{formatPeso(data.utang.collectedInPeriod)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Utang & Collectibles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Collectible Utang Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Pautang (Kolektahin)</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-heading font-bold text-amber-900">
            {formatPeso(data.utang.totalCollectible)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {data.utang.unpaidCount} aktibong pautang
          </span>
        </div>

        {/* Active Catalog Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Paninda sa Tindahan</span>
            <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-heading font-bold text-slate-900">
            {data.inventory.activeProductsCount} produkto
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            sa {data.inventory.categoriesCount} kategorya
          </span>
        </div>
      </div>

      {/* Payment Method Distribution (Cash vs GCash) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
        <h3 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center justify-between">
          <span>Paraan ng Pagbayad</span>
          <span className="text-[11px] font-normal text-slate-500">
            {data.sales.transactionCount} kabuuang transaksyon
          </span>
        </h3>

        {/* Proportional Split Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-3">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-teal-700 transition-all duration-500"
            title={`Cash: ${cashPercent}%`}
          />
          <div
            style={{ width: `${gcashPercent}%` }}
            className="bg-sky-500 transition-all duration-500"
            title={`GCash: ${gcashPercent}%`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-200/80 flex items-center justify-center text-teal-900 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-teal-800 font-medium block">
                Cash ({cashPercent}%)
              </span>
              <strong className="text-teal-950 font-bold">
                {formatPeso(data.sales.cashSales)}
              </strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-200/80 flex items-center justify-center text-sky-900 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-sky-800 font-medium block">
                GCash ({gcashPercent}%)
              </span>
              <strong className="text-sky-950 font-bold">
                {formatPeso(data.sales.gcashSales)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Sales Trend Bar Chart (Zero JS bundle weight, pure CSS/HTML) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Benta sa Nakaraang 7 Araw
            </h3>
            <span className="text-[11px] text-slate-500">
              Araw-araw na takbo ng benta
            </span>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-7 gap-1.5 items-end h-32 pt-4 pb-1 border-b border-slate-100">
          {data.dailyTrend.map((day, idx) => {
            const heightPercent =
              maxDaySales > 0
                ? Math.max(Math.round((day.totalSales / maxDaySales) * 100), 8)
                : 8;
            const isToday = idx === 6;

            return (
              <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                  ₱{day.totalSales >= 1000 ? `${(day.totalSales / 1000).toFixed(1)}k` : day.totalSales}
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? "bg-teal-700 shadow-xs"
                      : "bg-slate-200 hover:bg-teal-500"
                  }`}
                  title={`${day.dateStr} (${day.dayLabel}): ${formatPeso(day.totalSales)}`}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-2 text-center text-[10px] text-slate-500">
          {data.dailyTrend.map((day, idx) => (
            <div key={day.dateStr} className="truncate">
              <span className={`block ${idx === 6 ? "font-bold text-teal-800" : "font-medium"}`}>
                {day.dayLabel}
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">
                {day.dateStr.split(" ")[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Best-Selling Products */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Nangungunang Paninda
            </h3>
            <span className="text-[11px] text-slate-500">
              Pinakamaraming nabili sa piniling panahon
            </span>
          </div>
          <Award className="w-4 h-4 text-amber-500" />
        </div>

        {data.topProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Wala pang naitalang benta sa panahong ito.
          </div>
        ) : (
          <div className="space-y-2">
            {data.topProducts.map((prod, idx) => {
              const rank = idx + 1;
              const medalColors = [
                "bg-amber-400 text-slate-950",
                "bg-slate-300 text-slate-800",
                "bg-amber-700 text-white",
              ];

              return (
                <div
                  key={prod.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        rank <= 3 ? medalColors[rank - 1] : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 truncate">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {prod.quantity} pirasong nabenta
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="text-xs font-heading font-bold text-teal-900 block">
                      {formatPeso(prod.totalRevenue)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
