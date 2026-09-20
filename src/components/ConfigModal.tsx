import React, { useState, useRef } from 'react';
import {
  Building2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Upload,
  Trash2,
  Check,
  X,
  Database,
  RefreshCw,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { CompanyData, ConceptHistoryItem } from '../types';
import {
  loadConceptsMemory,
  deleteConceptFromMemory,
  clearConceptsMemory,
} from '../utils/conceptsMemory';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyData;
  onSaveCompany: (data: CompanyData) => void;
  currentSequence: number;
  onSaveSequence: (seq: number) => void;
  onConceptsUpdated: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  company,
  onSaveCompany,
  currentSequence,
  onSaveSequence,
  onConceptsUpdated,
}) => {
  const [formData, setFormData] = useState<CompanyData>({ ...company });
  const [sequence, setSequence] = useState<number>(currentSequence);
  const [concepts, setConcepts] = useState<ConceptHistoryItem[]>(loadConceptsMemory());
  const [activeTab, setActiveTab] = useState<'empresa' | 'conceptos' | 'facturacion'>('empresa');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El logotipo debe ser menor de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(formData);
    onSaveSequence(sequence);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleDeleteConcept = (text: string) => {
    const updated = deleteConceptFromMemory(text);
    setConcepts(updated);
    onConceptsUpdated();
  };

  const handleClearAllConcepts = () => {
    if (confirm('¿Estás seguro de borrar todo el historial de conceptos aprendidos?')) {
      clearConceptsMemory();
      setConcepts([]);
      onConceptsUpdated();
    }
  };

  return (
    <div
      id="config-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 no-print"
      onClick={onClose}
    >
      <div
        id="config-modal-container"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden text-neutral-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Configuración de la Empresa</h2>
              <p className="text-xs text-neutral-500">Datos fiscales y parámetros de facturación</p>
            </div>
          </div>
          <button
            id="close-config-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 px-6 gap-6 bg-white text-xs font-medium">
          <button
            id="tab-empresa-btn"
            type="button"
            onClick={() => setActiveTab('empresa')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'empresa'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Datos Fiscales del Emisor
          </button>
          <button
            id="tab-conceptos-btn"
            type="button"
            onClick={() => {
              setActiveTab('conceptos');
              setConcepts(loadConceptsMemory());
            }}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'conceptos'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Memoria de Conceptos ({concepts.length})
          </button>
          <button
            id="tab-facturacion-btn"
            type="button"
            onClick={() => setActiveTab('facturacion')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'facturacion'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Numeración y Cobro
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'empresa' && (
            <form id="company-config-form" onSubmit={handleSave} className="space-y-6">
              {/* Logo Section */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Logotipo de la Empresa (Editable en el membrete)
                </label>
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-neutral-300 bg-white flex items-center justify-center overflow-hidden relative group">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo emisor"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="text-center p-2 text-neutral-400">
                        <Upload className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
                        <span className="text-[10px] block">Sin logo</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-medium text-neutral-700 shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {formData.logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600 shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Quitar
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Recomendado: PNG o JPG con fondo transparente o blanco. Se colocará a la derecha de los datos de la empresa en la cabecera A4.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fiscal Mandatory Data */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                    Datos Obligatorios Fiscalmente
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Nombre de la Empresa o Razón Social *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej. Gestarian Solutions S.L."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      CIF / NIF de la Empresa *
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={formData.cif}
                        onChange={(e) => setFormData({ ...formData, cif: e.target.value.toUpperCase() })}
                        placeholder="Ej. B-88997766"
                        className="w-full pl-9 pr-3 py-2 text-sm uppercase font-mono border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Domicilio Fiscal *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ej. Calle Serrano 45, 28001 Madrid"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Contact Data for App Functions */}
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                    Datos de Contacto del Emisor
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Número de Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+34 912 345 678"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="facturacion@gestarian.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'conceptos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">
                    Memoria Inteligente de Conceptos
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Los conceptos introducidos en las facturas se guardan automáticamente para sugerirse al escribir.
                  </p>
                </div>
                {concepts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllConcepts}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar memoria
                  </button>
                )}
              </div>

              {concepts.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Database className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">Aún no hay conceptos almacenados.</p>
                  <p className="text-xs mt-1">Escribe en las líneas de la factura y se memorizarán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {concepts.map((item, idx) => (
                    <div
                      key={`${item.text}-${idx}`}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/70 hover:border-neutral-300 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[10px] text-neutral-400 w-5 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-neutral-800 truncate">{item.text}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-600 font-mono">
                          {item.count} {item.count === 1 ? 'uso' : 'usos'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteConcept(item.text)}
                          title="Eliminar de la memoria"
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'facturacion' && (
            <div className="space-y-6">
              {/* Correlative format explanation */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/60">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <p className="font-semibold">Numeración Correlativa Oficial</p>
                    <p>
                      Formato reglamentario: <strong>F</strong> + 2 dígitos del año en curso (
                      <strong>26</strong> para 2026) + 4 cifras correlativas desde el <strong>0000</strong>.
                    </p>
                    <p className="font-mono text-neutral-800 font-semibold pt-1">
                      Ejemplo actual: F26{Math.max(0, sequence).toString().padStart(4, '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Próximo Número Correlativo de Factura
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={sequence}
                      onChange={(e) => setSequence(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-xs text-neutral-500 font-mono">
                    → Resultará en: <strong>F26{sequence.toString().padStart(4, '0')}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Se incrementará automáticamente (+1) cada vez que pulses "Nueva Factura".
                </p>
              </div>

              {/* Bank Details */}
              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                  Datos de Pago Bancario (Pie de Factura)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Entidad Bancaria
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Ej. Banco Santander / BBVA / CaixaBank"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Número de Cuenta / IBAN
                    </label>
                    <input
                      type="text"
                      value={formData.iban || ''}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                      placeholder="ES00 0000 0000 0000 0000 0000"
                      className="w-full px-3 py-2 text-sm font-mono uppercase border border-neutral-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="save-company-config-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Configuración</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
