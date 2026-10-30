import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { UtangListView } from "@/components/utang/UtangListView";
import { getCustomers, getUtangSummaryStats } from "@/server/actions/utang";
import { getActiveCatalogProducts } from "@/server/actions/products";

export const metadata: Metadata = {
  title: "Utang Ledger | Sari-Sari Store",
  description: "Mabilisang listahan ng pautang at patunay na litrato para sa suki.",
};

async function UtangPageContent() {
  await connection();
  const [customers, summary, catalogProducts] = await Promise.all([
    getCustomers(),
    getUtangSummaryStats(),
    getActiveCatalogProducts(),
  ]);

  return (
    <UtangListView
      initialCustomers={customers}
      initialSummary={summary}
      products={catalogProducts}
    />
  );
}

export default function UtangPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-md md:max-w-6xl lg:max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs text-slate-500 text-sm">
              Kinakarga ang Utang Ledger...
            </div>
          }
        >
          <UtangPageContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
