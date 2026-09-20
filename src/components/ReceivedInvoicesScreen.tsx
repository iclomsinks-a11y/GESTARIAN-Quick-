import React, { useState, useMemo } from 'react';
import {
  Camera,
  Plus,
  Search,
  Receipt,
  Building2,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingDown,
  Percent,
  X,
  Eye,
  ArrowRight,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { ReceivedInvoice, ProviderData } from '../types';
import { CameraInvoiceCaptureModal } from './CameraInvoiceCaptureModal';
import { NewReceivedInvoiceFullScreenForm } from './NewReceivedInvoiceFullScreenForm';
import { formatCurrency } from '../utils/formatters';

interface ReceivedInvoicesScreenProps {
  invoices: ReceivedInvoice[];
  onSaveInvoice: (invoice: ReceivedInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  providers?: ProviderData[];
}

export const ReceivedInvoicesScreen: React.FC<ReceivedInvoicesScreenProps> = ({
  invoices,
  onSaveInvoice,
  onDeleteInvoice,
  providers = [],
}) => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierCif, setSupplierCif] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('Suministros');
  const [baseImponible, setBaseImponible] = useState<number | ''>('');
  const [ivaRate, setIvaRate] = useState<number>(21);
  const [irpfRate, setIrpfRate] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [scannedWithOcr, setScannedWithOcr] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | undefined>(undefined);
  const [ocrSuccessNotice, setOcrSuccessNotice] = useState<string | null>(null);

  // Computed Cuota IVA and Total
  const numBase = typeof baseImponible === 'number' ? baseImponible : 0;
  const computedIvaAmount = Number(((numBase * ivaRate) / 100).toFixed(2));
  const computedIrpfAmount = Number(((numBase * irpfRate) / 100).toFixed(2));
  const computedTotal = Number((numBase + computedIvaAmount - computedIrpfAmount).toFixed(2));

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setSupplierName('');
    setSupplierCif('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierAddress('');
    setInvoiceNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setConcept('');
    setCategory('Suministros');
    setBaseImponible('');
    setIvaRate(21);
    setIrpfRate(0);
    setNotes('');
    setScannedWithOcr(false);
    setCapturedImageUrl(undefined);
    setOcrSuccessNotice(null);
  };

  // Open form for a new invoice
  const handleOpenNewForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open form to edit existing invoice
  const handleEditInvoice = (inv: ReceivedInvoice) => {
    setEditingId(inv.id);
    setSupplierName(inv.supplierName);
    setSupplierCif(inv.supplierCif);
    setSupplierPhone(inv.supplierPhone);
    setSupplierEmail(inv.supplierEmail);
    setSupplierAddress(inv.supplierAddress || '');
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date);
    setConcept(inv.concept);
    setCategory(inv.category || 'Suministros');
    setBaseImponible(inv.baseImponible);
    setIvaRate(inv.ivaRate);
    setIrpfRate(inv.irpfRate || 0);
    setNotes(inv.notes || '');
    setScannedWithOcr(Boolean(inv.scannedWithOcr));
    setCapturedImageUrl(inv.capturedImageUrl);
    setOcrSuccessNotice(null);
    setIsFormOpen(true);
  };

  // Handle OCR extraction result from camera
  const handleInvoiceExtractedFromOcr = (
    data: Partial<ReceivedInvoice>,
    capturedImg?: string
  ) => {
    setIsFormOpen(true);
    setEditingId(null); // It's a new received invoice
    setSupplierName(data.supplierName || '');
    setSupplierCif(data.supplierCif || '');
    setSupplierPhone(data.supplierPhone || '');
    setSupplierEmail(data.supplierEmail || '');
    setSupplierAddress(data.supplierAddress || '');
    setInvoiceNumber(data.invoiceNumber || `FAC-${Date.now().toString().slice(-5)}`);
    setDate(data.date || new Date().toISOString().split('T')[0]);
    setConcept(data.concept || '');
    setCategory(data.category || 'Suministros');
    setBaseImponible(data.baseImponible ?? 0);
    setIvaRate(data.ivaRate ?? 21);
    setIrpfRate(data.irpfRate ?? 0);
    setNotes(data.notes || '');
    setScannedWithOcr(true);
    setCapturedImageUrl(capturedImg);
    setOcrSuccessNotice(
      `¡Factura de "${data.supplierName || 'Proveedor'}" escaneada con éxito por Gemini OCR! Revisa los campos y pulsa Guardar.`
    );
  };

  // Save received invoice
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      alert('Por favor, indica el nombre o razón social del proveedor.');
      return;
    }

    if (numBase <= 0 && computedTotal <= 0) {
      alert('Por favor, introduce una base imponible o importe válido.');
      return;
    }

    const newInvoice: ReceivedInvoice = {
      id: editingId || `rec-inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      supplierName: supplierName.trim(),
      supplierCif: supplierCif.trim(),
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
      scannedWithOcr,
      ocrModel: scannedWithOcr ? 'gemini-3.8-flash' : undefined,
      capturedImageUrl,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    onSaveInvoice(newInvoice);
    resetForm();
    setIsFormOpen(false);
  };

  // Calculations for summary metrics
  const totals = useMemo(() => {
    let sumBase = 0;
    let sumIva = 0;
    let sumTotal = 0;

    invoices.forEach((inv) => {
      sumBase += inv.baseImponible || 0;
      sumIva += inv.ivaAmount || 0;
      sumTotal += inv.totalAmount || 0;
    });

    return {
      count: invoices.length,
      sumBase,
      sumIva,
      sumTotal,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.supplierName.toLowerCase().includes(q) ||
        inv.supplierCif.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.concept.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || inv.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [invoices, searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Facturas Recibidas y Gastos
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 text-[10px] font-extrabold uppercase">
              Proveedores
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl">
            Gestiona los gastos de tu negocio. Rellena los datos manualmente o captura la factura con la cámara de tu dispositivo para extracción automática mediante IA Gemini OCR.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cámara OCR Button (Prominent) */}
          <button
            type="button"
            id="btn-scan-invoice-camera"
            onClick={() => setIsCameraModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            title="Abrir cámara para escanear factura con Gemini OCR"
          >
            <Camera className="w-4 h-4 text-neutral-950" />
            <span>Capturar con Cámara</span>
            <span className="bg-neutral-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-0.5">
              OCR
            </span>
          </button>

          {/* Nueva Factura Manual Button */}
          <button
            type="button"
            id="btn-new-received-invoice-manual"
            onClick={handleOpenNewForm}
            className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-100 font-bold text-xs flex items-center gap-2 border border-neutral-700 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Rellenar Manualmente</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Total Facturas</span>
            <Receipt className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {totals.count}
          </div>
          <div className="text-[11px] text-neutral-500">Documentos contabilizados</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Base Imponible</span>
            <DollarSign className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-stone-200">
            {formatCurrency(totals.sumBase)}
          </div>
          <div className="text-[11px] text-neutral-500">Gasto neto antes de impuestos</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>IVA Deducible (21%)</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {formatCurrency(totals.sumIva)}
          </div>
          <div className="text-[11px] text-neutral-400">IVA soportado a compensar</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border-2 border-neutral-700 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-neutral-300 text-xs font-bold uppercase tracking-wider">
            <span>Total Gastos</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {formatCurrency(totals.sumTotal)}
          </div>
          <div className="text-[11px] text-neutral-400">Importe final liquidado</div>
        </div>
      </div>

      {/* FORMULARIO DE RELLENO / EDICIÓN A4 */}
      {isFormOpen && (
        <NewReceivedInvoiceFullScreenForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            resetForm();
          }}
          onSaveInvoice={(inv) => {
            onSaveInvoice(inv);
            resetForm();
            setIsFormOpen(false);
          }}
          providers={providers}
          isEditing={Boolean(editingId)}
          initialData={{
            id: editingId || undefined,
            supplierName,
            supplierCif,
            supplierPhone,
            supplierEmail,
            supplierAddress,
            invoiceNumber,
            date,
            concept,
            category,
            baseImponible: typeof baseImponible === 'number' ? baseImponible : 0,
            ivaRate,
            irpfRate,
            notes,
            capturedImageUrl,
            scannedWithOcr,
            createdAt: Date.now(),
          }}
        />
      )}







          {/* Formulario migrado a NewReceivedInvoiceFullScreenForm */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Datos Fiscales del Proveedor</span>
                </h4>

                {/* Autocompletado rápido desde proveedores existentes */}
                {providers.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <span>O seleccionar guardado:</span>
                    <select
                      className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2 py-1 focus:border-amber-400 focus:outline-none"
                      onChange={(e) => {
                        const prov = providers.find((p) => p.name === e.target.value);
                        if (prov) {
                          setSupplierName(prov.name);
                          setSupplierCif(prov.cif);
                          setSupplierPhone(prov.phone);
                          setSupplierEmail(prov.email);
                          setSupplierAddress(prov.address);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Proveedores guardados --
                      </option>
                      {providers.map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name} ({p.cif})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Nombre o Razón Social del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Ej: Suministros Industriales S.L."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    CIF / NIF / NIE *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierCif}
                    onChange={(e) => setSupplierCif(e.target.value.toUpperCase())}
                    placeholder="B12345678"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 font-mono uppercase focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="+34 912 345 678"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="facturacion@proveedor.es"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="Calle, Polígono, Ciudad, Código Postal..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Datos de la Factura Recibida */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Identificación de la Factura o Gasto</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Número de Factura / Ticket *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="FAC-2026-001"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Fecha de Expedición *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Categoría de Gasto
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="Suministros">Suministros (Luz, Agua, Internet)</option>
                    <option value="Materiales">Materiales y Mercancías</option>
                    <option value="Servicios Profesionales">Servicios Profesionales / Asesoría</option>
                    <option value="Software">Software y Herramientas Digitales</option>
                    <option value="Alquiler">Alquiler de Local / Oficina</option>
                    <option value="Transporte">Transporte y Combustible</option>
                    <option value="Dietas">Dietas y Hostelería</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Concepto o Descripción del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Ej: Material de oficina, tóner, hosting anual o servicios de consultoría"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Importes y Desglose de IVA (Base Imponible, IVA 21%, Total) */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Desglose Económico e Importes Fiscales</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                {/* Base Imponible */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
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
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-bold font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Tipo de IVA */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Tipo de IVA (%)
                  </label>
                  <select
                    value={ivaRate}
                    onChange={(e) => setIvaRate(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-bold font-mono text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value={21}>21% (General)</option>
                    <option value={10}>10% (Reducido)</option>
                    <option value={4}>4% (Superreducido)</option>
                    <option value={0}>0% (Exento)</option>
                  </select>
                </div>

                {/* Cuota de IVA (calculada) */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                    Cuota de IVA ({ivaRate}%)
                  </label>
                  <div className="w-full px-3 py-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl text-sm font-bold font-mono text-amber-400 flex items-center justify-between">
                    <span>{formatCurrency(computedIvaAmount)}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">Automático</span>
                  </div>
                </div>

                {/* Total Factura Recibida */}
                <div>
                  <label className="block text-[11px] font-black text-amber-300 mb-1 uppercase tracking-wider">
                    Total Factura (€)
                  </label>
                  <div className="w-full px-3 py-2 bg-gradient-to-r from-amber-400/20 to-amber-500/20 border-2 border-amber-400 rounded-xl text-base font-black font-mono text-amber-300 flex items-center justify-between">
                    <span>{formatCurrency(computedTotal)}</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Foto de comprobante capturada si existe */}
            {capturedImageUrl && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-neutral-950 overflow-hidden border border-neutral-700 shrink-0">
                    <img
                      src={capturedImageUrl}
                      alt="Factura capturada"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(capturedImageUrl)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Imagen de Factura Capturada con Cámara</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Asociada a esta tarjeta de gasto para comprobación fiscal
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(capturedImageUrl)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCapturedImageUrl(undefined)}
                    className="p-1 text-neutral-500 hover:text-red-400"
                    title="Eliminar foto adjunta"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Botones de acción del formulario */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="save-received-invoice-btn"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-neutral-950" />
                <span>{editingId ? 'Actualizar Factura' : 'Guardar Factura Recibida'}</span>
              </button>
            </div>


      {/* Toolbar: Filtro y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por proveedor, CIF o nº factura..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'Suministros', label: 'Suministros' },
            { id: 'Materiales', label: 'Materiales' },
            { id: 'Servicios Profesionales', label: 'Servicios' },
            { id: 'Software', label: 'Software' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE TARJETAS DE FACTURAS RECIBIDAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Listado de Facturas Recibidas ({filteredInvoices.length})
          </h3>
          <span className="text-[11px] text-neutral-500">
            Ordenadas por fecha de registro
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-neutral-300">No hay facturas recibidas</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'No se encontraron facturas con los criterios de búsqueda especificados.'
                  : 'Empieza capturando tu primera factura con la cámara o rellenando los datos manualmente.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capturar con Cámara</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNewForm}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rellenar Manualmente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                id={`received-invoice-card-${inv.id}`}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
              >
                {/* Top: Supplier and Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                        PROVEEDOR
                      </span>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {inv.supplierName}
                      </h4>
                    </div>

                    {inv.scannedWithOcr && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold shrink-0"
                        title="Escaneada con Gemini OCR"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Gemini OCR</span>
                      </span>
                    )}
                  </div>

                  {/* Supplier info tags */}
                  <div className="space-y-1 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-2 font-mono text-neutral-300">
                      <span className="font-semibold text-amber-400">CIF:</span>
                      <span>{inv.supplierCif || 'No especificado'}</span>
                    </div>

                    {(inv.supplierPhone || inv.supplierEmail) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-400 pt-0.5">
                        {inv.supplierPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            <span>{inv.supplierPhone}</span>
                          </span>
                        )}
                        {inv.supplierEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-500" />
                            <span className="truncate max-w-[140px]">{inv.supplierEmail}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Document details */}
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-neutral-300 font-bold">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-600" />
                      {inv.date}
                    </span>
                  </div>

                  <p className="text-neutral-400 text-[11px] line-clamp-2 italic">
                    "{inv.concept}"
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-medium">
                      {inv.category || 'Gasto General'}
                    </span>

                    {inv.capturedImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(inv.capturedImageUrl || null)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver foto original</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom: Amounts Breakdown */}
                <div className="pt-2 border-t border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>Base: {formatCurrency(inv.baseImponible)}</span>
                    <span className="text-amber-400 font-semibold">
                      IVA ({inv.ivaRate}%): +{formatCurrency(inv.ivaAmount)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-neutral-850">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Total Factura
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-white">
                      {formatCurrency(inv.totalAmount)}
                    </span>
                  </div>

                  {/* Actions (Editar / Eliminar) */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleEditInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `¿Estás seguro de eliminar la factura recibida de "${inv.supplierName}"?`
                          )
                        ) {
                          onDeleteInvoice(inv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Eliminar factura recibida"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cámara / OCR */}
      <CameraInvoiceCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onInvoiceExtracted={handleInvoiceExtractedFromOcr}
      />

      {/* Modal de Vista Previa de Imagen Escaneada */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>Comprobante Escaneado con Cámara</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImage}
                alt="Comprobante completo"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
