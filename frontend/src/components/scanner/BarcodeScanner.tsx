import { useEffect, useState, useCallback, useRef } from "react";
import { createWorker } from "tesseract.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { CameraOff, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  prefix: string;
  onScan: (code: string) => void;
  onClose: () => void;
}

type Status = "loading_ocr" | "starting_cam" | "scanning" | "no_camera" | "permission_denied" | "invalid_prefix" | "found";

// Extract the first token matching PREFIX-ALPHANUM from OCR text
function extractSku(text: string, prefix: string): string | null {
  const clean = text.replace(/\s+/g, " ").toUpperCase();
  const escaped = prefix.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = clean.match(new RegExp(`${escaped}[-– ]?[A-Z0-9]{1,10}`));
  if (!match) return null;
  // normalise any separator to dash
  return match[0].replace(/[– ]/g, "-");
}

// Capture the centre 70%×50% of the video, convert to high-contrast grayscale
function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const W = 640;
  const H = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const cropX = vw * 0.15;
  const cropY = vh * 0.25;
  const cropW = vw * 0.70;
  const cropH = vh * 0.50;

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, W, H);

  // Grayscale + boost contrast for printed text on white paper
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const c = Math.min(255, Math.max(0, (g - 128) * 2.5 + 128));
    d[i] = d[i + 1] = d[i + 2] = c;
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function BarcodeScanner({ open, prefix, onScan, onClose }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("loading_ocr");
  const [liveText, setLiveText] = useState("");

  // callback ref: fires when video el mounts inside Dialog portal
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => setVideoEl(el), []);

  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const invalidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognizingRef = useRef(false);
  const foundRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    workerRef.current?.terminate();
    streamRef.current = null;
    workerRef.current = null;
    intervalRef.current = null;
    recognizingRef.current = false;
    foundRef.current = false;
  }, []);

  useEffect(() => {
    if (!open || !videoEl) return;

    foundRef.current = false;
    setLiveText("");
    setStatus("loading_ocr");

    let stopped = false;

    const init = async () => {
      // 1. Init Tesseract worker
      const worker = await createWorker("eng", 1, { logger: () => {} });
      await worker.setParameters({
        // Whitelist chars found in SKU labels
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-– ",
        // PSM 7 = single text line, fast for labels
        tessedit_pageseg_mode: "7" as any,
      });
      if (stopped) { worker.terminate(); return; }
      workerRef.current = worker;

      // 2. Start camera
      setStatus("starting_cam");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        });
      } catch (err: any) {
        if (stopped) return;
        setStatus(err?.name === "NotAllowedError" ? "permission_denied" : "no_camera");
        return;
      }
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();

      setStatus("scanning");

      // 3. OCR loop every 800ms
      intervalRef.current = setInterval(async () => {
        if (stopped || recognizingRef.current || foundRef.current) return;
        if (!videoEl || videoEl.readyState < 2) return;

        recognizingRef.current = true;
        try {
          const canvas = captureFrame(videoEl);
          const { data: { text } } = await worker.recognize(canvas);
          if (stopped || foundRef.current) return;

          const cleaned = text.replace(/\n/g, " ").trim();
          const sku = extractSku(cleaned, prefix);
          const hasText = cleaned.replace(/\s/g, "").length > 2; // at least 3 meaningful chars

          setLiveText(cleaned.slice(0, 60));

          if (sku) {
            if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
            foundRef.current = true;
            setStatus("found");
            setTimeout(() => {
              cleanup();
              onScan(sku);
              onClose();
            }, 600);
          } else if (hasText) {
            // Text detected but doesn't match prefix — show error, pause 2s then resume
            setStatus("invalid_prefix");
            if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
            invalidTimerRef.current = setTimeout(() => {
              if (!stopped && !foundRef.current) {
                setStatus("scanning");
                setLiveText("");
              }
            }, 2000);
          }
        } finally {
          recognizingRef.current = false;
        }
      }, 800);
    };

    init();

    return () => {
      stopped = true;
      cleanup();
    };
  }, [open, videoEl, prefix, onScan, onClose, cleanup]);

  const isError = status === "no_camera" || status === "permission_denied";
  const isReady = status === "scanning" || status === "found" || status === "invalid_prefix";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { cleanup(); onClose(); } }}>
      <DialogContent className="p-0 overflow-hidden bg-black border-0 max-w-sm w-full gap-0">
        {/* Camera viewport */}
        <div className="relative w-full bg-black" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoCallbackRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Vignette edges */}
          {isReady && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 85%)",
              }}
            />
          )}

          {/* Viewfinder brackets — show scan area */}
          {isReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`relative w-64 h-16 ${status === "found" ? "opacity-100" : "opacity-80"}`}
              >
                {/* Corners */}
                <span className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-sm ${status === "found" ? "border-green-400" : "border-primary"}`} />
                <span className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-sm ${status === "found" ? "border-green-400" : "border-primary"}`} />
                <span className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-sm ${status === "found" ? "border-green-400" : "border-primary"}`} />
                <span className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-sm ${status === "found" ? "border-green-400" : "border-primary"}`} />

                {/* Scan sweep line */}
                {status === "scanning" && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_6px_2px] shadow-primary/60"
                    initial={{ top: "2px" }}
                    animate={{ top: "calc(100% - 2px)" }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                  />
                )}

                {/* Found flash */}
                {status === "found" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Overlays */}
          {isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6">
              <CameraOff className="w-12 h-12 text-muted-foreground" />
              <p className="text-white text-sm text-center leading-relaxed">
                {status === "permission_denied" ? t("scanner.permission_denied") : t("scanner.no_camera")}
              </p>
            </div>
          )}

          {(status === "loading_ocr" || status === "starting_cam") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white/60 text-xs">
                {status === "loading_ocr" ? t("scanner.loading_ocr") : t("scanner.starting_cam")}
              </p>
            </div>
          )}
        </div>

        {/* Status / live text bar */}
        <div className="bg-black px-4 py-3 min-h-[56px] flex flex-col items-center justify-center gap-1">
          <AnimatePresence mode="wait">
            {status === "found" ? (
              <motion.p key="found" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-sm font-semibold">
                {t("scanner.found")}
              </motion.p>
            ) : status === "invalid_prefix" ? (
              <motion.div key="invalid" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t("scanner.invalid_prefix", { prefix })}</span>
              </motion.div>
            ) : status === "scanning" ? (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-white/60 text-sm text-center">
                {t("scanner.aim_at_label")}
              </motion.p>
            ) : null}
          </AnimatePresence>

          {/* Live OCR feedback */}
          {status === "scanning" && liveText && (
            <p className="text-white/35 text-xs font-mono text-center truncate w-full px-2">
              {liveText}
            </p>
          )}
        </div>

        {/* Prefix hint */}
        {!isError && (
          <div className="bg-black pb-4 flex justify-center">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-mono font-semibold">
              {prefix}-***
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
