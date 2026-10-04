import React, { useState, useEffect, useRef } from 'react';
import { History, Sparkles, Package, X } from 'lucide-react';
import { ConceptHistoryItem } from '../types';
import { searchConcepts, saveConceptToMemory } from '../utils/conceptsMemory';
import { formatConceptWithCode, sortProductsByName } from '../services/catalogImporterService';

export interface CatalogProductItem {
  id?: string;
  code?: string;
  name: string;
  description?: string;
}

interface ConceptAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onConceptCommitted?: (value: string) => void;
  allConcepts: ConceptHistoryItem[];
  clientProducts?: CatalogProductItem[];
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
  clientProducts = [],
  placeholder = 'Escriba concepto o busque en el catálogo...',
  id,
  autoFocus = false,
  onFocusInput,
  onBlurInput,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const queryRaw = normalize(value.trim());
  const queryTokens = queryRaw.split(/\s+/).filter(Boolean);

  // 1. Filter Client Catalog Products (cascada multi-token)
  const matchingCatalogItems = sortProductsByName(clientProducts)
    .filter((prod) => {
      if (queryTokens.length === 0) return true; // Show all when empty on focus
      const targetText = normalize(`${prod.code || ''} ${prod.name || ''} ${prod.description || ''}`);
      return queryTokens.every((token) => targetText.includes(token));
    })
    .slice(0, 30) // max 30 items for smooth scrolling
    .map((prod) => ({
      text: formatConceptWithCode(prod.code, prod.name, prod.description),
      code: prod.code,
      name: prod.name,
      isCatalog: true,
      count: undefined,
    }));

  // 2. Filter Concept History Memory
  const historyMatches = searchConcepts(value, allConcepts)
    .filter((h) => !matchingCatalogItems.some((c) => c.text === h.text))
    .map((h) => ({
      text: h.text,
      code: undefined,
      name: h.text,
      isCatalog: false,
      count: h.count,
    }));

  const combinedMatches = [...matchingCatalogItems, ...historyMatches];

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
      setHighlightedIndex((prev) => (prev < combinedMatches.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : combinedMatches.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && combinedMatches[highlightedIndex]) {
        e.preventDefault();
        handleSelect(combinedMatches[highlightedIndex].text);
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
        className="w-full px-2.5 py-2 text-sm text-neutral-900 bg-transparent border border-transparent hover:border-neutral-300 focus:border-amber-400 focus:bg-amber-50/20 focus:ring-1 focus:ring-amber-300 focus:outline-none rounded transition-colors duration-150 print:border-none print:p-0 print:bg-transparent font-medium print:text-base print:sm:text-[17px] print:font-semibold"
      />

      {/* Autocomplete Dropdown Popup */}
      {isOpen && combinedMatches.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 w-full min-w-[260px] sm:min-w-[340px] max-w-[92vw] sm:max-w-[540px] bg-white border border-neutral-200 shadow-2xl rounded-xl py-1.5 z-50 text-neutral-800 animate-in fade-in zoom-in-95 duration-100 no-print"
          style={{ boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 rounded-t-xl">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Coincidencias del Catálogo ({combinedMatches.length})</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono lowercase">↑↓ enter</span>
          </div>

          <ul className="max-h-64 overflow-y-auto divide-y divide-neutral-100 py-1">
            {combinedMatches.map((item, index) => {
              const isSelected = index === highlightedIndex;
              return (
                <li
                  key={`${item.text}-${index}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.text);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected ? 'bg-amber-100/90 text-amber-950 font-bold' : 'hover:bg-amber-50/60 text-neutral-800 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.isCatalog ? (
                      <Package className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-700' : 'text-amber-500'}`} />
                    ) : (
                      <History className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-700' : 'text-neutral-400'}`} />
                    )}
                    {item.code && (
                      <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                        {item.code}
                      </span>
                    )}
                    <span className="truncate">{item.text}</span>
                  </div>
                  {item.count && item.count > 1 && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-mono">
                      {item.count}x
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-1.5 text-[11px] bg-neutral-50 border-t border-neutral-100 text-neutral-500 flex justify-between items-center rounded-b-xl">
            <span>Filtro automático en cascada (código o nombre)</span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
              className="text-neutral-400 hover:text-neutral-600 font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
