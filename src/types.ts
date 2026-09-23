export interface CompanyData {
  id?: string;
  name: string;
  cif: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  iban?: string;
  bankName?: string;
  notes?: string;
  isDefault?: boolean;
  createdAt?: number;
}

export type ProviderData = CompanyData;

export type ClientDispatchChannel = 'whatsapp' | 'email' | 'both';

export interface ClientConceptLine {
  id: string;
  // Parámetro 1: Concepto / Descripción
  concept: string;
  // Parámetro 2: Cantidad / Unidades
  quantity: number;
  // Parámetro 3: Precio / Tarifa Unitario (€)
  unitPrice: number;
  // Parámetro 4: % IVA (e.g. 21, 10, 4, 0)
  ivaRate: number;
  // Parámetro 5: Parámetro configurable (Unidad de medida / % Descuento / IRPF / Categoría)
  param5Type?: 'unit' | 'discount' | 'irpf' | 'custom';
  param5Value?: string | number;
}

// --- SISTEMA ANTIGUO (mantenido por compatibilidad de datos existentes) ---
export interface ClientConceptVariableNode {
  id: string;
  name: string;
  price?: number;
  children?: ClientConceptVariableNode[];
}

// --- NUEVO SISTEMA: Líneas Complejas tipo árbol plano ---
export interface LineasNivel {
  nombre_nivel: string; // Ej: "Material", "Tejido", "Color"
  valores: string[];    // Ej: ["Visillo", "Opaco", "Translúcido"]
}

export interface LineasComplejasCliente {
  id: string;
  cliente_id: string;
  concepto_troncal: string; // Ej: "Cortina", "Cojín"
  niveles: LineasNivel[];   // Solo texto de concepto, sin precios
  created_at?: number;
  updated_at?: number;
}

export interface ClientData {
  id?: string;
  name: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
  defaultSendWhatsApp?: boolean; // Casilla para activar WhatsApp por defecto
  defaultSendEmail?: boolean; // Casilla para activar Email por defecto
  preferredDispatchChannel?: ClientDispatchChannel; // Medio seleccionado por defecto
  enableComplexInvoice?: boolean; // Mantenido por compatibilidad (sistema antiguo)
  enableProductsCatalog?: boolean; // Casilla para activar/desactivar botón Añadir Producto en facturación
  conceptLines?: ClientConceptLine[]; // Líneas de conceptos preconfiguradas para este cliente
  habitualProducts?: BillableProduct[]; // Productos habituales (nuevo sistema: solo nombre+descripción)
  variableTrees?: ClientConceptVariableNode[]; // Árbol antiguo (mantenido por compatibilidad)
  lineasComplejas?: LineasComplejasCliente[]; // NUEVO: estructuras de árbol plano por troncal
  createdAt?: number;
}

export type VariantUnitType =
  | 'text'
  | 'm2'
  | 'ml'
  | 'percent'
  | 'hours'
  | 'kg'
  | 'units'
  | 'custom';

export interface ComplexBudgetVariant {
  id: string;
  name: string; // e.g. "Material", "Porcentaje de fruncido", "Metros lineales"
  value: string; // e.g. "Lino rústico", "200", "3.5"
  unitType: VariantUnitType;
  customUnit?: string;
}

export type ComplexInvoiceVariant = ComplexBudgetVariant;

export interface ComplexBudgetConfig {
  conceptTitle: string;
  variants: ComplexBudgetVariant[];
  units: number;
  unitPrice: number;
  notes?: string;
}

export type ComplexInvoiceConfig = ComplexBudgetConfig;

export interface BillableProduct {
  id: string;
  name: string; // Concepto del producto facturable
  description?: string;
  imageUrl?: string; // Imagen adjunta al concepto
  price?: number; // Precio unitario sugerido / habitual
  category?: string;
  createdAt?: number;
}

export interface InvoiceItem {
  id: string;
  concept: string;
  units: number;
  unitPrice: number;
  total: number;
  complexBudgetConfig?: ComplexBudgetConfig;
  complexInvoiceConfig?: ComplexBudgetConfig;
  productId?: string;
  productImageUrl?: string;
}

export interface VeriFactuData {
  systemId: string;
  qrPayload: string;
  qrDataUrl: string;
  verificationUrl: string;
  chainHash: string;
  timestamp: string;
  isVerified: boolean;
}

export interface Invoice {
  id: string;
  number: string; // e.g. "F260000"
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  dueDate?: string;
  company: CompanyData;
  client: ClientData;
  items: InvoiceItem[];
  ivaRate: number; // 21
  irpfRate: number; // 0 or 15
  paymentMethod: string;
  notes?: string;
  veriFactu: VeriFactuData;
  status: 'borrador' | 'emitida' | 'pagada';
  createdAt: number;
}

export interface ConceptHistoryItem {
  text: string;
  count: number;
  lastUsed: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  dni?: string;
  avatarUrl?: string;
  provider: 'google' | 'email' | 'dni';
  rememberDevice: boolean;
  isAppDownloaded?: boolean;
  createdAt: number;
  lastLogin: number;
}

export interface ReceivedInvoice {
  id: string;
  // Proveedor fiscal
  supplierName: string;
  supplierCif: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress?: string;
  // Factura recibida
  invoiceNumber: string;
  date: string;
  concept: string;
  category?: string;
  // Desglose fiscal
  baseImponible: number;
  ivaRate: number; // 21, 10, 4, 0
  ivaAmount: number;
  irpfRate: number; // 0, 15, etc.
  irpfAmount: number;
  totalAmount: number;
  // Metadatos OCR Gemini / Cámara
  scannedWithOcr?: boolean;
  ocrModel?: string;
  capturedImageUrl?: string;
  notes?: string;
  createdAt: number;
}

export type AppTheme = 'dark' | 'light' | 'indigo';

