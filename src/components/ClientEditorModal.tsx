import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Hash,
  MapPin,
  Phone,
  Mail,
  X,
  Save,
  MessageCircle,
  FileText,
  Check,
  Sliders,
} from 'lucide-react';
import { ClientData, ClientDispatchChannel } from '../types';
import { saveClientToDb } from '../utils/database';

export type ClientInputField = 'name' | 'nif' | 'address' | 'phone' | 'email' | 'notes';

interface ClientEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData;
  initialField?: ClientInputField;
  onSave: (updatedClient: ClientData) => void;
}

export const ClientEditorModal: React.FC<ClientEditorModalProps> = ({
  isOpen,
  onClose,
  client,
  initialField = 'name',
  onSave,
}) => {
  const [formData, setFormData] = useState<ClientData>({
    ...client,
    preferredDispatchChannel:
      client.preferredDispatchChannel ||
      (client.defaultSendEmail && !client.defaultSendWhatsApp ? 'email' : 'whatsapp'),
    defaultSendWhatsApp: client.defaultSendWhatsApp ?? true,
    defaultSendEmail: client.defaultSendEmail ?? false,
    enableComplexInvoice: client.enableComplexInvoice ?? false,
  });
  const [activeField, setActiveField] = useState<ClientInputField>(initialField);

  // References to the inputs
  const inputRefs = {
    name: useRef<HTMLInputElement>(null),
    nif: useRef<HTMLInputElement>(null),
    address: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    notes: useRef<HTMLInputElement>(null),
  };

  // Sync with incoming client prop when modal opens
  useEffect(() => {
    if (isOpen) {
      const preferred =
        client.preferredDispatchChannel ||
        (client.defaultSendEmail && !client.defaultSendWhatsApp ? 'email' : 'whatsapp');
      setFormData({
        ...client,
        preferredDispatchChannel: preferred,
        defaultSendWhatsApp: preferred === 'whatsapp',
        defaultSendEmail: preferred === 'email',
        enableComplexInvoice: client.enableComplexInvoice ?? false,
      });
      setActiveField(initialField || 'name');
    }
  }, [isOpen, client, initialField]);

  // Ensure selected input is focused when modal opens or active field changes
  useEffect(() => {
    if (isOpen && inputRefs[activeField]?.current) {
      const el = inputRefs[activeField].current;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeField, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: ClientInputField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'nif' ? value.toUpperCase() : value,
    }));
  };

  const handleSelectChannel = (channel: ClientDispatchChannel) => {
    setFormData((prev) => ({
      ...prev,
      preferredDispatchChannel: channel,
      defaultSendWhatsApp: channel === 'whatsapp',
      defaultSendEmail: channel === 'email',
    }));
  };

  const handleSave = () => {
    saveClientToDb(formData);
    onSave(formData);
    onClose();
  };

  const currentPreferred =
    formData.preferredDispatchChannel ||
    (formData.defaultSendEmail && !formData.defaultSendWhatsApp ? 'email' : 'whatsapp');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden"
    >
      <div className="flex-1 w-full flex flex-col bg-neutral-950 shadow-2xl relative overflow-hidden">
        {/* Top Bar with Title and Actions */}
        <div className="px-4 py-3 sm:py-3.5 border-b border-neutral-800/80 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start">
              <h1
                className="text-base sm:text-lg font-thin tracking-[0.25em] uppercase leading-none select-none text-[#FEFCE9]"
                style={{ fontFamily: "'Montserrat', 'Cinzel', sans-serif" }}
              >
                GESTARIAN
              </h1>
              <span
                className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400 self-end"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", marginTop: '2px' }}
              >
                Quick
              </span>
            </div>
            <span className="text-[11px] font-medium text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-semibold">
              Editar Cliente
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button in Top Bar */}
            <button
              type="button"
              id="client-editor-save-btn"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-neutral-950" />
              <span>Guardar</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white border border-neutral-700 active:scale-95 transition-colors cursor-pointer"
              title="Cerrar sin guardar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list of inputs and preferred dispatch config */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 max-w-2xl mx-auto w-full">
          {/* INPUT 1: NOMBRE COMPLETO / RAZÓN SOCIAL */}
          <div
            onClick={() => inputRefs.name.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'name'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.name}
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onFocus={() => setActiveField('name')}
              placeholder="Ej. Juan Pérez / Empresa S.L."
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-bold text-white placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <User className={`w-4 h-4 ${activeField === 'name' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'name' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Nombre
              </span>
            </div>
          </div>

          {/* INPUT 2: CIF / NIF / DNI */}
          <div
            onClick={() => inputRefs.nif.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'nif'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.nif}
              type="text"
              value={formData.nif}
              onChange={(e) => handleFieldChange('nif', e.target.value)}
              onFocus={() => setActiveField('nif')}
              placeholder="Ej. B12345678 o 12345678Z"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-mono font-bold text-amber-300 placeholder-neutral-500 pr-3 uppercase"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <Hash className={`w-4 h-4 ${activeField === 'nif' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'nif' ? 'text-sky-400' : 'text-neutral-400'}`}>
                NIF/CIF
              </span>
            </div>
          </div>

          {/* INPUT 3: DIRECCIÓN FISCAL */}
          <div
            onClick={() => inputRefs.address.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'address'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.address}
              type="text"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onFocus={() => setActiveField('address')}
              placeholder="Ej. Calle Gran Vía 28, 28013 Madrid"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-semibold text-white placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <MapPin className={`w-4 h-4 ${activeField === 'address' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'address' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Dirección
              </span>
            </div>
          </div>

          {/* INPUT 4: TELÉFONO */}
          <div
            onClick={() => inputRefs.phone.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'phone'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.phone}
              type="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onFocus={() => setActiveField('phone')}
              placeholder="Ej. +34 612 345 678"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-mono font-bold text-emerald-300 placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <Phone className={`w-4 h-4 ${activeField === 'phone' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'phone' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Teléfono
              </span>
            </div>
          </div>

          {/* INPUT 5: CORREO ELECTRÓNICO */}
          <div
            onClick={() => inputRefs.email.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'email'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.email}
              type="email"
              inputMode="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onFocus={() => setActiveField('email')}
              placeholder="Ej. administracion@cliente.com"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-semibold text-sky-300 placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <Mail className={`w-4 h-4 ${activeField === 'email' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'email' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Email
              </span>
            </div>
          </div>

          {/* INPUT 6: DOMICILIO FISCAL / OBSERVACIONES */}
          <div
            onClick={() => inputRefs.notes.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'notes'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.notes}
              type="text"
              value={formData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              onFocus={() => setActiveField('notes')}
              placeholder="Domicilio fiscal u observaciones"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base font-normal text-white placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <FileText className={`w-4 h-4 ${activeField === 'notes' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'notes' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Observaciones
              </span>
            </div>
          </div>

          {/* CASILLA DE ENVÍO PREFERENTE: WHATSAPP O EMAIL */}
          <div className="pt-2">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span>Envío Preferente de Factura</span>
                </span>
                <span className="text-[11px] text-neutral-400">
                  Activa el botón directo debajo de la hoja A4
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Selecciona la casilla preferente para este cliente. Al abrir la edición de factura, debajo de la hoja A4 aparecerá el botón de envío configurado (WhatsApp o Email) tras pulsar Guardar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Casilla 1: WhatsApp */}
                <label
                  onClick={() => handleSelectChannel('whatsapp')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    currentPreferred === 'whatsapp'
                      ? 'bg-[#25D366]/15 border-[#25D366] ring-1 ring-[#25D366]/40'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="radio"
                      name="preferredDispatchChannel"
                      checked={currentPreferred === 'whatsapp'}
                      onChange={() => handleSelectChannel('whatsapp')}
                      className="accent-[#25D366] w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" style={{ color: '#25D366' }} />
                      <span className="text-sm font-bold text-white">WhatsApp</span>
                      {currentPreferred === 'whatsapp' && (
                        <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] font-bold px-1.5 py-0.5 rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Envío instantáneo por chat con PDF adjunto al número {formData.phone || 'del cliente'}.
                    </p>
                  </div>
                </label>

                {/* Casilla 2: Email */}
                <label
                  onClick={() => handleSelectChannel('email')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    currentPreferred === 'email'
                      ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400/40'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="radio"
                      name="preferredDispatchChannel"
                      checked={currentPreferred === 'email'}
                      onChange={() => handleSelectChannel('email')}
                      className="accent-sky-400 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-sm font-bold text-white">Correo Electrónico</span>
                      {currentPreferred === 'email' && (
                        <span className="text-[10px] bg-sky-400/20 text-sky-300 font-bold px-1.5 py-0.5 rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Envío formal con factura PDF adjunta a {formData.email || 'la dirección de correo'}.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action buttons at bottom */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-neutral-950" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
