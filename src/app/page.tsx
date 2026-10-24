import type { Metadata } from "next";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { PriceLookupView } from "@/components/lookup/PriceLookupView";

export const metadata: Metadata = {
  title: "Presyo & Scanner | Sari-Sari Store POS",
  description: "Mabilisang barcode scanner at price checker para sa sari-sari store paninda.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        <PriceLookupView />
      </main>
      <BottomNav />
    </div>
  );
}
