import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  UserPlus,
  Building,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  ArrowLeft,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { ClientData } from '../types';

interface NewClientFullScreenFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: ClientData, assignToCurrentInvoice: boolean) => void;
  initialData?: Partial<ClientData>;
}

export const NewClientFullScreenForm: React.FC<NewClientFullScreenFormProps> = ({
  isOpen,
  onClose,
  onSaveClient,
  initialData,
}) => {
  const [formData, setFormData] = useState<ClientData>({
    name: initialData?.name || '',
    nif: initialData?.nif || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
    defaultSendWhatsApp: initialData?.defaultSendWhatsApp ?? true,
    defaultSendEmail: initialData?.defaultSendEmail ?? false,
    preferredDispatchChannel: initialData?.preferredDispatchChannel || 'whatsapp',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre o razón social es obligatorio';
    }
    if (!formData.nif.trim()) {
      newErrors.nif = 'El NIF / CIF / DNI es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (assignToInvoice: boolean) => {
    if (!validate()) return;
    const finalWhatsApp = Boolean(formData.defaultSendWhatsApp);
    const finalEmail = Boolean(formData.defaultSendEmail);
    const preferredChannel =
      finalWhatsApp && finalEmail
        ? 'both'
        : finalWhatsApp
        ? 'whatsapp'
        : finalEmail
        ? 'email'
        : 'whatsapp';

    onSaveClient(
      {
        ...formData,
        name: formData.name.trim(),
        nif: formData.nif.trim().toUpperCase(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        defaultSendWhatsApp: finalWhatsApp,
        defaultSendEmail: finalEmail,
        preferredDispatchChannel: preferredChannel,
      },
      assignToInvoice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md overflow-y-auto flex flex-col animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-neutral-950/95 border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="h-4 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Nuevo Cliente (Ficha A4)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* A4 Paper Document Container (Same styling as A4InvoiceDocument) */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full max-w-[210mm] mx-auto p-4 sm:p-8 my-4 sm:my-8 bg-white text-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg relative flex flex-col justify-between"
      >
        <div className="space-y-8">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-neutral-900 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Alta en Base de Datos
                </span>
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Veri*Factu Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extralight uppercase tracking-wider text-neutral-900 mt-2">
                Ficha de Cliente
              </h1>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[11px] font-mono text-neutral-500 block">DOCUMENTO FISCAL</span>
              <span className="text-xs font-bold text-neutral-800">REGISTRO DE RECEPTOR</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(true);
            }}
            className="space-y-6"
          >
            {/* Row 1: Nombre / Razón Social & NIF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nombre Completo o Razón Social *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Ej. Construcciones y Reformas Ibérica S.A."
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  autoFocus
                />
                {errors.name && (
                  <span className="text-xs text-red-600 font-medium block">{errors.name}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>NIF / CIF / DNI *</span>
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => {
                    setFormData({ ...formData, nif: e.target.value.toUpperCase() });
                    if (errors.nif) setErrors({ ...errors, nif: '' });
                  }}
                  placeholder="Ej. B88994411"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono uppercase font-bold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                {errors.nif && (
                  <span className="text-xs text-red-600 font-medium block">{errors.nif}</span>
                )}
              </div>
            </div>

            {/* Row 2: Dirección Fiscal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Dirección Fiscal Completa</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej. Paseo de Gracia 14, Planta 3ª, 08007 Barcelona"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Row 3: Teléfono y Correo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Teléfono de Contacto</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej. +34 932 110 099"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                <span className="text-[11px] text-neutral-500">
                  Visible en pantalla del dispositivo para consulta; omitido al imprimir.
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej. administracion@cliente.es"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                <span className="text-[11px] text-neutral-500">
                  Visible en pantalla del dispositivo; omitido al imprimir.
                </span>
              </div>
            </div>

            {/* Row 4: Canal de Envío Preferente */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-600" />
                    <span>Envío de Documentos por Defecto</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Seleccione el medio preferente para remitir facturas y presupuestos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WhatsApp Checkbox */}
                <label
                  htmlFor="new-client-whatsapp"
                  className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    formData.defaultSendWhatsApp
                      ? 'bg-emerald-50 border-emerald-600 text-neutral-900 shadow-sm'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id="new-client-whatsapp"
                      checked={Boolean(formData.defaultSendWhatsApp)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          defaultSendWhatsApp: isChecked,
                          preferredDispatchChannel:
                            isChecked && prev.defaultSendEmail
                              ? 'both'
                              : isChecked
                              ? 'whatsapp'
                              : prev.defaultSendEmail
                              ? 'email'
                              : 'whatsapp',
                        }));
                      }}
                      className="w-5 h-5 rounded border-neutral-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">WhatsApp Predeterminado</span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Envío instantáneo de enlace y huella Veri*Factu.
                    </span>
                  </div>
                </label>

                {/* Email Checkbox */}
                <label
                  htmlFor="new-client-email"
                  className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    formData.defaultSendEmail
                      ? 'bg-sky-50 border-sky-600 text-neutral-900 shadow-sm'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id="new-client-email"
                      checked={Boolean(formData.defaultSendEmail)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          defaultSendEmail: isChecked,
                          preferredDispatchChannel:
                            isChecked && prev.defaultSendWhatsApp
                              ? 'both'
                              : isChecked
                              ? 'email'
                              : prev.defaultSendWhatsApp
                              ? 'whatsapp'
                              : 'email',
                        }));
                      }}
                      className="w-5 h-5 rounded border-neutral-400 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">Correo Electrónico Predeterminado</span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Remisión oficial con desglose digital.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Row 5: Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <span>Notas Internas (Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Persona de contacto, observaciones..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition-colors"
                >
                  Solo Guardar en BD
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar y Asignar a Factura</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
