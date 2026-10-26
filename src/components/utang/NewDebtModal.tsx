"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  AlertCircle,
  Check,
  UserPlus,
  ScanLine,
  CheckCircle2,
  Receipt,
  Camera,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { PhotoEvidenceCapture } from "./PhotoEvidenceCapture";
import { SaleCameraScanner } from "@/components/sales/SaleCameraScanner";
import { createDebtRecord } from "@/server/actions/utang";
import { getProductByBarcode } from "@/server/actions/products";

export interface CustomerOption {
  id: string;
  name: string;
  nickname?: string | null;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  sellingPrice: number;
  barcode: string | null;
}

interface DebtCartItem {
  productId?: string | null;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

interface NewDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  products?: ProductCatalogItem[];
  preselectedCustomerId?: string;
  onOpenNewCustomerModal?: () => void;
  onSuccess?: () => void;
}

export function NewDebtModal({
  isOpen,
  onClose,
  customers,
  products = [],
  preselectedCustomerId,
  onOpenNewCustomerModal,
  onSuccess,
}: NewDebtModalProps) {
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [cart, setCart] = useState<DebtCartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Barcode Camera Scanner state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [scannerNotice, setScannerNotice] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Custom / Tingi item state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search filtered products
  const searchResults = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return [];
    return (products || [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [products, productSearch]);

  // Total amount calculation (dependent on items gathered)
  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
      0
    );
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Add product to cart
  const handleAddToCart = useCallback((product: ProductCatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productNameSnapshot: product.name,
          unitPriceSnapshot: product.sellingPrice,
          quantity: 1,
        },
      ];
    });
    setProductSearch("");
  }, []);

  // Handle barcode scanned from camera
  const handleBarcodeScanned = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      // 1. Instant local catalog match
      const localMatch = (products || []).find(
        (p) => p.barcode && p.barcode.trim() === code
      );

      if (localMatch) {
        handleAddToCart(localMatch);
        setScannedFeedback(`${localMatch.name} (+1)`);
        setScannerNotice({
          message: `Naidagdag: ${localMatch.name} (${formatPeso(localMatch.sellingPrice)})`,
          type: "success",
        });
        setTimeout(() => setScannerNotice(null), 3500);
        return;
      }

      // 2. Server lookup fallback
      try {
        const res = await getProductByBarcode(code);
        if (res.success && res.product) {
          const fetchedItem: ProductCatalogItem = {
            id: res.product.id,
            name: res.product.name,
            sellingPrice: res.product.sellingPrice,
            barcode: res.product.barcode,
          };
          handleAddToCart(fetchedItem);
          setScannedFeedback(`${fetchedItem.name} (+1)`);
          setScannerNotice({
            message: `Naidagdag: ${fetchedItem.name} (${formatPeso(fetchedItem.sellingPrice)})`,
            type: "success",
          });
          setTimeout(() => setScannerNotice(null), 3500);
        } else {
          setScannerNotice({
            message: res.error || `Walang produktong may barcode: ${code}`,
            type: "error",
          });
          setTimeout(() => setScannerNotice(null), 4000);
        }
      } catch (err) {
        console.error("Barcode lookup error:", err);
        setScannerNotice({
          message: `Hindi mahanap ang barcode (${code})`,
          type: "error",
        });
        setTimeout(() => setScannerNotice(null), 4000);
      }
    },
    [products, handleAddToCart]
  );

  // Add custom / tingi item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim();
    const price = parseFloat(customPrice);
    if (!name || isNaN(price) || price <= 0) return;

    setCart((prev) => [
      ...prev,
      {
        productId: null,
        productNameSnapshot: name,
        unitPriceSnapshot: price,
        quantity: 1,
      },
    ]);

    setCustomName("");
    setCustomPrice("");
    setIsAddingCustom(false);
  };

  // Adjust item quantity (immutable update to prevent double-increment)
  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      );
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const effectiveCustomerId = customerId || preselectedCustomerId;
  const preselectedCustomerObj = customers.find(
    (c) => c.id === effectiveCustomerId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveCustomerId) {
      setFormError("Pumili ng suki na may utang.");
      return;
    }

    if (cart.length === 0 || totalAmount <= 0) {
      setFormError("Pumili o magdagdag ng mga panindang inutang.");
      return;
    }

    setFormError(null);

    // Automatically construct itemized list as description
    const autoDescription = cart
      .map(
        (item) =>
          `${item.quantity}x ${item.productNameSnapshot} (${formatPeso(
            item.unitPriceSnapshot * item.quantity
          )})`
      )
      .join(", ");

    startTransition(async () => {
      const res = await createDebtRecord({
        customerId: effectiveCustomerId,
        amount: totalAmount,
        description: autoDescription,
        photoUrl: photoUrl || undefined,
        dueDate: undefined, // Kailan babayaran removed, null in database
      });

      if (res.success) {
        setCart([]);
        setPhotoUrl(null);
        setIsCameraOpen(false);
        setProductSearch("");
        onSuccess?.();
        onClose();
      } else {
        setFormError(res.error || "Hindi na-save ang utang.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Receipt className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 leading-tight">
                Maglista ng Utang
              </h2>
              <span className="text-[11px] text-slate-500">
                Pumili ng suki at mga inutang na paninda
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {/* Suki Name Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Pangalan ng Suki <span className="text-rose-500">*</span>
              </label>
              {!preselectedCustomerId && onOpenNewCustomerModal && (
                <button
                  type="button"
                  onClick={onOpenNewCustomerModal}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Bagong Suki</span>
                </button>
              )}
            </div>

            {preselectedCustomerId ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>
                  {preselectedCustomerObj?.name || "Napiling Suki"}{" "}
                  {preselectedCustomerObj?.nickname && (
                    <span className="text-slate-500 font-normal">
                      ({preselectedCustomerObj.nickname})
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-mono font-medium border border-teal-200/60">
                  Naka-lock sa suki
                </span>
              </div>
            ) : (
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-xs text-slate-900 bg-white"
              >
                <option value="">-- Pumili ng Suki --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nickname ? `(${c.nickname})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Camera Scanner Viewport (Toggled on/off via the Scan button) */}
          <SaleCameraScanner
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onScan={handleBarcodeScanned}
            lastScannedItem={scannedFeedback}
            containerIdPrefix="debt"
          />

          {/* Scanner Feedback Notification Toast */}
          {scannerNotice && (
            <div
              className={`p-2 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                scannerNotice.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-700"
              }`}
            >
              {scannerNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium text-[11px] truncate">
                {scannerNotice.message}
              </span>
            </div>
          )}

          {/* Items Section (Moved UP & Searchable like in Sales) */}
          <div className="relative z-30">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mga Kinuha / Paninda <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="I-type ang pangalan o barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-36 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white shadow-2xs"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                    title="Burahin ang search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen((prev) => !prev)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    isCameraOpen
                      ? "bg-teal-700 text-white border-teal-800 shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-200/80"
                  }`}
                  title="I-scan ang barcode gamit ang camera"
                >
                  <ScanLine className="w-3 h-3" />
                  <span>{isCameraOpen ? "Isara" : "Scan"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(!isAddingCustom)}
                  className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/60 transition-colors"
                >
                  + Tingi
                </button>
              </div>
            </div>

            {/* Floating Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 z-50 animate-fade-in max-h-52 overflow-y-auto ring-1 ring-slate-950/5">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-teal-50/80 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-semibold text-slate-900 group-hover:text-teal-900 block truncate">
                        {p.name}
                      </span>
                      {p.barcode && (
                        <span className="font-mono text-[10px] text-slate-400 block truncate">
                          {p.barcode}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-teal-800 shrink-0 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                      {formatPeso(p.sellingPrice)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inline Custom Tingi Form */}
          {isAddingCustom && (
            <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2 animate-fade-in">
              <span className="text-[11px] font-semibold text-amber-900 block">
                Maglista ng Tingi (hal. Yelo, Mantika sa plastic, Candy)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pangalan (hal. Yelo)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Halaga (hal. 5)"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full pl-5 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-semibold text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="text-[11px] text-slate-500 px-2 py-1"
                >
                  Kanselahin
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="text-[11px] bg-amber-700 text-white font-semibold px-3 py-1 rounded-lg"
                >
                  Idagdag
                </button>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">
              Mga Kinuha ({cart.length} klase)
            </span>

            {cart.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                Pumili ng produkto sa itaas, mag-scan, o mag-tingi.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.productNameSnapshot}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-semibold text-slate-900 block truncate">
                        {item.productNameSnapshot}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatPeso(item.unitPriceSnapshot)} bawat isa
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-5 text-center text-slate-900 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Halaga ng Utang (Dependent on items gathered) */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Halaga ng Utang (Kabuuan):
              </span>
              <span className="text-[10px] text-amber-300/90 font-mono">
                {totalItemsCount} piraso ang nakalista
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-amber-400 block">
                {formatPeso(totalAmount)}
              </span>
            </div>
          </div>

          {/* Picture of Items (Ebidensya) - in the LAST part of the form */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>Litrato ng mga Paninda (Ebidensya)</span>
              </label>
              <span className="text-[10px] text-slate-400">Opsyonal</span>
            </div>
            <PhotoEvidenceCapture photoUrl={photoUrl} onChange={setPhotoUrl} />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-100 flex gap-2 shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Kanselahin
          </button>
          <button
            type="button"
            disabled={isPending || cart.length === 0}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span>Sine-save...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>I-save ang Utang ({formatPeso(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
