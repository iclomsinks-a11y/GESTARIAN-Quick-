import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Check,
  Sparkles,
  Calculator,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';
import { ComplexBudgetVariant, VariantUnitType, InvoiceItem, ClientData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ComplexBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertItem: (item: InvoiceItem, client?: ClientData | null) => void;
  client?: ClientData | null;
}

// Preset templates
const PRESETS = [
  {
    id: 'cortinas',
    name: 'Cortinas & Confección Textil',
    badge: 'Ejemplo Solicitado',
    title: 'Confección e instalación de cortina a medida',
    variants: [
      { id: 'v1', name: 'Material / Tejido', value: 'Lino rústico arena', unitType: 'text' as VariantUnitType },
      { id: 'v2', name: 'Porcentaje de fruncido', value: '200', unitType: 'percent' as VariantUnitType },
      { id: 'v3', name: 'Código de fruncido', value: 'FR-04', unitType: 'text' as VariantUnitType },
      { id: 'v4', name: 'Metros lineales', value: '3.80', unitType: 'ml' as VariantUnitType },
      { id: 'v5', name: 'Superficie tela', value: '9.50', unitType: 'm2' as VariantUnitType },
      { id: 'v6', name: 'Tipo de confección', value: 'Onda perfecta con cinta técnica', unitType: 'text' as VariantUnitType },
    ],
    units: 1,
    unitPrice: 420.0,
  },
  {
    id: 'carpinteria',
    name: 'Carpintería & Cerramientos',
    badge: 'Medidas m² / ml',
    title: 'Fabricación y montaje de cerramiento de aluminio',
    variants: [
      { id: 'v1', name: 'Sistema de perfil', value: 'Aluminio lacado con RPT serie 70', unitType: 'text' as VariantUnitType },
      { id: 'v2', name: 'Metros lineales', value: '5.40', unitType: 'ml' as VariantUnitType },
      { id: 'v3', name: 'Superficie acristalada', value: '6.20', unitType: 'm2' as VariantUnitType },
      { id: 'v4', name: 'Vidrio / Acristalamiento', value: 'Climalit 4/16/4 bajo emisivo', unitType: 'text' as VariantUnitType },
      { id: 'v5', name: 'Color / Acabado', value: 'Gris Antracita RAL 7016', unitType: 'text' as VariantUnitType },
    ],
    units: 1,
    unitPrice: 1150.0,
  },
  {
    id: 'revestimiento',
    name: 'Pintura & Revestimientos',
    badge: 'Por m²',
    title: 'Suministro y aplicación de revestimiento continuo',
    variants: [
      { id: 'v1', name: 'Superficie a tratar', value: '85.00', unitType: 'm2' as VariantUnitType },
      { id: 'v2', name: 'Producto / Acabado', value: 'Microcemento bicomponente pulido', unitType: 'text' as VariantUnitType },
      { id: 'v3', name: 'Capas de aplicación', value: '3', unitType: 'units' as VariantUnitType },
      { id: 'v4', name: 'Código de color', value: 'Arena suave NCS S 1502-Y', unitType: 'text' as VariantUnitType },
    ],
    units: 85,
    unitPrice: 45.0,
  },
];

