"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Plus, Edit2, Power, Layers, Barcode, AlertCircle } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { toggleProductStatus, searchProducts } from "@/server/actions/products";

interface Category {
  id: string;
  name: string;
}

interface ProductItem {
  id: string;
  name: string;
  barcode: string | null;
  sellingPrice: number;
  categoryId: string | null;
  description: string | null;
  isActive: boolean;
  category?: Category | null;
}

interface ProductListViewProps {
  initialProducts: ProductItem[];
  categories: Category[];
}

export function ProductListView({
  initialProducts,
  categories,
}: ProductListViewProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger search
  const handleSearch = (queryText: string, catId: string, inactive: boolean) => {
    startTransition(async () => {
      const res = await searchProducts({
        query: queryText,
        categoryId: catId === "ALL" ? undefined : catId,
        isActive: inactive ? undefined : true,
      });

      if (res.success && res.products) {
        setProducts(res.products as ProductItem[]);
      }
    });
  };

  const onQueryChange = (val: string) => {
    setSearchQuery(val);
    handleSearch(val, selectedCategory, showInactive);
  };

  const onCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    handleSearch(searchQuery, catId, showInactive);
  };

  const onToggleShowInactive = () => {
    const nextVal = !showInactive;
    setShowInactive(nextVal);
    handleSearch(searchQuery, selectedCategory, nextVal);
  };

  const handleToggleStatus = (id: string, currentActive: boolean, productName: string) => {
    const nextActive = !currentActive;
    const confirmMsg = nextActive
      ? `Ibalik sa aktibo ang '${productName}'?`
      : `I-deactivate ang '${productName}'? Hindi ito lalabas sa regular na search o price lookup.`;

    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await toggleProductStatus(id, nextActive);
      if (res.success) {
        setToastMessage(
          nextActive
            ? `Naibalik sa aktibo ang '${productName}'!`
            : `Na-deactivate ang '${productName}'!`
        );
        setTimeout(() => setToastMessage(null), 3000);

        // Update local state
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: nextActive } : p))
        );
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-40 max-w-md mx-auto bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900">
            Tindahan (Catalog)
          </h1>
          <p className="text-xs text-slate-500">
            {products.length} {products.length === 1 ? "produkto" : "mga produkto"}
          </p>
        </div>
        <Link
          href="/products/new"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 min-h-[44px] shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Magdagdag</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Maghanap sa pangalan o barcode..."
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 min-h-[44px] shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => onCategoryChange("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
            selectedCategory === "ALL"
              ? "bg-teal-800 text-white font-semibold"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Lahat ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              selectedCategory === cat.id
                ? "bg-teal-800 text-white font-semibold"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Include Inactive Switch */}
      <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-500">
        <span>Isama ang mga naka-deactivate</span>
        <button
          type="button"
          onClick={onToggleShowInactive}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            showInactive ? "bg-teal-700" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              showInactive ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-slate-800 text-base mb-1">
              Walang nahanap na produkto
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
              {searchQuery
                ? `Walang tumutugma sa '${searchQuery}'. Subukan ang ibang baybay o magrehistro ng bago.`
                : "Wala pang nakatalang produkto sa kategoryang ito."}
            </p>
            <Link
              href={searchQuery ? `/products/new?name=${encodeURIComponent(searchQuery)}` : "/products/new"}
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl min-h-[44px] transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Magrehistro ng Produkto</span>
            </Link>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl border p-3.5 transition-all shadow-sm flex flex-col justify-between ${
                product.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/70 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {product.category && (
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {product.category.name}
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Deactivated
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  {product.barcode ? (
                    <p className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      <span>{product.barcode}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 italic">Walang barcode</p>
                  )}
                </div>

                {/* Price Display */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold font-heading text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block">
                    {formatPeso(product.sellingPrice)}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg min-h-[38px] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>I-edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(product.id, product.isActive, product.name)}
                  disabled={isPending}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg min-h-[38px] transition-colors ${
                    product.isActive
                      ? "text-red-700 hover:bg-red-50 hover:text-red-800"
                      : "text-teal-700 hover:bg-teal-50 hover:text-teal-800 font-semibold"
                  }`}
                  title={product.isActive ? "I-deactivate" : "I-activate"}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{product.isActive ? "I-deactivate" : "I-activate"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
