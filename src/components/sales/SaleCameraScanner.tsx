"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  RefreshCw,
  SwitchCamera,
  Image as ImageIcon,
  AlertCircle,
  Scan,
} from "lucide-react";

interface SaleCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  lastScannedItem?: string | null;
}

export function SaleCameraScanner({
  isOpen,
  onClose,
  onScan,
  lastScannedItem,
}: SaleCameraScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerInstanceRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    scanFile: (file: File, showImage?: boolean) => Promise<string>;
    isScanning: boolean;
  } | null>(null);

  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Audio beep & vibration feedback
  const playScanFeedback = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([70, 30, 70]);
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 940; // Crisp supermarket beep tone
        gain.gain.value = 0.2;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Audio or vibration failure is non-fatal
    }
  }, []);

  const handleSuccessfulScan = useCallback(
    (decodedText: string) => {
      const trimmed = decodedText.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Debounce the exact same barcode within 1.8 seconds to avoid rapid duplicate queries
      if (
        lastScannedRef.current.code === trimmed &&
        now - lastScannedRef.current.time < 1800
      ) {
        return;
      }

      lastScannedRef.current = { code: trimmed, time: now };
      playScanFeedback();
      onScanRef.current(trimmed);
    },
    [playScanFeedback]
  );

  const scanCallbackRef = useRef(handleSuccessfulScan);
  useEffect(() => {
    scanCallbackRef.current = handleSuccessfulScan;
  }, [handleSuccessfulScan]);

  // Native phone camera snap / file upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScannerError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner =
        scannerInstanceRef.current ||
        new Html5Qrcode("sale-barcode-reader-container", {
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
      console.warn("Sale file scan error:", err);
      setScannerError("Hindi nabasa ang barcode. Pakitutok nang malinaw.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Lifecycle
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const currentContainer = containerRef.current;
    const scannerElementId = "sale-barcode-reader-inner";

    async function initScanner() {
      if (scannerInstanceRef.current?.isScanning) return;

      setIsStarting(true);
      setScannerError(null);

      if (currentContainer) {
        currentContainer.innerHTML = "";
        const targetDiv = document.createElement("div");
        targetDiv.id = scannerElementId;
        targetDiv.style.width = "100%";
        targetDiv.style.minHeight = "180px";
        currentContainer.appendChild(targetDiv);
      }

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!isMounted) return;

        try {
          const cameras = await Html5Qrcode.getCameras();
          if (isMounted && cameras && cameras.length > 1) {
            setHasMultipleCameras(true);
          }
        } catch {
          // Camera listing non-fatal
        }

        if (scannerInstanceRef.current) {
          try {
            if (scannerInstanceRef.current.isScanning) {
              await scannerInstanceRef.current.stop();
            }
            scannerInstanceRef.current.clear();
          } catch {}
          scannerInstanceRef.current = null;
        }

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
          { facingMode: facingMode },
          {
            fps: 15,
            qrbox: { width: 220, height: 140 },
            aspectRatio: 1.3,
          },
          (decodedText) => {
            if (isMounted) {
              scanCallbackRef.current(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) {
          setIsStarting(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsStarting(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn("Sale scanner init error:", errorMsg);
        setScannerError(
          "Hindi mabuksan ang live camera stream. Maaari mong gamitin ang 'Kumuha ng Litrato' o i-type ang barcode."
        );
      }
    }

    const timer = setTimeout(() => {
      initScanner();
    }, 80);

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
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md animate-fade-in mb-3">
      {/* Scanner Header */}
      <div className="px-3 py-2 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-heading font-semibold text-xs text-white">
            Scanner ng Barcode
          </span>
          {lastScannedItem && (
            <span className="text-[10px] bg-teal-900/80 text-teal-200 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
              {lastScannedItem}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasMultipleCameras && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Palitan ang Camera"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Isara ang scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Camera Live Viewport */}
      <div className="relative w-full bg-black min-h-[180px] flex items-center justify-center overflow-hidden">
        <div
          id="sale-barcode-reader-container"
          ref={containerRef}
          className="w-full flex justify-center items-center overflow-hidden"
        />

        {isStarting && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-1.5 text-slate-200 z-20">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
            <span className="text-[11px]">Binubuksan ang camera...</span>
          </div>
        )}

        {scannerError && (
          <div className="absolute inset-0 bg-slate-950/95 p-3 flex flex-col items-center justify-center text-center z-20">
            <AlertCircle className="w-6 h-6 text-amber-400 mb-1" />
            <p className="text-[11px] text-slate-300 max-w-xs mb-2">
              {scannerError}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <ImageIcon className="w-3 h-3 text-amber-300" />
              <span>Kumuha ng Litrato</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        id="sale-native-camera-capture"
      />

      {/* Bottom Sub-bar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Scan className="w-3 h-3 text-teal-400" />
          <span>Itapat ang barcode sa camera</span>
        </div>
        <button
          type="button"
          disabled={isProcessingFile}
          onClick={() => fileInputRef.current?.click()}
          className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 text-[10px]"
        >
          {isProcessingFile ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Binabasa...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3" />
              <span>Litrato</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
