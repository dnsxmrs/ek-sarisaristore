import { Suspense } from "react";
import { getCategories } from "@/server/actions/products";
import { ProductForm } from "@/components/products/ProductForm";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";

interface NewProductPageProps {
  searchParams: Promise<{ barcode?: string }>;
}

async function NewProductContent({ searchParams }: NewProductPageProps) {
  const params = await searchParams;
  const categories = await getCategories();

  return (
    <ProductForm
      mode="create"
      categories={categories}
      defaultBarcode={params.barcode}
    />
  );
}

export default function NewProductPage(props: NewProductPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm text-slate-500 text-sm">
              Kinakarga ang form...
            </div>
          }
        >
          <NewProductContent {...props} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
