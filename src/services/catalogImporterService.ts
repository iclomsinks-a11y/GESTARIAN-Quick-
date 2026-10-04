import { BillableProduct } from '../types';

export interface ExtractedCatalogItem {
  id: string;
  code?: string;
  name: string;
  description?: string;
  price?: number;
  selected: boolean;
}

/**
  Formats concept with code at beginning if present: [CODE] Name or CODE - Name
 */
export function formatConceptWithCode(code?: string, name?: string, description?: string): string {
  let cleanName = (name || description || code || '').trim();
  if (!cleanName) return '';

  if (code && code.trim() && name && name.trim()) {
    const cleanCode = code.trim();
    const lowerName = cleanName.toLowerCase();
    const lowerCode = cleanCode.toLowerCase();

    // Avoid double prefixing if name already starts with code or [code]
    const alreadyStartsWithCode =
      lowerName.startsWith(lowerCode) ||
      lowerName.startsWith(`[${lowerCode}]`) ||
      lowerName.startsWith(`${lowerCode} -`) ||
      lowerName.startsWith(`${lowerCode}:`);

    if (!alreadyStartsWithCode) {
      cleanName = `${cleanCode} - ${cleanName}`;
    }
  }

  if (description && description.trim() && cleanName.toLowerCase() !== description.trim().toLowerCase()) {
    if (!cleanName.toLowerCase().includes(description.trim().toLowerCase())) {
      return `${cleanName} — ${description.trim()}`;
    }
  }
  return cleanName;
}

/**
 * Extracts the product name without the leading code prefix for alphabetical sorting
 */
export function getProductNameForSorting(product: { code?: string; name: string }): string {
  let name = (product.name || '').trim();
  if (!name) return '';

  if (product.code && product.code.trim()) {
    const codeClean = product.code.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`^(?:\\[?${codeClean}\\]?\\s*[-:]?\\s*)*`, 'i');
    name = name.replace(regex, '').trim();
  }
  // Strip any leading code pattern like "FFC123 - " or "FFL04 - "
  name = name.replace(/^[A-Z0-9\-_]{2,12}\s*[\-:]\s*/i, '').trim();
  return name || product.name || '';
}

/**
 * Sorts an array of products strictly by product name (ignoring code prefix)
 */
export function sortProductsByName<T extends { code?: string; name: string }>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const nameA = getProductNameForSorting(a);
    const nameB = getProductNameForSorting(b);
    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base', numeric: true });
  });
}

