import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, MessageCircle, Mail, Sliders, Package } from 'lucide-react';
import { ClientData } from '../types';
import { centerInTop60Viewer } from '../utils/scrollHelpers';

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
    enableComplexInvoice: initialData?.enableComplexInvoice ?? false,
    enableProductsCatalog: initialData?.enableProductsCatalog ?? false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!formData.nif.trim()) {
      newErrors.nif = 'El DNI/CIF/NIF es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (assignToInvoice: boolean) => {
    if (!validate()) return;
    onSaveClient(
      {
        ...formData,
        name: formData.name.trim(),
        nif: formData.nif.trim().toUpperCase(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      },
      assignToInvoice
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar: GESTARIAN Quick & Close */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 shrink-0 bg-neutral-950">
        <div className="flex flex-col items-start">
          <h1
            className="text-lg sm:text-xl font-thin tracking-[0.25em] uppercase leading-none select-none text-[#FEFCE9]"
            style={{ fontFamily: "'Montserrat', 'Cinzel', sans-serif" }}
          >
            GESTARIAN
          </h1>
          <span
            className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 self-end"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", marginTop: '2px' }}
          >
            Quick
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content: Minimalist Form, No Wrappers, Double Font Sizes */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-12 space-y-8 pb-[45vh]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(true);
          }}
          className="space-y-8"
        >
          {/* Nombre */}
          <div>
            <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
                placeholder="Nombre o Razón Social"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
                autoFocus
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
                Nombre
              </span>
            </div>
            {errors.name && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.name}</span>}
          </div>

          {/* DNI/CIF/NIF */}
          <div>
            <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => {
                  setFormData({ ...formData, nif: e.target.value.toUpperCase() });
                  if (errors.nif) setErrors({ ...errors, nif: '' });
                }}
                onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
                placeholder="DNI, CIF o NIF"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-amber-300 uppercase placeholder-neutral-600 pr-3"
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
                CIF / NIF
              </span>
            </div>
            {errors.nif && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.nif}</span>}
          </div>

          {/* Teléfono */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="Teléfono de contacto"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-emerald-300 placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Teléfono
            </span>
          </div>

          {/* Email */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="Correo electrónico"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-sky-300 placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Email
            </span>
          </div>

          {/* Dirección */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="Dirección completa"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Dirección
            </span>
          </div>

          {/* Domicilio fiscal */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="Domicilio fiscal u observaciones"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[18px] sm:text-xl font-extrabold text-white placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Domicilio Fiscal
            </span>
          </div>

          {/* Casilla de Envío Preferente: WhatsApp o Email */}
          <div className="pt-2">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Envío Preferente de Factura
                </span>
                <span className="text-[11px] text-neutral-400">
                  Activa el botón directo bajo la hoja A4
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Selecciona cómo prefiere recibir las facturas este cliente. Al guardar la factura, se activará el botón directo de envío correspondiente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferredDispatchChannel: 'whatsapp',
                      defaultSendWhatsApp: true,
                      defaultSendEmail: false,
                    })
                  }
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    (formData.preferredDispatchChannel || 'whatsapp') === 'whatsapp'
                      ? 'bg-[#25D366]/15 border-[#25D366] ring-1 ring-[#25D366]/40'
                      : 'bg-neutral-950 border-neutral-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="radio"
                    checked={(formData.preferredDispatchChannel || 'whatsapp') === 'whatsapp'}
                    onChange={() => {}}
                    className="accent-[#25D366] mt-1 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" style={{ color: '#25D366' }} />
                      <span className="text-sm font-bold text-white">WhatsApp</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Envío directo por chat de WhatsApp</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      preferredDispatchChannel: 'email',
                      defaultSendWhatsApp: false,
                      defaultSendEmail: true,
                    })
                  }
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.preferredDispatchChannel === 'email'
                      ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400/40'
                      : 'bg-neutral-950 border-neutral-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="radio"
                    checked={formData.preferredDispatchChannel === 'email'}
                    onChange={() => {}}
                    className="accent-sky-400 mt-1 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-sky-400" />
                      <span className="text-sm font-bold text-white">Correo Electrónico</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Envío formal por email con PDF adjunto</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Botón Línea Compleja en Facturas Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Botón Línea Compleja en Facturas</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    enableComplexInvoice: !prev.enableComplexInvoice,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  formData.enableComplexInvoice
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    formData.enableComplexInvoice
                      ? 'bg-neutral-950 border-neutral-950 text-amber-400'
                      : 'bg-neutral-700 border-neutral-600'
                  }`}
                >
                  {formData.enableComplexInvoice && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{formData.enableComplexInvoice ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Controla si el botón <strong>«Línea Compleja ▾»</strong> aparece en la hoja A4 al emitir facturas a este cliente. Si está desactivado, no se muestra en la factura.
            </p>
          </div>

          {/* Botón Añadir Producto en Facturas Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Botón Añadir Producto en Facturas</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    enableProductsCatalog: !prev.enableProductsCatalog,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  formData.enableProductsCatalog
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    formData.enableProductsCatalog
                      ? 'bg-neutral-950 border-neutral-950 text-amber-400'
                      : 'bg-neutral-700 border-neutral-600'
                  }`}
                >
                  {formData.enableProductsCatalog && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{formData.enableProductsCatalog ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Controla si el botón <strong>«Añadir Producto»</strong> aparece en la hoja A4 al emitir facturas a este cliente.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-base font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-xl active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
