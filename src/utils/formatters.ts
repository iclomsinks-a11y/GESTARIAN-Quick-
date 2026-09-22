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
 * Calculates the next official correlative invoice number based on existing invoice history
 * and saved sequence counter.
 * If no invoices exist for the current year, it starts at sequence 1 (e.g. F260001).
 */
export function getNextCorrelativeInvoiceNumber(
  existingInvoices?: Array<{ number?: string }>,
  customYear?: number
): { number: string; sequence: number } {
  const currentYear = customYear || new Date().getFullYear();
  const yearTwoDigits = currentYear.toString().slice(-2);

  let maxSeq = 0;

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

  // 1. Scan existing invoices for the highest sequence in the current year
  if (Array.isArray(invoiceList)) {
    for (const inv of invoiceList) {
      if (inv && inv.number) {
        const match = inv.number.match(new RegExp(`^F${yearTwoDigits}(\\d{4})$`, 'i'));
        if (match && match[1]) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }
  }

  // 2. Also check localStorage sequence tracker
  try {
    const saved = localStorage.getItem('gestarian_invoice_sequence');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  const nextSequence = maxSeq + 1;
  const number = generateInvoiceNumber(nextSequence, currentYear);
  return { number, sequence: nextSequence };
}

/**
 * Calculates the next official correlative rectificative invoice number (e.g. R260001, R260002)
 */
export function getNextCorrelativeRectificativeInvoiceNumber(
  existingInvoices?: Array<{ number?: string }>,
  customYear?: number
): { number: string; sequence: number } {
  const currentYear = customYear || new Date().getFullYear();
  const yearTwoDigits = currentYear.toString().slice(-2);

  let maxSeq = 0;
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

  if (Array.isArray(invoiceList)) {
    for (const inv of invoiceList) {
      if (inv && inv.number) {
        const match = inv.number.match(new RegExp(`^R${yearTwoDigits}(\\d{4})$`, 'i'));
        if (match && match[1]) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }
  }

  const nextSequence = maxSeq + 1;
  const seqStr = nextSequence.toString().padStart(4, '0');
  const number = `R${yearTwoDigits}${seqStr}`;
  return { number, sequence: nextSequence };
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
