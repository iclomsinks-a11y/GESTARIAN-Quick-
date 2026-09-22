import { ClientData, ProviderData, Invoice, BillableProduct } from '../types';

export const STORAGE_CLIENTS_KEY = 'gestarian_clients_db';
export const STORAGE_PROVIDERS_KEY = 'gestarian_providers_db';
export const STORAGE_INVOICES_KEY = 'gestarian_invoices_history';
export const STORAGE_PRODUCTS_KEY = 'gestarian_products_db';

// Default initial products (Catálogo de productos facturables)
export const DEFAULT_PRODUCTS: BillableProduct[] = [
  {
    id: 'prod-cortina-lino',
    name: 'Cortina confeccionada a medida en lino rústico lavado',
    description: 'Confección artesanal con cabezilla fruncida al 200%, bajo con plomo de 50g y ganchos graduables.',
    price: 185.0,
    category: 'Confección Textil',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%23262626"/><path d="M25 20 L95 20 L95 26 L25 26 Z" fill="%23A3A3A3"/><path d="M30 26 Q35 60 30 100 Q40 60 45 26 Q50 60 45 100 Q55 60 60 26 Q65 60 60 100 Q70 60 75 26 Q80 60 75 100 Q85 60 90 26" fill="none" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round"/><circle cx="92" cy="92" r="14" fill="%23F59E0B" fill-opacity="0.2"/><text x="92" y="96" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23FCD34D" text-anchor="middle">m²</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'prod-motor-somfy',
    name: 'Motorización tubular vía radio para estor / cortina con emisor monocanal',
    description: 'Motor electrónico silencioso 230V con tecnología de parada suave y memoria de finales de carrera.',
    price: 245.0,
    category: 'Automatismos',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%231E293B"/><rect x="25" y="48" width="55" height="24" rx="4" fill="%230284C7"/><circle cx="90" cy="60" r="12" fill="%2338BDF8"/><path d="M85 60 L95 60 M90 55 L90 65" stroke="%230F172A" stroke-width="2.5" stroke-linecap="round"/><text x="52" y="64" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">RTS</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 'prod-riel-aluminio',
    name: 'Riel de aluminio extrusionado lacado blanco con correderas silenciosas (ml)',
    description: 'Perfil de alta resistencia para techos y paredes con soportes de fijación oculta clip.',
    price: 38.5,
    category: 'Herrajes',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%23171717"/><rect x="20" y="52" width="80" height="16" rx="3" fill="%23E5E5E5"/><circle cx="35" cy="60" r="3" fill="%23737373"/><circle cx="60" cy="60" r="3" fill="%23737373"/><circle cx="85" cy="60" r="3" fill="%23737373"/><text x="60" y="88" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23F59E0B" text-anchor="middle">ALU · ML</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'prod-estor-screen',
    name: 'Estor enrollable tejido técnico Screen 5% apertura ignífugo M1',
    description: 'Filtrado solar térmico, composición hilo de poliéster recubierto de PVC alta resistencia.',
    price: 135.0,
    category: 'Protección Solar',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%2327272A"/><rect x="25" y="24" width="70" height="8" rx="4" fill="%23A1A1AA"/><rect x="30" y="32" width="60" height="58" fill="%2352525B" fill-opacity="0.6"/><line x1="30" y1="90" x2="90" y2="90" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round"/><circle cx="85" cy="36" r="3" fill="%23FCD34D"/></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: 'prod-instalacion-mo',
    name: 'Mano de obra especializada en montaje, nivelado e instalación en obra',
    description: 'Servicio técnico cualificado, taladrado con aspiración limpia y verificación de funcionamiento.',
    price: 65.0,
    category: 'Servicios',
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="16" fill="%231C1917"/><circle cx="60" cy="60" r="32" fill="%23F59E0B" fill-opacity="0.15" stroke="%23F59E0B" stroke-width="2"/><path d="M48 68 L60 56 L72 68 M60 56 L60 76" stroke="%23F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="60" y="44" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23FAFAF9" text-anchor="middle">INSTALACIÓN</text></svg>',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];

// Default initial providers (Proveedores y empresas de suministros externas)
export const DEFAULT_PROVIDERS: ProviderData[] = [
  {
    id: 'prov-textiles',
    name: 'Confecciones Textiles & Cortinajes San Juan S.L.',
    cif: 'B81239874',
    address: 'Calle Toledo 45, 28005 Madrid',
    phone: '+34 913 658 900',
    email: 'taller@cortinajessanjuan.es',
    logoUrl: '',
    iban: 'ES44 0182 1234 5602 0008 9911',
    bankName: 'BBVA',
    isDefault: false,
  },
  {
    id: 'prov-instalaciones',
    name: 'Instalaciones & Cerramientos Ibéricos S.L.',
    cif: 'B99443322',
    address: 'Polígono Industrial El Campillo 8, 41020 Sevilla',
    phone: '+34 954 112 233',
    email: 'info@instalacionesibericas.es',
    logoUrl: '',
    iban: 'ES12 0049 1500 0512 3456 7890',
    bankName: 'Banco Santander',
    isDefault: false,
  },
  {
    id: 'prov-mecanizados',
    name: 'Mecanizados & Estructuras Metálicas Sur S.L.',
    cif: 'B41987654',
    address: 'Av. de la Industria 14, 28823 Coslada (Madrid)',
    phone: '+34 916 789 012',
    email: 'pedidos@mecanizadosur.es',
    logoUrl: '',
    iban: 'ES88 2038 9876 5400 1234 5678',
    bankName: 'Bankinter',
    isDefault: false,
  },
];

// Default initial clients (Clientes habituales)
export const DEFAULT_CLIENTS: ClientData[] = [
  {
    id: 'cli-arkedecor',
    name: 'ARKEDECOR Interiorismo & Proyectos S.L.',
    nif: 'B98765432',
    address: 'Calle Velázquez 42, 28001 Madrid',
    phone: '+34 914 312 800',
    email: 'proyectos@arkedecor.es',
    defaultSendWhatsApp: true,
    defaultSendEmail: true,
    preferredDispatchChannel: 'both',
    lineasComplejas: [],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
  },
  {
    id: 'cli-reformas-iberica',
    name: 'Construcciones y Reformas Ibérica S.A.',
    nif: 'A28001122',
    address: 'Av. Diagonal 450, 08006 Barcelona',
    phone: '+34 932 110 099',
    email: 'compras@reformasiberica.es',
    defaultSendWhatsApp: true,
    defaultSendEmail: true,
    preferredDispatchChannel: 'both',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'cli-alulevante',
    name: 'Aluminios y Cristalería Levante S.L.',
    nif: 'B46123456',
    address: 'Pol. Ind. Vara de Quart 14, 46014 Valencia',
    phone: '+34 963 881 220',
    email: 'pedidos@alulevante.com',
    defaultSendWhatsApp: true,
    defaultSendEmail: false,
    preferredDispatchChannel: 'whatsapp',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
  },
  {
    id: 'cli-decoracion-habitat',
    name: 'Decoración Textil & Hábitat S.L.',
    nif: 'B87654321',
    address: 'Calle Serrano 88, 28006 Madrid',
    phone: '+34 915 442 331',
    email: 'contacto@textilhabitat.es',
    defaultSendWhatsApp: false,
    defaultSendEmail: true,
    preferredDispatchChannel: 'email',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: 'cli-garcia-asociados',
    name: 'García & Asociados Consultores S.C.P.',
    nif: 'J50987654',
    address: 'Gran Vía 32, 50005 Zaragoza',
    phone: '+34 976 223 344',
    email: 'info@garciaasociados.es',
    defaultSendWhatsApp: false,
    defaultSendEmail: true,
    preferredDispatchChannel: 'email',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
  {
    id: 'cli-hotel-maritimo',
    name: 'Hotel Boutique Marítimo S.L.',
    nif: 'B07654987',
    address: 'Paseo Marítimo 12, 07014 Palma de Mallorca',
    phone: '+34 971 778 899',
    email: 'direccion@hotelmaritimo.com',
    defaultSendWhatsApp: true,
    defaultSendEmail: false,
    preferredDispatchChannel: 'whatsapp',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
];

// --- CLIENTS DATABASE METHODS ---

export function getStoredClients(): ClientData[] {
  try {
    const raw = localStorage.getItem(STORAGE_CLIENTS_KEY);
    if (!raw) {
      // Seed initial clients without default complex lines
      localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
      return sortClientsAlphabetically(DEFAULT_CLIENTS);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let updated = false;
      const defaultIdsToRemove = new Set([
        'lc-ark-cortina',
        'lc-ark-estor',
        'lc-ark-tapiceria',
        'lc-ark-mural',
      ]);

      const cleaned = parsed.map((client: ClientData) => {
        if (client.lineasComplejas && client.lineasComplejas.length > 0) {
          const userOnly = client.lineasComplejas.filter(
            (lc) => !defaultIdsToRemove.has(lc.id)
          );
          if (userOnly.length !== client.lineasComplejas.length) {
            updated = true;
            return {
              ...client,
              lineasComplejas: userOnly,
            };
          }
        }
        return client;
      });

      if (updated) {
        localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(cleaned));
      }

      return sortClientsAlphabetically(cleaned);
    }
    localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
    return sortClientsAlphabetically(DEFAULT_CLIENTS);
  } catch (e) {
    console.error('Error loading clients db:', e);
    return sortClientsAlphabetically(DEFAULT_CLIENTS);
  }
}

export function sortClientsAlphabetically(clients: ClientData[]): ClientData[] {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export function saveClientToDb(client: ClientData): ClientData {
  const all = getStoredClients();
  const id = client.id || `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const clientToSave: ClientData = {
    ...client,
    id,
    createdAt: client.createdAt || Date.now(),
  };

  const normalizedNif = client.nif ? client.nif.trim().toUpperCase() : '';
  const normalizedName = client.name ? client.name.trim().toLowerCase() : '';

  const existingIdx = all.findIndex((c) => {
    if (c.id && id && c.id === id) return true;
    if (normalizedNif && c.nif && c.nif.trim().toUpperCase() === normalizedNif) return true;
    if (!normalizedNif && normalizedName && c.name && c.name.trim().toLowerCase() === normalizedName) return true;
    return false;
  });

  let updated: ClientData[];

  if (existingIdx >= 0) {
    updated = all.map((c, i) => (i === existingIdx ? clientToSave : c));
  } else {
    updated = [...all, clientToSave];
  }

  const sorted = sortClientsAlphabetically(updated);
  localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(sorted));
  return clientToSave;
}

export function deleteClientFromDb(id: string): ClientData[] {
  const all = getStoredClients();
  const filtered = all.filter((c) => c.id !== id && (c.nif ? c.nif !== id : true) && (c.name ? c.name !== id : true));
  localStorage.setItem(STORAGE_CLIENTS_KEY, JSON.stringify(filtered));
  return filtered;
}

// --- PROVIDERS DATABASE METHODS ---

export function getStoredProviders(): ProviderData[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROVIDERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(DEFAULT_PROVIDERS));
      return DEFAULT_PROVIDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean legacy mock SVG default logos and exclude application user company cards
      const cleaned = parsed
        .filter(
          (p: ProviderData) =>
            p.id !== 'prov-gestarian' &&
            p.cif !== 'B88994411' &&
            !p.name?.toLowerCase().includes('gestarian soluciones')
        )
        .map((p: ProviderData) => {
          if (p.logoUrl && p.logoUrl.startsWith('data:image/svg+xml')) {
            return { ...p, logoUrl: '', isDefault: false };
          }
          return { ...p, isDefault: false };
        });

      if (cleaned.length === 0) {
        localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(DEFAULT_PROVIDERS));
        return DEFAULT_PROVIDERS;
      }
      return cleaned;
    }
    return DEFAULT_PROVIDERS;
  } catch (e) {
    console.error('Error loading providers db:', e);
    return DEFAULT_PROVIDERS;
  }
}

export function saveProviderToDb(provider: ProviderData): ProviderData {
  const all = getStoredProviders();
  const id = provider.id || `prov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const toSave: ProviderData = {
    ...provider,
    id,
  };

  const normalizedCif = provider.cif ? provider.cif.trim().toUpperCase() : '';
  const normalizedName = provider.name ? provider.name.trim().toLowerCase() : '';

  const existingIdx = all.findIndex((p) => {
    if (p.id && id && p.id === id) return true;
    if (normalizedCif && p.cif && p.cif.trim().toUpperCase() === normalizedCif) return true;
    if (!normalizedCif && normalizedName && p.name && p.name.trim().toLowerCase() === normalizedName) return true;
    return false;
  });

  let updated: ProviderData[];

  if (existingIdx >= 0) {
    updated = all.map((p, i) => (i === existingIdx ? toSave : p));
  } else {
    updated = [...all, toSave];
  }

  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(updated));
  return toSave;
}

export function deleteProviderFromDb(id: string): ProviderData[] {
  const all = getStoredProviders();
  const filtered = all.filter((p) => p.id !== id && (p.cif ? p.cif !== id : true) && (p.name ? p.name !== id : true));
  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(filtered));
  return filtered;
}

export function setDefaultProviderInDb(id: string): ProviderData[] {
  const all = getStoredProviders();
  const updated = all.map((p) => ({
    ...p,
    isDefault: p.id === id,
  }));
  localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(updated));
  return updated;
}

// --- INVOICES DATABASE METHODS ---

export function getStoredInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading invoices db:', e);
    return [];
  }
}

