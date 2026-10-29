"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { Camera, Search, PlusCircle, AlertCircle, Edit3, RefreshCw, Barcode, CheckCircle2, ArrowRight, Receipt, ScanLine } from "lucide-react";
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
    <div className="w-full max-w-md lg:max-w-none mx-auto pb-24 lg:pb-12">
      {/* Page Title on Desktop */}
      <div className="hidden lg:flex items-center justify-between pb-5 mb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Presyo & Barcode Scanner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mabilisang price checker at barcode lookup para sa sari-sari store paninda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scanner Gun Status Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-xs whitespace-nowrap shrink-0">
            <Barcode className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Scanner Gun:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="whitespace-nowrap">Handa (USB/Wireless)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Grid Layout: 1 column on mobile, 12-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN (Desktop: 5 cols): Search, Scanner & Controls */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Manual Search Input Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
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
                className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm px-4 rounded-xl min-h-[44px] shrink-0 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <span className="whitespace-nowrap">Hanapin</span>}
              </button>
            </form>
          </div>

          {/* Inline Camera Barcode Scanner Screen with ON/OFF Toggle */}
          <div id="camera-scanner-screen">
            <InlineCameraScanner
              isCameraOn={isCameraOn}
              onToggleCamera={setIsCameraOn}
              onScan={handleBarcodeLookup}
              lastScannedCode={searchTerm || null}
            />
          </div>

          {/* Desktop Helper Card: Cashier Keyboard & Scanner Gun Shortcuts */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-xs">
            <h3 className="font-semibold text-slate-900 mb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span>Mabilisang Gabay sa Cashier:</span>
            </h3>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0"></span>
                <span><strong>Barcode Scanner Gun:</strong> Kahit saan nakatutok ang mouse o cursor, i-scan lamang ang produkto at awtomatikong lalabas ang presyo sa screen.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0"></span>
                <span><strong>Paghahanap sa Pangalan:</strong> I-type ang pangalan (hal. <em>&ldquo;Coke&rdquo;</em>) at pindutin ang <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">Enter</kbd>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0"></span>
                <span><strong>Webcam / Camera:</strong> Pindutin ang &ldquo;Buksan ang Camera Scanner&rdquo; kung walang pisikal na scanner gun.</span>
              </li>
            </ul>
          </div>

          {/* Mobile Help / Guidance tip when idle (hidden on desktop) */}
          {!hasSearched && !isPending && (
            <div className="lg:hidden bg-slate-100/80 rounded-2xl border border-slate-200/80 p-4 text-slate-600 text-xs">
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

        {/* RIGHT COLUMN (Desktop: 7 cols): Live POS Display / Results Station */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Result: EXACT PRODUCT FOUND */}
          {foundProduct && (
            <div className="bg-white rounded-2xl border-2 border-teal-600/30 shadow-md overflow-hidden animate-fade-in">
              {/* Card Header */}
              <div className="bg-teal-900 text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs lg:text-sm font-semibold text-teal-200 whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">Nahanap na Produkto</span>
                </div>
                {foundProduct.category && (
                  <span className="text-xs bg-teal-800 px-3 py-1 rounded-full text-teal-100 border border-teal-700 whitespace-nowrap shrink-0">
                    {foundProduct.category.name}
                  </span>
                )}
              </div>

              <div className="p-6 text-center">
                {/* Product Name */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900 leading-snug mb-2">
                  {foundProduct.name}
                </h2>

                {/* Barcode if present */}
                {foundProduct.barcode ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg mb-6 border border-slate-200/80 whitespace-nowrap shrink-0">
                    <Barcode className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">{foundProduct.barcode}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-6 italic whitespace-nowrap">Walang barcode</p>
                )}

                {/* PROMINENT PRICE DISPLAY (Centerpiece) */}
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl py-6 px-4 mb-6 shadow-sm">
                  <span className="block text-xs uppercase tracking-wider font-bold text-amber-800 mb-1">
                    Presyo sa Tindahan (Selling Price)
                  </span>
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-amber-700 tracking-tight whitespace-nowrap">
                    {formatPeso(foundProduct.sellingPrice)}
                  </div>
                  <span className="text-[11px] text-amber-700/70 font-medium mt-1 block">
                    Bawat piraso / retail price
                  </span>
                </div>

                {/* Description note if any */}
                {foundProduct.description && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-6 border border-slate-200 text-left">
                    <span className="font-semibold text-slate-700">Tala: </span>
                    {foundProduct.description}
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleClear();
                      setIsCameraOn(true);
                      document.getElementById("camera-scanner-screen")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors shadow-sm whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="whitespace-nowrap">I-scan ang Susunod</span>
                  </button>

                  <Link
                    href={`/products/${foundProduct.id}/edit`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors border border-slate-200 whitespace-nowrap"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="whitespace-nowrap">Baguhin / I-edit</span>
                  </Link>

                  <Link
                    href="/sales"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors sm:col-span-2 lg:col-span-1 shadow-sm whitespace-nowrap"
                  >
                    <Receipt className="w-4 h-4 text-slate-950 shrink-0" />
                    <span className="whitespace-nowrap">Pumunta sa Benta</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Result: UNKNOWN BARCODE -> QUICK REGISTRATION FLOW */}
          {notFoundBarcode && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-6 lg:p-8 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="font-heading font-bold text-xl text-slate-900 mb-1.5">
                Hindi Nahanap ang Produkto
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-3">
                Walang produktong nakarehistro sa barcode na ito:
              </p>

              <div className="inline-block bg-slate-100 font-mono font-semibold text-slate-900 px-4 py-2 rounded-xl text-sm border border-slate-300 mb-6">
                {notFoundBarcode}
              </div>

              {/* 1-Tap Quick Registration Action */}
              <div className="max-w-md mx-auto">
                <Link
                  href={`/products/new?barcode=${encodeURIComponent(notFoundBarcode)}`}
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm min-h-[48px] transition-colors text-sm whitespace-nowrap"
                >
                  <PlusCircle className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="whitespace-nowrap">I-rehistro ang Bagong Produkto</span>
                </Link>
                <p className="text-[11px] text-slate-400 mt-2.5">
                  Awtomatikong ilalagay ang barcode na ito sa registration form para mabilisang maitala.
                </p>
              </div>
            </div>
          )}

          {/* Result: MULTIPLE NAME MATCHES */}
          {nameSearchResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    Mga Nahanap na Produkto ({nameSearchResults.length})
                  </span>
                  <span className="text-xs text-slate-400">Pindutin upang buksan ang buong detalye</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nameSearchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setFoundProduct(prod)}
                    className="w-full text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-400 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors min-h-[56px] shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold text-sm text-slate-900 truncate">
                        {prod.name}
                      </p>
                      {prod.barcode ? (
                        <p className="text-[11px] font-mono text-slate-500 truncate flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">{prod.barcode}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Walang barcode</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-heading font-bold text-base text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 whitespace-nowrap">
                        {formatPeso(prod.sellingPrice)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
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
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-slate-800 text-base mb-1.5">
                  Walang nahanap na tugma para sa &ldquo;{searchTerm}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                  Pakisuri ang baybay o magrehistro ng bagong produkto sa katalogo.
                </p>
                <Link
                  href={`/products/new?name=${encodeURIComponent(searchTerm)}`}
                  className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl min-h-[44px] transition-colors shadow-sm whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="whitespace-nowrap">Magrehistro ng Produkto</span>
                </Link>
              </div>
            )}

          {/* Desktop Idle Screen: Standby POS Monitor (Shows when no search has been performed yet) */}
          {!hasSearched && !isPending && (
            <div className="hidden lg:flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center shadow-sm min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-100 shadow-sm">
                <ScanLine className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-1.5">
                Handa sa Pagsusuri ng Presyo
              </h2>
              <p className="text-xs text-slate-500 max-w-md mb-6">
                Itapat ang barcode scanner gun sa paninda, buksan ang camera scanner, o i-type ang pangalan ng produkto sa kaliwa.
              </p>

              <div className="grid grid-cols-3 gap-3.5 w-full max-w-lg text-left">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-teal-700 font-semibold text-xs mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Barcode className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Scanner Gun</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    USB / Wireless gun ready anumang oras kahit nasaan ang cursor.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-teal-700 font-semibold text-xs mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Camera className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Camera</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Maaaring gamitin ang laptop webcam o phone camera.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="text-teal-700 font-semibold text-xs mb-1 flex items-center gap-1.5 whitespace-nowrap">
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">Manual Type</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Pindutin ang Enter pagkatapos i-type ang pangalan ng item.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
