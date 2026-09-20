import React, { useState, useRef } from 'react';
import {
  Building2,
  Users,
  Search,
  UserPlus,
  History,
  Sliders,
  ShieldCheck,
  Hash,
  Sparkles,
  Smartphone,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileText,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  MessageCircle,
  Plus,
  Printer,
  Play,
  Flame,
  Send,
  Wand2,
  Loader2,
  Receipt,
  Package,
} from 'lucide-react';
import {
  CompanyData,
  ClientData,
  ProviderData,
  Invoice,
  ConceptHistoryItem,
  AuthUser,
  BillableProduct,
} from '../types';
import {
  getStoredWhatsAppDispatches,
  WhatsAppNotificationRecord,
} from '../services/notificationService';
import {
  generateLogoWithAI,
  SUGGESTED_LOGO_PROMPTS,
} from '../services/aiLogoService';
import { formatCurrency } from '../utils/formatters';

interface ConfigurationScreenProps {
  company: CompanyData;
  onSaveCompany: (data: CompanyData) => void;
  // Databases & Actions
  providers: ProviderData[];
  onOpenProvidersDb: () => void;
  clients: ClientData[];
  onOpenClientsDb: () => void;
  onOpenClientsSearch: () => void;
  onOpenNewClientForm: () => void;
  invoices: Invoice[];
  onOpenInvoicesDb: () => void;
  onOpenVeriFactuModal: () => void;
  onOpenComplexBudgetModal: () => void;
  currentSequence: number;
  onOpenConfigModal: () => void;
  concepts: ConceptHistoryItem[];
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSaveDeviceData: () => void;
  onGoToInvoice: () => void;
  onGoToReceivedInvoices?: () => void;
  receivedInvoicesCount?: number;
  products?: BillableProduct[];
  onOpenProductsDb?: () => void;
  // Actions relocated from header
  currentInvoice?: Invoice;
  onNewInvoice?: () => void;
  onPrintInvoice?: () => void;
  onReplaySplash?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenEmailModal?: () => void;
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({
  company,
  onSaveCompany,
  providers,
  onOpenProvidersDb,
  clients,
  onOpenClientsDb,
  onOpenClientsSearch,
  onOpenNewClientForm,
  invoices,
  onOpenInvoicesDb,
  onOpenVeriFactuModal,
  onOpenComplexBudgetModal,
  currentSequence,
  onOpenConfigModal,
  concepts,
  currentUser,
  onOpenAuthModal,
  onSaveDeviceData,
  onGoToInvoice,
  onGoToReceivedInvoices,
  receivedInvoicesCount = 0,
  products = [],
  onOpenProductsDb,
  currentInvoice,
  onNewInvoice,
  onPrintInvoice,
  onReplaySplash,
  onOpenWhatsAppModal,
  onOpenEmailModal,
}) => {
  // Local state for full company editing
  const [formData, setFormData] = useState<CompanyData>({ ...company });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dispatches, setDispatches] = useState<WhatsAppNotificationRecord[]>(() => getStoredWhatsAppDispatches());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for AI Logo Generation
  const [isAiLogoOpen, setIsAiLogoOpen] = useState(false);
  const [aiLogoPrompt, setAiLogoPrompt] = useState('');
  const [isAiLogoGenerating, setIsAiLogoGenerating] = useState(false);
  const [aiLogoError, setAiLogoError] = useState<string | null>(null);
  const [aiLogoSuccess, setAiLogoSuccess] = useState<string | null>(null);

  // Keep local state in sync if company changes outside
  React.useEffect(() => {
    setFormData({ ...company });
  }, [company]);

