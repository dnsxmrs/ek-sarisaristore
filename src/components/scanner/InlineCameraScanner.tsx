"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  SwitchCamera,
  Image as ImageIcon,
  ShieldAlert,
  AlertCircle,
  Scan,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface InlineCameraScannerProps {
  isCameraOn: boolean;
  onToggleCamera: (on: boolean) => void;
  onScan: (barcode: string) => void;
  lastScannedCode?: string | null;
}

export function InlineCameraScanner({
  isCameraOn,
  onToggleCamera,
  onScan,
  lastScannedCode,
}: InlineCameraScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isHttpInsecure, setIsHttpInsecure] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [justScannedBadge, setJustScannedBadge] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerInstanceRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    scanFile: (file: File, showImage?: boolean) => Promise<string>;
    isScanning: boolean;
  } | null>(null);

  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  // Sound and haptic feedback
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
      // Debounce the exact same barcode within 2 seconds to avoid runaway queries
      if (
        lastScannedRef.current.code === trimmed &&
        now - lastScannedRef.current.time < 2000
      ) {
        return;
      }

      lastScannedRef.current = { code: trimmed, time: now };
      playScanFeedback();

      // Show temporary pop-in badge
      setJustScannedBadge(trimmed);
      setTimeout(() => {
        setJustScannedBadge(null);
      }, 2500);

      onScan(trimmed);
    },
    [onScan, playScanFeedback]
  );

  // Native phone camera snap / file upload fallback (Works 100% even over insecure HTTP / local IP)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScannerError(null);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner =
        scannerInstanceRef.current ||
        new Html5Qrcode("inline-barcode-reader-container", {
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
      setScannerError(
        "Hindi nabasa ang barcode sa litrato. Tiyaking malinaw at nakatutok ang barcode, o i-type nang manu-mano."
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Flip between back and front camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Lifecycle when isCameraOn is toggled
  useEffect(() => {
    if (!isCameraOn) {
      return;
    }

    let isMounted = true;
    const currentContainer = containerRef.current;
    const scannerElementId = "inline-barcode-reader";

    async function initScanner() {
      // Check HTTP insecure context (browser security restrictions on LAN mobile without HTTPS)
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const isSecure = typeof window !== "undefined" && window.isSecureContext;

      if (!isLocalhost && !isSecure) {
        if (!isMounted) return;
        setIsHttpInsecure(true);
        setScannerError(
          "Naka-block ang live camera stream ng browser dahil naka-HTTP ang IP address. Gamitin ang 'Kumuha ng Litrato' sa ibaba o gamitin ang HTTPS / localhost."
        );
        return;
      }

      setIsStarting(true);
      setScannerError(null);

      // Clean unmanaged container
      if (currentContainer) {
        currentContainer.innerHTML = "";
        const targetDiv = document.createElement("div");
        targetDiv.id = scannerElementId;
        targetDiv.style.width = "100%";
        targetDiv.style.minHeight = "220px";
        currentContainer.appendChild(targetDiv);
      }

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (!isMounted) return;

        // Check cameras available
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (isMounted && cameras && cameras.length > 1) {
            setHasMultipleCameras(true);
          }
        } catch {
          // Camera listing non-fatal
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
            qrbox: { width: 250, height: 160 },
            aspectRatio: 1.25,
          },
          (decodedText) => {
            if (isMounted) {
              handleSuccessfulScan(decodedText);
            }
          },
          () => {
            // Frame search tick
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
          setScannerError("Walang nakitang camera sa device na ito. Maaaring mag-manual search o mag-upload ng litrato.");
        } else {
          setScannerError(
            "Hindi mabuksan ang live video stream. Maaari mong gamitin ang 'Kumuha ng Litrato' sa ibaba o subukan muli."
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
  }, [isCameraOn, facingMode, handleSuccessfulScan]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header bar with Status and Toggle Switch */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isCameraOn ? "bg-teal-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
            }`}
          >
            {isCameraOn ? (
              <Camera className="w-4 h-4 text-slate-950" />
            ) : (
              <CameraOff className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-sm text-white">
                Camera Scanner
              </span>
              {/* Status Pill Indicator */}
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  isCameraOn
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/60"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCameraOn ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                {isCameraOn ? "ON (Bukas)" : "OFF (Patay)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {isCameraOn
                ? "Live barcode detector aktibo"
                : "Naka-off ang camera upang makatipid sa baterya"}
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={isCameraOn}
            onClick={() => onToggleCamera(!isCameraOn)}
            className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              isCameraOn ? "bg-teal-500" : "bg-slate-700"
            }`}
          >
            <span className="sr-only">I-toggle ang Camera</span>
            {/* Sliding Thumb */}
            <span
              className={`pointer-events-none flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isCameraOn ? "translate-x-7 text-teal-800" : "translate-x-0 text-slate-400"
              }`}
            >
              {isCameraOn ? (
                <Camera className="w-3.5 h-3.5" />
              ) : (
                <CameraOff className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Camera Screen Display Area */}
      <div className="relative w-full bg-slate-950 min-h-[250px] sm:min-h-[280px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#94a3b8 1px, #020617 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />

        {/* ======================================================== */}
        {/* CASE 1: CAMERA OFF DISPLAY */}
        {/* ======================================================== */}
        {!isCameraOn && (
          <div className="relative z-10 w-full p-6 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center text-slate-400 mb-3.5 relative group">
              <CameraOff className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-600 border-2 border-slate-950" />
            </div>

            <h3 className="font-heading font-bold text-base text-white mb-1">
              Naka-off ang Camera
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
              Naka-patay ang live camera scanner. I-toggle ang switch o pindutin ang button sa ibaba upang buksan ang camera.
            </p>

            {/* Quick Turn On Button */}
            <button
              type="button"
              onClick={() => onToggleCamera(true)}
              className="bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all min-h-[42px]"
            >
              <Camera className="w-4 h-4 text-amber-300" />
              <span>Buksan ang Camera</span>
            </button>

            <span className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-400" />
              Tipid sa kuryente at baterya habang naka-off
            </span>
          </div>
        )}

        {/* ======================================================== */}
        {/* CASE 2: CAMERA ON / LIVE VIEW ITSELF */}
        {/* ======================================================== */}
        {isCameraOn && (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            {/* Live Scanner Mount Container */}
            <div
              id="inline-barcode-reader-container"
              ref={containerRef}
              className="w-full flex justify-center items-center overflow-hidden"
            />

            {/* Starting state overlay */}
            {isStarting && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2.5 text-slate-200 z-20">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
                <span className="text-xs font-medium">Binubuksan ang camera stream...</span>
                <span className="text-[11px] text-slate-400">Pakihintay sandali</span>
              </div>
            )}

            {/* Live View Reticle & Laser Sweep Animation */}
            {!isStarting && !scannerError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
                {/* Center Target Box */}
                <div className="relative w-64 h-36 border-2 border-teal-400/50 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.2)] flex items-center justify-center">
                  {/* Corner brackets */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-amber-400 rounded-tl-md" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-amber-400 rounded-tr-md" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-amber-400 rounded-bl-md" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-amber-400 rounded-br-md" />

                  {/* Horizontal animated laser beam */}
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-laser-sweep" />

                  {/* Subtle target hint */}
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal-200 bg-slate-950/70 px-2 py-0.5 rounded-full border border-teal-500/30">
                    Itapat ang Barcode Dito
                  </span>
                </div>
              </div>
            )}

            {/* Pop-in success banner when code is scanned */}
            {justScannedBadge && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-emerald-400 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Na-scan: {justScannedBadge}</span>
              </div>
            )}

            {/* Controls Bar on Live Stream (Flip camera button) */}
            {!isStarting && !scannerError && (
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs p-2 rounded-xl backdrop-blur-sm border border-slate-700/60 shadow flex items-center gap-1.5 transition-colors"
                    title="Palitan ang Camera"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-[11px]">
                      {facingMode === "environment" ? "Likod" : "Harap"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Scanner Error Display (if permissions or HTTP restriction blocks stream) */}
            {scannerError && (
              <div className="absolute inset-0 bg-slate-950/95 p-5 flex flex-col items-center justify-center text-center z-20 animate-fade-in">
                {isHttpInsecure ? (
                  <ShieldAlert className="w-10 h-10 text-amber-400 mb-2" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
                )}
                <h4 className="font-heading font-bold text-sm text-white mb-1">
                  {isHttpInsecure ? "Browser HTTP Restriction" : "Hindi Mabuksan ang Camera"}
                </h4>
                <p className="text-xs text-slate-300 max-w-xs mb-3 leading-relaxed">
                  {scannerError}
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScannerError(null);
                      setIsStarting(true);
                      onToggleCamera(false);
                      setTimeout(() => onToggleCamera(true), 100);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-slate-600 transition-colors"
                  >
                    Subukan Muli
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>Kumuha ng Litrato</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input for native camera snapshot fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        id="inline-native-camera-capture"
      />

      {/* Bottom Auxiliary Bar: Snap Photo / Last scanned reference */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Scan className="w-3.5 h-3.5 text-teal-700" />
          <span className="text-[11px]">
            {lastScannedCode ? (
              <>Huling scan: <strong className="font-mono text-slate-900">{lastScannedCode}</strong></>
            ) : (
              "Handang mag-scan ng mga paninda"
            )}
          </span>
        </div>

        {/* Snap Photo Button as alternative */}
        <button
          type="button"
          disabled={isProcessingFile}
          onClick={() => fileInputRef.current?.click()}
          className="text-teal-800 hover:text-teal-950 font-semibold text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-teal-100/60 transition-colors"
        >
          {isProcessingFile ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-teal-700" />
              <span>Binabasa...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3 h-3 text-teal-700" />
              <span>Kumuha ng Litrato</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