export const ComplexBudgetModal: React.FC<ComplexBudgetModalProps> = ({
  isOpen,
  onClose,
  onInsertItem,
  client,
}) => {
  const [conceptTitle, setConceptTitle] = useState(
    'Confección e instalación de cortina a medida'
  );
  const [variants, setVariants] = useState<ComplexBudgetVariant[]>([
    { id: 'v-1', name: 'Material / Tejido', value: 'Lino rústico arena', unitType: 'text' },
    { id: 'v-2', name: 'Porcentaje de fruncido', value: '200', unitType: 'percent' },
    { id: 'v-3', name: 'Código de fruncido', value: 'FR-04', unitType: 'text' },
    { id: 'v-4', name: 'Metros lineales', value: '3.80', unitType: 'ml' },
    { id: 'v-5', name: 'Superficie', value: '9.50', unitType: 'm2' },
    { id: 'v-6', name: 'Tipo de confección', value: 'Onda perfecta con cinta técnica', unitType: 'text' },
  ]);
  const [units, setUnits] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(420);

  if (!isOpen) return null;

  const totalCalculated = Math.round(units * unitPrice * 100) / 100;

  // Format single variant display text
  const formatVariantValue = (v: ComplexBudgetVariant): string => {
    if (!v.value) return '';
    switch (v.unitType) {
      case 'm2':
        return `${v.value} m²`;
      case 'ml':
        return `${v.value} ml`;
      case 'percent':
        return `${v.value}%`;
      case 'hours':
        return `${v.value} h`;
      case 'kg':
        return `${v.value} kg`;
      case 'units':
        return `${v.value} ud`;
      case 'custom':
        return `${v.value} ${v.customUnit || ''}`.trim();
      case 'text':
      default:
        return v.value;
    }
  };

  // Generate composite string for invoice concept
  const buildConceptText = (): string => {
    const parts = variants
      .filter((v) => v.name.trim() && v.value.trim())
      .map((v) => `${v.name.trim()}: ${formatVariantValue(v)}`);

    if (parts.length === 0) return conceptTitle.trim();
    return `${conceptTitle.trim()} — ${parts.join(' | ')}`;
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setConceptTitle(preset.title);
    setVariants(
      preset.variants.map((v) => ({
        id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: v.name,
        value: v.value,
        unitType: v.unitType,
      }))
    );
    setUnits(preset.units);
    setUnitPrice(preset.unitPrice);
  };

  const handleAddVariant = () => {
    const newV: ComplexBudgetVariant = {
      id: `v-${Date.now()}`,
      name: '',
      value: '',
      unitType: 'text',
    };
    setVariants([...variants, newV]);
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ComplexBudgetVariant,
    value: any
  ) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], [field]: value };
    setVariants(copy);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    const finalConcept = buildConceptText();
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      concept: finalConcept,
      units: units || 1,
      unitPrice: unitPrice || 0,
      total: totalCalculated,
      complexBudgetConfig: {
        conceptTitle,
        variants,
        units,
        unitPrice,
      },
    };
    onInsertItem(newItem, client);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-neutral-100">
                  Configurador de Factura Compleja
                </h2>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  Concepto Técnico
                </span>
                {client && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-400" />
                    <span>{client.name}</span>
                    <span className="font-mono text-[10px] opacity-75">({client.nif})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure partidas técnicas de factura con variantes avanzadas (materiales, fruncidos %, metros lineales ml, metros cuadrados m², acabados).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Presets Bar */}
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Plantillas Rápidas Preconfiguradas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => handleApplyPreset(pr)}
                  className="text-left p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-850 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-neutral-200 group-hover:text-amber-300">
                      {pr.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {pr.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">{pr.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Main Title of the Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Nombre principal del servicio / artículo base:
            </label>
            <input
              type="text"
              value={conceptTitle}
              onChange={(e) => setConceptTitle(e.target.value)}
              placeholder="Ej. Confección de cortina a medida"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Dynamic Variants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Variantes y Parámetros del Concepto ({variants.length})
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Al elegir unidades como <strong className="text-amber-300">m²</strong>, <strong className="text-amber-300">ml</strong> o <strong className="text-amber-300">%</strong>, el valor se añade automáticamente con su unidad oficial.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-amber-300 border border-neutral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Parámetro</span>
              </button>
            </div>

            {/* Variants List */}
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center gap-2.5"
                >
                  {/* Parameter Name */}
                  <div className="flex-1 min-w-[180px]">
                    <span className="text-[10px] text-neutral-500 block mb-0.5">Nombre del Parámetro</span>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                      placeholder="Ej. Porcentaje de fruncido, Metros lineales..."
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Unit Selector */}
                  <div className="w-full md:w-36">
                    <span className="text-[10px] text-neutral-500 block mb-0.5">Tipo de Unidad</span>
                    <select
                      value={v.unitType}
                      onChange={(e) => handleUpdateVariant(idx, 'unitType', e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                    >
                      <option value="text">Texto libre</option>
                      <option value="m2">m² (Metros cuadrados)</option>
                      <option value="ml">ml (Metros lineales)</option>
                      <option value="percent">% (Porcentaje)</option>
                      <option value="units">ud (Unidades)</option>
                      <option value="hours">h (Horas)</option>
                      <option value="kg">kg (Kilogramos)</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>

                  {/* Custom Unit Input if selected */}
                  {v.unitType === 'custom' && (
                    <div className="w-full md:w-24">
                      <span className="text-[10px] text-neutral-500 block mb-0.5">Unidad</span>
                      <input
                        type="text"
                        value={v.customUnit || ''}
                        onChange={(e) => handleUpdateVariant(idx, 'customUnit', e.target.value)}
                        placeholder="Ej. rollos"
                        className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* Parameter Value */}
                  <div className="flex-1 min-w-[160px]">
                    <span className="text-[10px] text-neutral-500 block mb-0.5">Valor</span>
                    <div className="relative flex items-center">
                      <input
                        type={v.unitType === 'text' ? 'text' : 'number'}
                        step="any"
                        value={v.value}
                        onChange={(e) => handleUpdateVariant(idx, 'value', e.target.value)}
                        placeholder={
                          v.unitType === 'm2'
                            ? 'Ej. 12.5'
                            : v.unitType === 'percent'
                            ? 'Ej. 200'
                            : v.unitType === 'ml'
                            ? 'Ej. 3.80'
                            : 'Valor del parámetro...'
                        }
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                      />
                      {/* Suffix unit indicator */}
                      {v.unitType !== 'text' && (
                        <span className="absolute right-2 text-xs font-mono font-bold text-amber-400 bg-neutral-800 px-1.5 py-0.5 rounded pointer-events-none">
                          {v.unitType === 'm2'
                            ? 'm²'
                            : v.unitType === 'ml'
                            ? 'ml'
                            : v.unitType === 'percent'
                            ? '%'
                            : v.unitType === 'hours'
                            ? 'h'
                            : v.unitType === 'kg'
                            ? 'kg'
                            : v.unitType === 'units'
                            ? 'ud'
                            : v.customUnit || ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 md:pt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                      title="Eliminar parámetro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Units Calculation */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Cantidad / Unidades de factura:
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={units}
                  onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
                  className="w-28 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Precio Unitario (€ sin IVA):
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400 pr-6"
                  />
                  <span className="absolute right-2 text-neutral-400 text-xs font-mono">€</span>
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-neutral-800 sm:pl-6 w-full sm:w-auto flex justify-between sm:block">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                Total Línea:
              </span>
              <span className="text-2xl font-black font-mono text-amber-400">
                {formatCurrency(totalCalculated)}
              </span>
            </div>
          </div>

          {/* Real-time formatted concept preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Vista Previa de la Línea en la Factura A4:
            </span>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-400/30 font-sans text-xs text-stone-200 leading-relaxed shadow-inner">
              <p className="font-semibold text-neutral-100">{buildConceptText()}</p>
              <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center gap-4 text-[11px] text-neutral-400 font-mono">
                <span>Unidades: {units}</span>
                <span>·</span>
                <span>Precio ud: {formatCurrency(unitPrice)}</span>
                <span>·</span>
                <span className="text-amber-400 font-bold">Total: {formatCurrency(totalCalculated)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer"
          >
            <span>
              {client
                ? `Generar Factura Compleja (${formatCurrency(totalCalculated)})`
                : `Insertar en Factura (${formatCurrency(totalCalculated)})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
