import React, { useState, useRef } from 'react';
import {
  Search,
  UserPlus,
  User,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Send,
  Building,
  Copy,
  Check,
  Package,
  Camera,
  Upload,
  Link,
  X,
  ImageIcon,
  Sparkles,
  FolderTree,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, ClientDispatchChannel, BillableProduct, ReceivedInvoice, ProviderData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { saveClientToDb } from '../utils/database';
import { WhatsAppIcon } from './WhatsAppIcon';
import { NewReceivedInvoiceFullScreenForm } from './NewReceivedInvoiceFullScreenForm';
import { LineasComplejasModal } from './LineasComplejasModal';
import { ProductosClienteModal } from './ProductosClienteModal';

interface ClientsScreenProps {
  clients: ClientData[];
  onSelectClientForInvoice: (client: ClientData) => void;
  onEditClient: (client: ClientData) => void;
  onOpenNewClientForm: () => void;
  onDeleteClient: (id: string) => void;
  onUpdateClientPreferredChannel?: (clientId: string, channel: ClientDispatchChannel) => void;
  onGoToInvoice: () => void;
  products?: BillableProduct[];
  onOpenProductsDb?: () => void;
  /** Callback para que App.tsx guarde el cliente actualizado */
  onSaveClient?: (updatedClient: ClientData) => void;
  onSaveReceivedInvoice?: (invoice: ReceivedInvoice) => void;
  providers?: ProviderData[];
}

// Icono personalizado de "+F" dentro de una hoja de factura emitida (Tamaño x1.2, línea 1.5px)
const SheetPlusFIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10 sm:w-11 sm:h-11' }) => (
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
    {/* Texto +F centrado en la hoja */}
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
      +F
    </text>
  </svg>
);

// Icono personalizado de "+G" dentro de una hoja de factura recibida / gasto (Tamaño x1.5, línea 1.5px)
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

