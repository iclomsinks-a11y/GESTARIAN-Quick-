import React from 'react';
import { createPortal } from 'react-dom';
import { Delete, Check, ArrowRight } from 'lucide-react';

interface CompactNumericKeyboardProps {
  value: string | number;
  onChange: (newValue: string) => void;
  onConfirm?: () => void;
  onNextField?: () => void;
  onClose?: () => void;
  label?: string;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}

export const CompactNumericKeyboard: React.FC<CompactNumericKeyboardProps> = ({
  value,
  onChange,
  onConfirm,
  onNextField,
  onClose,
  allowDecimal = true,
  allowNegative = false,
}) => {
  const currentValStr = value === undefined || value === null ? '' : value.toString();

  const handleKeyPress = (key: string) => {
    let next = currentValStr;
    if (next === '0' && key !== '.' && key !== ',') {
      next = '';
    }

    if (key === '.' || key === ',') {
      // Permite añadir ',' cuando se pulsa el '.' o la coma en el teclado numérico
      if (!next.includes(',') && !next.includes('.')) {
        next = next === '' ? '0,' : next + ',';
      }
    } else {
      next += key;
    }
    onChange(next);
  };

  const handleDelete = () => {
    if (currentValStr.length > 0) {
      onChange(currentValStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleToggleSign = () => {
    let next = currentValStr;
    if (next.startsWith('-')) {
      next = next.substring(1);
    } else {
      if (next === '' || next === '0') {
        next = '-';
      } else {
        next = '-' + next;
      }
    }
    onChange(next);
  };

  const keyboardContent = (
    <div
      id="compact-numeric-keyboard"
      className="fixed bottom-0 left-0 right-0 z-[99999] bg-neutral-950/98 border-t-2 border-amber-400/80 shadow-[0_-12px_35px_rgba(0,0,0,0.9)] backdrop-blur-md px-2 py-2 sm:py-2.5 max-w-xl mx-auto rounded-t-2xl sm:rounded-t-3xl select-none animate-in slide-in-from-bottom duration-150"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        touchAction: 'manipulation',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Únicamente teclas, sin cabecera */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {/* Fila 1 */}
        <button
          type="button"
          onClick={() => handleKeyPress('1')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('2')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('3')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          3
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="col-span-2 h-11 sm:h-12 bg-neutral-850 hover:bg-rose-950/40 active:bg-rose-600 active:text-white text-rose-400 font-black rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
          title="Borrar carácter"
        >
          <Delete className="w-5 h-5" />
        </button>

        {/* Fila 2 */}
        <button
          type="button"
          onClick={() => handleKeyPress('4')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('5')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('6')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          6
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="h-11 sm:h-12 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 active:bg-neutral-700 font-bold text-xs sm:text-sm uppercase rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
          title="Limpiar campo"
        >
          C
        </button>
        {onNextField ? (
          <button
            type="button"
            onClick={onNextField}
            className="h-11 sm:h-12 bg-sky-600 hover:bg-sky-500 active:bg-sky-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Siguiente campo"
          >
            <span>Sig.</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onConfirm || onClose}
            className="h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Aceptar"
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>
        )}

        {/* Fila 3 */}
        <button
          type="button"
          onClick={() => handleKeyPress('7')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('8')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('9')}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('.')}
          disabled={!allowDecimal}
          className={`h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center transition-all ${
            allowDecimal ? 'cursor-pointer active:scale-95' : 'opacity-30 cursor-not-allowed'
          }`}
          title="Coma decimal"
        >
          ,
        </button>
        <button
          type="button"
          onClick={() => {
            if (currentValStr && currentValStr !== '0') {
              handleKeyPress('00');
            } else {
              handleKeyPress('0');
            }
          }}
          className="h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-neutral-300 font-bold text-base sm:text-lg rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
        >
          00
        </button>

        {/* Fila 4: 0 ancho (o 0 + - si allowNegative es true) y botón OK */}
        {allowNegative ? (
          <>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="col-span-1 h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleToggleSign}
              className="col-span-1 h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-850 active:bg-amber-400 active:text-neutral-950 text-orange-400 hover:text-orange-300 font-black text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Signo negativo (-)"
            >
              -
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="col-span-2 h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-neutral-950 text-white font-black text-xl sm:text-2xl rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            0
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm || onClose}
          className="col-span-3 h-11 sm:h-12 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-black text-base rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          title="Confirmar"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(keyboardContent, document.body);
  }

  return keyboardContent;
};
