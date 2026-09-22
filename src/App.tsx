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
  KeyRound,
  Smartphone,
  Maximize2,
  Minimize2,
  Eye,
  Filter,
} from 'lucide-react';
import {
  Invoice,
  CompanyData,
  ClientData,
  ClientDispatchChannel,
  ProviderData,
  InvoiceItem,
  ConceptHistoryItem,
  AuthUser,
  BillableProduct,
  AppTheme,
} from './types';
import {
  generateInvoiceNumber,
  parseInvoiceSequence,
  getNextCorrelativeInvoiceNumber,
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
  STORAGE_INVOICES_KEY,
} from './utils/database';
import { getStoredAuthUser, setRememberDevice } from './utils/auth';
import {
  notifyVeriFactuVerificationSuccess,
  checkAndNotifyUpcomingPayments,
} from './services/notificationService';
import { GestarianSplash } from './components/GestarianSplash';
import { HomeScreen } from './components/HomeScreen';
import { A4InvoiceDocument } from './components/A4InvoiceDocument';
import { ConfigurationScreen } from './components/ConfigurationScreen';
import { ControlPanelScreen, PeriodType } from './components/ControlPanelScreen';
import { ProvidersScreen } from './components/ProvidersScreen';
import { NewProviderFullScreenForm } from './components/NewProviderFullScreenForm';
import { ReceivedInvoicesScreen } from './components/ReceivedInvoicesScreen';
import { ReceivedInvoice } from './types';
import { loadReceivedInvoices, saveReceivedInvoicesList } from './services/receivedInvoicesService';
import { ConfigModal } from './components/ConfigModal';
import { InvoicesHistoryModal } from './components/InvoicesHistoryModal';
import { VeriFactuModal } from './components/VeriFactuModal';
import { ClientsDatabaseModal } from './components/ClientsDatabaseModal';
import { NewClientFullScreenForm } from './components/NewClientFullScreenForm';
import { NewReceivedInvoiceFullScreenForm } from './components/NewReceivedInvoiceFullScreenForm';
import { ProvidersDatabaseModal } from './components/ProvidersDatabaseModal';
import { AuthModal } from './components/AuthModal';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { ProductsDatabaseModal } from './components/ProductsDatabaseModal';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { ClientsScreen } from './components/ClientsScreen';
import { ClientEditorModal } from './components/ClientEditorModal';
import { IssuedInvoicesScreen } from './components/IssuedInvoicesScreen';
import { getNextCorrelativeRectificativeInvoiceNumber } from './utils/formatters';

// Storage keys
const STORAGE_COMPANY_KEY = 'gestarian_company_data';
const STORAGE_SEQ_KEY = 'gestarian_invoice_sequence';
const STORAGE_CURRENT_KEY = 'gestarian_active_invoice';
const STORAGE_VIEW_KEY = 'gestarian_active_view';

