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
  const match = invoiceNum.match(/^F\d{2}(\d{4})$/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
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
