import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Package, Search, X, Check, Plus, Keyboard } from 'lucide-react';
import { BillableProduct } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { formatConceptWithCode, sortProductsByName } from '../services/catalogImporterService';
import { getStoredProducts } from '../utils/database';
import { CompactAlphabetKeyboard } from './CompactAlphabetKeyboard';

interface ProductosClienteDropdownProps {
  productos: BillableProduct[];
  onSelect: (concepto: string, price?: number, quantity?: number) => void;
  buttonClassName?: string;
  className?: string;
}

export const ProductosClienteDropdown: React.FC<ProductosClienteDropdownProps> = ({
  productos,
  onSelect,
  buttonClassName,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAlphabetKeyboard, setShowAlphabetKeyboard] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Combine client habitual products with global stored catalog if client products list is empty
  const allAvailableProducts = useMemo(() => {
    if (productos && productos.length > 0) {
      return productos;
    }
    const stored = getStoredProducts();
    return stored.length > 0 ? stored : [];
  }, [productos]);

  // Focus and reset selection when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedProductId(null);
      setShowAlphabetKeyboard(true);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const queryRaw = normalize(searchQuery.trim());
  const queryTokens = queryRaw.split(/\s+/).filter(Boolean);

  const filteredProducts = useMemo(() => {
    const list = allAvailableProducts.filter((prod) => {
      if (queryTokens.length === 0) return true;
      const targetText = normalize(
        `${prod.code || ''} ${prod.name || ''} ${prod.description || ''} ${prod.category || ''}`
      );
      return queryTokens.every((token) => targetText.includes(token));
    });
    return sortProductsByName(list);
  }, [allAvailableProducts, queryTokens]);

  const selectedProduct = useMemo(() => {
    return allAvailableProducts.find((p) => p.id === selectedProductId) || null;
  }, [allAvailableProducts, selectedProductId]);

  // Commit and add selected product directly to invoice with default units=0 and price=0 (to be filled in invoice)
  const handleConfirmAdd = () => {
    if (!selectedProduct) return;
    const productName = (selectedProduct.name || selectedProduct.description || '').trim();
    const defaultPrice = selectedProduct.price !== undefined && selectedProduct.price > 0 ? selectedProduct.price : 0;

    onSelect(productName, defaultPrice, 0);
    setIsOpen(false);
  };

  const handleSelectAndAddDirect = (prod: BillableProduct) => {
    setSelectedProductId(prod.id);
    const productName = (prod.name || prod.description || '').trim();
    const defaultPrice = prod.price !== undefined && prod.price > 0 ? prod.price : 0;
    onSelect(productName, defaultPrice, 0);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left print:hidden ${className || ''}`}>
      {/* Botón desencadenante en la factura */}
      <button
        type="button"
        id="btn-add-product-dropdown"
        onClick={handleOpen}
        className={
          buttonClassName ||
          'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-pink-500 bg-pink-100 hover:bg-pink-200 active:bg-pink-300 text-pink-950 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer'
        }
        title="Abrir catálogo y buscador de productos"
      >
        <Package className="w-5 h-5" />
        <span>Añadir producto ▾</span>
      </button>

      {/* Ventana a pantalla completa */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] bg-neutral-950/98 backdrop-blur-md flex flex-col overflow-hidden text-neutral-100"
          >
            {/* Header ultra compacto: altura mínima */}
            <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Catálogo de Productos
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {filteredProducts.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAlphabetKeyboard(!showAlphabetKeyboard)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    showAlphabetKeyboard
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Mostrar/ocultar teclado táctil de letras"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-bold">Teclado</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom input que ocupa poco espacio de altura para introducir los datos del producto a buscar */}
            <div className="w-[96%] max-w-4xl mx-auto my-2 shrink-0">
              <div className="relative flex items-center w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => setShowAlphabetKeyboard(true)}
                  onFocus={() => setShowAlphabetKeyboard(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedProduct) {
                      handleConfirmAdd();
                    } else if (e.key === 'Enter' && filteredProducts.length === 1) {
                      handleSelectAndAddDirect(filteredProducts[0]);
                    }
                  }}
                  placeholder="Buscar producto por nombre o código..."
                  className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-neutral-900 text-white rounded-xl border border-neutral-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 placeholder-neutral-500 font-medium text-xs sm:text-sm outline-none shadow-md transition-all cursor-pointer"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Líneas de los productos desplegadas en cascada hacia abajo después del input (sin campos de cantidad ni precio) */}
            <div
              className={`w-[96%] max-w-4xl mx-auto flex-1 overflow-y-auto pt-1 space-y-2 custom-scrollbar ${
                showAlphabetKeyboard ? 'pb-44' : 'pb-24'
              }`}
            >
              {filteredProducts.length === 0 ? (
                <div className="text-center py-10 px-4 bg-neutral-900/50 rounded-xl border border-neutral-800 space-y-2">
                  <Package className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-neutral-300">
                    No se encontraron productos coincidentes
                  </p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = selectedProductId === prod.id;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectAndAddDirect(prod)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isSelected
                          ? 'bg-[#ccfbf1] text-teal-950 border-2 border-teal-500 shadow-md shadow-teal-500/20'
                          : 'bg-neutral-900/90 text-neutral-100 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 active:scale-[0.99]'
                      }`}
                    >
                      {/* Left info column */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Código de producto */}
                          {prod.code && (
                            <span
                              className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded uppercase border ${
                                isSelected
                                  ? 'bg-teal-200/90 text-teal-950 border-teal-400'
                                  : 'bg-neutral-800 text-teal-300 border-neutral-700'
                              }`}
                            >
                              {prod.code}
                            </span>
                          )}

                          {/* Categoría */}
                          {prod.category && (
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                                isSelected
                                  ? 'bg-teal-200/80 text-teal-900'
                                  : 'bg-neutral-800/80 text-neutral-400'
                              }`}
                            >
                              {prod.category}
                            </span>
                          )}
                        </div>

                        {/* Nombre del Producto */}
                        <h4
                          className={`text-sm sm:text-base font-extrabold leading-tight break-words ${
                            isSelected ? 'text-teal-950 font-black' : 'text-neutral-100'
                          }`}
                        >
                          {prod.name}
                        </h4>

                        {/* Descripción del Producto */}
                        {prod.description && (
                          <p
                            className={`text-xs leading-snug line-clamp-1 ${
                              isSelected ? 'text-teal-900 font-medium' : 'text-neutral-400'
                            }`}
                          >
                            {prod.description}
                          </p>
                        )}
                      </div>

                      {/* Botón Añadir a la factura */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndAddDirect(prod);
                        }}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Añadir este producto a la factura"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Teclado táctil alfanumérico compacto de letras grandes para buscar producto con altura mínima */}
            {showAlphabetKeyboard && (
              <CompactAlphabetKeyboard
                value={searchQuery}
                onChange={(newVal) => setSearchQuery(newVal)}
                onClose={() => setShowAlphabetKeyboard(false)}
                onSearch={() => {
                  if (selectedProduct) {
                    handleConfirmAdd();
                  } else if (filteredProducts.length === 1) {
                    handleSelectAndAddDirect(filteredProducts[0]);
                  }
                }}
                placeholderLabel="Búsqueda de producto"
              />
            )}

            {/* Botón flotante para añadir el producto seleccionado a la factura */}
            {!showAlphabetKeyboard && (
              <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[95%] max-w-md">
                <button
                  type="button"
                  id="btn-floating-add-product"
                  onClick={handleConfirmAdd}
                  disabled={!selectedProduct}
                  className={`w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
                    selectedProduct
                      ? 'bg-teal-400 hover:bg-teal-300 text-neutral-950 border-2 border-teal-200 shadow-teal-500/40 cursor-pointer active:scale-95'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-80'
                  }`}
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>{selectedProduct ? `Añadir "${selectedProduct.name}"` : 'Añadir a la factura'}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
