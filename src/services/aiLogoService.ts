export interface GenerateLogoResult {
  imageUrl: string;
  format?: 'raster' | 'svg';
  modelUsed?: string;
  success: boolean;
  error?: string;
}

export const SUGGESTED_LOGO_PROMPTS = [
  'Minimalista geométrico con isotipo dorado y detalles en gris pizarra',
  'Elegante corporativo azul marino y oro con monograma estilizado',
  'Emblema circular moderno con tipografía sobria para factura legal',
  'Isotipo tecnológico y de consultoría con líneas limpias sobre blanco',
  'Diseño arquitectónico refinado con vectores nítidos y alto contraste',
];

/**
 * Calls the server-side /api/generate-logo endpoint powered by Google Gemini API
 */
export async function generateLogoWithAI(
  prompt: string,
  companyName: string
): Promise<GenerateLogoResult> {
  try {
    const response = await fetch('/api/generate-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        companyName: companyName || 'Empresa',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error del servidor (${response.status}: ${response.statusText})`
      );
    }

    const data = await response.json();

    if (!data.imageUrl) {
      throw new Error('El servidor no devolvió una URL válida para el logotipo.');
    }

    return {
      imageUrl: data.imageUrl,
      format: data.format,
      modelUsed: data.modelUsed,
      success: true,
    };
  } catch (err: any) {
    console.warn('Network / server call failed, providing instant vector synthesis fallback:', err);
    try {
      const fallbackUrl = generateClientFallbackSvg(companyName, prompt);
      return {
        imageUrl: fallbackUrl,
        format: 'svg',
        modelUsed: 'gestarian-vector-engine',
        success: true,
      };
    } catch {
      return {
        imageUrl: '',
        success: false,
        error: err.message || 'No se pudo generar el logotipo.',
      };
    }
  }
}

function generateClientFallbackSvg(companyName: string, prompt: string): string {
  const cleanName = (companyName || 'Empresa').trim();
  const lowerPrompt = (prompt || '').toLowerCase();

  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'GQ';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0][0].toUpperCase();
  }

  let color1 = '#D97706';
  let color2 = '#F59E0B';
  let accentColor = '#78350F';

  if (lowerPrompt.includes('azul') || lowerPrompt.includes('blue') || lowerPrompt.includes('marino')) {
    color1 = '#1E40AF';
    color2 = '#3B82F6';
    accentColor = '#172554';
  } else if (lowerPrompt.includes('verde') || lowerPrompt.includes('green') || lowerPrompt.includes('eco')) {
    color1 = '#047857';
    color2 = '#10B981';
    accentColor = '#064E3B';
  } else if (lowerPrompt.includes('rojo') || lowerPrompt.includes('red')) {
    color1 = '#B91C1C';
    color2 = '#EF4444';
    accentColor = '#7F1D1D';
  } else if (lowerPrompt.includes('negro') || lowerPrompt.includes('slate') || lowerPrompt.includes('minimal')) {
    color1 = '#0F172A';
    color2 = '#475569';
    accentColor = '#020617';
  }

  const svg = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
    <linearGradient id="emG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="${color1}"/>
    </linearGradient>
    <filter id="sh" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="${accentColor}" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="400" height="400" rx="40" fill="url(#bgG)"/>
  <rect width="392" height="392" x="4" y="4" rx="36" fill="none" stroke="#E2E8F0" stroke-width="2"/>
  <rect x="115" y="95" width="170" height="170" rx="36" transform="rotate(45 200 180)" fill="url(#emG)" stroke="${color1}" stroke-width="4" filter="url(#sh)"/>
  <rect x="125" y="105" width="150" height="150" rx="28" transform="rotate(45 200 180)" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
  <text x="200" y="196" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2" filter="url(#sh)">${initials}</text>
  <text x="200" y="348" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="3">${cleanName.toUpperCase().slice(0, 24)}</text>
  <text x="200" y="368" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" fill="${color1}" text-anchor="middle" letter-spacing="4">DOCUMENTO OFICIAL · IDENTIDAD CORPORATIVA</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
