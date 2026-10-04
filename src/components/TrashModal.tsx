import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Undo,
  FileText,
  Calendar,
  Info,
  DollarSign
} from 'lucide-react';
import { DeletedInvoice } from '../types';
import {
  getStoredTrash,
  restoreInvoiceFromTrash,
  deleteInvoicePermanentlyFromTrash
} from '../utils/database';
import { formatCurrency } from '../utils/formatters';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoicesUpdated?: () => void; // Callback to notify App.tsx to reload its active invoices
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  onInvoicesUpdated
}) => {
  const [trashItems, setTrashItems] = useState<DeletedInvoice[]>([]);

  // Load trash items when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTrashItems(getStoredTrash());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = (id: string, number: string) => {
    const { trash, invoices } = restoreInvoiceFromTrash(id);
    setTrashItems(trash);
    if (onInvoicesUpdated) {
      onInvoicesUpdated();
    }
    // Simple native feedback
    alert(`Factura ${number} restaurada correctamente al historial.`);
  };

  const handleDeletePermanent = (id: string, number: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la factura ${number}?\nEsta acción es irreversible y no se podrá recuperar.`)) {
      const remaining = deleteInvoicePermanentlyFromTrash(id);
      setTrashItems(remaining);
      alert(`Factura ${number} eliminada permanentemente.`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days left until 1 year deletion
  const getDaysRemainingText = (deletedAt: number) => {
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const expiryTimestamp = deletedAt + oneYearMs;
    const remainingMs = expiryTimestamp - Date.now();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    
    if (remainingDays <= 0) {
      return 'Expirando hoy';
    } else if (remainingDays === 1) {
      return 'Expira mañana';
    } else {
      return `Expira en ${remainingDays} días`;
    }
  };

  const calculateInvoiceTotal = (invoice: any) => {
    const base = invoice.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
    const ivaRate = invoice.ivaRate ?? 21;
    const ivaAmount = base * (ivaRate / 100);
    const irpfRate = invoice.irpfRate ?? 0;
    const irpfAmount = base * (irpfRate / 100);
    return base + ivaAmount - irpfAmount;
  };

  return (
    <div
      id="trash-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div
        id="trash-modal-container"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-850 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">Papelera de Documentos</h2>
              <p className="text-xs text-neutral-400">Facturas emitidas eliminadas temporalmente</p>
            </div>
          </div>
          <button
            id="close-trash-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-start gap-3 text-xs text-amber-300">
          <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">Información de retención fiscal</p>
            <p className="text-amber-400/80 leading-snug">
              Conforme a la legislación fiscal española, los documentos en la papelera se conservan de forma segura y se vaciarán automáticamente al cabo de un año (365 días) desde su eliminación.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {trashItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-300">La papelera está vacía</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                No hay facturas eliminadas actualmente. Al borrar facturas guardadas desde su tarjeta de visualización, se enviarán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashItems.map((item) => {
                const total = calculateInvoiceTotal(item.invoice);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-750 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200">
                          {item.invoice.number || 'S/N'}
                        </span>
                        <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {item.invoice.client?.name || 'Cliente sin nombre'}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {item.invoice.client?.nif}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Eliminado el {formatDate(item.deletedAt)}</span>
                        </span>
                        <span className="text-red-400 font-medium bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20 text-[10px]">
                          {getDaysRemainingText(item.deletedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-neutral-900 sm:border-0 pt-2.5 sm:pt-0">
                      <div className="text-right sm:pr-2">
                        <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Total</span>
                        <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                          {formatCurrency(total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id, item.invoice.number)}
                          className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Restaurar al historial de facturas activas"
                        >
                          <Undo className="w-4 h-4" />
                          <span className="text-[10px] uppercase tracking-wider px-1">Restaurar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePermanent(item.id, item.invoice.number)}
                          className="p-2 rounded-xl bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-neutral-800 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                          title="Eliminar definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
