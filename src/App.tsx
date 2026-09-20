import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Plus,
  Save,
  Building2,
  History,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Play,
  FileCheck,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Home,
  FileText,
  Sliders,
  User,
  KeyRound,
  Smartphone,
} from 'lucide-react';
import {
  Invoice,
  CompanyData,
  ClientData,
  ProviderData,
  InvoiceItem,
  ConceptHistoryItem,
  AuthUser,
  BillableProduct,
} from './types';
import {
  generateInvoiceNumber,
  parseInvoiceSequence,
  getTodayIso,
} from './utils/formatters';
import { generateVeriFactuRecord } from './utils/verifactu';
import { loadConceptsMemory, addConceptToMemory } from './utils/conceptsMemory';
import {
  getStoredClients,
  saveClientToDb,
  deleteClientFromDb,
  getStoredProviders,
  saveProviderToDb,
  deleteProviderFromDb,
  setDefaultProviderInDb,
  getStoredInvoices,
  saveInvoiceToDb,
  deleteInvoiceFromDb,
  getStoredProducts,
  saveProductToDb,
  deleteProductFromDb,
} from './utils/database';
import { getStoredAuthUser, setRememberDevice } from './utils/auth';
import { GestarianSplash } from './components/GestarianSplash';
import { HomeScreen } from './components/HomeScreen';
import { A4InvoiceDocument } from './components/A4InvoiceDocument';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { ReceivedInvoicesScreen } from './components/ReceivedInvoicesScreen';
import { ReceivedInvoice } from './types';
import { loadReceivedInvoices, saveReceivedInvoicesList } from './services/receivedInvoicesService';
import { ConfigModal } from './components/ConfigModal';
import { InvoicesHistoryModal } from './components/InvoicesHistoryModal';
import { VeriFactuModal } from './components/VeriFactuModal';
import { ClientsDatabaseModal } from './components/ClientsDatabaseModal';
import { NewClientFullScreenForm } from './components/NewClientFullScreenForm';
import { ProvidersDatabaseModal } from './components/ProvidersDatabaseModal';
import { ComplexBudgetModal } from './components/ComplexBudgetModal';
import { AuthModal } from './components/AuthModal';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { ProductsDatabaseModal } from './components/ProductsDatabaseModal';

// Storage keys
const STORAGE_COMPANY_KEY = 'gestarian_company_data';
const STORAGE_SEQ_KEY = 'gestarian_invoice_sequence';
const STORAGE_CURRENT_KEY = 'gestarian_active_invoice';
const STORAGE_VIEW_KEY = 'gestarian_active_view';

