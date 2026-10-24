import { Suspense } from "react";
import { getCategories, searchProducts } from "@/server/actions/products";
import { ProductListView } from "@/components/products/ProductListView";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";

async function ProductsListContent() {
  const [categories, productsRes] = await Promise.all([
    getCategories(),
    searchProducts({ isActive: true }),
  ]);

  return (
    <ProductListView
      initialProducts={productsRes.products || []}
      categories={categories}
    />
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm text-slate-500 text-sm">
              Kinakarga ang mga produkto...
            </div>
          }
        >
          <ProductsListContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
