import React from 'react';
import { createPortal } from 'react-dom';
import { Delete, Check } from 'lucide-react';

interface CompactAlphabetKeyboardProps {
  value: string;
  onChange: (newValue: string) => void;
  onClose?: () => void;
  onSearch?: () => void;
  placeholderLabel?: string;
}

export const CompactAlphabetKeyboard: React.FC<CompactAlphabetKeyboardProps> = ({
  value,
  onChange,
  onClose,
  onSearch,
}) => {
  const handleLetterPress = (char: string) => {
    onChange(value + char);
  };

  const handleDelete = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleSpace = () => {
    if (value.length > 0 && !value.endsWith(' ')) {
      onChange(value + ' ');
    }
  };

  const ROW1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const ROW2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
  const ROW3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  const keyboardContent = (
    <div
      id="compact-alphabet-keyboard"
      className="fixed bottom-0 left-0 right-0 z-[99999] bg-neutral-950/98 border-t-2 border-teal-500/80 shadow-[0_-12px_35px_rgba(0,0,0,0.9)] backdrop-blur-md px-1.5 py-2 sm:px-3 sm:py-2.5 max-w-2xl mx-auto rounded-t-2xl sm:rounded-t-3xl select-none animate-in slide-in-from-bottom duration-150"
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
      <div className="flex flex-col gap-1 sm:gap-1.5 w-full">
        {/* Fila 1: QWERTYUIOP */}
        <div className="flex gap-1 sm:gap-1.5 w-full justify-center">
          {ROW1.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => handleLetterPress(char)}
              className="flex-1 min-w-0 h-9 sm:h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-teal-400 active:text-neutral-950 text-white font-black text-base sm:text-lg rounded-lg sm:rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              {char}
            </button>
          ))}
        </div>

        {/* Fila 2: ASDFGHJKLÑ */}
        <div className="flex gap-1 sm:gap-1.5 w-full justify-center px-1 sm:px-2">
          {ROW2.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => handleLetterPress(char)}
              className="flex-1 min-w-0 h-9 sm:h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-teal-400 active:text-neutral-950 text-white font-black text-base sm:text-lg rounded-lg sm:rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              {char}
            </button>
          ))}
        </div>

        {/* Fila 3: ZXCVBNM + Tecla Borrar */}
        <div className="flex gap-1 sm:gap-1.5 w-full justify-center">
          {ROW3.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => handleLetterPress(char)}
              className="flex-1 min-w-0 h-9 sm:h-11 bg-neutral-900 hover:bg-neutral-800 active:bg-teal-400 active:text-neutral-950 text-white font-black text-base sm:text-lg rounded-lg sm:rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              {char}
            </button>
          ))}

          {/* Tecla Borrar */}
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 min-w-0 h-9 sm:h-11 bg-neutral-850 hover:bg-rose-950/50 active:bg-rose-600 active:text-white text-rose-400 font-bold rounded-lg sm:rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title="Borrar"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Fila 4: Limpiar (C) + Barra ESPACIO + Tecla OK */}
        <div className="flex gap-1.5 sm:gap-2 w-full justify-center pt-0.5">
          {/* Botón C (Limpiar todo) */}
          <button
            type="button"
            onClick={handleClear}
            className="w-14 sm:w-16 h-8 sm:h-10 bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-700 text-neutral-300 font-black text-xs sm:text-sm uppercase rounded-lg sm:rounded-xl border border-neutral-800 flex items-center justify-center cursor-pointer active:scale-95"
            title="Borrar todo"
          >
            C
          </button>

          {/* Barra de espacio */}
          <button
            type="button"
            onClick={handleSpace}
            className="flex-1 h-8 sm:h-10 bg-neutral-900 hover:bg-neutral-800 active:bg-teal-400 active:text-neutral-950 text-neutral-300 font-bold text-xs sm:text-sm uppercase tracking-widest rounded-lg sm:rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
          >
            ESPACIO
          </button>

          {/* Botón OK */}
          <button
            type="button"
            onClick={onSearch || onClose}
            className="w-20 sm:w-28 h-8 sm:h-10 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-neutral-950 font-black text-xs sm:text-sm uppercase rounded-lg sm:rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>OK</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(keyboardContent, document.body);
  }

  return keyboardContent;
};
