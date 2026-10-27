"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, AlertCircle, RefreshCw, Keyboard, Image as ImageIcon, ShieldAlert } from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "I-scan ang Barcode",
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerInstanceRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    scanFile: (file: File, showImage?: boolean) => Promise<string>;
    isScanning: boolean;
  } | null>(null);

  // Provide tactile/audio feedback on successful scan
  const playScanFeedback = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(100);
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch {
      // Audio/vibrate not critical
    }
  }, []);

  const handleSuccessfulScan = useCallback(
    (decodedText: string) => {
      const trimmed = decodedText.trim();
      if (!trimmed) return;
      playScanFeedback();
      onScan(trimmed);
      onClose();
    },
    [onScan, onClose, playScanFeedback]
  );

  // Handle Photo Snap / File upload (Works over HTTP without browser camera block!)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScannerError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner =
        scannerInstanceRef.current ||
        new Html5Qrcode("isolated-barcode-reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

      const decodedText = await scanner.scanFile(file, false);
      setIsProcessingFile(false);
      handleSuccessfulScan(decodedText);
    } catch (err: unknown) {
      setIsProcessingFile(false);
      console.warn("File scan error:", err);
      setScannerError("Hindi nabasa ang barcode sa litrato. Tiyaking malinaw at nakatutok ang barcode, o i-type nang manual.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    const currentContainer = containerRef.current;
    const scannerElementId = "isolated-barcode-reader";

    async function initScanner() {
      // Check if running on insecure HTTP on a remote device (e.g. mobile LAN)
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const isSecure = typeof window !== "undefined" && window.isSecureContext;

      if (!isLocalhost && !isSecure) {
        if (!isMounted) return;
        setIsHttpInsecure(true);
        setScannerError(
          "Naka-block ang live camera ng browser dahil naka-HTTP (local IP) ang koneksyon. Gamitin ang 'Kumuha ng Litrato' sa ibaba (gumagana ito kahit walang HTTPS) o i-type ang barcode."
        );
        return;
      }

      setIsStarting(true);
      setScannerError(null);

      // Create a fresh DOM element for html5-qrcode that React will not touch
      if (currentContainer) {
        currentContainer.innerHTML = "";
        const targetDiv = document.createElement("div");
        targetDiv.id = scannerElementId;
        targetDiv.style.width = "100%";
        targetDiv.style.position = "relative";
        currentContainer.appendChild(targetDiv);
      }

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!isMounted) return;

        const scanner = new Html5Qrcode(scannerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const width = Math.min(Math.floor(viewfinderWidth * 0.78), 260);
              const height = Math.min(Math.floor(viewfinderHeight * 0.45), 110);
              return {
                width: Math.max(width, 180),
                height: Math.max(height, 80),
              };
            },
          },
          (decodedText) => {
            if (isMounted) {
              handleSuccessfulScan(decodedText);
            }
          },
          () => {
            // normal frame read miss
          }
        );

        if (isMounted) {
          setIsStarting(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsStarting(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn("Scanner initialization notice:", errorMsg);

        if (
          errorMsg.includes("NotAllowedError") ||
          errorMsg.includes("Permission")
        ) {
          setScannerError(
            "Kailangan ng pahintulot sa camera. Paki-allow ang camera permission sa browser."
          );
        } else if (
          errorMsg.includes("NotFoundError") ||
          errorMsg.includes("DevicesNotFoundError")
        ) {
          setScannerError("Walang nakitang camera sa device na ito. Gamitin ang Kumuha ng Litrato o Manual Entry.");
        } else {
          setScannerError(
            "Hindi mabuksan ang live video stream. Maaari mong gamitin ang 'Kumuha ng Litrato' o i-type ang barcode sa ibaba."
          );
        }
      }
    }

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);

      const scanner = scannerInstanceRef.current;
      scannerInstanceRef.current = null;

      if (scanner) {
        if (scanner.isScanning) {
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                scanner.clear();
              } catch {}
              if (currentContainer) {
                currentContainer.innerHTML = "";
              }
            });
        } else {
          try {
            scanner.clear();
          } catch {}
          if (currentContainer) {
            currentContainer.innerHTML = "";
          }
        }
      }
    };
  }, [isOpen, handleSuccessfulScan]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (trimmed) {
      handleSuccessfulScan(trimmed);
      setManualCode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading font-semibold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 transition-colors min-w-9 min-h-9 flex items-center justify-center"
            aria-label="Isara"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3.5 overflow-y-auto">
          {/* Live Scanner Container (if not blocked by HTTP insecure context) */}
          {!isHttpInsecure && (
            <div className="relative flex flex-col items-center">
              <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden h-[190px] sm:h-[210px] flex items-center justify-center">
                <div ref={containerRef} className="w-full flex items-center justify-center overflow-hidden" />
                {isStarting && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-300">
                    <RefreshCw className="w-7 h-7 animate-spin text-teal-400" />
                    <span className="text-xs">Binubuksan ang camera...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scanner Error Notice */}
          {scannerError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              {isHttpInsecure ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{isHttpInsecure ? "HTTP Browser Restriction" : "Paunawa sa Camera"}</p>
                <p className="mt-0.5 leading-relaxed">{scannerError}</p>
              </div>
            </div>
          )}

          {/* SOLUTION 1: Native Phone Camera Snap / Photo Upload (Works 100% over HTTP!) */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-teal-950 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-700" />
              <span>Kumuha ng Litrato ng Barcode (Native Camera)</span>
            </p>
            <p className="text-[11px] text-teal-800 mb-2.5 leading-snug">
              Bukas ito sa native camera app ng cellphone. Gumagana ito <strong>kahit walang HTTPS</strong> at may autofocus/macro.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              id="native-camera-capture"
            />

            <button
              type="button"
              disabled={isProcessingFile}
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 min-h-11 transition-colors shadow-sm"
            >
              {isProcessingFile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Binabasa ang barcode sa litrato...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                  <span>Kumuha ng Litrato gamit ang Telepono</span>
                </>
              )}
            </button>
          </div>

          {/* SOLUTION 2: Manual Text Input */}
          <div className="border-t border-slate-200 pt-3">
            <label
              htmlFor="manual-barcode-input"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-teal-700" />
              <span>O i-type ang Barcode (Manual)</span>
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                id="manual-barcode-input"
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Hal. 4800016644211"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-11"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm px-4 rounded-xl min-h-11 transition-colors shrink-0"
              >
                Ilagay
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm min-h-11 transition-colors"
          >
            Kanselahin
          </button>
        </div>
      </div>
    </div>
  );
}
