"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, PackageSearch, Receipt, NotebookPen, TrendingUp } from "lucide-react";

function BottomNavContent() {
  const pathname = usePathname();

  const isLookup = pathname === "/";
  const isProducts = pathname === "/products" || (pathname.startsWith("/products/") && !pathname.includes("/new"));
  const isSales = pathname === "/sales" || pathname.startsWith("/sales");
  const isUtang = pathname === "/utang" || pathname.startsWith("/utang");
  const isReports = pathname === "/reports" || pathname.startsWith("/reports") || pathname === "/dashboard";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors whitespace-nowrap ${
            isLookup
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full shrink-0 ${isLookup ? "bg-teal-50" : ""}`}>
            <ScanLine className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading whitespace-nowrap">Presyo</span>
        </Link>

        <Link
          href="/products"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors whitespace-nowrap ${
            isProducts
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full shrink-0 ${isProducts ? "bg-teal-50" : ""}`}>
            <PackageSearch className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading whitespace-nowrap">Tindahan</span>
        </Link>

        <Link
          href="/sales"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors whitespace-nowrap ${
            isSales
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full shrink-0 ${isSales ? "bg-teal-50" : ""}`}>
            <Receipt className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading whitespace-nowrap">Benta</span>
        </Link>

        <Link
          href="/utang"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors whitespace-nowrap ${
            isUtang
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full shrink-0 ${isUtang ? "bg-teal-50" : ""}`}>
            <NotebookPen className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading whitespace-nowrap">Utang</span>
        </Link>

        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors whitespace-nowrap ${
            isReports
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full shrink-0 ${isReports ? "bg-teal-50" : ""}`}>
            <TrendingUp className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading whitespace-nowrap">Ulat</span>
        </Link>
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense
      fallback={
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-5 h-16" />
        </nav>
      }
    >
      <BottomNavContent />
    </Suspense>
  );
}
