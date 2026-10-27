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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isLookup
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isLookup ? "bg-teal-50" : ""}`}>
            <ScanLine className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Presyo</span>
        </Link>

        <Link
          href="/products"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isProducts
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isProducts ? "bg-teal-50" : ""}`}>
            <PackageSearch className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Tindahan</span>
        </Link>

        <Link
          href="/sales"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isSales
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isSales ? "bg-teal-50" : ""}`}>
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Benta</span>
        </Link>

        <Link
          href="/utang"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isUtang
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isUtang ? "bg-teal-50" : ""}`}>
            <NotebookPen className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Utang</span>
        </Link>

        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isReports
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isReports ? "bg-teal-50" : ""}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Ulat</span>
        </Link>
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense
      fallback={
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-5 h-16" />
        </nav>
      }
    >
      <BottomNavContent />
    </Suspense>
  );
}
