import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { UtangListView } from "@/components/utang/UtangListView";
import { getCustomers, getUtangSummaryStats } from "@/server/actions/utang";

export const metadata: Metadata = {
  title: "Utang Ledger | Sari-Sari Store",
  description: "Mabilisang listahan ng pautang at patunay na litrato para sa suki.",
};

async function UtangPageContent() {
  const [customers, summary] = await Promise.all([
    getCustomers(),
    getUtangSummaryStats(),
  ]);

  return <UtangListView initialCustomers={customers} initialSummary={summary} />;
}

export default function UtangPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
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
