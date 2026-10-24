"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { Camera, Search, PlusCircle, AlertCircle, Edit3, RefreshCw, Barcode, CheckCircle2, ArrowRight } from "lucide-react";
import { formatPeso } from "@/lib/money";
import { InlineCameraScanner } from "@/components/scanner/InlineCameraScanner";
import { getProductByBarcode, searchProducts } from "@/server/actions/products";

interface ProductData {
  id: string;
  name: string;
  barcode: string | null;
  sellingPrice: number;
  categoryId: string | null;
  description: string | null;
  isActive: boolean;
  category?: { id: string; name: string } | null;
}

export function PriceLookupView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Result states
  const [foundProduct, setFoundProduct] = useState<ProductData | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [nameSearchResults, setNameSearchResults] = useState<ProductData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Handle barcode lookup
  const handleBarcodeLookup = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearchTerm(trimmed);
    setHasSearched(true);

    startTransition(async () => {
      const res = await getProductByBarcode(trimmed);

      if (res.success && res.product) {
        setFoundProduct(res.product as ProductData);
        setNotFoundBarcode(null);
        setNameSearchResults([]);
      } else if (res.notFound) {
        setNotFoundBarcode(res.barcode || trimmed);
        setFoundProduct(null);
        setNameSearchResults([]);
      } else {
        // If exact barcode didn't match, attempt name search as fallback
        const nameRes = await searchProducts({ query: trimmed, isActive: true, limit: 10 });
        if (nameRes.success && nameRes.products.length > 0) {
          setNameSearchResults(nameRes.products as ProductData[]);
          setFoundProduct(null);
          setNotFoundBarcode(null);
        } else {
          setNotFoundBarcode(trimmed);
          setFoundProduct(null);
          setNameSearchResults([]);
        }
      }
    });
  }, []);

  // Global Hardware Barcode Scanner Listener (USB / Bluetooth Scanner Gun)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.trim().length >= 3) {
          e.preventDefault();
          handleBarcodeLookup(buffer.trim());
        }
        buffer = "";
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 120) {
          buffer = "";
        }
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeLookup]);

  // Form submit for typing barcode or name
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    // If query looks like numeric barcode, try exact barcode lookup first
    if (/^\d{4,}$/.test(query)) {
      handleBarcodeLookup(query);
    } else {
      // General search by name
      setFoundProduct(null);
      setNotFoundBarcode(null);
      setNameSearchResults([]);
      setHasSearched(true);

      startTransition(async () => {
        // First try exact barcode in case it has letters
        const barcodeRes = await getProductByBarcode(query);
        if (barcodeRes.success && barcodeRes.product) {
          setFoundProduct(barcodeRes.product as ProductData);
          return;
        }

        // Then name search
        const nameRes = await searchProducts({ query, isActive: true });
        if (nameRes.success && nameRes.products.length > 0) {
          if (nameRes.products.length === 1 && nameRes.products[0].name.toLowerCase() === query.toLowerCase()) {
            setFoundProduct(nameRes.products[0] as ProductData);
          } else {
            setNameSearchResults(nameRes.products as ProductData[]);
          }
        } else {
          setNotFoundBarcode(null);
        }
      });
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setFoundProduct(null);
    setNotFoundBarcode(null);
    setNameSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24">
      {/* Inline Camera Barcode Scanner Screen with ON/OFF Toggle */}
      <div id="camera-scanner-screen" className="mb-4">
        <InlineCameraScanner
          isCameraOn={isCameraOn}
          onToggleCamera={setIsCameraOn}
          onScan={handleBarcodeLookup}
          lastScannedCode={searchTerm || null}
        />
      </div>

      {/* Manual Search Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm mb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="I-type ang barcode o pangalan..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!searchTerm.trim() || isPending}
            className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm px-4 rounded-xl min-h-[44px] shrink-0 transition-colors"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Hanapin"}
          </button>
        </form>
      </div>

      {/* Result: EXACT PRODUCT FOUND */}
      {foundProduct && (
        <div className="bg-white rounded-2xl border-2 border-teal-600/30 shadow-md overflow-hidden mb-4 animate-fade-in">
          {/* Card Header */}
          <div className="bg-teal-900 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Nahanap na Produkto</span>
            </div>
            {foundProduct.category && (
              <span className="text-[11px] bg-teal-800 px-2 py-0.5 rounded-full text-teal-100 border border-teal-700">
                {foundProduct.category.name}
              </span>
            )}
          </div>

          <div className="p-5 text-center">
            {/* Product Name */}
            <h2 className="text-xl font-heading font-bold text-slate-900 leading-snug mb-1">
              {foundProduct.name}
            </h2>

            {/* Barcode if present */}
            {foundProduct.barcode ? (
              <div className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md mb-4">
                <Barcode className="w-3.5 h-3.5" />
                <span>{foundProduct.barcode}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4 italic">Walang barcode</p>
            )}

            {/* PROMINENT PRICE DISPLAY (Most critical element) */}
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl py-5 px-4 mb-5 shadow-sm">
              <span className="block text-xs uppercase tracking-wider font-bold text-amber-800 mb-0.5">
                Presyo sa Tindahan (Selling Price)
              </span>
              <div className="text-4xl sm:text-5xl font-heading font-black text-amber-700 tracking-tight">
                {formatPeso(foundProduct.sellingPrice)}
              </div>
            </div>

            {/* Description note if any */}
            {foundProduct.description && (
              <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 mb-5 border border-slate-200 text-left">
                <span className="font-semibold text-slate-700">Tala: </span>
                {foundProduct.description}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleClear();
                  setIsCameraOn(true);
                  document.getElementById("camera-scanner-screen")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>I-scan ang Susunod</span>
              </button>

              <Link
                href={`/products/${foundProduct.id}/edit`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors"
              >
                <Edit3 className="w-4 h-4 text-slate-600" />
                <span>Baguhin / I-edit</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Result: UNKNOWN BARCODE -> QUICK REGISTRATION FLOW */}
      {notFoundBarcode && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-5 text-center mb-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
            Hindi Nahanap ang Produkto
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Walang produktong nakarehistro sa barcode na ito:
          </p>

          <div className="inline-block bg-slate-100 font-mono font-semibold text-slate-800 px-3.5 py-1.5 rounded-lg text-sm border border-slate-300 mb-5">
            {notFoundBarcode}
          </div>

          {/* 1-Tap Quick Registration Action */}
          <Link
            href={`/products/new?barcode=${encodeURIComponent(notFoundBarcode)}`}
            className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm min-h-[48px] transition-colors"
          >
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <span>I-rehistro ang Bagong Produkto</span>
          </Link>
          <p className="text-[11px] text-slate-400 mt-2">
            Awtomatikong ilalagay ang barcode na ito sa registration form.
          </p>
        </div>
      )}

      {/* Result: MULTIPLE NAME MATCHES */}
      {nameSearchResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">
              Mga Nahanap na Produkto ({nameSearchResults.length})
            </span>
            <span className="text-[11px] text-slate-400">Pindutin para makita ang detalye</span>
          </div>

          <div className="space-y-2">
            {nameSearchResults.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => setFoundProduct(prod)}
                className="w-full text-left bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors min-h-[50px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-sm text-slate-900 truncate">
                    {prod.name}
                  </p>
                  {prod.barcode && (
                    <p className="text-[11px] font-mono text-slate-500">
                      {prod.barcode}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-heading font-bold text-base text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                    {formatPeso(prod.sellingPrice)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result: SEARCHED BUT NOTHING FOUND AT ALL */}
      {hasSearched &&
        !foundProduct &&
        !notFoundBarcode &&
        nameSearchResults.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm mb-4">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="font-heading font-semibold text-slate-800 text-sm mb-1">
              Walang nahanap na tugma para sa &ldquo;{searchTerm}&rdquo;
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pakisuri ang baybay o magrehistro ng bagong produkto sa katalogo.
            </p>
            <Link
              href={`/products/new?name=${encodeURIComponent(searchTerm)}`}
              className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl min-h-[44px] transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Magrehistro ng Produkto</span>
            </Link>
          </div>
        )}

      {/* Help / Guidance tip when idle */}
      {!hasSearched && !isPending && (
        <div className="bg-slate-100/80 rounded-2xl border border-slate-200/80 p-4 text-slate-600 text-xs">
          <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Mabilisang Gabay sa Pagsisilbi:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] ml-1">
            <li>I-toggle ang <strong>Camera Scanner</strong> sa itaas para buksan ang camera at itapat ang barcode ng paninda.</li>
            <li>Kung walang barcode o naka-off ang camera, i-type lang ang pangalan (hal. <em>&ldquo;Coke&rdquo;</em>, <em>&ldquo;Pansit&rdquo;</em>).</li>
            <li>Lalabas agad ang malaking presyo para sabihin sa mamimili.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
