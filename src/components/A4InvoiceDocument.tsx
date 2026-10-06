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
import { WhatsAppIcon } from './WhatsAppIcon';
import { formatCurrency, formatDecimal, formatDate, getTodayIso } from '../utils/formatters';
import {
  generateWhatsAppInvoiceMessage,
  getWhatsAppDirectUrl,
  sendGestarianWhatsAppNotification,
  getStoredWhatsAppDispatches,
  getStoredEmailDispatches,
} from '../services/notificationService';
import { ConceptAutocompleteInput } from './ConceptAutocompleteInput';
import { PrintPreviewModal } from './PrintPreviewModal';
import { ClientEditorModal, ClientInputField } from './ClientEditorModal';
import { printInvoiceUniversal } from '../utils/printerService';
import { LineasComplejasDropdown } from './LineasComplejasDropdown';
import { ProductosClienteDropdown } from './ProductosClienteDropdown';
import { CustomCalendarModal } from './CustomCalendarModal';

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
  isViewOnly?: boolean;
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
  isViewOnly = false,
  isPrintPreviewOpen: propIsPrintPreviewOpen,
  onOpenPrintPreview,
  onClosePrintPreview,
  onBack,
}) => {
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const isRectificative =
    invoice.number?.toUpperCase().startsWith('FR') ||
    invoice.number?.toUpperCase().startsWith('R') ||
    invoice.notes?.toLowerCase().includes('rectificativ') ||
    invoice.items?.some((it) => it.concept?.toLowerCase().includes('rectificaci'));
  const [isSavedLocal, setIsSavedLocal] = useState<boolean>(Boolean(isSaved));
  const [internalPrintPreviewOpen, setInternalPrintPreviewOpen] = useState<boolean>(false);

  const isPrintPreviewOpen = propIsPrintPreviewOpen !== undefined ? propIsPrintPreviewOpen : internalPrintPreviewOpen;
  const handleOpenPrintPreview = onOpenPrintPreview || (() => setInternalPrintPreviewOpen(true));
  const handleClosePrintPreview = onClosePrintPreview || (() => setInternalPrintPreviewOpen(false));

  const [isClientEditorOpen, setIsClientEditorOpen] = useState<boolean>(false);
  const [clientEditorField, setClientEditorField] = useState<ClientInputField>('name');

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'units' | 'unitPrice'>('units');
  const [editCantidad, setEditCantidad] = useState('0');
  const [editPrecio, setEditPrecio] = useState('0');
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const handleItemInputClick = (index: number, field: 'units' | 'unitPrice') => {
    setEditingItemIndex(index);
    setEditingField(field);
    const item = invoice.items[index];
    setEditCantidad((item.units !== undefined && item.units !== null ? item.units : 0).toString());
    setEditPrecio((item.unitPrice !== undefined && item.unitPrice !== null ? item.unitPrice : 0).toString());
  };

  const handleConfirmEditInline = () => {
    if (editingItemIndex === null) return;
    const parsedQty = parseFloat(editCantidad.replace(',', '.'));
    const parsedPrice = parseFloat(editPrecio.replace(',', '.'));
    if (!isNaN(parsedQty)) {
      handleItemChange(editingItemIndex, 'units', parsedQty);
    }
    if (!isNaN(parsedPrice)) {
      handleItemChange(editingItemIndex, 'unitPrice', parsedPrice);
    }
    setEditingItemIndex(null);
  };

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

  // Pulsar "Imprimir" abre la vista de impresión; ésta lanza automáticamente el diálogo
  // nativo del sistema (impresora predeterminada, nº de copias, PDF) imprimiendo solo la hoja A4.
  const handlePrint = () => {
  // Use the universal printer service to ensure the preconfigured print version
  printInvoiceUniversal(invoice);
};

  const handleWhatsApp = () => {
    if (!isSavedLocal) return;

    const baseImp = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const ivaAmt = baseImp * (invoice.ivaRate / 100);
    const irpfAmt = baseImp * ((invoice.irpfRate || 0) / 100);
    const totalCalc = baseImp + ivaAmt - irpfAmt;
    const phone = invoice.client?.phone || '';

    const messageText = generateWhatsAppInvoiceMessage({
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      clientPhone: phone,
      clientName: invoice.client?.name || 'Cliente',
      clientEmail: invoice.client?.email,
      companyName: invoice.company?.name || 'Nuestra Empresa',
      companyCif: invoice.company?.cif || '',
      totalAmount: totalCalc,
      issueDate: invoice.date,
      veriFactuHash: invoice.veriFactu?.chainHash || 'VF-AEAT-OK',
      pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
    });

    if (phone.trim()) {
      // Registrar envío en segundo plano
      sendGestarianWhatsAppNotification(
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientPhone: phone,
          clientName: invoice.client.name,
          clientEmail: invoice.client.email,
          companyName: invoice.company.name,
          companyCif: invoice.company.cif,
          totalAmount: totalCalc,
          issueDate: invoice.date,
          veriFactuHash: invoice.veriFactu?.chainHash || 'VF-AEAT-OK',
          pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
        },
        { sendResendEmail: false }
      );

      // Abrir directamente la aplicación de WhatsApp con el mensaje preestablecido y enlace
      const directUrl = getWhatsAppDirectUrl(phone, messageText);
      const win = window.open(directUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = directUrl;
      }
    } else {
      // Si el cliente no tiene teléfono guardado, abrir el modal de envío para que el usuario lo introduzca
      if (onOpenWhatsAppModal) {
        onOpenWhatsAppModal();
      }
    }
  };

  const handleEmail = () => {
    if (!isSavedLocal) return;

    const baseImp = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const ivaAmt = baseImp * (invoice.ivaRate / 100);
    const irpfAmt = baseImp * ((invoice.irpfRate || 0) / 100);
    const totalCalc = baseImp + ivaAmt - irpfAmt;
    const email = invoice.client?.email || '';

    if (email.trim()) {
      const subject = encodeURIComponent(`Factura ${invoice.number} - ${invoice.company.name}`);
      const body = encodeURIComponent(`Estimado/a ${invoice.client.name}\n\nLe remitimos adjunta la factura emitida por ${invoice.company.name}:\n\nQuedamos a su entera disposición para cualquier consulta.\n\nAtentamente,\n${invoice.company.name}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }

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
    const currentItem = { ...updatedItems[index] };

    if (field === 'units' || field === 'unitPrice') {
      const stringVal = value !== undefined && value !== null ? value.toString() : '';
      if (stringVal === '-' || stringVal === '-.' || stringVal === '.' || stringVal.endsWith('.')) {
        (currentItem as any)[field] = stringVal;
        currentItem.total = 0;
      } else {
        const parsedVal = parseFloat(value);
        (currentItem as any)[field] = isNaN(parsedVal) ? 0 : parsedVal;

        const units = field === 'units' ? (isNaN(parsedVal) ? 0 : parsedVal) : (typeof currentItem.units === 'string' ? parseFloat(currentItem.units) || 0 : currentItem.units);
        const price = field === 'unitPrice' ? (isNaN(parsedVal) ? 0 : parsedVal) : (typeof currentItem.unitPrice === 'string' ? parseFloat(currentItem.unitPrice) || 0 : currentItem.unitPrice);
        currentItem.total = Math.round(units * price * 100) / 100;
      }
    } else {
      (currentItem as any)[field] = value;
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

  const handleAddItemWithConcept = (conceptText: string, price: number = 0, units: number = 1) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      concept: conceptText,
      units: units,
      unitPrice: price,
      total: Math.round(units * price * 100) / 100,
    };
    
    // If there is only one item and it is completely empty, replace it
    if (invoice.items.length === 1 && !invoice.items[0].concept.trim() && invoice.items[0].total === 0) {
      onChangeInvoice({ ...invoice, items: [newItem] });
    } else {
      onChangeInvoice({ ...invoice, items: [...invoice.items, newItem] });
    }
    onConceptCommitted(conceptText);
  };

  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-4 px-2 sm:px-4 pb-4 transition-all portrait:p-0">
      {/* A4 Sheet Container: standardized 210mm x 297mm aspect ratio container */}
      <div
        ref={a4SheetRef}
        id="a4-invoice-sheet"
        className={`a4-sheet w-full max-w-[840px] portrait:w-full portrait:max-w-none min-h-[1180px] bg-white text-neutral-800 rounded-sm shadow-[0_15px_50px_-12px_rgba(0,0,0,0.18)] p-6 sm:p-12 md:p-14 flex flex-col justify-between border border-neutral-200/90 relative transition-all duration-300 ease-out origin-center print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:min-h-0 portrait:shadow-none portrait:border-0 portrait:rounded-none portrait:p-0 portrait:py-2 portrait:px-0 ${
          isPrintPreviewOpen ? 'print:hidden' : ''
        }`}
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top Row: FACTURA on the left (50%), Número y Fecha on the right (50%) in two lines, left-aligned, aligning perfectly with top/bottom of FACTURA */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 pb-3 sm:pb-4 h-[72px] portrait:h-[32.4px] w-full items-stretch portrait:px-[10px]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
          {/* Left 50% - FACTURA vs FACTURA RECTIFICATIVA in 30% gray (text-neutral-400), left-aligned, height-matching container */}
          <div className="flex items-center justify-start h-full">
            <h1 className={`font-black tracking-tight text-neutral-400 uppercase leading-none text-left ${
              isRectificative
                ? 'text-[36px] sm:text-[44px] md:text-[50px] portrait:text-[20px] landscape:max-sm:text-[26px] landscape:max-md:text-[30px]'
                : 'text-[72px] portrait:text-[32.4px] landscape:max-sm:text-[50.4px] landscape:max-md:text-[50.4px]'
            }`}>
              {isRectificative ? 'FACTURA RECTIFICATIVA' : 'FACTURA'}
            </h1>
          </div>
          {/* Right 50% - Número & Fecha left-aligned, size x0.8 (text-[19.68px] on desktop, 9.44px on mobile portrait), Fecha fixed at bottom, Número lowered with half gap */}
          <div className="flex flex-col justify-end gap-1 portrait:gap-0.5 text-left h-full py-0 landscape:max-sm:translate-y-[10px] landscape:max-md:translate-y-[10px] transform transition-transform">
            <div className="text-[19.68px] portrait:text-[9.44px] font-bold text-neutral-400 leading-[1.2] flex items-center min-w-0 translate-y-[5px]" style={{ lineHeight: '1.2', transform: 'translateY(5px)' }}>
              <span className="shrink-0 text-[19.68px] portrait:text-[9.44px] font-bold">Número:&nbsp;</span>
              <input
                type="text"
                value={invoice.number}
                onChange={(e) => onChangeInvoice({ ...invoice, number: e.target.value.toUpperCase() })}
                onFocus={(e) => handleInputFocus(e, 'Nº de Factura')}
                onBlur={handleInputBlur}
                className="font-bold text-neutral-800 bg-transparent p-0 border-none outline-none focus:outline-none focus:ring-0 focus:bg-transparent shadow-none w-full text-left transition-all text-[19.68px] portrait:text-[9.44px]"
                style={{ lineHeight: '1.2' }}
                title="Número correlativo"
              />
            </div>
            <div className="text-[19.68px] portrait:text-[9.44px] font-bold text-neutral-400 leading-[1.2] flex items-center gap-1 min-w-0" style={{ lineHeight: '1.2' }}>
              <span className="shrink-0 text-[19.68px] portrait:text-[9.44px] font-bold">Fecha:&nbsp;</span>
              <input
                type="text"
                readOnly
                value={formatDate(invoice.date) || invoice.date}
                onClick={() => setShowCalendarModal(true)}
                className="font-bold text-neutral-800 bg-transparent p-0 border-none outline-none focus:outline-none focus:ring-0 focus:bg-transparent shadow-none w-full text-left transition-all cursor-pointer text-[19.68px] portrait:text-[9.44px]"
                style={{ lineHeight: '1.2' }}
              />
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="p-1.5 portrait:p-1 mr-[10px] -translate-y-[5px] border border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs print:hidden flex items-center justify-center"
                title="Abrir calendario"
              >
                <Calendar className="w-[45px] h-[45px] portrait:w-[27px] portrait:h-[27px] text-emerald-600 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* TOP SECTION: Header / Membrete */}
        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 portrait:px-[10px]">
          
          {/* Emisor y cliente en dos párrafos independientes en portrait (primero emisor y debajo cliente), y en dos columnas en desktop/landscape */}
          <div className="grid grid-cols-2 portrait:grid-cols-1 gap-4 sm:gap-6 w-full items-stretch">
            
            {/* Primero: Emisor wrapped in a 8px rounded gray border (gris 40%) */}
            <div className="border-[8px] border-neutral-400 rounded-2xl p-4 sm:p-5 w-full text-left flex flex-col justify-between">
              <div className="space-y-1.5 text-[18px] text-neutral-700">
                <div className="text-[15px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">
                  EMISOR
                </div>
                {/* Logo and info */}
                <div className="flex items-start gap-4">
                  {Boolean(invoice.company.logoUrl && invoice.company.logoUrl.trim() && !invoice.company.logoUrl.startsWith('data:image/svg+xml')) && (
                    <div className="w-16 h-16 rounded-lg border border-neutral-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <img
                        src={invoice.company.logoUrl}
                        alt="Logo Empresa"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-1 text-sm text-neutral-700 min-w-0 flex-1 leading-normal">
                    <h2 className="font-extrabold text-[23px] text-neutral-950 leading-tight">
                      {invoice.company.name || 'Empresa Emisora'}
                    </h2>
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
                    <div className="flex flex-wrap items-center gap-x-2 text-neutral-600 text-xs">
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Debajo: Datos del Cliente (Receptor) wrapped in a 8px rounded gray border (gris 40%) */}
            <div className="border-[8px] border-neutral-400 rounded-2xl p-4 sm:p-5 w-full text-left flex flex-col justify-between">
              <div className="space-y-1.5 text-[18px] text-neutral-700">
                {/* Header / Actions: Etiqueta */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <button
                    type="button"
                    onClick={onOpenClientsSearch}
                    className="text-[15px] font-extrabold text-neutral-400 hover:text-amber-600 transition-colors uppercase tracking-wider text-left print:pointer-events-none cursor-pointer flex items-center gap-1"
                    title="Buscar o cambiar cliente"
                  >
                    <span>CLIENTE</span>
                    <span className="text-neutral-400 text-sm print:hidden">▼</span>
                  </button>
                </div>

                {invoice.client.name ? (
                  <div className="space-y-1 text-sm text-neutral-700 leading-normal">
                    <h3 
                      onClick={onOpenClientsSearch}
                      className="font-extrabold text-[23px] text-neutral-950 leading-tight hover:text-amber-600 transition-colors cursor-pointer print:pointer-events-none"
                      title="Pulsar para buscar o cambiar cliente"
                    >
                      {invoice.client.name}
                    </h3>
                    {invoice.client.nif && (
                      <div className="font-mono text-xs font-semibold text-neutral-850">
                        <span className="text-neutral-500 font-normal">CIF/NIF: </span>
                        <span>{invoice.client.nif}</span>
                      </div>
                    )}
                    {invoice.client.address && (
                      <div className="text-neutral-600 text-xs leading-relaxed max-w-sm">
                        <span>{invoice.client.address}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 text-neutral-600 text-xs">
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
                ) : (
                  <div className="w-full flex justify-center py-2 print:hidden">
                    <button
                      type="button"
                      onClick={onOpenClientsSearch}
                      className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 font-extrabold text-xs transition-all active:scale-95 cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4 text-sky-700 stroke-[2.5]" />
                      <span>Añadir Cliente</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Row 3: Items / Concept lines Table - 3px margins on mobile portrait */}
          <div className="pt-2 w-full portrait:w-full portrait:px-[3px]">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-neutral-900 text-[11px] portrait:text-[11.5px] sm:portrait:text-[13px] font-bold uppercase tracking-wider text-neutral-900 text-center">
                    <th className={`${invoice.items.length > 4 ? 'py-1.5' : 'py-2.5'} px-1 sm:px-2 text-center w-[60%] portrait:w-[60%]`}>Concepto</th>
                    <th className={`${invoice.items.length > 4 ? 'py-1.5' : 'py-2.5'} px-0.5 sm:px-1 text-center w-[10%] portrait:w-[10%]`}>Ud.</th>
                    <th className={`${invoice.items.length > 4 ? 'py-1.5' : 'py-2.5'} px-0.5 sm:px-1 text-center w-[14%] portrait:w-[14%]`}>€</th>
                    <th className={`${invoice.items.length > 4 ? 'py-1.5' : 'py-2.5'} px-0.5 sm:px-1 text-center w-[16%] portrait:w-[16%]`}>Importe</th>
                    <th className={`${invoice.items.length > 4 ? 'py-1.5' : 'py-2.5'} px-0.5 w-[24px] portrait:w-[20px] print:hidden`}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs">
                  {invoice.items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr className="group hover:bg-amber-50/30 transition-colors">
                        {/* Concept column with intelligent autocomplete memory - 60% width with ellipsis */}
                        <td className={`${invoice.items.length > 4 ? 'py-1 px-1' : 'py-2 px-1'} w-[60%] portrait:w-[60%] min-w-0 overflow-hidden`}>
                          <div className="flex items-center gap-1 w-full min-w-0 overflow-hidden">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <ConceptAutocompleteInput
                                id={`concept-input-${index}`}
                                value={item.concept}
                                onChange={(val) => handleItemChange(index, 'concept', val)}
                                onConceptCommitted={onConceptCommitted}
                                allConcepts={concepts}
                                placeholder="Escriba concepto..."
                                onFocusInput={(e) => handleInputFocus(e, `Concepto (Línea ${index + 1})`)}
                                onBlurInput={handleInputBlur}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Units column */}
                        <td className={`${invoice.items.length > 4 ? 'py-1 px-0.5' : 'py-2 px-0.5'} text-center w-[10%] portrait:w-[10%] min-w-0`}>
                          <input
                            type="text"
                            readOnly
                            inputMode="none"
                            value={item.units === undefined || item.units === null || (item.units as any) === '' ? '0' : String(item.units)}
                            onClick={() => handleItemInputClick(index, 'units')}
                            placeholder="1"
                            className={`w-full text-center font-mono tabular-nums py-1 px-0.5 rounded border transition-all cursor-pointer text-xs sm:text-sm portrait:text-[11.5px] portrait:sm:text-[13px] portrait:font-bold portrait:border-0 portrait:p-0 portrait:bg-transparent portrait:shadow-none whitespace-nowrap ${
                              editingItemIndex === index && editingField === 'units'
                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 font-bold'
                                : 'border-transparent hover:border-neutral-300'
                            }`}
                          />
                        </td>

                        {/* Unit Price column - centered */}
                        <td className={`${invoice.items.length > 4 ? 'py-1 px-0.5' : 'py-2 px-0.5'} text-center w-[14%] portrait:w-[14%] min-w-0`}>
                          <div className="inline-flex items-center justify-center w-full">
                            <input
                              type="text"
                              readOnly
                              inputMode="none"
                              value={item.unitPrice === undefined || item.unitPrice === null || (item.unitPrice as any) === '' ? '0' : String(item.unitPrice)}
                              onClick={() => handleItemInputClick(index, 'unitPrice')}
                              placeholder="0.00"
                              className={`w-full text-center font-mono tabular-nums py-1 px-0.5 rounded border transition-all cursor-pointer text-xs sm:text-sm portrait:text-[11.5px] portrait:sm:text-[13px] portrait:font-bold portrait:border-0 portrait:p-0 portrait:bg-transparent portrait:shadow-none whitespace-nowrap ${
                                editingItemIndex === index && editingField === 'unitPrice'
                                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 font-bold'
                                  : 'border-transparent hover:border-neutral-300'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Line total column - always shown completely without wrapping */}
                        <td className={`${invoice.items.length > 4 ? 'py-1 px-0.5 sm:px-2' : 'py-2 px-0.5 sm:px-2'} text-right font-mono font-bold tabular-nums text-neutral-900 text-xs sm:text-sm portrait:text-[11.5px] portrait:sm:text-[13px] w-[16%] portrait:w-[16%] whitespace-nowrap`}>
                          {formatCurrency(item.total)}
                        </td>

                        {/* Delete item button */}
                        <td className={`${invoice.items.length > 4 ? 'py-1 px-0.5' : 'py-2 px-0.5'} text-center w-[24px] portrait:w-[20px] print:hidden`}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 portrait:p-0.5 rounded text-[#EF4444] hover:text-red-600 hover:bg-red-50 transition-colors"
                            style={{ color: '#EF4444' }}
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTON FOR CONCEPT LINES: Clean standard add line and add product buttons, 80% width in mobile portrait */}
            <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4 print:hidden flex-wrap w-full portrait:w-[80%] portrait:mx-auto portrait:flex-col">
              <button
                type="button"
                id="add-concept-line-btn"
                onClick={handleAddItem}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-teal-600 bg-[#E6FFFA] hover:bg-[#CCFFF5] text-teal-950 text-sm sm:text-base font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer portrait:w-[80%] portrait:mx-auto"
                title="Añadir una nueva línea libre de concepto a la factura"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Añadir línea libre</span>
              </button>

              {invoice.client.enableComplexInvoice && (
                <div className="w-full sm:w-auto portrait:w-[80%] portrait:mx-auto flex justify-center">
                  <LineasComplejasDropdown
                    estructuras={invoice.client.lineasComplejas || []}
                    onSelect={handleAddItemWithConcept}
                  />
                </div>
              )}

              <div className="w-full sm:w-auto portrait:w-[80%] portrait:mx-auto flex justify-center">
                <ProductosClienteDropdown
                  productos={invoice.client.habitualProducts || []}
                  onSelect={handleAddItemWithConcept}
                  buttonClassName="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-teal-600 bg-[#E6FFFA] hover:bg-[#CCFFF5] text-teal-950 text-sm sm:text-base font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Calculations + Veri*Factu AEAT + Payment details */}
        <div className="mt-8 space-y-6 portrait:px-[10px]">
          {/* Calculations Breakdown (Base Imponible, IVA, Total) */}
          <div className="flex flex-col items-end w-full space-y-3 pt-4 border-t border-neutral-200">
            <div className="w-full sm:w-96 space-y-3">
              {/* Base Imponible */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-[18px]">
                <span className="text-neutral-600 font-bold">Base Imponible:</span>
                <span className="font-mono font-black text-neutral-950">
                  {formatCurrency(baseImponible)}
                </span>
              </div>

              {/* IVA 21% */}
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-[18px]">
                <div className="flex items-center gap-1.5 text-neutral-600 font-bold">
                  <span>IVA</span>
                  <span>{invoice.ivaRate}%</span>
                </div>
                <span className="font-mono font-black text-neutral-950">
                  {formatCurrency(cuotaIva)}
                </span>
              </div>

              {/* Optional IRPF toggle */}
              {invoice.irpfRate > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-[18px] text-neutral-700">
                  <span className="font-bold">Retención IRPF (-{invoice.irpfRate}%):</span>
                  <span className="font-mono font-black text-red-600">
                    -{formatCurrency(cuotaIrpf)}
                  </span>
                </div>
              )}

              {/* Grand Total - Changed to "TOTAL" */}
              <div className="flex justify-between items-baseline pt-3 pb-1.5 border-t-2 border-neutral-900">
                <span className="text-lg font-black uppercase tracking-wide text-neutral-900">
                  TOTAL
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-950">
                  {formatCurrency(totalFactura)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Veri*Factu (Side-by-side 2-column layout always, in all devices) */}
          <div className="pt-4 border-t border-neutral-200/60 grid grid-cols-2 gap-4 text-xs text-neutral-600">
            {/* Column 1: Payment & Bank Details */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                <CreditCard className="w-4 h-4 text-neutral-500" />
                <span>Forma de pago y datos bancarios</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-1 w-full h-full min-h-[90px] flex flex-col justify-center">
                {invoice.company.iban ? (
                  <div className="text-xs">
                    {invoice.company.bankName && (
                      <div className="text-neutral-700 font-bold text-xs leading-none">{invoice.company.bankName}</div>
                    )}
                    <div className="font-mono text-neutral-900 font-extrabold text-[11px] sm:text-xs tracking-wider mt-0.5 break-all">
                      IBAN: {invoice.company.iban}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1 leading-snug">
                      Transferencia o emisión directa.<br />
                      Indicar nº factura como concepto.
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-400 italic text-[11px] print:hidden">
                    (Configura tu IBAN en la pestaña de configuración para que aparezca aquí)
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: VERI*FACTU OFFICIAL VALIDATION BLOCK (AEAT Compliant) */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-neutral-500" />
                <span>Validación Oficial Veri*Factu</span>
              </div>
              <div
                id="verifactu-validation-box"
                onClick={onOpenVeriFactuModal}
                className="p-3.5 rounded-xl border border-neutral-300 bg-neutral-50/80 flex items-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-neutral-50 transition-all print:bg-white print:border-neutral-300 w-full h-full min-h-[90px]"
                title="Factura validada por Veri*Factu. Clic para examinar huella digital y datos tributarios"
              >
                {/* Veri*Factu QR Code */}
                <div className="w-14 h-14 bg-white p-1 rounded-lg border border-neutral-300 shrink-0 shadow-sm flex items-center justify-center">
                  {invoice.veriFactu.qrDataUrl ? (
                    <img
                      src={invoice.veriFactu.qrDataUrl}
                      alt="Código QR Veri*Factu AEAT"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-6 h-6 text-neutral-400" />
                  )}
                </div>

                {/* Text Badge and Legal Info */}
                <div className="space-y-0.5 text-left min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[8px] sm:text-[9px] tracking-wide uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      VERI*FACTU OK
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono truncate max-w-[80px] hidden sm:inline">
                      {invoice.veriFactu.systemId}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-neutral-900 leading-tight">
                    Verificable en sede AEAT
                  </p>
                  <p className="text-[9px] text-neutral-500 leading-tight truncate">
                    Huella: <span className="font-mono text-neutral-700">{invoice.veriFactu.chainHash ? `${invoice.veriFactu.chainHash.slice(0, 10)}...` : 'En proceso'}</span>
                  </p>
                </div>
              </div>
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
          <div className="pt-4 border-t-2 border-neutral-200 print:hidden space-y-3 portrait:px-[10px]">
            {/* Canales de envío preferente del cliente */}
            {(() => {
              const preferredChannel =
                invoice.client.preferredDispatchChannel ||
                (invoice.client.defaultSendEmail && !invoice.client.defaultSendWhatsApp ? 'email' : 'whatsapp');

              const isActionActive = isViewOnly || isSavedLocal;

              return (
                <>
                  <div className={`grid grid-cols-1 ${isViewOnly ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
                    {/* 1. Botón de Guardar Factura (Solo se muestra si NO se accede en modo ver factura) */}
                    {!isViewOnly && (
                      <button
                        type="button"
                        id="a4-footer-save-btn"
                        onClick={handleSave}
                        className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl font-black text-lg sm:text-2xl flex items-center justify-center gap-3 sm:gap-4 border-2 transition-all active:scale-[0.98] cursor-pointer shadow-md ${
                          isSavedLocal
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70'
                            : 'border-emerald-500 bg-transparent text-emerald-600 hover:bg-emerald-50/50'
                        }`}
                        title="Guardar factura y activar los botones de impresión y envío"
                      >
                        {isSavedLocal ? (
                          <>
                            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-800 shrink-0" />
                            <span>Factura Guardada</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 shrink-0" />
                            <span>Guardar Factura</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* 2. Botón de Imprimir Factura */}
                    <button
                      type="button"
                      id="a4-footer-print-btn"
                      disabled={!isActionActive}
                      onClick={() => {
                        handlePrint();
                      }}
                      className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl font-black text-lg sm:text-2xl flex items-center justify-center gap-3 sm:gap-4 border-2 transition-all ${
                        isActionActive
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 active:scale-[0.98] cursor-pointer shadow-md'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed select-none shadow-none'
                      }`}
                      title="Imprimir documento en la impresora preconfigurada del dispositivo"
                    >
                      <Printer
                        className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 transition-colors"
                        style={{
                          color: isActionActive ? '#059669' : '#a3a3a3',
                        }}
                      />
                      <span>
                        Imprimir
                      </span>
                    </button>

                    {/* 3. Botón de Enviar por WhatsApp O Enviar por Email según esté configurado el cliente */}
                    {preferredChannel === 'whatsapp' ? (
                      <button
                        type="button"
                        id="a4-footer-send-btn"
                        disabled={!isActionActive}
                        onClick={() => {
                          if (isViewOnly) {
                            const phone = invoice.client?.phone || '';
                            const baseImp = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);
                            const ivaAmt = baseImp * (invoice.ivaRate / 100);
                            const irpfAmt = baseImp * ((invoice.irpfRate || 0) / 100);
                            const totalCalc = baseImp + ivaAmt - irpfAmt;
                            const messageText = generateWhatsAppInvoiceMessage({
                              invoiceId: invoice.id,
                              invoiceNumber: invoice.number,
                              clientPhone: phone,
                              clientName: invoice.client?.name || 'Cliente',
                              clientEmail: invoice.client?.email,
                              companyName: invoice.company?.name || 'Nuestra Empresa',
                              companyCif: invoice.company?.cif || '',
                              totalAmount: totalCalc,
                              issueDate: invoice.date,
                              veriFactuHash: invoice.veriFactu?.chainHash || 'VF-AEAT-OK',
                              pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
                            });

                            if (phone.trim()) {
                              sendGestarianWhatsAppNotification({
                                invoiceId: invoice.id,
                                invoiceNumber: invoice.number,
                                clientPhone: phone,
                                clientName: invoice.client.name,
                                clientEmail: invoice.client.email,
                                companyName: invoice.company.name,
                                companyCif: invoice.company.cif,
                                totalAmount: totalCalc,
                                issueDate: invoice.date,
                                veriFactuHash: invoice.veriFactu?.chainHash || 'VF-AEAT-OK',
                                pdfHostedUrl: `https://notificaciones.gestarian.com/f/${encodeURIComponent(invoice.number)}`,
                              }, { sendResendEmail: false });
                              const directUrl = getWhatsAppDirectUrl(phone, messageText);
                              window.open(directUrl, '_blank', 'noopener,noreferrer');
                            } else if (onOpenWhatsAppModal) {
                              onOpenWhatsAppModal();
                            }
                          } else {
                            handleWhatsApp();
                          }
                        }}
                        className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl font-black text-lg sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 sm:gap-4 border-2 transition-all ${
                          isActionActive
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 active:scale-[0.98] cursor-pointer shadow-md'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed select-none shadow-none'
                        }`}
                        title="Enviar factura por WhatsApp al cliente"
                      >
                        <WhatsAppIcon
                          className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                          style={{
                            filter: isActionActive ? undefined : 'grayscale(1) opacity(0.5)',
                          }}
                        />
                        <span className="truncate">Enviar WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="a4-footer-send-btn"
                        disabled={!isActionActive}
                        onClick={() => {
                          if (isViewOnly) {
                            const email = invoice.client?.email || '';
                            if (email.trim()) {
                              const subject = encodeURIComponent(`Factura ${invoice.number} - ${invoice.company.name}`);
                              const body = encodeURIComponent(`Estimado/a ${invoice.client.name}\n\nLe remitimos adjunta la factura emitida por ${invoice.company.name}:\n\nQuedamos a su entera disposición para cualquier consulta.\n\nAtentamente,\n${invoice.company.name}`);
                              window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                            }
                            if (onOpenEmailModal) {
                              onOpenEmailModal();
                            }
                          } else {
                            handleEmail();
                          }
                        }}
                        className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-2xl font-black text-lg sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 sm:gap-4 border-2 transition-all ${
                          isActionActive
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 active:scale-[0.98] cursor-pointer shadow-md'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed select-none shadow-none'
                        }`}
                        title="Enviar factura por Correo Electrónico al cliente"
                      >
                        <Mail
                          className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 transition-colors"
                          style={{
                            color: isActionActive ? '#059669' : '#a3a3a3',
                          }}
                        />
                        <span className="truncate">Enviar Email</span>
                      </button>
                    )}
                  </div>

                  {/* Informative helper text */}
                  {!isViewOnly && (
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
                  )}
                </>
              );
            })()}
        </div>
      </div>

      {/* Recuadro con registro de anotaciones de envíos anteriores si el documento ha sido enviado por email o whatsapp */}
      {(() => {
        const invId = invoice.id || invoice.number;
        const waDispatches = getStoredWhatsAppDispatches().filter(
          (d) => d.invoiceId === invId || d.invoiceNumber === invoice.number
        );
        const mailDispatches = getStoredEmailDispatches().filter(
          (d) => d.invoiceId === invId || d.invoiceNumber === invoice.number
        );
        const hasDispatches = waDispatches.length > 0 || mailDispatches.length > 0;

        if (!hasDispatches) return null;

        return (
          <div className="w-full max-w-[840px] mt-5 p-4 sm:p-5 rounded-2xl bg-[#e6fffa] border-2 border-[#047857] text-[#064e3b] shadow-xl space-y-3 print:hidden">
            <div className="flex items-center gap-2.5 text-[#047857] font-black text-sm sm:text-base border-b border-[#047857]/30 pb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#047857] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#047857]" />
              </div>
              <span className="uppercase tracking-wide">REGISTRO DE ENVÍOS DEL DOCUMENTO</span>
            </div>
            <div className="space-y-2 pt-0.5 text-xs sm:text-sm">
              {mailDispatches.map((d, idx) => (
                <div key={`mail-${d.id || idx}`} className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-[#047857] shadow-xs text-[#064e3b]">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-[#e6fffa] border border-[#047857] shrink-0">
                      <Mail className="w-4.5 h-4.5 text-[#047857]" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="font-black text-xs sm:text-sm text-[#064e3b] block uppercase tracking-tight">
                        DOCUMENTO ENVIADO CORRECTAMENTE POR CORREO ELECTRÓNICO
                      </span>
                      <span className="text-xs text-[#047857] font-bold block truncate">
                        Destinatario: <strong className="text-[#064e3b] font-black">{d.recipientName || 'Cliente'}</strong> ({d.recipientEmail})
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-black text-[#047857] bg-[#e6fffa] px-3 py-1.5 rounded-lg border border-[#047857] shrink-0">
                    {new Date(d.createdAt).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
              {waDispatches.map((d, idx) => (
                <div key={`wa-${d.id || idx}`} className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-[#047857] shadow-xs text-[#064e3b]">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-[#e6fffa] border border-[#047857] shrink-0">
                      <WhatsAppIcon className="w-4.5 h-4.5" style={{ color: '#047857' }} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="font-black text-xs sm:text-sm text-[#064e3b] block uppercase tracking-tight">
                        DOCUMENTO ENVIADO CORRECTAMENTE POR WHATSAPP
                      </span>
                      <span className="text-xs text-[#047857] font-bold block truncate">
                        Destinatario: <strong className="text-[#064e3b] font-black">{d.recipientName || 'Cliente'}</strong> ({d.recipientPhone})
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-black text-[#047857] bg-[#e6fffa] px-3 py-1.5 rounded-lg border border-[#047857] shrink-0">
                    {new Date(d.createdAt).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Botón Volver al final de la pantalla, fuera de la hoja A4 y limpio */}
      {onBack && (
        <div className="w-full max-w-[840px] mt-6 flex justify-center print:hidden">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 border-2 border-purple-400 font-extrabold text-sm sm:text-base transition-all active:scale-95 cursor-pointer shadow-md"
            title="Volver a la lista de Facturas"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-purple-700 stroke-[2.5]" />
            <span>Volver a Facturas Emitidas</span>
          </button>
        </div>
      )}

      {/* Modal de Vista de Impresión (solo si no lo controla el componente padre) */}
      {propIsPrintPreviewOpen === undefined && isPrintPreviewOpen && (
        <PrintPreviewModal
          invoice={invoice}
          onClose={handleClosePrintPreview}
          onPrint={onPrint}
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

      {/* Modal de Calendario Personalizado */}
      {showCalendarModal && (
        <CustomCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          selectedDate={invoice.date}
          onSelectDate={(dateIso) => {
            onChangeInvoice({ ...invoice, date: dateIso });
          }}
          title="Fecha de Emisión"
        />
      )}

      {/* Floating Bottom Numeric Keyboard: sticks to viewport bottom with dual inputs (Cantidad and Precio) */}
      {editingItemIndex !== null && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t-2 border-neutral-800 p-4 pb-6 z-[120] shadow-[0_-15px_40px_rgba(0,0,0,0.65)] animate-in slide-in-from-bottom duration-200 print:hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-md mx-auto space-y-3">
            {/* Active Line Indicator */}
            <div className="text-center truncate">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide font-sans">Ajustar: </span>
              <span className="text-xs font-extrabold text-neutral-200 truncate max-w-[250px] inline-block align-bottom font-sans">
                Línea {editingItemIndex + 1}: {invoice.items[editingItemIndex]?.concept || 'Concepto'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cantidad input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-400 tracking-wider mb-1 text-center">Cantidad</label>
                <input
                  type="text"
                  inputMode="none"
                  value={editCantidad}
                  onClick={() => setEditingField('units')}
                  onFocus={() => setEditingField('units')}
                  className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border focus:outline-none text-center font-mono font-bold text-sm ${
                    editingField === 'units' ? 'border-amber-400 ring-1 ring-amber-400/30 bg-amber-950/20' : 'border-neutral-700'
                  }`}
                  readOnly
                />
              </div>
              
              {/* Precio input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-400 tracking-wider mb-1 text-center">Precio (€)</label>
                <input
                  type="text"
                  inputMode="none"
                  value={editPrecio}
                  onClick={() => setEditingField('unitPrice')}
                  onFocus={() => setEditingField('unitPrice')}
                  className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border focus:outline-none text-center font-mono font-bold text-sm ${
                    editingField === 'unitPrice' ? 'border-amber-400 ring-1 ring-amber-400/30 bg-amber-950/20' : 'border-neutral-700'
                  }`}
                  readOnly
                />
              </div>
            </div>

            {/* NUMERICAL KEYBOARD right under the inputs */}
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-4 gap-1.5 w-full max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      let current = editingField === 'units' ? editCantidad : editPrecio;
                      if (current === '0' && key !== '.') {
                        current = '';
                      }
                      if (key === '.') {
                        if (!current.includes('.')) {
                          current = current === '' ? '0.' : current + '.';
                        }
                      } else {
                        current += key;
                      }
                      if (editingField === 'units') {
                        setEditCantidad(current);
                      } else {
                        setEditPrecio(current);
                      }
                    }}
                    className="h-10 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base rounded-lg border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 select-none"
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    let current = editingField === 'units' ? editCantidad : editPrecio;
                    if (current.length > 0) {
                      current = current.slice(0, -1);
                    }
                    if (editingField === 'units') {
                      setEditCantidad(current || '0');
                    } else {
                      setEditPrecio(current || '0');
                    }
                  }}
                  className="h-10 bg-neutral-950 hover:bg-rose-950 text-rose-400 font-bold text-xs rounded-lg border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 select-none"
                >
                  Borrar
                </button>
              </div>

              {/* Confirm & Cancel buttons */}
              <div className="flex items-center gap-2 w-full max-w-xs mt-3">
                <button
                  type="button"
                  onClick={() => setEditingItemIndex(null)}
                  className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm rounded border border-neutral-700 shadow-sm transition-all active:scale-95 cursor-pointer select-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEditInline}
                  className="flex-2 py-2 px-4 bg-amber-400 hover:bg-amber-350 text-neutral-950 font-black text-sm rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
