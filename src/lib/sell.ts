import type { Category, Condition, Delivery } from "./data";

/** Borrador local del flujo de venta. Listo para migrar a backend más adelante. */
export type SellKind = "producto" | "servicio";

export type SellDraft = {
  step: number;
  kind: SellKind | null;
  category: Category | null;
  title: string;
  price: string;
  condition: Condition | null;
  description: string;
  images: string[]; // la primera es la portada
  delivery: Delivery[];
  savedAt: number;
};

export const EMPTY_DRAFT: SellDraft = {
  step: 0,
  kind: null,
  category: null,
  title: "",
  price: "",
  condition: null,
  description: "",
  images: [],
  delivery: [],
  savedAt: 0,
};

const DRAFT_KEY = "alamos-shop-sell-draft";

export function loadDraft(): SellDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<SellDraft>) };
  } catch {
    return null;
  }
}

export function saveDraft(d: SellDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    // Si las fotos exceden el espacio, guardamos sin ellas.
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, images: [], savedAt: Date.now() }));
    } catch {
      /* ignorar */
    }
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignorar */
  }
}

export function hasProgress(d: SellDraft) {
  return !!(d.kind || d.title || d.images.length || d.category);
}

/** Validación inicial de productos prohibidos. Estructura preparada para moderación futura. */
const BANNED: { reason: string; words: string[] }[] = [
  { reason: "drogas", words: ["droga", "marihuana", "mota", "weed", "cocaina", "cocaína", "thc", "cbd", "hongos"] },
  { reason: "alcohol", words: ["alcohol", "cerveza", "tequila", "vodka", "mezcal", "ron ", "whisky", "vino"] },
  { reason: "tabaco o vapeadores", words: ["cigarro", "tabaco", "vape", "vaper", "vapeador", "pod ", "hookah", "elfbar"] },
  { reason: "armas", words: ["arma", "pistola", "navaja", "cuchillo", "munición", "municion", "gas pimienta"] },
  { reason: "contenido sexual", words: ["sexual", "porno", "xxx", "desnudo", "nudes"] },
  { reason: "productos robados", words: ["robado", "robada", "sin factura robado"] },
  { reason: "falsificaciones", words: ["replica", "réplica", "clon", "pirata", "fake", "imitación", "imitacion"] },
  { reason: "servicios ilegales", words: ["hacer tareas por dinero", "hackear", "hackeo", "examen resuelto", "suplantar"] },
];

export function findBanned(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  for (const b of BANNED) {
    if (b.words.some((w) => t.includes(w))) return b.reason;
  }
  return null;
}
