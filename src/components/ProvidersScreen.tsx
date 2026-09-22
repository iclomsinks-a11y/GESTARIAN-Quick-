import React, { useState } from 'react';
import {
  Search,
  Building2,
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
  onSetDefaultProvider?: (id: string) => void;
  onSelectProviderForExpense?: (provider: ProviderData) => void;
}

// Icono personalizado de "+G" dentro de una hoja de factura/gasto (Tamaño x1.5, línea 1.5px)
// Simétrico al "+F" de clientes
const SheetPlusGIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
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
  onSetDefaultProvider,
  onSelectProviderForExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
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

      {/* Cabecera limpia: Barra de Búsqueda y Botón +Nuevo */}
      <div className="flex items-center justify-between gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-lg">
        {/* Campo de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="providers-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CIF, teléfono, email, IBAN..."
            className="w-full pl-9 pr-7 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
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

        {/* Botón +Nuevo (Relleno transparente) */}
        <button
          type="button"
          id="btn-nuevo-proveedor-page"
          onClick={onOpenNewProviderForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 hover:text-amber-300 border-2 border-amber-400 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Building2 className="w-4 h-4 text-amber-400 stroke-[2.2]" />
          <span>+ Nuevo</span>
        </button>
      </div>

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
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {provider.name}
                    </h3>
                    {provider.isDefault && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Emisor</span>
                      </span>
                    )}
                  </div>
                  <div className="p-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-amber-300" />
                    )}
                  </div>
                </div>

                {/* LÍNEA 2: Fila de 5 Iconos Grandes FLOTANTES SIN ENVOLTORIO (x1.5 más grandes, trazo 1.5px): Teléfono celeste, WhatsApp, +G en hoja, Editar y Eliminar */}
                <div className="px-3 pt-1 pb-3.5 grid grid-cols-5 place-items-center gap-1">
                  {/* Icono 1: Teléfono Flotante (Celeste, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handlePhoneClick(provider.phone, e)}
                    className="p-1 text-sky-400 hover:text-sky-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={provider.phone ? `Llamar a ${provider.phone}` : 'Sin teléfono (pulsa editar)'}
                  >
                    <Phone className="w-9 h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: WhatsApp Flotante (1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(provider, e)}
                    className="p-1 text-[#25D366] hover:text-[#3df084] hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={provider.phone ? `Abrir chat de WhatsApp` : 'Sin teléfono para WhatsApp'}
                  >
                    <MessageCircle className="w-9 h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 3: +G dentro de una hoja Flotante (Registrar gasto / factura recibida de este proveedor, 1.5px) */}
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
                    <SheetPlusGIcon className="w-9 h-9 drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Editar Flotante (1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProvider(provider);
                    }}
                    className="p-1 text-neutral-300 hover:text-white hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Editar todos los datos del proveedor"
                  >
                    <Edit3 className="w-9 h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 5: Eliminar Proveedor Flotante (Rojo/Coral, 1.5px) */}
                  <button
                    type="button"
                    id={`btn-delete-provider-${providerId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setProviderToDelete(provider);
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Eliminar este proveedor completamente"
                  >
                    <Trash2 className="w-9 h-9 stroke-[1.5] drop-shadow-sm" />
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
                        {/* CIF / NIF (Texto x1.5) */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                            NIF / CIF:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base sm:text-lg font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                              {provider.cif || 'SIN CIF'}
                            </span>
                            {provider.cif && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyCif(provider.cif, providerId, e)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Copiar CIF"
                              >
                                {copiedId === providerId ? (
                                  <Check className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
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

                        {/* Teléfono & Email (Texto x1.5) */}
                        <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Phone className="w-4.5 h-4.5 text-sky-400 stroke-[1.5]" />
                              <span>Teléfono:</span>
                            </span>
                            <span className="font-mono text-sky-300 text-base sm:text-lg font-bold">
                              {provider.phone || <span className="text-neutral-500 italic font-normal text-sm">No asignado</span>}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Mail className="w-4.5 h-4.5 text-sky-400 stroke-[1.5]" />
                              <span>Email:</span>
                            </span>
                            <span className="text-sky-300 text-base sm:text-lg truncate max-w-[240px]">
                              {provider.email || <span className="text-neutral-500 italic text-sm">No asignado</span>}
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
                              <div className="flex items-center justify-between gap-2 pl-6 bg-neutral-900/70 p-2 rounded-xl border border-neutral-800">
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

                        {/* Empresa Emisora Predeterminada (Toggle o botón) */}
                        {onSetDefaultProvider && provider.id && (
                          <div className="pt-2 border-t border-neutral-850/80 flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Star className="w-4.5 h-4.5 text-amber-400" />
                              <span>Empresa Emisora:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onSetDefaultProvider(provider.id!)}
                              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                provider.isDefault
                                  ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-sm'
                                  : 'bg-neutral-900 text-neutral-300 border-neutral-750 hover:border-amber-400 hover:text-white'
                              }`}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  provider.isDefault ? 'fill-neutral-950 text-neutral-950' : 'text-amber-400'
                                }`}
                              />
                              <span>
                                {provider.isDefault ? 'Empresa predeterminada' : 'Hacer predeterminada'}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Observaciones / Notas si las tiene */}
                        {provider.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-sm sm:text-base text-neutral-300">
                            <span className="font-bold text-neutral-200">Notas: </span>
                            <span className="italic">{provider.notes}</span>
                          </div>
                        )}

                        {/* Botón de eliminar y editar en el pie expandido */}
                        <div className="pt-3 border-t border-neutral-850 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setProviderToDelete(provider)}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-rose-400 hover:text-rose-300 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-rose-950/50 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-4.5 h-4.5 stroke-[1.5]" />
                            <span>Eliminar proveedor</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditProvider(provider)}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-amber-400 hover:text-amber-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-amber-400/15 cursor-pointer font-bold"
                          >
                            <Edit3 className="w-4.5 h-4.5 stroke-[1.5]" />
                            <span>Editar datos</span>
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
                    <span className="text-sky-300 font-mono">{providerToDelete.phone}</span>
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
