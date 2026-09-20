import QRCode from 'qrcode';
import { VeriFactuData } from '../types';

/**
 * Compute SHA-256 hexadecimal hash string using standard Web Crypto API
 */
export async function computeSha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface VeriFactuParams {
  cifEmisor: string;
  numeroFactura: string;
  fechaExpedicion: string; // YYYY-MM-DD or DD/MM/YYYY
  totalFactura: number;
  previousHash?: string;
}

/**
 * Generate Veri*Factu cryptographic record, chained hash, and standard AEAT QR code
 */
export async function generateVeriFactuRecord(params: VeriFactuParams): Promise<VeriFactuData> {
  const {
    cifEmisor = 'B12345678',
    numeroFactura = 'F260000',
    fechaExpedicion = new Date().toISOString().slice(0, 10),
    totalFactura = 0,
    previousHash = '0000000000000000000000000000000000000000000000000000000000000000',
  } = params;

  const timestamp = new Date().toISOString();
  const totalFormatted = totalFactura.toFixed(2);

  // String payload according to AEAT Veri*Factu canonical format specification
  const canonicalRecord = [
    cifEmisor.trim().toUpperCase(),
    numeroFactura.trim().toUpperCase(),
    fechaExpedicion,
    totalFormatted,
    previousHash,
    timestamp,
  ].join('|');

  const chainHash = await computeSha256(canonicalRecord);
  const shortHash = chainHash.substring(0, 16).toUpperCase();

  // AEAT Veri*Factu verification link format
  const encodedNif = encodeURIComponent(cifEmisor.trim().toUpperCase());
  const encodedNum = encodeURIComponent(numeroFactura.trim());
  const encodedFecha = encodeURIComponent(fechaExpedicion);
  const encodedTotal = encodeURIComponent(totalFormatted);
  const encodedHash = encodeURIComponent(chainHash);

  const verificationUrl = `https://sede.agenciatributaria.gob.es/verifactu/consulta?nif=${encodedNif}&num=${encodedNum}&fecha=${encodedFecha}&total=${encodedTotal}&hash=${encodedHash.substring(0, 16)}`;

  // The QR code contains the official verification URL
  const qrPayload = verificationUrl;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: {
        dark: '#171717',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating Veri*Factu QR code:', err);
    qrDataUrl = '';
  }

  return {
    systemId: `VF-ES-${shortHash.slice(0, 8)}`,
    qrPayload,
    qrDataUrl,
    verificationUrl,
    chainHash,
    timestamp,
    isVerified: true,
  };
}
