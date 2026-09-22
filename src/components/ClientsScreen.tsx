import React, { useState, useRef } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
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
  Sliders,
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
import { NewReceivedInvoiceFullScreenForm } from './NewReceivedInvoiceFullScreenForm';

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
  onOpenComplexInvoice?: (client: ClientData) => void;
  onOpenClientVariablesTree?: (client: ClientData) => void;
  onUpdateClientHabitualProducts?: (clientId: string, products: BillableProduct[]) => void;
  onSaveReceivedInvoice?: (invoice: ReceivedInvoice) => void;
  providers?: ProviderData[];
}

// Icono personalizado de "+F" dentro de una hoja de factura emitida (Tamaño x1.5, línea 1.5px)
const SheetPlusFIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
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
  onOpenComplexInvoice,
  onOpenClientVariablesTree,
  onUpdateClientHabitualProducts,
  onSaveReceivedInvoice,
  providers = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);

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

    onEditClient(updatedClient);
    setHabitualProductClient(null);
  };

  const handleDeleteHabitualProduct = (client: ClientData, productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentList = client.habitualProducts || [];
    const updatedList = currentList.filter((p) => p.id !== productId);
    onEditClient({
      ...client,
      habitualProducts: updatedList,
    });
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

      {/* Cabecera limpia: Barra de Búsqueda y Botón +Nuevo */}
      <div className="flex items-center justify-between gap-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-lg">
        {/* Campo de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="clients-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, NIF, teléfono, email..."
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
          id="btn-nuevo-cliente-page"
          onClick={onOpenNewClientForm}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-transparent hover:bg-amber-400/15 text-amber-400 hover:text-amber-300 border-2 border-amber-400 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-amber-400 stroke-[2.2]" />
          <span>+ Nuevo</span>
        </button>
      </div>

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
                {/* LÍNEA 1: Solo el Nombre en una línea (Al pulsar se expande/contrae) */}
                <div
                  onClick={() => toggleExpand(clientId)}
                  className="px-4 pt-3.5 pb-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-800/40 transition-colors select-none"
                  title="Pulsa el nombre para expandir o contraer todos los datos del cliente"
                >
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate flex-1 min-w-0">
                    {client.name}
                  </h3>
                  <div className="p-1 text-neutral-400 hover:text-amber-300 transition-colors shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-amber-300" />
                    )}
                  </div>
                </div>

                {/* LÍNEA 2: Fila de SIETE Iconos Grandes FLOTANTES (x1.5 más grandes, trazo 1.5px): Teléfono, WhatsApp, +F, +G, Productos Facturables, Editar y Eliminar */}
                <div className="px-2 sm:px-3 pt-1 pb-2.5 grid grid-cols-7 place-items-center gap-0.5 sm:gap-1">
                  {/* Icono 1: Teléfono Flotante (Celeste, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handlePhoneClick(client.phone, e)}
                    className="p-1 text-sky-400 hover:text-sky-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={client.phone ? `Llamar a ${client.phone}` : 'Sin teléfono (pulsa editar)'}
                  >
                    <Phone className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 2: WhatsApp Flotante (1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(client, e)}
                    className="p-1 text-[#25D366] hover:text-[#3df084] hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title={client.phone ? `Abrir chat de WhatsApp` : 'Sin teléfono para WhatsApp'}
                  >
                    <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 3: +F dentro de una hoja Flotante (Facturar a este cliente, 1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClientForInvoice(client);
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Emitir factura a este cliente (+F)"
                  >
                    <SheetPlusFIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-sm" />
                  </button>

                  {/* Icono 4: +G dentro de una hoja Flotante (Adjuntar Factura Recibida / Gasto a mano, 1.5px) */}
                  <button
                    type="button"
                    id={`btn-plus-g-client-${clientId}`}
                    onClick={(e) => handleOpenReceivedInvoiceForClient(client, e)}
                    className="p-1 text-emerald-400 hover:text-emerald-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Adjuntar Gasto / Factura Recibida a mano (+G)"
                  >
                    <SheetPlusGIcon className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-sm" />
                  </button>

                  {/* Icono 4: Catálogo de Productos Facturables (1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenProductsDb) {
                        onOpenProductsDb();
                      }
                    }}
                    className="p-1 text-amber-400 hover:text-amber-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Catálogo de Productos Facturables"
                  >
                    <Package className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 5: Editar Flotante (1.5px) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClient(client);
                    }}
                    className="p-1 text-neutral-300 hover:text-white hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Editar todos los datos del cliente"
                  >
                    <Edit3 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>

                  {/* Icono 6: Eliminar Cliente Flotante (Rojo/Coral, 1.5px) */}
                  <button
                    type="button"
                    id={`btn-delete-client-${clientId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientToDelete(client);
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:scale-120 active:scale-90 transition-all duration-200 cursor-pointer bg-transparent border-0 focus:outline-none"
                    title="Eliminar este cliente completamente"
                  >
                    <Trash2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[1.5] drop-shadow-sm" />
                  </button>
                </div>

                {/* SECCIÓN Y BOTÓN DE PRODUCTOS HABITUALES DEL CLIENTE */}
                <div className="w-full px-3.5 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Productos Habituales ({client.habitualProducts?.length || 0})</span>
                    </span>

                    <button
                      type="button"
                      id={`btn-add-habitual-product-${clientId}`}
                      onClick={(e) => handleOpenAddHabitualProduct(client, e)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Añadir producto habitual para este cliente mediante descripción y foto o URL"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Añadir Producto</span>
                    </button>
                  </div>

                  {/* Lista de productos habituales si existen */}
                  {client.habitualProducts && client.habitualProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {client.habitualProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs hover:border-neutral-700 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-9 h-9 rounded-lg object-cover border border-neutral-700 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-neutral-850 border border-neutral-700 flex items-center justify-center text-neutral-400 shrink-0">
                                <Package className="w-4 h-4 text-amber-400/80" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-neutral-200 truncate">{prod.name}</p>
                              {(prod.price ?? 0) > 0 && (
                                <p className="text-[11px] font-mono text-amber-300 font-semibold">
                                  {formatCurrency(prod.price ?? 0)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectClientForInvoice(client);
                              }}
                              className="px-2 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-[10px] tracking-wider transition-all active:scale-95 cursor-pointer"
                              title="Facturar este cliente (+F)"
                            >
                              +F
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteHabitualProduct(client, prod.id, e)}
                              className="p-1 rounded-md hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Eliminar producto habitual"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOTONES DE FACTURA COMPLEJA Y VARIABLES EXCLUSIVAS DEL CLIENTE */}
                <div className="w-full flex flex-wrap items-center justify-center gap-2 pb-3 px-3">
                  {onOpenClientVariablesTree && (
                    <button
                      type="button"
                      id={`btn-variables-tree-${clientId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenClientVariablesTree(client);
                      }}
                      className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl border-2 border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 hover:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Configurar variables de factura compleja exclusivas de este cliente (hasta 5 niveles)"
                    >
                      <FolderTree className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.2]" />
                      <span className="truncate">Variables (5 Niveles)</span>
                    </button>
                  )}

                  {onOpenComplexInvoice && (
                    <button
                      type="button"
                      id={`btn-complex-invoice-${clientId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComplexInvoice(client);
                      }}
                      className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl border-2 border-amber-400/60 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Generar Factura Compleja para este cliente"
                    >
                      <Sliders className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.2]" />
                      <span className="truncate">Factura Compleja (+FC)</span>
                    </button>
                  )}
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
                        {/* CIF / NIF (Texto x1.5) */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400">
                            NIF / CIF:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base sm:text-lg font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                              {client.nif || 'SIN CIF'}
                            </span>
                            {client.nif && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyNif(client.nif, clientId, e)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Copiar NIF"
                              >
                                {copiedId === clientId ? (
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
                            {client.address ? (
                              <p className="leading-relaxed">{client.address}</p>
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
                              {client.phone || <span className="text-neutral-500 italic font-normal text-sm">No asignado</span>}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Mail className="w-4.5 h-4.5 text-sky-400 stroke-[1.5]" />
                              <span>Email:</span>
                            </span>
                            <span className="text-sky-300 text-base sm:text-lg truncate max-w-[240px]">
                              {client.email || <span className="text-neutral-500 italic text-sm">No asignado</span>}
                            </span>
                          </div>
                        </div>

                        {/* Envío preferente en la tarjeta (Texto x1.5) */}
                        <div className="pt-2 border-t border-neutral-850/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <Send className="w-4.5 h-4.5 text-neutral-400" />
                              <span>Envío Preferente:</span>
                            </span>
                            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
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
                                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                  preferred === 'whatsapp'
                                    ? 'bg-[#25D366] text-neutral-950 shadow-md'
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                WhatsApp
                              </button>
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
                                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                  preferred === 'email'
                                    ? 'bg-sky-400 text-neutral-950 shadow-md'
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Email
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Estado Factura Compleja (Texto x1.5) */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-850/80 text-sm sm:text-base">
                          <span className="font-bold text-neutral-400 flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-amber-400" />
                            <span>Factura Compleja:</span>
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full border ${
                              client.enableComplexInvoice
                                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {client.enableComplexInvoice ? 'Habilitada' : 'Deshabilitada (pulsa Editar para habilitar)'}
                          </span>
                        </div>

                        {/* Observaciones / Notas si las tiene (Texto x1.5) */}
                        {client.notes && (
                          <div className="pt-2 border-t border-neutral-850/80 text-sm sm:text-base text-neutral-300">
                            <span className="font-bold text-neutral-200">Notas: </span>
                            <span className="italic">{client.notes}</span>
                          </div>
                        )}

                        {/* Botón de eliminar en el pie expandido (Texto x1.5) */}
                        <div className="pt-3 border-t border-neutral-850 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="inline-flex items-center gap-2 text-sm sm:text-base text-rose-400 hover:text-rose-300 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-rose-950/50 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-4.5 h-4.5 stroke-[1.5]" />
                            <span>Eliminar cliente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditClient(client)}
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
                        className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-neutral-700 hover:border-amber-400 bg-neutral-950/50 hover:bg-neutral-950 text-neutral-300 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
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
    </div>
  );
};
