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
  avatarUrl?: string;
  provider: 'google' | 'email';
  rememberDevice: boolean;
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

