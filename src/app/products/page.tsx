import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, searchProducts } from "@/server/actions/products";
import { ProductListView } from "@/components/products/ProductListView";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";

export const metadata: Metadata = {
  title: "Tindahan & Katalogo | Sari-Sari Store POS",
  description: "Listahan at imbentaryo ng mga paninda sa sari-sari store.",
};

async function ProductsListContent() {
  const [categories, productsRes] = await Promise.all([
    getCategories(),
    searchProducts({ isActive: true, limit: 12, offset: 0 }),
  ]);

  return (
    <ProductListView
      initialProducts={productsRes.products || []}
      initialTotalCount={productsRes.totalCount ?? 0}
      initialHasMore={productsRes.hasMore ?? false}
      categories={categories}
    />
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-md md:max-w-6xl lg:max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
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
