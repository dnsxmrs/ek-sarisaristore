"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Edit2, Power, Layers, Barcode, AlertCircle, RefreshCw } from "lucide-react";
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
  initialTotalCount?: number;
  initialHasMore?: boolean;
  categories: Category[];
}

export function ProductListView({
  initialProducts,
  initialTotalCount,
  initialHasMore,
  categories,
}: ProductListViewProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount ?? initialProducts.length);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore ?? false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Trigger search from offset 0
  const handleSearch = (queryText: string, catId: string, inactive: boolean) => {
    startTransition(async () => {
      const res = await searchProducts({
        query: queryText,
        categoryId: catId === "ALL" ? undefined : catId,
        isActive: inactive ? undefined : true,
        limit: 12,
        offset: 0,
      });

      if (res.success && res.products) {
        setProducts(res.products as ProductItem[]);
        setHasMore(res.hasMore ?? false);
        if (typeof res.totalCount === "number") {
          setTotalCount(res.totalCount);
        }
      }
    });
  };

  // Progressive streaming fetch when user scrolls down (Facebook / infinite scroll style)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const res = await searchProducts({
        query: searchQuery,
        categoryId: selectedCategory === "ALL" ? undefined : selectedCategory,
        isActive: showInactive ? undefined : true,
        limit: 12,
        offset: products.length,
      });

      if (res.success && res.products) {
        setProducts((prev) => [...prev, ...(res.products as ProductItem[])]);
        setHasMore(res.hasMore ?? false);
        if (typeof res.totalCount === "number") {
          setTotalCount(res.totalCount);
        }
      }
    } catch (err) {
      console.error("Error streaming more products:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, searchQuery, selectedCategory, showInactive, products.length]);

  // IntersectionObserver to detect when user reaches within 250px of the bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isPending) {
          loadMore();
        }
      },
      { rootMargin: "250px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isPending]);

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
    <div className="w-full max-w-md md:max-w-none mx-auto pb-24 md:pb-12">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Tindahan (Catalog)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {products.length < totalCount
              ? `Ipinapakita: ${products.length} sa ${totalCount} produkto`
              : `${totalCount} ${totalCount === 1 ? "produkto" : "mga produkto"}`}
          </p>
        </div>
        <Link
          href="/products/new"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-colors shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="whitespace-nowrap">Magdagdag ng Produkto</span>
        </Link>
      </div>

      {/* Search Input & Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Maghanap sa pangalan o barcode..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 shrink-0 whitespace-nowrap">
            <span className="whitespace-nowrap">Isama ang naka-deactivate</span>
            <button
              type="button"
              onClick={onToggleShowInactive}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
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
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => onCategoryChange("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-teal-800 text-white font-semibold shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            Lahat
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-teal-800 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
        {products.length === 0 && !isPending ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
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
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl min-h-[44px] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Magrehistro ng Produkto</span>
            </Link>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className={`group bg-white rounded-xl border p-3.5 sm:p-4 transition-all duration-150 shadow-2xs hover:shadow-sm hover:border-teal-400/80 flex flex-col justify-between relative ${
                product.isActive
                  ? "border-slate-200/90"
                  : "border-slate-200 bg-slate-50/70 opacity-80"
              }`}
            >
              {/* Product Information */}
              <div>
                {/* Category & Status Bar */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    title={product.category?.name}
                    className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded truncate max-w-[140px]"
                  >
                    {product.category?.name || "Pangkalahatan"}
                  </span>

                  {!product.isActive && (
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 px-1.5 py-0.5 rounded inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span className="whitespace-nowrap">Deactivated</span>
                    </span>
                  )}
                </div>

                {/* Product Name: clamped to 2 lines with consistent compact min-height */}
                <h3
                  title={product.name}
                  className="font-heading font-semibold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.4rem] break-words"
                >
                  {product.name}
                </h3>

                {/* Barcode: grouped right below product name */}
                <div className="mt-1 min-h-[18px] flex items-center">
                  {product.barcode ? (
                    <p className="text-[11px] font-mono text-slate-500 truncate flex items-center gap-1 max-w-full">
                      <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate whitespace-nowrap">{product.barcode}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic whitespace-nowrap">
                      Walang barcode
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Footer: Price on Left, Compact Actions on Right */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {/* Price Display */}
                <span className="text-base sm:text-lg font-bold font-heading text-amber-700 whitespace-nowrap shrink-0">
                  {formatPeso(product.sellingPrice)}
                </span>

                {/* Action Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 border border-slate-200/70"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">I-edit</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(product.id, product.isActive, product.name)}
                    disabled={isPending}
                    className={`inline-flex items-center justify-center p-1 rounded-md transition-colors whitespace-nowrap shrink-0 border ${
                      product.isActive
                        ? "text-slate-400 hover:text-red-700 hover:bg-red-50 border-slate-200 hover:border-red-200"
                        : "text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200 font-semibold"
                    }`}
                    title={product.isActive ? "I-deactivate" : "I-activate"}
                  >
                    <Power className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Infinite Scroll Sentinel & Stream Loader (Facebook-style) */}
        {hasMore && (
          <div ref={sentinelRef} className="col-span-full py-6 flex flex-col items-center justify-center">
            {isLoadingMore ? (
              <div className="w-full flex flex-col items-center gap-2">
                {/* Skeleton placeholders */}
                <div className="w-full bg-slate-200/60 rounded-xl h-20 animate-pulse border border-slate-300/40" />
                <div className="flex items-center gap-2 text-xs text-teal-800 font-medium py-1 whitespace-nowrap">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                  <span className="whitespace-nowrap">Kinakarga ang susunod na mga produkto...</span>
                </div>
              </div>
            ) : (
              <div className="h-6" />
            )}
          </div>
        )}

        {/* End of Catalog Banner */}
        {!hasMore && products.length > 0 && (
          <div className="col-span-full text-center py-6 text-xs text-slate-400 border-t border-slate-200/80 mt-4">
            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[11px] font-medium border border-slate-200">
              ✓ Nakarating ka na sa dulo ng katalogo ({products.length} produkto)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
