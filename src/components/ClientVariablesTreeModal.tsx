import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Sliders,
  ChevronRight,
  Sparkles,
  Layers,
  FolderTree,
  Check,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, ClientConceptVariableNode } from '../types';

interface ClientVariablesTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: ClientData | null;
  onSaveClient: (updatedClient: ClientData) => void;
}

const MAX_CHILDREN_PER_NODE = 5;
const MAX_DEPTH_LEVEL = 5;

// Color badges according to level depth
const LEVEL_BADGES = [
  { level: 1, label: 'Nivel 1 (Principal)', color: 'bg-amber-400/20 text-amber-300 border-amber-400/40' },
  { level: 2, label: 'Nivel 2 (Sub-variable)', color: 'bg-sky-400/20 text-sky-300 border-sky-400/40' },
  { level: 3, label: 'Nivel 3 (Detalle)', color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40' },
  { level: 4, label: 'Nivel 4 (Atributo)', color: 'bg-purple-400/20 text-purple-300 border-purple-400/40' },
  { level: 5, label: 'Nivel 5 (Especificación)', color: 'bg-rose-400/20 text-rose-300 border-rose-400/40' },
];

export const ClientVariablesTreeModal: React.FC<ClientVariablesTreeModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaveClient,
}) => {
  const [trees, setTrees] = useState<ClientConceptVariableNode[]>([]);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  React.useEffect(() => {
    if (client) {
      setTrees(
        client.variableTrees && client.variableTrees.length > 0
          ? client.variableTrees
          : [
              {
                id: `node-${Date.now()}-1`,
                name: '',
                children: [],
              },
            ]
      );
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  // Helper to add a new Root Level 1 Node
  const handleAddRootNode = () => {
    const newNode: ClientConceptVariableNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      children: [],
    };
    setTrees([...trees, newNode]);
  };

  // Helper to update a node's property by traversing the tree recursively
  const updateNodeInTree = (
    nodeList: ClientConceptVariableNode[],
    targetId: string,
    updater: (node: ClientConceptVariableNode) => ClientConceptVariableNode
  ): ClientConceptVariableNode[] => {
    return nodeList.map((node) => {
      if (node.id === targetId) {
        return updater(node);
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, targetId, updater),
        };
      }
      return node;
    });
  };

  // Helper to delete a node by ID recursively
  const deleteNodeFromTree = (
    nodeList: ClientConceptVariableNode[],
    targetId: string
  ): ClientConceptVariableNode[] => {
    return nodeList
      .filter((node) => node.id !== targetId)
      .map((node) => ({
        ...node,
        children: node.children ? deleteNodeFromTree(node.children, targetId) : [],
      }));
  };

  // Add child variable (up to 5 maximum) to a parent node
  const handleAddChildVariable = (parentId: string) => {
    setTrees((prev) =>
      updateNodeInTree(prev, parentId, (node) => {
        const currentChildren = node.children || [];
        if (currentChildren.length >= MAX_CHILDREN_PER_NODE) return node;

        const newChild: ClientConceptVariableNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: '',
          children: [],
        };
        return {
          ...node,
          children: [...currentChildren, newChild],
        };
      })
    );
  };

  // Update node name or price
  const handleUpdateNodeField = (
    id: string,
    field: 'name' | 'price',
    value: string | number
  ) => {
    setTrees((prev) =>
      updateNodeInTree(prev, id, (node) => ({
        ...node,
        [field]: value,
      }))
    );
  };

  // Save structure to client
  const handleSaveTree = () => {
    // Filter out completely empty roots if user left blank entries
    const cleanTrees = trees.filter((t) => t.name.trim() !== '' || (t.children && t.children.length > 0));

    const updatedClient: ClientData = {
      ...client,
      enableComplexInvoice: true,
      variableTrees: cleanTrees.length > 0 ? cleanTrees : trees,
    };

    onSaveClient(updatedClient);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 1200);
  };

  // Load a rich sample tree for testing
  const handleLoadSamplePreset = () => {
    const sampleTree: ClientConceptVariableNode[] = [
      {
        id: 'sample-1',
        name: 'Instalación Climatización',
        children: [
          {
            id: 'sample-1-1',
            name: 'Bomba de Calor Inverter',
            children: [
              {
                id: 'sample-1-1-1',
                name: 'Potencia 3.5 kW (Conductos)',
                children: [
                  {
                    id: 'sample-1-1-1-1',
                    name: 'Zonificación Airzone 4 Rejillas',
                    children: [
                      { id: 'sample-1-1-1-1-1', name: 'Garantía Extendida 5 Años', price: 1850 },
                      { id: 'sample-1-1-1-1-2', name: 'Mantenimiento Anual Incluido', price: 2100 },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'sample-1-2',
            name: 'Split Pared Multisplit',
            children: [
              {
                id: 'sample-1-2-1',
                name: 'Unidad Exterior 2x1 5.0 kW',
                children: [
                  { id: 'sample-1-2-1-1', name: 'Instalación Básica hasta 5 metros', price: 1250 },
                ],
              },
            ],
          },
        ],
      },
    ];
    setTrees(sampleTree);
  };

  // Recursive Node Item Component
  const TreeNodeItem: React.FC<{
    node: ClientConceptVariableNode;
    depth: number; // 1 to 5
  }> = ({ node, depth }) => {
    const currentChildren = node.children || [];
    const canAddChild = depth < MAX_DEPTH_LEVEL && currentChildren.length < MAX_CHILDREN_PER_NODE;
    const badgeInfo = LEVEL_BADGES[depth - 1] || LEVEL_BADGES[4];

    return (
      <div className="relative space-y-3 pl-3 sm:pl-5 border-l-2 border-neutral-800 hover:border-amber-400/40 transition-colors my-2">
        <div className="flex flex-wrap items-center gap-2 bg-neutral-900/90 border border-neutral-800 focus-within:border-amber-400/80 p-2.5 sm:p-3 rounded-2xl transition-all">
          {/* Depth Badge Indicator */}
          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border ${badgeInfo.color}`}
          >
            Nivel {depth}
          </span>

          {/* Input Variable Name */}
          <input
            type="text"
            value={node.name}
            onChange={(e) => handleUpdateNodeField(node.id, 'name', e.target.value)}
            placeholder={`Escribe variable Nivel ${depth} (ej: ${
              depth === 1
                ? 'Mantenimiento'
                : depth === 2
                ? 'Servidores'
                : depth === 3
                ? 'Mensual'
                : depth === 4
                ? 'Sede Central'
                : 'Servicio 24/7'
            })`}
            className="flex-1 min-w-[180px] bg-neutral-950/80 border border-neutral-800 focus:border-amber-400 text-white font-medium text-xs sm:text-sm rounded-xl px-3 py-2 outline-none transition-all placeholder:text-neutral-600"
          />

          {/* Optional Price Input */}
          <div className="flex items-center gap-1 bg-neutral-950/80 border border-neutral-800 rounded-xl px-2.5 py-1.5 shrink-0">
            <span className="text-[11px] font-mono text-amber-400 font-bold">€</span>
            <input
              type="number"
              step="0.01"
              value={node.price ?? ''}
              onChange={(e) =>
                handleUpdateNodeField(
                  node.id,
                  'price',
                  e.target.value ? parseFloat(e.target.value) : 0
                )
              }
              placeholder="Precio (€)"
              className="w-20 bg-transparent text-amber-300 font-mono text-xs font-bold outline-none placeholder:text-neutral-600"
            />
          </div>

          {/* Button "Variables" (+ Add Child) - Only available up to Level 4 -> Level 5 */}
          {depth < MAX_DEPTH_LEVEL && (
            <button
              type="button"
              onClick={() => handleAddChildVariable(node.id)}
              disabled={!canAddChild}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                canAddChild
                  ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 active:scale-95'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
              }`}
              title={
                canAddChild
                  ? `Añadir sub-variable de Nivel ${depth + 1} (Máximo 5)`
                  : 'Máximo 5 sub-variables alcanzado para este nivel'
              }
            >
              <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Variables ({currentChildren.length}/5)</span>
            </button>
          )}

          {/* Delete Node Button */}
          <button
            type="button"
            onClick={() => setTrees((prev) => deleteNodeFromTree(prev, node.id))}
            className="p-1.5 rounded-xl bg-neutral-950 hover:bg-rose-950/60 text-neutral-500 hover:text-rose-400 border border-neutral-800 transition-colors cursor-pointer"
            title="Eliminar variable"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Render Child Nodes Recursively */}
        {currentChildren.length > 0 && (
          <div className="space-y-2 mt-2">
            {currentChildren.map((child) => (
              <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <FolderTree className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                  Árbol Exclusivo de Cliente
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-white">
                Variables de Factura Compleja — {client.name}
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Configura hasta 5 niveles jerárquicos de variables para autocompletar conceptos de este cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* Quick Preset / Tips Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/80 border border-amber-400/20 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Crea tus datos en el input y pulsa <strong>"Variables"</strong> para desplegar hasta 5 sub-variables por nivel (hasta 5 niveles de profundidad).
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadSamplePreset}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-neutral-700 transition-all cursor-pointer"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Cargar Plantilla Ejemplo</span>
            </button>
          </div>

          {/* Tree Nodes Renderer */}
          <div className="space-y-4">
            {trees.map((rootNode) => (
              <TreeNodeItem key={rootNode.id} node={rootNode} depth={1} />
            ))}
          </div>

          {/* Button Add New Level 1 Root Variable */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddRootNode}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-amber-400/60 bg-neutral-900/40 hover:bg-neutral-900 text-neutral-300 hover:text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Añadir Nueva Variable Principal (Nivel 1)</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 font-medium">
            Al guardar, estas variables estarán disponibles al facturar a <strong className="text-neutral-200">{client.name}</strong>.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveTree}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/10 transition-all active:scale-95 cursor-pointer"
            >
              {showSavedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />
                  <span>¡Estructura Guardada!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Guardar Estructura / Línea</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
