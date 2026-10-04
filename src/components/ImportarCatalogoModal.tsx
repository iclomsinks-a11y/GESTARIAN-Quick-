import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Globe,
  FileText,
  Code2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Check,
  PackagePlus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, BillableProduct } from '../types';
import {
  ExtractedCatalogItem,
  parseCatalogFromTextOrHtml,
  parseCatalogWithGeminiAi,
  fetchCatalogFromWebUrl,
  formatConceptWithCode,
} from '../services/catalogImporterService';

interface ImportarCatalogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData;
  onImportProducts: (products: BillableProduct[], replaceMode: boolean) => void;
}

export const ImportarCatalogoModal: React.FC<ImportarCatalogoModalProps> = ({
  isOpen,
  onClose,
  client,
  onImportProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'paste'>('file');
  const [webUrl, setWebUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [useAiParsing, setUseAiParsing] = useState(true);

  // Parsing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted items list
  const [extractedItems, setExtractedItems] = useState<ExtractedCatalogItem[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [editingItemId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(`Leyendo archivo "${file.name}"...`);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = (event.target?.result as string) || '';
        await processContent(content, `Archivo ${file.name}`);
      };
      reader.readAsText(file);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al leer el archivo.');
      setIsProcessing(false);
    }
  };

  const handleFetchWebUrl = async () => {
    if (!webUrl.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(`Conectando con la URL "${webUrl}"...`);

    try {
      const res = await fetchCatalogFromWebUrl(webUrl);
      if (!res.success || !res.content) {
        throw new Error(res.error || 'No se pudo obtener el catálogo de la web.');
      }

      await processContent(res.content, `Dirección Web ${webUrl}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'No se pudo acceder a la URL.');
      setIsProcessing(false);
    }
  };

  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Procesando texto/código introducido...');

    await processContent(pastedText, 'Texto introducido');
  };

  const processContent = async (rawContent: string, sourceName: string) => {
    try {
      let items: ExtractedCatalogItem[] = [];

      if (useAiParsing) {
        setStatusMessage(`Analizando con IA el catálogo de ${client.name}...`);
        const aiRes = await parseCatalogWithGeminiAi(rawContent, client.name);
        if (aiRes.items && aiRes.items.length > 0) {
          items = aiRes.items;
        } else {
          items = parseCatalogFromTextOrHtml(rawContent);
        }
      } else {
        items = parseCatalogFromTextOrHtml(rawContent);
      }

      if (items.length === 0) {
        setErrorMessage(
          'No se pudieron detectar productos con un formato válido. Revisa que el archivo contenga conceptos, filas o lista de elementos.'
        );
      } else {
        setExtractedItems(items);
        setStatusMessage(
          `¡Éxito! Se han detectado ${items.length} productos en ${sourceName}.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el catálogo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = extractedItems.every((it) => it.selected);
    setExtractedItems((prev) =>
      prev.map((it) => ({ ...it, selected: !allSelected }))
    );
  };

  const handleToggleItem = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleDeleteItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, name: string, description?: string, price?: number) => {
    setExtractedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, name, description, price } : it))
    );
  };

  const handleConfirmImport = () => {
    const selected = extractedItems.filter((it) => it.selected);
    if (selected.length === 0) return;

    // Do NOT include fixed prices; prices vary and will be filled directly on the invoice
    // Ensure product concept includes code first if code is available
    const newProducts: BillableProduct[] = selected.map((it) => {
      const formattedName = formatConceptWithCode(it.code, it.name);
      return {
        id: `prod-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: it.code?.trim() || undefined,
        name: formattedName,
        description: it.description?.trim() || undefined,
        price: undefined, // Filled directly on invoice
        createdAt: Date.now(),
      };
    });

    onImportProducts(newProducts, replaceMode);
    onClose();
  };

  const selectedCount = extractedItems.filter((it) => it.selected).length;
  const filteredDisplayItems = extractedItems.filter((it) =>
    it.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (it.description && it.description.toLowerCase().includes(filterSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Subir Catálogo Completo
              </h2>
              <p className="text-xs text-neutral-400 leading-tight mt-0.5">
                Cliente: <strong className="text-amber-400">{client.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Input source tabs if no items parsed yet */}
          {extractedItems.length === 0 && (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Archivo (.txt / .html)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'url'
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Dirección Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>Pegar Texto/HTML</span>
                </button>
              </div>

              {/* Toggle IA Parsing */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-200">
                    Analizador inteligente con IA (Gemini)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAiParsing(!useAiParsing)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    useAiParsing ? 'bg-amber-400' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-neutral-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      useAiParsing ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Tab 1: Subir Archivo (.txt, .html) */}
              {activeTab === 'file' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.html,.htm,.csv,.json,text/plain,text/html"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-amber-400/80 bg-neutral-900/50 hover:bg-neutral-900 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800 group-hover:bg-amber-400/20 border border-neutral-700 group-hover:border-amber-400/40 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 transition-colors mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300">
                      Selecciona o arrastra tu archivo de catálogo
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Soporta archivos <strong>.txt, .html, .htm, .csv</strong> y <strong>.json</strong>
                    </p>
                    <span className="mt-3 px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs shadow-md">
                      Examinar archivos
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: URL Web */}
              {activeTab === 'url' && (
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Dirección web del catálogo o tienda online
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="https://fitflamc.com/catalogo.html"
                        className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchWebUrl}
                      disabled={isProcessing || !webUrl.trim()}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      <span>Escanear Web</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Ingresa el enlace web donde esté publicado el catálogo de productos de {client.name}.
                  </p>
                </div>
              )}

              {/* Tab 3: Pegar Texto o Código HTML */}
              {activeTab === 'paste' && (
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Código HTML o Texto del Catálogo
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Pega aquí la lista de productos, tabla HTML, texto con precios..."
                    className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleProcessPastedText}
                    disabled={isProcessing || !pastedText.trim()}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Procesar Catálogo Pegado</span>
                  </button>
                </div>
              )}

              {/* Status and Error Messages */}
              {statusMessage && isProcessing && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Extracted products preview & selection */}
          {extractedItems.length > 0 && (
            <div className="space-y-4">
              {/* Header stats & action bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Productos Detectados ({selectedCount} de {extractedItems.length} seleccionados)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Revisa los productos extraídos para {client.name} antes de guardar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700"
                  >
                    {extractedItems.every((it) => it.selected) ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedItems([]);
                      setErrorMessage(null);
                      setStatusMessage(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Volver a escanear</span>
                  </button>
                </div>
              </div>

              {/* Informational note about prices */}
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-200/90 leading-tight">
                💡 <strong>Nota sobre precios:</strong> Al importar catálogos completos no se fijan precios predeterminados porque pueden variar. Los precios se cumplimentan directamente en la factura al confeccionarla.
              </div>

              {/* Search filter for items */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Buscar en el catálogo detectado..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredDisplayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      item.selected
                        ? 'bg-neutral-900/90 border-amber-400/40'
                        : 'bg-neutral-950 border-neutral-800 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleItem(item.id)}
                      className="mt-1 w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      {editingItemId === item.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateItem(item.id, e.target.value, item.description, item.price)
                            }
                            className="w-full px-2 py-1 bg-neutral-950 border border-amber-400/60 rounded text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            value={item.description || ''}
                            placeholder="Descripción opcional..."
                            onChange={(e) =>
                              handleUpdateItem(item.id, item.name, e.target.value, item.price)
                            }
                            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-300"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded bg-amber-400 text-neutral-950 font-bold text-[10px]"
                          >
                            Listo
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                      Precio en factura
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(editingItemId === item.id ? null : item.id)}
                        className="p-1 rounded text-neutral-500 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mode Options: Append or Replace */}
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Modo de Importación:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      !replaceMode
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={!replaceMode}
                      onChange={() => setReplaceMode(false)}
                      className="accent-amber-400"
                    />
                    <span className="text-xs font-semibold">Añadir a los existentes</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      replaceMode
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={replaceMode}
                      onChange={() => setReplaceMode(true)}
                      className="accent-amber-400"
                    />
                    <span className="text-xs font-semibold">Reemplazar catálogo actual</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {extractedItems.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Importar {selectedCount} Productos a {client.name}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
