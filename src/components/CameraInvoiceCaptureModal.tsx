import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Sparkles,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Zap,
} from 'lucide-react';
import { processInvoiceWithGeminiOcr } from '../services/receivedInvoicesService';
import { ReceivedInvoice } from '../types';

interface CameraInvoiceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceExtracted: (
    data: Partial<ReceivedInvoice>,
    capturedImageUrl?: string
  ) => void;
}

export const CameraInvoiceCaptureModal: React.FC<CameraInvoiceCaptureModalProps> = ({
  isOpen,
  onClose,
  onInvoiceExtracted,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      setIsProcessing(false);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access failed or denied:', err);
      let errorMsg = 'No se pudo acceder a la cámara.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permiso de cámara denegado. Puedes subir una foto de la factura directamente desde tus archivos.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ningún sensor de cámara disponible en el dispositivo.';
      } else {
        errorMsg = err.message || errorMsg;
      }
      setCameraError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Trigger visual flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // Provide haptic feedback if available
    if (navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
      processImageOCR(dataUrl);
    }
  };

  const handleFileUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
        processImageOCR(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImageOCR = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setCameraError(null);

    try {
      const result = await processInvoiceWithGeminiOcr(imageDataUrl);

      if (result.success && result.data) {
        onInvoiceExtracted(result.data, imageDataUrl);
        onClose();
      } else {
        setCameraError(result.error || 'No se pudieron extraer datos legibles de la factura.');
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Error inesperado al ejecutar el OCR.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera(facingMode);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Flash effect overlay */}
        {flashEffect && <div className="absolute inset-0 bg-white z-50 opacity-90 transition-opacity duration-150 pointer-events-none" />}

        {/* Hidden canvas for taking snapshot */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for gallery/file fallback */}
        <input
          type="file"
          ref={fileFallbackInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUploadFallback}
          className="hidden"
        />

        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 id="camera-modal-title" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Escanear Factura con Cámara</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini OCR
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Apunta al documento de gasto o factura del proveedor para extraer datos automáticamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Video Container */}
        <div className="relative flex-1 bg-black min-h-[340px] max-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Live Video Preview */}
          {!capturedImage && !cameraError && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[460px]"
              />

              {/* Viewfinder Guides Overlay */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-amber-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                </div>

                <div className="text-center">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-amber-300 text-[11px] font-medium inline-flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5 animate-pulse" />
                    Encuadra la factura o ticket dentro del marco
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>
            </div>
          )}

          {/* Captured Image Display with OCR scanning animation */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center bg-neutral-950 p-2">
              <img
                src={capturedImage}
                alt="Factura capturada"
                className="max-h-[440px] w-auto max-w-full rounded-lg object-contain border border-neutral-800"
              />

              {isProcessing && (
                <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-center p-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                      Gemini OCR Analizando Factura
                    </h4>
                    <p className="text-xs text-neutral-300">
                      Extrayendo razón social, NIF, número de documento, fecha, desglose de IVA (21%) y total...
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
                    <div className="w-full h-full bg-amber-400 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Error or Fallback Message */}
          {cameraError && !capturedImage && (
            <div className="p-6 text-center space-y-4 max-w-md">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Aviso de Cámara</h4>
                <p className="text-xs text-neutral-400">{cameraError}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Foto / Archivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar Cámara</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!capturedImage && !cameraError && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Cambiar cámara frontal / trasera"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Cambiar Cámara</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileFallbackInputRef.current?.click()}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Cargar imagen existente desde el carrete o archivos"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Cargar Archivo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Repetir Foto
                </button>
                <button
                  type="button"
                  onClick={() => processImageOCR(capturedImage)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Analizando...' : 'Volver a Analizar'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="shutter-capture-btn"
                onClick={handleCaptureSnapshot}
                disabled={Boolean(cameraError)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-amber-400/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Camera className="w-5 h-5 text-neutral-950" />
                <span>Tomar Foto y Extraer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
