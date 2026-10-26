"use client";

import { useState, useRef } from "react";
import { Camera, X, RefreshCw } from "lucide-react";

interface PhotoEvidenceCaptureProps {
  photoUrl: string | null;
  onChange: (url: string | null) => void;
}

export function PhotoEvidenceCapture({ photoUrl, onChange }: PhotoEvidenceCaptureProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side image compression to keep mobile uploads fast and light (< 120KB)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let { width, height } = img;

          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.75
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedBlob, "utang_evidence.jpg");

      const res = await fetch("/api/utang/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setUploadError(data.error || "Hindi na-upload ang litrato");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Nagkaroon ng problema sa pag-upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    onChange(null);
    setUploadError(null);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="utang-evidence-input"
      />

      {photoUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm max-w-xs mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Ebidensya ng Utang"
            className="w-full h-44 object-cover"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute top-2 right-2 bg-slate-950/80 hover:bg-rose-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow"
            title="Tanggalin ang litrato"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm flex items-center gap-1">
            <Camera className="w-3 h-3 text-teal-400" />
            <span>Naka-attach ang litrato</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/40 text-slate-600 hover:text-teal-900 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[90px]"
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-teal-700 text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Ina-upload ang litrato...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold block text-slate-800">
                  Kunan ng Litrato ang Paninda
                </span>
                <span className="text-[11px] text-slate-600">
                  Ebidensya ng mga kinuha (Opsyonal)
                </span>
              </div>
            </>
          )}
        </button>
      )}

      {uploadError && (
        <p className="text-xs text-rose-600 mt-1.5 text-center">{uploadError}</p>
      )}
    </div>
  );
}
