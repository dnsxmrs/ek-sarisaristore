import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SalesListView } from "@/components/sales/SalesListView";
import { getSales, getSalesSummary } from "@/server/actions/sales";
import { getActiveCatalogProducts } from "@/server/actions/products";

export const metadata: Metadata = {
  title: "Mga Benta | Sari-Sari Store",
  description: "Talaan ng mga benta at arawang kita sa sari-sari store.",
};

async function SalesPageContent() {
  await connection();
  const [sales, summary, catalogProducts] = await Promise.all([
    getSales({ dateFilter: "today", limit: 50 }),
    getSalesSummary(),
    getActiveCatalogProducts(),
  ]);

  return (
    <SalesListView
      initialSales={sales}
      initialSummary={summary}
      products={catalogProducts}
    />
  );
}

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-md md:max-w-6xl lg:max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs text-slate-500 text-sm">
              Kinakarga ang talaan ng benta...
            </div>
          }
        >
          <SalesPageContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
