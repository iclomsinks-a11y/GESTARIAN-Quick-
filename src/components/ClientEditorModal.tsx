import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Hash,
  MapPin,
  Phone,
  Mail,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Delete,
  CornerDownLeft,
  Sparkles,
  Save,
} from 'lucide-react';
import { ClientData } from '../types';

export type ClientInputField = 'name' | 'nif' | 'address' | 'phone' | 'email';

interface ClientEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData;
  initialField?: ClientInputField;
  onSave: (updatedClient: ClientData) => void;
}

export const ClientEditorModal: React.FC<ClientEditorModalProps> = ({
  isOpen,
  onClose,
  client,
  initialField = 'name',
  onSave,
}) => {
  const [formData, setFormData] = useState<ClientData>({ ...client });
  const [activeField, setActiveField] = useState<ClientInputField>(initialField);
  const [isUppercase, setIsUppercase] = useState(true);
  const [showSymbols, setShowSymbols] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // References to the 5 inputs
  const inputRefs = {
    name: useRef<HTMLInputElement>(null),
    nif: useRef<HTMLInputElement>(null),
    address: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
  };

  // Sync with incoming client prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...client });
      setActiveField(initialField || 'name');
      // If NIF is selected, default to uppercase
      if (initialField === 'nif') {
        setIsUppercase(true);
      }
    }
  }, [isOpen, client, initialField]);

  // Ensure selected input is visible and cursor is positioned at the end
  useEffect(() => {
    if (isOpen && inputRefs[activeField]?.current) {
      const el = inputRefs[activeField].current;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const len = el.value.length;
        el.setSelectionRange(len, len);
        setCursorPos(len);
      }
    }
  }, [activeField, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: ClientInputField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'nif' ? value.toUpperCase() : value,
    }));
  };

  const handleSelectField = (field: ClientInputField) => {
    setActiveField(field);
    if (field === 'nif') {
      setIsUppercase(true);
    } else if (field === 'email') {
      setIsUppercase(false);
    }
    const currentVal = formData[field] || '';
    setCursorPos(currentVal.length);
  };

  // Keyboard actions
  const handleKeyPress = (char: string) => {
    const currentVal = formData[activeField] || '';
    const el = inputRefs[activeField].current;
    let start = el ? el.selectionStart ?? currentVal.length : currentVal.length;
    let end = el ? el.selectionEnd ?? currentVal.length : currentVal.length;

    const finalChar = activeField === 'nif' ? char.toUpperCase() : char;
    const newVal = currentVal.substring(0, start) + finalChar + currentVal.substring(end);

    handleFieldChange(activeField, newVal);

    const nextPos = start + finalChar.length;
    setCursorPos(nextPos);
    setTimeout(() => {
      if (inputRefs[activeField].current) {
        inputRefs[activeField].current?.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const handleBackspace = () => {
    const currentVal = formData[activeField] || '';
    const el = inputRefs[activeField].current;
    let start = el ? el.selectionStart ?? currentVal.length : currentVal.length;
    let end = el ? el.selectionEnd ?? currentVal.length : currentVal.length;

    if (start === end) {
      if (start > 0) {
        const newVal = currentVal.substring(0, start - 1) + currentVal.substring(end);
        handleFieldChange(activeField, newVal);
        const nextPos = start - 1;
        setCursorPos(nextPos);
        setTimeout(() => {
          inputRefs[activeField].current?.setSelectionRange(nextPos, nextPos);
        }, 10);
      }
    } else {
      const newVal = currentVal.substring(0, start) + currentVal.substring(end);
      handleFieldChange(activeField, newVal);
      const nextPos = start;
      setCursorPos(nextPos);
      setTimeout(() => {
        inputRefs[activeField].current?.setSelectionRange(nextPos, nextPos);
      }, 10);
    }
  };

  const handleClearField = () => {
    handleFieldChange(activeField, '');
    setCursorPos(0);
    setTimeout(() => {
      inputRefs[activeField].current?.focus();
      inputRefs[activeField].current?.setSelectionRange(0, 0);
    }, 10);
  };

  const fieldOrder: ClientInputField[] = ['name', 'nif', 'address', 'phone', 'email'];

  const handleNextField = () => {
    const currentIndex = fieldOrder.indexOf(activeField);
    if (currentIndex < fieldOrder.length - 1) {
      handleSelectField(fieldOrder[currentIndex + 1]);
    } else {
      // If at end, trigger save
      handleSave();
    }
  };

  const handlePrevField = () => {
    const currentIndex = fieldOrder.indexOf(activeField);
    if (currentIndex > 0) {
      handleSelectField(fieldOrder[currentIndex - 1]);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // Keyboard Layout definitions
  // 1. PHONE KEYBOARD
  const renderPhoneKeyboard = () => {
    const phoneKeys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['+', '0', ' '],
    ];

    return (
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-1.5 sm:p-2 gap-1.5 justify-between">
        {/* Quick formatting bar */}
        <div className="flex items-center justify-between gap-1 px-1 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto py-0.5">
            {['+34 ', '6', '7', '9', '-', '(', ')'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleKeyPress(item)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold text-xs border border-neutral-700 active:scale-95 transition-transform"
              >
                {item === ' ' ? 'Espacio' : item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearField}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 font-medium text-xs border border-neutral-700 active:scale-95 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* 4 Rows Phone Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-1">
          {/* Main 3x4 Digits (spans 3 columns) */}
          <div className="col-span-3 grid grid-cols-3 gap-1.5 sm:gap-2">
            {phoneKeys.flat().map((k, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (k === ' ' ? handleKeyPress(' ') : handleKeyPress(k))}
                className="rounded-xl sm:rounded-2xl bg-neutral-800/90 hover:bg-neutral-750 active:bg-amber-400 active:text-neutral-950 text-white font-mono font-bold text-xl sm:text-2xl flex items-center justify-center border border-neutral-700/80 shadow-md active:scale-95 transition-all select-none"
              >
                {k === ' ' ? '␣' : k}
              </button>
            ))}
          </div>

          {/* Action column (spans 1 column) */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleBackspace}
              className="flex-1 rounded-xl sm:rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 flex flex-col items-center justify-center gap-1 border border-neutral-700 active:scale-95 transition-all select-none"
              title="Borrar carácter"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Borrar</span>
            </button>

            <button
              type="button"
              onClick={handleNextField}
              className="flex-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-neutral-950 font-bold flex flex-col items-center justify-center gap-1 border border-amber-300 shadow-lg shadow-amber-500/20 transition-all select-none"
              title="Siguiente campo"
            >
              <CornerDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Siguiente</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 2. CIF / NIF KEYBOARD (Optimized for Spanish DNI, NIE and CIF format: Numbers + common letters)
  const renderCifKeyboard = () => {
    // Digits row
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    // CIF common prefix / suffix letters
    const cifLetters = [
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R'],
      ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    ];

    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-1 sm:p-2 gap-1 justify-between">
        {/* Row 1: Numbers */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {numbers.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="rounded-lg sm:rounded-xl bg-amber-400/20 hover:bg-amber-400/30 active:bg-amber-400 text-amber-300 active:text-neutral-950 font-mono font-bold text-base sm:text-xl flex items-center justify-center border border-amber-400/30 active:scale-95 transition-all select-none"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 2: Letters Block 1 */}
        <div className="grid grid-cols-8 gap-1 flex-1">
          {cifLetters[0].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleKeyPress(letter)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Row 3: Letters Block 2 */}
        <div className="grid grid-cols-8 gap-1 flex-1">
          {cifLetters[1].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleKeyPress(letter)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Row 4: Letters Block 3 + Actions */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {cifLetters[2].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleKeyPress(letter)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {letter}
            </button>
          ))}
          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="rounded-lg sm:rounded-xl bg-neutral-750 hover:bg-neutral-700 text-amber-400 flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>
          {/* Next */}
          <button
            type="button"
            onClick={handleNextField}
            className="rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold flex items-center justify-center border border-amber-300 shadow-md active:scale-95 transition-all select-none"
            title="Siguiente campo"
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // 3. EMAIL KEYBOARD (Optimized with direct domain chips, @, .com, .es)
  const renderEmailKeyboard = () => {
    const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'];
    const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '_', '-', '.'];

    const emailShortcuts = ['@gmail.com', '@hotmail.com', '@yahoo.es', '@outlook.com', '.com', '.es'];

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-1 sm:p-2 gap-1 justify-between">
        {/* Quick Email Domains Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleKeyPress('@')}
            className="px-3 py-1 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs border border-amber-300 active:scale-95 shrink-0"
          >
            @
          </button>
          {emailShortcuts.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => handleKeyPress(domain)}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-xs border border-neutral-700 active:scale-95 shrink-0"
            >
              {domain}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearField}
            className="ml-auto px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs border border-neutral-700 shrink-0"
          >
            Limpiar
          </button>
        </div>

        {/* QWERTY Row 1 */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row1.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* QWERTY Row 2 */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row2.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* QWERTY Row 3 */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row3.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Bottom Control Row */}
        <div className="flex gap-1 flex-1">
          <button
            type="button"
            onClick={() => setIsUppercase(!isUppercase)}
            className={`w-14 sm:w-16 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-center border transition-all active:scale-95 select-none ${
              isUppercase
                ? 'bg-amber-400 text-neutral-950 border-amber-300'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
          >
            {isUppercase ? 'MAYÚS' : 'minús'}
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('@')}
            className="w-12 sm:w-14 rounded-lg sm:rounded-xl bg-neutral-750 hover:bg-neutral-700 text-amber-300 font-bold text-base flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
          >
            @
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('.')}
            className="w-12 sm:w-14 rounded-lg sm:rounded-xl bg-neutral-750 hover:bg-neutral-700 text-amber-300 font-bold text-lg flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
          >
            .
          </button>

          {/* Space Bar */}
          <button
            type="button"
            onClick={() => handleKeyPress(' ')}
            className="flex-1 rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-400 font-bold text-xs flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
          >
            ESPACIO
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-14 sm:w-16 rounded-lg sm:rounded-xl bg-neutral-750 hover:bg-neutral-700 text-amber-400 flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNextField}
            className="w-14 sm:w-16 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold flex items-center justify-center border border-amber-300 shadow-md active:scale-95 select-none"
            title="Siguiente campo"
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // 4. FULL TEXT & ADDRESS KEYBOARD (for Name & Address)
  const renderTextKeyboard = () => {
    const numbersRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'];
    const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'];

    const addressShortcuts = ['C/', 'Avda.', 'Pza.', 'Nº', 'º', 'ª', 'Pol.', 'Pje.', '/'];

    return (
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-1 sm:p-2 gap-1 justify-between">
        {/* Address or quick shortcuts bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 shrink-0 scrollbar-none">
          {activeField === 'address' ? (
            addressShortcuts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleKeyPress(`${item} `)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs border border-neutral-700 active:scale-95 shrink-0"
              >
                {item}
              </button>
            ))
          ) : (
            ['S.L.', 'S.A.', 'S.L.U.', 'Autónomo', '&', '•'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleKeyPress(item)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs border border-neutral-700 active:scale-95 shrink-0"
              >
                {item}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={handleClearField}
            className="ml-auto px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs border border-neutral-700 shrink-0"
          >
            Limpiar
          </button>
        </div>

        {/* Row 0: Numbers */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {numbersRow.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="rounded-lg sm:rounded-xl bg-neutral-850 hover:bg-neutral-750 active:bg-amber-400 active:text-neutral-950 text-neutral-300 font-mono font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-750 active:scale-95 transition-all select-none"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 1: QWERTY */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row1.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 2: ASDFG */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row2.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Row 3: ZXCVB */}
        <div className="grid grid-cols-10 gap-1 flex-1">
          {row3.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(isUppercase ? k.toUpperCase() : k)}
              className="rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-400 active:text-neutral-950 text-white font-bold text-sm sm:text-base flex items-center justify-center border border-neutral-700 active:scale-95 transition-all select-none"
            >
              {isUppercase ? k.toUpperCase() : k}
            </button>
          ))}
        </div>

        {/* Control Row */}
        <div className="flex gap-1 flex-1">
          <button
            type="button"
            onClick={() => setIsUppercase(!isUppercase)}
            className={`w-16 sm:w-20 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-center border transition-all active:scale-95 select-none ${
              isUppercase
                ? 'bg-amber-400 text-neutral-950 border-amber-300'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
          >
            {isUppercase ? 'MAYÚS' : 'minús'}
          </button>

          {/* Space */}
          <button
            type="button"
            onClick={() => handleKeyPress(' ')}
            className="flex-1 rounded-lg sm:rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 font-bold text-xs flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
          >
            ESPACIO
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 sm:w-20 rounded-lg sm:rounded-xl bg-neutral-750 hover:bg-neutral-700 text-amber-400 flex items-center justify-center border border-neutral-700 active:scale-95 select-none"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNextField}
            className="w-16 sm:w-20 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold flex items-center justify-center border border-amber-300 shadow-md active:scale-95 select-none"
            title="Siguiente campo"
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderKeyboard = () => {
    switch (activeField) {
      case 'phone':
        return renderPhoneKeyboard();
      case 'nif':
        return renderCifKeyboard();
      case 'email':
        return renderEmailKeyboard();
      case 'name':
      case 'address':
      default:
        return renderTextKeyboard();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* PARTE SUPERIOR (60% DE LA PANTALLA EN MÓVIL Y TABLET PORTRAIT)            */}
      {/* Los 5 inputs grandes: Nombre, CIF, Dirección, Teléfono y Correo           */}
      {/* ========================================================================= */}
      <div className="h-[60%] sm:h-[58%] w-full flex flex-col bg-neutral-950 border-b-2 border-neutral-800 shadow-2xl">
        {/* Top Bar with Title and Actions */}
        <div className="px-4 py-2.5 sm:py-3 border-b border-neutral-800/80 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-1.5">
                <span>Datos del Cliente</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-semibold">
                  {fieldOrder.indexOf(activeField) + 1}/5
                </span>
              </h2>
              <p className="text-[10px] text-neutral-400 hidden sm:block">
                Pulsa en cualquier casilla para editar con el teclado optimizado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button in Top Bar */}
            <button
              type="button"
              id="client-editor-save-btn"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-neutral-950" />
              <span>Guardar</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 active:scale-95 transition-colors cursor-pointer"
              title="Cerrar sin guardar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list of 5 large inputs filling the remaining 60% height */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-2.5 sm:py-4 space-y-2 sm:space-y-3">
          {/* INPUT 1: NOMBRE COMPLETO / RAZÓN SOCIAL */}
          <div
            onClick={() => handleSelectField('name')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeField === 'name'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
                <User className={`w-3.5 h-3.5 ${activeField === 'name' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>1. Nombre o Razón Social</span>
                <span className="text-amber-400">*</span>
              </label>
              {activeField === 'name' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full">
                  ACTIVO
                </span>
              )}
            </div>
            <input
              ref={inputRefs.name}
              type="text"
              inputMode="none"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onFocus={() => handleSelectField('name')}
              placeholder="Ej. Construcciones y Reformas García S.L."
              className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* INPUT 2: CIF / NIF / DNI */}
          <div
            onClick={() => handleSelectField('nif')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeField === 'nif'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
                <Hash className={`w-3.5 h-3.5 ${activeField === 'nif' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>2. CIF / NIF / DNI</span>
                <span className="text-amber-400">*</span>
              </label>
              {activeField === 'nif' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full">
                  ACTIVO (Teclado CIF)
                </span>
              )}
            </div>
            <input
              ref={inputRefs.nif}
              type="text"
              inputMode="none"
              value={formData.nif}
              onChange={(e) => handleFieldChange('nif', e.target.value.toUpperCase())}
              onFocus={() => handleSelectField('nif')}
              placeholder="Ej. B-88776655 o 12345678Z"
              className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-amber-300 uppercase placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* INPUT 3: DIRECCIÓN FISCAL */}
          <div
            onClick={() => handleSelectField('address')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeField === 'address'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
                <MapPin className={`w-3.5 h-3.5 ${activeField === 'address' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>3. Dirección / Domicilio Fiscal</span>
              </label>
              {activeField === 'address' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full">
                  ACTIVO
                </span>
              )}
            </div>
            <input
              ref={inputRefs.address}
              type="text"
              inputMode="none"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onFocus={() => handleSelectField('address')}
              placeholder="Ej. Calle Gran Vía 28, 3ºB, 28013 Madrid"
              className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-semibold text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* INPUT 4: TELÉFONO */}
          <div
            onClick={() => handleSelectField('phone')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeField === 'phone'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
                <Phone className={`w-3.5 h-3.5 ${activeField === 'phone' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>4. Teléfono de Contacto / WhatsApp</span>
              </label>
              {activeField === 'phone' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full">
                  ACTIVO (Teclado Numérico)
                </span>
              )}
            </div>
            <input
              ref={inputRefs.phone}
              type="tel"
              inputMode="none"
              value={formData.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              onFocus={() => handleSelectField('phone')}
              placeholder="Ej. +34 612 345 678"
              className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-mono font-bold text-emerald-300 placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* INPUT 5: CORREO ELECTRÓNICO */}
          <div
            onClick={() => handleSelectField('email')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
              activeField === 'email'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-300">
                <Mail className={`w-3.5 h-3.5 ${activeField === 'email' ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>5. Correo Electrónico (Email)</span>
              </label>
              {activeField === 'email' && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.2 rounded-full">
                  ACTIVO (Teclado Email)
                </span>
              )}
            </div>
            <input
              ref={inputRefs.email}
              type="email"
              inputMode="none"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onFocus={() => handleSelectField('email')}
              placeholder="Ej. administracion@cliente.com"
              className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-400 rounded-xl px-3 py-2 text-sm sm:text-base font-semibold text-sky-300 placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PARTE INFERIOR (40% RESTANTE EN MÓVIL Y TABLET PORTRAIT)                   */}
      {/* Teclado táctil optimizado según el concepto del input activo con teclas    */}
      {/* lo más grandes posibles para ocupar ese 40%                               */}
      {/* ========================================================================= */}
      <div className="h-[40%] sm:h-[42%] w-full bg-neutral-950 p-1 sm:p-2 flex flex-col justify-center border-t border-neutral-800 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {renderKeyboard()}
      </div>
    </div>
  );
};
