import React, { useState, useRef, useEffect } from 'react';
import { FolderTree, ChevronRight } from 'lucide-react';
import { LineasComplejasCliente } from '../types';
import { AnimatePresence, motion } from 'motion/react';

interface LineasComplejasDropdownProps {
  estructuras: LineasComplejasCliente[];
  onSelect: (concepto: string) => void;
}

export const LineasComplejasDropdown: React.FC<LineasComplejasDropdownProps> = ({
  estructuras,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEstructura, setSelectedEstructura] = useState<LineasComplejasCliente | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        resetState();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetState = () => {
    setSelectedEstructura(null);
    setCurrentLevelIdx(0);
    setSelectedValues([]);
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      resetState();
    } else {
      setIsOpen(true);
    }
  };

  const handleSelectEstructura = (est: LineasComplejasCliente) => {
    setSelectedEstructura(est);
    setCurrentLevelIdx(0);
    setSelectedValues([]);
    if (est.niveles.length === 0) {
      onSelect(est.concepto_troncal);
      setIsOpen(false);
      resetState();
    }
  };

  const handleSelectValue = (val: string) => {
    if (!selectedEstructura) return;
    
    // Si val es vacío, saltamos este nivel sin añadirlo
    const newValues = val ? [...selectedValues, val] : [...selectedValues];
    
    if (currentLevelIdx < selectedEstructura.niveles.length - 1) {
      setSelectedValues(newValues);
      setCurrentLevelIdx(currentLevelIdx + 1);
    } else {
      // Final level reached
      const finalConcept = `${selectedEstructura.concepto_troncal} ${newValues.join(' ')}`;
      onSelect(finalConcept.trim());
      setIsOpen(false);
      resetState();
    }
  };

  return (
    <div className="relative inline-block text-left print:hidden" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-amber-400 bg-neutral-100 hover:bg-amber-50 text-neutral-700 hover:text-neutral-950 text-xs font-semibold transition-all shadow-xs cursor-pointer"
        title="Construir concepto usando las Líneas Complejas del cliente"
      >
        <FolderTree className="w-3.5 h-3.5 text-amber-600" />
        <span>Línea Compleja ▾</span>
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
            {estructuras.length === 0 ? (
              <div className="p-4 text-xs text-neutral-500 text-center">
                El cliente no tiene Líneas Complejas configuradas.
              </div>
            ) : !selectedEstructura ? (
              <div className="py-2">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/50">
                  Concepto Troncal
                </div>
                {estructuras.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => handleSelectEstructura(est)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between group"
                  >
                    {est.concepto_troncal}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2">
                <div className="px-3 py-1.5 bg-neutral-50/50 flex flex-col gap-0.5">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer" onClick={() => resetState()}>
                    <ChevronRight className="w-3 h-3 rotate-180" /> 
                    {selectedEstructura.concepto_troncal}
                  </div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-4">
                    Paso {currentLevelIdx + 1}: {selectedEstructura.niveles[currentLevelIdx].nombre_nivel}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => handleSelectValue('')}
                    className="w-full text-left px-4 py-1.5 text-xs font-medium text-neutral-400 italic hover:bg-neutral-50 flex items-center justify-between group border-b border-neutral-100/50"
                  >
                    Saltar (No incluir)
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  {selectedEstructura.niveles[currentLevelIdx].valores.map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectValue(val)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between group"
                    >
                      {val}
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
