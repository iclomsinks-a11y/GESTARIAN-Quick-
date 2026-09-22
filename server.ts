import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  // Middleware for JSON parsing (allows base64 payloads)
  app.use(express.json({ limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Helper to execute Gemini with multi-model fallback and fast cascading
  async function executeGeminiWithFallback<T>(
    ai: GoogleGenAI,
    models: string[],
    action: (model: string) => Promise<T>
  ): Promise<{ result: T; modelUsed: string }> {
    let lastErr: any = null;
    for (const model of models) {
      try {
        const result = await action(model);
        return { result, modelUsed: model };
      } catch (err: any) {
        lastErr = err;
        // On 503 (high demand) or 429 (quota), cascade immediately to the next model
        console.warn(`Model ${model} failed with ${err?.status || err?.message?.slice(0, 60)}, trying next candidate...`);
      }
    }
    throw lastErr;
  }

  // Deterministic SVG corporate vector logo generator (guaranteed fallback when Gemini is unavailable)
  function generateDeterministicSvgLogo(companyName: string, prompt: string): string {
    const cleanName = (companyName || 'Empresa').trim();
    const lowerPrompt = (prompt || '').toLowerCase();

    // Extract initials (up to 2 letters)
    const words = cleanName.split(/\s+/).filter(Boolean);
    let initials = 'GQ';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].slice(0, 2).toUpperCase();
    } else if (words.length === 1) {
      initials = words[0][0].toUpperCase();
    }

    // Color schemes based on prompt keywords
    let color1 = '#D97706'; // Gold/Amber (Gestarian Quick default)
    let color2 = '#F59E0B';
    let accentColor = '#78350F';
    let bgGradient1 = '#FFFFFF';
    let bgGradient2 = '#F8FAFC';
    let textColor = '#0F172A';

    if (lowerPrompt.includes('azul') || lowerPrompt.includes('blue') || lowerPrompt.includes('marino')) {
      color1 = '#1E40AF';
      color2 = '#3B82F6';
      accentColor = '#172554';
    } else if (lowerPrompt.includes('verde') || lowerPrompt.includes('green') || lowerPrompt.includes('eco')) {
      color1 = '#047857';
      color2 = '#10B981';
      accentColor = '#064E3B';
    } else if (lowerPrompt.includes('rojo') || lowerPrompt.includes('red') || lowerPrompt.includes('granate')) {
      color1 = '#B91C1C';
      color2 = '#EF4444';
      accentColor = '#7F1D1D';
    } else if (lowerPrompt.includes('negro') || lowerPrompt.includes('slate') || lowerPrompt.includes('gris') || lowerPrompt.includes('minimal')) {
      color1 = '#0F172A';
      color2 = '#475569';
      accentColor = '#020617';
    } else if (lowerPrompt.includes('púrpura') || lowerPrompt.includes('violeta') || lowerPrompt.includes('purple')) {
      color1 = '#6D28D9';
      color2 = '#8B5CF6';
      accentColor = '#4C1D95';
    }

    // Emblem vector geometry
    let emblemPath = '';
    if (lowerPrompt.includes('escudo') || lowerPrompt.includes('shield')) {
      emblemPath = `
        <path d="M200,60 L280,100 L280,210 C280,270 200,310 200,310 C200,310 120,270 120,210 L120,100 Z" fill="url(#emblemGrad)" stroke="${color1}" stroke-width="4" filter="url(#shadow)"/>
        <path d="M200,75 L265,110 L265,205 C265,255 200,290 200,290 C200,290 135,255 135,205 L135,110 Z" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
      `;
    } else if (lowerPrompt.includes('hexágono') || lowerPrompt.includes('hexagon') || lowerPrompt.includes('geométrico')) {
      emblemPath = `
        <polygon points="200,60 290,112 290,218 200,270 110,218 110,112" fill="url(#emblemGrad)" stroke="${color1}" stroke-width="4" filter="url(#shadow)"/>
        <polygon points="200,78 274,121 274,209 200,252 126,209 126,121" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
      `;
    } else if (lowerPrompt.includes('círculo') || lowerPrompt.includes('circular') || lowerPrompt.includes('redondo')) {
      emblemPath = `
        <circle cx="200" cy="180" r="105" fill="url(#emblemGrad)" stroke="${color1}" stroke-width="5" filter="url(#shadow)"/>
        <circle cx="200" cy="180" r="92" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6,4" opacity="0.7"/>
      `;
    } else {
      // Luxury diamond badge
      emblemPath = `
        <rect x="115" y="95" width="170" height="170" rx="36" transform="rotate(45 200 180)" fill="url(#emblemGrad)" stroke="${color1}" stroke-width="4" filter="url(#shadow)"/>
        <rect x="125" y="105" width="150" height="150" rx="28" transform="rotate(45 200 180)" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
      `;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient1}"/>
      <stop offset="100%" stop-color="${bgGradient2}"/>
    </linearGradient>
    <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="${color1}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="${accentColor}" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="400" height="400" rx="40" fill="url(#bgGrad)"/>
  <rect width="392" height="392" x="4" y="4" rx="36" fill="none" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Corporate Emblem -->
  ${emblemPath}

  <!-- Monogram Initials -->
  <text x="200" y="196" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2" filter="url(#shadow)">
    ${initials}
  </text>

  <!-- Brand Typography -->
  <text x="200" y="348" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="${textColor}" text-anchor="middle" letter-spacing="3">
    ${cleanName.toUpperCase().slice(0, 24)}
  </text>
  <text x="200" y="368" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" fill="${color1}" text-anchor="middle" letter-spacing="4">
    DOCUMENTO OFICIAL · IDENTIDAD CORPORATIVA
  </text>
</svg>`;

    return Buffer.from(svg, 'utf-8').toString('base64');
  }

  // AI Logo Generation endpoint with Multi-Model Fallback and Guaranteed Vector Synthesis
  app.post('/api/generate-logo', async (req, res) => {
    try {
      const { prompt, companyName } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Debes proporcionar una descripción para el logotipo.' });
      }

      const cleanCompany = (companyName || 'Empresa').trim();
      const cleanPrompt = prompt.trim();
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Deterministic synthesis fallback if no API key is provided
        const base64Svg = generateDeterministicSvgLogo(cleanCompany, cleanPrompt);
        return res.json({
          imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
          format: 'svg',
          modelUsed: 'gestarian-vector-engine',
          success: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const svgPrompt = `You are an elite vector graphic designer and branding specialist.
Create an exceptional, clean, modern corporate SVG logo for a business named "${cleanCompany}".
User aesthetic instructions: "${cleanPrompt}".

STRICT TECHNICAL RULES:
1. Return ONLY pure SVG code enclosed in \`\`\`xml ... \`\`\` or \`\`\`svg ... \`\`\`.
2. Attributes required on <svg>: viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
3. Include an elegant circular, rounded hexagonal, or shield backdrop in crisp #FFFFFF or subtle gradient container with border.
4. Draw sharp geometric vector icon shapes (<path>, <circle>, <polygon>, <rect>) with corporate colors (e.g. amber #F59E0B, dark slate #1E293B, gold #D97706, emerald #059669).
5. Include stylized, legible text typography for "${cleanCompany}" using system fonts (e.g. Montserrat, Helvetica, Arial) at the bottom or center.
6. NO html tags, NO markdown besides the code block, NO explanations.`;

      // Try Gemini text/SVG models in prioritized fallback sequence
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

      try {
        const { result: textResponse, modelUsed } = await executeGeminiWithFallback(
          ai,
          candidateModels,
          async (model) => {
            return await ai.models.generateContent({
              model,
              contents: svgPrompt,
            });
          }
        );

        const responseText = textResponse.text || '';
        const svgMatch = responseText.match(/<svg[\s\S]*?<\/svg>/i);

        if (svgMatch) {
          const svgCode = svgMatch[0];
          const base64Svg = Buffer.from(svgCode, 'utf-8').toString('base64');
          return res.json({
            imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
            format: 'svg',
            modelUsed,
            success: true,
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini models unavailable or high demand (503/429), applying deterministic vector synthesis fallback:', geminiError?.message);
      }

      // Safe fallback: synthesize beautiful vector logo matching prompt and company
      const fallbackBase64Svg = generateDeterministicSvgLogo(cleanCompany, cleanPrompt);
      return res.json({
        imageUrl: `data:image/svg+xml;base64,${fallbackBase64Svg}`,
        format: 'svg',
        modelUsed: 'gestarian-vector-engine',
        success: true,
      });
    } catch (err: any) {
      console.error('Unexpected error in /api/generate-logo:', err);
      // Even in case of unexpected exception, guarantee a clean vector logo
      const fallback = generateDeterministicSvgLogo(req.body?.companyName || 'Empresa', req.body?.prompt || '');
      return res.json({
        imageUrl: `data:image/svg+xml;base64,${fallback}`,
        format: 'svg',
        modelUsed: 'gestarian-vector-engine',
        success: true,
      });
    }
  });

  // OCR Invoice / Ticket Endpoint powered by Gemini Vision OCR with Multi-Model Fallback
  app.post('/api/ocr-invoice', async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Debes proporcionar una imagen válida de la factura.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'No se ha detectado la variable GEMINI_API_KEY en el servidor.',
        });
      }

      // Clean base64 string
      let base64Data = image;
      let detectedMime = mimeType || 'image/jpeg';
      if (image.startsWith('data:')) {
        const commaIndex = image.indexOf(',');
        if (commaIndex !== -1) {
          const header = image.substring(0, commaIndex);
          const match = header.match(/data:([^;]+);base64/);
          if (match) {
            detectedMime = match[1];
          }
          base64Data = image.substring(commaIndex + 1);
        }
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Actúa como un perito contable y auditor tributario experto en fiscalidad española y lectura OCR de facturas y tickets (Real Decreto 1619/2012 y Real Decreto 1007/2023).
Examina detenidamente la imagen adjunta de esta factura recibida o ticket de gasto emitida por un proveedor.
Extrae con la máxima fidelidad los siguientes datos fiscales y monetarios:
1. Proveedor: Razón social o nombre completo (supplierName), NIF/CIF/NIE (supplierCif), dirección fiscal o establecimiento (supplierAddress), teléfono (supplierPhone) y correo electrónico (supplierEmail).
2. Factura recibida: Número o serie/código de factura o ticket (invoiceNumber), fecha de expedición en formato YYYY-MM-DD (invoiceDate), concepto o resumen de productos/servicios (concept), categoría sugerida de gasto (category: Suministros, Materiales, Alquiler, Software, Servicios Profesionales, Dietas o Varios).
3. Desglose fiscal exacto en EUROS (números con hasta 2 decimales):
   - Base Imponible (baseImponible): importe antes de impuestos.
   - Tipo de IVA en porcentaje (ivaRate): normalmente 21, 10, 4 o 0.
   - Cuota de IVA (ivaAmount): importe del IVA.
   - Retención IRPF si procede (irpfRate): porcentaje (ej. 15, 7 o 0).
   - Cuota retenida de IRPF (irpfAmount): importe en euros o 0.
   - Total de la Factura (totalAmount): importe final liquidado o a pagar.
4. Notas o comentarios relevantes (notes) si hay datos borrosos o particularidades.

Si algún campo textual no está en la imagen, devuelve una cadena vacía. Si algún campo numérico no figura, calcula la equivalencia contable (Total = Base + IVA - IRPF).`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

      const { result: response, modelUsed } = await executeGeminiWithFallback(
        ai,
        candidateModels,
        async (model) => {
          return await ai.models.generateContent({
            model,
            contents: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: detectedMime,
                },
              },
              {
                text: prompt,
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  supplierName: { type: Type.STRING, description: 'Razón social o nombre del emisor/proveedor' },
                  supplierCif: { type: Type.STRING, description: 'NIF o CIF del emisor' },
                  supplierAddress: { type: Type.STRING, description: 'Dirección física o fiscal del emisor' },
                  supplierPhone: { type: Type.STRING, description: 'Teléfono de contacto' },
                  supplierEmail: { type: Type.STRING, description: 'Email de contacto' },
                  invoiceNumber: { type: Type.STRING, description: 'Número de factura o serie de ticket' },
                  invoiceDate: { type: Type.STRING, description: 'Fecha de emisión formato YYYY-MM-DD' },
                  concept: { type: Type.STRING, description: 'Concepto o descripción principal de los gastos' },
                  category: { type: Type.STRING, description: 'Categoría de gasto sugerida' },
                  baseImponible: { type: Type.NUMBER, description: 'Base imponible en euros' },
                  ivaRate: { type: Type.NUMBER, description: 'Porcentaje de IVA aplicado (ej: 21, 10, 4, 0)' },
                  ivaAmount: { type: Type.NUMBER, description: 'Cuota de IVA en euros' },
                  irpfRate: { type: Type.NUMBER, description: 'Porcentaje de retención IRPF si aplica, o 0' },
                  irpfAmount: { type: Type.NUMBER, description: 'Cuota de retención IRPF en euros, o 0' },
                  totalAmount: { type: Type.NUMBER, description: 'Importe total a pagar' },
                  notes: { type: Type.STRING, description: 'Notas fiscales u observaciones adicionales' },
                },
                required: ['supplierName', 'baseImponible', 'totalAmount'],
              },
            },
          });
        }
      );

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      // Reconcile calculations to guarantee mathematical integrity
      const base = typeof parsedData.baseImponible === 'number' ? parsedData.baseImponible : 0;
      let ivaRate = typeof parsedData.ivaRate === 'number' ? parsedData.ivaRate : 21;
      let ivaAmt = typeof parsedData.ivaAmount === 'number' ? parsedData.ivaAmount : Number(((base * ivaRate) / 100).toFixed(2));
      const irpfRate = typeof parsedData.irpfRate === 'number' ? parsedData.irpfRate : 0;
      let irpfAmt = typeof parsedData.irpfAmount === 'number' ? parsedData.irpfAmount : Number(((base * irpfRate) / 100).toFixed(2));
      let total = typeof parsedData.totalAmount === 'number' && parsedData.totalAmount > 0
        ? parsedData.totalAmount
        : Number((base + ivaAmt - irpfAmt).toFixed(2));

      return res.json({
        success: true,
        model: modelUsed,
        data: {
          supplierName: parsedData.supplierName || 'Proveedor',
          supplierCif: parsedData.supplierCif || '',
          supplierAddress: parsedData.supplierAddress || '',
          supplierPhone: parsedData.supplierPhone || '',
          supplierEmail: parsedData.supplierEmail || '',
          invoiceNumber: parsedData.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`,
          invoiceDate: parsedData.invoiceDate || new Date().toISOString().split('T')[0],
          concept: parsedData.concept || 'Suministros y servicios recibidos',
          category: parsedData.category || 'Servicios Profesionales',
          baseImponible: Number(base.toFixed(2)),
          ivaRate: Number(ivaRate),
          ivaAmount: Number(ivaAmt.toFixed(2)),
          irpfRate: Number(irpfRate),
          irpfAmount: Number(irpfAmt.toFixed(2)),
          totalAmount: Number(total.toFixed(2)),
          notes: parsedData.notes || '',
        },
      });
    } catch (err: any) {
      console.error('Error in /api/ocr-invoice:', err);
      return res.status(500).json({
        error: err?.message || 'Error en el servidor al procesar la factura con el OCR de Gemini.',
      });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express + Vite server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
