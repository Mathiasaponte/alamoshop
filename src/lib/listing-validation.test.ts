import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toCents, validateListing } from './listing-validation';
import { EMPTY_DRAFT } from './sell';
const draft = { ...EMPTY_DRAFT, kind: 'producto' as const, category: 'Tecnología' as const, title: 'Audífonos', description: 'Audífonos con su caja original.', condition: 'Nuevo' as const, price: '850', images: ['data:image/jpeg;base64,a'], delivery: ['Campus Norte' as const] };
describe('integridad de publicación', () => {
  it('guarda $850 como 85000 centavos', () => assert.equal(toCents('850'),85000));
  it('no descarta decimales adicionales', () => assert.throws(() => toCents('850.999')));
  it('rechaza títulos mayores de 60 caracteres', () => assert.throws(() => validateListing({ ...draft, title: 'a'.repeat(61) })));
  it('rechaza descripciones mayores de 600 caracteres', () => assert.throws(() => validateListing({ ...draft, description: 'a'.repeat(601) })));
  it('rechaza más de seis fotos', () => assert.throws(() => validateListing({ ...draft, images: Array(7).fill('photo') })));
  it('permite servicios sin condición', () => assert.equal(validateListing({ ...draft, kind: 'servicio', condition: null }),85000));
});