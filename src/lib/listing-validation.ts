import { findBanned, type SellDraft } from './sell';

export function toCents(price: string): number {
  const normalized = price.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Escribe un precio válido.');
  const [whole = '', decimal = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 10000000) throw new Error('Escribe un precio válido.');
  return cents;
}

export function validateListing(d: SellDraft) {
  if (!d.kind || !d.category) throw new Error('Elige tipo y categoría.');
  if (d.title.trim().length < 3 || d.title.trim().length > 60) throw new Error('El título debe tener entre 3 y 60 caracteres.');
  if (d.description.trim().length < 10 || d.description.trim().length > 600) throw new Error('La descripción debe tener entre 10 y 600 caracteres.');
  if (findBanned(`${d.title} ${d.description}`)) throw new Error('Esta publicación contiene productos o servicios prohibidos.');
  if (d.kind === 'producto' && !d.condition) throw new Error('Elige el estado.');
  if (d.images.length < 1 || d.images.length > 6) throw new Error('Agrega entre 1 y 6 fotos.');
  if (!d.delivery.length) throw new Error('Elige un lugar de entrega.');
  return toCents(d.price);
}