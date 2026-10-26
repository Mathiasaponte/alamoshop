import { describe, expect, it } from 'bun:test';
import { toCents, validateListing } from './listing-validation';
import { EMPTY_DRAFT } from './sell';
const draft = { ...EMPTY_DRAFT, kind: 'producto' as const, category: 'Tecnología' as const, title: 'Audífonos', description: 'Audífonos con su caja original.', condition: 'Nuevo' as const, price: '850', images: ['data:image/jpeg;base64,a'], delivery: ['Campus Norte' as const] };
describe('integridad de publicación', () => {
  it('guarda $850 como 85000 centavos', () => expect(toCents('850')).toBe(85000));
  it('no descarta decimales adicionales', () => expect(() => toCents('850.999')).toThrow());
  it('rechaza títulos mayores de 60 caracteres', () => expect(() => validateListing({ ...draft, title: 'a'.repeat(61) })).toThrow());
  it('rechaza descripciones mayores de 600 caracteres', () => expect(() => validateListing({ ...draft, description: 'a'.repeat(601) })).toThrow());
  it('rechaza más de seis fotos', () => expect(() => validateListing({ ...draft, images: Array(7).fill('photo') })).toThrow());
  it('permite servicios sin condición', () => expect(validateListing({ ...draft, kind: 'servicio', condition: null })).toBe(85000));
});