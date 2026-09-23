import React from 'react';
import { motion } from 'motion/react';
import { Plus, KeyRound } from 'lucide-react';
import { Invoice, ClientData, ProviderData, AuthUser } from '../types';

interface HomeScreenProps {
  onNewInvoice: () => void;
  onOpenInvoicesDb?: () => void;
  onOpenClientsDb?: () => void;
  onOpenNewClientForm?: () => void;
  onOpenProvidersDb?: () => void;
  onReplaySplash?: () => void;
  invoices?: Invoice[];
  clients?: ClientData[];
  providers?: ProviderData[];
  currentInvoice?: Invoice;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onSaveDeviceData?: () => void;
  onGoToConfig?: () => void;
  onGoToActiveInvoice?: () => void;
  onGoToReceivedInvoices?: () => void;
  receivedInvoicesCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewInvoice,
  onOpenClientsDb,
  onOpenNewClientForm,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <div
      id="home-screen-minimalist"
      className="h-full w-full max-h-full max-w-full flex items-center justify-center relative overflow-hidden select-none touch-pan-x p-4"
    >
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center text-center my-auto overflow-hidden">
        {/* Gestarian Quick Animation: Zoom in from further away with fade in (2 seconds duration) - centered */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.2, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
            className="w-full text-center relative flex flex-col items-center justify-center"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            <div className="flex flex-col items-end mx-auto w-fit">
              <h1
                className="home-title-gestarian text-[clamp(1.8rem,9.6vw,5.4rem)] font-[100] tracking-[0.1em] sm:tracking-[0.25em] uppercase leading-none select-none text-[#FEFCE9] text-center"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 100,
                  WebkitTextStroke: '2px #FEFCE9',
                  paintOrder: 'stroke fill',
                }}
              >
                GESTARIAN
              </h1>
              <span
                className="home-subtitle-quick text-[14px] sm:text-lg md:text-xl font-[100] tracking-[0.15em] sm:tracking-[0.25em] text-[#808080] text-right self-end mt-1.5"
                style={{
                  fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
                  fontWeight: 100,
                  color: '#808080',
                  fontSize: '1.2em',
                  WebkitTextStroke: '2px #808080',
                  paintOrder: 'stroke fill',
                }}
              >
                Quick
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons Stack (Fade In starting 100px below, sequentially via delay) */}
        <div className="flex flex-col items-center gap-4 w-[85%] max-w-sm mx-auto mt-8 sm:mt-10">
          {/* Button 1: Factura */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
            style={{ willChange: 'transform, opacity' }}
          >
            <button
              type="button"
              id="btn-home-nueva-factura"
              onClick={onNewInvoice}
              className="w-full px-6 py-4 sm:py-4.5 rounded-xl bg-transparent hover:bg-[#FAF6EE]/5 text-[#FAF6EE] font-extralight text-lg sm:text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-3.5 border border-[#FAF6EE]/30 hover:border-[#FAF6EE]/80 transition-all duration-300 cursor-pointer active:scale-95 shadow-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 200,
              }}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.25] text-[#FAF6EE]/80 shrink-0" />
              <span>FACTURA</span>
            </button>
          </motion.div>

          {/* Button 2: Cliente */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
            style={{ willChange: 'transform, opacity' }}
          >
            <button
              type="button"
              id="btn-home-nuevo-cliente"
              onClick={() => {
                if (onOpenClientsDb) onOpenClientsDb();
                else onOpenNewClientForm?.();
              }}
              className="w-full px-6 py-4 sm:py-4.5 rounded-xl bg-transparent hover:bg-[#FAF6EE]/5 text-[#FAF6EE] font-extralight text-lg sm:text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-3.5 border border-[#FAF6EE]/30 hover:border-[#FAF6EE]/80 transition-all duration-300 cursor-pointer active:scale-95 shadow-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 200,
              }}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.25] text-[#FAF6EE]/80 shrink-0" />
              <span>CLIENTE</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Botón Sesión / Login ubicado abajo a 10px del borde de la ventana (solo si no se ha iniciado sesión) */}
      {!currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[10px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto"
          style={{ bottom: '10px' }}
        >
          <button
            type="button"
            id="btn-home-sesion-login"
            onClick={onOpenAuthModal}
            className="px-4 py-2 sm:py-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-[#FEFCE9] hover:text-white text-xs sm:text-sm font-medium tracking-[0.18em] uppercase flex items-center gap-2 border border-neutral-700/80 hover:border-amber-400/80 transition-all duration-300 cursor-pointer active:scale-95 backdrop-blur-md shadow-lg"
            style={{
              fontFamily: "'Montserrat', sans-serif",
            }}
            title="Iniciar Sesión / Registro"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>SESIÓN / LOGIN</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
