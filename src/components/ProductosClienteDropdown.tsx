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

  // States for inline numeric keyboard entry
  const [cantidad, setCantidad] = useState('0');
  const [precio, setPrecio] = useState('0');
  const [activeField, setActiveField] = useState<'cantidad' | 'precio'>('cantidad');
  const [triggerBorderAnimation, setTriggerBorderAnimation] = useState(false);

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
      setCantidad('0');
      setPrecio('0');
      // Set cursor inside input automatically
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
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

  // Handle tap on a product row to show custom quantity/price inputs and inline numeric keyboard
  const handleProductTap = (prod: BillableProduct) => {
    setSelectedProductId(prod.id);
    setCantidad('0');
    setPrecio(prod.price !== undefined ? prod.price.toString() : '0');
    setShowAlphabetKeyboard(false); // Hide letters keyboard
    setActiveField('cantidad'); // Focus Cantidad first
  };

  // Keyboard entry handlers for inline numerical keyboard
  const handleNumericKeyPress = (key: string) => {
    let current = activeField === 'cantidad' ? cantidad : precio;
    
    if (current === '0' && key !== '.' && key !== ',') {
      current = '';
    }

    if (key === '.' || key === ',') {
      if (!current.includes('.') && !current.includes(',')) {
        current = current === '' ? '0.' : current + '.';
      }
    } else {
      current += key;
    }

    if (activeField === 'cantidad') {
      setCantidad(current);
    } else {
      setPrecio(current);
    }
  };

  const handleNumericDelete = () => {
    let current = activeField === 'cantidad' ? cantidad : precio;
    if (current.length > 0) {
      current = current.slice(0, -1);
    }
    if (activeField === 'cantidad') {
      setCantidad(current || '0');
    } else {
      setPrecio(current || '0');
    }
  };

  const handleConfirmInline = () => {
    if (activeField === 'cantidad') {
      // Al pulsar ok tras rellenar el input de cantidad, se activa automáticamente el de precio
      setActiveField('precio');
      return;
    }

    if (!selectedProduct) return;
    if (!cantidad.trim() || !precio.trim()) return;

    const parsedQty = parseFloat(cantidad.replace(',', '.'));
    const parsedPrice = parseFloat(precio.replace(',', '.'));

    if (isNaN(parsedQty) || isNaN(parsedPrice)) return;

    // Add to invoice with selected quantity and price
    const productName = (selectedProduct.name || selectedProduct.description || '').trim();
    onSelect(productName, parsedPrice, parsedQty);

    // Reset selection and close inputs
    setSelectedProductId(null);
    setShowAlphabetKeyboard(true); // Return to alphabet keyboard

    // Animar bordes de línea de buscar producto y volver a factura
    setTriggerBorderAnimation(true);
    setTimeout(() => {
      setTriggerBorderAnimation(false);
    }, 2000);
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
            {/* Inline CSS style block to support high-fidelity border animations */}
            <style>{`
              @keyframes borderPulseBlue {
                0%, 100% { border-color: #2563eb; box-shadow: 0 0 0px rgba(37, 99, 235, 0); }
                50% { border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.8); }
              }
              @keyframes borderPulsePurple {
                0%, 100% { border-color: #7e22ce; box-shadow: 0 0 0px rgba(126, 34, 206, 0); }
                50% { border-color: #c084fc; box-shadow: 0 0 15px rgba(192, 132, 252, 0.8); }
              }
              .animate-border-blue-active {
                animation: borderPulseBlue 0.8s infinite ease-in-out;
              }
              .animate-border-purple-active {
                animation: borderPulsePurple 0.8s infinite ease-in-out;
              }
            `}</style>

            {/* Sticky Header Block (Floating at the top, stays pinned as the catalog scrolls) */}
            <div className="sticky top-0 z-50 bg-neutral-950 pb-3 border-b border-neutral-900 shrink-0 w-full">
              {/* Row 1: Title & Keyboard Toggle */}
              <div className="px-4 pt-3 pb-1 flex justify-between items-center w-[96%] max-w-4xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  <span className="block sm:hidden">Catálogo</span>
                  <span className="hidden sm:block">Catálogo de Productos</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAlphabetKeyboard(!showAlphabetKeyboard)}
                  className={`p-1.5 sm:p-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer w-28 sm:w-44 font-bold ${
                    showAlphabetKeyboard
                      ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title="Mostrar/ocultar teclado táctil de letras"
                >
                  <Keyboard className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-bold">Teclado</span>
                </button>
              </div>

              {/* Row 2: Search on the left (50%) and Back to Invoice on the right (50%) - now floating inside the header! */}
              <div className="w-[96%] max-w-4xl mx-auto mt-2 grid grid-cols-2 gap-3">
                {/* Left 50% - Buscar Input */}
                <div className="relative flex items-center w-full">
                  <Search className="w-4 h-4 text-[#00E5FF] absolute left-3.5 pointer-events-none stroke-[2.5]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    inputMode="none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={() => setShowAlphabetKeyboard(true)}
                    onFocus={() => setShowAlphabetKeyboard(true)}
                    autoFocus
                    placeholder="Buscar producto..."
                    className={`w-full pl-10 pr-9 py-2 bg-neutral-900 text-white rounded-xl border-2 transition-all outline-none font-black text-xs sm:text-sm cursor-pointer ${
                      triggerBorderAnimation
                        ? 'animate-border-blue-active border-blue-400'
                        : 'border-blue-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder-neutral-500 shadow-md'
                    }`}
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

                {/* Right 50% - Volver a Factura button (se vuelve con los datos guardados) */}
                <button
                  type="button"
                  onClick={handleClose}
                  className={`w-full py-2 px-4 rounded-xl bg-[#E9D8FD] hover:bg-[#DBC4FC] text-purple-950 font-black text-xs sm:text-sm border-2 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    triggerBorderAnimation
                      ? 'animate-border-purple-active border-purple-400'
                      : 'border-purple-700 shadow-md'
                  }`}
                >
                  Volver a Factura
                </button>
              </div>
            </div>

            {/* List: aligned to top, pegado al borde superior del contenedor de la lista */}
            <div
              className={`w-[96%] max-w-4xl mx-auto flex-1 overflow-y-auto pt-1 space-y-2 custom-scrollbar ${
                selectedProductId ? 'pb-[440px] sm:pb-[480px]' : showAlphabetKeyboard ? 'pb-44' : 'pb-24'
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
                      className="w-full text-left"
                    >
                      {/* Product line with shaded/darkened selection state "se ensombrece su fondo" */}
                      <div
                        onClick={() => handleProductTap(prod)}
                        className={`w-full text-left p-3 sm:p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                          isSelected
                            ? 'bg-neutral-950 text-neutral-300 border-2 border-neutral-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]'
                            : 'bg-neutral-900/90 text-neutral-100 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 active:scale-[0.99]'
                        }`}
                      >
                        {/* Left info column */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Código de producto */}
                            {prod.code && (
                              <span
                                className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded uppercase border bg-neutral-800 text-teal-300 border-neutral-700"
                              >
                                {prod.code}
                              </span>
                            )}

                            {/* Categoría */}
                            {prod.category && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-neutral-800/80 text-neutral-400"
                              >
                                {prod.category}
                              </span>
                            )}
                          </div>

                          {/* Nombre del Producto */}
                          <h4
                            className={`text-sm sm:text-base font-extrabold leading-tight break-words ${
                              isSelected ? 'text-teal-400 font-black' : 'text-neutral-100'
                            }`}
                          >
                            {prod.name}
                          </h4>

                          {/* Descripción del Producto */}
                          {prod.description && (
                            <p
                              className="text-xs leading-snug line-clamp-1 text-neutral-400"
                            >
                              {prod.description}
                            </p>
                          )}
                        </div>

                        {/* Button Select/Añadir */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductTap(prod);
                          }}
                          className="px-3 sm:px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                          title="Ajustar cantidad y precio para añadir"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Seleccionar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Custom Alphabet Keyboard toggled to help search, shown only when not editing a product */}
            {!selectedProductId && showAlphabetKeyboard && (
              <CompactAlphabetKeyboard
                value={searchQuery}
                onChange={(newVal) => setSearchQuery(newVal)}
                onClose={() => setShowAlphabetKeyboard(false)}
                onSearch={() => {
                  if (filteredProducts.length === 1) {
                    handleProductTap(filteredProducts[0]);
                  }
                }}
                placeholderLabel="Búsqueda de producto"
              />
            )}

            {/* Floating Bottom Numeric Keyboard: sticks to viewport bottom with dual inputs (Cantidad and Precio) */}
            {selectedProductId && (
              <div 
                className="fixed bottom-0 left-0 right-0 bg-neutral-950 border-t-2 border-neutral-800 p-4 pb-6 z-[120] shadow-[0_-15px_40px_rgba(0,0,0,0.65)] animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-w-md mx-auto space-y-3">
                  {/* Active Product Name Indicator */}
                  <div className="text-center truncate">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">Ajustar: </span>
                    <span className="text-xs font-extrabold text-neutral-200 truncate max-w-[250px] inline-block align-bottom font-sans">
                      {selectedProduct?.name || 'Producto'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Cantidad input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-400 tracking-wider mb-1 text-center">Cantidad</label>
                      <input
                        type="text"
                        inputMode="none"
                        value={cantidad}
                        onFocus={() => setActiveField('cantidad')}
                        onClick={() => setActiveField('cantidad')}
                        className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border focus:outline-none text-center font-mono font-bold text-sm ${
                          activeField === 'cantidad' ? 'border-teal-400 ring-1 ring-teal-400/30 bg-teal-950/20' : 'border-neutral-700'
                        }`}
                        readOnly
                      />
                    </div>
                    
                    {/* Precio input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-400 tracking-wider mb-1 text-center">Precio (€)</label>
                      <input
                        type="text"
                        inputMode="none"
                        value={precio}
                        onFocus={() => setActiveField('precio')}
                        onClick={() => setActiveField('precio')}
                        className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-lg border focus:outline-none text-center font-mono font-bold text-sm ${
                          activeField === 'precio' ? 'border-teal-400 ring-1 ring-teal-400/30 bg-teal-950/20' : 'border-neutral-700'
                        }`}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* NUMERICAL KEYBOARD right under the inputs */}
                  <div className="flex flex-col items-center">
                    <div className="grid grid-cols-4 gap-1.5 w-full max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleNumericKeyPress(key)}
                          className="h-10 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base rounded-lg border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 select-none"
                        >
                          {key}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleNumericDelete}
                        className="h-10 bg-neutral-900 hover:bg-rose-950 text-rose-400 font-bold text-xs rounded-lg border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 select-none"
                      >
                        Borrar
                      </button>
                    </div>

                    {/* Confirm OK / Cancel Button */}
                    <div className="flex items-center gap-2 w-full max-w-xs mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(null);
                          setShowAlphabetKeyboard(true);
                        }}
                        className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm rounded-lg border border-neutral-700 shadow-sm transition-all active:scale-95 cursor-pointer select-none"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmInline}
                        className="flex-2 py-2 px-4 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-black text-sm rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer select-none"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>OK</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
