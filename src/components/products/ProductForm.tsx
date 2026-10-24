"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, ArrowLeft, AlertCircle, CheckCircle, Tag, DollarSign, Barcode, Layers, FileText } from "lucide-react";
import { BarcodeScannerModal } from "@/components/scanner/BarcodeScannerModal";
import { createProduct, updateProduct, type ActionResult } from "@/server/actions/products";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  categories: Category[];
  initialData?: {
    id?: string;
    name?: string;
    barcode?: string | null;
    sellingPrice?: number;
    categoryId?: string | null;
    description?: string | null;
    isActive?: boolean;
  };
  defaultBarcode?: string;
}

export function ProductForm({
  mode,
  categories,
  initialData,
  defaultBarcode,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name || "");
  const [sellingPrice, setSellingPrice] = useState(
    initialData?.sellingPrice !== undefined ? String(initialData.sellingPrice) : ""
  );
  const [barcode, setBarcode] = useState(
    initialData?.barcode || defaultBarcode || ""
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    // Client-side quick check
    if (!name.trim()) {
      setFieldErrors({ name: ["Kailangan ang pangalan ng produkto."] });
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFieldErrors({ sellingPrice: ["Wastong presyo ang kailangan."] });
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        sellingPrice: priceNum,
        barcode: barcode.trim() || null,
        categoryId: categoryId || null,
        description: description.trim() || null,
        isActive,
      };

      let res: ActionResult<{ id: string }>;
      if (mode === "create") {
        res = await createProduct(payload);
      } else {
        if (!initialData?.id) {
          setFormError("Nawawala ang Product ID.");
          return;
        }
        res = await updateProduct(initialData.id, payload);
      }

      if (!res.success) {
        setFormError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        setSuccessMessage(res.message || "Matagumpay na naisave ang produkto!");
        setTimeout(() => {
          router.push(mode === "create" ? "" : "/products");
          router.refresh();
        }, 800);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto pb-24">
      {/* Top action header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 min-h-[44px] min-w-[44px] -ml-2 px-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bumalik</span>
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          {mode === "create" ? "Bagong Produkto" : "I-edit ang Produkto"}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-heading font-bold text-slate-900">
            {mode === "create" ? "Magrehistro ng Produkto" : "Baguhin ang Impormasyon"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === "create"
              ? "Ilagay ang pangalan, presyo, at opsyonal na barcode."
              : "I-update ang detalye o baguhin ang presyo ng produkto."}
          </p>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-red-900 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider text-red-800">May Error</p>
              <p className="text-xs mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode Field with Scan Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="product-barcode"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Barcode className="w-4 h-4 text-slate-500" />
                <span>Barcode (Opsyonal)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200/80 flex items-center gap-1 transition-colors min-h-[32px]"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>I-scan</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="product-barcode"
                type="text"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  if (fieldErrors.barcode) {
                    setFieldErrors((prev) => ({ ...prev, barcode: [] }));
                  }
                }}
                placeholder="Hal. 4800016644211"
                className={`w-full bg-slate-50 border ${
                  fieldErrors.barcode?.length ? "border-red-500 bg-red-50/30" : "border-slate-300"
                } rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]`}
              />
              {barcode && (
                <button
                  type="button"
                  onClick={() => setBarcode("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  Burahin
                </button>
              )}
            </div>
            {fieldErrors.barcode?.[0] ? (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.barcode[0]}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Maaaring iwanang walang laman kung walang barcode ang produkto.
              </p>
            )}
          </div>

          {/* Product Name Field */}
          <div>
            <label
              htmlFor="product-name"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <Tag className="w-4 h-4 text-slate-500" />
              <span>Pangalan ng Produkto *</span>
            </label>
            <input
              id="product-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: [] }));
                }
              }}
              placeholder="Hal. Coca-Cola Mismo 290ml"
              className={`w-full bg-slate-50 border ${
                fieldErrors.name?.length ? "border-red-500 bg-red-50/30" : "border-slate-300"
              } rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]`}
            />
            {fieldErrors.name?.[0] && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Selling Price Field */}
          <div>
            <label
              htmlFor="product-price"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>Presyo (Selling Price) *</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base pointer-events-none">
                ₱
              </div>
              <input
                id="product-price"
                type="number"
                step="0.25"
                min="0"
                required
                inputMode="decimal"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  if (fieldErrors.sellingPrice) {
                    setFieldErrors((prev) => ({ ...prev, sellingPrice: [] }));
                  }
                }}
                placeholder="25.00"
                className={`w-full bg-slate-50 border ${
                  fieldErrors.sellingPrice?.length ? "border-red-500 bg-red-50/30" : "border-slate-300"
                } rounded-xl pl-9 pr-3.5 py-2.5 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]`}
              />
            </div>
            {fieldErrors.sellingPrice?.[0] && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.sellingPrice[0]}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="product-category"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Kategorya (Category)</span>
            </label>
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[44px]"
            >
              <option value="">-- Pumili ng Kategorya --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description / Note */}
          <div>
            <label
              htmlFor="product-description"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Karagdagang Tala / Note (Opsyonal)</span>
            </label>
            <textarea
              id="product-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hal. Malamig sa ref, naka-bundle, atbp."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white resize-none"
            />
          </div>

          {/* Active Status Toggle (For Edit mode) */}
          {mode === "edit" && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800">Status ng Produkto</span>
                <p className="text-[11px] text-slate-400">
                  {isActive ? "Aktibo at mabebenta sa tindahan" : "Naka-deactivate / nakatago sa search"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isActive ? "bg-teal-700" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 min-h-[48px] transition-all"
            >
              <Save className="w-5 h-5 text-amber-300" />
              <span>
                {isPending
                  ? "Sinisave..."
                  : mode === "create"
                  ? "I-save ang Produkto"
                  : "I-update ang Produkto"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setBarcode(scannedCode);
        }}
        title="I-scan ang Barcode para sa Form"
      />
    </div>
  );
}
