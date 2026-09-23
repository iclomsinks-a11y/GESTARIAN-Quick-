import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  ShieldCheck,
  LogOut,
  ArrowRight,
  RefreshCw,
  Info,
  X,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  authenticateWithDniAndEmail,
  loginWithGoogle,
  getDetectedGoogleAccount,
  isAppDownloadedOrStandalone,
  setAppDownloadedState,
  getSavedLoginCredentials,
  setRememberDevice,
  logoutAuthUser,
  formatDni,
} from '../utils/auth';

interface AccessScreenProps {
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  onClose?: () => void;
  onToast: (msg: string, type?: 'success' | 'info') => void;
  isModal?: boolean;
}

export const AccessScreen: React.FC<AccessScreenProps> = ({
  currentUser,
  onUserChange,
  onClose,
  onToast,
  isModal = false,
}) => {
  const savedCreds = getSavedLoginCredentials();
  const detectedGoogle = getDetectedGoogleAccount();

  const [name, setName] = useState<string>(() => currentUser?.name || savedCreds?.name || '');
  const [email, setEmail] = useState<string>(() => currentUser?.email || savedCreds?.email || (detectedGoogle?.email ?? ''));
  const [dniPassword, setDniPassword] = useState<string>(() => currentUser?.dni || savedCreds?.dni || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDeviceState] = useState<boolean>(() => currentUser?.rememberDevice ?? true);

  const [isDownloaded, setIsDownloaded] = useState<boolean>(() => isAppDownloadedOrStandalone());
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsDownloaded(true);
        setAppDownloadedState(true);
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsDownloaded(true);
        setAppDownloadedState(true);
        onToast('¡Aplicación descargada e instalada con éxito!', 'success');
      }
      setInstallPromptEvent(null);
    } else {
      // Mark as downloaded / show install modal guidance
      setIsDownloaded(true);
      setAppDownloadedState(true);
      setShowInstallInstructions(true);
      onToast('Modo aplicación descargada activado en este dispositivo', 'success');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!email.trim()) {
        throw new Error('Por favor, introduce tu dirección de correo electrónico.');
      }
      if (!dniPassword.trim()) {
        throw new Error('Por favor, introduce tu contraseña o DNI.');
      }

      const user = await authenticateWithDniAndEmail(
        name.trim() || email.split('@')[0],
        email.trim(),
        dniPassword.trim(),
        rememberDevice
      );

      onUserChange(user);

      if (rememberDevice && isDownloaded) {
        onToast(`¡Bienvenido ${user.name}! Datos guardados permanentemente para este dispositivo descargado.`);
      } else if (rememberDevice && !isDownloaded) {
        onToast(`Bienvenido ${user.name}. Descarga la app para no tener que volver a identificarte.`);
      } else {
        onToast(`Acceso correcto. Bienvenido ${user.name}.`);
      }

      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar las credenciales de acceso.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle(email || undefined, name || undefined, rememberDevice);
      onUserChange(user);
      onToast(`Acceso completado con Google: ${user.email}`);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al acceder con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRememberToggle = (checked: boolean) => {
    setRememberDeviceState(checked);
    if (currentUser) {
      setRememberDevice(checked);
      currentUser.rememberDevice = checked;
      onUserChange({ ...currentUser, rememberDevice: checked });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  const handleLogout = () => {
    logoutAuthUser();
    onUserChange(null);
    setName('');
    setEmail('');
    setDniPassword('');
    onToast('Has cerrado la sesión correctamente', 'info');
  };

  return (
    <div
      id="access-screen-container"
      className={`w-full max-w-lg mx-auto text-neutral-100 ${
        isModal ? '' : 'p-4 sm:p-8 flex flex-col justify-center min-h-[85vh]'
      }`}
    >
      <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle top amber glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        {/* Modal close button */}
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg mb-3">
            <span className="font-serif text-2xl font-bold tracking-wider text-amber-400">G</span>
          </div>
          <h1 className="text-xl font-bold tracking-wide text-neutral-100 flex items-center gap-1.5">
            GESTARIAN <span className="text-amber-400 font-light text-sm tracking-widest">Quick</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Pantalla de acceso con usuario, email y contraseña (DNI)
          </p>
        </div>

        {/* Downloaded App Detection Indicator */}
        <div className="mb-5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Estado del Dispositivo:
            </span>
            {isDownloaded ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Aplicación Descargada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Navegador Web
              </span>
            )}
          </div>

          {isDownloaded ? (
            <p className="text-emerald-400/90 text-[11px] leading-relaxed">
              ✓ Aplicación instalada en este dispositivo. Tus datos de acceso se guardarán automáticamente para no tener que volver a introducir contraseña ni email.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Para recordar tu contraseña (DNI) y email en nuevos accesos sin volver a escribirlos, descarga o instala la app en tu dispositivo.
              </p>
              <button
                type="button"
                id="btn-download-app-pwa"
                onClick={handleInstallApp}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar / Instalar Aplicación</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* If user is already authenticated */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Usuario Identificado</span>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
                  Activo
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  {currentUser.name}
                </p>
                <p className="text-xs text-neutral-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  {currentUser.email}
                </p>
                {currentUser.dni && (
                  <p className="text-xs text-neutral-400 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-neutral-500" />
                    DNI/NIF: <span className="font-mono text-neutral-300">{currentUser.dni}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Persistent Remember Toggle for current user */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-start gap-3">
              <input
                id="remember-device-toggle-active"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => handleSaveRememberToggle(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400/30 accent-amber-400 cursor-pointer"
              />
              <label htmlFor="remember-device-toggle-active" className="text-xs text-neutral-300 cursor-pointer leading-tight">
                <span className="font-medium block text-neutral-200">
                  Guardar datos para nuevos accesos desde este dispositivo
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  {isDownloaded
                    ? 'Activado: no tendrás que volver a introducir contraseña ni email al abrir la aplicación.'
                    : 'Se aplicará automáticamente al abrir desde la aplicación descargada.'}
                </span>
              </label>
            </div>

            {savedFeedback && (
              <p className="text-[11px] text-emerald-400 text-center font-medium animate-pulse">
                ✓ Preferencia de guardado actualizada correctamente.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                id="btn-continue-to-app"
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <span>Acceder a Facturación</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-logout-session"
                onClick={handleLogout}
                className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login / Registration Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Input Usuario */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nombre de Usuario o Razón Social
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="login-input-username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez / Empresa S.L."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-colors"
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Correo Electrónico <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  id="login-input-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-colors"
                />
              </div>
            </div>

            {/* Input Contraseña / DNI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-neutral-300">
                  Contraseña (DNI / NIF) <span className="text-amber-400">*</span>
                </label>
                <span className="text-[10px] text-neutral-500">Ej. 12345678Z</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-input-password-dni"
                  required
                  value={dniPassword}
                  onChange={(e) => setDniPassword(e.target.value)}
                  placeholder="Introduce tu DNI/NIF o clave"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-neutral-100 font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Guardar datos para nuevos accesos desde el mismo dispositivo */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-3">
              <input
                id="remember-device-login-checkbox"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDeviceState(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400/30 accent-amber-400 cursor-pointer"
              />
              <label htmlFor="remember-device-login-checkbox" className="text-xs text-neutral-300 cursor-pointer leading-tight">
                <span className="font-semibold text-neutral-100 block">
                  Guardar datos para nuevos accesos en este dispositivo
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Solo si se ha descargado la aplicación: evita volver a introducir la contraseña y el email en cada sesión.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando datos...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acceder a Gestil</span>
                </>
              )}
            </button>

            {/* Google alternative */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-neutral-500 uppercase tracking-widest">o</span>
                <div className="flex-grow border-t border-neutral-800"></div>
              </div>

              <button
                type="button"
                id="btn-login-google"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-xs text-neutral-300 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                  />
                </svg>
                <span>
                  {detectedGoogle?.email
                    ? `Acceder con Google (${detectedGoogle.email})`
                    : 'Acceder con Google'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Install instructions modal / popup guide */}
        {showInstallInstructions && (
          <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-amber-400/30 text-xs text-neutral-300 space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Cómo instalar en tu pantalla de inicio:
              </span>
              <button
                type="button"
                onClick={() => setShowInstallInstructions(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-4">
              <li><strong>Chrome / Android:</strong> Pulsa en el menú (⋮) y selecciona <em>«Añadir a la pantalla de inicio»</em> o <em>«Instalar aplicación»</em>.</li>
              <li><strong>Safari / iOS (iPhone/iPad):</strong> Pulsa el botón Compartir y elige <em>«Añadir a pantalla de inicio»</em>.</li>
              <li><strong>PC / Mac:</strong> Pulsa el icono de instalación ⊕ en la barra de direcciones del navegador.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
