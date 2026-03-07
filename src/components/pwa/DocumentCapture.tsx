import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, Check, AlertCircle, ZoomIn } from "lucide-react";

interface DocumentCaptureProps {
  label?: string;
  accept?: string;
  maxSizeKb?: number;
  onCapture: (file: File, dataUrl: string) => void;
  onError?: (msg: string) => void;
}

type Mode = "idle" | "camera" | "preview" | "error";

/** Compress image to target quality for slow networks */
async function compressImage(file: File, maxWidthPx = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, maxWidthPx / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      // Slight contrast boost for OCR pre-processing
      ctx.filter = "contrast(1.1) brightness(1.05)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function DocumentCapture({
  label = "Document",
  accept = "image/*,application/pdf",
  maxSizeKb = 5120,
  onCapture,
  onError,
}: DocumentCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Check camera availability
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setCameraAvailable(devices.some((d) => d.kind === "videoinput"));
    }).catch(() => setCameraAvailable(false));
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode("camera");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access or use file upload instead."
          : "Unable to access camera. Please use file upload instead.";
      setErrorMsg(msg);
      setMode("error");
      onError?.(msg);
    }
  }, [facingMode, onError]);

  const flipCamera = useCallback(async () => {
    stopStream();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  }, [facingMode, stopStream]);

  // Re-start camera when facingMode changes while in camera mode
  useEffect(() => {
    if (mode === "camera") startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = "contrast(1.1) brightness(1.05)";
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${label.replace(/\s+/g, "_")}_capture.jpg`, { type: "image/jpeg" });
        setCapturedFile(file);
        setPreview(dataUrl);
        stopStream();
        setMode("preview");
      },
      "image/jpeg",
      0.9
    );
  }, [label, stopStream]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    if (raw.size > maxSizeKb * 1024) {
      const msg = `File too large. Max ${maxSizeKb / 1024}MB allowed.`;
      setErrorMsg(msg);
      setMode("error");
      onError?.(msg);
      return;
    }
    const file = raw.type.startsWith("image/") ? await compressImage(raw) : raw;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCapturedFile(file);
    setMode("preview");
  }, [maxSizeKb, onError]);

  const confirmCapture = useCallback(() => {
    if (capturedFile && preview) {
      onCapture(capturedFile, preview);
    }
  }, [capturedFile, preview, onCapture]);

  const reset = useCallback(() => {
    stopStream();
    setPreview(null);
    setCapturedFile(null);
    setErrorMsg("");
    setMode("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  // ── Render ──────────────────────────────────────────────

  if (mode === "camera") {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-foreground aspect-[4/3] border border-border">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-primary/60 rounded-xl" />
          <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl" />
          <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl" />
          <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl" />
          <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl" />
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-6 py-4 bg-gradient-to-t from-foreground/80 to-transparent">
          <button onClick={reset} className="p-3 rounded-full bg-card/20 text-card hover:bg-card/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={capture}
            className="w-16 h-16 rounded-full border-4 border-primary-foreground bg-primary shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
          >
            <Camera className="w-6 h-6 text-primary-foreground" />
          </button>
          <button onClick={flipCamera} className="p-3 rounded-full bg-card/20 text-card hover:bg-card/30 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="absolute top-4 inset-x-0 text-center text-xs text-primary-foreground/80 font-medium">
          Position document within the frame
        </p>
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        {preview?.startsWith("data:image") || preview?.startsWith("blob:") ? (
          <div className="relative aspect-[4/3]">
            <img src={preview} alt="Captured document" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-primary-foreground opacity-60" />
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] flex items-center justify-center bg-muted">
            <p className="text-sm text-muted-foreground">{capturedFile?.name}</p>
          </div>
        )}
        <div className="p-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground truncate flex-1">{capturedFile?.name}</span>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-muted/70 transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Retake
            </button>
            <button
              onClick={confirmCapture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              <Check className="w-3 h-3" /> Use this
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "error") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">Upload from device</span>
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInput} className="hidden" />
        </label>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  // Idle state — choose camera or file
  return (
    <div className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 transition-colors bg-muted/20 p-5 space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">{label}</p>
      <div className="flex gap-3">
        {cameraAvailable !== false && (
          <button
            onClick={startCamera}
            className="flex-1 flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-foreground">Take photo</span>
          </button>
        )}
        <label className="flex-1 flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Upload file</span>
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInput} className="hidden" />
        </label>
      </div>
    </div>
  );
}
