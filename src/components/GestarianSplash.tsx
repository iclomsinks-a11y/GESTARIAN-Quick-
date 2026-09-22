import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Save,
  Check,
  CheckCircle2,
  Smartphone,
  LogOut,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  getDetectedGoogleAccount,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  setRememberDevice,
  logoutAuthUser,
} from '../utils/auth';

interface GestarianSplashProps {
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  onEnter: () => void;
}

export const GestarianSplash: React.FC<GestarianSplashProps> = ({
  currentUser,
  onUserChange,
  onEnter,
}) => {
  const [animationComplete, setAnimationComplete] = useState(true);
  // Views: 'choice' (shows login/register options) | 'login' | 'register' | 'registered_success'
  const [authView, setAuthView] = useState<'choice' | 'login' | 'register' | 'registered_success'>('choice');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberInDevice, setRememberInDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Feedback state for explicit "Guardar datos" button
  const [savedDataFeedback, setSavedDataFeedback] = useState(false);

  // Detected browser Google account (e.g. iclomsinks@gmail.com from environment)
  const detectedGoogle = getDetectedGoogleAccount();

  useEffect(() => {
    setAnimationComplete(true);
  }, []);

  // Keyboard shortcut: Enter to enter app if already logged in or in choice view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && animationComplete && currentUser && authView === 'choice') {
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animationComplete, currentUser, authView, onEnter]);

  // Google 1-Click Login
  const handleGoogleLogin = async (specificEmail?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await loginWithGoogle(specificEmail, undefined, rememberInDevice);
      onUserChange(user);
      setAuthView('registered_success');
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al conectar con la cuenta de Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Email form submit (Login or Register)
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (authView === 'register') {
        if (!email.trim() || !password) {
          throw new Error('Por favor completa el email y CIF/DNI.');
        }
        const user = await registerWithEmail(name, email, password, rememberInDevice);
        onUserChange(user);
        // After registration, show explicit "Guardar datos para no volver a loguearse" step as requested!
        setAuthView('registered_success');
      } else if (authView === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Por favor ingresa tu email y CIF/DNI.');
        }
        const user = await loginWithEmail(email, password, rememberInDevice);
        onUserChange(user);
        if (rememberInDevice) {
          setAuthView('registered_success');
        } else {
          onEnter();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit action requested: "Una vez que el usuario está registrado ponemos un botón de guardar datos para no tener que volver a loguearse de nuevo o sea recordar en este dispositivo"
  const handleExplicitSaveData = () => {
    setRememberDevice(true);
    if (currentUser) {
      currentUser.rememberDevice = true;
      onUserChange({ ...currentUser, rememberDevice: true });
    }
    setSavedDataFeedback(true);
    setTimeout(() => {
      onEnter();
    }, 1400);
  };

  const handleLogout = () => {
    logoutAuthUser();
    onUserChange(null);
    setAuthView('choice');
  };

  return (
    <motion.div
      id="gestarian-splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
      transition={{ duration: 1.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-black text-stone-100 overflow-y-auto select-none"
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200/10 via-stone-950/20 to-transparent" />

      {/* Top utility bar */}
      <header className="relative z-10 w-full px-6 py-4 sm:px-12 flex justify-between items-center text-xs text-neutral-500 font-light tracking-widest uppercase">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-200/80 animate-pulse" />
          Sistema de Facturación A4 Veri*Factu
        </span>
        <button
          id="skip-splash-btn"
          type="button"
          onClick={onEnter}
          className="hover:text-amber-100 transition-colors duration-200 px-3.5 py-1 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 text-neutral-400 text-[11px]"
        >
          Acceso rápido →
        </button>
      </header>

      {/* Center Stage: GESTARIAN typography & Auth Controls */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-4xl mx-auto my-auto text-center">
        {/* Animated Brand Title */}
        <div className="w-full flex flex-col items-center justify-center my-auto">
          <motion.div
            initial={{
              scale: 0.2,
              opacity: 0,
              filter: 'blur(10px)',
            }}
            animate={{
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: 2.0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full flex flex-col items-center justify-center relative text-center"
          >
            <div className="flex flex-col items-end mx-auto text-center w-fit">
              <h1
                className="text-[clamp(1.5rem,8vw,7.5rem)] font-thin tracking-[0.1em] sm:tracking-[0.25em] uppercase leading-none select-none text-[#FEFCE9] text-center"
                style={{
                  fontFamily: "'Montserrat', 'Cinzel', sans-serif",
                }}
              >
                GESTARIAN
              </h1>
              <span
                className="text-[10px] sm:text-sm font-light tracking-[0.15em] sm:tracking-[0.25em] text-neutral-400"
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  marginTop: '3px',
                }}
              >
                Quick
              </span>
            </div>
          </motion.div>
        </div>

        {/* Authentication & Access Options Panel */}
        <AnimatePresence mode="wait">
          {animationComplete && (
            <motion.div
              key={authView + (currentUser ? '-logged' : '-guest')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md mt-6 sm:mt-8"
            >
              {/* CASE A: USER IS ALREADY REGISTERED / LOGGED IN */}
              {currentUser && authView === 'choice' && (
                <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 backdrop-blur-md shadow-2xl space-y-4">
                  <div className="flex items-center gap-3.5 pb-3 border-b border-neutral-800/80">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-full border border-amber-400/40 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-base">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                          {currentUser.provider === 'google' ? 'Google' : 'Usuario'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispositivo autorizado · Datos guardados</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA: Acceder a Gestarian Quick */}
                  <button
                    id="splash-enter-btn"
                    type="button"
                    onClick={onEnter}
                    className="w-full py-3.5 px-6 rounded-xl bg-stone-100 hover:bg-white text-neutral-950 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_0_25px_rgba(250,246,238,0.2)] hover:shadow-[0_0_35px_rgba(250,246,238,0.35)] active:scale-98"
                  >
                    <span>Acceder a Gestarian Quick</span>
                    <ArrowRight className="w-4 h-4 text-neutral-900" />
                  </button>

                  {/* Explicit user-requested button: "Botón de guardar datos para no tener que volver a loguearse de nuevo" */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <button
                      id="splash-save-device-explicit-btn"
                      type="button"
                      onClick={handleExplicitSaveData}
                      className="w-full py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-98"
                    >
                      {savedDataFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">¡Datos confirmados en este dispositivo!</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-amber-400" />
                          <span>Guardar datos en este dispositivo</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-neutral-500 text-center mt-1">
                      No volverá a solicitar usuario ni CIF/DNI en este navegador
                    </p>
                  </div>

                  {/* Switch user / logout */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthView('login')}
                      className="hover:text-amber-300 transition-colors"
                    >
                      Cambiar de usuario
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}

              {/* CASE B: NEW REGISTRATION SUCCESS - EXPLICIT "GUARDAR DATOS" BUTTON */}
              {authView === 'registered_success' && (
                <div className="p-6 rounded-2xl bg-neutral-950/95 border border-amber-400/40 backdrop-blur-md shadow-2xl space-y-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">¡Identificación Exitosa!</h3>
                    <p className="text-xs text-neutral-300 mt-1">
                      Has iniciado sesión como <span className="text-amber-300 font-semibold">{currentUser?.email}</span>
                    </p>
                  </div>

                  {/* The requested explicit button: "Ponemos un botón de guardar datos para no tener que volver a loguearse de nuevo o sea recordar en este dispositivo" */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Save className="w-4 h-4 text-amber-400" />
                      <span>Guardar datos en este dispositivo</span>
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      Guarda tus credenciales para acceder directamente sin volver a identificarte en tus próximas visitas.
                    </p>
                    <button
                      id="registered-save-device-btn"
                      type="button"
                      onClick={handleExplicitSaveData}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    >
                      {savedDataFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-neutral-950" />
                          <span>¡Guardado! Entrando a la aplicación...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Guardar datos y recordar en este equipo</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onEnter}
                    className="w-full py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Continuar al generador de facturas →
                  </button>
                </div>
              )}

              {/* CASE C: NOT LOGGED IN - SHOW REGISTRO, LOGIN & GOOGLE AUTO-DETECT */}
              {(!currentUser || authView !== 'choice') && authView !== 'registered_success' && (
                <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/95 border border-neutral-800 backdrop-blur-md shadow-2xl space-y-4">
                  {/* Google Auto-detection (as requested: "o entrar con Google si tiene el navegador abierto pues se detecta la cuenta de correo electrónico y se entra directamente") */}
                  {detectedGoogle && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-amber-400/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 flex items-center gap-1.5 font-semibold">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                  {/* CASE B: BRAND NEW SESSION - ONLY EMAIL AND CIF/DNI ALLOWED */}

                  {/* BOTONES DE REGISTRO Y DE LOGIN (Solicitados explícitamente) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="splash-show-login-btn"
                      type="button"
                      onClick={() => setAuthView('login')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        authView === 'login'
                          ? 'bg-neutral-800 text-amber-300 border-amber-400/50 shadow-sm'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-850'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Iniciar Sesión</span>
                    </button>

                    <button
                      id="splash-show-register-btn"
                      type="button"
                      onClick={() => setAuthView('register')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                        authView === 'register'
                          ? 'bg-neutral-800 text-amber-300 border-amber-400/50 shadow-sm'
                          : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-850'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Registrarse</span>
                    </button>
                  </div>



                  {/* Form for Login or Register */}
                  {(authView === 'login' || authView === 'register') && (
                    <form onSubmit={handleSubmitEmail} className="space-y-3 pt-2">
                      {errorMessage && (
                        <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {authView === 'register' && (
                        <div>
                          <label className="text-[11px] text-neutral-400 block mb-1">
                            Nombre o Empresa
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Ej. Mi Empresa S.L."
                              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
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
                            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">
                          CIF / DNI
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Explicit checkbox: Guardar datos en este dispositivo */}
                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 cursor-pointer group hover:border-neutral-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberInDevice}
                          onChange={(e) => setRememberInDevice(e.target.checked)}
                          className="mt-0.5 rounded text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <div className="text-[11px]">
                          <span className="text-neutral-200 font-semibold group-hover:text-amber-300 transition-colors">
                            Guardar datos en este dispositivo
                          </span>
                          <p className="text-neutral-400 text-[10px] leading-tight mt-0.5">
                            Recordar sesión en este equipo para no tener que volver a identificarte.
                          </p>
                        </div>
                      </label>

                      {/* Primary submit button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <span>Procesando...</span>
                        ) : authView === 'register' ? (
                          <>
                            <User className="w-4 h-4" />
                            <span>Crear Cuenta y Guardar Datos</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Iniciar Sesión</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* (Removed Guest Link as per architecture constraint) */}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 w-full px-6 py-4 sm:px-12 flex flex-col sm:flex-row justify-between items-center text-[11px] text-neutral-600 gap-2">
        <span>Facturación Directa A4 · Cálculo IVA 21% · AEAT Veri*Factu</span>
        <span className="text-neutral-500">
          {currentUser ? `Conectado como ${currentUser.email}` : 'Sesión segura y almacenamiento local'}
        </span>
      </footer>
    </motion.div>
  );
};
