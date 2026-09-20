import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  Percent,
  Check,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { ReceivedInvoice, ProviderData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NewReceivedInvoiceFullScreenFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoice: ReceivedInvoice) => void;
  providers?: ProviderData[];
  initialData?: Partial<ReceivedInvoice>;
  isEditing?: boolean;
}

export const NewReceivedInvoiceFullScreenForm: React.FC<NewReceivedInvoiceFullScreenFormProps> = ({
  isOpen,
  onClose,
  onSaveInvoice,
  providers = [],
  initialData,
  isEditing = false,
}) => {
  const [supplierName, setSupplierName] = useState(initialData?.supplierName || '');
  const [supplierCif, setSupplierCif] = useState(initialData?.supplierCif || '');
  const [supplierPhone, setSupplierPhone] = useState(initialData?.supplierPhone || '');
  const [supplierEmail, setSupplierEmail] = useState(initialData?.supplierEmail || '');
  const [supplierAddress, setSupplierAddress] = useState(initialData?.supplierAddress || '');
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [concept, setConcept] = useState(initialData?.concept || '');
  const [category, setCategory] = useState(initialData?.category || 'Suministros');
  const [baseImponible, setBaseImponible] = useState<number | ''>(
    initialData?.baseImponible ?? ''
  );
  const [ivaRate, setIvaRate] = useState<number>(initialData?.ivaRate ?? 21);
  const [irpfRate, setIrpfRate] = useState<number>(initialData?.irpfRate ?? 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | undefined>(
    initialData?.capturedImageUrl
  );

  const numBase = typeof baseImponible === 'number' ? baseImponible : 0;
  const computedIvaAmount = Number(((numBase * ivaRate) / 100).toFixed(2));
  const computedIrpfAmount = Number(((numBase * irpfRate) / 100).toFixed(2));
  const computedTotal = Number((numBase + computedIvaAmount - computedIrpfAmount).toFixed(2));

  if (!isOpen) return null;

  // Handle provider selection shortcut
  const handleSelectProviderPreset = (provId: string) => {
    const prov = providers.find((p) => p.id === provId);
    if (prov) {
      setSupplierName(prov.name);
      setSupplierCif(prov.cif);
      setSupplierPhone(prov.phone || '');
      setSupplierEmail(prov.email || '');
      setSupplierAddress(prov.address || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Por favor, indica el nombre del proveedor o emisor.');
      return;
    }
    if (numBase <= 0) {
      alert('Introduce una base imponible válida.');
      return;
    }

    const saved: ReceivedInvoice = {
      id: initialData?.id || `rec-inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      supplierName: supplierName.trim(),
      supplierCif: supplierCif.trim().toUpperCase(),
      supplierPhone: supplierPhone.trim(),
      supplierEmail: supplierEmail.trim(),
      supplierAddress: supplierAddress.trim(),
      invoiceNumber: invoiceNumber.trim() || `FAC-${Date.now().toString().slice(-6)}`,
      date,
      concept: concept.trim() || 'Gasto de suministros y servicios',
      category,
      baseImponible: numBase,
      ivaRate,
      ivaAmount: computedIvaAmount,
      irpfRate,
      irpfAmount: computedIrpfAmount,
      totalAmount: computedTotal,
      scannedWithOcr: initialData?.scannedWithOcr || false,
      capturedImageUrl,
      notes: notes.trim(),
      createdAt: initialData?.createdAt || Date.now(),
    };

    onSaveInvoice(saved);
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
              {isEditing ? 'Editar Factura Recibida' : 'Nueva Factura Recibida / Gasto (Ficha A4)'}
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
                  Registro de Gasto Fiscal
                </span>
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Veri*Factu Ready
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extralight uppercase tracking-wider text-neutral-900 mt-2">
                Factura Recibida
              </h1>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[11px] font-mono text-neutral-500 block">DOCUMENTO FISCAL</span>
              <span className="text-xs font-bold text-neutral-800">REMITENTE / EMISOR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Provider Select if providers exist */}
            {providers.length > 0 && !isEditing && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-neutral-800">
                    Autocompletar con Proveedor Registrado:
                  </span>
                </div>
                <select
                  onChange={(e) => handleSelectProviderPreset(e.target.value)}
                  defaultValue=""
                  className="px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-neutral-900 focus:outline-none focus:border-amber-500 w-full sm:w-64"
                >
                  <option value="" disabled>
                    -- Seleccionar proveedor --
                  </option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.cif})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Row 1: Proveedor y CIF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nombre del Proveedor / Emisor *</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ej. Endesa Energía S.A.U."
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>CIF / NIF Proveedor</span>
                </label>
                <input
                  type="text"
                  value={supplierCif}
                  onChange={(e) => setSupplierCif(e.target.value.toUpperCase())}
                  placeholder="Ej. A81992288"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono uppercase font-bold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Dirección y Contacto */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Dirección del Proveedor</span>
              </label>
              <input
                type="text"
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="Calle, número, ciudad..."
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Row 3: Nº Factura, Fecha y Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>Número de Factura *</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ej. REC-2026-009"
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-bold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fecha de Emisión *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-bold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Categoría de Gasto</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                >
                  <option value="Suministros">Suministros (Luz, Agua, Gas)</option>
                  <option value="Materiales">Materiales y Mercancías</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Software">Software y Licencias</option>
                  <option value="Alquileres">Alquileres</option>
                  <option value="Otros Gastos">Otros Gastos</option>
                </select>
              </div>
            </div>

            {/* Row 4: Concepto */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Concepto o Descripción del Gasto *</span>
              </label>
              <input
                type="text"
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Factura consumo eléctrico periodo febreromarzo"
                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xl md:text-2xl font-mono font-semibold tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Row 5: Importes y Desglose Económico (A4 Box) */}
            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Desglose Económico e Importes Fiscales</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Base Imponible */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase block">
                    Base Imponible (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={baseImponible}
                    onChange={(e) =>
                      setBaseImponible(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-3.5 bg-white border border-neutral-300 rounded-xl text-2xl md:text-3xl font-bold font-mono tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Tipo de IVA */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase block">
                    Tipo de IVA (%)
                  </label>
                  <select
                    value={ivaRate}
                    onChange={(e) => setIvaRate(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-white border border-neutral-300 rounded-xl text-xl md:text-2xl font-bold font-mono tracking-tight text-neutral-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value={21}>21% (General)</option>
                    <option value={10}>10% (Reducido)</option>
                    <option value={4}>4% (Superreducido)</option>
                    <option value={0}>0% (Exento)</option>
                  </select>
                </div>

                {/* Cuota IVA (calculada) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 uppercase block">
                    Cuota IVA ({ivaRate}%)
                  </label>
                  <div className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm font-bold font-mono text-amber-700 flex items-center justify-between">
                    <span>{formatCurrency(computedIvaAmount)}</span>
                    <span className="text-[10px] text-neutral-400">Automático</span>
                  </div>
                </div>

                {/* Total Factura */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-amber-700 uppercase block tracking-wider">
                    Total Factura (€)
                  </label>
                  <div className="w-full px-4 py-3 bg-amber-500 text-neutral-950 rounded-xl text-base font-black font-mono flex items-center justify-between shadow-sm">
                    <span>{formatCurrency(computedTotal)}</span>
                    <Check className="w-5 h-5 text-neutral-950" />
                  </div>
                </div>
              </div>
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
                <span>{isEditing ? 'Actualizar Factura' : 'Guardar Factura Recibida'}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
