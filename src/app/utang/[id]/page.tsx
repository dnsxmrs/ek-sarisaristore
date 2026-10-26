import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { CustomerLedgerView } from "@/components/utang/CustomerLedgerView";
import { getCustomerById } from "@/server/actions/utang";

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
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  return <CustomerLedgerView customer={customer} />;
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

