import React, { useState } from 'react';
import {
  X,
  Send,
  MessageCircle,
  ShieldCheck,
  Database,
  Mail,
  Flame,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Info,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Invoice } from '../types';
import {
  formatPhoneNumberForWhatsApp,
  generateWhatsAppInvoiceMessage,
  getWhatsAppDirectUrl,
  sendGestarianWhatsAppNotification,
  WhatsAppNotificationRecord,
} from '../services/notificationService';
import { formatCurrency } from '../utils/formatters';

interface WhatsAppDispatchModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onDispatchComplete?: (record: WhatsAppNotificationRecord) => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onDispatchComplete,
}) => {
  // Pre-fill phone with client phone if available
  const [recipientPhone, setRecipientPhone] = useState(invoice.client.phone || '');
  const [countryCode, setCountryCode] = useState('+34');
  const [sendResendEmail, setSendResendEmail] = useState(Boolean(invoice.client.email));
  const [recipientEmail, setRecipientEmail] = useState(invoice.client.email || '');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentRecord, setSentRecord] = useState<WhatsAppNotificationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute live totals
  const baseImponible = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * (invoice.ivaRate / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate || 0) / 100);
  const totalAmount = baseImponible + cuotaIva - cuotaIrpf;

  // Build current message
  const fullPhone = recipientPhone.startsWith('+')
    ? recipientPhone
    : `${countryCode}${recipientPhone.replace(/^0+/, '')}`;

  const messageText = generateWhatsAppInvoiceMessage({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    clientPhone: fullPhone,
    clientName: invoice.client.name,
    clientEmail: recipientEmail,
    companyName: invoice.company.name,
    companyCif: invoice.company.cif,
    totalAmount,
    issueDate: invoice.date,
    veriFactuHash: invoice.veriFactu.chainHash,
    pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
  });

  const directWhatsAppUrl = getWhatsAppDirectUrl(fullPhone, messageText);

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendViaGateway = async () => {
    if (!recipientPhone.trim()) {
      setErrorMessage('Por favor, indica un número de teléfono para enviar el WhatsApp.');
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    try {
      const record = await sendGestarianWhatsAppNotification(
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientPhone: fullPhone,
          clientName: invoice.client.name,
          clientEmail: sendResendEmail ? recipientEmail : undefined,
          companyName: invoice.company.name,
          companyCif: invoice.company.cif,
          totalAmount,
          issueDate: invoice.date,
          veriFactuHash: invoice.veriFactu.chainHash,
          pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
        },
        {
          sendResendEmail,
          useDirectWhatsAppFallback: true,
        }
      );

      setSentRecord(record);
      if (onDispatchComplete) {
        onDispatchComplete(record);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con la pasarela de notificaciones.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenDirectWhatsApp = () => {
    if (!recipientPhone.trim()) {
      setErrorMessage('Por favor, indica un número de teléfono para abrir WhatsApp.');
      return;
    }
    // Also record dispatch in background
    sendGestarianWhatsAppNotification(
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        clientPhone: fullPhone,
        clientName: invoice.client.name,
        clientEmail: sendResendEmail ? recipientEmail : undefined,
        companyName: invoice.company.name,
        companyCif: invoice.company.cif,
        totalAmount,
        issueDate: invoice.date,
        veriFactuHash: invoice.veriFactu.chainHash,
        pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
      },
      { sendResendEmail: false }
    ).then((rec) => {
      if (onDispatchComplete) onDispatchComplete(rec);
    });

    window.open(directWhatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  NOTIFICACIONES GESTARIAN
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-700/60 text-emerald-300 rounded text-[9px] font-mono">
                  RD 1007/2023
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100">
                Enviar Factura {invoice.number} por WhatsApp
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Architecture Services Connected Ribbon */}
        <div className="px-5 sm:px-7 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-neutral-400 font-medium">Arquitectura conectada:</span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              notificaciones.gestarian.com
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Database className="w-3 h-3 text-emerald-400" />
              Supabase
            </span>
            <span className="inline-flex items-center gap-1 text-sky-300">
              <Mail className="w-3 h-3 text-sky-400" />
              Resend
            </span>
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Flame className="w-3 h-3 text-amber-400" />
              Firebase
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {sentRecord ? (
            /* Sent Confirmation View */
            <div className="space-y-6 py-2">
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-600/50 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-300">
                  Notificación enviada y registrada con éxito
                </h3>
                <p className="text-xs text-neutral-300 max-w-md">
                  La factura <strong className="text-white">{invoice.number}</strong> ({formatCurrency(totalAmount)}) ha sido tramitada a través de la arquitectura de Notificaciones Gestarian hacia el número <strong className="text-emerald-400">{sentRecord.recipientPhone}</strong>.
                </p>
              </div>

              {/* Multi-service audit log details */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block border-b border-neutral-800 pb-1.5">
                  Resumen de Conexiones y Auditoría
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Gateway WhatsApp:
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {sentRecord.services.whatsappGateway.endpoint}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      Supabase (tabla):
                    </span>
                    <span className="font-mono text-neutral-200">
                      {sentRecord.services.supabase.table} (OK)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      Resend Email Backup:
                    </span>
                    <span className="font-mono text-sky-300">
                      {sentRecord.services.resend.status === 'sent' ? 'Entregado' : 'Opcional'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Firebase Trace:
                    </span>
                    <span className="font-mono text-amber-300 text-[10px] truncate max-w-[130px]">
                      {sentRecord.services.firebase.traceId}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>ID de Despacho: <code className="text-neutral-200">{sentRecord.id}</code></span>
                  <span>{new Date(sentRecord.createdAt).toLocaleTimeString('es-ES')}</span>
                </div>
              </div>

              {/* Action buttons after send */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={sentRecord.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir en WhatsApp (App / Web)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            /* Input & Live Preview View */
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Destination inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Teléfono del Destinatario (WhatsApp)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-200 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="+34">🇪🇸 +34 (España)</option>
                      <option value="+351">🇵🇹 +351 (Portugal)</option>
                      <option value="+33">🇫🇷 +33 (Francia)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+49">🇩🇪 +49 (Alemania)</option>
                      <option value="+1">🇺🇸 +1 (USA)</option>
                      <option value="+52">🇲🇽 +52 (México)</option>
                      <option value="+54">🇦🇷 +54 (Argentina)</option>
                      <option value="+57">🇨🇴 +57 (Colombia)</option>
                      <option value="+56">🇨🇱 +56 (Chile)</option>
                    </select>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="612 34 56 78"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-stone-100 placeholder-neutral-500 font-mono focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    Cliente: {invoice.client.name || 'Sin nombre'}
                  </span>
                </div>

                {/* Email for Resend backup */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Copia Resend (Email)</span>
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendResendEmail}
                        onChange={(e) => setSendResendEmail(e.target.checked)}
                        className="rounded border-neutral-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Enviar copia</span>
                    </label>
                  </div>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    disabled={!sendResendEmail}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-stone-100 placeholder-neutral-500 focus:border-sky-400 focus:outline-none disabled:opacity-40"
                  />
                  <span className="text-[10px] text-neutral-500 block">
                    Respaldo sincronizado vía Resend API
                  </span>
                </div>
              </div>

              {/* WhatsApp Message Preview Bubble */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vista Previa del Mensaje de WhatsApp</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-[11px] text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#0b141a] border border-[#1f2c34] text-neutral-100 shadow-inner relative">
                  {/* WhatsApp chat bubble */}
                  <div className="max-w-md bg-[#005c4b] text-stone-100 p-3.5 rounded-2xl rounded-tl-sm text-xs space-y-2 shadow">
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-[12px]">
                      {messageText}
                    </div>
                    <div className="flex justify-end items-center gap-1 text-[10px] text-emerald-200/70 pt-1">
                      <span>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Full Architecture Dispatch via notificaciones.gestarian.com */}
                  <button
                    type="button"
                    id="btn-dispatch-gestarian-whatsapp"
                    disabled={isSending}
                    onClick={handleSendViaGateway}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                        <span>Transmitiendo a notificaciones...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar vía Notificaciones Gestarian</span>
                      </>
                    )}
                  </button>

                  {/* Option 2: Direct WhatsApp Web / App Launch */}
                  <button
                    type="button"
                    id="btn-open-direct-whatsapp"
                    onClick={handleOpenDirectWhatsApp}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-neutral-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#25D366]/20 active:scale-[0.98] cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir WhatsApp Directo (Web / App)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 text-center">
                  Al enviar, se crea la huella digital en Firebase, el registro de auditoría en Supabase y el despacho oficial desde <span className="text-emerald-400 font-mono">notificaciones.gestarian.com</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
