import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  Plus,
  Search,
  Receipt,
  Phone,
  Mail,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Eye,
  Image as ImageIcon,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReceivedInvoice, ProviderData } from '../types';
import { CameraInvoiceCaptureModal } from './CameraInvoiceCaptureModal';
import { NewReceivedInvoiceFullScreenForm } from './NewReceivedInvoiceFullScreenForm';
import { formatCurrency, formatDate } from '../utils/formatters';

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
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    setIsFormOpen(true);
  };

  // Callback when OCR camera extracts invoice data
  const handleInvoiceExtractedFromOcr = (
    data: Partial<ReceivedInvoice>,
    capturedImg?: string
  ) => {
    resetForm();
    setIsFormOpen(true);
    setSupplierName(data.supplierName || '');
    setSupplierCif(data.supplierCif || '');
    setSupplierPhone(data.supplierPhone || '');
    setSupplierEmail(data.supplierEmail || '');
    setSupplierAddress(data.supplierAddress || '');
    setInvoiceNumber(data.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`);
    setDate(data.date || new Date().toISOString().split('T')[0]);
    setConcept(data.concept || 'Gasto escaneado mediante OCR');
    setCategory(data.category || 'Suministros');
    setBaseImponible(data.baseImponible ?? '');
    setIvaRate(data.ivaRate ?? 21);
    setIrpfRate(data.irpfRate ?? 0);
    setNotes(data.notes || '');
    setScannedWithOcr(true);
    setCapturedImageUrl(capturedImg);
  };

  const toggleExpand = (id: string) => {
    setExpandedInvoiceId((prev) => (prev === id ? null : id));
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getSupplierPhone = (inv: ReceivedInvoice): string => {
    if (inv.supplierPhone) return inv.supplierPhone;
    const match = providers.find(
      (p) =>
        (inv.supplierCif && p.cif && p.cif.toLowerCase() === inv.supplierCif.toLowerCase()) ||
        (p.name && inv.supplierName && p.name.toLowerCase() === inv.supplierName.toLowerCase())
    );
    return match?.phone || '';
  };

  const handlePhoneClick = (phone: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!phone) {
      alert('Esta factura no tiene teléfono de proveedor registrado. Pulsa en Editar para añadirlo.');
      return;
    }
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsAppClick = (inv: ReceivedInvoice, phone: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!phone) {
      alert('Esta factura no tiene teléfono de proveedor para WhatsApp. Pulsa en Editar para añadirlo.');
      return;
    }
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.startsWith('34') ? cleanNumber : `34${cleanNumber}`;
    const text = encodeURIComponent(
      `Hola ${inv.supplierName || 'Proveedor'}, le escribo respecto a la factura recibida nº ${inv.invoiceNumber || 'registrada'}.`
    );
    window.open(`https://wa.me/${formatted}?text=${text}`, '_blank');
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        inv.supplierName.toLowerCase().includes(q) ||
        inv.supplierCif.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.concept.toLowerCase().includes(q)
      );
    });
  }, [invoices, searchQuery]);

  return (
    <div
      id="received-invoices-screen-container"
      className="w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 sm:pt-2 pb-8 space-y-3.5 text-neutral-100"
    >
      {/* Barra de acciones limpia: Buscador (anchura 0.5), Botón OCR y Botón + FACTURA */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md shadow-lg">
        {/* Campo de Búsqueda (anchura 0.5) */}
        <div className="relative w-1/2 max-w-[50%]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            id="received-invoices-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por proveedor, CIF, número, concepto..."
            className="w-full pl-9 pr-7 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1 cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Botón OCR Cámara */}
          <button
            type="button"
            id="btn-scan-invoice-camera"
            onClick={() => setIsCameraModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 hover:text-amber-300 border-2 border-amber-400 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            title="Escanear factura con OCR"
          >
            <Camera className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            <span>OCR</span>
          </button>

          {/* Botón + FACTURA */}
          <button
            type="button"
            id="btn-new-received-invoice-manual"
            onClick={handleOpenNewForm}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 hover:text-amber-300 border-2 border-amber-400 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            title="Crear nueva factura recibida"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>+ FACTURA</span>
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Facturas Recibidas - Mismo diseño que Clientes y Proveedores */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-bold text-white">
            {searchQuery ? 'No se encontraron facturas recibidas' : 'Aún no hay facturas recibidas'}
          </div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery
              ? `No hay ninguna factura que coincida con "${searchQuery}".`
              : 'Registra tu primera factura recibida usando la cámara OCR o rellenando los datos manualmente.'}
          </p>
          <div className="pt-2 flex justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 border-2 border-amber-400 font-bold text-xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Escanear con OCR</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear manualmente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
          {filteredInvoices.map((inv) => {
            const isExpanded = expandedInvoiceId === inv.id;
            const hasAnyExpanded = expandedInvoiceId !== null;
            const isDimmed = hasAnyExpanded && !isExpanded;
            const phone = getSupplierPhone(inv);

            return (
              <motion.div
                key={inv.id}
                id={`received-invoice-card-${inv.id}`}
                layout
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`group relative rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isExpanded
                    ? 'bg-neutral-900/98 border-amber-400 shadow-2xl ring-2 ring-amber-400/50 z-10 scale-[1.01]'
                    : 'bg-neutral-950/95 hover:bg-neutral-900/90 border-neutral-600 hover:border-amber-400/90'
                } ${isDimmed ? 'opacity-50 brightness-70 contrast-85 transition-all duration-300' : 'opacity-100'}`}
              >
                {/* LÍNEA 1: Nombre del Proveedor y Número de factura en la cabecera (Al pulsar se expande/contrae) */}
                <div
                  onClick={() => toggleExpand(inv.id)}
                  className="px-4 pt-3.5 pb-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-800/40 transition-colors select-none"
                  title="Pulsa para expandir o contraer todos los datos de la factura recibida"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate uppercase">
                      {inv.supplierName || 'Proveedor'}
                    </h3>
                    <span className="font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded-lg border shrink-0 bg-amber-400/15 text-amber-300 border-amber-400/30">
                      {inv.invoiceNumber || 'S/N'}
                    </span>
                    {inv.scannedWithOcr && (
                      <span
                        className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full"
                        title="Escaneada con OCR"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">OCR</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-base sm:text-lg font-bold text-amber-300">
                      {formatCurrency(inv.totalAmount || 0)}
                    </span>
                    <div className="p-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-amber-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* LÍNEA 2: Fila de Iconos Grandes FLOTANTES SIN ENVOLTORIO (x1.5 más grandes, trazo 1.5px): Teléfono celeste, WhatsApp, Ver comprobante, Editar, Eliminar */}
                <div className="px-3 pt-1 pb-3.5 grid grid-cols-5 place-items-center gap-1">
                  {/* Icono 1: Teléfono Flotante (Celeste, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handlePhoneClick(phone, e)}
                    className="p-1 text-sky-400 hover:text-sky-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={phone ? `Llamar a ${phone}` : 'Sin teléfono registrado (pulsa editar)'}
                  >
                    <Phone className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: WhatsApp Flotante (Verde sólido, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(inv, phone, e)}
                    className="p-1 text-[#25D366] hover:text-[#3df084] hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#25D366' }}
                    title={phone ? 'Abrir chat de WhatsApp' : 'Sin teléfono para WhatsApp'}
                  >
                    <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm text-[#25D366]" style={{ color: '#25D366' }} />
                  </button>

                  {/* Icono 3: Ver Comprobante / Foto con icono de imagen estándar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inv.capturedImageUrl) {
                        setPreviewImage(inv.capturedImageUrl);
                      } else {
                        toggleExpand(inv.id);
                      }
                    }}
                    className={`p-1 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none ${
                      inv.capturedImageUrl
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-neutral-500 hover:text-neutral-400'
                    }`}
                    title={
                      inv.capturedImageUrl
                        ? 'Ver foto del comprobante / factura capturada'
                        : 'Sin foto adjunta (pulsa para ver detalles)'
                    }
                  >
                    <ImageIcon className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Editar Flotante (Gris 50%, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditInvoice(inv);
                    }}
                    className="p-1 text-[#808080] hover:text-neutral-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#808080' }}
                    title="Editar todos los datos de la factura recibida"
                  >
                    <Edit3 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm text-[#808080]" style={{ color: '#808080' }} />
                  </button>

                  {/* Icono 5: Eliminar Flotante (Rojo sólido, 1.5px) */}
                  <button
                    type="button"
                    id={`btn-delete-received-invoice-${inv.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Estás seguro de que deseas eliminar esta factura recibida?')) {
                        onDeleteInvoice(inv.id);
                      }
                    }}
                    className="p-1 text-[#EF4444] hover:text-red-400 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#EF4444' }}
                    title="Eliminar esta factura recibida"
                  >
                    <Trash2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm text-[#EF4444]" style={{ color: '#EF4444' }} />
                  </button>
                </div>

                {/* ZONA EXPANDIBLE: Aparece de modo fluido al pulsar el nombre con texto aumentado x1.5 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`expanded-content-${inv.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-5 bg-neutral-950/80 border-t border-neutral-800 space-y-4 text-base text-neutral-200">
                        {/* Fecha de Emisión & NIF */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                              Fecha:
                            </span>
                            <span className="font-mono text-base sm:text-lg font-bold text-white">
                              {formatDate(inv.date)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                              NIF / CIF:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base sm:text-lg font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                                {inv.supplierCif || 'SIN CIF'}
                              </span>
                              {inv.supplierCif && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(inv.supplierCif, `${inv.id}-cif`, e)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                  title="Copiar CIF"
                                >
                                  {copiedId === `${inv.id}-cif` ? (
                                    <Check className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Concepto / Descripción */}
                        <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                            Concepto / Descripción:
                          </span>
                          <div className="pl-2 text-neutral-100 text-base sm:text-lg">
                            <p className="leading-relaxed">{inv.concept || 'Gasto general registrado'}</p>
                          </div>
                        </div>

                        {/* Categoría */}
                        {inv.category && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-850/80">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                              Categoría:
                            </span>
                            <span className="text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
                              {inv.category}
                            </span>
                          </div>
                        )}

                        {/* Domicilio del Proveedor */}
                        {inv.supplierAddress && (
                          <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <MapPin className="w-4.5 h-4.5 text-neutral-400" />
                              <span>Domicilio:</span>
                            </span>
                            <div className="pl-6 text-neutral-100 text-base sm:text-lg">
                              <p className="leading-relaxed">{inv.supplierAddress}</p>
                            </div>
                          </div>
                        )}

                        {/* Teléfono & Email */}
                        {(phone || inv.supplierEmail) && (
                          <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                            {phone && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                  <Phone className="w-4.5 h-4.5 text-sky-400 stroke-[1.5]" />
                                  <span>Teléfono:</span>
                                </span>
                                <span className="font-mono text-sky-300 text-base sm:text-lg font-bold">
                                  {phone}
                                </span>
                              </div>
                            )}

                            {inv.supplierEmail && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                  <Mail className="w-4.5 h-4.5 text-amber-400" />
                                  <span>Email:</span>
                                </span>
                                <span className="text-neutral-300 text-base sm:text-lg truncate max-w-[240px]">
                                  {inv.supplierEmail}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Desglose Fiscal (Base, IVA, IRPF, Total) - Sección de Importes en Blanco Hueso */}
                        <div className="pt-2 border-t border-neutral-850/80 space-y-2 bg-[#FAF8F5] p-3.5 rounded-xl border border-neutral-200 text-neutral-900 shadow-sm">
                          <div className="flex items-center justify-between text-sm sm:text-base text-neutral-700">
                            <span className="font-semibold">Base Imponible:</span>
                            <span className="font-mono font-bold text-neutral-900">{formatCurrency(inv.baseImponible || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm sm:text-base text-neutral-700">
                            <span className="font-semibold">IVA ({inv.ivaRate ?? 21}%):</span>
                            <span className="font-mono font-bold text-amber-900">
                              +{formatCurrency(inv.ivaAmount || 0)}
                            </span>
                          </div>
                          {(inv.irpfRate ?? 0) > 0 && (
                            <div className="flex items-center justify-between text-sm sm:text-base text-neutral-700">
                              <span className="font-semibold">Retención IRPF ({inv.irpfRate}%):</span>
                              <span className="font-mono font-bold text-rose-700">
                                -{formatCurrency(inv.irpfAmount || 0)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-base sm:text-lg font-black text-neutral-950 pt-2 border-t border-neutral-300">
                            <span>TOTAL FACTURA:</span>
                            <span className="font-mono text-xl sm:text-2xl font-black text-neutral-950">
                              {formatCurrency(inv.totalAmount || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Observaciones o Notas */}
                        {inv.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-sm sm:text-base text-neutral-300">
                            <span className="font-bold text-neutral-200">Notas: </span>
                            <span className="italic">{inv.notes}</span>
                          </div>
                        )}

                        {/* Comprobante / Foto escaneada */}
                        {inv.capturedImageUrl && (
                          <div className="pt-2 border-t border-neutral-850/80 flex items-center justify-between">
                            <span className="text-sm font-semibold text-neutral-300">Foto original:</span>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(inv.capturedImageUrl || null)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 py-1 px-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver comprobante completo</span>
                            </button>
                          </div>
                        )}

                        {/* Pie de acciones expandidas: Eliminar factura y Editar */}
                        <div className="pt-3 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('¿Estás seguro de que deseas eliminar esta factura recibida?')) {
                                  onDeleteInvoice(inv.id);
                                }
                              }}
                              className="inline-flex items-center gap-2 text-sm sm:text-base text-[#EF4444] hover:text-red-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-950/50 cursor-pointer font-bold"
                              title="Eliminar factura recibida"
                            >
                              <Trash2 className="w-4.5 h-4.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                              <span>Eliminar</span>
                            </button>

                          <button
                            type="button"
                            onClick={() => handleEditInvoice(inv)}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-[#808080] hover:text-neutral-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-neutral-800/50 cursor-pointer font-bold"
                          >
                            <Edit3 className="w-4.5 h-4.5 stroke-[2] text-[#808080]" style={{ color: '#808080' }} />
                            <span>Editar datos</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Formulario de Factura Recibida */}
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
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
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
