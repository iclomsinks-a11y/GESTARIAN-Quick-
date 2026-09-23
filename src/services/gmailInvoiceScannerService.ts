import { ReceivedInvoice } from '../types';
import { processInvoiceWithGeminiOcr } from './receivedInvoicesService';

export interface GmailScannerConfig {
  enabled: boolean;
  scheduledTime: string; // "18:00"
  lastScanTimestamp?: number;
  lastScanDate?: string;
  autoImportWithoutPrompt?: boolean;
  authMethod?: 'oauth' | 'app_password';
  appPasswordEmail?: string;
  appPassword?: string;
}

export interface ScanResult {
  success: boolean;
  detectedCount: number;
  newInvoices: DetectedGmailInvoice[];
  error?: string;
}

export interface DetectedGmailInvoice {
  id: string;
  messageId: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  attachmentName: string;
  attachmentMimeType: string;
  invoiceData: ReceivedInvoice;
  status: 'pending' | 'imported' | 'ignored';
  detectedAt: number;
}

const CONFIG_KEY = 'gestarian_gmail_scanner_config_v1';
const PROCESSED_IDS_KEY = 'gestarian_gmail_processed_message_ids';
const DETECTED_INVOICES_KEY = 'gestarian_gmail_detected_invoices_v1';

export const DEFAULT_GMAIL_SCANNER_CONFIG: GmailScannerConfig = {
  enabled: true,
  scheduledTime: '18:00',
  autoImportWithoutPrompt: false,
};

