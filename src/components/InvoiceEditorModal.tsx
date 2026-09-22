import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Hash,
  FileCheck,
  DollarSign,
  X,
  Save,
} from 'lucide-react';
import { Invoice } from '../types';

export type InvoiceInputField = 'clientName' | 'clientNif' | 'concept' | 'unitPrice';

interface InvoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  initialField?: InvoiceInputField;
  onSave: (updatedInvoice: Invoice) => void;
}

export const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  isOpen,
  onClose,
  invoice,
  initialField = 'clientName',
  onSave,
}) => {
  const [formData, setFormData] = useState<Invoice>({
    ...invoice,
    client: { ...invoice.client },
    items: invoice.items?.length ? [...invoice.items] : [{ id: 'item-1', concept: '', units: 1, unitPrice: 0, total: 0 }],
  });

  const [activeField, setActiveField] = useState<InvoiceInputField>(initialField);

  const inputRefs = {
    clientName: useRef<HTMLInputElement>(null),
    clientNif: useRef<HTMLInputElement>(null),
    concept: useRef<HTMLInputElement>(null),
    unitPrice: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...invoice,
        client: { ...invoice.client },
        items: invoice.items?.length ? [...invoice.items] : [{ id: 'item-1', concept: '', units: 1, unitPrice: 0, total: 0 }],
      });
      setActiveField(initialField || 'clientName');
    }
  }, [isOpen, invoice, initialField]);

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

  const handleFieldChange = (field: InvoiceInputField, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, client: { ...prev.client }, items: [...prev.items] };
      switch (field) {
        case 'clientName':
          updated.client.name = value;
          break;
        case 'clientNif':
          updated.client.nif = value.toUpperCase();
          break;
        case 'concept':
          if (updated.items.length > 0) {
            updated.items[0] = { ...updated.items[0], concept: value };
          }
          break;
        case 'unitPrice':
          if (updated.items.length > 0) {
            const num = parseFloat(value) || 0;
            const units = updated.items[0].units || 1;
            updated.items[0] = { ...updated.items[0], unitPrice: num, total: num * units };
          }
          break;
      }
      return updated;
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

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
              Editar Factura
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="invoice-editor-save-btn"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-neutral-950" />
              <span>Guardar</span>
            </button>

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

        {/* Scrollable list of inputs using default device keyboard */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 max-w-2xl mx-auto w-full">
          {/* 1. Nombre del Cliente */}
          <div
            onClick={() => inputRefs.clientName.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'clientName'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.clientName}
              type="text"
              value={formData.client.name}
              onChange={(e) => handleFieldChange('clientName', e.target.value)}
              onFocus={() => setActiveField('clientName')}
              placeholder="Ej. Empresa S.L."
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-bold text-white placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <User className={`w-4 h-4 ${activeField === 'clientName' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'clientName' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Cliente
              </span>
            </div>
          </div>

          {/* 2. NIF del Cliente */}
          <div
            onClick={() => inputRefs.clientNif.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'clientNif'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.clientNif}
              type="text"
              value={formData.client.nif}
              onChange={(e) => handleFieldChange('clientNif', e.target.value.toUpperCase())}
              onFocus={() => setActiveField('clientNif')}
              placeholder="Ej. B12345678"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-mono font-bold text-amber-300 uppercase placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <Hash className={`w-4 h-4 ${activeField === 'clientNif' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'clientNif' ? 'text-sky-400' : 'text-neutral-400'}`}>
                CIF / NIF
              </span>
            </div>
          </div>

          {/* 3. Concepto del Servicio */}
          <div
            onClick={() => inputRefs.concept.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'concept'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.concept}
              type="text"
              value={formData.items?.[0]?.concept || ''}
              onChange={(e) => handleFieldChange('concept', e.target.value)}
              onFocus={() => setActiveField('concept')}
              placeholder="Ej. Servicios de consultoría"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-bold text-white placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <FileCheck className={`w-4 h-4 ${activeField === 'concept' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'concept' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Concepto
              </span>
            </div>
          </div>

          {/* 4. Importe (€) */}
          <div
            onClick={() => inputRefs.unitPrice.current?.focus()}
            className={`relative flex items-center justify-between w-full rounded-2xl border p-3.5 sm:p-4 transition-all cursor-text ${
              activeField === 'unitPrice'
                ? 'bg-sky-950/20 border-sky-400 ring-1 ring-sky-400/30'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <input
              ref={inputRefs.unitPrice}
              type="number"
              step="any"
              inputMode="decimal"
              value={formData.items?.[0]?.unitPrice !== undefined ? formData.items[0].unitPrice.toString() : '0'}
              onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
              onFocus={() => setActiveField('unitPrice')}
              placeholder="Ej. 1250.00"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-mono font-bold text-emerald-300 placeholder-neutral-500 pr-3"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-neutral-800 pointer-events-none select-none">
              <DollarSign className={`w-4 h-4 ${activeField === 'unitPrice' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${activeField === 'unitPrice' ? 'text-sky-400' : 'text-neutral-400'}`}>
                Importe (€)
              </span>
            </div>
          </div>

          {/* Save Button at bottom */}
          <div className="pt-4 pb-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-4 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-amber-400/20"
            >
              <Save className="w-4 h-4 text-neutral-950" />
              <span>Guardar Factura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
