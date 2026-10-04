import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  UserPlus,
  Check,
} from 'lucide-react';
import { ClientData } from '../types';
import { CompactAlphabetKeyboard } from './CompactAlphabetKeyboard';

interface ClientsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientData[];
  onSelectClient?: (client: ClientData) => void;
  onOpenNewClientForm: () => void;
  onDeleteClient?: (id: string) => void;
  mode?: 'select' | 'manage';
}

export const ClientsDatabaseModal: React.FC<ClientsDatabaseModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSelectClient,
  onOpenNewClientForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(term);
      const nifMatch = c.nif?.toLowerCase().includes(term);
      return nameMatch || nifMatch;
    });
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => (c.id || c.nif) === selectedClientId) || null;
  }, [clients, selectedClientId]);

  if (!isOpen) return null;

  const handleConfirmSelect = () => {
    if (selectedClient && onSelectClient) {
      onSelectClient(selectedClient);
      setShowKeyboard(false);
      onClose();
    }
  };

  const handleClose = () => {
    setShowKeyboard(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl w-full max-w-xl h-[92vh] sm:h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* 1. Base de datos de clientes: Mostrar ÚNICAMENTE arriba "Clientes" */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800/80 shrink-0 bg-neutral-950">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Clientes
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Input para buscar cliente y botón nuevo cliente en la misma línea (50% de ancho cada uno) */}
        <div className="p-4 sm:p-5 pb-2 sm:pb-3 shrink-0 bg-neutral-950">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            {/* Input de búsqueda - 50% */}
            <div className="relative w-1/2 min-w-0 flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                inputMode="none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={() => setShowKeyboard(true)}
                onFocus={() => setShowKeyboard(true)}
                placeholder="Buscar cliente..."
                className="w-full pl-9 pr-8 py-3 bg-neutral-900 border border-neutral-700/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner cursor-pointer truncate"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón Añadir nuevo cliente - 50% */}
            <button
              type="button"
              onClick={() => {
                handleClose();
                onOpenNewClientForm();
              }}
              className="w-1/2 min-w-0 flex-1 py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-neutral-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-[0.99] truncate"
            >
              <UserPlus className="w-4 h-4 text-neutral-950 stroke-[2.5] shrink-0" />
              <span className="truncate">Nuevo cliente</span>
            </button>
          </div>
        </div>

        {/* 3. Listado de clientes únicamente con su nombre en líneas ocupando todo el ancho disponible sin relleno ni recuadro */}
        <div
          className={`flex-1 overflow-y-auto py-1 divide-y divide-neutral-800/40 transition-all ${
            showKeyboard ? 'pb-36' : 'pb-4'
          }`}
        >
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-base font-medium text-neutral-400">
                {searchTerm ? 'No se encontraron clientes coincidentes' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClientId === (client.id || client.nif);
              return (
                <div
                  key={client.id || client.nif}
                  onClick={() => setSelectedClientId(client.id || client.nif)}
                  onDoubleClick={() => {
                    setSelectedClientId(client.id || client.nif);
                    if (onSelectClient) {
                      onSelectClient(client);
                      setShowKeyboard(false);
                      onClose();
                    }
                  }}
                  className={`w-full py-4 sm:py-5 px-5 sm:px-6 transition-all cursor-pointer flex items-center justify-between text-left select-none ${
                    isSelected
                      ? 'bg-emerald-950/40 border-l-4 border-emerald-400 text-emerald-100'
                      : 'text-neutral-300 hover:bg-white/[0.02] hover:text-white active:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`text-2xl sm:text-3xl tracking-tight truncate ${
                      isSelected ? 'font-black text-white' : 'font-bold text-neutral-200'
                    }`}
                  >
                    {client.name}
                  </span>
                  {isSelected && (
                    <Check className="w-7 h-7 text-emerald-400 stroke-[2.5] shrink-0 ml-3" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. Botón flotante seleccionar cliente abajo del todo para adjuntar a la factura */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800/80 shrink-0">
          <button
            type="button"
            id="btn-seleccionar-cliente"
            disabled={!selectedClient}
            onClick={handleConfirmSelect}
            className={`w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
              selectedClient
                ? 'bg-emerald-300 hover:bg-emerald-200 text-neutral-950 border-2 border-emerald-500 ring-4 ring-emerald-400/40 shadow-emerald-400/25 active:scale-[0.99]'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/80 opacity-60 shadow-none'
            }`}
          >
            <Check className={`w-5 h-5 stroke-[2.5] ${selectedClient ? 'text-neutral-950' : 'text-neutral-500'}`} />
            <span>{selectedClient ? `Seleccionar cliente: ${selectedClient.name}` : 'Seleccionar cliente'}</span>
          </button>
        </div>

      </div>

      {/* Teclado alfanumérico táctil compacto personalizado (sin cabeceras) */}
      {showKeyboard && (
        <CompactAlphabetKeyboard
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => setShowKeyboard(false)}
          onSearch={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
};
