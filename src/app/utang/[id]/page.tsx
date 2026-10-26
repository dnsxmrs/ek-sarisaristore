import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { CustomerLedgerView } from "@/components/utang/CustomerLedgerView";
import { getCustomerById } from "@/server/actions/utang";
import { searchProducts } from "@/server/actions/products";

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
  const [customer, productsRes] = await Promise.all([
    getCustomerById(id),
    searchProducts({ isActive: true, limit: 100 }),
  ]);

  if (!customer) {
    notFound();
  }

  const catalogProducts = (productsRes.products || []).map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPrice,
    barcode: p.barcode,
  }));

  return <CustomerLedgerView customer={customer} products={catalogProducts} />;
}

export default function CustomerLedgerPage(props: CustomerLedgerPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
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

