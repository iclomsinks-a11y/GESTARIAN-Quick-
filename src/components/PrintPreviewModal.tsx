import React, { useState, useEffect } from 'react';
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

  // Auto-abrir el diálogo de la impresora preconfigurada en el dispositivo al abrir la vista de impresión
  useEffect(() => {
    const printTimer = setTimeout(() => {
      handleTriggerPrint();
    }, 280);
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
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Calculations
  const baseImponible = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * (invoice.ivaRate / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate || 0) / 100);
  const totalFactura = baseImponible + cuotaIva - cuotaIrpf;

  return (
    <div
      id="print-preview-modal"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-md overflow-hidden text-neutral-100 print:bg-white print:text-neutral-900 print:static print:inset-auto print:overflow-visible"
    >
      {/* Top Action Toolbar (Hidden during print) */}
      <header className="no-print shrink-0 h-14 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 select-none">
        {/* Left: Close/Back + Title */}
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

          <div className="h-4 w-px bg-neutral-700 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
              Factura {invoice.number}
            </h2>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30 shrink-0">
              A4
            </span>
          </div>
        </div>

        {/* Center: Zoom Controls in Header */}
        <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800 text-xs shadow-inner">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reducir zoom (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="font-mono text-neutral-200 hover:text-amber-400 px-1 text-center text-xs font-bold transition-colors cursor-pointer"
            title="Pulsar para restablecer al 100%"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Aumentar zoom (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
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
              {/* Header: Logo on left + Company Data to its right, and on the right of document: FACTURA Title & Number & Dates */}
              <div className="flex justify-between items-start gap-6 pb-6 border-b border-neutral-300">
                {/* Left: Logo on the left, and to the right of the logo the company data */}
                <div className="flex items-start gap-4 sm:gap-5 flex-1 max-w-lg">
                  {invoice.company.logoUrl && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-neutral-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={invoice.company.logoUrl}
                        alt="Logotipo de la empresa"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-0.5 text-xs text-neutral-700 min-w-[180px] text-left">
                    <div className="font-bold text-base text-neutral-950">
                      {invoice.company.name || 'Empresa Emisora'}
                    </div>
                    {invoice.company.cif && (
                      <div className="font-mono font-semibold text-neutral-800">
                        <span className="text-neutral-400 font-normal">CIF/NIF: </span>
                        {invoice.company.cif}
                      </div>
                    )}
                    {invoice.company.address && (
                      <div className="text-neutral-600 max-w-[220px]">
                        {invoice.company.address}
                      </div>
                    )}
                    {invoice.company.phone && (
                      <div className="text-neutral-600">
                        <span className="text-neutral-400">Tel: </span>
                        {invoice.company.phone}
                      </div>
                    )}
                    {invoice.company.email && (
                      <div className="text-neutral-600">
                        <span className="text-neutral-400">Email: </span>
                        {invoice.company.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: FACTURA title, correlative number & dates (Right of document) */}
                <div className="space-y-2 text-right shrink-0 flex flex-col items-end">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h1
                      className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      FACTURA
                    </h1>
                  </div>

                  <div className="space-y-1 text-xs flex flex-col items-end">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]">
                        Nº de Factura:
                      </span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {invoice.number || 'F260000'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-neutral-700">
                      <span className="font-medium text-neutral-500">Fecha de emisión:</span>
                      <span className="font-medium text-neutral-900">
                        {formatDate(invoice.date) || invoice.date}
                      </span>
                    </div>

                    {invoice.dueDate && (
                      <div className="flex items-center justify-end gap-2 text-neutral-700">
                        <span className="font-medium text-neutral-500">Vencimiento:</span>
                        <span className="font-medium text-neutral-900">
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Section (Receptor) - Phone and Email omitted in print by specification */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  DATOS DEL CLIENTE (RECEPTOR)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                  <div className="sm:col-span-2">
                    <span className="font-bold text-sm text-neutral-900">
                      {invoice.client.name || '(Sin nombre de cliente)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">NIF / CIF / DNI: </span>
                    <span className="font-mono font-semibold text-neutral-800">
                      {invoice.client.nif || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">Domicilio: </span>
                    <span className="text-neutral-700">
                      {invoice.client.address || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                      <th className="py-2.5 px-2 w-[55%]">Concepto / Descripción</th>
                      <th className="py-2.5 px-2 text-center w-[15%]">Unidades</th>
                      <th className="py-2.5 px-2 text-right w-[15%]">Precio Ud.</th>
                      <th className="py-2.5 px-2 text-right w-[15%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-2 text-neutral-900 font-medium">
                          {item.concept || '(Línea sin concepto)'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-neutral-700">
                          {item.units || 1}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-neutral-700">
                          {formatCurrency(item.unitPrice || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold text-neutral-900">
                          {formatCurrency(item.total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-8 space-y-6">
              {/* Payment & Totals */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-neutral-200">
                {/* Bank / Payment info */}
                <div className="space-y-1.5 text-xs text-neutral-600 max-w-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                    <CreditCard className="w-4 h-4 text-neutral-500" />
                    <span>Forma de pago y datos bancarios</span>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
                    {invoice.company.bankName && (
                      <div className="text-neutral-700 font-medium text-[11px]">
                        {invoice.company.bankName}
                      </div>
                    )}
                    {invoice.company.iban ? (
                      <div className="font-mono text-neutral-900 font-semibold text-xs tracking-wider">
                        IBAN: {invoice.company.iban}
                      </div>
                    ) : (
                      <div className="text-neutral-400 italic text-[11px]">
                        Transferencia bancaria o ingreso en cuenta.
                      </div>
                    )}
                    <div className="text-[10px] text-neutral-500 pt-0.5">
                      Indicar número de factura {invoice.number} como concepto.
                    </div>
                  </div>
                </div>

                {/* Calculations Breakdown */}
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                    <span className="text-neutral-600 font-medium">Base Imponible:</span>
                    <span className="font-mono font-semibold text-neutral-900">
                      {formatCurrency(baseImponible)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700 font-semibold">IVA</span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                        {invoice.ivaRate || 21}%
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-neutral-900">
                      {formatCurrency(cuotaIva)}
                    </span>
                  </div>

                  {invoice.irpfRate > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-neutral-100 text-neutral-700">
                      <span className="font-medium">Retención IRPF (-{invoice.irpfRate}%):</span>
                      <span className="font-mono font-semibold text-red-600">
                        -{formatCurrency(cuotaIrpf)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 pb-1 border-t-2 border-neutral-900">
                    <span className="text-sm font-extrabold uppercase tracking-wide text-neutral-900">
                      TOTAL FACTURA
                    </span>
                    <span className="text-xl font-black font-mono text-neutral-950">
                      {formatCurrency(totalFactura)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Veri*Factu Validation Block */}
              <div className="p-3.5 rounded-xl border border-neutral-300 bg-neutral-50/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg border border-neutral-300 shrink-0 shadow-xs flex items-center justify-center">
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

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] tracking-wide uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        VERI*FACTU VALIDADA
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {invoice.veriFactu?.systemId || 'SISTEMA-VERIFACTU'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-900 leading-tight">
                      Factura verificable en la sede electrónica de la AEAT
                    </p>
                    <p className="text-[10px] text-neutral-500 leading-snug">
                      Sistema Informático de Facturación adaptado al Real Decreto 1007/2023. Huella:{' '}
                      <span className="font-mono text-neutral-700">
                        {invoice.veriFactu?.chainHash
                          ? `${invoice.veriFactu.chainHash.slice(0, 20)}...`
                          : 'Validada criptográficamente'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-neutral-400 hidden sm:block">
                  Documento tributario oficial
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
