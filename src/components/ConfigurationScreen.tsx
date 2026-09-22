import React, { useState, useRef } from 'react';
import {
  Building2,
  Sliders,
  ShieldCheck,
  Hash,
  Sparkles,
  Smartphone,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  ExternalLink,
  MessageCircle,
  Play,
  Flame,
  Wand2,
  Loader2,
  Database,
  History,
  Sun,
  Moon,
  Palette,
  Check,
  Bell,
  BellRing,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
  BellOff,
} from 'lucide-react';
import {
  CompanyData,
  ClientData,
  ProviderData,
  Invoice,
  ConceptHistoryItem,
  AuthUser,
  BillableProduct,
  AppTheme,
  ReceivedInvoice,
} from '../types';
import {
  getStoredWhatsAppDispatches,
  WhatsAppNotificationRecord,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  notifyVeriFactuVerificationSuccess,
  notifyPaymentDueDateUpcoming,
  checkAndNotifyUpcomingPayments,
  getBrowserNotificationLogs,
  BrowserNotificationLog,
} from '../services/notificationService';
import {
  generateLogoWithAI,
  SUGGESTED_LOGO_PROMPTS,
} from '../services/aiLogoService';
import { formatCurrency } from '../utils/formatters';

interface ConfigurationScreenProps {
  company: CompanyData;
  onSaveCompany: (data: CompanyData) => void;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  // Databases & Actions
  providers?: ProviderData[];
  onOpenProvidersDb?: () => void;
  clients?: ClientData[];
  onOpenClientsDb?: () => void;
  onOpenClientsSearch?: () => void;
  onOpenNewClientForm?: () => void;
  invoices?: Invoice[];
  onOpenInvoicesDb?: () => void;
  onOpenVeriFactuModal?: () => void;
  currentSequence?: number;
  onOpenConfigModal?: () => void;
  concepts?: ConceptHistoryItem[];
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onSaveDeviceData?: () => void;
  onGoToInvoice?: () => void;
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
  receivedInvoices?: ReceivedInvoice[];
}

