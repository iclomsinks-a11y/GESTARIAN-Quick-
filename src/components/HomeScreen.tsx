import React from 'react';
import { motion } from 'motion/react';
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
  onOpenClientsDb,
  onOpenNewClientForm,
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
                className="text-[clamp(2.4rem,7vw,4.5rem)] font-thin tracking-[0.25em] uppercase leading-none select-none text-[#FEFCE9] text-center"
                style={{
                  fontFamily: "'Montserrat', 'Cinzel', sans-serif",
                }}
              >
                GESTARIAN
              </h1>
              <span
                className="home-subtitle-quick text-xs sm:text-sm md:text-base font-semibold tracking-[0.25em] text-amber-400 text-right self-end mt-1.5"
                style={{
                  fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
                }}
              >
                Quick
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons Stack (Fade In starting 100px below, sequentially via delay) */}
        <div className="flex flex-col items-center gap-3.5 w-[80%] max-w-xs mx-auto mt-8 sm:mt-10">
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
              className="w-full px-6 py-3.5 rounded-lg bg-transparent hover:bg-[#FAF6EE]/5 text-[#FAF6EE] font-extralight text-xs sm:text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-[#FAF6EE]/30 hover:border-[#FAF6EE]/80 transition-all duration-300 cursor-pointer active:scale-95 shadow-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <Plus className="w-4 h-4 stroke-[1] text-[#FAF6EE]/80" />
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
              className="w-full px-6 py-3.5 rounded-lg bg-transparent hover:bg-[#FAF6EE]/5 text-[#FAF6EE] font-extralight text-xs sm:text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-[#FAF6EE]/30 hover:border-[#FAF6EE]/80 transition-all duration-300 cursor-pointer active:scale-95 shadow-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <Plus className="w-4 h-4 stroke-[1] text-[#FAF6EE]/80" />
              <span>CLIENTE</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
