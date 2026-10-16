import assert from 'node:assert/strict';
import test from 'node:test';
import { validateOrderItems } from './orderValidation.js';

const menu = {
  basePrices: { small: 6.5, medium: 8, large: 10.5 },
  toppings: [
    { id: 'pepperoni', price: 1 },
    { id: 'onions', price: 0.5 }
  ]
};

test('validates order prices from the server menu', () => {
  const result = validateOrderItems([
    { size: 'medium', toppings: ['pepperoni', 'onions'], price: 0.01 }
  ], menu);

  assert.deepEqual(result, {
    items: [{ size: 'medium', toppings: ['pepperoni', 'onions'], verifiedPrice: 9.5 }],
    total: 9.5
  });
});

test('rejects empty, oversized, or invalid orders', () => {
  assert.ok(validateOrderItems([], menu).error);
  assert.ok(validateOrderItems(Array(11).fill({ size: 'small', toppings: [] }), menu).error);
  assert.ok(validateOrderItems([{ size: 'extra-large', toppings: [] }], menu).error);
  assert.ok(validateOrderItems([{ size: 'small', toppings: ['unknown'] }], menu).error);
  assert.ok(validateOrderItems([{ size: 'small', toppings: ['pepperoni', 'pepperoni'] }], menu).error);
});