import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Layers,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, LineasComplejasCliente, LineasNivel } from '../types';
import { saveClientToDb } from '../utils/database';

interface LineasComplejasModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
  onSaveClient: (updatedClient: ClientData) => void;
}

const generateId = () =>
  `lc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const LineasComplejasModal: React.FC<LineasComplejasModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaveClient,
}) => {
  // Lista de estructuras guardadas
  const [estructuras, setEstructuras] = useState<LineasComplejasCliente[]>([]);

  // Formulario: editando o creando
  const [editingId, setEditingId] = useState<string | null>(null);
  const [troncal, setTroncal] = useState('');
  const [niveles, setNiveles] = useState<LineasNivel[]>([
    { nombre_nivel: '', valores: [] },
  ]);
  const [tagInputs, setTagInputs] = useState<string[]>(['']);
  const [showForm, setShowForm] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      setEstructuras(client.lineasComplejas || []);
      resetForm();
      setShowForm(false);
    }
  }, [client, isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setTroncal('');
    setNiveles([{ nombre_nivel: '', valores: [] }]);
    setTagInputs(['']);
    setShowForm(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setTroncal('');
    setNiveles([{ nombre_nivel: '', valores: [] }]);
    setTagInputs(['']);
    setShowForm(true);
  };

  const handleEditEstructura = (est: LineasComplejasCliente) => {
    setEditingId(est.id);
    setTroncal(est.concepto_troncal);
    setNiveles(est.niveles.map((n) => ({ ...n, valores: [...n.valores] })));
    setTagInputs(est.niveles.map(() => ''));
    setShowForm(true);
  };

  const handleDeleteEstructura = (id: string) => {
    const updated = estructuras.filter((e) => e.id !== id);
    setEstructuras(updated);
    if (!client) return;
    const updatedClient: ClientData = { ...client, lineasComplejas: updated };
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);
  };

  // Gestión de niveles
  const handleAddNivel = () => {
    setNiveles([...niveles, { nombre_nivel: '', valores: [] }]);
    setTagInputs([...tagInputs, '']);
  };

  const handleRemoveNivel = (idx: number) => {
    setNiveles(niveles.filter((_, i) => i !== idx));
    setTagInputs(tagInputs.filter((_, i) => i !== idx));
  };

  const handleMoveNivelUp = (idx: number) => {
    if (idx === 0) return;
    const newNiveles = [...niveles];
    const newTagInputs = [...tagInputs];
    [newNiveles[idx - 1], newNiveles[idx]] = [newNiveles[idx], newNiveles[idx - 1]];
    [newTagInputs[idx - 1], newTagInputs[idx]] = [newTagInputs[idx], newTagInputs[idx - 1]];
    setNiveles(newNiveles);
    setTagInputs(newTagInputs);
  };

  const handleMoveNivelDown = (idx: number) => {
    if (idx === niveles.length - 1) return;
    const newNiveles = [...niveles];
    const newTagInputs = [...tagInputs];
    [newNiveles[idx + 1], newNiveles[idx]] = [newNiveles[idx], newNiveles[idx + 1]];
    [newTagInputs[idx + 1], newTagInputs[idx]] = [newTagInputs[idx], newTagInputs[idx + 1]];
    setNiveles(newNiveles);
    setTagInputs(newTagInputs);
  };

  const handleNivelNameChange = (idx: number, val: string) => {
    const updated = [...niveles];
    updated[idx] = { ...updated[idx], nombre_nivel: val };
    setNiveles(updated);
  };

  // Gestión de tags (valores del nivel)
  const handleTagInputChange = (nivelIdx: number, val: string) => {
    // Si el texto introducido contiene coma(s), procesamos inmediatamente
    if (val.includes(',')) {
      const parts = val.split(',');
      const trailing = parts.pop() || ''; // Lo que queda después de la última coma

      const newTags = parts
        .map((p) => p.replace(/,+$/, '').trim())
        .filter((p) => p.length > 0);

      if (newTags.length > 0) {
        setNiveles((prevNiveles) => {
          const updated = [...prevNiveles];
          const currentValores = updated[nivelIdx]?.valores || [];
          const existingSet = new Set(currentValores.map((v) => v.toLowerCase()));

          const uniqueToAdd: string[] = [];
          for (const tag of newTags) {
            if (!existingSet.has(tag.toLowerCase()) && !uniqueToAdd.some((u) => u.toLowerCase() === tag.toLowerCase())) {
              uniqueToAdd.push(tag);
            }
          }

          if (uniqueToAdd.length > 0) {
            updated[nivelIdx] = {
              ...updated[nivelIdx],
              valores: [...currentValores, ...uniqueToAdd],
            };
          }
          return updated;
        });
      }

      setTagInputs((prevInputs) => {
        const updated = [...prevInputs];
        updated[nivelIdx] = trailing;
        return updated;
      });
      return;
    }

    const updated = [...tagInputs];
    updated[nivelIdx] = val;
    setTagInputs(updated);
  };

  const handleTagInputKeyDown = (
    nivelIdx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const rawVal = tagInputs[nivelIdx] || '';
    const cleanVal = rawVal.replace(/,+$/, '').trim();

    if (e.key === ',' || e.code === 'Comma') {
      e.preventDefault();
      if (cleanVal) {
        addTagToNivel(nivelIdx, cleanVal);
      }
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      if (cleanVal) {
        e.preventDefault();
        addTagToNivel(nivelIdx, cleanVal);
      }
      return;
    }

    if (
      e.key === 'Backspace' &&
      !rawVal &&
      niveles[nivelIdx]?.valores.length > 0
    ) {
      removeTagFromNivel(nivelIdx, niveles[nivelIdx].valores.length - 1);
    }
  };

  const addTagToNivel = (nivelIdx: number, value: string) => {
    const clean = value.replace(/,+$/, '').trim();
    if (!clean) return;

    setNiveles((prevNiveles) => {
      const updated = [...prevNiveles];
      const currentValores = updated[nivelIdx]?.valores || [];
      const alreadyExists = currentValores.some(
        (v) => v.toLowerCase() === clean.toLowerCase()
      );
      if (alreadyExists) return prevNiveles;

      updated[nivelIdx] = {
        ...updated[nivelIdx],
        valores: [...currentValores, clean],
      };
      return updated;
    });

    setTagInputs((prevInputs) => {
      const updated = [...prevInputs];
      updated[nivelIdx] = '';
      return updated;
    });
  };

  const removeTagFromNivel = (nivelIdx: number, tagIdx: number) => {
    const updated = [...niveles];
    updated[nivelIdx] = {
      ...updated[nivelIdx],
      valores: updated[nivelIdx].valores.filter((_, i) => i !== tagIdx),
    };
    setNiveles(updated);
  };

  const handleSaveEstructura = () => {
    if (!client) return;
    if (!troncal.trim()) return;

    // Procesar cualquier valor pendiente en los inputs de tags antes de guardar
    const nivelesConTagsPendientes = niveles.map((nivel, idx) => {
      const pending = (tagInputs[idx] || '').replace(/,+$/, '').trim();
      const currentValores = [...nivel.valores];
      if (pending && !currentValores.some((v) => v.toLowerCase() === pending.toLowerCase())) {
        currentValores.push(pending);
      }
      return {
        ...nivel,
        nombre_nivel: nivel.nombre_nivel.trim(),
        valores: currentValores,
      };
    });

    const nivelesValidos = nivelesConTagsPendientes.filter(
      (n) => n.nombre_nivel.trim().length > 0 && n.valores.length > 0
    );
    if (nivelesValidos.length === 0) return;

    let nuevas: LineasComplejasCliente[];
    if (editingId) {
      nuevas = estructuras.map((e) =>
        e.id === editingId
          ? {
              ...e,
              concepto_troncal: troncal.trim(),
              niveles: nivelesValidos,
              updated_at: Date.now(),
            }
          : e
      );
    } else {
      const nueva: LineasComplejasCliente = {
        id: generateId(),
        cliente_id: client.id || '',
        concepto_troncal: troncal.trim(),
        niveles: nivelesValidos,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      nuevas = [...estructuras, nueva];
    }

    const updatedClient: ClientData = { ...client, lineasComplejas: nuevas };
    setEstructuras(nuevas);
    saveClientToDb(updatedClient);
    onSaveClient(updatedClient);

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
    resetForm();
  };

  if (!isOpen || !client) return null;

  const canSave =
    troncal.trim().length > 0 &&
    niveles.some((n, idx) => {
      const hasName = n.nombre_nivel.trim().length > 0;
      const hasValues = n.valores.length > 0 || (tagInputs[idx] && tagInputs[idx].trim().length > 0);
      return hasName && hasValues;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-amber-400" strokeWidth={1.8} />
            <div>
              <h2 className="text-sm font-bold text-neutral-100 leading-tight">
                Configurar Líneas Complejas
              </h2>
              <p className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                {client.name}
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Lista de estructuras existentes */}
          {estructuras.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Estructuras guardadas ({estructuras.length})
              </p>
              {estructuras.map((est) => (
                <div
                  key={est.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-300 leading-tight">
                      {est.concepto_troncal}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {est.niveles.map((n, ni) => (
                        <span
                          key={ni}
                          className="text-[10px] font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-full px-2 py-0.5"
                        >
                          {n.nombre_nivel}: {n.valores.slice(0, 3).join(', ')}
                          {n.valores.length > 3 ? `… +${n.valores.length - 3}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleEditEstructura(est)}
                      className="p-1.5 rounded-lg text-[#808080] hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                      style={{ color: '#808080' }}
                      title="Editar estructura"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#808080]" style={{ color: '#808080' }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEstructura(est.id)}
                      className="p-1.5 rounded-lg text-[#EF4444] hover:text-red-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      style={{ color: '#EF4444' }}
                      title="Eliminar estructura"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón nueva estructura (si no está mostrando el formulario) */}
          {!showForm && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="w-full py-3 rounded-xl border-2 border-dashed border-neutral-700 hover:border-amber-400/60 text-neutral-500 hover:text-amber-400 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva estructura de conceptos
            </button>
          )}

          {/* Formulario de creación/edición */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {editingId ? 'Editar estructura' : 'Nueva estructura'}
                  </p>

                  {/* Concepto Troncal */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Concepto Troncal
                    </label>
                    <input
                      type="text"
                      value={troncal}
                      onChange={(e) => setTroncal(e.target.value)}
                      placeholder="Ej: Cortina, Cojín, Alfombra…"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400/70 transition-colors"
                    />
                  </div>

                  {/* Niveles */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      Niveles de concepto
                    </label>

                    {niveles.map((nivel, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-3 space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-700 rounded-full px-2 py-0.5 shrink-0">
                            Nivel {idx + 1}
                          </span>
                          
                          <div className="flex flex-col gap-0.5 shrink-0 ml-0.5 mr-1">
                            <button
                              type="button"
                              onClick={() => handleMoveNivelUp(idx)}
                              disabled={idx === 0}
                              className={`p-0.5 rounded transition-colors ${idx === 0 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400 hover:text-white hover:bg-neutral-600 cursor-pointer'}`}
                              title="Subir nivel (Aparecerá antes)"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveNivelDown(idx)}
                              disabled={idx === niveles.length - 1}
                              className={`p-0.5 rounded transition-colors ${idx === niveles.length - 1 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400 hover:text-white hover:bg-neutral-600 cursor-pointer'}`}
                              title="Bajar nivel (Aparecerá después)"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={nivel.nombre_nivel}
                            onChange={(e) => handleNivelNameChange(idx, e.target.value)}
                            placeholder="Nombre del nivel (ej: Material, Tejido, Color)"
                            className="flex-1 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400/60 transition-colors"
                          />
                          {niveles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveNivel(idx)}
                              className="p-1 text-[#EF4444] hover:text-red-400 transition-colors cursor-pointer shrink-0"
                              style={{ color: '#EF4444' }}
                              title="Eliminar nivel"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" style={{ color: '#EF4444' }} />
                            </button>
                          )}
                        </div>

                        {/* Tags de valores */}
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-1.5 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-amber-400/80" />
                            <span>Valores del nivel (escribe y pulsa <strong className="text-amber-300 font-bold">coma ,</strong> o <strong className="text-amber-300 font-bold">Enter</strong> para añadir)</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-900 border border-neutral-700 rounded-lg min-h-[38px] focus-within:border-amber-400/60 transition-colors">
                            {nivel.valores.map((val, vi) => (
                              <span
                                key={vi}
                                className="inline-flex items-center gap-1 bg-amber-400/15 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-semibold px-2.5 py-0.5"
                              >
                                <span>{val}</span>
                                <button
                                  type="button"
                                  onClick={() => removeTagFromNivel(idx, vi)}
                                  className="text-amber-400/60 hover:text-rose-400 transition-colors cursor-pointer leading-none text-xs ml-0.5"
                                  title="Quitar valor"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <div className="flex-1 min-w-[120px] flex items-center gap-1">
                              <input
                                type="text"
                                value={tagInputs[idx] || ''}
                                onChange={(e) => handleTagInputChange(idx, e.target.value)}
                                onKeyDown={(e) => handleTagInputKeyDown(idx, e)}
                                onBlur={() => {
                                  if (tagInputs[idx]?.trim()) {
                                    addTagToNivel(idx, tagInputs[idx].trim());
                                  }
                                }}
                                placeholder={nivel.valores.length === 0 ? 'Escribe y pulsa coma (ej: Seda, Lino…)' : 'Añadir otro (pulsa coma ,)'}
                                className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
                              />
                              {tagInputs[idx]?.trim() ? (
                                <button
                                  type="button"
                                  onClick={() => addTagToNivel(idx, tagInputs[idx].trim())}
                                  className="p-1 rounded bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors cursor-pointer shrink-0 shadow-sm"
                                  title="Añadir valor"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddNivel}
                      className="w-full py-2 rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500 text-neutral-600 hover:text-neutral-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir nivel
                    </button>
                  </div>

                  {/* Acciones del formulario */}
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
                      onClick={handleSaveEstructura}
                      disabled={!canSave}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        canSave
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
                          Guardar estructura
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estado vacío */}
          {estructuras.length === 0 && !showForm && (
            <div className="text-center py-8 text-neutral-600">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Sin estructuras configuradas</p>
              <p className="text-xs mt-1">
                Crea la primera para poder usar "Línea Compleja" en la factura.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
