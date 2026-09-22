import React, { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { BillableProduct } from '../types';
import { AnimatePresence, motion } from 'motion/react';

interface ProductosClienteDropdownProps {
  productos: BillableProduct[];
  onSelect: (concepto: string) => void;
}

export const ProductosClienteDropdown: React.FC<ProductosClienteDropdownProps> = ({
  productos,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectProduct = (prod: BillableProduct) => {
    const concept = prod.description ? `${prod.name} — ${prod.description}` : prod.name;
    onSelect(concept);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left print:hidden" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400 hover:border-amber-500 bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        title="Insertar un producto configurado para este cliente"
      >
        <Package className="w-3.5 h-3.5 text-amber-700" />
        <span>Producto ▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {productos.length === 0 ? (
              <div className="p-4 text-xs text-neutral-500 text-center">
                El cliente no tiene productos configurados.
              </div>
            ) : (
              <div className="py-2 max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50 mb-1">
                  Productos del cliente
                </div>
                {productos.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 group transition-colors"
                  >
                    <div className="text-xs font-semibold text-neutral-800 group-hover:text-amber-700">
                      {prod.name}
                    </div>
                    {prod.description && (
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5 group-hover:text-amber-600/70">
                        {prod.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
