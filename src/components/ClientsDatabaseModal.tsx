import React, { useState } from 'react';
import {
  X,
  Search,
  UserPlus,
  Users,
  Building,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Check,
  Trash2,
  ExternalLink,
  MessageCircle,
  FolderTree,
} from 'lucide-react';
import { ClientData } from '../types';

interface ClientsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientData[];
  onSelectClient?: (client: ClientData) => void;
  onOpenNewClientForm: () => void;
  onDeleteClient: (id: string) => void;
  onOpenClientVariablesTree?: (client: ClientData) => void;
  mode?: 'select' | 'manage';
}

export const ClientsDatabaseModal: React.FC<ClientsDatabaseModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSelectClient,
  onOpenNewClientForm,
  onDeleteClient,
  onOpenClientVariablesTree,
  mode = 'select',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.nif.toLowerCase().includes(term) ||
      (c.address && c.address.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>Base de Datos de Clientes</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  {clients.length} Registrados (Orden A-Z)
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Selecciona un cliente para la factura o añade uno nuevo a la base de datos.
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

        {/* Search & Actions Bar */}
        <div className="p-4 sm:p-6 pb-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nombre, CIF/NIF, ciudad..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* New Client Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewClientForm();
              }}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Clients List */}
        <div className="p-4 sm:p-6 pt-2 flex-1 overflow-y-auto max-h-[60vh] space-y-2.5">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-950 rounded-xl border border-neutral-800">
              <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-300">
                {searchTerm ? 'No se encontraron clientes coincidentes' : 'No hay clientes registrados'}
              </p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                {searchTerm ? 'Pruebe con otros términos de búsqueda' : 'Comience registrando su primer cliente'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewClientForm();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Nuevo Cliente</span>
              </button>
            </div>
          ) : (
            filteredClients.map((c) => (
              <div
                key={c.id || c.nif}
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                      {c.name}
                    </h3>
                    <span className="font-mono text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {c.nif}
                    </span>
                  </div>

                  {c.address && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500 pt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-600" />
                        {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-600" />
                        {c.email}
                      </span>
                    )}
                  </div>

                  {/* Canal de Envío de Documentos por Defecto */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-neutral-500 font-medium">Envío por defecto:</span>
                    {c.defaultSendWhatsApp && c.defaultSendEmail ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/25 px-2 py-0.5 rounded-full">
                          <MessageCircle className="w-2.5 h-2.5 fill-[#25D366]" />
                          WhatsApp
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded-full">
                          <Mail className="w-2.5 h-2.5" />
                          Email
                        </span>
                      </div>
                    ) : c.defaultSendWhatsApp ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/25 px-2 py-0.5 rounded-full">
                        <MessageCircle className="w-2.5 h-2.5 fill-[#25D366]" />
                        WhatsApp
                      </span>
                    ) : c.defaultSendEmail ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded-full">
                        <Mail className="w-2.5 h-2.5" />
                        Email
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-600 italic">No configurado</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {onOpenClientVariablesTree && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenClientVariablesTree(c);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-amber-300 bg-amber-400/10 border border-amber-400/40 hover:bg-amber-400/20 transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Configurar árbol de variables de 5 niveles para este cliente"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                      <span>Variables (5 Niveles)</span>
                    </button>
                  )}

                  {onSelectClient && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectClient(c);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Seleccionar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => c.id && onDeleteClient(c.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-neutral-950/80">
          <span>Mostrando {filteredClients.length} de {clients.length} clientes</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