function getUserConfigKey(userEmail?: string): string {
  if (userEmail && userEmail.trim()) {
    return `${CONFIG_KEY}_${userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  return CONFIG_KEY;
}

function getUserDetectedKey(userEmail?: string): string {
  if (userEmail && userEmail.trim()) {
    return `${DETECTED_INVOICES_KEY}_${userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  return DETECTED_INVOICES_KEY;
}

export function getGmailScannerConfig(userEmail?: string): GmailScannerConfig {
  try {
    const key = getUserConfigKey(userEmail);
    const raw = localStorage.getItem(key) || (userEmail ? localStorage.getItem(CONFIG_KEY) : null);
    if (!raw) {
      return {
        ...DEFAULT_GMAIL_SCANNER_CONFIG,
        appPasswordEmail: userEmail || '',
      };
    }
    return { ...DEFAULT_GMAIL_SCANNER_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_GMAIL_SCANNER_CONFIG;
  }
}

export function saveGmailScannerConfig(config: GmailScannerConfig, userEmail?: string): void {
  try {
    const key = getUserConfigKey(userEmail || config.appPasswordEmail);
    localStorage.setItem(key, JSON.stringify(config));
    // Also update global default
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving Gmail scanner config:', e);
  }
}

export function getProcessedMessageIds(userEmail?: string): string[] {
  try {
    const key = userEmail ? `${PROCESSED_IDS_KEY}_${userEmail.trim().toLowerCase()}` : PROCESSED_IDS_KEY;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function markMessageAsProcessed(messageId: string, userEmail?: string): void {
  try {
    const key = userEmail ? `${PROCESSED_IDS_KEY}_${userEmail.trim().toLowerCase()}` : PROCESSED_IDS_KEY;
    const current = getProcessedMessageIds(userEmail);
    if (!current.includes(messageId)) {
      current.push(messageId);
      // Keep up to last 500 IDs
      const sliced = current.slice(-500);
      localStorage.setItem(key, JSON.stringify(sliced));
    }
  } catch (e) {
    console.error('Error saving processed message ID:', e);
  }
}

export function getDetectedGmailInvoices(userEmail?: string): DetectedGmailInvoice[] {
  try {
    const key = getUserDetectedKey(userEmail);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    const globalRaw = localStorage.getItem(DETECTED_INVOICES_KEY);
    return globalRaw ? JSON.parse(globalRaw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDetectedGmailInvoices(list: DetectedGmailInvoice[], userEmail?: string): void {
  try {
    const key = getUserDetectedKey(userEmail);
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem(DETECTED_INVOICES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving detected Gmail invoices:', e);
  }
}

/**
 * Helper to convert base64url string (used by Gmail API) to regular base64
 */
function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

/**
 * Scan Gmail for emails containing invoice keywords and attachments
 */
export async function scanGmailForInvoices(
  accessToken: string,
  onProgress?: (statusText: string, current: number, total: number) => void,
  userEmail?: string
): Promise<{
  success: boolean;
  detectedCount: number;
  newInvoices: DetectedGmailInvoice[];
  error?: string;
}> {
  try {
    if (!accessToken) {
      throw new Error('No hay sesión de Google activa. Conecta tu cuenta de Gmail.');
    }

    onProgress?.('Buscando correos con facturas y adjuntos en tu bandeja de entrada...', 0, 0);

    // Query messages with PDF or image attachments matching invoice keywords
    const searchQuery = 'has:attachment (filename:pdf OR filename:png OR filename:jpg OR filename:jpeg) (factura OR invoice OR ticket OR recibo OR justificante OR "comprobante de pago" OR "albarán" OR "nota de cobro")';
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=15`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al acceder a Gmail (${listRes.status})`);
    }

    const listData = await listRes.json();
    const messages: Array<{ id: string; threadId: string }> = listData.messages || [];

    if (messages.length === 0) {
      return {
        success: true,
        detectedCount: 0,
        newInvoices: [],
      };
    }

    const processedIds = new Set(getProcessedMessageIds(userEmail));
    const existingDetected = getDetectedGmailInvoices(userEmail);
    const newDetectedList: DetectedGmailInvoice[] = [];

    const totalToExamine = messages.length;
    let examinedCount = 0;

    for (const msgItem of messages) {
      examinedCount++;
      if (processedIds.has(msgItem.id)) {
        continue;
      }

      onProgress?.(
        `Analizando correo ${examinedCount} de ${totalToExamine}...`,
        examinedCount,
        totalToExamine
      );

      // Fetch message details
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgRes.ok) continue;
      const msgDetail = await msgRes.json();

      const headers = msgDetail.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || 'Sin asunto';
      const from = getHeader('From') || 'Desconocido';
      const dateStr = getHeader('Date') || new Date().toISOString();

      // Look for attachment parts
      const parts = msgDetail.payload?.parts || [];
      const attachments: Array<{ filename: string; mimeType: string; attachmentId: string; size: number }> = [];

      const extractParts = (partList: any[]) => {
        for (const p of partList) {
          if (p.filename && p.body?.attachmentId) {
            const mime = (p.mimeType || '').toLowerCase();
            const fn = p.filename.toLowerCase();
            if (
              mime.includes('pdf') ||
              mime.includes('image') ||
              fn.endsWith('.pdf') ||
              fn.endsWith('.png') ||
              fn.endsWith('.jpg') ||
              fn.endsWith('.jpeg')
            ) {
              attachments.push({
                filename: p.filename,
                mimeType: p.mimeType || 'application/pdf',
                attachmentId: p.body.attachmentId,
                size: p.body.size || 0,
              });
            }
          }
          if (p.parts && Array.isArray(p.parts)) {
            extractParts(p.parts);
          }
        }
      };

      extractParts(parts);

      // If no valid attachment found, mark processed and continue
      if (attachments.length === 0) {
        markMessageAsProcessed(msgItem.id);
        continue;
      }

      // Process the best candidate attachment (first PDF or image)
      const targetAttachment = attachments[0];
      onProgress?.(
        `Extrayendo factura adjunta (${targetAttachment.filename}) con IA...`,
        examinedCount,
        totalToExamine
      );

      // Download attachment content from Gmail
      const attachRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}/attachments/${targetAttachment.attachmentId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!attachRes.ok) {
        markMessageAsProcessed(msgItem.id);
        continue;
      }

      const attachData = await attachRes.json();
      if (!attachData.data) {
        markMessageAsProcessed(msgItem.id);
        continue;
      }

      const rawBase64 = base64UrlToBase64(attachData.data);
      let previewDataUrl = `data:${targetAttachment.mimeType};base64,${rawBase64}`;

      // Call OCR endpoint to extract structured invoice data
      const ocrResult = await processInvoiceWithGeminiOcr(
        rawBase64,
        targetAttachment.mimeType
      );

      const parsedData = ocrResult.data || {};

      // Build structured received invoice
      const cleanSenderName = from.replace(/<.*?>/, '').replace(/"/g, '').trim();
      const invoiceNumber =
        parsedData.invoiceNumber ||
        `GMAIL-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

      const baseImponible = parsedData.baseImponible || 0;
      const ivaRate = parsedData.ivaRate !== undefined ? parsedData.ivaRate : 21;
      const ivaAmount = parsedData.ivaAmount || (baseImponible * ivaRate) / 100;
      const irpfRate = parsedData.irpfRate || 0;
      const irpfAmount = parsedData.irpfAmount || (baseImponible * irpfRate) / 100;
      const totalAmount =
        parsedData.totalAmount || baseImponible + ivaAmount - irpfAmount;

      const receivedInvoice: ReceivedInvoice = {
        id: `gmail-rec-${msgItem.id}`,
        supplierName: parsedData.supplierName || cleanSenderName || 'Proveedor de Correo',
        supplierCif: parsedData.supplierCif || '',
        supplierPhone: parsedData.supplierPhone || '',
        supplierEmail: parsedData.supplierEmail || from.match(/<([^>]+)>/)?.[1] || '',
        supplierAddress: parsedData.supplierAddress || '',
        invoiceNumber,
        date: parsedData.date || new Date().toISOString().split('T')[0],
        concept:
          parsedData.concept ||
          `Factura recibida vía email "${subject}" (${targetAttachment.filename})`,
        category: (parsedData.category as any) || 'Suministros',
        baseImponible,
        ivaRate,
        ivaAmount,
        irpfRate,
        irpfAmount,
        totalAmount,
        scannedWithOcr: true,
        ocrModel: 'gemini-vision-ocr',
        notes: `Rastreado y extraído automáticamente desde Gmail.\nAsunto: ${subject}\nDe: ${from}\nAdjunto: ${targetAttachment.filename}`,
        capturedImageUrl: previewDataUrl.startsWith('data:image') ? previewDataUrl : undefined,
        createdAt: Date.now(),
      };

      const detectedItem: DetectedGmailInvoice = {
        id: `det-${msgItem.id}-${Date.now()}`,
        messageId: msgItem.id,
        emailSubject: subject,
        emailFrom: from,
        emailDate: dateStr,
        attachmentName: targetAttachment.filename,
        attachmentMimeType: targetAttachment.mimeType,
        invoiceData: receivedInvoice,
        status: 'pending',
        detectedAt: Date.now(),
      };

      newDetectedList.push(detectedItem);
      markMessageAsProcessed(msgItem.id, userEmail);
    }

    // Save updated detected list
    const updatedDetected = [...newDetectedList, ...existingDetected];
    saveDetectedGmailInvoices(updatedDetected, userEmail);

    // Update config with last scan info
    const config = getGmailScannerConfig(userEmail);
    config.lastScanTimestamp = Date.now();
    config.lastScanDate = new Date().toISOString();
    saveGmailScannerConfig(config, userEmail);

    return {
      success: true,
      detectedCount: newDetectedList.length,
      newInvoices: newDetectedList,
    };
  } catch (error: any) {
    console.error('Error during Gmail invoice scan:', error);
    return {
      success: false,
      detectedCount: 0,
      newInvoices: [],
      error: error?.message || 'Error desconocido al escanear Gmail',
    };
  }
}

/**
 * Check if the daily scheduled scan should run right now (e.g. at 18:00)
 */
export function isScheduledScanDue(userEmail?: string): boolean {
  const config = getGmailScannerConfig(userEmail);
  if (!config.enabled) return false;

  const now = new Date();
  const [targetHours, targetMinutes] = config.scheduledTime.split(':').map((n) => parseInt(n, 10));

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // If time hasn't reached scheduled time yet today, not due
  if (currentHours < targetHours || (currentHours === targetHours && currentMinutes < targetMinutes)) {
    return false;
  }

  // Check if already scanned today
  if (config.lastScanTimestamp) {
    const lastScanDate = new Date(config.lastScanTimestamp);
    if (
      lastScanDate.getFullYear() === now.getFullYear() &&
      lastScanDate.getMonth() === now.getMonth() &&
      lastScanDate.getDate() === now.getDate()
    ) {
      return false; // Already scanned today
    }
  }

  return true;
}

/**
 * Test IMAP connection with 16-character Google App Password
 */
export async function testImapCredentials(email: string, appPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/test-imap-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, appPassword }),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error de conexión con el servidor.' };
  }
}

/**
 * Scan Gmail invoices via backend IMAP with 16-character App Password
 */
export async function scanGmailViaImap(
  email: string,
  appPassword: string,
  onProgress?: (status: string, current: number, total: number) => void,
  userEmail?: string
): Promise<ScanResult> {
  try {
    if (onProgress) onProgress('Conectando de forma segura con Gmail IMAP...', 0, 100);

    const res = await fetch('/api/scan-imap-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, appPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al escanear Gmail por IMAP');
    }

    const imapInvoices: any[] = data.invoices || [];
    const effectiveUserEmail = userEmail || email;
    const existingDetected = getDetectedGmailInvoices(effectiveUserEmail);
    const newDetectedList: DetectedGmailInvoice[] = [];

    for (const inv of imapInvoices) {
      const alreadySaved = existingDetected.some((e) => e.messageId === inv.messageId || e.invoiceData.invoiceNumber === inv.extractedInvoice?.invoiceNumber);
      if (!alreadySaved) {
        const detectedItem: DetectedGmailInvoice = {
          id: inv.id,
          messageId: inv.messageId,
          emailSubject: inv.subject,
          emailFrom: inv.from,
          emailDate: inv.date,
          attachmentName: inv.attachmentFilename,
          attachmentMimeType: inv.attachmentMimeType,
          invoiceData: inv.extractedInvoice,
          status: 'pending',
          detectedAt: Date.now(),
        };
        newDetectedList.push(detectedItem);
      }
    }

    const updatedDetected = [...newDetectedList, ...existingDetected];
    saveDetectedGmailInvoices(updatedDetected, effectiveUserEmail);

    const config = getGmailScannerConfig(effectiveUserEmail);
    config.lastScanTimestamp = Date.now();
    config.lastScanDate = new Date().toISOString();
    saveGmailScannerConfig(config, effectiveUserEmail);

    if (onProgress) onProgress('Rastreo completado.', 100, 100);

    return {
      success: true,
      detectedCount: newDetectedList.length,
      newInvoices: newDetectedList,
    };
  } catch (error: any) {
    return {
      success: false,
      detectedCount: 0,
      newInvoices: [],
      error: error?.message || 'Error al conectar con Gmail mediante la clave de aplicación.',
    };
  }
}
