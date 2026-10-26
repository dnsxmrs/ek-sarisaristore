import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { SalesListView } from "@/components/sales/SalesListView";
import { getSales, getSalesSummary } from "@/server/actions/sales";
import { searchProducts } from "@/server/actions/products";

export const metadata: Metadata = {
  title: "Mga Benta | Sari-Sari Store",
  description: "Talaan ng mga benta at arawang kita sa sari-sari store.",
};

async function SalesPageContent() {
  await connection();
  const [sales, summary, productsRes] = await Promise.all([
    getSales({ dateFilter: "today", limit: 50 }),
    getSalesSummary(),
    searchProducts({ isActive: true, limit: 100 }),
  ]);

  const catalogProducts = (productsRes.products || []).map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPrice,
    barcode: p.barcode,
  }));

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
      <main className="flex-1 max-w-md w-full mx-auto p-4">
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
