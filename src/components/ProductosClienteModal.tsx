import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  Check,
  Package,
  Upload,
  Globe,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, BillableProduct } from '../types';
import { saveClientToDb } from '../utils/database';
import { sortProductsByName } from '../services/catalogImporterService';
import { ImportarCatalogoModal } from './ImportarCatalogoModal';

interface ProductosClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
  onSaveClient: (updatedClient: ClientData) => void;
  /** Catálogo global opcional para importar productos */
  catalogProducts?: BillableProduct[];
}

const generateId = () =>
  `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const ProductosClienteModal: React.FC<ProductosClienteModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaveClient,
  catalogProducts = [],
}) => {
  const [productos, setProductos] = useState<BillableProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields — NO price
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      setProductos(sortProductsByName(client.habitualProducts || []));
      resetForm();
    }
  }, [client, isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setShowForm(false);
    setShowCatalog(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setShowForm(true);
    setShowCatalog(false);
  };

  const handleEditProducto = (prod: BillableProduct) => {
    setEditingId(prod.id);
    setFormName(prod.name);
    setFormCode(prod.code || '');
    setFormDesc(prod.description || '');
    setShowForm(true);
    setShowCatalog(false);
  };

  const handleDeleteProducto = (id: string) => {
    const updated = productos.filter((p) => p.id !== id);
    setProductos(updated);
    if (!client) return;
    const updatedClient = { ...client, habitualProducts: updated };
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);
  };

  const handleSaveProducto = () => {
    if (!client || !formName.trim()) return;

    const rawCode = formCode.trim();
    let finalName = formName.trim();
    if (rawCode) {
      const lowerCode = rawCode.toLowerCase();
      const lowerName = finalName.toLowerCase();
      if (!lowerName.startsWith(lowerCode) && !lowerName.startsWith(`[${lowerCode}]`)) {
        finalName = `${rawCode} - ${finalName}`;
      }
    }

    let nuevos: BillableProduct[];
    if (editingId) {
      nuevos = productos.map((p) =>
        p.id === editingId
          ? { ...p, code: rawCode || undefined, name: finalName, description: formDesc.trim() || undefined }
          : p
      );
    } else {
      const nuevo: BillableProduct = {
        id: generateId(),
        code: rawCode || undefined,
        name: finalName,
        description: formDesc.trim() || undefined,
        createdAt: Date.now(),
      };
      nuevos = [...productos, nuevo];
    }

    const updatedClient = { ...client, habitualProducts: nuevos };
    setProductos(nuevos);
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
    resetForm();
  };

  const handleImportFromCatalog = (prod: BillableProduct) => {
    if (!client) return;
    if (productos.some((p) => p.name === prod.name)) return;
    const nuevo: BillableProduct = {
      id: generateId(),
      name: prod.name,
      description: prod.description,
      createdAt: Date.now(),
    };
    const nuevos = [...productos, nuevo];
    const updatedClient = { ...client, habitualProducts: nuevos };
    setProductos(nuevos);
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);
  };

  const handleBatchImportCatalog = (newProds: BillableProduct[], replaceMode: boolean) => {
    if (!client) return;
    let finalProds: BillableProduct[];
    if (replaceMode) {
      finalProds = newProds;
    } else {
      // Filter duplicates by name
      const existingNames = new Set(productos.map((p) => p.name.toLowerCase()));
      const filtered = newProds.filter((np) => !existingNames.has(np.name.toLowerCase()));
      finalProds = [...productos, ...filtered];
    }

    const updatedClient = { ...client, habitualProducts: finalProds };
    setProductos(finalProds);
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);
  };

  if (!isOpen || !client) return null;

  const availableCatalog = catalogProducts.filter(
    (cp) => !productos.some((p) => p.name === cp.name)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-amber-400" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-bold text-neutral-100 leading-tight">
                Configurar Productos del Cliente
              </h2>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                <strong className="text-amber-400">{client.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Banner de Subida de Catálogo (.txt, .html, Web) */}
          <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Cargar Catálogo Completo</span>
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Sube un catálogo en <strong>.txt, .html</strong> o introduce una <strong>dirección web</strong> para extraer productos automáticamente.
              </p>
            </div>
            <button
              type="button"
              id="btn-open-catalog-upload-modal"
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Subir Catálogo (.txt/.html/Web)</span>
            </button>
          </div>

          {/* Lista de productos del cliente */}
          {productos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Productos de {client.name} ({productos.length})
              </p>
              {sortProductsByName(productos).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-100 truncate">
                      {prod.name}
                    </p>
                    {prod.description && (
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {prod.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditProducto(prod)}
                      className="p-1.5 rounded-lg text-[#808080] hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                      style={{ color: '#808080' }}
                      title="Editar producto"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#808080]" style={{ color: '#808080' }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProducto(prod.id)}
                      className="p-1.5 rounded-lg text-[#EF4444] hover:text-red-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      style={{ color: '#EF4444' }}
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción (cuando no hay formulario abierto) */}
          {!showForm && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleOpenNew}
                className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-neutral-700 hover:border-amber-400/60 text-neutral-400 hover:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir uno a uno
              </button>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-amber-400/40 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Subir Catálogo (.txt, .html, Web)
              </button>

              {availableCatalog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  Importar global
                </button>
              )}
            </div>
          )}

          {/* Catálogo global para importar */}
          <AnimatePresence>
            {showCatalog && availableCatalog.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    Catálogo global — elige para importar
                  </p>
                  {availableCatalog.map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => handleImportFromCatalog(cp)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-amber-400/40 transition-all cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-neutral-200">{cp.name}</p>
                      {cp.description && (
                        <p className="text-[10px] text-neutral-500 truncate">{cp.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulario de creación/edición */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {editingId ? 'Editar producto' : 'Nuevo producto'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Código / Ref. (opcional)
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="Ej: REF-101, COD20…"
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400/70 transition-colors uppercase font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Nombre del producto *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej: Alfombra roja, Cojín de plumas…"
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400/70 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Detalles adicionales del concepto…"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400/70 transition-colors"
                    />
                  </div>

                  <p className="text-[10px] text-neutral-600 italic">
                    El precio se rellena directamente en la columna de la factura.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-2 rounded-xl border border-neutral-700 text-neutral-500 hover:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProducto}
                      disabled={!formName.trim()}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        formName.trim()
                          ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-sm shadow-amber-400/20'
                          : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                      }`}
                    >
                      {savedFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Guardado
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Guardar producto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estado vacío */}
          {productos.length === 0 && !showForm && !showCatalog && (
            <div className="text-center py-8 text-neutral-600 space-y-3">
              <Package className="w-8 h-8 mx-auto opacity-40 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-neutral-300">Sin productos configurados</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Añade productos individualmente o sube el catálogo completo en <strong>.txt, .html</strong> o desde la <strong>dirección web</strong> de {client.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Catálogo Completo</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal de importación avanzada de catálogo */}
        {isUploadModalOpen && (
          <ImportarCatalogoModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            client={client}
            onImportProducts={handleBatchImportCatalog}
          />
        )}
      </motion.div>
    </div>
  );
};

