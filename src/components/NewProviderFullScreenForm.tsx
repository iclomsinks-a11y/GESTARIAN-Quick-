import React, { useState } from 'react';
import {
  X,
  Building2,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  ArrowLeft,
  ShieldCheck,
  Landmark,
  Image as ImageIcon,
} from 'lucide-react';
import { ProviderData } from '../types';

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

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre o razón social es obligatorio';
    }
    if (!formData.cif.trim()) {
      newErrors.cif = 'El CIF / NIF es obligatorio';
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
      logoUrl: (formData.logoUrl || '').trim(),
    });
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
              Nueva Empresa Emisora / Proveedor (Ficha A4)
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

      {/* A4 Paper Document Container */}
      <div className="flex-1 w-full max-w-[210mm] mx-auto p-4 sm:p-8 my-4 sm:my-8 bg-white text-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg relative flex flex-col justify-between">
        <div className="space-y-8">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-neutral-900 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                  Alta de Emisor / Proveedor
                </span>
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Veri*Factu Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extralight uppercase tracking-wider text-neutral-900 mt-2">
                Ficha de Proveedor
              </h1>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[11px] font-mono text-neutral-500 block">DOCUMENTO FISCAL</span>
              <span className="text-xs font-bold text-neutral-800">REGISTRO DE EMISOR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Nombre / Razón Social & CIF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nombre / Razón Social Empresa Emisora *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Ej. Suministros Industriales Ibérica S.L."
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
                  <span>CIF / NIF *</span>
                </label>
                <input
                  type="text"
                  value={formData.cif}
                  onChange={(e) => {
                    setFormData({ ...formData, cif: e.target.value.toUpperCase() });
                    if (errors.cif) setErrors({ ...errors, cif: '' });
                  }}
                  placeholder="Ej. B88112233"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono uppercase font-bold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                {errors.cif && (
                  <span className="text-xs text-red-600 font-medium block">{errors.cif}</span>
                )}
              </div>
            </div>

            {/* Row 2: Dirección Fiscal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Domicilio Fiscal</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej. Polígono Industrial Norte, Calle C, 28022 Madrid"
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
                  placeholder="Ej. +34 912 334 556"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
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
                  placeholder="Ej. facturacion@proveedor.es"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Row 4: Bancarios (IBAN y Banco) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>IBAN Bancario para Pagos</span>
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="ES91 2100 0000 0000 0000 0000"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-bold uppercase tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Entidad Bancaria</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Ej. CaixaBank, BBVA..."
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Row 5: Logotipo URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>URL del Logotipo (Opcional)</span>
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              <span className="text-[11px] text-neutral-500">
                Se mostrará en la cabecera de las facturas emitidas por este proveedor.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-neutral-200 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Proveedor en BD</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
