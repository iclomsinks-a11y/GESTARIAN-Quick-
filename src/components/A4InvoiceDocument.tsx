import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  Package,
  ArrowLeft,
  Printer,
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
import { LineasComplejasDropdown } from './LineasComplejasDropdown';
import { ProductosClienteDropdown } from './ProductosClienteDropdown';

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
  onOpenProvidersModal?: () => void;
  onOpenAttachProduct?: (lineIndex?: number) => void;
  onSaveInvoice?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenEmailModal?: () => void;
  onPrint?: () => void;
  isSaved?: boolean;
  isPrintPreviewOpen?: boolean;
  onOpenPrintPreview?: () => void;
  onClosePrintPreview?: () => void;
  onBack?: () => void;
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
  onOpenAttachProduct,
  onSaveInvoice,
  onOpenWhatsAppModal,
  onOpenEmailModal,
  onPrint,
  isSaved = false,
  isPrintPreviewOpen: propIsPrintPreviewOpen,
  onOpenPrintPreview,
  onClosePrintPreview,
  onBack,
}) => {
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState<boolean>(Boolean(isSaved));
  const [internalPrintPreviewOpen, setInternalPrintPreviewOpen] = useState<boolean>(false);

  const isPrintPreviewOpen = propIsPrintPreviewOpen !== undefined ? propIsPrintPreviewOpen : internalPrintPreviewOpen;
  const handleOpenPrintPreview = onOpenPrintPreview || (() => setInternalPrintPreviewOpen(true));
  const handleClosePrintPreview = onClosePrintPreview || (() => setInternalPrintPreviewOpen(false));

  const [isClientEditorOpen, setIsClientEditorOpen] = useState<boolean>(false);
  const [clientEditorField, setClientEditorField] = useState<ClientInputField>('name');

  const [activeInputLabel, setActiveInputLabel] = useState<string>('');
  const a4SheetRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Centra suavemente el campo activo en la zona superior del visor sobre el teclado del dispositivo
  const centerInTop60Viewer = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    setTimeout(() => {
      let scrollContainer: HTMLElement | Window = window;
      let parent = el.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          parent.scrollHeight > parent.clientHeight
        ) {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }

      const elRect = el.getBoundingClientRect();
      const elCenterY = elRect.top + elRect.height / 2;

      // Centrado ergonómico para dejar espacio al teclado virtual nativo del dispositivo
      const targetCenterY = window.innerHeight * 0.32;
      const deltaY = elCenterY - targetCenterY;

      if (Math.abs(deltaY) > 3) {
        if (scrollContainer === window) {
          window.scrollBy({ top: deltaY, behavior: 'smooth' });
        } else {
          (scrollContainer as HTMLElement).scrollBy({ top: deltaY, behavior: 'smooth' });
        }
      }
    }, 40);
  }, []);

  const handleInputFocus = (e: React.FocusEvent<HTMLElement>, label: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const el = e.currentTarget;
    setActiveInputLabel(label);

    // Centrar suavemente en el visor sobre el teclado nativo del dispositivo
    centerInTop60Viewer(el);
  };

  const handleInputBlur = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      const activeEl = document.activeElement;
      const isStillInDocInput =
        activeEl &&
        a4SheetRef.current?.contains(activeEl) &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (!isStillInDocInput) {
        setActiveInputLabel('');
      }
    }, 250);
  };

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

  const handleAddItemWithConcept = (conceptText: string) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concept: conceptText,
      units: 1,
      unitPrice: 0,
      total: 0,
    };
    
    // If there is only one item and it is completely empty, replace it
    if (invoice.items.length === 1 && !invoice.items[0].concept.trim() && invoice.items[0].total === 0) {
      onChangeInvoice({ ...invoice, items: [newItem] });
    } else {
      onChangeInvoice({ ...invoice, items: [...invoice.items, newItem] });
    }
    onConceptCommitted(conceptText);
  };

  // Direct logo upload from A4 sheet
  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-4 px-2 sm:px-4 pb-4 transition-all">
      {/* Barra Superior con Botón Volver, Número de Factura y Botón Imprimir */}
      <div className="w-full max-w-[840px] mb-3 sm:mb-4 flex items-center justify-between gap-3 bg-neutral-950/80 border border-neutral-800 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md shadow-lg print:hidden">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-stone-100 hover:text-white border border-neutral-700 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
            title="Volver a la lista de Facturas Emitidas"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Volver a Facturas Emitidas</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1.5 rounded-xl border border-amber-400/30">
            {invoice.number || 'Factura'}
          </span>

          {/* Botón Imprimir Superior: Identifica estado guardado (color predeterminado) o no guardado (icono gris 50%) */}
          <button
            type="button"
            id="a4-top-print-btn"
            disabled={!isSavedLocal}
            onClick={() => {
              if (!isSavedLocal) return;
              handleOpenPrintPreview();
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
              isSavedLocal
                ? 'bg-neutral-900 hover:bg-neutral-850 text-stone-100 hover:text-white border border-neutral-700 hover:border-amber-400/80 cursor-pointer shadow-md ring-1 ring-amber-400/30'
                : 'bg-neutral-950/80 border border-neutral-850 cursor-not-allowed select-none'
            }`}
            style={{
              color: isSavedLocal ? undefined : '#808080',
            }}
            title={
              isSavedLocal
                ? 'Abrir vista de impresión y enviar a la impresora preconfigurada'
                : 'Debes pulsar "Guardar Factura" para activar la impresión'
            }
          >
            <Printer
              className="w-4 h-4 shrink-0 transition-colors"
              style={{
                color: isSavedLocal ? '#F59E0B' : '#808080',
              }}
            />
            <span style={{ color: isSavedLocal ? undefined : '#808080' }}>
              Imprimir
            </span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container: standardized 210mm x 297mm aspect ratio container */}
      <div
        ref={a4SheetRef}
        id="a4-invoice-sheet"
        className={`a4-sheet w-full max-w-[840px] min-h-[1180px] bg-white text-neutral-800 rounded-sm shadow-[0_15px_50px_-12px_rgba(0,0,0,0.18)] p-6 sm:p-12 md:p-14 flex flex-col justify-between border border-neutral-200/90 relative transition-all duration-300 ease-out origin-center print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:min-h-0 ${
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
              {/* Logo: Located to the left, left-aligned (Only displayed if user configured a custom logo) */}
              {Boolean(invoice.company.logoUrl && invoice.company.logoUrl.trim() && !invoice.company.logoUrl.startsWith('data:image/svg+xml')) && (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-neutral-200 bg-white p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img
                    src={invoice.company.logoUrl}
                    alt="Logo Empresa"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              {/* Company Fiscal & Contact Data (strictly left-aligned, outside inputs like printable version) */}
              <div className="text-left space-y-1 text-xs text-neutral-700 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight">
                    {invoice.company.name || 'Empresa Emisora (Emisor Fiscal)'}
                  </h2>
                </div>

                {invoice.company.cif && (
                  <div className="font-mono text-xs font-semibold text-neutral-800">
                    <span className="text-neutral-500 font-normal">CIF/NIF: </span>
                    <span>{invoice.company.cif}</span>
                  </div>
                )}

                {invoice.company.address && (
                  <div className="text-neutral-600 text-xs leading-relaxed max-w-sm">
                    {invoice.company.address}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-neutral-600 text-xs">
                  {invoice.company.phone && (
                    <div>
                      <span className="text-neutral-500 font-medium">Tel: </span>
                      <span className="font-mono">{invoice.company.phone}</span>
                    </div>
                  )}
                  {invoice.company.email && (
                    <div>
                      <span className="text-neutral-500 font-medium">Email: </span>
                      <span>{invoice.company.email}</span>
                    </div>
                  )}
                </div>

                {invoice.company.iban && (
                  <div className="text-[11px] font-mono text-neutral-600">
                    <span className="text-neutral-500 font-sans">IBAN: </span>
                    <span>{invoice.company.iban}</span>
                    {invoice.company.bankName && (
                      <span className="text-neutral-500 font-sans ml-1">({invoice.company.bankName})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top Right: FACTURA Title, Invoice Number & Dates */}
            <div className="space-y-2 self-start md:self-auto flex flex-col items-start md:items-end text-left md:text-right shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 print:hidden" />
                <h1
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 uppercase"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  FACTURA
                </h1>
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
                    onFocus={(e) => handleInputFocus(e, 'Nº de Factura')}
                    onBlur={handleInputBlur}
                    className="font-mono text-base sm:text-lg font-bold text-neutral-900 bg-amber-50/50 hover:bg-amber-50 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-500 px-2 py-0.5 rounded border border-amber-200/70 focus:outline-none w-36 text-left md:text-right transition-all print:border-none print:p-0 print:bg-transparent"
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
                    onFocus={(e) => handleInputFocus(e, 'Fecha de Emisión')}
                    onBlur={handleInputBlur}
                    className="px-1.5 py-0.5 text-xs text-neutral-800 bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-500 rounded border border-transparent hover:border-neutral-200 focus:outline-none text-left md:text-right transition-all print:border-none print:p-0"
                  />
                </div>

                {invoice.dueDate && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <span className="font-medium text-neutral-500">Vencimiento:</span>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => onChangeInvoice({ ...invoice, dueDate: e.target.value })}
                      onFocus={(e) => handleInputFocus(e, 'Fecha de Vencimiento')}
                      onBlur={handleInputBlur}
                      className="px-1.5 py-0.5 text-xs text-neutral-800 bg-transparent hover:bg-neutral-100 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-500 rounded border border-transparent hover:border-neutral-200 focus:outline-none text-left md:text-right transition-all print:border-none print:p-0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: CLIENT SECTION (Formato imprimible sin recuadros, igual que los datos del emisor) */}
          <div className="text-left space-y-1 text-xs text-neutral-700">
            {/* Header / Actions: Etiqueta y botón Cargar de BD */}
            <div className="flex items-center justify-between gap-3 pb-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Cliente (Receptor)
                </span>
                {invoice.client.name && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full print:hidden">
                    Cliente Asignado
                  </span>
                )}
              </div>

              {/* Botón Cargar de BD para ir a la página de clientes */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  id="btn-cargar-cliente-bd-a4"
                  onClick={onOpenClientsSearch}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border border-amber-500/30"
                  title="Cargar datos del cliente desde la base de datos de clientes"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.2] text-neutral-950" />
                  <span className="text-neutral-950 font-bold">Cargar de BD</span>
                </button>
              </div>
            </div>

            {/* Nombre del Cliente en formato imprimible */}
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight">
                {invoice.client.name || (
                  <span className="text-neutral-400 font-normal italic">
                    Sin cliente asignado (pulsa «Cargar de BD» para seleccionar)
                  </span>
                )}
              </h3>
            </div>

            {/* CIF / NIF del Cliente en formato imprimible */}
            {invoice.client.nif && (
              <div className="font-mono text-xs font-semibold text-neutral-800">
                <span className="text-neutral-500 font-normal">CIF/NIF: </span>
                <span>{invoice.client.nif}</span>
              </div>
            )}

            {/* Domicilio del Cliente en formato imprimible */}
            {invoice.client.address && (
              <div className="text-neutral-600 text-xs leading-relaxed max-w-sm">
                <span>{invoice.client.address}</span>
              </div>
            )}

            {/* Teléfono y Correo del Cliente */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-neutral-600 text-xs">
              {invoice.client.phone && (
                <div>
                  <span className="text-neutral-500 font-medium">Tel: </span>
                  <span className="font-mono">{invoice.client.phone}</span>
                </div>
              )}
              {invoice.client.email && (
                <div>
                  <span className="text-neutral-500 font-medium">Email: </span>
                  <span>{invoice.client.email}</span>
                </div>
              )}
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
                              onFocusInput={(e) => handleInputFocus(e, `Concepto (Línea ${index + 1})`)}
                              onBlurInput={handleInputBlur}
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
                          onFocus={(e) => handleInputFocus(e, `Unidades (Línea ${index + 1})`)}
                          onBlur={handleInputBlur}
                          placeholder="1"
                          className="w-20 text-center font-mono py-1 px-1.5 rounded border border-transparent hover:border-neutral-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all print:border-none print:p-0"
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
                            onFocus={(e) => handleInputFocus(e, `Precio Ud. (Línea ${index + 1})`)}
                            onBlur={handleInputBlur}
                            placeholder="0.00"
                            className="w-24 text-right font-mono py-1 px-1.5 rounded border border-transparent hover:border-neutral-300 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all print:border-none print:p-0"
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
                          className="p-1 rounded text-[#EF4444] hover:text-red-600 hover:bg-red-50 transition-colors"
                          style={{ color: '#EF4444' }}
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
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
                title="Añadir una nueva línea libre de concepto a la factura"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir línea libre</span>
              </button>

              {invoice.client.enableComplexInvoice && (
                <LineasComplejasDropdown
                  estructuras={invoice.client.lineasComplejas || []}
                  onSelect={handleAddItemWithConcept}
                />
              )}

              {invoice.client.enableProductsCatalog && (
                <ProductosClienteDropdown
                  productos={invoice.client.habitualProducts || []}
                  onSelect={handleAddItemWithConcept}
                />
              )}
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
        </div>

          {/* PIE DE LA HOJA A4: BOTONES DE GUARDAR, IMPRIMIR Y ENVIAR POR WHATSAPP O EMAIL SEGÚN ENVÍO PREFERENTE */}
          <div className="pt-4 border-t-2 border-neutral-200 print:hidden space-y-3">
            {/* Canales de envío preferente del cliente */}
            {(() => {
              const preferredChannel =
                invoice.client.preferredDispatchChannel ||
                (invoice.client.defaultSendEmail && !invoice.client.defaultSendWhatsApp ? 'email' : 'whatsapp');

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      title="Guardar factura y activar los botones de impresión y envío"
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

                    {/* 2. Botón de Imprimir Factura: Activo cuando está guardada, o gris 50% cuando no */}
                    <button
                      type="button"
                      id="a4-footer-print-btn"
                      disabled={!isSavedLocal}
                      onClick={() => {
                        if (!isSavedLocal) return;
                        handleOpenPrintPreview();
                      }}
                      className={`w-full py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                        isSavedLocal
                          ? 'bg-neutral-900 hover:bg-neutral-850 text-stone-100 hover:text-white border-neutral-700 hover:border-amber-400 shadow-md active:scale-[0.98] cursor-pointer ring-1 ring-amber-400/30'
                          : 'bg-neutral-100 border-neutral-300 cursor-not-allowed shadow-none select-none'
                      }`}
                      style={{
                        color: isSavedLocal ? undefined : '#808080',
                      }}
                      title={
                        isSavedLocal
                          ? 'Imprimir documento en la impresora preconfigurada del dispositivo'
                          : 'Debes pulsar "Guardar Factura" para activar la impresión'
                      }
                    >
                      <Printer
                        className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors"
                        style={{
                          color: isSavedLocal ? '#F59E0B' : '#808080',
                        }}
                      />
                      <span style={{ color: isSavedLocal ? undefined : '#808080' }}>
                        Imprimir
                      </span>
                    </button>

                    {/* 3. Botón de Enviar por WhatsApp O Enviar por Email según esté configurado el cliente */}
                    {preferredChannel === 'whatsapp' ? (
                      <button
                        type="button"
                        id="a4-footer-send-btn"
                        disabled={!isSavedLocal}
                        onClick={handleWhatsApp}
                        className={`w-full py-3.5 px-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          isSavedLocal
                            ? 'bg-[#25D366] hover:bg-[#20bd5a] text-neutral-950 shadow-lg hover:shadow-[#25D366]/30 active:scale-[0.98] cursor-pointer ring-2 ring-[#25D366]/40'
                            : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                        }`}
                        title={
                          isSavedLocal
                            ? 'Enviar factura por WhatsApp al cliente'
                            : 'Debes pulsar "Guardar Factura" para activar el botón de envío por WhatsApp'
                        }
                      >
                        <MessageCircle
                          className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#25D366]"
                          style={{ color: '#25D366' }}
                        />
                        <span className="truncate">Enviar WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="a4-footer-send-btn"
                        disabled={!isSavedLocal}
                        onClick={handleEmail}
                        className={`w-full py-3.5 px-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          isSavedLocal
                            ? 'bg-sky-400 hover:bg-sky-300 text-neutral-950 shadow-lg hover:shadow-sky-400/30 active:scale-[0.98] cursor-pointer ring-2 ring-sky-400/40'
                            : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                        }`}
                        title={
                          isSavedLocal
                            ? 'Enviar factura por Correo Electrónico al cliente'
                            : 'Debes pulsar "Guardar Factura" para activar el botón de envío por Email'
                        }
                      >
                        <Mail
                          className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                            isSavedLocal ? 'text-neutral-950' : 'text-neutral-400'
                          }`}
                        />
                        <span className="truncate">Enviar Email</span>
                      </button>
                    )}
                  </div>

                  {/* Informative helper text */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 px-1">
                    <div>
                      {!isSavedLocal ? (
                        <span className="text-amber-700 font-medium">
                          * Pulsa <strong>"Guardar Factura"</strong> para activar la impresión y el envío por {preferredChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                          <span>Factura guardada. Impresión y envío por {preferredChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} activados.</span>
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
        </div>
      </div>

      {/* Modal de Vista de Impresión */}
      {isPrintPreviewOpen && (
        <PrintPreviewModal
          invoice={invoice}
          onClose={handleClosePrintPreview}
          onPrint={onPrint || (() => {
            window.print();
          })}
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
