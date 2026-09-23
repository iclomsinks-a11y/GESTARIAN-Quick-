import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  X,
  Plus,
  Building,
  Check,
  Key,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReceivedInvoice } from '../types';
import {
  DetectedGmailInvoice,
  GmailScannerConfig,
  getGmailScannerConfig,
  saveGmailScannerConfig,
  getDetectedGmailInvoices,
  saveDetectedGmailInvoices,
  scanGmailForInvoices,
  scanGmailViaImap,
  testImapCredentials,
} from '../services/gmailInvoiceScannerService';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from '../services/googleAuthService';

interface GmailInvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportInvoice: (invoice: ReceivedInvoice) => void;
  onImportMultiple: (invoices: ReceivedInvoice[]) => void;
  showToast: (msg: string) => void;
  currentUserEmail?: string;
}

export const GmailInvoiceScannerModal: React.FC<GmailInvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  onImportInvoice,
  onImportMultiple,
  showToast,
  currentUserEmail,
}) => {
  const [config, setConfig] = useState<GmailScannerConfig>(getGmailScannerConfig());
  const [detectedInvoices, setDetectedInvoices] = useState<DetectedGmailInvoice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'imported' | 'settings'>('pending');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUserEmail, setConnectedUserEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // App Password state (16 digits)
  const [appEmail, setAppEmail] = useState(config.appPasswordEmail || currentUserEmail || '');
  const [appPass, setAppPass] = useState(config.appPassword || '');
  const [isTestingImap, setIsTestingImap] = useState(false);
  const [imapTestSuccess, setImapTestSuccess] = useState<boolean | null>(null);

  // Load state on open
  useEffect(() => {
    if (isOpen) {
      const cfg = getGmailScannerConfig(currentUserEmail);
      setConfig(cfg);
      setAppEmail(cfg.appPasswordEmail || currentUserEmail || '');
      setAppPass(cfg.appPassword || '');
      setDetectedInvoices(getDetectedGmailInvoices(currentUserEmail));
      checkConnection(cfg);
    }
  }, [isOpen, currentUserEmail]);

  const checkConnection = async (cfg = config) => {
    if (cfg.appPassword && cfg.appPasswordEmail) {
      setIsConnected(true);
      setConnectedUserEmail(cfg.appPasswordEmail);
      return;
    }
    const token = await getAccessToken();
    if (token) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  };

  const handleTestAndSaveAppPassword = async () => {
    if (!appEmail.trim()) {
      showToast('Introduce tu dirección de correo de Gmail');
      return;
    }
    if (!appPass.trim() || appPass.trim().replace(/\s+/g, '').length < 8) {
      showToast('Introduce la clave de aplicación de 16 caracteres de Google');
      return;
    }

    setIsTestingImap(true);
    setImapTestSuccess(null);
    try {
      const res = await testImapCredentials(appEmail.trim(), appPass.trim());
      if (res.success) {
        setImapTestSuccess(true);
        handleUpdateConfig({
          authMethod: 'app_password',
          appPasswordEmail: appEmail.trim(),
          appPassword: appPass.trim(),
        });
        setIsConnected(true);
        setConnectedUserEmail(appEmail.trim());
        showToast('✅ Conexión con Gmail verificada y guardada con éxito.');
      } else {
        setImapTestSuccess(false);
        showToast(res.error || 'No se pudo conectar. Verifica la clave de 16 letras.');
      }
    } catch (e: any) {
      setImapTestSuccess(false);
      showToast('Error al probar la conexión con Gmail.');
    } finally {
      setIsTestingImap(false);
    }
  };

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsConnected(true);
        setConnectedUserEmail(res.user.email || null);
        handleUpdateConfig({
          authMethod: 'oauth',
        });
        showToast(`Conectado exitosamente con ${res.user.email || 'Google'}`);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && !err?.message?.includes('popup-closed-by-user')) {
        showToast(err.message || 'Error al conectar con Google Gmail');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogle();
    handleUpdateConfig({
      appPassword: '',
      appPasswordEmail: '',
      authMethod: 'oauth',
    });
    setAppPass('');
    setIsConnected(false);
    setConnectedUserEmail(null);
    setImapTestSuccess(null);
    showToast('Sesión de correo desconectada.');
  };

  const handleTriggerScan = async () => {
    // 1. If App Password (16-char key) is configured, scan via IMAP
    if (config.appPassword && config.appPasswordEmail) {
      setIsScanning(true);
      setScanStatusText('Conectando a tu Gmail con clave de 16 caracteres...');

      const result = await scanGmailViaImap(
        config.appPasswordEmail,
        config.appPassword,
        (status, cur, tot) => {
          setScanStatusText(status);
          setScanProgress({ current: cur, total: tot });
        }
      );

      setIsScanning(false);
      setScanStatusText('');

      if (result.success) {
        const updated = getDetectedGmailInvoices();
        setDetectedInvoices(updated);
        if (result.detectedCount > 0) {
          showToast(`🎉 ¡Se encontraron ${result.detectedCount} nueva(s) factura(s) en tu correo!`);
          setActiveTab('pending');
        } else {
          showToast('No se encontraron nuevas facturas con adjuntos en tu bandeja de entrada.');
        }
      } else {
        showToast(`Error al rastrear: ${result.error}`);
      }
      return;
    }

    // 2. Otherwise scan via OAuth
    let token = await getAccessToken();
    if (!token) {
      // If neither is configured, jump to settings tab
      setActiveTab('settings');
      showToast('Configura tu clave de 16 caracteres o inicia sesión para rastrear tu correo.');
      return;
    }

    setIsScanning(true);
    setScanStatusText('Iniciando rastreador inteligente...');

    const result = await scanGmailForInvoices(token, (status, cur, tot) => {
      setScanStatusText(status);
      setScanProgress({ current: cur, total: tot });
    });

    setIsScanning(false);
    setScanStatusText('');

    if (result.success) {
      const updated = getDetectedGmailInvoices();
      setDetectedInvoices(updated);
      if (result.detectedCount > 0) {
        showToast(`🎉 ¡Se encontraron ${result.detectedCount} nueva(s) factura(s) en tu correo!`);
        setActiveTab('pending');
      } else {
        showToast('No se encontraron nuevas facturas pendientes en tu bandeja de entrada.');
      }
    } else {
      showToast(`Error al rastrear: ${result.error}`);
    }
  };

  const handleImportSingle = (item: DetectedGmailInvoice) => {
    onImportInvoice(item.invoiceData);

    const updated = detectedInvoices.map((inv) =>
      inv.id === item.id ? { ...inv, status: 'imported' as const } : inv
    );
    setDetectedInvoices(updated);
    saveDetectedGmailInvoices(updated, currentUserEmail);
    showToast(`Factura de "${item.invoiceData.supplierName}" añadida a Facturas Recibidas.`);
  };

  const handleImportAllPending = () => {
    const pending = detectedInvoices.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    const invoicesToImport = pending.map((i) => i.invoiceData);
    onImportMultiple(invoicesToImport);

    const updated = detectedInvoices.map((inv) =>
      inv.status === 'pending' ? { ...inv, status: 'imported' as const } : inv
    );
    setDetectedInvoices(updated);
    saveDetectedGmailInvoices(updated, currentUserEmail);
    showToast(`✅ ${invoicesToImport.length} facturas añadidas exitosamente.`);
  };

  const handleDismissItem = (id: string) => {
    const updated = detectedInvoices.filter((i) => i.id !== id);
    setDetectedInvoices(updated);
    saveDetectedGmailInvoices(updated, currentUserEmail);
    showToast('Elemento descartado del listado.');
  };

  const handleUpdateConfig = (updates: Partial<GmailScannerConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    saveGmailScannerConfig(next, currentUserEmail);
  };

  if (!isOpen) return null;

  const pendingList = detectedInvoices.filter((i) => i.status === 'pending');
  const importedList = detectedInvoices.filter((i) => i.status === 'imported');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Rastreador de Facturas en Gmail
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> IA OCR
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Detección automática de facturas recibidas y extracción de datos adjuntos (PDF / imagen)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-neutral-950/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Gmail Conectado</span>
                {connectedUserEmail && (
                  <span className="text-neutral-400 font-mono">({connectedUserEmail})</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Configura tu clave de 16 caracteres o cuenta de Gmail</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                Rastreo diario:{' '}
                <strong className="text-white">{config.scheduledTime} h</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="py-1 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Rastreando...' : 'Escanear ahora'}
            </button>
          </div>
        </div>

        {/* Scanning in progress banner */}
        {isScanning && (
          <div className="px-6 py-4 bg-amber-950/40 border-b border-amber-500/30 flex items-center gap-4 text-sm animate-pulse">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-200">{scanStatusText}</p>
              {scanProgress.total > 0 && (
                <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{
                      width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>Facturas Detectadas</span>
            {pendingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-neutral-950 font-black">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('imported')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'imported'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>Historial Importadas ({importedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>Conexión y Horario</span>
          </button>

          {activeTab === 'pending' && pendingList.length > 0 && (
            <div className="ml-auto pb-2">
              <button
                type="button"
                onClick={handleImportAllPending}
                className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Importar todas a Facturas Recibidas ({pendingList.length})
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingList.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-950/40">
                  <Mail className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-neutral-300">
                    No hay facturas pendientes de importar
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
                    Pulsa en <strong>"Escanear ahora"</strong> para rastrear tus correos recientes o configura tu clave de 16 caracteres de Google en la pestaña Conexión.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleTriggerScan}
                      disabled={isScanning}
                      className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow"
                    >
                      <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>{isScanning ? 'Rastreando...' : 'Escanear correo ahora'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Configurar Clave (16 dígitos)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingList.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-md space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.attachmentName}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {new Date(item.emailDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">
                            {item.invoiceData.supplierName || 'Proveedor'}
                          </h4>
                          <p className="text-xs text-neutral-400">
                            De: <span className="text-neutral-300 font-mono">{item.emailFrom}</span>
                          </p>
                          <p className="text-xs text-neutral-400">
                            Asunto: <span className="text-neutral-200">{item.emailSubject}</span>
                          </p>
                        </div>

                        <div className="text-right flex sm:flex-col justify-between sm:justify-start items-end gap-1 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                          <span className="text-xs text-neutral-400">Importe Total</span>
                          <span className="text-xl font-black text-amber-400 font-mono">
                            {item.invoiceData.totalAmount.toFixed(2)} €
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Base: {item.invoiceData.baseImponible.toFixed(2)} € + IVA {item.invoiceData.ivaRate}%
                          </span>
                        </div>
                      </div>

                      {/* Factura desglosada */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800 text-xs text-neutral-300">
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Nº Factura</span>
                          <span className="font-mono font-semibold">{item.invoiceData.invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">NIF/CIF</span>
                          <span className="font-mono font-semibold">{item.invoiceData.supplierCif || 'No especificado'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Fecha emisión</span>
                          <span>{item.invoiceData.date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-500 block">Categoría</span>
                          <span>{item.invoiceData.category || 'Suministros'}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-800">
                        <button
                          type="button"
                          onClick={() => handleDismissItem(item.id)}
                          className="py-1.5 px-3 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Descartar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleImportSingle(item)}
                          className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Importar a Facturas Recibidas</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'imported' && (
            <div className="space-y-4">
              {importedList.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No hay facturas importadas en el historial aún.
                </div>
              ) : (
                <div className="space-y-3">
                  {importedList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between text-xs text-neutral-300"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-white text-sm">
                            {item.invoiceData.supplierName} ({item.invoiceData.invoiceNumber})
                          </p>
                          <p className="text-neutral-400 text-xs">
                            Total: {item.invoiceData.totalAmount.toFixed(2)} € • {item.emailSubject}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 text-xs font-semibold border border-emerald-800/40">
                        Guardada en Recibidas
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* Opción A: Contraseña de Aplicación de 16 caracteres de Google */}
              <div className="bg-neutral-950 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Conexión Universal: Clave de Aplicación (16 letras de Google)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Recomendado • Sin bloqueos 403
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Google proporciona una <strong>contraseña de aplicación de 16 letras</strong> (como la que usaste en Excel) para que aplicaciones externas puedan leer tus correos de facturas de forma 100% segura sin requerir verificación de desarrollador OAuth.
                </p>

                {/* Form fields */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs text-neutral-300 font-semibold block mb-1">
                      Tu correo Gmail
                    </label>
                    <input
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="ejemplo: tu_correo@gmail.com"
                      className="w-full bg-neutral-900 border border-neutral-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-300 font-semibold block mb-1">
                      Contraseña de Aplicación de 16 caracteres
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={appPass}
                        onChange={(e) => setAppPass(e.target.value)}
                        placeholder="ej: abcd efgh ijkl mnop"
                        className="flex-1 bg-neutral-900 border border-neutral-700 text-amber-300 font-mono text-xs px-3.5 py-2.5 rounded-xl focus:border-amber-400 focus:outline-none tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleTestAndSaveAppPassword}
                        disabled={isTestingImap}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow"
                      >
                        {isTestingImap ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Probando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Verificar y Guardar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Test Feedback */}
                  {imapTestSuccess === true && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>¡Conexión verificada con éxito! Tu correo está listo para rastreo automático e instantáneo.</span>
                    </div>
                  )}

                  {/* Guía rápida de obtención */}
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 text-xs text-neutral-400">
                    <div className="flex items-center justify-between text-neutral-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        ¿Cómo obtener tu clave de 16 caracteres en 30 segundos?
                      </span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 underline"
                      >
                        <span>Abrir enlace de Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-300">
                      <li>Entra en <strong>myaccount.google.com/apppasswords</strong> (requiere tener verificación en 2 pasos activa en Google).</li>
                      <li>En "Nombre de la aplicación", escribe por ejemplo: <strong>Quick Gestarian</strong>.</li>
                      <li>Pulsa en <strong>Crear</strong> y Google te mostrará un código de 16 letras amarillas.</li>
                      <li>Copia ese código de 16 letras, pégalo en la casilla de arriba y pulsa <strong>Verificar y Guardar</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Programación horaria */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Programación del Rastreo Diario
                </h3>
                <p className="text-xs text-neutral-400">
                  Gestarian escaneará automáticamente tu correo en busca de facturas y recibos adjuntos a la hora elegida.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm text-neutral-300 font-medium">
                    Activar rastreo diario automático
                  </label>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="text-sm text-neutral-300 font-medium block">
                      Hora del rastreo diario
                    </label>
                    <span className="text-xs text-neutral-500">Por defecto 18:00 h</span>
                  </div>
                  <input
                    type="time"
                    value={config.scheduledTime}
                    onChange={(e) => handleUpdateConfig({ scheduledTime: e.target.value })}
                    className="bg-neutral-900 border border-neutral-700 text-white font-mono text-sm px-3 py-1.5 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opción B: OAuth */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-neutral-400" />
                  Alternativa: Acceso Directo con Google OAuth
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Permite iniciar sesión con la cuenta de Google vinculada como administradora del proyecto (<code>iclomsinks@gmail.com</code>).
                </p>

                <div className="pt-2 flex items-center gap-3">
                  {isConnected ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="py-2 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Desconectar cuenta actual
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleConnect}
                      disabled={isConnecting}
                      className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {isConnecting ? 'Conectando...' : 'Iniciar sesión con Google (OAuth)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            {config.lastScanDate
              ? `Último rastreo: ${new Date(config.lastScanTimestamp || 0).toLocaleString()}`
              : 'Aún no se ha realizado ningún rastreo'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
