import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { generateInvoicePrintHtml } from './printerService';

/**
 * Genera un archivo PDF a partir del elemento DOM o del HTML independiente de la factura
 */
export async function generateInvoicePdfBlob(
  invoice: Invoice,
  targetElement?: HTMLElement | null
): Promise<{ blob: Blob; base64: string; filename: string }> {
  const filename = `Factura_${(invoice.number || 'documento').replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`;

  // Si tenemos el elemento DOM visible y disponible
  if (targetElement) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output('blob');
      const base64 = pdf.output('datauristring').split(',')[1];

      return { blob, base64, filename };
    } catch (err) {
      console.warn('Fallo renderizando targetElement a PDF con html2canvas, usando motor iframe A4:', err);
    }
  }

  // Generador de respaldo mediante iframe invisible y renderizado canvas
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '794px'; // Dimensiones A4 estándar en px a 96 DPI
      iframe.style.height = '1123px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        throw new Error('No se pudo acceder al documento del iframe.');
      }

      const html = generateInvoicePrintHtml(invoice);
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(async () => {
        try {
          const container = iframeDoc.body;
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          const blob = pdf.output('blob');
          const base64 = pdf.output('datauristring').split(',')[1];

          document.body.removeChild(iframe);
          resolve({ blob, base64, filename });
        } catch (error) {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          reject(error);
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Descarga directamente el PDF en el navegador del usuario
 */
export async function downloadInvoicePdf(invoice: Invoice, targetElement?: HTMLElement | null): Promise<void> {
  const { blob, filename } = await generateInvoicePdfBlob(invoice, targetElement);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
