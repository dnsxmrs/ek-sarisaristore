import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategories, getProductById } from "@/server/actions/products";
import { ProductForm } from "@/components/products/ProductForm";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function EditProductContent({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      mode="edit"
      categories={categories}
      initialData={product}
    />
  );
}

export default function EditProductPage(props: EditProductPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm text-slate-500 text-sm">
              Kinakarga ang detalye ng produkto...
            </div>
          }
        >
          <EditProductContent {...props} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
