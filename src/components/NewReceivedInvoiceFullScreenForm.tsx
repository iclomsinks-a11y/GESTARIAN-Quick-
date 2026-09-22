import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Camera, Trash2, Building2, UserCheck } from 'lucide-react';
import { ReceivedInvoice, ProviderData, CompanyData } from '../types';

interface NewReceivedInvoiceFullScreenFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoice: ReceivedInvoice) => void;
  providers?: ProviderData[];
  initialData?: Partial<ReceivedInvoice>;
  isEditing?: boolean;
  company?: CompanyData;
}

export const NewReceivedInvoiceFullScreenForm: React.FC<NewReceivedInvoiceFullScreenFormProps> = ({
  isOpen,
  onClose,
  onSaveInvoice,
  providers = [],
  initialData,
  isEditing = false,
  company,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setSupplierName(initialData?.supplierName || '');
      setSupplierCif(initialData?.supplierCif || '');
      setSupplierPhone(initialData?.supplierPhone || '');
      setSupplierEmail(initialData?.supplierEmail || '');
      setSupplierAddress(initialData?.supplierAddress || '');
      setInvoiceNumber(initialData?.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`);
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setConcept(initialData?.concept || '');
      setCategory(initialData?.category || 'Suministros');
      setBaseImponible(initialData?.baseImponible ?? '');
      setIvaRate(initialData?.ivaRate ?? 21);
      setIrpfRate(initialData?.irpfRate ?? 0);
      setNotes(initialData?.notes || '');
      setCapturedImageUrl(initialData?.capturedImageUrl);
    }
  }, [isOpen, initialData]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Comprimir usando canvas para aligerar memoria y almacenamiento
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setCapturedImageUrl(compressed);
        } else {
          setCapturedImageUrl(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const numBase = typeof baseImponible === 'number' ? baseImponible : 0;
  const computedIvaAmount = Number(((numBase * ivaRate) / 100).toFixed(2));
  const computedIrpfAmount = Number(((numBase * irpfRate) / 100).toFixed(2));
  const computedTotal = Number((numBase + computedIvaAmount - computedIrpfAmount).toFixed(2));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Por favor, indica el nombre.');
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
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-12 space-y-8">
        {/* Banner informativo de Receptores / Emisores */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                CLIENTE / DESTINATARIO DE LA FACTURA (NOSOTROS)
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                {company?.name || 'Nuestra Empresa (Gestarian)'}
              </h4>
              <p className="text-xs text-neutral-400 font-mono">
                CIF: {company?.cif || 'CIF Propio'} | {company?.address || 'Domicilio Fiscal'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider shrink-0">
            Cliente Fijo
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Nombre / Emisor */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Nombre del proveedor o emisor"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
              autoFocus
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Nombre / Emisor
            </span>
          </div>

          {/* DNI/CIF/NIF */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="text"
              value={supplierCif}
              onChange={(e) => setSupplierCif(e.target.value.toUpperCase())}
              placeholder="DNI, CIF o NIF"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-amber-300 uppercase placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              CIF / NIF
            </span>
          </div>

          {/* Teléfono */}
          <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="Teléfono"
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
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
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
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
              placeholder="Dirección fiscal"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-extrabold text-white placeholder-neutral-600 pr-3"
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
              Dirección
            </span>
          </div>

          {/* Domicilio fiscal / Concepto / Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Concepto de la factura"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-lg sm:text-xl font-extrabold text-white placeholder-neutral-600 pr-3"
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
                Concepto
              </span>
            </div>

            <div className="relative flex items-center justify-between w-full rounded-2xl border border-neutral-800 bg-neutral-900 focus-within:border-sky-400 focus-within:bg-sky-950/20 p-4 transition-all">
              <input
                type="number"
                step="0.01"
                value={baseImponible}
                onChange={(e) =>
                  setBaseImponible(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="0.00"
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xl sm:text-2xl font-mono font-extrabold text-amber-300 placeholder-neutral-600 pr-3"
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400 shrink-0 pl-3 border-l border-neutral-800 select-none pointer-events-none">
                Base (€)
              </span>
            </div>
          </div>

          {/* Botón de Cámara para tomar foto de la factura recibida */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-400">
                <Camera className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Foto del Comprobante / Factura</h4>
                <p className="text-xs text-neutral-400">
                  {capturedImageUrl
                    ? 'Foto capturada y lista para guardar.'
                    : 'Toma una foto con la cámara para guardarla junto a los datos.'}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {capturedImageUrl ? (
                <>
                  <img
                    src={capturedImageUrl}
                    alt="Factura"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    title="Pulsar para cambiar o repetir foto"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Repetir Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCapturedImageUrl(undefined)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-red-950 text-[#EF4444] hover:text-red-400 transition-colors cursor-pointer"
                    style={{ color: '#EF4444' }}
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4 text-[#EF4444]" style={{ color: '#EF4444' }} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  id="btn-form-take-photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tomar Foto con Cámara</span>
                </button>
              )}
            </div>
          </div>

          {/* Total calculated display */}
          <div className="p-6 bg-[#FAF8F5] border border-neutral-200 text-neutral-900 rounded-2xl flex items-center justify-between shadow-sm">
            <span className="text-sm font-bold uppercase tracking-wider text-neutral-700">
              Total Factura (IVA Incluido)
            </span>
            <span className="text-3xl sm:text-5xl font-mono font-black text-neutral-950">
              {computedTotal.toFixed(2)} €
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
              <span>Guardar Factura Recibida</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
