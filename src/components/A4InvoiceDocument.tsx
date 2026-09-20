import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Calendar,
  CreditCard,
  ShieldCheck,
  QrCode,
  Building,
  Building2,
  User,
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Check,
  Save,
  MessageCircle,
  Printer,
  Eye,
  Package,
  Send,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  ConceptHistoryItem,
  CompanyData,
  ClientData,
  ProviderData,
} from '../types';
import { formatCurrency, formatDecimal, formatDate, getTodayIso } from '../utils/formatters';
import { ConceptAutocompleteInput } from './ConceptAutocompleteInput';
import { PrintPreviewModal } from './PrintPreviewModal';
import { ClientEditorModal, ClientInputField } from './ClientEditorModal';

interface A4InvoiceDocumentProps {
  invoice: Invoice;
  onChangeInvoice: (updated: Invoice) => void;
  onOpenConfig: () => void;
  concepts: ConceptHistoryItem[];
  onConceptCommitted: (text: string) => void;
  onOpenVeriFactuModal: () => void;
  // Databases & actions requested by user
  clients: ClientData[];
  onSelectClient: (client: ClientData) => void;
  onOpenClientsSearch: () => void;
  onOpenNewClientForm: () => void;
  onOpenProvidersModal: () => void;
  onOpenComplexBudgetModal: () => void;
  onOpenAttachProduct?: (lineIndex?: number) => void;
  onSaveInvoice?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenEmailModal?: () => void;
  onPrint?: () => void;
  isSaved?: boolean;
}

