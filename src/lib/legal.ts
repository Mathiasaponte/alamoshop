export const TERMS_VERSION = "1.0";
export const PRIVACY_VERSION = "1.0";
export const LEGAL_UPDATED = "27 de septiembre de 2026";
export const CONTACT_EMAIL = "hola@alamosshop.com";

const KEY = "alamos-shop-consent";

export type Consent = { termsVersion: string; privacyVersion: string; acceptedAt: number };

/** Local-only consent record (no real accounts yet — never claims server-side consent). */
export function loadConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null") as Consent | null;
    if (c && c.termsVersion === TERMS_VERSION && c.privacyVersion === PRIVACY_VERSION) return c;
  } catch {}
  return null;
}

export function saveConsent() {
  const c: Consent = { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION, acceptedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(c));
  return c;
}

/** Team members shown on /nosotros. Empty until real people are configured. */
export const TEAM: { name: string; role: string; bio: string; photo?: string }[] = [];

/** Social campaigns shown on /transparencia. Empty until an admin confirms one. */
export const CAMPAIGNS: {
  name: string;
  org: string;
  goal: string;
  start: string;
  end: string;
  percent: number;
  raised: number;
  status: "Activa" | "Finalizada" | "Fondos entregados";
}[] = [];

/** Public metrics. Only real, platform-wide numbers belong here. */
export const METRICS = { graduationFund: 0, causes: 0, completedOrders: 0, participants: 0 };
