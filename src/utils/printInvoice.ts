/**
 * Gestarian Quick - Impresión aislada de documentos A4
 *
 * Problema original: se llamaba a `window.print()` sobre toda la aplicación
 * (contenedor raíz `h-screen overflow-hidden`, scroll lateral de 5 páginas,
 * overlays `fixed`...). El navegador imprimía la app recortada o en blanco
 * y, en algunos contextos (iframes/overlays), el diálogo ni llegaba a abrirse.
 *
 * Solución: se clona únicamente la hoja A4 en un iframe oculto con los mismos
 * estilos de la app y se invoca `print()` sobre ese iframe. Así se abre el
 * diálogo nativo del sistema (impresora predeterminada, nº de copias, PDF...).
 */

let printInProgress = false;

function collectStylesHtml(): string {
  const parts: string[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    if (node instanceof HTMLLinkElement) {
      // `node.href` ya devuelve la URL absoluta resuelta
      parts.push(`<link rel="stylesheet" href="${node.href}">`);
    } else {
      parts.push(node.outerHTML);
    }
  });
  return parts.join('\n');
}

function waitForImages(doc: Document, timeoutMs = 2500): Promise<void> {
  const imgs = Array.from(doc.images).filter((img) => !img.complete);
  if (imgs.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let pending = imgs.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) resolve();
    };
    imgs.forEach((img) => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
    setTimeout(resolve, timeoutMs);
  });
}

function waitForStylesheets(doc: Document, timeoutMs = 2500): Promise<void> {
  const links = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  if (links.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let pending = links.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) resolve();
    };
    links.forEach((l) => {
      if (l.sheet) return done();
      l.addEventListener('load', done, { once: true });
      l.addEventListener('error', done, { once: true });
    });
    setTimeout(resolve, timeoutMs);
  });
}

/**
 * Imprime un elemento del DOM abriendo el diálogo de impresión nativo del sistema.
 * @param element Nodo a imprimir (normalmente la hoja A4 de la vista de impresión)
 * @param title   Título del documento (lo usa el navegador como nombre del PDF)
 */
export async function printElement(element: HTMLElement | null, title = 'Factura'): Promise<void> {
  if (!element) {
    console.warn('[printElement] No se encontró el documento a imprimir; se usa window.print().');
    window.print();
    return;
  }
  if (printInProgress) return;
  printInProgress = true;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'print-frame');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  } as CSSStyleDeclaration);
  document.body.appendChild(iframe);

  const cleanup = () => {
    printInProgress = false;
    setTimeout(() => iframe.remove(), 500);
  };

  try {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument || win?.document;
    if (!win || !doc) throw new Error('No se pudo crear el marco de impresión');

    const safeTitle = title.replace(/[<>]/g, '');
    doc.open();
    doc.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <base href="${window.location.origin}/">
  <title>${safeTitle}</title>
  ${collectStylesHtml()}
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; color: #000 !important; height: auto !important; overflow: visible !important; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print, .print\\:hidden { display: none !important; }
    .a4-sheet { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; transform: none !important; }
  </style>
</head>
<body>${element.outerHTML}</body>
</html>`);
    doc.close();

    await waitForStylesheets(doc);
    await waitForImages(doc);
    // Pequeña espera para que las fuentes web terminen de aplicarse
    try {
      await (doc as any).fonts?.ready;
    } catch {
      /* noop */
    }

    win.addEventListener('afterprint', cleanup, { once: true });
    win.focus();
    win.print();
    // Safari/iOS no siempre emite afterprint
    setTimeout(cleanup, 60_000);
  } catch (err) {
    console.error('[printElement] Error preparando impresión aislada, se usa window.print():', err);
    printInProgress = false;
    iframe.remove();
    window.print();
  }
}

export const PRINT_SHEET_ELEMENT_ID = 'a4-print-sheet-preview';

/** Imprime la hoja A4 de la vista de impresión abierta. */
export function printInvoiceSheet(invoiceNumber?: string): Promise<void> {
  return printElement(
    document.getElementById(PRINT_SHEET_ELEMENT_ID),
    invoiceNumber ? `Factura ${invoiceNumber}` : 'Factura'
  );
}
