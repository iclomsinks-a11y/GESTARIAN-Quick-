import React, { useState } from 'react';
import {
  Search,
  Building2,
  Factory,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  CreditCard,
  Star,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProviderData } from '../types';

interface ProvidersScreenProps {
  providers: ProviderData[];
  onOpenNewProviderForm: () => void;
  onEditProvider: (provider: ProviderData) => void;
  onDeleteProvider: (id: string) => void;
  onSelectProviderForExpense?: (provider: ProviderData) => void;
}

// Icono personalizado de "+G" dentro de una hoja de factura/gasto (Tamaño x1.2, línea 1.5px)
// Simétrico al "+F" de clientes
const SheetPlusGIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10 sm:w-11 sm:h-11' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Contorno de hoja A4 con esquina doblada */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    {/* Texto +G centrado en la hoja */}
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
      +G
    </text>
  </svg>
);

export const ProvidersScreen: React.FC<ProvidersScreenProps> = ({
  providers,
  onOpenNewProviderForm,
  onEditProvider,
  onDeleteProvider,
  onSelectProviderForExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedIbanId, setCopiedIbanId] = useState<string | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ProviderData | null>(null);

  const filteredProviders = providers.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.cif && p.cif.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.address && p.address.toLowerCase().includes(term)) ||
      (p.iban && p.iban.toLowerCase().includes(term)) ||
      (p.bankName && p.bankName.toLowerCase().includes(term))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedProviderId((prev) => (prev === id ? null : id));
  };

  const handleCopyCif = (cif: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cif) return;
    navigator.clipboard.writeText(cif);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyIban = (iban: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!iban) return;
    navigator.clipboard.writeText(iban);
    setCopiedIbanId(id);
    setTimeout(() => setCopiedIbanId(null), 1800);
  };

  const handlePhoneClick = (phone?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!phone) {
      return;
    }
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsAppClick = (provider: ProviderData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!provider.phone) {
      return;
    }
    const cleanNumber = provider.phone.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.startsWith('34') ? cleanNumber : `34${cleanNumber}`;
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const handleConfirmDelete = () => {
    if (!providerToDelete) return;
    const idToDelete = providerToDelete.id || providerToDelete.cif || providerToDelete.name;
    onDeleteProvider(idToDelete);
    setProviderToDelete(null);
  };

  return (
    <div
      id="providers-screen-container"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 sm:pt-2 pb-8 space-y-3.5 text-neutral-100"
    >
      {/* Título de la página PROVEEDORES centrado 10px más arriba y en mayúsculas sin contador */}
      <div className="w-full text-center -mt-2 sm:-mt-2.5 mb-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.2em] text-white uppercase select-none">
          PROVEEDORES
        </h1>
      </div>

      {/* Cabecera limpia: Botón Buscar y Botón +Proveedor */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-lg">
        {/* Botón Buscar */}
        <button
          type="button"
          onClick={() => setShowSearchInput((prev) => !prev)}
          className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-4 sm:px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 transition-all cursor-pointer shrink-0"
          title="Buscar proveedores"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 stroke-[2.5]" />
          <span className="text-xl sm:text-2xl font-black text-amber-400 leading-none">Buscar</span>
        </button>

        {/* Botón + y Dibujito de Fábrica (iconos x1.5) */}
        <button
          type="button"
          id="btn-nuevo-proveedor-page"
          onClick={onOpenNewProviderForm}
          className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-4 sm:px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 transition-all cursor-pointer shrink-0"
          title="Añadir nuevo proveedor"
        >
          <span className="text-3xl sm:text-4xl font-black text-amber-400 leading-none">+</span>
          <Factory className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 stroke-[2.5]" />
        </button>
      </div>

      {/* Desplegable de Campo de Búsqueda al pulsar Buscar */}
      <AnimatePresence>
        {(showSearchInput || searchTerm) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative w-full max-w-lg mx-auto pt-1 pb-1">
              <input
                type="text"
                id="providers-search-input"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, CIF, teléfono, email, IBAN..."
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearchInput(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1 cursor-pointer"
                  title="Cerrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Tarjetas de Proveedores */}
      {filteredProviders.length === 0 ? (
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-bold text-white">No se encontraron proveedores</div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchTerm
              ? `No hay proveedores que coincidan con "${searchTerm}".`
              : 'Aún no tienes proveedores registrados.'}
          </p>
          <button
            type="button"
            onClick={onOpenNewProviderForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer proveedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
          {filteredProviders.map((provider) => {
            const providerId = provider.id || provider.cif || provider.name;
            const isExpanded = expandedProviderId === providerId;
            const hasAnyExpanded = expandedProviderId !== null;
            const isDimmed = hasAnyExpanded && !isExpanded;

            return (
              <motion.div
                key={providerId}
                id={`provider-card-${providerId}`}
                layout
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`group relative rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isExpanded
                    ? 'bg-neutral-900/98 border-amber-400 shadow-2xl ring-2 ring-amber-400/50 z-10 scale-[1.01]'
                    : 'bg-neutral-950/95 hover:bg-neutral-900/90 border-neutral-600 hover:border-amber-400/90'
                } ${isDimmed ? 'opacity-50 brightness-70 contrast-85 transition-all duration-300' : 'opacity-100'}`}
              >
                {/* LÍNEA 1: Nombre en una línea con indicador de emisor predeterminado */}
                <div
                  onClick={() => toggleExpand(providerId)}
                  className="px-4 pt-3.5 pb-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-800/40 transition-colors select-none"
                  title="Pulsa el nombre para expandir o contraer todos los datos del proveedor"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-amber-300 transition-colors truncate">
                      {provider.name}
                    </h3>
                  </div>
                  <div className="p-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-amber-300" />
                    )}
                  </div>
                </div>

                {/* LÍNEA 2: Fila de 5 Iconos Grandes FLOTANTES (x1.2 tamaño aumentado): Teléfono celeste, WhatsApp, +G en hoja, Editar y Eliminar */}
                <div className="px-3 pt-1 pb-3.5 grid grid-cols-5 place-items-center gap-1 sm:gap-2">
                  {/* Icono 1: Teléfono Flotante */}
                  <button
                    type="button"
                    onClick={(e) => handlePhoneClick(provider.phone, e)}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={provider.phone ? `Llamar a ${provider.phone}` : 'Sin teléfono (pulsa editar)'}
                  >
                    <Phone className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: WhatsApp Flotante (Verde sólido) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(provider, e)}
                    className="p-1 text-[#25D366] hover:text-[#3df084] hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#25D366' }}
                    title={provider.phone ? `Abrir chat de WhatsApp` : 'Sin teléfono para WhatsApp'}
                  >
                    <MessageCircle className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm text-[#25D366]" style={{ color: '#25D366' }} />
                  </button>

                  {/* Icono 3: +G dentro de una hoja Flotante (Registrar gasto / factura recibida de este proveedor) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectProviderForExpense) {
                        onSelectProviderForExpense(provider);
                      }
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Registrar factura recibida / gasto de este proveedor (+G)"
                  >
                    <SheetPlusGIcon className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Editar Flotante (Gris 50%) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProvider(provider);
                    }}
                    className="p-1 text-[#808080] hover:text-neutral-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#808080' }}
                    title="Editar todos los datos del proveedor"
                  >
                    <Edit3 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm text-[#808080]" style={{ color: '#808080' }} />
                  </button>

                  {/* Icono 5: Eliminar Proveedor Flotante (Rojo sólido) */}
                  <button
                    type="button"
                    id={`btn-delete-provider-${providerId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setProviderToDelete(provider);
                    }}
                    className="p-1 text-[#EF4444] hover:text-red-400 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#EF4444' }}
                    title="Eliminar este proveedor completamente"
                  >
                    <Trash2 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm text-[#EF4444]" style={{ color: '#EF4444' }} />
                  </button>
                </div>

                {/* ZONA EXPANDIBLE: Aparece de modo fluido al pulsar el nombre con texto aumentado x1.5 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`expanded-provider-${providerId}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-5 bg-neutral-950/80 border-t border-neutral-800 space-y-4 text-base text-neutral-200">
                        {/* CIF / NIF (Sin recuadro, sin botón de copiar, tamaño x1.5) */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                            NIF / CIF:
                          </span>
                          <span className="font-mono text-xl sm:text-2xl font-bold text-amber-300">
                            {provider.cif || 'SIN CIF'}
                          </span>
                        </div>

                        {/* Domicilio completo (Texto x1.5) */}
                        <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                            <MapPin className="w-4.5 h-4.5 text-neutral-400" />
                            <span>Domicilio Fiscal:</span>
                          </span>
                          <div className="pl-6 text-neutral-100 text-base sm:text-lg">
                            {provider.address ? (
                              <p className="leading-relaxed">{provider.address}</p>
                            ) : (
                              <span className="text-neutral-500 italic text-sm sm:text-base">
                                Sin domicilio registrado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teléfono & Email (Mismo color y tamaño que NIF/CIF: text-amber-300 / text-xl sm:text-2xl) */}
                        <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Phone className="w-4.5 h-4.5 text-amber-400 stroke-[1.5]" />
                              <span>Teléfono:</span>
                            </span>
                            <span className="font-mono text-amber-300 text-xl sm:text-2xl font-bold">
                              {provider.phone || <span className="text-neutral-500 italic font-normal text-sm">No asignado</span>}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Mail className="w-4.5 h-4.5 text-amber-400 stroke-[1.5]" />
                              <span>Email:</span>
                            </span>
                            <span className="text-amber-300 text-xl sm:text-2xl font-bold truncate max-w-[280px]">
                              {provider.email || <span className="text-neutral-500 italic text-sm font-normal">No asignado</span>}
                            </span>
                          </div>
                        </div>

                        {/* Datos Bancarios (IBAN / Banco) */}
                        {(provider.iban || provider.bankName) && (
                          <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                <CreditCard className="w-4.5 h-4.5 text-amber-400 stroke-[1.5]" />
                                <span>Datos Bancarios:</span>
                              </span>
                              {provider.bankName && (
                                <span className="text-xs font-semibold text-neutral-400">
                                  {provider.bankName}
                                </span>
                              )}
                            </div>
                            {provider.iban && (
                              <div className="flex items-center justify-between gap-2 pl-6 bg-white/5 p-2 rounded-xl border border-neutral-800/60">
                                <span className="font-mono text-xs sm:text-sm text-amber-300 font-semibold truncate">
                                  {provider.iban}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyIban(provider.iban!, providerId, e)}
                                  className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copiar IBAN"
                                >
                                  {copiedIbanId === providerId ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Observaciones / Notas si las tiene */}
                        {provider.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-sm sm:text-base text-neutral-300">
                            <span className="font-bold text-neutral-200">Notas: </span>
                            <span className="italic">{provider.notes}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Proveedor Completamente */}
      <AnimatePresence>
        {providerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-neutral-100"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">¿Eliminar Proveedor?</h3>
                  <p className="text-xs text-neutral-400">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-1.5 text-sm">
                <div className="font-bold text-white text-base truncate">
                  {providerToDelete.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>CIF/NIF:</span>
                  <span className="font-mono text-amber-300 font-semibold">{providerToDelete.cif || 'Sin CIF'}</span>
                </div>
                {providerToDelete.phone && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Tel:</span>
                    <span className="text-amber-300 font-mono">{providerToDelete.phone}</span>
                  </div>
                )}
                {providerToDelete.iban && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>IBAN:</span>
                    <span className="text-neutral-300 font-mono truncate">{providerToDelete.iban}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar completamente a este proveedor de la base de datos? Sus datos fiscales, cuentas y registro de facturación de compras serán borrados permanentemente.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProviderToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-provider"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-rose-900/30 active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 stroke-[2]" />
                  <span>Eliminar definitivamente</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
