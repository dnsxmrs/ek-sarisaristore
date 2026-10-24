"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, PackageSearch, PlusCircle } from "lucide-react";

function BottomNavContent() {
  const pathname = usePathname();

  const isLookup = pathname === "/";
  const isProducts = pathname === "/products" || (pathname.startsWith("/products/") && !pathname.includes("/new"));
  const isNew = pathname === "/products/new";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
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
          href="/products/new"
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            isNew
              ? "text-teal-700 font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <div className={`p-1 rounded-full ${isNew ? "bg-teal-50" : ""}`}>
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 font-heading">Magdagdag</span>
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
          <div className="max-w-md mx-auto grid grid-cols-3 h-16" />
        </nav>
      }
    >
      <BottomNavContent />
    </Suspense>
  );
}