export function saveInvoiceToDb(invoice: Invoice): Invoice[] {
  const all = getStoredInvoices();
  const existingIdx = all.findIndex((inv) => inv.id === invoice.id || inv.number === invoice.number);
  let updated: Invoice[];

  if (existingIdx >= 0) {
    updated = all.map((inv, i) => (i === existingIdx ? invoice : inv));
  } else {
    updated = [invoice, ...all];
  }

  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteInvoiceFromDb(id: string): Invoice[] {
  const all = getStoredInvoices();
  const filtered = all.filter((inv) => inv.id !== id && inv.number !== id);
  localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(filtered));
  return filtered;
}

// --- BILLABLE PRODUCTS DATABASE METHODS ---

export function getStoredProducts(): BillableProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PRODUCTS;
  } catch (e) {
    console.error('Error loading products db:', e);
    return DEFAULT_PRODUCTS;
  }
}

export function saveProductToDb(product: BillableProduct): BillableProduct {
  const all = getStoredProducts();
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const toSave: BillableProduct = {
    ...product,
    id,
    createdAt: product.createdAt || Date.now(),
  };

  const existingIdx = all.findIndex((p) => p.id === id);
  let updated: BillableProduct[];

  if (existingIdx >= 0) {
    updated = all.map((p, i) => (i === existingIdx ? toSave : p));
  } else {
    updated = [toSave, ...all];
  }

  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
  return toSave;
}

export function deleteProductFromDb(id: string): BillableProduct[] {
  const all = getStoredProducts();
  const filtered = all.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
  return filtered;
}

