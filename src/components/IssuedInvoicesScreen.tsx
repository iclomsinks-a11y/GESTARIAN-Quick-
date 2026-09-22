import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  Eye,
  MessageCircle,
  Printer,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
  Phone,
  Mail,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getStoredWhatsAppDispatches, getStoredEmailDispatches } from '../services/notificationService';

interface IssuedInvoicesScreenProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onRectifyInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onOpenWhatsApp: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
}

// Icono personalizado de Factura Rectificativa (Hoja con R distintiva, trazo 1.5px)
const RectifyInvoiceIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Hoja de documento */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    {/* Letra R distintiva de Rectificativa centrada */}
    <text
      x="11"
      y="16.5"
      fontSize="7.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="-0.5px"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
    >
      R
    </text>
  </svg>
);

export const IssuedInvoicesScreen: React.FC<IssuedInvoicesScreenProps> = ({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onRectifyInvoice,
  onDeleteInvoice,
  onOpenWhatsApp,
  onPrintInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const clientName = inv.client?.name?.toLowerCase() || '';
    const clientNif = inv.client?.nif?.toLowerCase() || '';
    const invNumber = inv.number?.toLowerCase() || '';
    const dateStr = inv.date?.toLowerCase() || '';
    const formattedDate = formatDate(inv.date).toLowerCase();
    const conceptsStr = inv.items?.map((it) => it.concept.toLowerCase()).join(' ') || '';

    return (
      invNumber.includes(term) ||
      clientName.includes(term) ||
      clientNif.includes(term) ||
      dateStr.includes(term) ||
      formattedDate.includes(term) ||
      conceptsStr.includes(term)
    );
  });

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

  const calculateTotals = (inv: Invoice) => {
    const base = inv.items?.reduce((s, it) => s + (it.total || 0), 0) || 0;
    const ivaRate = inv.ivaRate ?? 21;
    const ivaAmount = base * (ivaRate / 100);
    const irpfRate = inv.irpfRate ?? 0;
    const irpfAmount = base * (irpfRate / 100);
    const total = base + ivaAmount - irpfAmount;
    return { base, ivaAmount, irpfAmount, total };
  };

  return (
    <div
      id="issued-invoices-screen-container"
      className="w-full max-w-7xl mx-auto px-1 sm:px-2 pt-1 sm:pt-2 pb-8 space-y-3.5 text-neutral-100"
    >
      {/* Barra de acciones limpia: Buscador (anchura 0.5) y Botón + FACTURA */}
      <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-2.5 sm:p-3 backdrop-blur-md shadow-lg">
        {/* Campo de Búsqueda (anchura 0.5) */}
        <div className="relative w-1/2 max-w-[50%]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            id="issued-invoices-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, CIF, número, concepto o fecha..."
            className="w-full pl-9 pr-7 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1 cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botón + FACTURA */}
        <button
          type="button"
          id="btn-nueva-factura-screen"
          onClick={onNewInvoice}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 hover:text-amber-300 border-2 border-amber-400 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          title="Crear nueva factura emitida"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>+ FACTURA</span>
        </button>
      </div>

      {/* Grid de Tarjetas de Facturas Emitidas - Mismo diseño que Clientes y Proveedores */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-bold text-white">
            {searchTerm ? 'No se encontraron facturas emitidas' : 'Aún no hay facturas emitidas'}
          </div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchTerm
              ? `No hay ninguna factura emitida que coincida con "${searchTerm}".`
              : 'Crea tu primera factura pulsando en el botón "+ Nuevo" de arriba.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onNewInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear nueva factura</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
          {filteredInvoices.map((inv) => {
            const invoiceId = inv.id || inv.number;
            const isExpanded = expandedInvoiceId === invoiceId;
            const hasAnyExpanded = expandedInvoiceId !== null;
            const isDimmed = hasAnyExpanded && !isExpanded;
            const totals = calculateTotals(inv);
            const isRectificative =
              inv.number?.startsWith('FR') ||
              inv.number?.startsWith('R') ||
              inv.notes?.toLowerCase().includes('rectificativ') ||
              inv.items?.some((it) => it.concept?.toLowerCase().includes('rectificaci'));

            const hasWhatsApp = getStoredWhatsAppDispatches().some((d) => d.invoiceId === invoiceId);
            const hasEmail = getStoredEmailDispatches().some((d) => d.invoiceId === invoiceId);
            const isSent = hasWhatsApp || hasEmail;

            return (
              <motion.div
                key={invoiceId}
                id={`issued-invoice-card-${invoiceId}`}
                layout
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`group relative rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isExpanded
                    ? 'bg-neutral-900/98 border-amber-400 shadow-2xl ring-2 ring-amber-400/50 z-10 scale-[1.01]'
                    : 'bg-neutral-950/95 hover:bg-neutral-900/90 border-neutral-600 hover:border-amber-400/90'
                } ${isDimmed ? 'opacity-50 brightness-70 contrast-85 transition-all duration-300' : 'opacity-100'}`}
              >
                {/* LÍNEA 1: Nombre del Cliente y Número de factura en la cabecera (Al pulsar se expande/contrae) */}
                <div
                  onClick={() => toggleExpand(invoiceId)}
                  className="px-4 pt-3.5 pb-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-800/40 transition-colors select-none"
                  title="Pulsa para expandir o contraer todos los datos de la factura"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {inv.client?.name || 'Cliente'}
                    </h3>
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                        isRectificative
                          ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                          : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      }`}
                    >
                      {inv.number || 'S/N'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-base sm:text-lg font-bold text-amber-300">
                      {formatCurrency(totals.total)}
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

                {/* LÍNEA 2: Fila de Iconos Grandes FLOTANTES SIN ENVOLTORIO (x1.5 más grandes, trazo 1.5px): Ver, Editar, Rectificativa, WhatsApp, Imprimir, Eliminar */}
                <div className="px-3 pt-1 pb-3.5 grid grid-cols-6 place-items-center gap-1">
                  {/* Icono 1: Ver Factura (Abre vista de impresión/PDF) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrintInvoice(inv);
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={`Ver factura ${inv.number} en PDF`}
                  >
                    <Eye className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 1.5: Editar Factura */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSent) {
                        const confirmRectify = window.confirm(
                          `La factura ${inv.number} ya ha sido enviada al cliente y está cerrada. No se puede editar.\n\n¿Quieres generar una nueva factura rectificativa copiando estos datos?`
                        );
                        if (confirmRectify) {
                          onRectifyInvoice(inv);
                        }
                      } else {
                        onEditInvoice(inv);
                      }
                    }}
                    className={`p-1 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none ${
                      isSent ? 'text-neutral-500 hover:text-neutral-400' : 'text-blue-400 hover:text-blue-300'
                    }`}
                    title={isSent ? `Factura enviada. Pulsar para crear Rectificativa` : `Editar factura ${inv.number}`}
                  >
                    <Edit3 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: Factura Rectificativa */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRectifyInvoice(inv);
                    }}
                    className="p-1 text-orange-400 hover:text-orange-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={`Crear Factura Rectificativa de ${inv.number}`}
                  >
                    <RectifyInvoiceIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-sm" />
                  </button>

                  {/* Icono 3: WhatsApp Flotante */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatsApp(inv);
                    }}
                    className="p-1 text-[#25D366] hover:text-[#3df084] hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={`Enviar factura ${inv.number} por WhatsApp`}
                  >
                    <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Imprimir / PDF Flotante */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPrintInvoice(inv);
                    }}
                    className="p-1 text-neutral-300 hover:text-white hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={`Imprimir o descargar PDF de ${inv.number}`}
                  >
                    <Printer className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 5: Eliminar Factura Flotante */}
                  <button
                    type="button"
                    id={`btn-delete-issued-invoice-${invoiceId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`¿Estás seguro de que deseas eliminar la factura ${inv.number}?`)) {
                        onDeleteInvoice(invoiceId);
                      }
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={`Eliminar factura ${inv.number}`}
                  >
                    <Trash2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>
                </div>

                {/* ZONA EXPANDIBLE: Desglose completo de la factura con texto aumentado x1.5 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`expanded-content-${invoiceId}`}
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
                              CIF / NIF:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base sm:text-lg font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                                {inv.client?.nif || 'SIN CIF'}
                              </span>
                              {inv.client?.nif && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopy(inv.client.nif, `${invoiceId}-nif`, e)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                  title="Copiar CIF"
                                >
                                  {copiedId === `${invoiceId}-nif` ? (
                                    <Check className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Domicilio del Cliente */}
                        {inv.client?.address && (
                          <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <MapPin className="w-4.5 h-4.5 text-neutral-400" />
                              <span>Dirección:</span>
                            </span>
                            <div className="pl-6 text-neutral-100 text-base sm:text-lg">
                              <p className="leading-relaxed">{inv.client.address}</p>
                            </div>
                          </div>
                        )}

                        {/* Teléfono & Email si existen */}
                        {(inv.client?.phone || inv.client?.email) && (
                          <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                            {inv.client.phone && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                  <Phone className="w-4.5 h-4.5 text-sky-400 stroke-[1.5]" />
                                  <span>Teléfono:</span>
                                </span>
                                <span className="font-mono text-sky-300 text-base sm:text-lg font-bold">
                                  {inv.client.phone}
                                </span>
                              </div>
                            )}

                            {inv.client.email && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                  <Mail className="w-4.5 h-4.5 text-amber-400" />
                                  <span>Email:</span>
                                </span>
                                <span className="text-neutral-300 text-base sm:text-lg truncate max-w-[240px]">
                                  {inv.client.email}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Líneas / Conceptos Facturados */}
                        <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                            Conceptos facturados:
                          </span>
                          <div className="space-y-1.5 pl-2">
                            {inv.items?.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex items-start justify-between gap-3 text-base sm:text-lg text-neutral-100 py-1 border-b border-neutral-850/50 last:border-0"
                              >
                                <div className="flex-1">
                                  <span className="font-semibold">{item.concept || 'Concepto'}</span>
                                  <span className="text-sm text-neutral-400 ml-2">
                                    ({item.units} uds x {formatCurrency(item.unitPrice)})
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-amber-300">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Desglose Fiscal (Base, IVA, IRPF, Total) */}
                        <div className="pt-2 border-t border-neutral-850/80 space-y-2 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                          <div className="flex items-center justify-between text-sm sm:text-base text-neutral-300">
                            <span>Base Imponible:</span>
                            <span className="font-mono font-bold">{formatCurrency(totals.base)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm sm:text-base text-neutral-300">
                            <span>IVA ({inv.ivaRate ?? 21}%):</span>
                            <span className="font-mono font-bold text-amber-300/90">
                              +{formatCurrency(totals.ivaAmount)}
                            </span>
                          </div>
                          {(inv.irpfRate ?? 0) > 0 && (
                            <div className="flex items-center justify-between text-sm sm:text-base text-neutral-300">
                              <span>Retención IRPF ({inv.irpfRate}%):</span>
                              <span className="font-mono font-bold text-rose-300">
                                -{formatCurrency(totals.irpfAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-base sm:text-lg font-black text-white pt-1.5 border-t border-neutral-700">
                            <span>TOTAL FACTURA:</span>
                            <span className="font-mono text-amber-300">{formatCurrency(totals.total)}</span>
                          </div>
                        </div>

                        {/* Observaciones o Nota Rectificativa */}
                        {inv.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-sm sm:text-base text-neutral-300">
                            <span className="font-bold text-neutral-200">Notas: </span>
                            <span className="italic">{inv.notes}</span>
                          </div>
                        )}

                        {/* Pie de acciones expandidas: Eliminar factura y Ver en Documento A4 */}
                        <div className="pt-3 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-amber-400 hover:text-amber-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-amber-400/15 cursor-pointer font-bold"
                          >
                            <Eye className="w-4.5 h-4.5 stroke-[2]" />
                            <span>Ver en Documento A4</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Estás seguro de que deseas eliminar la factura ${inv.number}?`)) {
                                onDeleteInvoice(inv.id || inv.number);
                              }
                            }}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-red-400 hover:text-red-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-950/50 cursor-pointer font-bold"
                            title="Eliminar factura"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                            <span>Eliminar</span>
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
    </div>
  );
};