export const A4InvoiceDocument: React.FC<A4InvoiceDocumentProps> = ({
  invoice,
  onChangeInvoice,
  onOpenConfig,
  concepts,
  onConceptCommitted,
  onOpenVeriFactuModal,
  clients,
  onSelectClient,
  onOpenClientsSearch,
  onOpenNewClientForm,
  onOpenProvidersModal,
  onOpenComplexBudgetModal,
  onOpenAttachProduct,
  onSaveInvoice,
  onOpenWhatsAppModal,
  onOpenEmailModal,
  onPrint,
  isSaved = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState<boolean>(Boolean(isSaved));
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isClientEditorOpen, setIsClientEditorOpen] = useState<boolean>(false);
  const [clientEditorField, setClientEditorField] = useState<ClientInputField>('name');

  const openClientEditor = (field: ClientInputField) => {
    setClientEditorField(field);
    setIsClientEditorOpen(true);
  };

  useEffect(() => {
    setIsSavedLocal(Boolean(isSaved));
  }, [isSaved]);

  const handleSave = () => {
    setIsSavedLocal(true);
    if (onSaveInvoice) {
      onSaveInvoice();
    }
  };

  const handlePrint = () => {
    if (!isSavedLocal) return;
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    if (!isSavedLocal) return;
    if (onOpenWhatsAppModal) {
      onOpenWhatsAppModal();
    }
  };

  const handleEmail = () => {
    if (!isSavedLocal) return;
    if (onOpenEmailModal) {
      onOpenEmailModal();
    }
  };

  // Totals calculation
  const baseImponible = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * (invoice.ivaRate / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate || 0) / 100);
  const totalFactura = baseImponible + cuotaIva - cuotaIrpf;

  // Update item handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoice.items];
    const currentItem = { ...updatedItems[index], [field]: value };

    if (field === 'units' || field === 'unitPrice') {
      const units = field === 'units' ? parseFloat(value) || 0 : currentItem.units;
      const price = field === 'unitPrice' ? parseFloat(value) || 0 : currentItem.unitPrice;
      currentItem.total = Math.round(units * price * 100) / 100;
    }

    updatedItems[index] = currentItem;
    onChangeInvoice({ ...invoice, items: updatedItems });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concept: '',
      units: 1,
      unitPrice: 0,
      total: 0,
    };
    onChangeInvoice({ ...invoice, items: [...invoice.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    if (invoice.items.length <= 1) {
      onChangeInvoice({
        ...invoice,
        items: [
          {
            id: `item-${Date.now()}`,
            concept: '',
            units: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
      });
      return;
    }
    const updatedItems = invoice.items.filter((_, idx) => idx !== index);
    onChangeInvoice({ ...invoice, items: updatedItems });
  };

  // Direct logo upload from A4 sheet
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El logotipo debe ser menor de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onChangeInvoice({
          ...invoice,
          company: { ...invoice.company, logoUrl: result },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeInvoice({
      ...invoice,
      company: { ...invoice.company, logoUrl: '' },
    });
  };

  return (
    <div className="w-full flex justify-center py-4 sm:py-8 px-2 sm:px-4">
      {/* A4 Sheet Container: standardized 210mm x 297mm aspect ratio container */}
      <div
        id="a4-invoice-sheet"
        className={`a4-sheet w-full max-w-[840px] min-h-[1180px] bg-white text-neutral-800 rounded-sm shadow-[0_15px_50px_-12px_rgba(0,0,0,0.18)] p-6 sm:p-12 md:p-14 flex flex-col justify-between border border-neutral-200/90 relative print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:min-h-0 ${
          isPrintPreviewOpen ? 'print:hidden' : ''
        }`}
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* TOP SECTION: Header / Membrete */}
        <div className="space-y-6">
          {/* Row 1: Left = Logo on the left + Company Data to the right of logo. Right = FACTURA Title & Number & Dates */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-neutral-200">
            {/* Top Left: Logo on the left, and to the right of the logo the company data */}
            <div className="flex items-start gap-4 sm:gap-5 flex-1 max-w-xl">
              {/* Logo: Located to the left, left-aligned */}
              <div className="relative group shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />

                {invoice.company.logoUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-neutral-200 bg-white p-2 flex items-center justify-center cursor-pointer hover:border-amber-400 transition-all shadow-xs relative group overflow-hidden print:border-none print:shadow-none print:p-0"
                    title="Haz clic para cambiar el logotipo"
                  >
                    <img
                      src={invoice.company.logoUrl}
                      alt="Logo Empresa"
                      className="max-w-full max-h-full object-contain"
                    />
                    {/* Hover Overlay Controls */}
                    <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] print:hidden">
                      <span className="flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Cambiar
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-red-300 hover:text-red-100 mt-1 flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50/70 hover:bg-amber-50/30 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all print:hidden"
                    title="Subir logo de la empresa o generar con IA"
                  >
                    <Upload className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 mb-0.5" />
                    <span className="text-[11px] font-medium text-neutral-600 group-hover:text-amber-700 leading-tight">
                      Subir Logo
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenConfig();
                      }}
                      className="mt-1 px-1.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[9px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Generar logotipo con IA generativa"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                      <span>Con IA</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Company Fiscal & Contact Data (to the right of the logo, left-aligned) */}
              <div className="text-left space-y-0.5 text-xs text-neutral-600 flex-1 min-w-0">
                <div className="group relative">
                  <input
                    type="text"
                    value={invoice.company.name}
                    onChange={(e) =>
                      onChangeInvoice({
                        ...invoice,
                        company: { ...invoice.company, name: e.target.value },
                      })
                    }
                    placeholder="Nombre o Razón Social"
                    className="font-bold text-sm sm:text-base text-neutral-900 w-full text-left bg-transparent hover:bg-amber-50/50 rounded px-1 border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none print:border-none print:p-0"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 font-normal shrink-0">CIF/NIF:</span>
                  <input
                    type="text"
                    value={invoice.company.cif}
                    onChange={(e) =>
                      onChangeInvoice({
                        ...invoice,
                        company: { ...invoice.company, cif: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="CIF de la empresa"
                    className="font-mono text-neutral-800 font-semibold uppercase text-left bg-transparent hover:bg-amber-50/50 rounded px-1 border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none w-32 print:border-none print:p-0"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={invoice.company.address}
                    onChange={(e) =>
                      onChangeInvoice({
                        ...invoice,
                        company: { ...invoice.company, address: e.target.value },
                      })
                    }
                    placeholder="Domicilio fiscal emisor"
                    className="text-neutral-600 w-full text-left bg-transparent hover:bg-amber-50/50 rounded px-1 border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none print:border-none print:p-0"
                  />
                </div>

                {invoice.company.phone && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 font-normal shrink-0">Tel:</span>
                    <input
                      type="text"
                      value={invoice.company.phone}
                      onChange={(e) =>
                        onChangeInvoice({
                          ...invoice,
                          company: { ...invoice.company, phone: e.target.value },
                        })
                      }
                      placeholder="Teléfono emisor"
                      className="text-neutral-600 text-left bg-transparent hover:bg-amber-50/50 rounded px-1 border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none w-36 print:border-none print:p-0"
                    />
                  </div>
                )}

                {invoice.company.email && (
                  <div className="flex items-center gap-1">
                    <input
                      type="email"
                      value={invoice.company.email}
                      onChange={(e) =>
                        onChangeInvoice({
                          ...invoice,
                          company: { ...invoice.company, email: e.target.value },
                        })
                      }
                      placeholder="Email emisor"
                      className="text-neutral-600 text-left bg-transparent hover:bg-amber-50/50 rounded px-1 border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none w-52 print:border-none print:p-0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Top Right: FACTURA Title, Print Preview Button, Invoice Number & Dates */}
            <div className="space-y-2 self-start md:self-auto flex flex-col items-start md:items-end text-left md:text-right shrink-0">
              <div className="flex items-center gap-3 flex-wrap md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 print:hidden" />
                  <h1
                    className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    FACTURA
                  </h1>
                </div>

                {/* Botón de vista de impresión (a la derecha del título Factura) */}
                <button
                  type="button"
                  id="a4-btn-vista-impresion"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="no-print print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-amber-100 hover:border-amber-400 border border-neutral-300/90 shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Mostrar vista de impresión de la hoja A4"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Vista de impresión</span>
                </button>
              </div>

              {/* Correlative invoice number & Dates (Right side of document) */}
              <div className="space-y-1.5 flex flex-col items-start md:items-end text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Nº de Factura:
                  </span>
                  <input
                    type="text"
                    value={invoice.number}
                    onChange={(e) => onChangeInvoice({ ...invoice, number: e.target.value.toUpperCase() })}
                    className="font-mono text-base sm:text-lg font-bold text-neutral-900 bg-amber-50/50 hover:bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 focus:border-amber-400 focus:bg-white focus:outline-none w-36 text-left md:text-right transition-colors print:border-none print:p-0 print:bg-transparent"
                    title="Número correlativo (F + año en curso + 4 dígitos)"
                  />
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="font-medium text-neutral-500">Fecha de emisión:</span>
                  <input
                    type="date"
                    value={invoice.date}
                    onChange={(e) => onChangeInvoice({ ...invoice, date: e.target.value })}
                    className="px-1.5 py-0.5 text-xs text-neutral-800 bg-transparent hover:bg-neutral-100 rounded border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none text-left md:text-right print:border-none print:p-0"
                  />
                </div>

                {invoice.dueDate && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <span className="font-medium text-neutral-500">Vencimiento:</span>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => onChangeInvoice({ ...invoice, dueDate: e.target.value })}
                      className="px-1.5 py-0.5 text-xs text-neutral-800 bg-transparent hover:bg-neutral-100 rounded border border-transparent hover:border-neutral-200 focus:border-amber-400 focus:outline-none text-left md:text-right print:border-none print:p-0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: CLIENT SECTION (Clean, distraction-free document layout) */}
          <div className="space-y-3">
            {/* Client Data Sheet Display (Under Issuer) */}
            {/* Phone and Email visible on screen, but HIDDEN on print */}
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50/70 border border-neutral-200/90 print:bg-transparent print:border-none print:p-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Datos del Cliente (Receptor)
                  </span>
                  {invoice.client.name && (
                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full print:hidden">
                      Cliente Asignado
                    </span>
                  )}
                </div>

                {/* Subtle client picker link if user wants to pull from database without clutter */}
                <div className="flex items-center gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={onOpenClientsSearch}
                    className="text-[11px] text-neutral-500 hover:text-amber-700 flex items-center gap-1 font-medium transition-colors"
                    title="Cargar datos de un cliente guardado en la base de datos"
                  >
                    <Search className="w-3 h-3 text-amber-600" />
                    <span>Cargar de BD</span>
                  </button>
                  <div
                    className="text-[10px] text-neutral-400 flex items-center gap-1"
                    title="El teléfono y correo del cliente se ven en pantalla pero se omiten en la impresión"
                  >
                    <EyeOff className="w-3 h-3 text-neutral-400" />
                    <span>Tel/Email ocultos al imprimir</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {/* Client Name */}
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={invoice.client.name}
                    readOnly
                    onClick={() => openClientEditor('name')}
                    onFocus={() => openClientEditor('name')}
                    placeholder="Nombre completo o Razón Social del cliente (Pulsar para editar)..."
                    className="font-bold text-sm sm:text-base text-neutral-900 w-full bg-amber-50/50 hover:bg-amber-50 focus:bg-amber-50 rounded px-2 py-1.5 border border-amber-200/80 cursor-pointer transition-colors print:p-0 print:border-none print:bg-transparent"
                  />
                </div>

                {/* Client NIF/CIF */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500 font-medium">NIF / CIF / DNI:</span>
                    <input
                      type="text"
                      value={invoice.client.nif}
                      readOnly
                      onClick={() => openClientEditor('nif')}
                      onFocus={() => openClientEditor('nif')}
                      placeholder="Ej. B88776655"
                      className="font-mono text-xs uppercase font-semibold text-neutral-800 bg-amber-50/50 hover:bg-amber-50 focus:bg-amber-50 rounded px-2 py-1 border border-amber-200/80 cursor-pointer flex-1 print:p-0 print:border-none print:bg-transparent"
                    />
                  </div>
                </div>

                {/* Client Address */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500 font-medium">Domicilio:</span>
                    <input
                      type="text"
                      value={invoice.client.address}
                      readOnly
                      onClick={() => openClientEditor('address')}
                      onFocus={() => openClientEditor('address')}
                      placeholder="Dirección fiscal del cliente..."
                      className="text-xs text-neutral-700 bg-amber-50/50 hover:bg-amber-50 focus:bg-amber-50 rounded px-2 py-1 border border-amber-200/80 cursor-pointer flex-1 print:p-0 print:border-none print:bg-transparent"
                    />
                  </div>
                </div>

                {/* Client Phone (VISIBLE ON SCREEN, HIDDEN ON PRINT) */}
                <div className="print:hidden">
                  <div className="flex items-center gap-1.5 text-neutral-600 bg-amber-50/40 px-2 py-1 rounded border border-amber-200/50">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 font-medium">Tel:</span>
                    <input
                      type="tel"
                      value={invoice.client.phone}
                      readOnly
                      onClick={() => openClientEditor('phone')}
                      onFocus={() => openClientEditor('phone')}
                      placeholder="Teléfono del cliente"
                      className="text-xs text-neutral-800 bg-white/70 hover:bg-white rounded px-1.5 py-1 border border-amber-200 cursor-pointer flex-1"
                    />
                  </div>
                </div>

                {/* Client Email (VISIBLE ON SCREEN, HIDDEN ON PRINT) */}
                <div className="print:hidden">
                  <div className="flex items-center gap-1.5 text-neutral-600 bg-amber-50/40 px-2 py-1 rounded border border-amber-200/50">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 font-medium">Email:</span>
                    <input
                      type="email"
                      value={invoice.client.email}
                      readOnly
                      onClick={() => openClientEditor('email')}
                      onFocus={() => openClientEditor('email')}
                      placeholder="correo@cliente.com"
                      className="text-xs text-neutral-800 bg-white/70 hover:bg-white rounded px-1.5 py-1 border border-amber-200 cursor-pointer flex-1"
                    />
                  </div>
                </div>

                {/* Canal de Envío de Documentos Preferente (VISIBLE SOLO EN PANTALLA) */}
                <div className="print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 rounded bg-amber-50/70 border border-amber-200/60 text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                      <Send className="w-3 h-3 text-neutral-500" />
                      <span>Envío preferente:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Toggle rápido de WhatsApp */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextWhatsApp = !invoice.client.defaultSendWhatsApp;
                          const nextEmail = Boolean(invoice.client.defaultSendEmail);
                          const nextChannel =
                            nextWhatsApp && nextEmail
                              ? 'both'
                              : nextWhatsApp
                              ? 'whatsapp'
                              : nextEmail
                              ? 'email'
                              : undefined;
                          onChangeInvoice({
                            ...invoice,
                            client: {
                              ...invoice.client,
                              defaultSendWhatsApp: nextWhatsApp,
                              preferredDispatchChannel: nextChannel,
                            },
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          invoice.client.defaultSendWhatsApp
                            ? 'bg-[#25D366] text-neutral-950 shadow-sm'
                            : 'bg-neutral-200/90 text-neutral-500 hover:bg-neutral-300'
                        }`}
                        title="Activar o desactivar WhatsApp por defecto para este cliente"
                      >
                        <MessageCircle className="w-2.5 h-2.5 fill-current" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Toggle rápido de Email */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextEmail = !invoice.client.defaultSendEmail;
                          const nextWhatsApp = Boolean(invoice.client.defaultSendWhatsApp);
                          const nextChannel =
                            nextEmail && nextWhatsApp
                              ? 'both'
                              : nextEmail
                              ? 'email'
                              : nextWhatsApp
                              ? 'whatsapp'
                              : undefined;
                          onChangeInvoice({
                            ...invoice,
                            client: {
                              ...invoice.client,
                              defaultSendEmail: nextEmail,
                              preferredDispatchChannel: nextChannel,
                            },
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          invoice.client.defaultSendEmail
                            ? 'bg-sky-500 text-neutral-950 shadow-sm'
                            : 'bg-neutral-200/90 text-neutral-500 hover:bg-neutral-300'
                        }`}
                        title="Activar o desactivar Email por defecto para este cliente"
                      >
                        <Mail className="w-2.5 h-2.5" />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Items / Concept lines Table */}
          <div className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-900 text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                    <th className="py-2.5 px-2 w-[50%]">Concepto / Descripción</th>
                    <th className="py-2.5 px-2 text-center w-[15%]">Unidades</th>
                    <th className="py-2.5 px-2 text-right w-[17%]">Precio Ud.</th>
                    <th className="py-2.5 px-2 text-right w-[18%]">Total</th>
                    <th className="py-2.5 px-1 w-[40px] print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs">
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-amber-50/30 transition-colors">
                      {/* Concept column with intelligent autocomplete memory */}
                      <td className="py-2 px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 min-w-0">
                            <ConceptAutocompleteInput
                              id={`concept-input-${index}`}
                              value={item.concept}
                              onChange={(val) => handleItemChange(index, 'concept', val)}
                              onConceptCommitted={onConceptCommitted}
                              allConcepts={concepts}
                              placeholder="Escriba concepto (con memoria inteligente)..."
                            />
                          </div>
                          {onOpenAttachProduct && (
                            <button
                              type="button"
                              id={`line-attach-product-${index}`}
                              onClick={() => onOpenAttachProduct(index)}
                              className="shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-amber-700 hover:bg-amber-100/70 transition-colors print:hidden cursor-pointer"
                              title="Adjuntar producto del catálogo a esta línea"
                            >
                              <Package className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Units column */}
                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.units === 0 ? '' : item.units}
                          onChange={(e) => handleItemChange(index, 'units', e.target.value)}
                          placeholder="1"
                          className="w-20 text-center font-mono py-1 px-1.5 rounded border border-transparent hover:border-neutral-300 focus:border-amber-400 focus:outline-none bg-transparent focus:bg-white print:border-none print:p-0"
                        />
                      </td>

                      {/* Unit Price column */}
                      <td className="py-2 px-1 text-right">
                        <div className="inline-flex items-center justify-end">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unitPrice === 0 ? '' : item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            className="w-24 text-right font-mono py-1 px-1.5 rounded border border-transparent hover:border-neutral-300 focus:border-amber-400 focus:outline-none bg-transparent focus:bg-white print:border-none print:p-0"
                          />
                          <span className="text-neutral-400 text-xs ml-1 font-mono">€</span>
                        </div>
                      </td>

                      {/* Line total column */}
                      <td className="py-2 px-2 text-right font-mono font-semibold text-neutral-900 text-xs sm:text-sm">
                        {formatCurrency(item.total)}
                      </td>

                      {/* Delete item button */}
                      <td className="py-2 px-1 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-neutral-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTON FOR CONCEPT LINES: Clean standard add line */}
            <div className="mt-3 flex items-center gap-2 print:hidden flex-wrap">
              <button
                type="button"
                id="add-concept-line-btn"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 text-amber-900 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir línea de concepto</span>
              </button>

              {onOpenAttachProduct && (
                <button
                  type="button"
                  id="attach-product-line-btn"
                  onClick={() => onOpenAttachProduct()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400 hover:border-amber-500 bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  title="Adjuntar producto facturable del catálogo para que su nombre se ponga en la línea de concepto"
                >
                  <Package className="w-3.5 h-3.5 text-amber-700" />
                  <span>Adjuntar producto</span>
                </button>
              )}

              <button
                type="button"
                id="add-complex-invoice-line-btn"
                onClick={onOpenComplexBudgetModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-amber-400 bg-neutral-100 hover:bg-amber-50 text-neutral-700 hover:text-neutral-950 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Añadir línea de factura compleja con variantes técnicas (m², ml, %)"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Factura Compleja (Variantes)</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Calculations + Veri*Factu AEAT + Payment details */}
        <div className="mt-8 space-y-6">
          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-neutral-200">
            {/* Payment & Bank Details (Left side) */}
            <div className="space-y-2 text-xs text-neutral-600 max-w-sm">
              <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                <CreditCard className="w-4 h-4 text-neutral-500" />
                <span>Forma de pago y datos bancarios</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70 space-y-1">
                {invoice.company.iban ? (
                  <>
                    {invoice.company.bankName && (
                      <div className="text-neutral-700 font-medium">{invoice.company.bankName}</div>
                    )}
                    <div className="font-mono text-neutral-900 font-semibold text-xs tracking-wider">
                      IBAN: {invoice.company.iban}
                    </div>
                  </>
                ) : (
                  <div className="text-neutral-400 italic text-[11px] print:hidden">
                    (Configura tu IBAN en la pestaña de configuración para que aparezca aquí)
                  </div>
                )}
                <div className="text-[11px] text-neutral-500 pt-0.5">
                  Transferencia bancaria o emisión directa. Indicar nº factura como concepto.
                </div>
              </div>
            </div>

            {/* Calculations Breakdown (Right side) */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              {/* Base Imponible */}
              <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                <span className="text-neutral-600 font-medium">Base Imponible:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {formatCurrency(baseImponible)}
                </span>
              </div>

              {/* IVA 21% */}
              <div className="flex justify-between items-center py-1 border-b border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-700 font-semibold">IVA</span>
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                    21%
                  </span>
                </div>
                <span className="font-mono font-semibold text-neutral-900">
                  {formatCurrency(cuotaIva)}
                </span>
              </div>

              {/* Optional IRPF toggle */}
              {invoice.irpfRate > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-neutral-100 text-neutral-700">
                  <span className="font-medium">Retención IRPF (-{invoice.irpfRate}%):</span>
                  <span className="font-mono font-semibold text-red-600">
                    -{formatCurrency(cuotaIrpf)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 pb-1 border-t-2 border-neutral-900">
                <span className="text-sm font-extrabold uppercase tracking-wide text-neutral-900">
                  TOTAL FACTURA
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-neutral-950">
                  {formatCurrency(totalFactura)}
                </span>
              </div>
            </div>
          </div>

          {/* VERI*FACTU OFFICIAL VALIDATION BLOCK (AEAT Compliant) */}
          <div
            id="verifactu-validation-box"
            onClick={onOpenVeriFactuModal}
            className="p-3.5 sm:p-4 rounded-xl border border-neutral-300 bg-neutral-50/80 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:border-amber-400 hover:bg-neutral-50 transition-all print:bg-white print:border-neutral-300"
            title="Factura validada por Veri*Factu. Clic para examinar huella digital y datos tributarios"
          >
            <div className="flex items-center gap-4">
              {/* Veri*Factu QR Code */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 rounded-lg border border-neutral-300 shrink-0 shadow-sm flex items-center justify-center">
                {invoice.veriFactu.qrDataUrl ? (
                  <img
                    src={invoice.veriFactu.qrDataUrl}
                    alt="Código QR Veri*Factu AEAT"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-8 h-8 text-neutral-400" />
                )}
              </div>

              {/* Text Badge and Legal Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] tracking-wide uppercase">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    VERI*FACTU VALIDADA
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                    {invoice.veriFactu.systemId}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-neutral-900 leading-tight">
                  Factura verificable en la sede electrónica de la AEAT
                </p>
                <p className="text-[10px] text-neutral-500 leading-snug">
                  Sistema Informático de Facturación adaptado al Real Decreto 1007/2023. Huella digital encadenada:{' '}
                  <span className="font-mono text-neutral-700">
                    {invoice.veriFactu.chainHash ? `${invoice.veriFactu.chainHash.slice(0, 16)}...` : 'En proceso'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 print:hidden">
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 hover:underline">
                <span>Inspeccionar Veri*Factu</span>
                <ExternalLink className="w-3 h-3" />
              </span>
              <span className="text-[9px] text-neutral-400">Escaneable con móvil</span>
            </div>
          </div>

          {/* Legal Footer Note */}
          <div className="pt-2 text-center text-[10px] text-neutral-400 border-t border-neutral-100">
            <p>
              Documento emitido conforme a la legislación fiscal española. Gestarian Quick · Soluciones de Facturación Inteligente.
            </p>
          </div>

          {/* PIE DE LA HOJA A4: BOTONES DE GUARDAR, ENVIAR POR WHATSAPP E IMPRIMIR (Ocultos al imprimir) */}
          <div className="pt-4 border-t-2 border-neutral-200 print:hidden space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Botón de Guardar Factura */}
              <button
                type="button"
                id="a4-footer-save-btn"
                onClick={handleSave}
                className={`w-full py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  isSavedLocal
                    ? 'bg-neutral-900 text-emerald-400 border-emerald-500/50 hover:bg-neutral-850'
                    : 'bg-neutral-900 hover:bg-neutral-850 text-stone-100 border-neutral-700 hover:shadow-xl'
                }`}
                title="Guardar factura actual en la Base de Datos"
              >
                {isSavedLocal ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Factura Guardada</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Guardar Factura</span>
                  </>
                )}
              </button>

              {/* 2. Botón de Enviar por WhatsApp (Inactivo y gris hasta que se guarde) */}
              <button
                type="button"
                id="a4-footer-whatsapp-btn"
                disabled={!isSavedLocal}
                onClick={handleWhatsApp}
                className={`relative w-full py-3.5 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isSavedLocal
                    ? invoice.client.defaultSendWhatsApp
                      ? 'bg-[#25D366] hover:bg-[#20bd5a] text-neutral-950 shadow-lg hover:shadow-[#25D366]/30 active:scale-[0.98] cursor-pointer ring-2 ring-[#25D366]/40'
                      : 'bg-[#25D366]/80 hover:bg-[#25D366] text-neutral-950 shadow-md active:scale-[0.98] cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                }`}
                title={
                  isSavedLocal
                    ? 'Enviar factura por WhatsApp a través de notificaciones.gestarian.com'
                    : 'Debes guardar la factura primero para poder enviarla por WhatsApp'
                }
              >
                <MessageCircle
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isSavedLocal ? 'text-neutral-950 fill-neutral-950' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">Enviar WhatsApp</span>
                {invoice.client.defaultSendWhatsApp && isSavedLocal && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-black/25 text-neutral-950 rounded-md">
                    Defecto
                  </span>
                )}
              </button>

              {/* 3. Botón de Enviar por Email (Inactivo y gris hasta que se guarde) */}
              <button
                type="button"
                id="a4-footer-email-btn"
                disabled={!isSavedLocal}
                onClick={handleEmail}
                className={`relative w-full py-3.5 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isSavedLocal
                    ? invoice.client.defaultSendEmail
                      ? 'bg-sky-400 hover:bg-sky-300 text-neutral-950 shadow-lg hover:shadow-sky-400/30 active:scale-[0.98] cursor-pointer ring-2 ring-sky-400/40'
                      : 'bg-sky-500 hover:bg-sky-400 text-neutral-950 shadow-md active:scale-[0.98] cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                }`}
                title={
                  isSavedLocal
                    ? 'Enviar factura por Correo Electrónico al cliente'
                    : 'Debes guardar la factura primero para poder enviarla por Email'
                }
              >
                <Mail
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isSavedLocal ? 'text-neutral-950' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">Enviar Email</span>
                {invoice.client.defaultSendEmail && isSavedLocal && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-black/25 text-neutral-950 rounded-md">
                    Defecto
                  </span>
                )}
              </button>

              {/* 4. Botón de Imprimir Factura */}
              <button
                type="button"
                id="a4-footer-print-btn"
                disabled={!isSavedLocal}
                onClick={handlePrint}
                className={`w-full py-3.5 px-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isSavedLocal
                    ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-lg hover:shadow-amber-400/30 active:scale-[0.98] cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                }`}
                title={
                  isSavedLocal
                    ? 'Imprimir factura o guardar como PDF'
                    : 'Debes guardar la factura primero para poder imprimirla'
                }
              >
                <Printer
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isSavedLocal ? 'text-neutral-950' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">Imprimir Factura</span>
              </button>
            </div>

            {/* Aviso informativo de activación tras guardar */}
            <div className="text-center text-[11px] pt-1">
              {!isSavedLocal ? (
                <span className="text-neutral-400 italic">
                  * Pulsa <strong>"Guardar Factura"</strong> para activar los botones de envío (WhatsApp / Email) e Impresión.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold inline-flex flex-wrap items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Factura guardada correctamente. Medio preferente:{' '}
                    <strong>
                      {invoice.client.defaultSendWhatsApp && invoice.client.defaultSendEmail
                        ? 'WhatsApp y Email'
                        : invoice.client.defaultSendEmail
                        ? 'Correo Electrónico (Email)'
                        : invoice.client.defaultSendWhatsApp
                        ? 'WhatsApp'
                        : 'WhatsApp / Email'}
                    </strong>
                    . Botones de envío e impresión activados y listos.
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Vista de Impresión */}
      {isPrintPreviewOpen && (
        <PrintPreviewModal
          invoice={invoice}
          onClose={() => setIsPrintPreviewOpen(false)}
          onPrint={() => {
            window.print();
          }}
        />
      )}

      {/* Modal de Edición de Cliente con 60% Form y 40% Teclado Táctil */}
      {isClientEditorOpen && (
        <ClientEditorModal
          isOpen={isClientEditorOpen}
          onClose={() => setIsClientEditorOpen(false)}
          client={invoice.client}
          initialField={clientEditorField}
          onSave={(updatedClient) => {
            onChangeInvoice({
              ...invoice,
              client: updatedClient,
            });
          }}
        />
      )}
    </div>
  );
};
