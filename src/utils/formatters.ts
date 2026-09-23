/**
 * Format a number into Spanish Euro currency representation: e.g. 1.250,00 €
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number into standard Spanish decimal string: e.g. 1.250,00
 */
export function formatDecimal(amount: number): string {
  if (isNaN(amount)) return '0,00';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate invoice correlative number:
 * Format: "F" + 2-digit current year (e.g. 26 for 2026) + 4-digit sequence starting at 0000
 * Example: F260000, F260001, etc.
 */
export function generateInvoiceNumber(sequence: number = 0, customYear?: number): string {
  const currentYear = customYear || new Date().getFullYear();
  const yearTwoDigits = currentYear.toString().slice(-2);
  const seqStr = Math.max(0, sequence).toString().padStart(4, '0');
  return `F${yearTwoDigits}${seqStr}`;
}

/**
 * Parse sequence number from invoice number like "F260004" -> 4
 */
export function parseInvoiceSequence(invoiceNum: string): number {
  if (!invoiceNum) return 0;
  const match = invoiceNum.match(/^F\d{2}(\d{4})$/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Increment an invoice number string by +1 based on its numeric suffix or sequence.
 * Examples:
 * - "F260001" -> "F260002"
 * - "F260099" -> "F260100"
 * - "FAC-2026-005" -> "FAC-2026-006"
 * - "INV-1" -> "INV-2"
 * - "10" -> "11"
 */
export function incrementInvoiceNumber(invoiceNum: string, customYear?: number): string {
  if (!invoiceNum || !invoiceNum.trim()) {
    return generateInvoiceNumber(1, customYear);
  }

  const trimmed = invoiceNum.trim();

  // Pattern 1: F + 2-digit year + 4+ digit sequence, e.g. F260001 -> F260002
  const standardMatch = trimmed.match(/^(F\d{2})(\d{4,})$/i);
  if (standardMatch) {
    const prefix = standardMatch[1].toUpperCase();
    const seqDigits = standardMatch[2];
    const nextSeq = parseInt(seqDigits, 10) + 1;
    return `${prefix}${nextSeq.toString().padStart(seqDigits.length, '0')}`;
  }

  // Pattern 2: FR + 2-digit year + 4+ digit sequence, e.g. FR260001 -> FR260002
  const rectMatch = trimmed.match(/^(FR\d{2})(\d{4,})$/i);
  if (rectMatch) {
    const prefix = rectMatch[1].toUpperCase();
    const seqDigits = rectMatch[2];
    const nextSeq = parseInt(seqDigits, 10) + 1;
    return `${prefix}${nextSeq.toString().padStart(seqDigits.length, '0')}`;
  }

  // Pattern 3: Any prefix ending with a sequence of digits
  const genericMatch = trimmed.match(/^(.*?)(\d+)$/);
  if (genericMatch) {
    const prefix = genericMatch[1];
    const numStr = genericMatch[2];
    const nextNum = parseInt(numStr, 10) + 1;
    return `${prefix}${nextNum.toString().padStart(numStr.length, '0')}`;
  }

  // Fallback if no digits found
  return generateInvoiceNumber(1, customYear);
}

/**
 * Calculates the invoice number for the invoice being edited:
 * Takes ONLY the number of the last saved invoice and adds +1.
 * If no saved invoices exist yet in history, it starts at sequence 1 (e.g. F260001).
 */
export function getNextCorrelativeInvoiceNumber(
  existingInvoices?: Array<{ number?: string; createdAt?: number; date?: string; id?: string }>,
  customYear?: number
): { number: string; sequence: number } {
  let invoiceList = existingInvoices;
  if (!invoiceList || invoiceList.length === 0) {
    try {
      const raw = localStorage.getItem('gestarian_invoices_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          invoiceList = parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Filter valid saved invoices excluding rectificative or draft placeholders
  const validSaved = Array.isArray(invoiceList)
    ? invoiceList.filter(
        (inv) =>
          inv &&
          inv.number &&
          !inv.number.toUpperCase().includes('BORRADOR') &&
          !inv.number.toUpperCase().startsWith('FR')
      )
    : [];

  // Si no hay facturas guardadas en el historial, empieza en F260001 (secuencia 1 del año actual)
  if (validSaved.length === 0) {
    const number = generateInvoiceNumber(1, customYear);
    return { number, sequence: 1 };
  }

  // Se toma únicamente la última factura guardada (primer elemento del historial o más reciente)
  const lastSavedInvoice = validSaved[0];
  const lastNumber = lastSavedInvoice.number || '';
  const nextNumber = incrementInvoiceNumber(lastNumber, customYear);
  const nextSeq = parseInvoiceSequence(nextNumber) || 1;

  return { number: nextNumber, sequence: nextSeq };
}

/**
 * Calculates the next official correlative rectificative invoice number (e.g. FR260001, FR260002)
 * based solely on the last saved rectificative invoice + 1.
 */
export function getNextCorrelativeRectificativeInvoiceNumber(
  existingInvoices?: Array<{ number?: string; createdAt?: number; date?: string; id?: string }>,
  customYear?: number
): { number: string; sequence: number } {
  const currentYear = customYear || new Date().getFullYear();
  const yearTwoDigits = currentYear.toString().slice(-2);

  let invoiceList = existingInvoices;
  if (!invoiceList || invoiceList.length === 0) {
    try {
      const raw = localStorage.getItem('gestarian_invoices_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          invoiceList = parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const validRectificatives = Array.isArray(invoiceList)
    ? invoiceList.filter(
        (inv) =>
          inv &&
          inv.number &&
          inv.number.toUpperCase().startsWith('FR') &&
          !inv.number.toUpperCase().includes('BORRADOR')
      )
    : [];

  if (validRectificatives.length === 0) {
    const number = `FR${yearTwoDigits}0001`;
    return { number, sequence: 1 };
  }

  const lastSavedRect = validRectificatives[0];
  const lastNumber = lastSavedRect.number || `FR${yearTwoDigits}0000`;
  const nextNumber = incrementInvoiceNumber(lastNumber, customYear);
  const nextSeq = parseInvoiceSequence(nextNumber) || 1;

  return { number: nextNumber, sequence: nextSeq };
}

/**
 * Format date string (YYYY-MM-DD or timestamp) to DD/MM/YYYY
 */
export function formatDate(dateStr: string | number): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get current date as ISO YYYY-MM-DD for date inputs
 */
export function getTodayIso(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