export default function App() {
  // Draggable Fullscreen Toggle for AI Studio Preview Mode only
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pos, setPos] = useState({ x: 40, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0, initialX: 40, initialY: 120 });

  useEffect(() => {
    const isDev = typeof window !== 'undefined' && (
      window.location.hostname.includes('ais-dev-') || 
      window.location.hostname.includes('localhost')
    );
    setIsPreviewMode(isDev);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 50, dragRef.current.initialX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 50, dragRef.current.initialY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Theme state: dark | light | indigo
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('gestarian_app_theme') as AppTheme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('gestarian_app_theme', theme);
  }, [theme]);

  // Splash screen state: default to false so the application is instantly visible on load / preview!
  const [showSplash, setShowSplash] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active page: 0 = Inicio, 1 = Clientes, 2 = Panel de Control, 3 = Proveedores, 4 = Configuración
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const activePageIndexRef = React.useRef<number>(0);
  activePageIndexRef.current = activePageIndex;
  const isProgrammaticScrollingRef = React.useRef<boolean>(false);
  const scrollEndTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [periodType, setPeriodType] = useState<PeriodType>('mensual');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [isFullScreenInvoiceOpen, setIsFullScreenInvoiceOpen] = useState<boolean>(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const PAGE_TITLES = ['Inicio', 'Clientes', 'Panel de Control', 'Proveedores', 'Configuración'];

  const scrollToPage = useCallback((pageIndex: number) => {
    const valid = Math.max(0, Math.min(4, pageIndex));
    setActivePageIndex(valid);
    activePageIndexRef.current = valid;
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const width = container.clientWidth;
      isProgrammaticScrollingRef.current = true;
      container.scrollTo({
        left: width * valid,
        behavior: 'smooth',
      });
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        isProgrammaticScrollingRef.current = false;
      }, 450);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScrollingRef.current) return;
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      if (page >= 0 && page <= 4 && page !== activePageIndexRef.current) {
        setActivePageIndex(page);
        activePageIndexRef.current = page;
      }
    }
  };

  // Wheel / Trackpad listener: strictly 1 page at a time with momentum lock
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isWheelLocked = false;
    let wheelCooldownTimer: NodeJS.Timeout | null = null;

    const onWheel = (e: WheelEvent) => {
      // If the scroll/gesture originates inside the economic chart, let the chart handle its period switching
      if (e.target && (e.target as HTMLElement).closest('#economic-chart-container')) {
        return;
      }

      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);
      const isHorizontal = absDeltaX > absDeltaY || e.shiftKey;

      // Check if user is scrolling horizontally
      if (!isHorizontal || (absDeltaX < 15 && !(e.shiftKey && absDeltaY >= 15))) {
        return;
      }

      e.preventDefault();

      if (isWheelLocked) return;

      const direction = (e.deltaX > 0 || (e.shiftKey && e.deltaY > 0)) ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(4, activePageIndexRef.current + direction));

      if (nextIndex !== activePageIndexRef.current) {
        isWheelLocked = true;
        scrollToPage(nextIndex);
        if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer);
        wheelCooldownTimer = setTimeout(() => {
          isWheelLocked = false;
        }, 500);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
      if (wheelCooldownTimer) clearTimeout(wheelCooldownTimer);
    };
  }, [scrollToPage]);

  // Touch swipe gesture handling for mobile and tablet (desplazamiento lateral con el dedo: 1 página por gesto)
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartTimeRef = React.useRef<number>(0);
  const isTouchSwipingRef = React.useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target && (e.target as HTMLElement).closest('#economic-chart-container')) {
      return;
    }
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isTouchSwipingRef.current = false;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || e.changedTouches.length === 0) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartXRef.current;
    const deltaY = endY - touchStartYRef.current;
    const deltaTime = Date.now() - touchStartTimeRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Detect horizontal swipe: minimum 30px swipe distance, horizontal dominance, within 800ms
    if (Math.abs(deltaX) >= 30 && Math.abs(deltaX) > Math.abs(deltaY) * 0.7 && deltaTime < 800) {
      if (deltaX < 0) {
        // Deslizar hacia la izquierda -> avanzar estrictamente 1 página a la derecha
        if (activePageIndexRef.current < 4) {
          scrollToPage(activePageIndexRef.current + 1);
        }
      } else {
        // Deslizar hacia la derecha -> retroceder estrictamente 1 página a la izquierda
        if (activePageIndexRef.current > 0) {
          scrollToPage(activePageIndexRef.current - 1);
        }
      }
    }
  };

  // Re-align scroll on window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = width * activePageIndexRef.current;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Database states
  const [clients, setClients] = useState<ClientData[]>(() => getStoredClients());
  const [providers, setProviders] = useState<ProviderData[]>(() => getStoredProviders());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [receivedInvoices, setReceivedInvoices] = useState<ReceivedInvoice[]>(() =>
    loadReceivedInvoices()
  );
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [expenseInitialData, setExpenseInitialData] = useState<Partial<ReceivedInvoice> | null>(null);

  // Revisa y sincroniza proveedores: si hay facturas recibidas de proveedores que no están creados, los crea automáticamente
  useEffect(() => {
    try {
      const currentStoredProviders = getStoredProviders();
      const storedReceived = loadReceivedInvoices();
      let hasNewProviders = false;

      storedReceived.forEach((inv) => {
        if (inv.supplierName && inv.supplierName.trim()) {
          const name = inv.supplierName.trim();
          const cif = (inv.supplierCif || '').trim().toUpperCase();
          const exists = currentStoredProviders.some(
            (p) =>
              (cif && p.cif && p.cif.toUpperCase() === cif) ||
              (p.name && p.name.toLowerCase() === name.toLowerCase())
          );

          if (!exists) {
            const newProv: ProviderData = {
              id: `prov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name,
              cif,
              address: inv.supplierAddress || '',
              phone: inv.supplierPhone || '',
              email: inv.supplierEmail || '',
              logoUrl: '',
              isDefault: false,
              createdAt: Date.now(),
            };
            saveProviderToDb(newProv);
            currentStoredProviders.push(newProv);
            hasNewProviders = true;
          }
        }
      });

      if (hasNewProviders) {
        setProviders(getStoredProviders());
      }
    } catch (e) {
      console.error('Error syncing providers from received invoices:', e);
    }
  }, []);

  // Automatic scan and browser alert for upcoming payment due dates
  useEffect(() => {
    if (invoices.length > 0 || receivedInvoices.length > 0) {
      checkAndNotifyUpcomingPayments(invoices, receivedInvoices);
    }
  }, [invoices, receivedInvoices]);

  const handleSaveReceivedInvoice = (newInv: ReceivedInvoice) => {
    // 1. Guardar factura recibida
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

    // 2. Actualizar o crear tarjeta de proveedor en la página de Proveedores
    if (newInv.supplierName && newInv.supplierName.trim()) {
      const trimmedName = newInv.supplierName.trim();
      const trimmedCif = (newInv.supplierCif || '').trim().toUpperCase();
      const currentStoredProviders = getStoredProviders();

      const existingProv = currentStoredProviders.find(
        (p) =>
          (trimmedCif && p.cif && p.cif.toUpperCase() === trimmedCif) ||
          (p.name && p.name.toLowerCase() === trimmedName.toLowerCase())
      );

      if (existingProv) {
        const updatedProvider: ProviderData = {
          ...existingProv,
          name: trimmedName || existingProv.name,
          cif: trimmedCif || existingProv.cif,
          address: newInv.supplierAddress || existingProv.address,
          phone: newInv.supplierPhone || existingProv.phone,
          email: newInv.supplierEmail || existingProv.email,
        };
        saveProviderToDb(updatedProvider);
      } else {
        const newProvider: ProviderData = {
          id: `prov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: trimmedName,
          cif: trimmedCif,
          address: newInv.supplierAddress || '',
          phone: newInv.supplierPhone || '',
          email: newInv.supplierEmail || '',
          logoUrl: '',
          isDefault: false,
          createdAt: Date.now(),
        };
        saveProviderToDb(newProvider);
      }
      setProviders(getStoredProviders());
    }

    showToast(`Factura de "${newInv.supplierName}" guardada y proveedor actualizado.`);
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
  const [selectedClientToEdit, setSelectedClientToEdit] = useState<ClientData | null>(null);
  const [isClientEditorOpen, setIsClientEditorOpen] = useState(false);
  const [isProvidersModalOpen, setIsProvidersModalOpen] = useState(false);
  const [isNewProviderFormOpen, setIsNewProviderFormOpen] = useState(false);
  const [selectedProviderToEdit, setSelectedProviderToEdit] = useState<ProviderData | null>(null);
  const [isComplexBudgetModalOpen, setIsComplexBudgetModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
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

  // Default provider as company from Configuration storage or providers db
  const getConfiguredCompany = (): CompanyData => {
    try {
      const savedComp = localStorage.getItem(STORAGE_COMPANY_KEY);
      if (savedComp) {
        const parsed = JSON.parse(savedComp);
        if (parsed && (parsed.name || parsed.cif)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const defaultProv = providers.find((p) => p.isDefault) || providers[0];
    if (defaultProv) {
      return defaultProv;
    }
    return {
      name: 'Gestarian Soluciones Digitales S.L.',
      cif: 'B88994411',
      address: 'Paseo de la Castellana 120, 28046 Madrid',
      phone: '+34 914 556 789',
      email: 'administracion@gestarian.com',
      logoUrl: '',
      iban: 'ES76 2100 0418 4502 0005 1332',
      bankName: 'CaixaBank',
    };
  };

  const defaultCompany: CompanyData = getConfiguredCompany();

  const defaultClient: ClientData = clients[0] || {
    name: 'Construcciones y Reformas Ibérica S.A.',
    nif: 'A28001122',
    address: 'Av. Diagonal 450, 08006 Barcelona',
    phone: '+34 932 110 099',
    email: 'compras@reformasiberica.es',
  };

  // Active invoice state: always loads the corresponding correlative invoice number
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() => {
    const configuredComp = getConfiguredCompany();
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // If invoice in storage has 'BORRADOR' or no number, automatically assign the next corresponding number
          if (!parsed.number || parsed.number === 'BORRADOR' || parsed.number.includes('BORRADOR')) {
            const { number } = getNextCorrelativeInvoiceNumber();
            parsed.number = number;
            if (parsed.veriFactu) {
              parsed.veriFactu.systemId = `VF-ES-${number}`;
            }
          }
          // Ensure emitter fiscal data is populated from configuration
          if (!parsed.company || !parsed.company.name || parsed.company.name === 'Gestarian Soluciones Digitales S.L.') {
            parsed.company = { ...configuredComp, ...parsed.company, name: configuredComp.name || parsed.company?.name };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const { number: autoNumber } = getNextCorrelativeInvoiceNumber();
    return {
      id: `inv-${Date.now()}`,
      number: autoNumber,
      date: getTodayIso(),
      dueDate: '',
      company: configuredComp,
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
        systemId: `VF-ES-${autoNumber}`,
        qrPayload: '',
        qrDataUrl: '',
        verificationUrl: '',
        chainHash: '',
        timestamp: new Date().toISOString(),
        isVerified: false,
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

  // Create new invoice with automatic correlative invoice number assigned
  const handleNewInvoice = async () => {
    setIsInvoiceSaved(false);
    const activeProvider = getConfiguredCompany();
    const { number: autoNumber, sequence: nextSeq } = getNextCorrelativeInvoiceNumber(invoices);

    const emptyInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: autoNumber,
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
        systemId: `VF-ES-${autoNumber}`,
        qrPayload: '',
        qrDataUrl: '',
        verificationUrl: '',
        chainHash: '',
        timestamp: new Date().toISOString(),
        isVerified: false,
      },
    };

    const finalInvoice = await updateVeriFactu(emptyInvoice);
    setCurrentInvoice(finalInvoice);
    setSequence(nextSeq);
    localStorage.setItem(STORAGE_SEQ_KEY, nextSeq.toString());
    setIsInvoiceSaved(false);
    setIsFullScreenInvoiceOpen(true);
    showToast(`Nueva factura ${autoNumber} lista para cumplimentar.`);
  };

  // View invoice full screen in A4 sheet
  const handleViewInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsInvoiceSaved(true);
    setIsFullScreenInvoiceOpen(true);
  };

  // Create Rectificative Invoice referencing original invoice number
  const handleRectifyInvoice = async (originalInvoice: Invoice) => {
    const { number: autoNumber } = getNextCorrelativeRectificativeInvoiceNumber(invoices);

    const rectificative: Invoice = {
      id: `inv-rect-${Date.now()}`,
      number: autoNumber,
      date: getTodayIso(),
      dueDate: '',
      company: { ...originalInvoice.company },
      client: { ...originalInvoice.client },
      items: originalInvoice.items && originalInvoice.items.length > 0
        ? originalInvoice.items.map((it) => ({
            ...it,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            concept: `Rectificación Fra. ${originalInvoice.number}: ${it.concept}`,
          }))
        : [
            {
              id: `item-${Date.now()}`,
              concept: `Rectificación de Factura ${originalInvoice.number}`,
              units: 1,
              unitPrice: 0,
              total: 0,
            },
          ],
      ivaRate: originalInvoice.ivaRate ?? 21,
      irpfRate: originalInvoice.irpfRate ?? 0,
      paymentMethod: originalInvoice.paymentMethod || 'Transferencia bancaria',
      notes: `Factura rectificativa por sustitución/anulación de la Factura Nº ${originalInvoice.number}.`,
      status: 'emitida',
      createdAt: Date.now(),
      veriFactu: {
        systemId: `VF-ES-${autoNumber}`,
        qrPayload: '',
        qrDataUrl: '',
        verificationUrl: '',
        chainHash: '',
        timestamp: new Date().toISOString(),
        isVerified: false,
      },
    };

    const finalRectificative = await updateVeriFactu(rectificative);
    setCurrentInvoice(finalRectificative);
    setIsInvoiceSaved(false);
    setIsFullScreenInvoiceOpen(true);
    showToast(`Factura Rectificativa ${autoNumber} creada referenciando a ${originalInvoice.number}`);
  };

  // Save current invoice into history list and database
  const handleSaveInvoice = async () => {
    let invoiceToSave = { ...currentInvoice };

    if (!invoiceToSave.number || invoiceToSave.number === 'BORRADOR' || invoiceToSave.number.includes('BORRADOR')) {
      const { number: nextNumber, sequence: nextSeq } = getNextCorrelativeInvoiceNumber(invoices);
      setSequence(nextSeq);
      localStorage.setItem(STORAGE_SEQ_KEY, nextSeq.toString());
      invoiceToSave.number = nextNumber;
      invoiceToSave.veriFactu = {
        ...invoiceToSave.veriFactu,
        systemId: `VF-ES-${nextNumber}`,
        isVerified: true,
        timestamp: new Date().toISOString(),
      };
      invoiceToSave = await updateVeriFactu(invoiceToSave);
    } else {
      const parsedSeq = parseInvoiceSequence(invoiceToSave.number);
      if (parsedSeq > 0) {
        setSequence((prev) => Math.max(prev, parsedSeq));
        localStorage.setItem(STORAGE_SEQ_KEY, Math.max(sequence, parsedSeq).toString());
      }
      invoiceToSave = await updateVeriFactu(invoiceToSave);
    }

    const updatedInvoices = saveInvoiceToDb(invoiceToSave);
    setInvoices(updatedInvoices);
    setCurrentInvoice(invoiceToSave);
    setIsInvoiceSaved(true);

    // If current invoice's client has name and nif, ensure saved in clients DB
    if (invoiceToSave.client.name && invoiceToSave.client.nif) {
      saveClientToDb(invoiceToSave.client);
      setClients(getStoredClients());
    }

    // Trigger browser notification for Veri*Factu verification success
    notifyVeriFactuVerificationSuccess({
      invoiceNumber: invoiceToSave.number,
      clientName: invoiceToSave.client.name,
      totalAmount: invoiceToSave.items.reduce((s, it) => s + (it.total || 0), 0) * (1 + invoiceToSave.ivaRate / 100),
      chainHash: invoiceToSave.veriFactu?.chainHash,
    });

    showToast(`Factura ${invoiceToSave.number} guardada permanentemente en la base de datos`);
  };

  // Select an invoice from history
  const handleSelectFromHistory = (selected: Invoice) => {
    setCurrentInvoice(selected);
    setIsInvoiceSaved(true);
    setIsFullScreenInvoiceOpen(true);
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
    const preferred =
      client.preferredDispatchChannel ||
      (client.defaultSendEmail && !client.defaultSendWhatsApp ? 'email' : 'whatsapp');
    setCurrentInvoice((prev) => ({
      ...prev,
      client: {
        ...client,
        preferredDispatchChannel: preferred,
        defaultSendWhatsApp: preferred === 'whatsapp',
        defaultSendEmail: preferred === 'email',
      },
    }));
    setIsFullScreenInvoiceOpen(true);
    showToast(`Cliente seleccionado: ${client.name}`);
  };

  const handleEditClient = (client: ClientData) => {
    setSelectedClientToEdit(client);
    setIsClientEditorOpen(true);
  };

  const handleSaveEditedClient = (updatedClient: ClientData) => {
    saveClientToDb(updatedClient);
    setClients(getStoredClients());
    if (
      currentInvoice.client.nif === updatedClient.nif ||
      (updatedClient.id && currentInvoice.client.id === updatedClient.id)
    ) {
      setCurrentInvoice((prev) => ({
        ...prev,
        client: {
          ...prev.client,
          ...updatedClient,
        },
      }));
    }
    showToast(`Cliente "${updatedClient.name}" actualizado`);
  };

  const handleUpdateClientPreferredChannel = (clientId: string, channel: ClientDispatchChannel) => {
    const target = clients.find((c) => c.id === clientId || c.nif === clientId);
    if (target) {
      const updated: ClientData = {
        ...target,
        preferredDispatchChannel: channel,
        defaultSendWhatsApp: channel === 'whatsapp',
        defaultSendEmail: channel === 'email',
      };
      saveClientToDb(updated);
      setClients(getStoredClients());
      if (
        currentInvoice.client.nif === updated.nif ||
        (updated.id && currentInvoice.client.id === updated.id)
      ) {
        setCurrentInvoice((prev) => ({
          ...prev,
          client: {
            ...prev.client,
            preferredDispatchChannel: channel,
            defaultSendWhatsApp: channel === 'whatsapp',
            defaultSendEmail: channel === 'email',
          },
        }));
      }
      showToast(`Envío preferente de ${target.name}: ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`);
    }
  };

  const handleSaveNewClient = (client: ClientData, assignToInvoice: boolean) => {
    const saved = saveClientToDb(client);
    setClients(getStoredClients());

    if (assignToInvoice) {
      handleSelectClient(saved);
      scrollToPage(2);
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

  const handleOpenNewProviderForm = () => {
    setSelectedProviderToEdit(null);
    setIsNewProviderFormOpen(true);
  };

  const handleEditProvider = (provider: ProviderData) => {
    setSelectedProviderToEdit(provider);
    setIsNewProviderFormOpen(true);
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
    <div className="h-screen h-[100dvh] w-screen overflow-hidden bg-neutral-900 text-neutral-100 flex flex-col selection:bg-amber-400 selection:text-neutral-950 font-sans">
      {/* Draggable Minimalist Fullscreen Toggle - ONLY in AI Studio Preview Mode */}
      {isPreviewMode && (
        <div
          style={{
            position: 'fixed',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            zIndex: 99999,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-grab active:cursor-grabbing select-none"
          title="Arrastrar y alternar pantalla completa (Modo Preview)"
        >
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border border-neutral-700/80 shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 stroke-[1.5]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 stroke-[1.5]" />
            )}
          </button>
        </div>
      )}

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

      {/* Floating External Preview Controls to Navigate Pages (Outside mobile viewer in preview environment) */}
      <div className="no-print pointer-events-none fixed inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-2 sm:px-4 md:px-8">
        {/* Retroceder de Página (Left button) */}
        <button
          type="button"
          id="btn-preview-prev-page"
          disabled={activePageIndex <= 0}
          onClick={() => scrollToPage(activePageIndex - 1)}
          className={`pointer-events-auto group flex items-center gap-2 p-2.5 sm:px-4 sm:py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
            activePageIndex > 0
              ? 'bg-neutral-950/90 hover:bg-neutral-900 text-stone-100 border-neutral-700/80 hover:border-amber-400/80 hover:shadow-amber-500/10'
              : 'bg-neutral-950/40 text-neutral-600 border-neutral-800/40 cursor-not-allowed opacity-25'
          }`}
          title={
            activePageIndex > 0
              ? `Retroceder a ${PAGE_TITLES[activePageIndex - 1] || 'página anterior'}`
              : 'Primera página'
          }
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:-translate-x-1 transition-transform" />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Retroceder</span>
            <span className="text-xs font-semibold text-stone-200">
              {activePageIndex > 0 ? PAGE_TITLES[activePageIndex - 1] : 'Inicio'}
            </span>
          </div>
        </button>

        {/* Avanzar de Página (Right button) */}
        <button
          type="button"
          id="btn-preview-next-page"
          disabled={activePageIndex >= 4}
          onClick={() => scrollToPage(activePageIndex + 1)}
          className={`pointer-events-auto group flex items-center gap-2 p-2.5 sm:px-4 sm:py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
            activePageIndex < 4
              ? 'bg-neutral-950/90 hover:bg-neutral-900 text-stone-100 border-neutral-700/80 hover:border-amber-400/80 hover:shadow-amber-500/10'
              : 'bg-neutral-950/40 text-neutral-600 border-neutral-800/40 cursor-not-allowed opacity-25'
          }`}
          title={
            activePageIndex < 4
              ? `Avanzar a ${PAGE_TITLES[activePageIndex + 1] || 'página siguiente'}`
              : 'Última página'
          }
        >
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Avanzar</span>
            <span className="text-xs font-semibold text-stone-200">
              {activePageIndex < 4 ? PAGE_TITLES[activePageIndex + 1] : 'Fin'}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main App Top Navigation Bar */}
      {activePageIndex > 0 && (
        <header className={`no-print sticky top-0 z-30 w-full backdrop-blur-md px-3 sm:px-6 py-2 transition-all ${
          theme === 'light'
            ? 'bg-[#f3f4f6]/95 border-b border-neutral-300/80 shadow-sm'
            : theme === 'indigo'
            ? 'bg-[#0b1120]/95 border-b border-[#1e3a5f]'
            : 'bg-neutral-950/95 border-b border-neutral-800/80'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 h-10">
            {/* Izquierda: GESTARIAN con Quick debajo a la derecha */}
            <div className="flex items-center">
              <button
                type="button"
                id="header-brand-logo-btn"
                onClick={() => scrollToPage(0)}
                title="Ir a Inicio"
                className="group flex flex-col items-end text-left cursor-pointer transition-opacity hover:opacity-90"
              >
                <span
                  className={`font-extralight tracking-[0.22em] text-xs sm:text-sm uppercase leading-none ${
                    theme === 'light' ? 'text-[#0f2b5c] font-bold' : 'text-[#FEFCE9]'
                  }`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  GESTARIAN
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-semibold tracking-wider leading-tight mt-0.5 ${
                    theme === 'light' ? 'text-[#0ea5e9]' : theme === 'indigo' ? 'text-[#38bdf8]' : 'text-amber-400'
                  }`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Quick
                </span>
              </button>
            </div>

            {/* Derecha: En Panel de Control (activePageIndex === 2), botón que va alternando entre Mensual, Trimestral y Anual */}
            {activePageIndex === 2 ? (
              <button
                type="button"
                id="btn-header-cycle-period"
                onClick={() => {
                  const nextPeriod: PeriodType =
                    periodType === 'mensual'
                      ? 'trimestral'
                      : periodType === 'trimestral'
                      ? 'anual'
                      : 'mensual';
                  setPeriodType(nextPeriod);
                  showToast(`Filtro: ${nextPeriod.charAt(0).toUpperCase() + nextPeriod.slice(1)}`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm active:scale-95 capitalize"
                title="Pulsar para alternar entre Mensual, Trimestral y Anual"
              >
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-extrabold uppercase tracking-wider text-[11px] sm:text-xs">
                  {periodType === 'mensual'
                    ? 'Mensual'
                    : periodType === 'trimestral'
                    ? 'Trimestral'
                    : 'Anual'}
                </span>
              </button>
            ) : null}
          </div>
        </header>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {notification && (
          <div className="fixed bottom-16 right-6 z-50 bg-neutral-950 text-stone-100 px-4 py-3 rounded-xl border border-neutral-700 shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content: 5 Pages with Lateral Scroll (Desplazamiento Lateral) */}
      <main className={`flex-1 min-h-0 flex flex-col overflow-hidden relative ${activePageIndex === 0 ? 'bg-black' : 'bg-neutral-900/95'}`}>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`lateral-scroll-container flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scroll-smooth touch-pan-x ${
            activePageIndex === 0
              ? theme === 'light'
                ? 'bg-[#faf9f6]'
                : theme === 'indigo'
                ? 'bg-[#080d1a]'
                : 'bg-black'
              : ''
          }`}
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Página 1: Inicio */}
          <section
            id="page-screen-home"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`w-full min-w-full flex-shrink-0 snap-start snap-always overflow-hidden h-full flex flex-col items-center justify-center p-0 m-0 touch-pan-x select-none ${
              theme === 'light' ? 'bg-[#faf9f6]' : theme === 'indigo' ? 'bg-[#080d1a]' : 'bg-black'
            }`}
          >
            <div className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative touch-pan-x ${
              theme === 'light' ? 'bg-[#faf9f6]' : theme === 'indigo' ? 'bg-[#080d1a]' : 'bg-black'
            }`}>
              <HomeScreen
                onNewInvoice={handleNewInvoice}
                onOpenInvoicesDb={() => scrollToPage(2)}
                onOpenClientsDb={() => scrollToPage(1)}
                onOpenProvidersDb={() => scrollToPage(3)}
                onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
                onGoToActiveInvoice={() => scrollToPage(2)}
                onGoToReceivedInvoices={() => scrollToPage(2)}
                receivedInvoicesCount={receivedInvoices.length}
                onGoToConfig={() => scrollToPage(4)}
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
            </div>
          </section>

          {/* Página 2: Clientes (Cartera de clientes con tarjetas, edición y selección de envío preferente) */}
          <section
            id="page-screen-clients"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto pb-8"
          >
            <ClientsScreen
              clients={clients}
              onSelectClientForInvoice={(c) => {
                handleSelectClient(c);
                scrollToPage(2);
              }}
              onEditClient={handleEditClient}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              onDeleteClient={handleDeleteClient}
              onUpdateClientPreferredChannel={handleUpdateClientPreferredChannel}
              onGoToInvoice={() => scrollToPage(2)}
              products={products}
              onOpenProductsDb={handleOpenProductsDb}
              onSaveClient={handleSaveEditedClient}
              onSaveReceivedInvoice={handleSaveReceivedInvoice}
              providers={providers}
            />
          </section>

          {/* Página 3: Panel de Control (Facturas Emitidas y Facturas Recibidas con selección y 7 líneas de cálculo) */}
          <section
            id="page-screen-control-panel"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto pb-8"
          >
            <ControlPanelScreen
              invoices={invoices}
              receivedInvoices={receivedInvoices}
              providers={providers}
              periodType={periodType}
              onPeriodTypeChange={setPeriodType}
              onNewInvoice={handleNewInvoice}
              onViewInvoice={handleViewInvoice}
              onRectifyInvoice={handleRectifyInvoice}
              onDeleteInvoice={handleDeleteFromHistory}
              onOpenWhatsApp={(inv) => {
                setCurrentInvoice(inv);
                setIsInvoiceSaved(true);
                setIsWhatsAppModalOpen(true);
              }}
              onPrintInvoice={(inv) => {
                setCurrentInvoice(inv);
                setIsInvoiceSaved(true);
                setIsPrintPreviewOpen(true);
              }}
              onSaveReceivedInvoice={handleSaveReceivedInvoice}
              onDeleteReceivedInvoice={handleDeleteReceivedInvoice}
            />
          </section>

          {/* Página 4: Proveedores (Página limpia con tarjetas de diseño idéntico a Clientes) */}
          <section
            id="page-screen-providers"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto pb-8"
          >
            <ProvidersScreen
              providers={providers}
              onOpenNewProviderForm={handleOpenNewProviderForm}
              onEditProvider={handleEditProvider}
              onDeleteProvider={handleDeleteProvider}
              onSetDefaultProvider={handleSetDefaultProvider}
              onSelectProviderForExpense={(prov) => {
                setExpenseInitialData({
                  supplierName: prov.name,
                  supplierCif: prov.cif || '',
                  supplierPhone: prov.phone || '',
                  supplierEmail: prov.email || '',
                  supplierAddress: prov.address || '',
                  invoiceNumber: `FAC-${Date.now().toString().slice(-6)}`,
                  date: new Date().toISOString().split('T')[0],
                  concept: '',
                  category: 'Suministros',
                  ivaRate: 21,
                  irpfRate: 0,
                });
                setIsExpenseFormOpen(true);
              }}
            />
          </section>

          {/* Página 5: Configuración (Visualización y edición de datos de empresa y ajustes) */}
          <section
            id="page-screen-config"
            className="w-full min-w-full flex-shrink-0 snap-start snap-always overflow-y-auto pb-8"
          >
            <ConfigurationScreen
              company={currentInvoice.company}
              onSaveCompany={handleSaveCompanyFull}
              currentTheme={theme}
              onSelectTheme={(newTheme) => {
                setTheme(newTheme);
                showToast(`Tema cambiado a ${newTheme === 'light' ? 'Claro' : newTheme === 'indigo' ? 'Cobalto Tech' : 'Oscuro'}`);
              }}
              providers={providers}
              onOpenProvidersDb={() => scrollToPage(3)}
              clients={clients}
              onOpenClientsDb={() => scrollToPage(1)}
              onOpenClientsSearch={() => scrollToPage(1)}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              invoices={invoices}
              onOpenInvoicesDb={() => scrollToPage(2)}
              onOpenVeriFactuModal={() => setIsVeriFactuOpen(true)}
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
              onGoToInvoice={() => scrollToPage(2)}
              onGoToReceivedInvoices={() => scrollToPage(2)}
              receivedInvoices={receivedInvoices}
              receivedInvoicesCount={receivedInvoices.length}
              products={products}
              onOpenProductsDb={handleOpenProductsDb}
              currentInvoice={currentInvoice}
              onNewInvoice={handleNewInvoice}
              onPrintInvoice={() => {
                scrollToPage(2);
                setTimeout(() => handlePrint(), 200);
              }}
              onReplaySplash={() => setShowSplash(true)}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenEmailModal={() => setIsEmailModalOpen(true)}
            />
          </section>
        </div>
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

      {selectedClientToEdit && (
        <ClientEditorModal
          isOpen={isClientEditorOpen}
          onClose={() => {
            setIsClientEditorOpen(false);
            setSelectedClientToEdit(null);
          }}
          client={selectedClientToEdit}
          onSave={handleSaveEditedClient}
        />
      )}

      <ProvidersDatabaseModal
        isOpen={isProvidersModalOpen}
        onClose={() => setIsProvidersModalOpen(false)}
        providers={providers}
        onSelectProvider={handleSelectProvider}
        onSaveProvider={handleSaveProvider}
        onDeleteProvider={handleDeleteProvider}
        onSetDefaultProvider={handleSetDefaultProvider}
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

      {isInvoiceEditorOpen && (
        <InvoiceEditorModal
          isOpen={isInvoiceEditorOpen}
          onClose={() => setIsInvoiceEditorOpen(false)}
          invoice={currentInvoice}
          onSave={(updated) => {
            setCurrentInvoice(updated);
            setIsInvoiceEditorOpen(false);
            scrollToPage(2);
            showToast(`Factura ${updated.number} cumplimentada correctamente.`);
          }}
        />
      )}

      {/* Modal de Formulario Completo de Proveedor */}
      {isNewProviderFormOpen && (
        <NewProviderFullScreenForm
          isOpen={isNewProviderFormOpen}
          onClose={() => {
            setIsNewProviderFormOpen(false);
            setSelectedProviderToEdit(null);
          }}
          onSaveProvider={(provider) => {
            handleSaveProvider(provider);
            setIsNewProviderFormOpen(false);
            setSelectedProviderToEdit(null);
          }}
          initialData={selectedProviderToEdit || undefined}
        />
      )}

      {/* Modal de Formulario Completo de Factura de Gastos desde Tarjeta de Proveedor (+G) */}
      {isExpenseFormOpen && (
        <NewReceivedInvoiceFullScreenForm
          isOpen={isExpenseFormOpen}
          onClose={() => {
            setIsExpenseFormOpen(false);
            setExpenseInitialData(null);
          }}
          onSaveInvoice={(savedInv) => {
            handleSaveReceivedInvoice(savedInv);
            setIsExpenseFormOpen(false);
            setExpenseInitialData(null);
            scrollToPage(2);
            showToast(`Factura de gasto ${savedInv.invoiceNumber} guardada en Facturas Recibidas.`);
          }}
          providers={providers}
          initialData={expenseInitialData || undefined}
          company={currentInvoice.company}
        />
      )}

      {/* Modal de Vista de Impresión */}
      {isPrintPreviewOpen && (
        <PrintPreviewModal
          invoice={currentInvoice}
          onClose={() => setIsPrintPreviewOpen(false)}
          onPrint={handlePrint}
        />
      )}

      {/* Pantalla Completa Hoja A4 para Ver y Cumplimentar Factura con Botón Volver */}
      <AnimatePresence>
        {isFullScreenInvoiceOpen && (
          <motion.div
            id="fullscreen-invoice-view-overlay"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/95 backdrop-blur-md pt-2 sm:pt-4 pb-12 px-2 sm:px-4"
          >
            <A4InvoiceDocument
              invoice={currentInvoice}
              onChangeInvoice={handleInvoiceChange}
              onOpenConfig={() => {
                setIsFullScreenInvoiceOpen(false);
                scrollToPage(4);
              }}
              concepts={concepts}
              onConceptCommitted={() => setConcepts(loadConceptsMemory())}
              onOpenVeriFactuModal={() => setIsVeriFactuOpen(true)}
              clients={clients}
              onSelectClient={handleSelectClient}
              onOpenClientsSearch={() => {
                setIsFullScreenInvoiceOpen(false);
                scrollToPage(1);
              }}
              onOpenNewClientForm={() => setIsNewClientFormOpen(true)}
              onOpenProvidersModal={() => {
                setIsFullScreenInvoiceOpen(false);
                scrollToPage(3);
              }}
              onOpenAttachProduct={handleOpenAttachProduct}
              onSaveInvoice={handleSaveInvoice}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenEmailModal={() => setIsEmailModalOpen(true)}
              onPrint={handlePrint}
              isSaved={isInvoiceSaved}
              isPrintPreviewOpen={isPrintPreviewOpen}
              onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
              onClosePrintPreview={() => setIsPrintPreviewOpen(false)}
              onBack={() => setIsFullScreenInvoiceOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
