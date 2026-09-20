import { ConceptHistoryItem } from '../types';

const STORAGE_KEY = 'gestarian_concepts_memory';

const INITIAL_CONCEPTS: string[] = [
  'Desarrollo de aplicación web a medida',
  'Diseño gráfico y manual de identidad corporativa',
  'Consultoría tecnológica y asesoramiento estratégico',
  'Mantenimiento informático y soporte mensual',
  'Auditoría de seguridad y análisis de rendimiento',
  'Redacción de contenidos publicitarios y copywriting',
  'Campaña de marketing digital y posicionamiento SEO',
  'Gestión y configuración de servidores en la nube',
  'Servicio de fotografía profesional de producto',
  'Formación técnica personalizada para empleados',
];

export function loadConceptsMemory(): ConceptHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const now = Date.now();
      const defaults: ConceptHistoryItem[] = INITIAL_CONCEPTS.map((text, idx) => ({
        text,
        count: 10 - idx,
        lastUsed: now - idx * 3600000,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading concepts memory:', e);
  }
  return [];
}

export function saveConceptToMemory(text: string): ConceptHistoryItem[] {
  const clean = text?.trim();
  if (!clean || clean.length < 2) return loadConceptsMemory();

  const current = loadConceptsMemory();
  const lower = clean.toLowerCase();
  const existingIdx = current.findIndex((item) => item.text.toLowerCase() === lower);

  let updated: ConceptHistoryItem[];
  if (existingIdx >= 0) {
    updated = current.map((item, idx) =>
      idx === existingIdx
        ? { ...item, text: clean, count: item.count + 1, lastUsed: Date.now() }
        : item
    );
  } else {
    const newItem: ConceptHistoryItem = {
      text: clean,
      count: 1,
      lastUsed: Date.now(),
    };
    updated = [newItem, ...current];
  }

  // Sort by count and recency
  updated.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving concept to memory:', e);
  }

  return updated;
}

export const addConceptToMemory = saveConceptToMemory;

export function deleteConceptFromMemory(text: string): ConceptHistoryItem[] {
  const current = loadConceptsMemory();
  const updated = current.filter((item) => item.text.toLowerCase() !== text.toLowerCase());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting concept:', e);
  }
  return updated;
}

export function clearConceptsMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing concepts:', e);
  }
}

/**
 * Intelligent search function supporting prefix and multi-token matching
 * Example:
 * - "co" -> matches "Consultoría", "Coche", "Copywriting"
 * - "coche a z" -> matches "Coche azul metalizado", etc.
 */
export function searchConcepts(query: string, concepts: ConceptHistoryItem[]): ConceptHistoryItem[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return concepts.slice(0, 8);

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scored = concepts
    .map((item) => {
      const itemLower = item.text.toLowerCase();
      let matchesAllTokens = true;
      let score = 0;

      // Exact prefix bonus
      if (itemLower.startsWith(cleanQuery)) {
        score += 100;
      }

      // Check each token
      for (const token of queryTokens) {
        const tokenIndex = itemLower.indexOf(token);
        if (tokenIndex === -1) {
          matchesAllTokens = false;
          break;
        } else if (tokenIndex === 0 || itemLower[tokenIndex - 1] === ' ') {
          // Word starts with token
          score += 30;
        } else {
          // Token is inside word
          score += 10;
        }
      }

      if (!matchesAllTokens) return null;

      // Add popularity score
      score += Math.min(item.count, 20);

      return { item, score };
    })
    .filter((entry): entry is { item: ConceptHistoryItem; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  return scored.slice(0, 10);
}
