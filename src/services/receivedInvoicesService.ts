import { ReceivedInvoice } from '../types';

const STORAGE_KEY = 'gestarian_received_invoices_v1';

export const DEFAULT_RECEIVED_INVOICES: ReceivedInvoice[] = [
  {
    id: 'rec-inv-1',
    supplierName: 'Papelería y Suministros Gráficos S.L.',
    supplierCif: 'B87654321',
    supplierPhone: '+34 912 345 678',
    supplierEmail: 'facturacion@suministrosgraficos.es',
    supplierAddress: 'Polígono Industrial Las Mercedes, Nave 14, 28022 Madrid',
    invoiceNumber: 'FAC-2026-0891',
    date: '2026-03-12',
    concept: 'Papel A4 80g alta blancura (5 cajas), tóner negro y consumibles de oficina',
    category: 'Materiales',
    baseImponible: 185.5,
    ivaRate: 21,
    ivaAmount: 38.96,
    irpfRate: 0,
    irpfAmount: 0,
    totalAmount: 224.46,
    scannedWithOcr: false,
    notes: 'Pago recibido por transferencia bancaria 30 días.',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'rec-inv-2',
    supplierName: 'IberTelecom Comunicaciones S.A.',
    supplierCif: 'A28001122',
    supplierPhone: '+34 900 100 200',
    supplierEmail: 'empresas@ibertelecom.es',
    supplierAddress: 'Av. Diagonal 640, 08017 Barcelona',
    invoiceNumber: 'IBER-992014-B',
    date: '2026-03-15',
    concept: 'Fibra simétrica empresarial 1Gbps + 2 líneas móviles corporativas',
    category: 'Suministros',
    baseImponible: 92.0,
    ivaRate: 21,
    ivaAmount: 19.32,
    irpfRate: 0,
    irpfAmount: 0,
    totalAmount: 111.32,
    scannedWithOcr: true,
    ocrModel: 'gemini-3.8-flash',
    notes: 'Recibo domiciliado en cuenta bancaria.',
    createdAt: Date.now() - 86400000,
  },
];

export function loadReceivedInvoices(): ReceivedInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECEIVED_INVOICES));
      return DEFAULT_RECEIVED_INVOICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RECEIVED_INVOICES;
  } catch (err) {
    console.error('Error loading received invoices:', err);
    return DEFAULT_RECEIVED_INVOICES;
  }
}

export function saveReceivedInvoicesList(invoices: ReceivedInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error('Error saving received invoices list:', err);
  }
}

export async function processInvoiceWithGeminiOcr(
  imageBase64: string,
  mimeType = 'image/jpeg'
): Promise<{ success: boolean; data?: Partial<ReceivedInvoice>; error?: string }> {
  try {
    const response = await fetch('/api/ocr-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Error en servidor OCR (${response.status})`);
    }

    const res = await response.json();
    if (!res.success || !res.data) {
      throw new Error(res.error || 'No se pudieron extraer datos de la factura.');
    }

    return {
      success: true,
      data: res.data,
    };
  } catch (err: any) {
    console.error('Error in processInvoiceWithGeminiOcr:', err);
    return {
      success: false,
      error: err.message || 'Error al conectar con el servicio OCR de Gemini.',
    };
  }
}
