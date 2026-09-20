import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  LogOut,
  Save,
  Check,
  Sparkles,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getDetectedGoogleAccount,
  setRememberDevice,
  logoutAuthUser,
} from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onToast,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(currentUser ? 'login' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDeviceState] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedDataFeedback, setSavedDataFeedback] = useState(false);

  const detectedGoogle = getDetectedGoogleAccount();

  if (!isOpen) return null;

  const handleGoogleLogin = async (specificEmail?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle(specificEmail, undefined, rememberDevice);
      onUserChange(user);
      onToast(`Sesión iniciada con Google: ${user.email}`);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al conectar con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (tab === 'register') {
        if (!email || !password) {
          throw new Error('Por favor completa el email y la contraseña.');
        }
        const user = await registerWithEmail(name, email, password, rememberDevice);
        onUserChange(user);
        onToast(`¡Registro completado con éxito! Bienvenido, ${user.name}`);
        onClose();
      } else {
        if (!email || !password) {
          throw new Error('Por favor ingresa tu email y contraseña.');
        }
        const user = await loginWithEmail(email, password, rememberDevice);
        onUserChange(user);
        onToast(`Sesión iniciada como ${user.name}`);
        onClose();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error durante la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplicitSaveData = () => {
    if (currentUser) {
      setRememberDevice(true);
      currentUser.rememberDevice = true;
      onUserChange({ ...currentUser, rememberDevice: true });
      setSavedDataFeedback(true);
      onToast('Datos guardados en este dispositivo. No volverás a tener que identificarte.');
      setTimeout(() => setSavedDataFeedback(false), 3000);
    }
  };

  const handleLogout = () => {
    logoutAuthUser();
    onUserChange(null);
    onToast('Sesión cerrada correctamente', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-md shadow-2xl my-8 overflow-hidden text-neutral-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                {currentUser ? 'Cuenta de Usuario' : 'Acceso a Gestarian Quick'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {currentUser ? 'Gestión de sesión y recordatorio en este equipo' : 'Inicia sesión o regístrate para sincronizar datos'}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {currentUser ? (
            /* Logged in view */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3.5">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full border border-amber-400/30 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                  <p className="text-xs text-neutral-400 truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      {currentUser.provider === 'google' ? 'Cuenta Google' : 'Email'}
                    </span>
                    {currentUser.rememberDevice && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Dispositivo Recordado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón explícito: "GUARDAR DATOS PARA NO TENER QUE VOLVER A LOGUEARSE" */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Guardar datos en este dispositivo</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-snug">
                  Pulsa el botón inferior para confirmar que no deseas volver a introducir tu contraseña en este navegador.
                </p>
                <button
                  type="button"
                  id="modal-save-device-data-btn"
                  onClick={handleExplicitSaveData}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  {savedDataFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-neutral-950" />
                      <span>¡Datos Guardados en este Equipo!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Datos en este Dispositivo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 text-neutral-300 border border-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión / Olvidar Dispositivo</span>
              </button>
            </div>
          ) : (
            /* Not logged in view */
            <div className="space-y-4">
              {/* Google 1-Click with detected account */}
              {detectedGoogle && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/40 transition-colors space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Cuenta Google detectada en este navegador</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.97 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-neutral-200 truncate">
                        {detectedGoogle.email}
                      </span>
                    </div>

                    <button
                      type="button"
                      id="modal-enter-google-detected-btn"
                      onClick={() => handleGoogleLogin(detectedGoogle.email)}
                      disabled={isLoading}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-neutral-950 font-bold text-xs transition-colors shadow-sm active:scale-95"
                    >
                      Entrar Directamente
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Google Login Button if not already chosen */}
              <button
                type="button"
                id="modal-google-btn"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-700 hover:border-neutral-500 text-stone-100 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.97 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continuar con Cuenta de Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-neutral-800 flex-1" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  O con correo electrónico
                </span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              {/* Tabs for Login vs Register */}
              <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    tab === 'login'
                      ? 'bg-neutral-800 text-amber-300 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    tab === 'register'
                      ? 'bg-neutral-800 text-amber-300 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {errorMessage && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs">
                    {errorMessage}
                  </div>
                )}

                {tab === 'register' && (
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">
                      Nombre o Razón Social
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez o Mi Empresa S.L."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Checkbox: Guardar datos en este dispositivo */}
                <label className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-950/60 border border-neutral-800 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDeviceState(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-[11px]">
                    <span className="text-neutral-200 font-semibold group-hover:text-amber-300 transition-colors">
                      Guardar datos en este dispositivo
                    </span>
                    <p className="text-neutral-400 text-[10px] leading-tight">
                      No volver a pedir login. Acceso directo en tus próximas sesiones.
                    </p>
                  </div>
                </label>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isLoading
                    ? 'Procesando...'
                    : tab === 'register'
                    ? 'Crear Cuenta y Guardar Datos'
                    : 'Iniciar Sesión'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