const generateId = () =>
  `prod-cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

/**
 * Client-side robust parser for HTML tables, list items, CSV/TSV, and plain text
 */
export function parseCatalogFromTextOrHtml(raw: string): ExtractedCatalogItem[] {
  if (!raw || !raw.trim()) return [];

  const text = raw.trim();
  const items: ExtractedCatalogItem[] = [];
  const seenNames = new Set<string>();

  const addProduct = (name: string, description?: string, price?: number, code?: string) => {
    let cleanName = name.replace(/\s+/g, ' ').trim();
    if (!cleanName || cleanName.length < 2) return;
    
    // Ignore generic table headers
    const lower = cleanName.toLowerCase();
    if (
      lower === 'nombre' ||
      lower === 'producto' ||
      lower === 'concepto' ||
      lower === 'descripción' ||
      lower === 'precio' ||
      lower === 'item' ||
      lower === 'title' ||
      lower === 'price' ||
      lower === 'código' ||
      lower === 'codigo' ||
      lower === 'referencia'
    ) {
      return;
    }

    let extractedCode = code?.trim();

    // Check if cleanName starts with a code like [REF-01] or COD123 - Name
    if (!extractedCode) {
      const codeMatch = cleanName.match(/^\[([A-Z0-9\-_]{2,15})\]\s*(.*)$/i) ||
                        cleanName.match(/^([A-Z0-9\-_]{2,12})\s*[\-:]\s*(.+)$/i);
      if (codeMatch && codeMatch[2] && codeMatch[2].length >= 2) {
        extractedCode = codeMatch[1].trim();
        cleanName = codeMatch[2].trim();
      }
    }

    const finalConcept = formatConceptWithCode(extractedCode, cleanName);
    const key = finalConcept.toLowerCase();

    if (seenNames.has(key)) return;
    seenNames.add(key);

    items.push({
      id: generateId(),
      code: extractedCode || undefined,
      name: finalConcept,
      description: description?.replace(/\s+/g, ' ').trim() || undefined,
      price: undefined, // Prices omitted for complete catalogs (filled dynamically on invoice)
      selected: true,
    });
  };

  // 1. Try parsing JSON array directly
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && (p.name || p.title || p.concepto)) {
            addProduct(
              p.name || p.title || p.concepto,
              p.description || p.descripcion,
              Number(p.price || p.precio),
              p.code || p.codigo || p.ref || p.sku
            );
          }
        }
        if (items.length > 0) return items;
      }
    } catch {
      // Not JSON, continue
    }
  }

  // Helper to parse price from string like "12.50€", "25,99 €", "1200", "$45.00"
  const extractPrice = (str: string): number | undefined => {
    if (!str) return undefined;
    const match = str.match(/(\d+[\d.,]*)\s*(?:€|\$|EUR|USD|euros)?/i);
    if (match) {
      let numStr = match[1];
      if (numStr.includes(',') && numStr.includes('.')) {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else if (numStr.includes(',')) {
        numStr = numStr.replace(',', '.');
      }
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0 && val < 1000000) return val;
    }
    return undefined;
  };

  // 2. Try parsing HTML DOM if in browser environment
  if (typeof window !== 'undefined' && (text.includes('<html') || text.includes('<table') || text.includes('<tr') || text.includes('<li') || text.includes('<div'))) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // 2a. Table rows
      const rows = Array.from(doc.querySelectorAll('tr'));
      if (rows.length > 0) {
        for (const row of rows) {
          const codEl = row.querySelector('.col-cod, td:first-child');
          const artEl = row.querySelector('.col-art, td:nth-child(2)');
          const preEl = row.querySelector('.col-pre, td:nth-child(3)');

          const cells = Array.from(row.querySelectorAll('td, th')).map((c) => (c.textContent || '').trim());
          if (cells.length >= 1) {
            let code: string | undefined;
            let name = cells[0];
            let desc: string | undefined;
            let priceStr: string | undefined;

            if (row.querySelector('.col-cod') || row.querySelector('.col-art')) {
              code = (row.querySelector('.col-cod')?.textContent || '').trim();
              name = (row.querySelector('.col-art')?.textContent || cells[0] || '').trim();
            } else if (cells.length >= 2 && cells[0].length <= 15 && /^[A-Z0-9\-_]{2,15}$/i.test(cells[0])) {
              code = cells[0];
              name = cells[1];
              if (cells.length >= 3 && !/\d+\s*€/.test(cells[2])) {
                desc = cells[2];
              }
            } else if (cells.length >= 2) {
              desc = cells.length >= 2 && !/\d+\s*€/.test(cells[1]) ? cells[1] : undefined;
            }

            priceStr = cells.find((c, idx) => idx > 0 && /\d/.test(c));
            const price = priceStr ? extractPrice(priceStr) : undefined;

            if (name) {
              addProduct(name, desc, price, code);
            }
          }
        }
      }

      // 2b. List items <li>
      if (items.length === 0) {
        const listItems = Array.from(doc.querySelectorAll('li'));
        for (const li of listItems) {
          const content = (li.textContent || '').trim();
          if (content) {
            // Split content by dash or colon
            const parts = content.split(/[-–—:]/);
            const name = parts[0]?.trim();
            const desc = parts.length > 1 ? parts.slice(1).join(' ').trim() : undefined;
            const price = extractPrice(content);
            if (name) {
              addProduct(name, desc, price);
            }
          }
        }
      }

      // 2c. Product cards or headings
      if (items.length === 0) {
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, .product-title, .title, .item-name'));
        for (const h of headings) {
          const name = (h.textContent || '').trim();
          const parent = h.parentElement;
          const priceEl = parent?.querySelector('.price, .precio, .amount');
          const descEl = parent?.querySelector('p, .description, .desc');
          const price = priceEl ? extractPrice(priceEl.textContent || '') : extractPrice(parent?.textContent || '');
          const desc = descEl ? (descEl.textContent || '').trim() : undefined;
          if (name) {
            addProduct(name, desc, price);
          }
        }
      }

      if (items.length > 0) return items;
    } catch (e) {
      console.warn('DOMParser fallback, proceeding to text parsing', e);
    }
  }

  // 3. Fallback: Parse line-by-line (Text, CSV, TSV, HTML stripped)
  const cleanText = text.replace(/<[^>]*>/g, ' '); // Strip HTML tags
  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.length < 3) continue;

    // Check CSV/TSV separators (;, \t, |)
    const delims = [';', '\t', '|', ','];
    let parsedCsv = false;

    for (const d of delims) {
      if (line.includes(d)) {
        const parts = line.split(d).map((p) => p.trim());
        if (parts.length >= 2 && parts[0].length >= 2) {
          const name = parts[0];
          let price: number | undefined;
          let desc: string | undefined;

          // Check if last part is price
          const lastPart = parts[parts.length - 1];
          if (/\d/.test(lastPart)) {
            price = extractPrice(lastPart);
          }

          if (parts.length >= 3) {
            desc = parts.slice(1, parts.length - (price !== undefined ? 1 : 0)).join(' ');
          }

          addProduct(name, desc, price);
          parsedCsv = true;
          break;
        }
      }
    }

    if (!parsedCsv) {
      // Split line by colon or dash
      const parts = line.split(/[-–—:]/);
      const name = parts[0]?.trim();
      const desc = parts.length > 1 ? parts.slice(1).join(' ').trim() : undefined;
      const price = extractPrice(line);

      if (name) {
        addProduct(name, desc, price);
      }
    }
  }

  return items;
}

/**
 * Server API helper to parse catalog content with Gemini AI
 */
export async function parseCatalogWithGeminiAi(
  content: string,
  clientName?: string
): Promise<{ success: boolean; items: ExtractedCatalogItem[]; error?: string }> {
  try {
    const response = await fetch('/api/parse-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, clientName }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const json = await response.json();
    if (json.success && Array.isArray(json.items)) {
      const itemsWithSelection: ExtractedCatalogItem[] = json.items.map((it: any) => {
        const itemCode = it.code || it.codigo || it.ref || it.sku || undefined;
        const rawName = it.name || it.title || 'Producto sin nombre';
        const formattedConcept = formatConceptWithCode(itemCode, rawName);
        return {
          id: generateId(),
          code: itemCode,
          name: formattedConcept,
          description: it.description || undefined,
          price: undefined, // Prices vary per invoice and are filled directly on invoice creation
          selected: true,
        };
      });
      return { success: true, items: itemsWithSelection };
    }

    throw new Error(json.error || 'Error al procesar el catálogo.');
  } catch (err: any) {
    console.warn('AI Catalog parse failed, using client fallback:', err?.message);
    const fallbackItems = parseCatalogFromTextOrHtml(content);
    return {
      success: fallbackItems.length > 0,
      items: fallbackItems,
      error: fallbackItems.length === 0 ? (err?.message || 'No se pudieron extraer productos.') : undefined,
    };
  }
}

/**
 * Helper to fetch content from a web URL
 */
export async function fetchCatalogFromWebUrl(
  url: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const response = await fetch('/api/fetch-catalog-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor al obtener la URL (${response.status})`);
    }

    const json = await response.json();
    if (!json.success || !json.content) {
      throw new Error(json.error || 'No se pudo obtener el contenido de la web.');
    }

    return { success: true, content: json.content };
  } catch (err: any) {
    console.warn('Backend fetch URL failed, attempting direct fetch:', err?.message);
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }
      const res = await fetch(cleanUrl);
      const text = await res.text();
      return { success: true, content: text };
    } catch (directErr: any) {
      return {
        success: false,
        error: `No se pudo conectar a la URL (${err?.message || directErr?.message || 'Bloqueo CORS'}). Prueba subiendo un archivo .txt/.html o pegando el texto directamente.`,
      };
    }
  }
}
