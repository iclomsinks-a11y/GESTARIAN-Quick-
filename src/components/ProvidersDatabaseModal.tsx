import React, { useState } from 'react';
import {
  X,
  Building2,
  Plus,
  Check,
  Trash2,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Star,
} from 'lucide-react';
import { ProviderData } from '../types';
import { NewProviderFullScreenForm } from './NewProviderFullScreenForm';

interface ProvidersDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderData[];
  onSelectProvider: (provider: ProviderData) => void;
  onSaveProvider: (provider: ProviderData) => void;
  onDeleteProvider: (id: string) => void;
  onSetDefaultProvider: (id: string) => void;
}

export const ProvidersDatabaseModal: React.FC<ProvidersDatabaseModalProps> = ({
  isOpen,
  onClose,
  providers,
  onSelectProvider,
  onSaveProvider,
  onDeleteProvider,
  onSetDefaultProvider,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-neutral-100 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <span>Base de Datos de Proveedores y Emisores</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    {providers.length} Empresas
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Selecciona la empresa o proveedor emisor para aplicar sus datos y logotipo en la factura.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
            {/* Add New Provider Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Nueva Empresa / Proveedor</span>
              </button>
            </div>

            {/* List of Providers */}
            <div className="space-y-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1">
                    {/* Logo thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 p-1 flex items-center justify-center shrink-0">
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt={p.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building2 className="w-6 h-6 text-neutral-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {p.name}
                        </h4>
                        {p.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                        <span className="font-mono font-semibold text-amber-400">{p.cif}</span>
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            {p.phone}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-500" />
                            {p.email}
                          </span>
                        )}
                      </div>
                      {p.address && (
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-600" />
                          {p.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProvider(p);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar</span>
                    </button>

                    {!p.isDefault && (
                      <button
                        type="button"
                        onClick={() => p.id && onSetDefaultProvider(p.id)}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors"
                        title="Marcar como predeterminado"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (p.id && confirm(`¿Estás seguro de eliminar el proveedor "${p.name}"?`)) {
                          onDeleteProvider(p.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[#EF4444] hover:text-red-400 transition-colors"
                      style={{ color: '#EF4444' }}
                      title="Eliminar proveedor"
                    >
                      <Trash2 className="w-4 h-4 text-[#EF4444]" style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Provider Full Screen A4 Form Modal */}
      {isAddingNew && (
        <NewProviderFullScreenForm
          isOpen={isAddingNew}
          onClose={() => setIsAddingNew(false)}
          onSaveProvider={(newProv) => {
            onSaveProvider(newProv);
            setIsAddingNew(false);
          }}
        />
      )}
    </>
  );
};
