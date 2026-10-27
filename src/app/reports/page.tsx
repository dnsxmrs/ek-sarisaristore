import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ReportsView } from "@/components/reports/ReportsView";
import { getStoreAnalytics } from "@/server/actions/analytics";

export const metadata: Metadata = {
  title: "Ulat & Benta | Sari-Sari Store",
  description: "Mabilisang pagsusuri ng benta, kita, at pautang sa tindahan.",
};

async function ReportsPageContent() {
  await connection();
  const analyticsData = await getStoreAnalytics("today");

  return <ReportsView initialData={analyticsData} />;
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs text-slate-500 text-sm">
              Kinakarga ang ulat at datos ng tindahan...
            </div>
          }
        >
          <ReportsPageContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
