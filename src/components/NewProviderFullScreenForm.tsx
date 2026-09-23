import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ProviderData } from '../types';
import { centerInTop60Viewer } from '../utils/scrollHelpers';

interface NewProviderFullScreenFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProvider: (provider: ProviderData) => void;
  initialData?: Partial<ProviderData>;
}

export const NewProviderFullScreenForm: React.FC<NewProviderFullScreenFormProps> = ({
  isOpen,
  onClose,
  onSaveProvider,
  initialData,
}) => {
  const [formData, setFormData] = useState<ProviderData>({
    id: initialData?.id || `prov-${Date.now()}`,
    name: initialData?.name || '',
    cif: initialData?.cif || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    logoUrl: initialData?.logoUrl || '',
    iban: initialData?.iban || '',
    bankName: initialData?.bankName || '',
    isDefault: initialData?.isDefault ?? false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: initialData?.id || `prov-${Date.now()}`,
        name: initialData?.name || '',
        cif: initialData?.cif || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        logoUrl: initialData?.logoUrl || '',
        iban: initialData?.iban || '',
        bankName: initialData?.bankName || '',
        isDefault: initialData?.isDefault ?? false,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!formData.cif.trim()) {
      newErrors.cif = 'El DNI/CIF/NIF es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSaveProvider({
      ...formData,
      name: formData.name.trim(),
      cif: formData.cif.trim().toUpperCase(),
      address: (formData.address || '').trim(),
      phone: (formData.phone || '').trim(),
      email: (formData.email || '').trim(),
      iban: (formData.iban || '').trim().toUpperCase(),
      bankName: (formData.bankName || '').trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar: GESTARIAN Quick & Close */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 shrink-0 bg-neutral-950">
        <div className="flex flex-col items-start">
          <h1
            className="text-lg sm:text-xl font-thin tracking-[0.25em] uppercase leading-none select-none"
            style={{ fontFamily: "'Montserrat', 'Cinzel', sans-serif", color: '#808080' }}
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
        <form onSubmit={handleSubmit} className="space-y-8">
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
                value={formData.cif}
                onChange={(e) => {
                  setFormData({ ...formData, cif: e.target.value.toUpperCase() });
                  if (errors.cif) setErrors({ ...errors, cif: '' });
                }}
                onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
                placeholder="DNI, CIF o NIF"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-amber-300 uppercase placeholder-neutral-600 pr-3"
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
                CIF / NIF
              </span>
            </div>
            {errors.cif && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.cif}</span>}
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
              placeholder="Dirección fiscal"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Dirección
            </span>
          </div>

          {/* Banco */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="Nombre de la entidad bancaria"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Banco
            </span>
          </div>

          {/* Número de Cuenta / IBAN */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              onFocus={(e) => centerInTop60Viewer(e.currentTarget)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-amber-300 uppercase placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Número de Cuenta
            </span>
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
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-base font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-xl active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span>Guardar Proveedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
