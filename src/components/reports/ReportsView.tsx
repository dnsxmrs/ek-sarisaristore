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
    <div className="w-full max-w-md md:max-w-none mx-auto space-y-4 md:space-y-5 pb-24 md:pb-12 animate-fade-in">
      {/* Top Banner & Range Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800 shrink-0">
            <TrendingUp className="w-5 h-5 font-bold shrink-0" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 leading-tight">
              Ulat ng Negosyo (Store Analytics)
            </h1>
            <span className="text-xs text-slate-500">
              Pagsusuri ng benta, kita, at takbo ng paninda
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
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
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-center min-h-[34px] flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-white text-teal-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isPending && isActive ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700 shrink-0" />
                  ) : (
                    <span className="whitespace-nowrap">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer border border-slate-200/60"
            title="I-print o i-save ang ulat"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">I-print</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards Row (Desktop 3 cols / Mobile Stack) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Card 1: Main Revenue Card */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <TrendingUp className="w-36 h-36" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between text-teal-200 text-xs mb-1 font-medium">
              <span className="whitespace-nowrap">Kabuuang Benta (Gross Sales)</span>
              <span className="bg-teal-950/60 px-2 py-0.5 rounded-full text-[10px] font-mono border border-teal-700/60 whitespace-nowrap shrink-0">
                {data.sales.transactionCount} resibo
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight mb-3 whitespace-nowrap">
              {formatPeso(data.sales.totalRevenue)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-teal-700/60 text-xs">
              <div>
                <span className="text-[11px] text-teal-300 block whitespace-nowrap">Ave. Bawat Customer</span>
                <strong className="font-semibold text-white whitespace-nowrap">
                  {formatPeso(data.sales.averageTransactionValue)}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-teal-300 block whitespace-nowrap">Siningil sa Utang</span>
                <strong className="font-semibold text-amber-300 whitespace-nowrap">
                  +{formatPeso(data.utang.collectedInPeriod)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Collectible Utang Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                Pautang (Kolektahin)
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <Wallet className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-900 my-1 whitespace-nowrap">
              {formatPeso(data.utang.totalCollectible)}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="whitespace-nowrap">{data.utang.unpaidCount} aktibong pautang</span>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 whitespace-nowrap shrink-0">
              Kailangan kolektahin
            </span>
          </div>
        </div>

        {/* Card 3: Active Paninda Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                Paninda sa Tindahan
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800 shrink-0">
                <Package className="w-4 h-4 shrink-0" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 my-1 whitespace-nowrap">
              {data.inventory.activeProductsCount} <span className="text-base font-normal text-slate-400">produkto</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="whitespace-nowrap">sa {data.inventory.categoriesCount} kategorya</span>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 whitespace-nowrap shrink-0">
              Aktibong katalogo
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: 7-Day Chart & Payment Split (Grid 12 cols on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* 7-Day Sales Trend Bar Chart (Spans 7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Benta sa Nakaraang 7 Araw
              </h3>
              <span className="text-xs text-slate-500">
                Araw-araw na takbo ng kita sa tindahan
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Calendar className="w-4 h-4 shrink-0" />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 pb-2 border-b border-slate-100">
            {data.dailyTrend.map((day, idx) => {
              const heightPercent =
                maxDaySales > 0
                  ? Math.max(Math.round((day.totalSales / maxDaySales) * 100), 8)
                  : 8;
              const isToday = idx === 6;

              return (
                <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 whitespace-nowrap">
                    ₱{day.totalSales >= 1000 ? `${(day.totalSales / 1000).toFixed(1)}k` : day.totalSales}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
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

          <div className="grid grid-cols-7 gap-2 pt-2 text-center text-xs text-slate-600">
            {data.dailyTrend.map((day, idx) => (
              <div key={day.dateStr} className="truncate">
                <span className={`block ${idx === 6 ? "font-bold text-teal-800" : "font-medium"}`}>
                  {day.dayLabel}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {day.dateStr.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Distribution (Spans 5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center justify-between">
              <span>Paraan ng Pagbayad</span>
              <span className="text-xs font-normal text-slate-500 whitespace-nowrap">
                {data.sales.transactionCount} transaksyon
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Paghahambing ng Cash vs GCash payments
            </p>

            {/* Proportional Split Bar */}
            <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex mb-4 shadow-inner">
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
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-200/80 flex items-center justify-center text-teal-900 shrink-0">
                  <DollarSign className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <span className="text-xs text-teal-800 font-semibold block whitespace-nowrap">
                    Cash ({cashPercent}%)
                  </span>
                  <span className="text-[10px] text-teal-700/80">Pisikal na bayad</span>
                </div>
              </div>
              <strong className="text-sm font-bold font-mono text-teal-950 whitespace-nowrap">
                {formatPeso(data.sales.cashSales)}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-200/80 flex items-center justify-center text-sky-900 shrink-0">
                  <Smartphone className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <span className="text-xs text-sky-800 font-semibold block whitespace-nowrap">
                    GCash ({gcashPercent}%)
                  </span>
                  <span className="text-[10px] text-sky-700/80">Digital e-wallet</span>
                </div>
              </div>
              <strong className="text-sm font-bold font-mono text-sky-950 whitespace-nowrap">
                {formatPeso(data.sales.gcashSales)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Best-Selling Products */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
              Nangungunang Paninda (Best-Selling Products)
            </h3>
            <span className="text-xs text-slate-500">
              Pinakamaraming nabili sa piniling panahon
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <Award className="w-4 h-4 shrink-0" />
          </div>
        </div>

        {data.topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Wala pang naitalang benta sa panahong ito.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.topProducts.map((prod, idx) => {
              const rank = idx + 1;
              const medalColors = [
                "bg-amber-400 text-slate-950 font-black",
                "bg-slate-300 text-slate-800 font-black",
                "bg-amber-700 text-white font-black",
              ];

              return (
                <div
                  key={prod.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/60 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        rank <= 3 ? medalColors[rank - 1] : "bg-slate-200 text-slate-600 font-bold"
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 truncate" title={prod.name}>
                        {prod.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {prod.quantity} pirasong nabenta
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="text-xs sm:text-sm font-heading font-bold text-teal-900 block whitespace-nowrap">
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
