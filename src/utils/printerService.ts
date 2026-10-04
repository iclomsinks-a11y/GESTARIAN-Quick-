import { Invoice } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Genera el documento HTML completo e independiente listo para imprimir o exportar a PDF
 */
export function generateInvoicePrintHtml(invoice: Invoice): string {
  const printableItems = (invoice.items || []).filter(
    (item) => Boolean(item.concept && item.concept.trim().length > 0)
  );
  const baseImponible = printableItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const cuotaIva = baseImponible * ((invoice.ivaRate ?? 21) / 100);
  const cuotaIrpf = baseImponible * ((invoice.irpfRate ?? 0) / 100);
  const totalFactura = baseImponible + cuotaIva - cuotaIrpf;

  const isRectificative =
    invoice.number?.toUpperCase().startsWith('FR') ||
    invoice.number?.toUpperCase().startsWith('R') ||
    invoice.notes?.toLowerCase().includes('rectificativ') ||
    invoice.items?.some((it) => it.concept?.toLowerCase().includes('rectificaci'));

  const itemsRows = printableItems
    .map((item, idx) => {
      const units = item.units !== undefined && item.units !== null ? item.units : 1;
      const unitPrice = item.unitPrice || 0;
      const total = item.total || 0;
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 8px; font-weight: bold; color: #111827; text-align: left; vertical-align: top;">
            ${item.concept}
            ${item.productImageUrl ? `<div style="margin-top: 4px;"><img src="${item.productImageUrl}" style="max-height: 40px; border-radius: 4px; border: 1px solid #e5e7eb;" /></div>` : ''}
          </td>
          <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; color: #1f2937; text-align: center; vertical-align: top;">
            ${units}
          </td>
          <td style="padding: 10px 8px; font-family: monospace; color: #374151; text-align: right; vertical-align: top;">
            ${formatCurrency(unitPrice)}
          </td>
          <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; color: #111827; text-align: right; vertical-align: top;">
            ${formatCurrency(total)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.number || ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }
    .sheet {
      width: 100%;
      max-width: 794px;
      min-height: 1100px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header-box {
      border: 5px solid #b3b3b3;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .header-left {
      width: 50%;
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .header-right {
      width: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
      padding-left: 14px;
      border-left: 1px solid #e5e7eb;
    }
    .company-name {
      font-size: 20px;
      font-weight: 800;
      color: #4d4d4d;
      margin-bottom: 4px;
      line-height: 1.2;
    }
    .invoice-title-block {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .invoice-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 100;
      font-size: 28px;
      color: #9ca3af;
      letter-spacing: 0.05em;
    }
    .invoice-number {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 28px;
      color: #000000;
      letter-spacing: -0.02em;
    }
    .rectificativa-badge {
      text-align: center;
      font-size: 12px;
      font-weight: 900;
      color: #ea580c;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .date-block {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
    }
    .client-box {
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .client-title {
      font-size: 11px;
      font-weight: 800;
      color: #6b7280;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .client-name {
      font-size: 18px;
      font-weight: 800;
      color: #4d4d4d;
      margin-bottom: 4px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.items-table th {
      background: #f3f4f6;
      padding: 10px 8px;
      font-size: 11px;
      font-weight: 800;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #d1d5db;
    }
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 15px;
      margin-bottom: 20px;
    }
    .notes-box {
      flex: 1;
      padding: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 12px;
      color: #4b5563;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 8px;
    }
    .grand-total-row {
      background: #f3f4f6;
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
      font-size: 20px;
      font-weight: 900;
      color: #000000;
    }
    .payment-box {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .verifactu-box {
      border: 1px solid #d1d5db;
      background: #fafafa;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }
    .footer-legal {
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div>
      <!-- Cabecera -->
      <div class="header-box">
        <div class="header-left">
          ${invoice.company.logoUrl ? `<div><img src="${invoice.company.logoUrl}" style="max-height: 70px; max-width: 90px; object-contain: contain;" /></div>` : ''}
          <div>
            <div class="company-name">${invoice.company.name || 'Empresa Emisora'}</div>
            ${invoice.company.cif ? `<div style="color: #4b5563;"><strong>CIF/NIF:</strong> ${invoice.company.cif}</div>` : ''}
            ${invoice.company.address ? `<div style="color: #6b7280;">${invoice.company.address}</div>` : ''}
            ${invoice.company.phone ? `<div style="color: #6b7280;">Tel: ${invoice.company.phone}</div>` : ''}
            ${invoice.company.email ? `<div style="color: #6b7280;">Email: ${invoice.company.email}</div>` : ''}
          </div>
        </div>

        <div class="header-right">
          ${isRectificative ? `<div class="rectificativa-badge">FACTURA RECTIFICATIVA</div>` : ''}
          <div class="invoice-title-block">
            <span class="invoice-title">FACTURA</span>
            <span class="invoice-number">${invoice.number || 'S/N'}</span>
          </div>
          <div class="date-block">
            <span style="color: #6b7280; font-weight: bold; text-transform: uppercase;">FECHA:</span>
            <span style="font-weight: 800; font-size: 15px; color: #111827;">${formatDate(invoice.date)}</span>
          </div>
          ${invoice.dueDate ? `
          <div class="date-block" style="margin-top: 2px;">
            <span style="color: #9ca3af; font-size: 11px;">Vencimiento:</span>
            <span style="font-weight: 600; font-size: 12px; color: #4b5563;">${formatDate(invoice.dueDate)}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Datos del Cliente -->
      <div class="client-box">
        <div class="client-title">CLIENTE</div>
        <div class="client-name">${invoice.client?.name || 'Cliente sin asignar'}</div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap; color: #4b5563; font-size: 12px;">
          ${invoice.client?.nif ? `<div><strong>CIF/NIF:</strong> ${invoice.client.nif}</div>` : ''}
          ${invoice.client?.address ? `<div><strong>Dirección:</strong> ${invoice.client.address}</div>` : ''}
          ${invoice.client?.phone ? `<div><strong>Tel:</strong> ${invoice.client.phone}</div>` : ''}
          ${invoice.client?.email ? `<div><strong>Email:</strong> ${invoice.client.email}</div>` : ''}
        </div>
      </div>

      <!-- Tabla de Conceptos -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left; width: 55%;">Descripción / Concepto</th>
            <th style="text-align: center; width: 15%;">Cantidad</th>
            <th style="text-align: right; width: 15%;">Precio Ud.</th>
            <th style="text-align: right; width: 15%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #9ca3af;">Sin conceptos</td></tr>'}
        </tbody>
      </table>

      <!-- Totales y Observaciones -->
      <div class="totals-wrapper">
        <div class="notes-box">
          <strong style="color: #374151;">Observaciones / Condiciones:</strong>
          <p style="margin: 6px 0 0 0;">${invoice.notes || 'Factura emitida sujeta a la normativa fiscal vigente.'}</p>
        </div>

        <table class="totals-table">
          <tr>
            <td style="color: #6b7280;">Base Imponible:</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(baseImponible)}</td>
          </tr>
          <tr>
            <td style="color: #6b7280;">IVA (${invoice.ivaRate ?? 21}%):</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #059669;">+ ${formatCurrency(cuotaIva)}</td>
          </tr>
          ${invoice.irpfRate ? `
          <tr>
            <td style="color: #6b7280;">Retención IRPF (${invoice.irpfRate}%):</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #dc2626;">- ${formatCurrency(cuotaIrpf)}</td>
          </tr>` : ''}
          <tr class="grand-total-row">
            <td style="padding: 10px 8px;">TOTAL FACTURA:</td>
            <td style="padding: 10px 8px; text-align: right; font-family: monospace;">${formatCurrency(totalFactura)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Pie: Datos bancarios + Veri*Factu -->
    <div>
      <div class="payment-box">
        <div style="font-weight: bold; color: #111827; margin-bottom: 2px;">Forma de pago y datos bancarios:</div>
        <div style="color: #374151;">
          ${invoice.company.bankName ? `<span>${invoice.company.bankName} - </span>` : ''}
          <strong style="font-family: monospace; font-size: 13px;">${invoice.company.iban || 'IBAN no configurado'}</strong>
        </div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
          Transferencia bancaria o ingreso en cuenta. Indicar nº factura ${invoice.number || ''} como concepto.
        </div>
      </div>

      <div class="verifactu-box">
        ${invoice.veriFactu?.qrDataUrl ? `<img src="${invoice.veriFactu.qrDataUrl}" style="width: 56px; height: 56px; object-fit: contain;" />` : ''}
        <div style="font-size: 10px; color: #4b5563; line-height: 1.3;">
          <div style="font-weight: bold; color: #111827;">VERI*FACTU VALIDADA - AGENCIA TRIBUTARIA (AEAT)</div>
          <div>Sistema Informático de Facturación adaptado al Real Decreto 1007/2023</div>
          <div style="font-family: monospace; font-size: 9px; color: #6b7280;">${invoice.veriFactu?.chainHash ? `Huella: ${invoice.veriFactu.chainHash.slice(0, 24)}...` : ''}</div>
        </div>
      </div>

      <div class="footer-legal">
        Documento emitido conforme a la legislación fiscal española. Gestarian Quick · Soluciones de Facturación Inteligente.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Imprime la factura de manera universal en cualquier entorno (incluyendo iFrames, móviles y navegadores con restricciones)
 */
export function printInvoiceUniversal(invoice: Invoice): void {
  const printHtml = generateInvoicePrintHtml(invoice);

  try {
    // 1. Crear o reutilizar un iframe invisible aislado para imprimir
    let printFrame = document.getElementById('gestarian-print-frame') as HTMLIFrameElement | null;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'gestarian-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      printFrame.setAttribute('aria-hidden', 'true');
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      // Esperar a que los estilos y fuentes se rendericen en el frame
      setTimeout(() => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch (frameErr) {
          console.warn('Frame print failed, trying window.print fallback:', frameErr);
          window.focus();
          window.print();
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn('Universal print iframe error, executing fallback:', err);
  }

  // Fallback directo
  try {
    window.focus();
    window.print();
  } catch (e) {
    console.error('Window print error:', e);
  }
}
