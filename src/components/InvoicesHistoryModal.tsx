import React from 'react';
import {
  FileText,
  Trash2,
  ExternalLink,
  Copy,
  Calendar,
  User,
  Euro,
  X,
  Plus,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoicesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  currentInvoiceId: string;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onNewInvoice: () => void;
}

export const InvoicesHistoryModal: React.FC<InvoicesHistoryModalProps> = ({
  isOpen,
  onClose,
  invoices,
  currentInvoiceId,
  onSelectInvoice,
  onDeleteInvoice,
  onNewInvoice,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="invoices-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Historial de Facturas Emitidas</h2>
              <p className="text-xs text-neutral-500">
                {invoices.length} {invoices.length === 1 ? 'factura registrada' : 'facturas registradas'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewInvoice();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Factura
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-sm font-medium text-neutral-600">No hay facturas guardadas aún</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Las facturas que edites y guardes quedarán registradas aquí para consultarlas o reimprimirlas cuando desees.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const isCurrent = inv.id === currentInvoiceId;
                const baseTotal = inv.items.reduce((acc, it) => acc + (it.total || 0), 0);
                const ivaTotal = baseTotal * 0.21;
                const grandTotal = baseTotal + ivaTotal;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                          {inv.number}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            En edición actual
                          </span>
                        )}
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(inv.date)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-neutral-600">
                        <span className="flex items-center gap-1 font-medium text-neutral-800">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          {inv.client.name || 'Cliente sin nombre'}
                        </span>
                        {inv.client.nif && (
                          <span className="text-neutral-400 font-mono text-[11px]">
                            NIF: {inv.client.nif}
                          </span>
                        )}
                        <span className="text-neutral-400 text-[11px]">
                          {inv.items.length} {inv.items.length === 1 ? 'concepto' : 'conceptos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      <div className="text-right">
                        <div className="text-xs text-neutral-400">Total (IVA 21% inc.)</div>
                        <div className="text-base font-bold font-mono text-neutral-900">
                          {formatCurrency(grandTotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectInvoice(inv);
                            onClose();
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-neutral-200 text-neutral-700 cursor-default'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {isCurrent ? 'Abierta' : 'Cargar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la factura ${inv.number}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          title="Eliminar factura"
                          className="p-1.5 rounded-lg text-[#EF4444] hover:text-red-600 hover:bg-red-50 transition-colors"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 className="w-4 h-4 text-[#EF4444]" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center text-xs text-neutral-500">
          <span>Los datos se guardan de forma persistente en tu navegador</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
