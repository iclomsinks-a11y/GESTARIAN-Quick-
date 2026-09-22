import React, { useState, useEffect } from 'react';
import { FolderTree, ChevronRight, Check, Sparkles, Layers, Search } from 'lucide-react';
import { ClientConceptVariableNode } from '../types';

interface ClientConceptTreeSelectorProps {
  variableTrees?: ClientConceptVariableNode[];
  clientName?: string;
  onApplyConcept: (conceptText: string, suggestedPrice?: number) => void;
}

export const ClientConceptTreeSelector: React.FC<ClientConceptTreeSelectorProps> = ({
  variableTrees = [],
  clientName = 'Cliente',
  onApplyConcept,
}) => {
  const [level1Search, setLevel1Search] = useState('');
  const [selectedL1, setSelectedL1] = useState<ClientConceptVariableNode | null>(null);
  const [selectedL2, setSelectedL2] = useState<ClientConceptVariableNode | null>(null);
  const [selectedL3, setSelectedL3] = useState<ClientConceptVariableNode | null>(null);
  const [selectedL4, setSelectedL4] = useState<ClientConceptVariableNode | null>(null);
  const [selectedL5, setSelectedL5] = useState<ClientConceptVariableNode | null>(null);

  const [showL1Dropdown, setShowL1Dropdown] = useState(false);

  // Filter Level 1 suggestions based on typing
  const matchingL1Nodes = variableTrees.filter((node) =>
    node.name.toLowerCase().includes(level1Search.toLowerCase().trim())
  );

  // Auto-detect when typing exact or prefix match
  useEffect(() => {
    if (!level1Search.trim()) {
      setSelectedL1(null);
      setSelectedL2(null);
      setSelectedL3(null);
      setSelectedL4(null);
      setSelectedL5(null);
      return;
    }

    const exactMatch = variableTrees.find(
      (node) => node.name.toLowerCase().trim() === level1Search.toLowerCase().trim()
    );
    if (exactMatch && exactMatch.id !== selectedL1?.id) {
      setSelectedL1(exactMatch);
      setSelectedL2(null);
      setSelectedL3(null);
      setSelectedL4(null);
      setSelectedL5(null);
    }
  }, [level1Search, variableTrees]);

  const handleSelectL1 = (node: ClientConceptVariableNode) => {
    setLevel1Search(node.name);
    setSelectedL1(node);
    setSelectedL2(null);
    setSelectedL3(null);
    setSelectedL4(null);
    setSelectedL5(null);
    setShowL1Dropdown(false);
  };

  const handleSelectL2 = (nodeId: string) => {
    const node = selectedL1?.children?.find((c) => c.id === nodeId) || null;
    setSelectedL2(node);
    setSelectedL3(null);
    setSelectedL4(null);
    setSelectedL5(null);
  };

  const handleSelectL3 = (nodeId: string) => {
    const node = selectedL2?.children?.find((c) => c.id === nodeId) || null;
    setSelectedL3(node);
    setSelectedL4(null);
    setSelectedL5(null);
  };

  const handleSelectL4 = (nodeId: string) => {
    const node = selectedL3?.children?.find((c) => c.id === nodeId) || null;
    setSelectedL4(node);
    setSelectedL5(null);
  };

  const handleSelectL5 = (nodeId: string) => {
    const node = selectedL4?.children?.find((c) => c.id === nodeId) || null;
    setSelectedL5(node);
  };

  // Build full path string
  const pathParts = [
    selectedL1?.name || level1Search,
    selectedL2?.name,
    selectedL3?.name,
    selectedL4?.name,
    selectedL5?.name,
  ].filter(Boolean);

  const fullConceptText = pathParts.join(' > ');

  // Get highest defined price in selection chain
  const suggestedPrice =
    selectedL5?.price ||
    selectedL4?.price ||
    selectedL3?.price ||
    selectedL2?.price ||
    selectedL1?.price;

  const handleApply = () => {
    if (!fullConceptText.trim()) return;
    onApplyConcept(fullConceptText.trim(), suggestedPrice);
  };

  if (!variableTrees || variableTrees.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-neutral-950 border border-blue-500/30 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
              Árbol de Variables Exclusivo ({clientName})
            </h4>
            <p className="text-[11px] text-neutral-400">
              Escribe para autocompletar Nivel 1 y selecciona desplegables hasta Nivel 5.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-bold">
          5 Niveles Activos
        </span>
      </div>

      {/* Nivel 1 Input & Autocomplete */}
      <div className="relative space-y-1">
        <label className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center justify-between">
          <span>Nivel 1 (Escribe o busca variable principal):</span>
          {selectedL1 && <span className="text-emerald-400 font-mono text-[10px]">✓ Autocompletado</span>}
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={level1Search}
            onChange={(e) => {
              setLevel1Search(e.target.value);
              setShowL1Dropdown(true);
            }}
            onFocus={() => setShowL1Dropdown(true)}
            placeholder="Comienza a escribir Nivel 1 (ej. Mantenimiento, Instalación...)"
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-700 focus:border-blue-400 rounded-xl text-xs sm:text-sm font-bold text-white outline-none"
          />
        </div>

        {/* Level 1 Dropdown Suggestions */}
        {showL1Dropdown && level1Search && matchingL1Nodes.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1">
            {matchingL1Nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelectL1(node)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-500/20 text-neutral-200 hover:text-blue-200 text-xs font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>{node.name}</span>
                {node.children && node.children.length > 0 && (
                  <span className="text-[10px] text-blue-400/80 font-mono">
                    ({node.children.length} sub-variables)
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Level 2 Selector */}
      {selectedL1 && selectedL1.children && selectedL1.children.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-blue-400/40">
          <label className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider block">
            Nivel 2 (Selecciona sub-variable):
          </label>
          <select
            value={selectedL2?.id || ''}
            onChange={(e) => handleSelectL2(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-sky-400 rounded-xl text-xs sm:text-sm font-semibold text-sky-200 outline-none cursor-pointer"
          >
            <option value="">-- Seleccionar Nivel 2 --</option>
            {selectedL1.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.price ? `(€${c.price})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 3 Selector */}
      {selectedL2 && selectedL2.children && selectedL2.children.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-sky-400/40">
          <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            Nivel 3 (Selecciona detalle):
          </label>
          <select
            value={selectedL3?.id || ''}
            onChange={(e) => handleSelectL3(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-emerald-400 rounded-xl text-xs sm:text-sm font-semibold text-emerald-200 outline-none cursor-pointer"
          >
            <option value="">-- Seleccionar Nivel 3 --</option>
            {selectedL2.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.price ? `(€${c.price})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 4 Selector */}
      {selectedL3 && selectedL3.children && selectedL3.children.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-emerald-400/40">
          <label className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider block">
            Nivel 4 (Selecciona atributo):
          </label>
          <select
            value={selectedL4?.id || ''}
            onChange={(e) => handleSelectL4(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-purple-400 rounded-xl text-xs sm:text-sm font-semibold text-purple-200 outline-none cursor-pointer"
          >
            <option value="">-- Seleccionar Nivel 4 --</option>
            {selectedL3.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.price ? `(€${c.price})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 5 Selector */}
      {selectedL4 && selectedL4.children && selectedL4.children.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-purple-400/40">
          <label className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider block">
            Nivel 5 (Selecciona especificación final):
          </label>
          <select
            value={selectedL5?.id || ''}
            onChange={(e) => handleSelectL5(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-rose-400 rounded-xl text-xs sm:text-sm font-semibold text-rose-200 outline-none cursor-pointer"
          >
            <option value="">-- Seleccionar Nivel 5 --</option>
            {selectedL4.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.price ? `(€${c.price})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Live Concept Preview & Save Action */}
      {fullConceptText && (
        <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider block">
              Concepto Generado Dinámicamente:
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-white font-mono break-words">
              {fullConceptText}
            </p>
            {suggestedPrice ? (
              <p className="text-xs text-blue-300 font-mono font-bold">
                Precio sugerido para esta rama: €{suggestedPrice.toFixed(2)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Guardar / Aplicar Línea</span>
          </button>
        </div>
      )}
    </div>
  );
};
