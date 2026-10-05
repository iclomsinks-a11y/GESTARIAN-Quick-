import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building,
  CreditCard,
  QrCode,
  Download,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { printInvoiceSheet } from '../utils/printInvoice';

interface PrintPreviewModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPrint?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  invoice,
  onClose,
  onPrint,
}) => {
  const [zoom, setZoom] = useState<number>(100);

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(25, prev <= 50 ? prev - 5 : prev - 10));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(200, prev < 50 ? prev + 5 : prev + 10));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleFitWidth = () => {
    // Calcular zoom aproximado para pantalla actual
    const screenWidth = window.innerWidth;
    if (screenWidth < 640) {
      setZoom(40);
    } else if (screenWidth < 1024) {
      setZoom(65);
    } else {
      setZoom(90);
    }
  };

  // Auto-abrir el diálogo de impresión del sistema (impresora predeterminada + nº de copias)
  // al abrir la vista de impresión. El ref evita dobles disparos (React StrictMode / re-montajes).
  const autoPrintedRef = useRef(false);
  useEffect(() => {
    if (autoPrintedRef.current) return;
    const printTimer = setTimeout(() => {
      autoPrintedRef.current = true;
      handleTriggerPrint();
    }, 200);
    return () => clearTimeout(printTimer);
  }, []);

  // Keyboard shortcut listener: ESC to close, Ctrl+P / Cmd+P to print, +/- for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTriggerPrint();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTriggerPrint = () => {
    printInvoiceSheet(invoice.number)
      .then(() => {
        if (onPrint) onPrint();
      })
      .catch((err) => {
        console.error('Error durante la impresión aislada, fallback a window.print:', err);
        window.print();
        if (onPrint) onPrint();
      });
  };

  // Calculations
  const baseImponible = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * (invoice.ivaRate / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate || 0) / 100);
  const totalFactura = baseImponible + cuotaIva - cuotaIrpf;

  return (
    <div
      id="print-preview-modal"
      className="fixed inset-0 z-[80] flex flex-col bg-neutral-950/90 backdrop-blur-md overflow-hidden text-neutral-100 print:bg-white print:text-neutral-900 print:static print:inset-auto print:overflow-visible"
    >
      {/* Inline styles to guarantee that only the #a4-print-sheet-preview is printed when calling window.print() */}
      <style>{`
        @media print {
          /* Hide absolutely everything else */
          body * {
            visibility: hidden !important;
          }
          /* Show only our desired pristine A4 preview element and all its children */
          #a4-print-sheet-preview,
          #a4-print-sheet-preview * {
            visibility: visible !important;
          }
          /* Ensure that the A4 preview fits perfectly on the A4 page printout with no margins/borders */
          #a4-print-sheet-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Top Action Toolbar (Hidden during print) */}
      <header className="no-print shrink-0 h-14 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 select-none">
        {/* Left: Close/Back */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            id="print-preview-close-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
            title="Cerrar vista de impresión (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>

        {/* Right: Print action & close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            id="print-preview-action-btn"
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md hover:shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            title="Imprimir documento o guardar como PDF (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-neutral-950" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
            <span className="sm:hidden">Imprimir</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Container (Desk environment with real centered A4 paper) */}
      <div className="relative flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 lg:p-12 flex justify-center bg-neutral-900/90 print:bg-white print:p-0 print:m-0 print:overflow-visible">
        {/* Floating Bottom Quick Zoom Dock */}
        <div className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-2 bg-neutral-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-neutral-750 shadow-2xl text-xs select-none">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
            className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer flex items-center gap-1"
            title="Disminuir zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="text-[11px] font-bold hidden sm:inline">-</span>
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1 font-mono font-bold text-xs">
            <button
              type="button"
              onClick={() => setZoom(35)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                zoom === 35 ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Zoom miniatura 35%"
            >
              35%
            </button>
            <button
              type="button"
              onClick={() => setZoom(50)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                zoom === 50 ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Zoom reducido 50%"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setZoom(75)}
              className={`hidden sm:inline-block px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                zoom === 75 ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Zoom medio 75%"
            >
              75%
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                zoom === 100 ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Tamaño real 100%"
            >
              100%
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer flex items-center gap-1"
            title="Aumentar zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="text-[11px] font-bold hidden sm:inline">+</span>
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            className="ml-1 px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-amber-200 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            title="Ajustar zoom al tamaño de tu pantalla"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajustar</span>
          </button>
        </div>

        <div
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="print:transform-none pb-20"
        >
          {/* Pristine A4 Sheet in Print Layout (No inputs, no edit widgets, 100% true to print) */}
          <div
            id="a4-print-sheet-preview"
            className="a4-sheet w-[210mm] min-h-[297mm] max-w-[820px] bg-white text-neutral-900 rounded-xs shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-10 sm:p-14 flex flex-col justify-between border border-neutral-300 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:min-h-0"
            style={{
              boxSizing: 'border-box',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Top Section */}
            <div className="space-y-6">
              {/* Top Row: FACTURA on the left (50%), Número y Fecha on the right (50%) in two lines, left-aligned, aligning perfectly with top/bottom of FACTURA */}
              <div className="grid grid-cols-2 gap-4 pb-4 h-[72px]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
                {/* Left 50% - FACTURA in 30% gray (#b3b3b3), left-aligned, height-matching container */}
                <div className="flex items-center justify-start h-full">
                  <h1 className="text-[72px] font-black tracking-tight uppercase leading-none" style={{ color: '#b3b3b3' }}>
                    FACTURA
                  </h1>
                </div>
                {/* Right 50% - Número & Fecha left-aligned, size x0.8 (text-[19.68px]), shifted 20px right, Fecha fixed at bottom, Número lowered with half gap */}
                <div className="flex flex-col justify-end gap-1 text-left h-full py-0">
                  <div className="text-[19.68px] font-bold text-neutral-400 leading-[1.2] translate-x-[20px]" style={{ lineHeight: '1.2', transform: 'translateX(20px)' }}>
                    Número: <span className="text-neutral-800 font-bold">{invoice.number || 'F260000'}</span>
                  </div>
                  <div className="text-[19.68px] font-bold text-neutral-400 leading-[1.2] translate-x-[20px]" style={{ lineHeight: '1.2', transform: 'translateX(20px)' }}>
                    Fecha: <span className="text-neutral-800 font-bold">{formatDate(invoice.date) || invoice.date}</span>
                  </div>
                </div>
              </div>

              {/* Two columns with Datos del Emisor on the left and Datos del Cliente on the right, both in 8px borders with rounded corners - All texts scaled x1.2 */}
              <div className="grid grid-cols-2 gap-6 w-full items-stretch">
                
                {/* Left: Emisor wrapped in a 8px rounded gray border (gris 40%) */}
                <div className="border-[8px] border-neutral-400 rounded-2xl p-4 sm:p-5 w-full text-left flex flex-col gap-2">
                  <div className="text-[15px] font-extrabold uppercase tracking-wider text-neutral-400 mb-0.5">
                    EMISOR
                  </div>
                  <div className="flex items-start gap-4">
                    {invoice.company.logoUrl && (
                      <div className="w-16 h-16 rounded-lg border border-neutral-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                        <img
                          src={invoice.company.logoUrl}
                          alt="Logo Empresa"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="space-y-1 text-[13.5px] text-neutral-700 min-w-0 flex-1 leading-normal">
                      <div className="font-extrabold text-[23px] text-neutral-950 leading-tight">
                        {invoice.company.name || 'Empresa Emisora'}
                      </div>
                      {invoice.company.cif && (
                        <div className="font-mono font-semibold text-neutral-800">
                          <span className="text-neutral-500 font-normal">CIF/NIF: </span>
                          {invoice.company.cif}
                        </div>
                      )}
                      {invoice.company.address && (
                        <div className="text-neutral-600">
                          {invoice.company.address}
                        </div>
                      )}
                      {invoice.company.phone && (
                        <div className="text-neutral-600">
                          <span className="text-neutral-500">Tel: </span>
                          {invoice.company.phone}
                        </div>
                      )}
                      {invoice.company.email && (
                        <div className="text-neutral-600">
                          <span className="text-neutral-500">Email: </span>
                          {invoice.company.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Datos del Cliente (Receptor) wrapped in a 8px rounded gray border (gris 40%) */}
                <div className="border-[8px] border-neutral-400 rounded-2xl p-4 sm:p-5 w-full text-left flex flex-col gap-2">
                  <div className="text-[15px] font-extrabold uppercase tracking-wider text-neutral-400 mb-0.5">
                    CLIENTE
                  </div>
                  <div className="space-y-1 text-[13.5px] text-neutral-700 leading-normal">
                    <div className="font-extrabold text-[23px] text-neutral-950 leading-tight">
                      {invoice.client.name || '(Sin nombre de cliente)'}
                    </div>
                    {invoice.client.nif && (
                      <div className="font-mono font-semibold text-neutral-850">
                        <span className="text-neutral-500 font-normal">CIF/NIF: </span>
                        {invoice.client.nif}
                      </div>
                    )}
                    {invoice.client.address && (
                      <div className="text-neutral-600">
                        <span className="text-neutral-500 font-normal">Domicilio: </span>
                        {invoice.client.address}
                      </div>
                    )}
                    {invoice.client.phone && (
                      <div className="text-neutral-600">
                        <span className="text-neutral-500 font-normal">Tel: </span>
                        {invoice.client.phone}
                      </div>
                    )}
                    {invoice.client.email && (
                      <div className="text-neutral-600">
                        <span className="text-neutral-500 font-normal">Email: </span>
                        {invoice.client.email}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Items Table with custom headers and 1.5x larger font sizes (padding/leading cut by half x0.5) */}
              <div className="pt-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-[16px] font-bold uppercase tracking-wider text-neutral-900 text-center">
                      <th className="py-1 px-2 text-center w-[55%]">Concepto</th>
                      <th className="py-1 px-2 text-center w-[15%]">Unidades</th>
                      <th className="py-1 px-2 text-center w-[15%]">Precio</th>
                      <th className="py-1 px-2 text-center w-[15%]">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-[18px]">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-1 px-2 text-neutral-900 font-semibold leading-tight">
                          {item.concept || '(Línea sin concepto)'}
                        </td>
                        <td className="py-1 px-2 text-center font-mono text-neutral-700">
                          {item.units || 1}
                        </td>
                        <td className="py-1 px-2 text-center font-mono text-neutral-700">
                          {formatCurrency(item.unitPrice || 0)}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-neutral-900">
                          {formatCurrency(item.total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-4 space-y-3">
              {/* Calculations Breakdown (Base Imponible, IVA, Retención, TOTAL FACTURA) - Spacing/padding cut by half x0.5 */}
              <div className="flex justify-end w-full">
                <div className="w-full sm:w-80 space-y-1 text-[18px]">
                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-600 font-medium">Base Imponible:</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {formatCurrency(baseImponible)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700 font-bold">IVA</span>
                      <span className="text-neutral-900 font-bold">
                        {invoice.ivaRate || 21}%
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-neutral-900">
                      {formatCurrency(cuotaIva)}
                    </span>
                  </div>

                  {invoice.irpfRate > 0 && (
                    <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 text-neutral-700">
                      <span className="font-medium">Retención IRPF (-{invoice.irpfRate}%):</span>
                      <span className="font-mono font-semibold text-red-600">
                        -{formatCurrency(cuotaIrpf)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-1 pb-0.5 border-t-2 border-neutral-900">
                    <span className="text-lg font-black uppercase tracking-wide text-neutral-900">
                      TOTAL FACTURA
                    </span>
                    <span className="text-2xl font-black font-mono text-neutral-950">
                      {formatCurrency(totalFactura)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Added AFTER TOTAL FACTURA: Bank details and VeriFactu block side-by-side, scaled up x1.25 */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
                
                {/* Left: Forma de pago y datos bancarios (Scaled up by 1.25 to text-[15px]) */}
                <div className="space-y-1.5 text-[15px] text-neutral-600">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-[15px]">
                    <CreditCard className="w-5 h-5 text-neutral-500" />
                    <span>Forma de pago y datos bancarios</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1 text-left">
                    {invoice.company.bankName && (
                      <div className="text-neutral-700 font-bold text-[14px]">
                        {invoice.company.bankName}
                      </div>
                    )}
                    {invoice.company.iban ? (
                      <div className="font-mono text-neutral-900 font-bold text-[15px] tracking-wider">
                        IBAN: {invoice.company.iban}
                      </div>
                    ) : (
                      <div className="text-neutral-400 italic text-[14px]">
                        Transferencia bancaria o ingreso en cuenta.
                      </div>
                    )}
                    <div className="text-[13px] text-neutral-500 pt-0.5">
                      Indicar número de factura {invoice.number} como concepto.
                    </div>
                  </div>
                </div>

                {/* Right: Official Veri*Factu Validation Block (Scaled up by 1.25) */}
                <div className="p-3.5 rounded-xl border border-neutral-300 bg-neutral-50/80 flex items-center gap-4 text-left">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-neutral-350 shrink-0 flex items-center justify-center">
                    {invoice.veriFactu?.qrDataUrl ? (
                      <img
                        src={invoice.veriFactu.qrDataUrl}
                        alt="Código QR Veri*Factu AEAT"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] sm:text-[11px] tracking-wide uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        VERI*FACTU VALIDADA
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[90px]">
                        {invoice.veriFactu?.systemId || 'SISTEMA-VERIFACTU'}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-neutral-900 leading-tight">
                      Factura verificable en sede AEAT
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-tight truncate">
                      Huella: <span className="font-mono text-neutral-700">{invoice.veriFactu?.chainHash ? `${invoice.veriFactu.chainHash.slice(0, 15)}...` : 'Validada criptográficamente'}</span>
                    </p>
                  </div>
                </div>

              </div>

              {/* Document Footnote */}
              <div className="text-center text-[9px] text-neutral-400 pt-2 border-t border-neutral-200">
                Documento mercantil emitido conforme al RD 1619/2012 y normativa Veri*Factu RD 1007/2023.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
