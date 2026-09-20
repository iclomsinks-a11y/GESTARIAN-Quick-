import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
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
  onOpenNewClientForm,
}) => {
  const [animationFinished, setAnimationFinished] = useState(false);
  const [secondButtonReady, setSecondButtonReady] = useState(false);

  useEffect(() => {
    // Gestarian Quick animation completes after ~1.1s
    const timer1 = setTimeout(() => {
      setAnimationFinished(true);
    }, 1100);

    // Second button appears shortly after the first button finishes appearing
    const timer2 = setTimeout(() => {
      setSecondButtonReady(true);
    }, 1750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div
      id="home-screen-minimalist"
      className="min-h-[calc(100vh-90px)] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black text-stone-100 select-none"
    >
      {/* Subtle ambient warm lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200/10 via-black to-transparent" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center text-center my-auto space-y-6">
        {/* Gestarian Quick Animation */}
        <div className="w-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, filter: 'blur(8px)', y: 16 }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full text-center relative flex flex-col items-center justify-center"
          >
            <div className="relative inline-block mx-auto text-center">
              <h1
                className="text-[clamp(2.6rem,7.5vw,6.5rem)] font-thin tracking-[0.25em] uppercase leading-none select-none text-neutral-400 text-center"
                style={{
                  fontFamily: "'Montserrat', 'Cinzel', sans-serif",
                }}
              >
                GESTARIAN
              </h1>
              <span
                className="absolute bottom-0 right-1 text-xs sm:text-sm font-light tracking-[0.35em] uppercase text-[#FAF6EE]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                QUICK
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons Stack (Fade In starting 50px below) */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs sm:max-w-sm mt-8">
          {/* Button 1: Factura */}
          <AnimatePresence>
            {animationFinished && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <button
                  type="button"
                  id="btn-home-nueva-factura"
                  onClick={onNewInvoice}
                  className="w-full px-8 py-4 rounded-xl bg-black/40 hover:bg-[#FAF6EE]/10 text-[#FAF6EE] font-light text-base sm:text-lg uppercase tracking-[0.25em] flex items-center justify-center gap-3 border border-[#FAF6EE]/80 hover:border-[#FAF6EE] transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_0_25px_rgba(250,246,238,0.05)]"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <Plus className="w-5 h-5 stroke-[2] text-[#FAF6EE]" />
                  <span>FACTURA</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button 2: Cliente */}
          <AnimatePresence>
            {secondButtonReady && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <button
                  type="button"
                  id="btn-home-nuevo-cliente"
                  onClick={() => onOpenNewClientForm?.()}
                  className="w-full px-8 py-4 rounded-xl bg-black/40 hover:bg-[#FAF6EE]/10 text-[#FAF6EE] font-light text-base sm:text-lg uppercase tracking-[0.25em] flex items-center justify-center gap-3 border border-[#FAF6EE]/80 hover:border-[#FAF6EE] transition-all duration-300 cursor-pointer active:scale-95 shadow-[0_0_25px_rgba(250,246,238,0.05)]"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <Plus className="w-5 h-5 stroke-[2] text-[#FAF6EE]" />
                  <span>CLIENTE</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
