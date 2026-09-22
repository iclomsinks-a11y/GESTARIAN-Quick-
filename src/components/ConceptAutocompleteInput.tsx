import React, { useState, useEffect, useRef } from 'react';
import { History, Sparkles, X } from 'lucide-react';
import { ConceptHistoryItem } from '../types';
import { searchConcepts, saveConceptToMemory } from '../utils/conceptsMemory';

interface ConceptAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onConceptCommitted?: (value: string) => void;
  allConcepts: ConceptHistoryItem[];
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
  onFocusInput?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlurInput?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const ConceptAutocompleteInput: React.FC<ConceptAutocompleteInputProps> = ({
  value,
  onChange,
  onConceptCommitted,
  allConcepts,
  placeholder = 'Describa el concepto o servicio...',
  id,
  autoFocus = false,
  onFocusInput,
  onBlurInput,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search filtered results
  const matches = searchConcepts(value, allConcepts);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (conceptText: string) => {
    onChange(conceptText);
    setIsOpen(false);
    setHighlightedIndex(-1);
    saveConceptToMemory(conceptText);
    if (onConceptCommitted) {
      onConceptCommitted(conceptText);
    }
  };

  const handleBlur = () => {
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      if (value.trim().length >= 2) {
        saveConceptToMemory(value);
        if (onConceptCommitted) {
          onConceptCommitted(value);
        }
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && matches[highlightedIndex]) {
        e.preventDefault();
        handleSelect(matches[highlightedIndex].text);
      } else if (value.trim().length >= 2) {
        saveConceptToMemory(value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          if (!isOpen) setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          if (onFocusInput) onFocusInput(e);
        }}
        onBlur={(e) => {
          handleBlur();
          if (onBlurInput) onBlurInput(e);
        }}
        onKeyDown={handleKeyDown}
        className="w-full px-2.5 py-2 text-sm text-neutral-900 bg-transparent border border-transparent hover:border-neutral-300 focus:border-amber-400 focus:bg-amber-50/20 focus:ring-1 focus:ring-amber-300 focus:outline-none rounded transition-colors duration-150 print:border-none print:p-0 print:bg-transparent"
      />

      {/* Autocomplete Dropdown Popup */}
      {isOpen && matches.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 w-full min-w-[320px] max-w-[480px] bg-white border border-neutral-200 shadow-xl rounded-lg py-1.5 z-40 text-neutral-800 animate-in fade-in zoom-in-95 duration-100 no-print"
          style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="px-3 py-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Sugerencias del historial inteligente
            </span>
            <span className="text-[10px] text-neutral-400 lowercase">↑↓ enter</span>
          </div>

          <ul className="max-h-56 overflow-y-auto divide-y divide-neutral-50 py-1">
            {matches.map((item, index) => {
              const isSelected = index === highlightedIndex;
              return (
                <li
                  key={`${item.text}-${index}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before click registers
                    handleSelect(item.text);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-amber-50 text-neutral-900 font-medium' : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-2 truncate">
                    <History className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.text}</span>
                  </div>
                  {item.count > 1 && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-mono">
                      {item.count}x
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-1.5 text-[11px] bg-neutral-50 border-t border-neutral-100 text-neutral-500 flex justify-between items-center">
            <span>Se guardará automáticamente en memoria</span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
              className="text-neutral-400 hover:text-neutral-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