export const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({
  company,
  onSaveCompany,
  currentTheme = 'dark',
  onSelectTheme,
  providers,
  onOpenProvidersDb,
  clients,
  onOpenClientsDb,
  onOpenClientsSearch,
  onOpenNewClientForm,
  invoices,
  onOpenInvoicesDb,
  onOpenVeriFactuModal,
  currentSequence = 1,
  onOpenConfigModal,
  concepts = [],
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
  receivedInvoices = [],
}) => {
  // Local state for full company editing
  const [formData, setFormData] = useState<CompanyData>({ ...company });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dispatches, setDispatches] = useState<WhatsAppNotificationRecord[]>(() => getStoredWhatsAppDispatches());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Browser Notifications state
  const [notifPermission, setNotifPermission] = useState<string>(() => getBrowserNotificationPermission());
  const [notifLogs, setNotifLogs] = useState<BrowserNotificationLog[]>(() => getBrowserNotificationLogs());
  const [testNotifFeedback, setTestNotifFeedback] = useState<string | null>(null);

  const handleEnableBrowserNotifications = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotifPermission(perm);
    setNotifLogs(getBrowserNotificationLogs());
    if (perm === 'granted') {
      setTestNotifFeedback('Notificaciones del navegador activadas con éxito.');
    } else if (perm === 'denied') {
      setTestNotifFeedback('El permiso fue denegado. Para activarlo, permite las notificaciones en la barra del navegador.');
    } else {
      setTestNotifFeedback('Permiso de notificaciones no configurado.');
    }
    setTimeout(() => setTestNotifFeedback(null), 4000);
  };

  const handleTestVeriFactuNotif = () => {
    notifyVeriFactuVerificationSuccess({
      invoiceNumber: currentInvoice?.number || 'F260001',
      clientName: currentInvoice?.client?.name || 'Cliente Prueba S.L.',
      totalAmount: 1250.00,
      chainHash: '8F9A2B3C4D5E6F70123456789ABCDEF0',
    });
    setNotifLogs(getBrowserNotificationLogs());
    setTestNotifFeedback('Notificación de Veri*Factu enviada al navegador.');
    setTimeout(() => setTestNotifFeedback(null), 3500);
  };

  const handleTestPaymentDueNotif = () => {
    notifyPaymentDueDateUpcoming({
      invoiceNumber: 'FAC-2026-0891',
      entityName: 'Construcciones y Reformas Ibérica S.A.',
      totalAmount: 2450.00,
      dueDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString('es-ES'),
      daysRemaining: 2,
      type: 'issued',
    });
    setNotifLogs(getBrowserNotificationLogs());
    setTestNotifFeedback('Notificación de Vencimiento de Pago enviada al navegador.');
    setTimeout(() => setTestNotifFeedback(null), 3500);
  };

  const handleScanUpcomingPayments = () => {
    const count = checkAndNotifyUpcomingPayments(invoices || [], receivedInvoices || [], true);
    setNotifLogs(getBrowserNotificationLogs());
    if (count > 0) {
      setTestNotifFeedback(`Se enviaron ${count} alerta(s) de vencimiento de cobro/pago al navegador.`);
    } else {
      setTestNotifFeedback('Escaneo completado: No se detectaron facturas con vencimiento próximo en los siguientes 3 días.');
    }
    setTimeout(() => setTestNotifFeedback(null), 4500);
  };

  // State for AI Logo Generation
  const [isAiLogoOpen, setIsAiLogoOpen] = useState(false);
  const [aiLogoPrompt, setAiLogoPrompt] = useState('');
  const [isAiLogoGenerating, setIsAiLogoGenerating] = useState(false);
  const [aiLogoError, setAiLogoError] = useState<string | null>(null);
  const [aiLogoSuccess, setAiLogoSuccess] = useState<string | null>(null);

  // Logo 3-second long press state
  const [logoPressTimer, setLogoPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLogoPressing, setIsLogoPressing] = useState(false);
  const [showLogoLongPressActions, setShowLogoLongPressActions] = useState(false);

  const handleLogoTouchStart = () => {
    setIsLogoPressing(true);
    const timer = setTimeout(() => {
      setIsLogoPressing(false);
      setShowLogoLongPressActions(true);
    }, 3000);
    setLogoPressTimer(timer);
  };

  const handleLogoTouchEnd = () => {
    if (logoPressTimer) {
      clearTimeout(logoPressTimer);
      setLogoPressTimer(null);
    }
    setIsLogoPressing(false);
  };

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
    <div className="min-h-full bg-neutral-950 text-neutral-100 pt-4 sm:pt-6 pb-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Encabezado limpio de la página de Configuración */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                CONFIGURACIÓN Y AJUSTES
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-light tracking-wide text-neutral-100 mt-1 uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              CONFIGURACIÓN <span className="text-neutral-500 font-normal">& AJUSTES</span>
            </h1>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 1 (LO PRIMERO): DATOS FISCALES DE LA EMPRESA & LOGOTIPO           */}
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
                      <div
                        onMouseDown={handleLogoTouchStart}
                        onMouseUp={handleLogoTouchEnd}
                        onMouseLeave={handleLogoTouchEnd}
                        onTouchStart={handleLogoTouchStart}
                        onTouchEnd={handleLogoTouchEnd}
                        onTouchCancel={handleLogoTouchEnd}
                        className={`w-36 h-36 rounded-2xl bg-white p-3 border ${
                          isLogoPressing ? 'border-amber-400 ring-4 ring-amber-400/30 scale-105' : 'border-neutral-300'
                        } shadow-xl flex items-center justify-center overflow-hidden relative transition-all cursor-pointer select-none`}
                        title="Mantén pulsado 3 segundos para editar o eliminar el logotipo"
                      >
                        <img
                          src={formData.logoUrl}
                          alt="Logo de Empresa"
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />

                        {isLogoPressing && (
                          <div className="absolute inset-0 bg-neutral-950/50 flex items-center justify-center backdrop-blur-[1px] transition-all animate-pulse">
                            <span className="text-[10px] font-bold text-amber-300 bg-neutral-900/90 px-2 py-1 rounded-lg border border-amber-400/40 text-center leading-tight">
                              Mantén 3s para opciones...
                            </span>
                          </div>
                        )}

                        {showLogoLongPressActions && (
                          <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-3 gap-2.5 z-20 animate-fadeIn">
                            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest text-center">
                              Logotipo
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLogoLongPressActions(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-transform active:scale-95 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Editar Logotipo</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLogoLongPressActions(false);
                                handleRemoveLogo();
                              }}
                              className="w-full py-1.5 px-3 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar Logotipo</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLogoLongPressActions(false);
                              }}
                              className="text-[10px] text-neutral-400 hover:text-white underline mt-0.5 cursor-pointer"
                            >
                              Cerrar
                            </button>
                          </div>
                        )}
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
        {/* SECCIÓN 2: TEMAS DE LA APLICACIÓN (Debajo de Guardar datos de la empresa) */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  APARIENCIA Y PERSONALIZACIÓN
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-100 mt-1">
                Selector de Tema de la Aplicación
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cambia el tema cromático en toda la aplicación (excepto la página de inicio que permanece intacta).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Opción 1: Tema Oscuro */}
            <button
              type="button"
              id="theme-btn-dark"
              onClick={() => onSelectTheme && onSelectTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                currentTheme === 'dark'
                  ? 'bg-neutral-950 border-amber-400 shadow-lg shadow-amber-400/10 ring-2 ring-amber-400/30'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tema Oscuro</h4>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">Carbón & Ámbar</span>
                  </div>
                </div>
                {currentTheme === 'dark' && (
                  <span className="p-1 rounded-full bg-amber-400 text-neutral-950 font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Apariencia original en tonos oscuros carbón, negro elegante y detalles dorados en ámbar.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                <span className="w-3.5 h-3.5 rounded-full bg-neutral-950 border border-neutral-700" />
                <span className="w-3.5 h-3.5 rounded-full bg-neutral-850 border border-neutral-700" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
              </div>
            </button>

            {/* Opción 2: Tema Claro */}
            <button
              type="button"
              id="theme-btn-light"
              onClick={() => onSelectTheme && onSelectTheme('light')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                currentTheme === 'light'
                  ? 'bg-white border-sky-500 text-neutral-900 shadow-lg shadow-sky-500/10 ring-2 ring-sky-400/30'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-600">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold uppercase tracking-wider ${currentTheme === 'light' ? 'text-neutral-900' : 'text-white'}`}>
                      Tema Claro
                    </h4>
                    <span className="text-[10px] text-sky-500 font-mono font-semibold">Blanco Hueso & Celeste</span>
                  </div>
                </div>
                {currentTheme === 'light' && (
                  <span className="p-1 rounded-full bg-sky-500 text-white font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${currentTheme === 'light' ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Fondo blanco, tarjetas blanco hueso, textos oscuros y líneas y botones en tonos azul y celeste.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#f8fafc] border border-neutral-300" />
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500" />
              </div>
            </button>

            {/* Opción 3: Tema Cobalto Tech */}
            <button
              type="button"
              id="theme-btn-indigo"
              onClick={() => onSelectTheme && onSelectTheme('indigo')}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                currentTheme === 'indigo'
                  ? 'bg-[#0b1120] border-cyan-400 shadow-lg shadow-cyan-400/10 ring-2 ring-cyan-400/30'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1e293b] border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cobalto Tech</h4>
                    <span className="text-[10px] text-cyan-400 font-mono font-semibold">Azul Noche & Cian</span>
                  </div>
                </div>
                {currentTheme === 'indigo' && (
                  <span className="p-1 rounded-full bg-cyan-400 text-neutral-950 font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Estilo marino tech en azul noche slate con contrastes en cian, índigo y esmeralda.
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0b1120] border border-neutral-700" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#1e293b] border border-neutral-700" />
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3: NOTIFICACIONES DEL NAVEGADOR (VERI*FACTU & VENCIMIENTO PAGOS)  */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  NOTIFICACIONES DEL NAVEGADOR
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-100 mt-1 flex items-center gap-2">
                Alertas en Pantalla (Veri*Factu & Vencimiento de Pagos)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Recibe alertas automáticas en tu escritorio o móvil cuando una factura sea verificada en la AEAT o cuando un cobro/pago esté próximo a vencer.
              </p>
            </div>

            {/* Badge de Estado del Permiso */}
            <div className="flex items-center gap-2 shrink-0">
              {notifPermission === 'granted' ? (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Permiso Concedido</span>
                </div>
              ) : notifPermission === 'denied' ? (
                <div className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <BellOff className="w-4 h-4 text-red-400" />
                  <span>Permiso Denegado</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-md">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Permiso Pendiente</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback temporal */}
          {testNotifFeedback && (
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{testNotifFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setTestNotifFeedback(null)}
                className="text-amber-400 hover:text-white font-bold text-sm"
              >
                ×
              </button>
            </div>
          )}

          {/* Grid de Controles de Notificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Control 1: Activar permiso */}
            <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Permiso del Navegador
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Habilita el permiso del sistema para recibir avisos nativos.
                </p>
              </div>
              <button
                type="button"
                id="btn-enable-browser-notifications"
                onClick={handleEnableBrowserNotifications}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <BellRing className="w-3.5 h-3.5 text-neutral-950" />
                <span>{notifPermission === 'granted' ? 'Revisar Permiso' : 'Activar Notificaciones'}</span>
              </button>
            </div>

            {/* Control 2: Probar Notificación Veri*Factu */}
            <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Alerta Veri*Factu
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Prueba la notificación nativa de verificación correcta en la AEAT.
                </p>
              </div>
              <button
                type="button"
                id="btn-test-verifactu-notification"
                onClick={handleTestVeriFactuNotif}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Probar Veri*Factu</span>
              </button>
            </div>

            {/* Control 3: Probar Notificación Vencimiento de Pago */}
            <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Alerta Vencimiento
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Prueba el aviso de facturas o pagos próximos a su fecha límite.
                </p>
              </div>
              <button
                type="button"
                id="btn-test-payment-due-notification"
                onClick={handleTestPaymentDueNotif}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Probar Vencimiento</span>
              </button>
            </div>

            {/* Control 4: Escanear todas las facturas y alertar */}
            <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Escanear Facturas
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Escanea cobros y pagos para enviar alertas de vencimientos en 3 días.
                </p>
              </div>
              <button
                type="button"
                id="btn-scan-upcoming-payments"
                onClick={handleScanUpcomingPayments}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Comprobar Facturas</span>
              </button>
            </div>
          </div>

          {/* Registro Histórico de Notificaciones Lanzadas */}
          {notifLogs.length > 0 && (
            <div className="pt-4 border-t border-neutral-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Historial de Notificaciones de Pantalla ({notifLogs.length})</span>
                </span>
                <span className="text-[10px] text-neutral-500">
                  Web Notifications API
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notifLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        {log.type === 'verifactu' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : log.type === 'payment_due' ? (
                          <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-sky-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{log.title}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{log.body}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 4: DETALLES TÉCNICOS Y CONEXIONES EN LA NUBE                       */}
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

        {/* ========================================================================= */}
        {/* SECCIÓN 4 (AL FINAL DE LA PÁGINA): AJUSTES DEL SISTEMA Y FISCALES           */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-4 border-t border-neutral-800/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Ajustes del Sistema y Fiscales</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Veri*Factu AEAT */}
            {onOpenVeriFactuModal && (
              <button
                type="button"
                id="config-btn-verifactu"
                onClick={onOpenVeriFactuModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-emerald-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Veri*Factu AEAT</span>
              </button>
            )}

            {/* Serie y Numeración */}
            {onOpenConfigModal && (
              <button
                type="button"
                id="config-btn-sequence"
                onClick={onOpenConfigModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Hash className="w-4 h-4 text-amber-400" />
                <span>Serie y Numeración</span>
              </button>
            )}

            {/* Sesión de Usuario */}
            {onOpenAuthModal && (
              <button
                type="button"
                id="config-btn-user-session"
                onClick={onOpenAuthModal}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-white font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="truncate">{currentUser ? currentUser.name : 'Sesión / Login'}</span>
              </button>
            )}

            {/* Guardar en Dispositivo */}
            {onSaveDeviceData && (
              <button
                type="button"
                id="config-btn-save-device"
                onClick={onSaveDeviceData}
                className="p-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 hover:border-amber-400/60 text-amber-300 font-semibold text-xs flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Guardar en Dispositivo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
