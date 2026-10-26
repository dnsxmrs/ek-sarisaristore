"use client";

import { useState, useTransition, useMemo } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatPeso } from "@/lib/money";
import { createSale } from "@/server/actions/sales";

export interface ProductCatalogItem {
  id: string;
  name: string;
  sellingPrice: number;
  barcode: string | null;
}

interface CartItem {
  productId?: string | null;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductCatalogItem[];
  onSuccess?: () => void;
}

export function NewSaleModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: NewSaleModalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH">("CASH");
  const [notes, setNotes] = useState("");

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
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [products, productSearch]);

  // Total amount calculation
  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
      0
    );
  }, [cart]);

  // Change (Sukli) calculation
  const numericCash = parseFloat(cashReceived) || 0;
  const changeAmount = Math.max(0, numericCash - totalAmount);

  if (!isOpen) return null;

  // Add product to cart
  const handleAddToCart = (product: ProductCatalogItem) => {
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
  };

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

  // Adjust quantity (pure immutable update so React StrictMode does not double-increment)
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

  // Submit Sale
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setFormError("Walang laman ang basket. Magdagdag ng paninda.");
      return;
    }

    if (numericCash < totalAmount && paymentMethod === "CASH") {
      setFormError("Kulang ang binayad na cash.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const res = await createSale({
        items: cart.map((item) => ({
          productId: item.productId || null,
          productNameSnapshot: item.productNameSnapshot,
          unitPriceSnapshot: item.unitPriceSnapshot,
          quantity: item.quantity,
          subtotal: item.unitPriceSnapshot * item.quantity,
        })),
        totalAmount,
        cashReceived: paymentMethod === "CASH" ? numericCash : totalAmount,
        changeAmount: paymentMethod === "CASH" ? changeAmount : 0,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setCart([]);
        setCashReceived("");
        setNotes("");
        onSuccess?.();
        onClose();
      } else {
        setFormError(res.error || "Hindi naitala ang benta.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
              <ShoppingCart className="w-4 h-4 font-bold" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 leading-tight">
                Magtala ng Benta
              </h2>
              <span className="text-[11px] text-slate-500">Mabilisang POS Checkout</span>
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
          {/* Product Search & Tingi bar (with Floating overlay dropdown) */}
          <div className="relative z-30">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="I-type ang pangalan o barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-24 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white shadow-2xs"
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
                  onClick={() => setIsAddingCustom(!isAddingCustom)}
                  className="text-[10px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/60 transition-colors"
                >
                  + Tingi
                </button>
              </div>
            </div>

            {/* Floating Search Results Dropdown (Does not push container) */}
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
              <div className="p-2.5 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-2 animate-fade-in">
                <span className="text-[11px] font-semibold text-teal-900 block">
                  Magdagdag ng Tingi (hal. Yelo, Asukal na nakaplastik)
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
                    className="text-[11px] bg-teal-700 text-white font-semibold px-3 py-1 rounded-lg"
                  >
                    Idagdag
                  </button>
                </div>
              </div>
            )}

          {/* Cart Items List */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">
              Mga Bibilhin ({cart.length} klase)
            </span>

            {cart.length === 0 ? (
              <div className="p-5 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                Pumili ng produkto sa itaas para magsimula.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
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

          {/* Running Total & Sukli Display */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                Kabuuang Babayaran:
              </span>
              <span className="font-mono text-xl font-black text-amber-400">
                {formatPeso(totalAmount)}
              </span>
            </div>

            {/* Payment Method Toggle & Cash Input */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    paymentMethod === "CASH"
                      ? "bg-teal-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("GCASH")}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    paymentMethod === "GCASH"
                      ? "bg-blue-500 text-white font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  GCash
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] text-slate-300">
                  {paymentMethod === "CASH" ? "Natanggap na Cash:" : "Halaga sa GCash:"}
                </label>
                {/* Sukli indicator */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 mr-1.5">Sukli:</span>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {formatPeso(changeAmount)}
                  </span>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-sm font-bold text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setCashReceived(totalAmount.toFixed(2))}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-teal-300 border border-slate-700 transition-colors"
                >
                  Tugma
                </button>
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashReceived(amt.toString())}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={handleSubmitSale}
            className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span>Sine-save...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>I-tala ang Benta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