  // Periodically refresh dispatches
  React.useEffect(() => {
    setDispatches(getStoredWhatsAppDispatches());
  }, []);

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleTriggerAiLogoGeneration = async () => {
    if (!aiLogoPrompt.trim()) {
      setAiLogoError('Describe el tipo de logotipo que deseas antes de pulsar generar.');
      return;
    }

    setAiLogoError(null);
    setAiLogoSuccess(null);
    setIsAiLogoGenerating(true);

    try {
      const companyDisplayName = formData.name || company.name || 'Mi Empresa';
      const result = await generateLogoWithAI(aiLogoPrompt, companyDisplayName);

      if (result.success && result.imageUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: result.imageUrl }));
        setAiLogoSuccess('¡Logotipo generado con IA aplicado con éxito a tu empresa!');
        setIsAiLogoOpen(false);
      } else {
        setAiLogoError(result.error || 'No se pudo generar el logotipo con IA.');
      }
    } catch (err: any) {
      setAiLogoError(err?.message || 'Error inesperado generando el logotipo.');
    } finally {
      setIsAiLogoGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 py-6 sm:py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header with Navigation Link to Invoice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                PÁGINA 4 · CONFIGURACIÓN Y GESTIÓN
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-light tracking-wide text-neutral-100 mt-1 uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              PANEL DE CONTROL <span className="text-neutral-500 font-normal">& AJUSTES</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onGoToReceivedInvoices && (
              <button
                type="button"
                id="config-goto-received-invoices-btn"
                onClick={onGoToReceivedInvoices}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-200 font-bold text-xs transition-all border border-neutral-700 shadow-md active:scale-95 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Facturas Recibidas ({receivedInvoicesCount})</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}

            <button
              type="button"
              id="config-goto-invoice-btn"
              onClick={onGoToInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all shadow-lg hover:shadow-amber-400/20 active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Factura A4</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 1 (ARRIBA DEL TODO): LO QUE MÁS INTERESA AL USUARIO              */}
        {/* Botones sencillos sin explicación ninguna, solamente los que ejecutan la acción */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Bloque 1: Operaciones de Facturación */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Operaciones de Factura</span>
              </h2>
              {currentInvoice && (
                <span className="text-[11px] font-mono text-neutral-400">
                  Activa: <strong className="text-amber-400">{currentInvoice.number}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Nueva Factura */}
              <button
                type="button"
                id="config-btn-new-invoice"
                onClick={onNewInvoice}
                className="p-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Nueva Factura</span>
              </button>

              {/* 2. Ver Factura A4 */}
              <button
                type="button"
                id="config-btn-goto-invoice-action"
                onClick={onGoToInvoice}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Ver Factura A4</span>
              </button>

              {/* 3. Enviar por WhatsApp */}
              <button
                type="button"
                id="config-btn-whatsapp-invoice"
                onClick={onOpenWhatsAppModal}
                className="p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-[#25D366]/20 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Enviar WhatsApp</span>
              </button>

              {/* 4. Enviar por Email */}
              <button
                type="button"
                id="config-btn-email-invoice"
                onClick={onOpenEmailModal}
                className="p-3.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-sky-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar Email</span>
              </button>

              {/* 5. Imprimir / PDF */}
              <button
                type="button"
                id="config-btn-print-invoice"
                onClick={onPrintInvoice}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* Bloque 2: Bases de Datos y Registros */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Bases de Datos y Registros</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Facturas Emitidas */}
              <button
                type="button"
                id="config-btn-invoices-db"
                onClick={onOpenInvoicesDb}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center justify-between gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Facturas Emitidas</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {invoices.length}
                </span>
              </button>

              {/* Facturas Recibidas / Gastos */}
              {onGoToReceivedInvoices && (
                <button
                  type="button"
                  id="config-btn-received-invoices"
                  onClick={onGoToReceivedInvoices}
                  className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center justify-between gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Facturas Recibidas</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-neutral-950 bg-amber-400 px-2 py-0.5 rounded-full">
                    {receivedInvoicesCount}
                  </span>
                </button>
              )}

              {/* Base de Clientes */}
              <button
                type="button"
                id="config-btn-clients-db"
                onClick={onOpenClientsDb}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center justify-between gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Base de Clientes</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {clients.length}
                </span>
              </button>

              {/* + Nuevo Cliente */}
              <button
                type="button"
                id="config-btn-new-client"
                onClick={onOpenNewClientForm}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>+ Nuevo Cliente</span>
              </button>

              {/* Buscar Cliente */}
              <button
                type="button"
                id="config-btn-search-client"
                onClick={onOpenClientsSearch}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Buscar Cliente</span>
              </button>

              {/* Proveedores / Emisores */}
              <button
                type="button"
                id="config-btn-providers-db"
                onClick={onOpenProvidersDb}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center justify-between gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Proveedores / Emisores</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {providers.length}
                </span>
              </button>

              {/* Productos Facturables */}
              {onOpenProductsDb && (
                <button
                  type="button"
                  id="config-btn-products-db"
                  onClick={onOpenProductsDb}
                  className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center justify-between gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Productos Facturables</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {products.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Bloque 3: Herramientas Fiscales y Ajustes */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Herramientas Fiscales y Cuenta</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Factura Compleja */}
              <button
                type="button"
                id="config-btn-complex-invoice"
                onClick={onOpenComplexBudgetModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Factura Compleja (m²/ml)</span>
              </button>

              {/* Veri*Factu AEAT */}
              <button
                type="button"
                id="config-btn-verifactu"
                onClick={onOpenVeriFactuModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-emerald-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Veri*Factu AEAT</span>
              </button>

              {/* Serie y Numeración */}
              <button
                type="button"
                id="config-btn-sequence"
                onClick={onOpenConfigModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Hash className="w-4 h-4 text-amber-400" />
                <span>Serie y Numeración</span>
              </button>

              {/* Sesión de Usuario */}
              <button
                type="button"
                id="config-btn-user-session"
                onClick={onOpenAuthModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="truncate">{currentUser ? currentUser.name : 'Sesión / Login'}</span>
              </button>

              {/* Guardar en Dispositivo */}
              <button
                type="button"
                id="config-btn-save-device"
                onClick={onSaveDeviceData}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-amber-300 font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Guardar en Dispositivo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2 (EN MEDIO): DATOS FISCALES DE LA EMPRESA & LOGOTIPO             */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                DATOS FISCALES DEL EMISOR
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-0.5">
                Datos de la Empresa & Logotipo
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Estos datos se aplican de forma automática en todas las facturas A4 y documentos Veri*Factu oficiales.
              </p>
            </div>

            {savedSuccess && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Datos actualizados y sincronizados</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (2 Cols): Form Inputs */}
              <div className="lg:col-span-2 space-y-5">
                {/* Nombre / Razón Social */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Nombre Comercial o Razón Social <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="company-name-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej. Gestarian Construcciones S.L."
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* CIF/NIF y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      CIF / NIF / DNI <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        id="company-cif-input"
                        value={formData.cif}
                        onChange={(e) => handleInputChange('cif', e.target.value.toUpperCase())}
                        placeholder="B-12345678"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 uppercase transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="company-phone-input"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Ej. +34 914 556 789"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Email / Correo Electrónico */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Email / Correo Electrónico de la Empresa <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="company-email-input"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="administracion@tuempresa.es"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Dirección / Domicilio Fiscal */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Domicilio Fiscal Completo <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                    <textarea
                      id="company-address-input"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={2}
                      placeholder="Calle, número, código postal, localidad y provincia..."
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Datos Bancarios: IBAN y Banco */}
                <div className="pt-2 border-t border-neutral-800">
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Datos Bancarios para Cobro (Impresos en Factura)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 uppercase mb-1">
                        IBAN de la Cuenta
                      </label>
                      <input
                        type="text"
                        id="company-iban-input"
                        value={formData.iban || ''}
                        onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                        placeholder="ES76 2100 0418 4502 0005 1332"
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-xs font-mono font-bold text-amber-300 placeholder-neutral-500 focus:outline-none focus:border-amber-400 uppercase transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-400 uppercase mb-1">
                        Entidad Bancaria
                      </label>
                      <input
                        type="text"
                        id="company-bank-input"
                        value={formData.bankName || ''}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        placeholder="Ej. CaixaBank, Santander, BBVA..."
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (1 Col): Big Logo Management Box */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Logotipo Corporativo Oficial
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>IA Generativa</span>
                  </span>
                </div>

                {/* Banner de éxito al generar con IA */}
                {aiLogoSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{aiLogoSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiLogoSuccess(null)}
                      className="text-emerald-400 hover:text-white text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* CUADRO PRINCIPAL DEL LOGOTIPO */}
                <div className="p-5 rounded-2xl bg-neutral-950 border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center text-center relative group min-h-[280px]">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* VISTA 1: FORMULARIO INTERACTIVO PARA DESCRIBIR Y GENERAR LOGO CON IA */}
                  {isAiLogoOpen ? (
                    <div className="w-full text-left space-y-3 p-1">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                            <Wand2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                              Generar Logotipo con IA
                            </h4>
                            <p className="text-[10px] text-neutral-400">
                              Describe el diseño para {formData.name || 'tu empresa'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAiLogoOpen(false);
                            setAiLogoError(null);
                          }}
                          className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800"
                        >
                          Cerrar
                        </button>
                      </div>

                      {/* Input de descripción para la IA */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                          Instrucciones para el diseño del logotipo:
                        </label>
                        <textarea
                          id="ai-logo-prompt-input"
                          rows={3}
                          value={aiLogoPrompt}
                          onChange={(e) => setAiLogoPrompt(e.target.value)}
                          placeholder="Ej: Emblema minimalista geométrico en oro y gris pizarra, líneas elegantes, inicial estilizada, fondo blanco..."
                          disabled={isAiLogoGenerating}
                          className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Chips con sugerencias rápidas */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Ideas de estilo:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTED_LOGO_PROMPTS.slice(0, 3).map((promptText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAiLogoPrompt(promptText)}
                              disabled={isAiLogoGenerating}
                              className="text-[10px] px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-400/40 text-neutral-300 hover:text-amber-300 transition-colors text-left"
                            >
                              💡 {promptText.slice(0, 36)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mensaje de error si falla */}
                      {aiLogoError && (
                        <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-[11px] leading-tight">
                          {aiLogoError}
                        </div>
                      )}

                      {/* Botones de acción del formulario IA */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          id="submit-ai-logo-btn"
                          onClick={handleTriggerAiLogoGeneration}
                          disabled={isAiLogoGenerating || !aiLogoPrompt.trim()}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isAiLogoGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                              <span>Generando con IA...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-neutral-950" />
                              <span>Generar Logotipo</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAiLogoOpen(false);
                            setAiLogoError(null);
                          }}
                          disabled={isAiLogoGenerating}
                          className="py-2.5 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : formData.logoUrl ? (
                    /* VISTA 2: LOGO CARGADO (CON BOTÓN PARA GENERAR CON IA O CAMBIAR) */
                    <div className="w-full flex flex-col items-center space-y-4">
                      <div className="w-36 h-36 rounded-2xl bg-white p-3 border border-neutral-300 shadow-xl flex items-center justify-center overflow-hidden">
                        <img
                          src={formData.logoUrl}
                          alt="Logo de Empresa"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* Botón para generar con IA */}
                        <button
                          type="button"
                          id="btn-open-ai-logo-generator-replace"
                          onClick={() => {
                            setIsAiLogoOpen(true);
                            if (!aiLogoPrompt) {
                              setAiLogoPrompt(
                                `Logotipo elegante corporativo para ${formData.name || 'mi empresa'}, estilo minimalista con fondo blanco`
                              );
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-xs font-bold text-neutral-950 flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
                          <span>Generar con IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Subir Archivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-xs font-medium text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VISTA 3: CUADRO VACÍO - INCLUYE EL BOTÓN DESTACADO PARA GENERAR CON IA */
                    <div className="w-full flex flex-col items-center justify-center py-2 space-y-4">
                      {/* Sub-bloque 1: Botón prominente de generación con IA */}
                      <div className="w-full max-w-xs p-3.5 rounded-xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-400/40 space-y-2">
                        <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>¿No tienes logotipo?</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-snug">
                          Usa la IA generativa para diseñarlo en segundos con tus especificaciones.
                        </p>
                        <button
                          type="button"
                          id="btn-open-ai-logo-generator"
                          onClick={() => {
                            setIsAiLogoOpen(true);
                            if (!aiLogoPrompt) {
                              setAiLogoPrompt(
                                `Logotipo elegante corporativo para ${formData.name || 'mi empresa'}, estilo minimalista con fondo blanco`
                              );
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Wand2 className="w-4 h-4 text-neutral-950" />
                          <span>Generar logotipo con IA</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 w-full max-w-xs">
                        <div className="flex-1 h-px bg-neutral-800" />
                        <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">
                          o bien
                        </span>
                        <div className="flex-1 h-px bg-neutral-800" />
                      </div>

                      {/* Sub-bloque 2: Carga tradicional de archivo */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer flex flex-col items-center justify-center p-2 hover:scale-[1.02] transition-transform"
                      >
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300 mb-1.5 border border-neutral-700">
                          <Upload className="w-5 h-5 text-neutral-400" />
                        </div>
                        <span className="text-xs font-bold text-neutral-300">
                          Subir archivo desde tu dispositivo
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-0.5 max-w-[200px]">
                          PNG, JPG o SVG (máx. 2MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BIG SAVE BUTTON */}
            <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-400 text-center sm:text-left">
                Al pulsar guardar, los cambios se reflejarán instantáneamente en la hoja de factura activa y en la base de datos de proveedores.
              </div>

              <button
                type="submit"
                id="save-company-full-btn"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-400/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <Save className="w-5 h-5 text-neutral-950" />
                <span>Guardar Datos de la Empresa</span>
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3 (AL FINAL): DETALLES TÉCNICOS Y CONEXIONES EN LA NUBE            */}
        {/* Conexiones con Supabase, notificaciones.gestarian.com, Resend, Firebase... */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  SISTEMA Y CONEXIONES EN SEGUNDO PLANO
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-300 tracking-wide uppercase flex items-center gap-2 mt-0.5">
                <Database className="w-4 h-4 text-neutral-400" />
                <span>Detalles Técnicos y Conexiones en la Nube</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Conexiones técnicas con Supabase, notificaciones.gestarian.com, Resend, Firebase y registro de auditoría legal.
              </p>
            </div>

            {onReplaySplash && (
              <button
                type="button"
                id="btn-replay-splash-screen"
                onClick={onReplaySplash}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Portada Gestarian</span>
              </button>
            )}
          </div>

          {/* 4 Connected Services Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Service 1: WhatsApp Gateway */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-[9px] font-bold">
                  GATEWAY ACTIVO
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  notificaciones.gestarian.com
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Motor de mensajería Cloud para envío de facturas por WhatsApp con plantillas oficiales.
                </p>
              </div>
            </div>

            {/* Service 2: Supabase */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[9px]">
                  notificaciones_whatsapp
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Conexión Supabase
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Registro en tiempo real de cada mensaje, fecha, destinatario y confirmación de entrega.
                </p>
              </div>
            </div>

            {/* Service 3: Resend */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800/60 text-sky-300 font-mono text-[9px]">
                  EMAIL BACKUP
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Resend Email Dispatch
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Copia de seguridad y recibo digital enviado simultáneamente por correo electrónico.
                </p>
              </div>
            </div>

            {/* Service 4: Firebase */}
            <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/60 text-amber-300 font-mono text-[9px]">
                  TRAZABILIDAD
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Firebase Audit Trail
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Huella criptográfica SHA-256 encadenada de Veri*Factu para cumplimiento AEAT.
                </p>
              </div>
            </div>
          </div>

          {/* Historial Técnico de Envíos Realizados */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span>Historial de Envíos Registrados ({dispatches.length})</span>
              </span>
              <span className="text-[10px] text-neutral-500">
                Sincronizado con Supabase & Firebase
              </span>
            </div>

            {dispatches.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">
                No hay envíos registrados en el log del sistema todavía.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/80">
                {dispatches.slice(0, 5).map((disp) => (
                  <div key={disp.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                        <MessageCircle className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{disp.invoiceNumber}</span>
                          <span className="text-neutral-400 font-mono text-[11px]">{disp.recipientPhone}</span>
                          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono text-[9px]">
                            {disp.status === 'delivered' ? 'Entregado' : 'Enviado'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 block">
                          Destinatario: {disp.recipientName || 'Cliente'} · {new Date(disp.createdAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-mono font-bold text-neutral-300">
                        {formatCurrency(disp.totalAmount)}
                      </span>
                      <a
                        href={disp.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                        title="Abrir mensaje"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memoria de conceptos y estado de sincronización */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/60">
            <span>Memoria inteligente: <strong>{concepts.length} conceptos aprendidos</strong></span>
            <span>Secuencia actual: <strong>Nº {currentSequence}</strong></span>
            <span>Motor: Gestarian Core 4.2 · Veri*Factu AEAT Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
