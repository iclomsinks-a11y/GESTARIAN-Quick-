import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Invoice } from '../types';
import {
  generateEmailInvoiceSubject,
  generateEmailInvoiceBody,
  getEmailDirectUrl,
  sendGestarianEmailNotification,
  EmailNotificationRecord,
} from '../services/notificationService';
import { formatCurrency } from '../utils/formatters';

interface EmailDispatchModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onDispatchComplete?: (record: EmailNotificationRecord) => void;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onDispatchComplete,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(invoice.client.email || '');
  const [subject, setSubject] = useState(
    generateEmailInvoiceSubject(invoice.number, invoice.company.name)
  );
  const [customNotes, setCustomNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentRecord, setSentRecord] = useState<EmailNotificationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute live totals
  const baseImponible = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * (invoice.ivaRate / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate || 0) / 100);
  const totalAmount = baseImponible + cuotaIva - cuotaIrpf;

  const emailBody = generateEmailInvoiceBody({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    clientEmail: recipientEmail,
    clientName: invoice.client.name,
    companyName: invoice.company.name,
    companyCif: invoice.company.cif,
    totalAmount,
    issueDate: invoice.date,
    veriFactuHash: invoice.veriFactu.chainHash,
    pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
    customNotes: customNotes.trim() || undefined,
  });

  const mailtoUrl = getEmailDirectUrl(recipientEmail, subject, emailBody);

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendViaGateway = async () => {
    if (!recipientEmail.trim()) {
      setErrorMessage('Por favor, indica una dirección de correo electrónico válida.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setErrorMessage('El formato de correo electrónico introducido no parece válido.');
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    try {
      const record = await sendGestarianEmailNotification({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        clientEmail: recipientEmail.trim(),
        clientName: invoice.client.name,
        companyName: invoice.company.name,
        companyCif: invoice.company.cif,
        totalAmount,
        issueDate: invoice.date,
        veriFactuHash: invoice.veriFactu.chainHash,
        pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
        customNotes: customNotes.trim() || undefined,
      });

      setSentRecord(record);
      if (onDispatchComplete) {
        onDispatchComplete(record);
      }
    } catch (err: any) {
      setErrorMessage('No se pudo procesar el envío: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenClientApp = () => {
    if (!recipientEmail.trim()) {
      setErrorMessage('Por favor, indica una dirección de correo para abrir el gestor.');
      return;
    }
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">
                  Envío de Documento por Email
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/20 font-bold">
                  Canal Email
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Factura {invoice.number} &bull; Cliente: {invoice.client.name || 'Sin especificar'} &bull; Total: {formatCurrency(totalAmount)}
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

        {/* Success Banner if already sent */}
        {sentRecord && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Documento Enviado Correctamente por Correo Electrónico
              </h4>
              <p className="text-xs text-neutral-300">
                La factura ha sido tramitada hacia <strong>{sentRecord.recipientEmail}</strong> y registrada en la auditoría de envíos de Gestarian Quick.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[65vh]">
          {/* Email configuration row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>Correo del Destinatario (Cliente) *</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="ejemplo@cliente.com"
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-sky-400 transition-colors"
              />
              <span className="text-[11px] text-neutral-500">
                Preconfigurado con la ficha fiscal del cliente.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Asunto del Mensaje</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <span className="text-[11px] text-neutral-500">
                Título oficial que verá el cliente en su bandeja de entrada.
              </span>
            </div>
          </div>

          {/* Optional notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Mensaje o Notas Personalizadas (Opcional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ej. Adjuntamos factura mensual acordada en contrato. Gracias por su confianza."
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {/* Email Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Vista Previa del Cuerpo del Correo</span>
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-400/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] sm:text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto select-all">
              {emailBody}
            </div>
          </div>

          {/* Compliance & Security badge */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verificación Veri*Factu RD 1007/2023 vinculada y encriptada en el mensaje.</span>
            </div>
            <span className="font-mono text-[10px] text-neutral-500 hidden sm:inline">
              Hash: {invoice.veriFactu.chainHash?.slice(0, 10)}...
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cerrar
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Primary Action 1: Abrir en gestor mailto */}
            <button
              type="button"
              onClick={handleOpenClientApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all active:scale-95"
              title="Abre tu aplicación predeterminada de correo (Outlook, Mail, Thunderbird, Gmail)"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Abrir en Gestor de Correo</span>
            </button>

            {/* Primary Action 2: Enviar por Pasarela Cloud */}
            <button
              type="button"
              onClick={handleSendViaGateway}
              disabled={isSending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-neutral-950 bg-sky-400 hover:bg-sky-300 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando...' : 'Enviar por Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
