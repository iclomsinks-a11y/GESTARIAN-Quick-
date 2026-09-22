import React from 'react';
import {
  ShieldCheck,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  X,
  Lock,
  FileCheck2,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { notifyVeriFactuVerificationSuccess } from '../services/notificationService';

interface VeriFactuModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

export const VeriFactuModal: React.FC<VeriFactuModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [copied, setCopied] = React.useState(false);

  const total = invoice ? invoice.items.reduce((s, it) => s + (it.total || 0), 0) * (1 + invoice.ivaRate / 100) : 0;

  React.useEffect(() => {
    if (isOpen && invoice?.number) {
      notifyVeriFactuVerificationSuccess({
        invoiceNumber: invoice.number,
        clientName: invoice.client?.name,
        totalAmount: total,
        chainHash: invoice.veriFactu?.chainHash,
      });
    }
  }, [isOpen, invoice?.number]);

  if (!isOpen) return null;

  const handleCopyHash = () => {
    if (invoice.veriFactu.chainHash) {
      navigator.clipboard.writeText(invoice.veriFactu.chainHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      id="verifactu-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-emerald-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                Validación Veri*Factu (AEAT)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold uppercase">
                  Conforme RD 1007/2023
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Sistema Informático de Facturación Verificable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Badge */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-950">
              <p className="font-semibold text-sm">Registro de Factura Válido y Firmado Digitalmente</p>
              <p className="text-emerald-800 mt-0.5">
                Esta factura contiene el código QR normativo y la huella criptográfica encadenada requerida por la Agencia Tributaria.
              </p>
            </div>
          </div>

          {/* QR Code and Scan Details */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-neutral-300 shadow-sm shrink-0 flex items-center justify-center">
              {invoice.veriFactu.qrDataUrl ? (
                <img
                  src={invoice.veriFactu.qrDataUrl}
                  alt="QR Veri*Factu"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-12 h-12 text-neutral-400" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-semibold">
                  URL de Verificación Oficial AEAT
                </span>
                <a
                  href={invoice.veriFactu.verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 hover:text-amber-900 font-mono text-[11px] underline break-all inline-flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate max-w-[280px]">
                    {invoice.veriFactu.verificationUrl}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
              <p className="text-neutral-500 text-[11px]">
                Cualquier destinatario puede apuntar con la cámara de su teléfono inteligente al código QR para comprobar la autenticidad e inalterabilidad del documento en la Agencia Tributaria.
              </p>
            </div>
          </div>

          {/* Cryptographic Hash Parameters */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              Parámetros del Registro de Facturación
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Nº Factura Correlativo</span>
                <span className="font-mono font-bold text-neutral-900">{invoice.number}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Fecha de Expedición</span>
                <span className="font-medium text-neutral-900">{formatDate(invoice.date)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">NIF/CIF Emisor</span>
                <span className="font-mono font-bold text-neutral-900">{invoice.company.cif || 'No especificado'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-400 text-[10px] block">Importe Total con IVA</span>
                <span className="font-mono font-bold text-neutral-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* SHA-256 Chain Hash */}
            <div className="p-3 rounded-lg bg-neutral-900 text-neutral-100 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-400 text-[10px] mb-1">
                <span>HUELLA CRIPTOGRÁFICA SHA-256 (CHAIN HASH)</span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="hover:text-white flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="break-all text-amber-300 font-mono text-[11px]">
                {invoice.veriFactu.chainHash || 'Calculando firma criptográfica...'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