export const ClientsScreen: React.FC<ClientsScreenProps> = ({
  clients,
  onSelectClientForInvoice,
  onEditClient,
  onOpenNewClientForm,
  onDeleteClient,
  onUpdateClientPreferredChannel,
  products = [],
  onOpenProductsDb,
  onSaveClient,
  onSaveReceivedInvoice,
  providers = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);

  // Nuevos modales: Líneas Complejas y Productos por cliente
  const [lineasComplejasClient, setLineasComplejasClient] = useState<ClientData | null>(null);
  const [isLineasComplejasOpen, setIsLineasComplejasOpen] = useState(false);
  const [productosClient, setProductosClient] = useState<ClientData | null>(null);
  const [isProductosOpen, setIsProductosOpen] = useState(false);

  // Estado para formulario de Factura Recibida / Gasto activado mediante el botón +G
  const [clientForReceivedInvoice, setClientForReceivedInvoice] = useState<ClientData | null>(null);
  const [isReceivedInvoiceFormOpen, setIsReceivedInvoiceFormOpen] = useState(false);

  const handleOpenReceivedInvoiceForClient = (client: ClientData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setClientForReceivedInvoice(client);
    setIsReceivedInvoiceFormOpen(true);
  };

  // Estados para la gestión de productos habituales del cliente
  const [clientForHabitualProducts, setClientForHabitualProducts] = useState<ClientData | null>(null);
  const [isHabitualModalOpen, setIsHabitualModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<BillableProduct>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Habitual Product Form Modal
  const [habitualProductClient, setHabitualProductClient] = useState<ClientData | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [photoInputMode, setPhotoInputMode] = useState<'file' | 'url'>('file');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAddHabitualProduct = (client: ClientData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHabitualProductClient(client);
    setNewProductName('');
    setNewProductPrice('');
    setPhotoInputMode('file');
    setNewProductImageUrl('');
    setNewProductImagePreview(null);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHabitualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitualProductClient || !newProductName.trim()) return;

    const finalImage =
      photoInputMode === 'url' ? newProductImageUrl.trim() : newProductImagePreview || '';

    const newHabitualProduct: BillableProduct = {
      id: `prod-hab-${Date.now()}`,
      name: newProductName.trim(),
      description: newProductName.trim(),
      imageUrl: finalImage,
      price: parseFloat(newProductPrice) || 0,
      createdAt: Date.now(),
    };

    const currentList = habitualProductClient.habitualProducts || [];
    const updatedClient: ClientData = {
      ...habitualProductClient,
      habitualProducts: [newHabitualProduct, ...currentList],
    };

    saveClientToDb(updatedClient);
    if (onSaveClient) {
      onSaveClient(updatedClient);
    }
    setHabitualProductClient(null);
  };

  const handleDeleteHabitualProduct = (client: ClientData, productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentList = client.habitualProducts || [];
    const updatedList = currentList.filter((p) => p.id !== productId);
    const updatedClient: ClientData = {
      ...client,
      habitualProducts: updatedList,
    };
    saveClientToDb(updatedClient);
    if (onSaveClient) {
      onSaveClient(updatedClient);
    }
  };

  const handleToggleEnableProductsCatalog = (client: ClientData, enabled: boolean) => {
    const updatedClient: ClientData = {
      ...client,
      enableProductsCatalog: enabled,
    };
    saveClientToDb(updatedClient);
    if (onSaveClient) {
      onSaveClient(updatedClient);
    }
  };

  const handleToggleEnableComplexInvoice = (client: ClientData, enabled: boolean) => {
    const updatedClient: ClientData = {
      ...client,
      enableComplexInvoice: enabled,
    };
    saveClientToDb(updatedClient);
    if (onSaveClient) {
      onSaveClient(updatedClient);
    }
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.nif.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedClientId((prev) => (prev === id ? null : id));
  };

  const handleCopyNif = (nif: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nif) return;
    navigator.clipboard.writeText(nif);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePhoneClick = (phone?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!phone) {
      return;
    }
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleWhatsAppClick = (client: ClientData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!client.phone) {
      return;
    }
    const cleanNumber = client.phone.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.startsWith('34') ? cleanNumber : `34${cleanNumber}`;
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const idToDelete = clientToDelete.id || clientToDelete.nif || clientToDelete.name;
    onDeleteClient(idToDelete);
    setClientToDelete(null);
  };

  return (
    <div
      id="clients-screen-container"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 sm:pt-2 pb-8 space-y-3.5 text-neutral-100"
    >
      {/* Título de la página CLIENTES centrado 10px más arriba y en mayúsculas sin contador */}
      <div className="w-full text-center -mt-2 sm:-mt-2.5 mb-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.2em] text-white uppercase select-none">
          CLIENTES
        </h1>
      </div>

      {/* Cabecera limpia: Botón Buscar y Botón +Cliente */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-lg">
        {/* Botón Buscar */}
        <button
          type="button"
          onClick={() => setShowSearchInput((prev) => !prev)}
          className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-4 sm:px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 transition-all cursor-pointer shrink-0"
          title="Buscar clientes"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 stroke-[2.5]" />
          <span className="text-xl sm:text-2xl font-black text-amber-400 leading-none">Buscar</span>
        </button>

        {/* Botón + y Dibujito del Cliente (iconos x1.5) */}
        <button
          type="button"
          id="btn-nuevo-cliente-page"
          onClick={onOpenNewClientForm}
          className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 px-4 sm:px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 transition-all cursor-pointer shrink-0"
          title="Añadir nuevo cliente"
        >
          <span className="text-3xl sm:text-4xl font-black text-amber-400 leading-none">+</span>
          <User className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 stroke-[2.5]" />
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
                id="clients-search-input"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, NIF, teléfono, email..."
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

      {/* Grid de Tarjetas de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-bold text-white">No se encontraron clientes</div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchTerm
              ? `No hay clientes que coincidan con "${searchTerm}".`
              : 'Aún no tienes clientes registrados.'}
          </p>
          <button
            type="button"
            onClick={onOpenNewClientForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear primer cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
          {filteredClients.map((client) => {
            const clientId = client.id || client.nif || client.name;
            const isExpanded = expandedClientId === clientId;
            const hasAnyExpanded = expandedClientId !== null;
            const isDimmed = hasAnyExpanded && !isExpanded;

            const preferred =
              client.preferredDispatchChannel ||
              (client.defaultSendEmail && !client.defaultSendWhatsApp ? 'email' : 'whatsapp');

            return (
              <motion.div
                key={clientId}
                id={`client-card-${clientId}`}
                layout
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={`group relative rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isExpanded
                    ? 'bg-neutral-900/98 border-amber-400 shadow-2xl ring-2 ring-amber-400/50 z-10 scale-[1.01]'
                    : 'bg-neutral-950/95 hover:bg-neutral-900/90 border-neutral-600 hover:border-amber-400/90'
                } ${isDimmed ? 'opacity-50 brightness-70 contrast-85 transition-all duration-300' : 'opacity-100'}`}
              >
                {/* LÍNEA 1: Solo el Nombre en una línea (Al pulsar sobre el nombre se cargan los datos en la factura) */}
                <div className="px-4 pt-3.5 pb-1.5 flex items-center justify-between gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => onSelectClientForInvoice(client)}
                    className="text-left text-xl sm:text-2xl font-extrabold text-white hover:text-amber-300 transition-colors truncate flex-1 min-w-0 cursor-pointer focus:outline-none"
                    title={`Seleccionar y cargar los datos de ${client.name} en la factura`}
                  >
                    {client.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(clientId);
                    }}
                    className="p-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0 cursor-pointer rounded-lg hover:bg-neutral-800/60"
                    title={isExpanded ? "Contraer detalles" : "Ver todos los datos del cliente"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 hover:text-amber-300" />
                    )}
                  </button>
                </div>

                {/* LÍNEA 2: Fila de CINCO Iconos Grandes FLOTANTES (x1.2 tamaño aumentado): Teléfono, WhatsApp, +F, Editar y Eliminar */}
                <div className="px-2 sm:px-3 pt-1 pb-2.5 grid grid-cols-5 place-items-center gap-1 sm:gap-2">
                  {/* Icono 1: Teléfono Flotante (Celeste) */}
                  <button
                    type="button"
                    onClick={(e) => handlePhoneClick(client.phone, e)}
                    className="p-1 text-sky-400 hover:text-sky-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={client.phone ? `Llamar a ${client.phone}` : 'Sin teléfono (pulsa editar)'}
                  >
                    <Phone className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: WhatsApp Flotante (Relleno Gris 30% con telefonito blanco) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(client, e)}
                    className="p-1 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={client.phone ? `Abrir chat de WhatsApp` : 'Sin teléfono para WhatsApp'}
                  >
                    <WhatsAppIcon className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-sm" />
                  </button>

                  {/* Icono 3: +F dentro de una hoja Flotante (Facturar a este cliente) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClientForInvoice(client);
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Emitir factura a este cliente (+F)"
                  >
                    <SheetPlusFIcon className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Editar Flotante (Gris 50%) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClient(client);
                    }}
                    className="p-1 text-[#808080] hover:text-neutral-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#808080' }}
                    title="Editar todos los datos del cliente"
                  >
                    <Edit3 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm text-[#808080]" style={{ color: '#808080' }} />
                  </button>

                  {/* Icono 5: Eliminar Cliente Flotante (Rojo sólido) */}
                  <button
                    type="button"
                    id={`btn-delete-client-${clientId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientToDelete(client);
                    }}
                    className="p-1 text-[#EF4444] hover:text-red-400 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    style={{ color: '#EF4444' }}
                    title="Eliminar este cliente completamente"
                  >
                    <Trash2 className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.5] drop-shadow-sm text-[#EF4444]" style={{ color: '#EF4444' }} />
                  </button>
                </div>

                {/* CONTROLES DIRECTAMENTE DEBAJO DE LA LÍNEA DE SEIS ICONOS */}
                <div className="w-full px-3 pt-1 pb-3 space-y-2 border-t border-neutral-800/80">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* COLUMNA 1: LÍNEA COMPLEJA */}
                    <div className="flex flex-col items-center justify-start gap-1 bg-white/5 p-2 rounded-xl border border-neutral-800/60">
                      {/* Botón Alternar Línea Compleja (Sin dibujito, texto x1.75) */}
                      <button
                        type="button"
                        id={`btn-toggle-complex-${clientId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnableComplexInvoice(client, !client.enableComplexInvoice);
                        }}
                        className={`w-full py-2 px-2 rounded-xl border font-black text-sm sm:text-base flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
                          client.enableComplexInvoice
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/30'
                            : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-400'
                        }`}
                        title="Activar/Desactivar Línea Compleja en facturas"
                      >
                        <span className="truncate">Línea Compleja</span>
                      </button>

                      {/* Texto ON / OFF debajo del botón (x1.75) */}
                      <span
                        className={`text-sm sm:text-base font-black uppercase tracking-wider ${
                          client.enableComplexInvoice ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        {client.enableComplexInvoice ? 'ON' : 'OFF'}
                      </span>

                      {/* Botón Configurar Línea Compleja (Dibujito + "Configurar") */}
                      {client.enableComplexInvoice && (
                        <button
                          type="button"
                          id={`btn-lineas-complejas-${clientId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLineasComplejasClient(client);
                            setIsLineasComplejasOpen(true);
                          }}
                          className="w-full mt-0.5 py-1.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 border border-amber-300 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Configurar estructuras de concepto en niveles para este cliente"
                        >
                          <FolderTree className="w-4 h-4 text-neutral-950 shrink-0 stroke-[2.5]" />
                          <span className="truncate">Configurar</span>
                        </button>
                      )}
                    </div>

                    {/* COLUMNA 2: AÑADIR PRODUCTO */}
                    <div className="flex flex-col items-center justify-start gap-1 bg-white/5 p-2 rounded-xl border border-neutral-800/60">
                      {/* Botón Alternar Añadir Producto (Cajita + "+Producto", texto x1.75) */}
                      <button
                        type="button"
                        id={`btn-toggle-products-${clientId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnableProductsCatalog(client, !client.enableProductsCatalog);
                        }}
                        className={`w-full py-2 px-2 rounded-xl border font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                          client.enableProductsCatalog
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/30'
                            : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-400'
                        }`}
                        title="Activar/Desactivar Añadir Producto en facturas"
                      >
                        <Package className="w-4 h-4 shrink-0 stroke-[2.2]" />
                        <span className="truncate">+Producto</span>
                      </button>

                      {/* Texto ON / OFF debajo del botón (x1.75) */}
                      <span
                        className={`text-sm sm:text-base font-black uppercase tracking-wider ${
                          client.enableProductsCatalog ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      >
                        {client.enableProductsCatalog ? 'ON' : 'OFF'}
                      </span>

                      {/* Botón Configurar Productos (Cajita + "Configurar") */}
                      {client.enableProductsCatalog && (
                        <button
                          type="button"
                          id={`btn-productos-cliente-${clientId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductosClient(client);
                            setIsProductosOpen(true);
                          }}
                          className="w-full mt-0.5 py-1.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 border border-amber-300 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Configurar productos habituales de este cliente para insertar en facturas"
                        >
                          <Package className="w-4 h-4 text-neutral-950 shrink-0 stroke-[2.5]" />
                          <span className="truncate">Configurar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ZONA EXPANDIBLE: Aparece de modo fluido al pulsar el nombre con texto aumentado x1.5 */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`expanded-content-${clientId}`}
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
                            {client.nif || 'SIN CIF'}
                          </span>
                        </div>

                        {/* Domicilio completo (Texto x1.5) */}
                        <div className="space-y-1.5 pt-1 border-t border-neutral-850/80">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                            <MapPin className="w-4.5 h-4.5 text-neutral-400" />
                            <span>Domicilio Fiscal:</span>
                          </span>
                          <div className="pl-6 text-neutral-100 text-base sm:text-lg">
                            {client.address ? (
                              <p className="leading-relaxed">{client.address}</p>
                            ) : (
                              <span className="text-neutral-500 italic text-sm sm:text-base">
                                Sin domicilio registrado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Teléfono & Email (Tono más oscuro/cálido igual que CIF/NIF: text-amber-300) */}
                        <div className="space-y-2 pt-1 border-t border-neutral-850/80">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Phone className="w-4.5 h-4.5 text-amber-400 stroke-[1.5]" />
                              <span>Teléfono:</span>
                            </span>
                            <span className="font-mono text-amber-300 text-xl sm:text-2xl font-bold">
                              {client.phone || <span className="text-neutral-500 italic font-normal text-sm">No asignado</span>}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Mail className="w-4.5 h-4.5 text-amber-400 stroke-[1.5]" />
                              <span>Email:</span>
                            </span>
                            <span className="text-amber-300 text-xl sm:text-2xl font-bold truncate max-w-[280px]">
                              {client.email || <span className="text-neutral-500 italic text-sm font-normal">No asignado</span>}
                            </span>
                          </div>
                        </div>

                        {/* Envío preferente en la tarjeta (Icono WhatsApp grande verde e Icono Email grande rojo) */}
                        <div className="pt-2 border-t border-neutral-850/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Send className="w-4.5 h-4.5 text-neutral-400" />
                              <span>Envío Preferente:</span>
                            </span>
                            <div className="flex items-center gap-3">
                              {/* Botón WhatsApp Grande (Verde si activo, gris sin relleno si desactivado) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (client.id && onUpdateClientPreferredChannel) {
                                    onUpdateClientPreferredChannel(client.id, 'whatsapp');
                                  } else {
                                    onEditClient({
                                      ...client,
                                      preferredDispatchChannel: 'whatsapp',
                                      defaultSendWhatsApp: true,
                                      defaultSendEmail: false,
                                    });
                                  }
                                }}
                                className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                                  preferred === 'whatsapp'
                                    ? 'bg-neutral-800 border-amber-400 shadow-lg shadow-amber-400/20 scale-105'
                                    : 'bg-transparent border-neutral-700 opacity-60 hover:opacity-100 hover:border-neutral-500'
                                }`}
                                title="Establecer WhatsApp como canal de envío preferente"
                              >
                                <WhatsAppIcon
                                  className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-sm"
                                  active={preferred === 'whatsapp'}
                                />
                              </button>

                              {/* Botón Email Sobre Grande (Rojo si activo, gris sin relleno si desactivado) */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (client.id && onUpdateClientPreferredChannel) {
                                    onUpdateClientPreferredChannel(client.id, 'email');
                                  } else {
                                    onEditClient({
                                      ...client,
                                      preferredDispatchChannel: 'email',
                                      defaultSendEmail: true,
                                      defaultSendWhatsApp: false,
                                    });
                                  }
                                }}
                                className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                                  preferred === 'email'
                                    ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg shadow-red-500/25'
                                    : 'bg-transparent border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-400'
                                }`}
                                title="Establecer Email como canal de envío preferente"
                              >
                                <Mail
                                  className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.8] drop-shadow-sm"
                                  style={{ color: preferred === 'email' ? '#EF4444' : '#737373' }}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Observaciones / Notas si las tiene (Texto x2) */}
                        {client.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-xl sm:text-2xl text-neutral-200 leading-relaxed">
                            <span className="font-extrabold text-amber-300">Notas: </span>
                            <span className="italic text-white font-medium">{client.notes}</span>
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

      {/* Modal de Confirmación para Eliminar Cliente Completamente */}
      <AnimatePresence>
        {clientToDelete && (
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
                  <h3 className="text-lg font-bold text-white">¿Eliminar Cliente?</h3>
                  <p className="text-xs text-neutral-400">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-1.5 text-sm">
                <div className="font-bold text-white text-base truncate">
                  {clientToDelete.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>NIF/CIF:</span>
                  <span className="font-mono text-amber-300 font-semibold">{clientToDelete.nif || 'Sin NIF'}</span>
                </div>
                {clientToDelete.phone && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Tel:</span>
                    <span className="text-sky-300 font-mono">{clientToDelete.phone}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar completamente a este cliente de la base de datos? Sus datos fiscales y preferencias serán borrados permanentemente.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-client"
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

      {/* Modal de Formulario para Añadir Producto Habitual (vía Descripción y Foto o URL) */}
      <AnimatePresence>
        {habitualProductClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-neutral-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
                    <Package className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Añadir Producto Habitual</h3>
                    <p className="text-xs text-neutral-400">
                      Para {habitualProductClient.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHabitualProductClient(null)}
                  className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHabitualProduct} className="space-y-4">
                {/* Nombre / Descripción del Producto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                    Descripción / Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ej. Caja de muestras de lino rústico, Mantenimiento..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 focus:border-amber-400 text-white text-sm focus:outline-none transition-all"
                  />
                </div>

                {/* Precio Unitario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                    Precio Habitual (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 focus:border-amber-400 text-white text-sm font-mono focus:outline-none transition-all"
                  />
                </div>

                {/* Selector de Foto: Archivo/Cámara vs URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                    Foto del Producto
                  </label>

                  <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('file')}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        photoInputMode === 'file'
                          ? 'bg-amber-400 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Foto / Archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputMode('url')}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        photoInputMode === 'url'
                          ? 'bg-amber-400 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>URL de Imagen Web</span>
                    </button>
                  </div>

                  {photoInputMode === 'file' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={productFileInputRef}
                        accept="image/*"
                        onChange={handleProductFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => productFileInputRef.current?.click()}
                        className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-neutral-700/70 hover:border-amber-400 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                        style={{ backgroundColor: 'rgba(128, 128, 128, 0.05)' }}
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>
                          {newProductImagePreview ? 'Cambiar Foto Seleccionada' : 'Hacer foto o seleccionar imagen'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={newProductImageUrl}
                        onChange={(e) => setNewProductImageUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 focus:border-amber-400 text-white text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Previsualización de Imagen */}
                  {(newProductImagePreview || (photoInputMode === 'url' && newProductImageUrl.trim())) && (
                    <div className="pt-2 flex items-center gap-3 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                      <img
                        src={photoInputMode === 'file' ? newProductImagePreview! : newProductImageUrl.trim()}
                        alt="Previsualización"
                        className="w-14 h-14 rounded-lg object-cover border border-neutral-700 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '';
                        }}
                      />
                      <div className="text-xs text-neutral-400">
                        <span className="font-semibold text-emerald-400 block">✓ Imagen lista</span>
                        <span className="text-[10px]">Se guardará vinculada a este producto</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setHabitualProductClient(null)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="btn-save-habitual-product"
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Guardar Producto</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Formulario de Factura Recibida / Gasto activado mediante el botón +G */}
      {isReceivedInvoiceFormOpen && (
        <NewReceivedInvoiceFullScreenForm
          isOpen={isReceivedInvoiceFormOpen}
          onClose={() => {
            setIsReceivedInvoiceFormOpen(false);
            setClientForReceivedInvoice(null);
          }}
          onSaveInvoice={(invoice) => {
            if (onSaveReceivedInvoice) {
              onSaveReceivedInvoice(invoice);
            }
            setIsReceivedInvoiceFormOpen(false);
            setClientForReceivedInvoice(null);
          }}
          providers={providers}
          initialData={
            clientForReceivedInvoice
              ? {
                  supplierName: clientForReceivedInvoice.name,
                  supplierCif: clientForReceivedInvoice.nif,
                  supplierPhone: clientForReceivedInvoice.phone || '',
                  supplierEmail: clientForReceivedInvoice.email || '',
                  supplierAddress: clientForReceivedInvoice.address || '',
                  notes: `Gasto / Factura recibida asociada al cliente: ${clientForReceivedInvoice.name}`,
                }
              : undefined
          }
        />
      )}

      {/* Modal: Configurar Líneas Complejas del cliente */}
      {isLineasComplejasOpen && lineasComplejasClient && (
        <LineasComplejasModal
          isOpen={isLineasComplejasOpen}
          onClose={() => {
            setIsLineasComplejasOpen(false);
            setLineasComplejasClient(null);
          }}
          client={lineasComplejasClient}
          onSaveClient={(updatedClient) => {
            if (onSaveClient) onSaveClient(updatedClient);
            setLineasComplejasClient(updatedClient);
          }}
        />
      )}

      {/* Modal: Configurar Productos del cliente */}
      {isProductosOpen && productosClient && (
        <ProductosClienteModal
          isOpen={isProductosOpen}
          onClose={() => {
            setIsProductosOpen(false);
            setProductosClient(null);
          }}
          client={productosClient}
          onSaveClient={(updatedClient) => {
            if (onSaveClient) onSaveClient(updatedClient);
            setProductosClient(updatedClient);
          }}
          catalogProducts={products}
        />
      )}
    </div>
  );
};