export default function App() {
  // Splash screen state: default to false so the application is instantly visible on load / preview!
  const [showSplash, setShowSplash] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active page: 0 = Inicio, 1 = Generar Factura (Hoja A4), 2 = Facturas Recibidas (Gastos/OCR), 3 = Configuración
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToPage = useCallback((pageIndex: number) => {
    const valid = Math.max(0, Math.min(3, pageIndex));
    setActivePageIndex(valid);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const width = container.clientWidth;
      container.scrollTo({
        left: width * valid,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      if (page >= 0 && page <= 3 && page !== activePageIndex) {
        setActivePageIndex(page);
      }
    }
  };

  // Re-align scroll on window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = width * activePageIndex;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activePageIndex]);

  // Database states
  const [clients, setClients] = useState<ClientData[]>(() => getStoredClients());
  const [providers, setProviders] = useState<ProviderData[]>(() => getStoredProviders());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [receivedInvoices, setReceivedInvoices] = useState<ReceivedInvoice[]>(() =>
    loadReceivedInvoices()
  );

  const handleSaveReceivedInvoice = (newInv: ReceivedInvoice) => {
    setReceivedInvoices((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === newInv.id);
      let updated: ReceivedInvoice[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = newInv;
      } else {
        updated = [newInv, ...prev];
      }
      saveReceivedInvoicesList(updated);
      return updated;
    });
    showToast(`Factura de "${newInv.supplierName}" guardada en Facturas Recibidas.`);
  };

  const handleDeleteReceivedInvoice = (id: string) => {
    setReceivedInvoices((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveReceivedInvoicesList(updated);
      return updated;
    });
    showToast('Factura recibida eliminada.');
  };

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInvoicesHistoryOpen, setIsInvoicesHistoryOpen] = useState(false);
  const [isVeriFactuOpen, setIsVeriFactuOpen] = useState(false);
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [isNewClientFormOpen, setIsNewClientFormOpen] = useState(false);
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
  const [isComplexBudgetModalOpen, setIsComplexBudgetModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [productsModalMode, setProductsModalMode] = useState<'select' | 'manage'>('select');
  const [targetLineIndexForProduct, setTargetLineIndexForProduct] = useState<number | null>(null);

  // Billable products catalog
  const [products, setProducts] = useState<BillableProduct[]>(() => getStoredProducts());

  // Toast notification
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Concepts memory state
  const [concepts, setConcepts] = useState<ConceptHistoryItem[]>(() => loadConceptsMemory());

  // Sequence state: starts at 0 -> "F260000"
  const [sequence, setSequence] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_SEQ_KEY);
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Default provider as company
  const defaultCompany: CompanyData = providers.find((p) => p.isDefault) || providers[0] || {
    name: 'Gestarian Soluciones Digitales S.L.',
    cif: 'B88994411',
    address: 'Paseo de la Castellana 120, 28046 Madrid',
    phone: '+34 914 556 789',
    email: 'administracion@gestarian.com',
    logoUrl: '',
    iban: 'ES76 2100 0418 4502 0005 1332',
    bankName: 'CaixaBank',
  };

  const defaultClient: ClientData = clients[0] || {
    name: 'Construcciones y Reformas Ibérica S.A.',
    nif: 'A28001122',
    address: 'Av. Diagonal 450, 08006 Barcelona',
    phone: '+34 932 110 099',
    email: 'compras@reformasiberica.es',
  };

  // Active invoice state
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const initialNum = generateInvoiceNumber(sequence);
    return {
      id: `inv-${Date.now()}`,
      number: initialNum,
      date: getTodayIso(),
      dueDate: '',
      company: defaultCompany,
      client: defaultClient,
      items: [
        {
          id: 'item-1',
          concept: 'Confección e instalación de cortina a medida — Lino rústico arena | Fruncido: 200% | 3.80 ml | 9.50 m²',
          units: 1,
          unitPrice: 420,
          total: 420,
        },
      ],
      ivaRate: 21,
      irpfRate: 0,
      paymentMethod: 'Transferencia bancaria',
      status: 'emitida',
      createdAt: Date.now(),
      veriFactu: {
        systemId: 'VF-ES-260000',
        qrPayload: '',
        qrDataUrl: '',
        verificationUrl: '',
        chainHash: '',
        timestamp: new Date().toISOString(),
        isVerified: true,
      },
    };
  });

  // Show temporary toast message
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Recompute Veri*Factu whenever total, number, date or CIF changes
  const updateVeriFactu = useCallback(async (inv: Invoice) => {
    const base = inv.items.reduce((s, it) => s + (it.total || 0), 0);
    const totalWithIva = base * (1 + inv.ivaRate / 100);

    const veriFactuResult = await generateVeriFactuRecord({
      cifEmisor: inv.company.cif,
      numeroFactura: inv.number,
      fechaExpedicion: inv.date,
      totalFactura: totalWithIva,
    });

    return {
      ...inv,
      veriFactu: veriFactuResult,
    };
  }, []);

  // Initial Veri*Factu calculation if missing QR
  useEffect(() => {
    if (!currentInvoice.veriFactu.qrDataUrl) {
      updateVeriFactu(currentInvoice).then((updated) => {
        setCurrentInvoice(updated);
      });
    }
  }, []);

  // Debounced recalculation of Veri*Factu when invoice changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      const base = currentInvoice.items.reduce((s, it) => s + (it.total || 0), 0);
      const total = base * (1 + currentInvoice.ivaRate / 100);
      const vf = await generateVeriFactuRecord({
        cifEmisor: currentInvoice.company.cif,
        numeroFactura: currentInvoice.number,
        fechaExpedicion: currentInvoice.date,
        totalFactura: total,
      });
      setCurrentInvoice((prev) => ({
        ...prev,
        veriFactu: vf,
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [
    currentInvoice.items,
    currentInvoice.number,
    currentInvoice.date,
    currentInvoice.company.cif,
    currentInvoice.ivaRate,
  ]);

  // Persist current active invoice
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(currentInvoice));
    } catch (e) {
      console.error('Error saving active invoice to storage:', e);
    }
  }, [currentInvoice]);

  // Invoice saved state for enabling WhatsApp and Print buttons
  const [isInvoiceSaved, setIsInvoiceSaved] = useState<boolean>(() => {
    try {
      const stored = getStoredInvoices();
      const current = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (current) {
        const parsed = JSON.parse(current);
        return stored.some((inv) => inv.id === parsed.id || inv.number === parsed.number);
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  // Handle invoice modification
  const handleInvoiceChange = (updated: Invoice) => {
    setCurrentInvoice(updated);
    setIsInvoiceSaved(false);
  };

  // Create new invoice with auto-incremented correlative number and switch to invoice view
  const handleNewInvoice = async () => {
    setIsInvoiceSaved(false);
    const nextSeq = sequence + 1;
    const nextNumber = generateInvoiceNumber(nextSeq);
    setSequence(nextSeq);
    localStorage.setItem(STORAGE_SEQ_KEY, nextSeq.toString());

    const activeProvider = providers.find((p) => p.isDefault) || providers[0] || defaultCompany;

    const emptyInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: nextNumber,
      date: getTodayIso(),
      dueDate: '',
      company: { ...activeProvider },
      client: {
        name: '',
        nif: '',
        address: '',
        phone: '',
        email: '',
      },
      items: [
        {
          id: `item-${Date.now()}`,
          concept: '',
          units: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
      ivaRate: 21,
      irpfRate: 0,
      paymentMethod: 'Transferencia bancaria',
      status: 'emitida',
      createdAt: Date.now(),
      veriFactu: {
        systemId: `VF-ES-${nextNumber}`,
        qrPayload: '',
        qrDataUrl: '',
        verificationUrl: '',
        chainHash: '',
        timestamp: new Date().toISOString(),
        isVerified: true,
      },
    };

    const finalInvoice = await updateVeriFactu(emptyInvoice);
    setCurrentInvoice(finalInvoice);
    scrollToPage(1);
    showToast(`Nueva factura generada: ${nextNumber}`);
  };

  // Save current invoice into history list and database
  const handleSaveInvoice = () => {
    const updatedInvoices = saveInvoiceToDb(currentInvoice);
    setInvoices(updatedInvoices);
    setIsInvoiceSaved(true);

    // If current invoice's client has name and nif, ensure saved in clients DB
    if (currentInvoice.client.name && currentInvoice.client.nif) {
      const savedClient = saveClientToDb(currentInvoice.client);
      setClients(getStoredClients());
    }

    // Update sequence if current number is higher
    const curSeq = parseInvoiceSequence(currentInvoice.number);
    if (curSeq >= sequence) {
      setSequence(curSeq);
      localStorage.setItem(STORAGE_SEQ_KEY, curSeq.toString());
    }

    showToast(`Factura ${currentInvoice.number} guardada permanentemente en la base de datos`);
  };

  // Select an invoice from history
  const handleSelectFromHistory = (selected: Invoice) => {
    setCurrentInvoice(selected);
    setIsInvoiceSaved(true);
    scrollToPage(1);
    showToast(`Cargada la factura ${selected.number}`);
  };

  // Delete an invoice from history
  const handleDeleteFromHistory = (id: string) => {
    const updated = deleteInvoiceFromDb(id);
    setInvoices(updated);
    showToast('Factura eliminada del historial', 'info');
  };

  // --- CLIENT ACTIONS ---

  const handleSelectClient = (client: ClientData) => {
    setIsInvoiceSaved(false);
    setCurrentInvoice((prev) => ({
      ...prev,
      client: {
        name: client.name,
        nif: client.nif,
        address: client.address || '',
        phone: client.phone || '',
        email: client.email || '',
      },
    }));
    scrollToPage(1);
    showToast(`Cliente seleccionado: ${client.name}`);
  };

  const handleSaveNewClient = (client: ClientData, assignToInvoice: boolean) => {
    const saved = saveClientToDb(client);
    setClients(getStoredClients());

    if (assignToInvoice) {
      handleSelectClient(saved);
      scrollToPage(1);
    }

    showToast(`Cliente "${saved.name}" registrado en la Base de Datos`);
  };

  const handleDeleteClient = (id: string) => {
    const updated = deleteClientFromDb(id);
    setClients(updated);
    showToast('Cliente eliminado de la base de datos', 'info');
  };

  // --- PROVIDER / COMPANY FULL ACTIONS ---

  const handleSaveCompanyFull = (newCompany: CompanyData) => {
    setCurrentInvoice((prev) => ({
      ...prev,
      company: newCompany,
    }));
    const providerItem: ProviderData = {
      id: newCompany.id || `prov-${Date.now()}`,
      name: newCompany.name,
      cif: newCompany.cif,
      address: newCompany.address,
      phone: newCompany.phone,
      email: newCompany.email,
      logoUrl: newCompany.logoUrl,
      iban: newCompany.iban,
      bankName: newCompany.bankName,
      isDefault: true,
      createdAt: Date.now(),
    };
    saveProviderToDb(providerItem);
    setProviders(getStoredProviders());
    localStorage.setItem(STORAGE_COMPANY_KEY, JSON.stringify(newCompany));
    showToast(`Datos de "${newCompany.name}" actualizados y sincronizados`);
  };

  const handleSelectProvider = (provider: ProviderData) => {
    setCurrentInvoice((prev) => ({
      ...prev,
      company: {
        id: provider.id,
        name: provider.name,
        cif: provider.cif,
        address: provider.address,
        phone: provider.phone,
        email: provider.email,
        logoUrl: provider.logoUrl,
        iban: provider.iban,
        bankName: provider.bankName,
      },
    }));
    showToast(`Empresa emisora asignada: ${provider.name}`);
  };

  const handleSaveProvider = (provider: ProviderData) => {
    saveProviderToDb(provider);
    setProviders(getStoredProviders());
    showToast(`Proveedor/Empresa "${provider.name}" guardado`);
  };

  const handleDeleteProvider = (id: string) => {
    const updated = deleteProviderFromDb(id);
    setProviders(updated);
    showToast('Proveedor eliminado de la base de datos', 'info');
  };

  const handleSetDefaultProvider = (id: string) => {
    const updated = setDefaultProviderInDb(id);
    setProviders(updated);
    showToast('Proveedor marcado como predeterminado');
  };

  // --- COMPLEX BUDGET ITEM INSERTION ---

  const handleInsertComplexBudgetItem = (item: InvoiceItem) => {
    // If the invoice only has 1 item and it is empty, replace it; otherwise append
    let updatedItems: InvoiceItem[];
    if (
      currentInvoice.items.length === 1 &&
      !currentInvoice.items[0].concept &&
      currentInvoice.items[0].total === 0
    ) {
      updatedItems = [item];
    } else {
      updatedItems = [...currentInvoice.items, item];
    }

    setCurrentInvoice((prev) => ({
      ...prev,
      items: updatedItems,
    }));
    setIsInvoiceSaved(false);

    // Learn item title in memory
    addConceptToMemory(item.concept);
    setConcepts(loadConceptsMemory());

    showToast('Línea de Factura Compleja insertada en la factura');
  };

  // --- BILLABLE PRODUCTS ACTIONS ---

  const handleOpenAttachProduct = (lineIndex?: number) => {
    setTargetLineIndexForProduct(lineIndex !== undefined ? lineIndex : null);
    setProductsModalMode('select');
    setIsProductsModalOpen(true);
  };

  const handleOpenProductsDb = () => {
    setTargetLineIndexForProduct(null);
    setProductsModalMode('manage');
    setIsProductsModalOpen(true);
  };

  const handleSelectProduct = (product: BillableProduct) => {
    setCurrentInvoice((prev) => {
      const updatedItems = [...prev.items];
      const targetIdx = targetLineIndexForProduct;

      if (targetIdx !== null && targetIdx >= 0 && targetIdx < updatedItems.length) {
        // Place the product name directly into the targeted concept line
        const existing = updatedItems[targetIdx];
        const newUnitPrice =
          existing.unitPrice === 0 && product.price !== undefined && product.price > 0
            ? product.price
            : existing.unitPrice;
        const newUnits = existing.units || 1;
        updatedItems[targetIdx] = {
          ...existing,
          concept: product.name,
          unitPrice: newUnitPrice,
          total: newUnits * newUnitPrice,
          productId: product.id,
          productImageUrl: product.imageUrl,
        };
      } else {
        // Find first empty line, or add a new line
        const emptyIdx = updatedItems.findIndex((item) => !item.concept.trim());
        const price = product.price !== undefined && product.price > 0 ? product.price : 0;
        if (emptyIdx >= 0) {
          const existing = updatedItems[emptyIdx];
          const finalPrice = existing.unitPrice > 0 ? existing.unitPrice : price;
          const units = existing.units || 1;
          updatedItems[emptyIdx] = {
            ...existing,
            concept: product.name,
            unitPrice: finalPrice,
            total: units * finalPrice,
            productId: product.id,
            productImageUrl: product.imageUrl,
          };
        } else {
          updatedItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            concept: product.name,
            units: 1,
            unitPrice: price,
            total: price,
            productId: product.id,
            productImageUrl: product.imageUrl,
          });
        }
      }

      return {
        ...prev,
        items: updatedItems,
      };
    });

    setIsInvoiceSaved(false);
    addConceptToMemory(product.name);
    setConcepts(loadConceptsMemory());
    setIsProductsModalOpen(false);
    showToast(`Producto "${product.name}" puesto en la línea de concepto`);
  };

  const handleSaveProduct = (prod: BillableProduct) => {
    const saved = saveProductToDb(prod);
    setProducts(getStoredProducts());
    showToast(`Producto "${saved.name}" guardado en la base de datos.`);
  };

  const handleDeleteProduct = (id: string) => {
    const remaining = deleteProductFromDb(id);
    setProducts(remaining);
    showToast('Producto eliminado del catálogo.', 'info');
  };

  // Trigger Print dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col selection:bg-amber-400 selection:text-neutral-950 font-sans">
      {/* Intro Splash Screen "Gestarian Quick" (Appears at application start) */}
      <AnimatePresence>
        {showSplash && (
          <GestarianSplash
            currentUser={currentUser}
            onUserChange={setCurrentUser}
            onEnter={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      {/* Main App Top Navigation Bar (Ultra-clean, compact, single-row, zero mobile clutter) */}
      <header className="no-print sticky top-0 z-30 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 py-2 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 h-9">
          {/* Brand & Home Navigation */}
          <button
            type="button"
            id="header-brand-logo-btn"
            onClick={() => scrollToPage(0)}
            title="Ir a Inicio"
            className="group flex items-center gap-2 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-xs text-amber-400">G</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-extralight tracking-[0.22em] text-xs sm:text-sm text-stone-100 uppercase"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                GESTARIAN
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Quick</span>
            </div>
          </button>

          {/* Clean Minimalist Page Switch (1. Inicio · 2. Hoja A4 · 3. Facturas Recibidas · 4. Configuración) */}
          <nav aria-label="Pantallas principales" className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              id="nav-page-home-btn"
              onClick={() => scrollToPage(0)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePageIndex === 0
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Inicio
            </button>
            <button
              type="button"
              id="nav-page-invoice-btn"
              onClick={() => scrollToPage(1)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePageIndex === 1
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hoja A4
            </button>
            <button
              type="button"
              id="nav-page-received-invoices-btn"
              onClick={() => scrollToPage(2)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activePageIndex === 2
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Facturas Recibidas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                {receivedInvoices.length}
              </span>
            </button>
            <button
              type="button"
              id="nav-page-config-btn"
              onClick={() => scrollToPage(3)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePageIndex === 3
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Configuración
            </button>
          </nav>
        </div>
      </header>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {notification && (
          <div className="fixed bottom-16 right-6 z-50 bg-neutral-950 text-stone-100 px-4 py-3 rounded-xl border border-neutral-700 shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content: 4 Pages with Lateral Scroll (Desplazamiento Lateral) */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative bg-neutral-900/95">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="lateral-scroll-container flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Página 1: Inicio */}
          <section
            id="page-screen-home"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto min-h-[calc(100vh-130px)] pb-16"
          >
            <HomeScreen
              onNewInvoice={handleNewInvoice}
              onOpenInvoicesDb={() => setIsInvoicesHistoryOpen(true)}
              onOpenClientsDb={() => setIsClientsModalOpen(true)}
              onOpenProvidersDb={() => setIsProvidersModalOpen(true)}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              onGoToActiveInvoice={() => scrollToPage(1)}
              onGoToReceivedInvoices={() => scrollToPage(2)}
              receivedInvoicesCount={receivedInvoices.length}
              onGoToConfig={() => scrollToPage(3)}
              onReplaySplash={() => setShowSplash(true)}
              invoices={invoices}
              clients={clients}
              providers={providers}
              currentInvoice={currentInvoice}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSaveDeviceData={() => {
                setRememberDevice(true);
                if (currentUser) {
                  setCurrentUser({ ...currentUser, rememberDevice: true });
                  showToast('Datos guardados en este dispositivo. Acceso directo activo.');
                }
              }}
            />
          </section>

          {/* Página 2: Generar Factura (Hoja A4 completamente limpia para cumplimentar) */}
          <section
            id="page-screen-invoice"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto min-h-[calc(100vh-80px)] py-4 sm:py-8 pb-20"
          >
            <A4InvoiceDocument
              invoice={currentInvoice}
              onChangeInvoice={handleInvoiceChange}
              onOpenConfig={() => scrollToPage(3)}
              concepts={concepts}
              onConceptCommitted={() => setConcepts(loadConceptsMemory())}
              onOpenVeriFactuModal={() => setIsVeriFactuOpen(true)}
              clients={clients}
              onSelectClient={handleSelectClient}
              onOpenClientsSearch={() => setIsClientsModalOpen(true)}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              onOpenProvidersModal={() => setIsProvidersModalOpen(true)}
              onOpenComplexBudgetModal={() => setIsComplexBudgetModalOpen(true)}
              onOpenAttachProduct={handleOpenAttachProduct}
              onSaveInvoice={handleSaveInvoice}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenEmailModal={() => setIsEmailModalOpen(true)}
              onPrint={handlePrint}
              isSaved={isInvoiceSaved}
            />
          </section>

          {/* Página 3: Facturas Recibidas y Gastos (Manual & OCR con Cámara Gemini) */}
          <section
            id="page-screen-received-invoices"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto min-h-[calc(100vh-80px)] pb-20"
          >
            <ReceivedInvoicesScreen
              invoices={receivedInvoices}
              onSaveInvoice={handleSaveReceivedInvoice}
              onDeleteInvoice={handleDeleteReceivedInvoice}
              providers={providers}
            />
          </section>

          {/* Página 4: Configuración (Visualización y edición de datos de empresa y botones grandes) */}
          <section
            id="page-screen-config"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto min-h-[calc(100vh-80px)] pb-20"
          >
            <ConfigurationScreen
              company={currentInvoice.company}
              onSaveCompany={handleSaveCompanyFull}
              providers={providers}
              onOpenProvidersDb={() => setIsProvidersModalOpen(true)}
              clients={clients}
              onOpenClientsDb={() => setIsClientsModalOpen(true)}
              onOpenClientsSearch={() => setIsClientsModalOpen(true)}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              invoices={invoices}
              onOpenInvoicesDb={() => setIsInvoicesHistoryOpen(true)}
              onOpenVeriFactuModal={() => setIsVeriFactuOpen(true)}
              onOpenComplexBudgetModal={() => setIsComplexBudgetModalOpen(true)}
              currentSequence={sequence}
              onOpenConfigModal={() => setIsConfigOpen(true)}
              concepts={concepts}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSaveDeviceData={() => {
                setRememberDevice(true);
                if (currentUser) {
                  setCurrentUser({ ...currentUser, rememberDevice: true });
                  showToast('Datos guardados en este dispositivo.');
                }
              }}
              onGoToInvoice={() => scrollToPage(1)}
              onGoToReceivedInvoices={() => scrollToPage(2)}
              receivedInvoicesCount={receivedInvoices.length}
              products={products}
              onOpenProductsDb={handleOpenProductsDb}
              currentInvoice={currentInvoice}
              onNewInvoice={handleNewInvoice}
              onPrintInvoice={() => {
                scrollToPage(1);
                setTimeout(() => handlePrint(), 200);
              }}
              onReplaySplash={() => setShowSplash(true)}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenEmailModal={() => setIsEmailModalOpen(true)}
            />
          </section>
        </div>

        {/* Lateral Scroll Floating Navigation Dock (Appears when scrolling or when activePageIndex > 0) */}
        <AnimatePresence>
          {activePageIndex > 0 && (
            <motion.aside
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              aria-label="Navegación lateral de páginas"
              className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-950/95 backdrop-blur-md border border-neutral-700/90 rounded-full px-3 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-2 text-xs"
            >
              <button
                type="button"
                id="scroll-prev-page-btn"
                disabled={activePageIndex === 0}
                onClick={() => scrollToPage(activePageIndex - 1)}
                className="p-1.5 rounded-full text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2 border-x border-neutral-800">
                {[
                  { label: '1. Inicio', index: 0 },
                  { label: '2. Factura A4', index: 1 },
                  { label: '3. Facturas Recibidas', index: 2 },
                  { label: '4. Configuración', index: 3 },
                ].map((tab) => (
                  <button
                    key={tab.index}
                    type="button"
                    id={`dock-page-btn-${tab.index}`}
                    onClick={() => scrollToPage(tab.index)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activePageIndex === tab.index
                        ? 'bg-amber-400 text-neutral-950 shadow-md scale-105'
                        : 'text-neutral-400 hover:text-stone-200 hover:bg-neutral-900'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activePageIndex === tab.index ? 'bg-neutral-950' : 'bg-neutral-500'
                      }`}
                    />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                id="scroll-next-page-btn"
                disabled={activePageIndex === 3}
                onClick={() => scrollToPage(activePageIndex + 1)}
                className="p-1.5 rounded-full text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Full Screen Dialogs */}
      <ClientsDatabaseModal
        isOpen={isClientsModalOpen}
        onClose={() => setIsClientsModalOpen(false)}
        clients={clients}
        onSelectClient={handleSelectClient}
        onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
        onDeleteClient={handleDeleteClient}
      />

      <NewClientFullScreenForm
        isOpen={isNewClientFormOpen}
        onClose={() => setIsNewClientFormOpen(false)}
        onSaveClient={handleSaveNewClient}
      />

      <ProvidersDatabaseModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        providers={providers}
        onSelectProvider={handleSelectProvider}
        onSaveProvider={handleSaveProvider}
        onDeleteProvider={handleDeleteProvider}
        onSetDefaultProvider={handleSetDefaultProvider}
      />

      <ComplexBudgetModal
        isOpen={isComplexBudgetModalOpen}
        onClose={() => setIsComplexBudgetModalOpen(false)}
        onInsertItem={handleInsertComplexBudgetItem}
      />

      <ProductsDatabaseModal
        isOpen={isProductsModalOpen}
        onClose={() => setIsProductsModalOpen(false)}
        products={products}
        onSelectProduct={handleSelectProduct}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        mode={productsModalMode}
        targetLineLabel={
          targetLineIndexForProduct !== null
            ? `línea ${targetLineIndexForProduct + 1}`
            : undefined
        }
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        company={currentInvoice.company}
        onSaveCompany={(newComp) => {
          handleSelectProvider(newComp as ProviderData);
          saveProviderToDb(newComp as ProviderData);
          setProviders(getStoredProviders());
        }}
        currentSequence={sequence}
        onSaveSequence={(newSeq) => {
          setSequence(newSeq);
          localStorage.setItem(STORAGE_SEQ_KEY, newSeq.toString());
        }}
        onConceptsUpdated={() => setConcepts(loadConceptsMemory())}
      />

      <InvoicesHistoryModal
        isOpen={isInvoicesHistoryOpen}
        onClose={() => setIsInvoicesHistoryOpen(false)}
        invoices={invoices}
        currentInvoiceId={currentInvoice.id}
        onSelectInvoice={handleSelectFromHistory}
        onDeleteInvoice={handleDeleteFromHistory}
        onNewInvoice={handleNewInvoice}
      />

      <VeriFactuModal
        isOpen={isVeriFactuOpen}
        onClose={() => setIsVeriFactuOpen(false)}
        invoice={currentInvoice}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(u) => setCurrentUser(u)}
        onToast={(msg, type) => showToast(msg, type)}
      />

      <WhatsAppDispatchModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        invoice={currentInvoice}
        onDispatchComplete={(record) => {
          showToast(`Factura ${record.invoiceNumber} enviada vía Notificaciones Gestarian`);
        }}
      />

      <EmailDispatchModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        invoice={currentInvoice}
        onDispatchComplete={(record) => {
          showToast(`Factura ${record.invoiceNumber} enviada vía Email (${record.recipientEmail})`);
        }}
      />
    </div>
  );
}
