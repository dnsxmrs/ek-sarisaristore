import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { CustomerLedgerView } from "@/components/utang/CustomerLedgerView";
import { getCustomerById } from "@/server/actions/utang";
import { getActiveCatalogProducts } from "@/server/actions/products";

interface CustomerLedgerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  props: CustomerLedgerPageProps
): Promise<Metadata> {
  const { id } = await props.params;
  const customer = await getCustomerById(id);

  if (!customer) {
    return {
      title: "Hindi Nahanap ang Suki | Sari-Sari Store",
    };
  }

  return {
    title: `Utang ni ${customer.name} | Sari-Sari Store`,
  };
}

async function CustomerLedgerContent({ params }: CustomerLedgerPageProps) {
  await connection();
  const { id } = await params;
  const [customer, catalogProducts] = await Promise.all([
    getCustomerById(id),
    getActiveCatalogProducts(),
  ]);

  if (!customer) {
    notFound();
  }

  return <CustomerLedgerView customer={customer} products={catalogProducts} />;
}

export default function CustomerLedgerPage(props: CustomerLedgerPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs text-slate-500 text-sm">
              Kinakarga ang ledger ng suki...
            </div>
          }
        >
          <CustomerLedgerContent params={props.params} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

