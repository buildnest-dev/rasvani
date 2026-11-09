import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discountPercent, priceFor, type PackSize } from '../lib/pack-sizes.ts';

const sizes: PackSize[] = [
  { id: 'g250', label: '250 g', pricePaise: 12000, mrpPaise: 15000 },
  { id: 'g500', label: '500 g', pricePaise: 22000, mrpPaise: null },
];
test('the price comes from the chosen pack size', () => {
  assert.deepEqual(priceFor({ pricePaise: 1, sizes }, 'g500'), { pricePaise: 22000, mrpPaise: null, label: '500 g' });
  assert.equal(priceFor({ pricePaise: 1, sizes }, 'g250')?.mrpPaise, 15000);
});
test('a size that is not offered, or a missing size on a sized product, is refused', () => {
  assert.equal(priceFor({ pricePaise: 1, sizes }, 'kg1'), null);
  assert.equal(priceFor({ pricePaise: 1, sizes }, undefined), null);
  assert.equal(priceFor({ pricePaise: 1, sizes }, 'constructor'), null);
});
test('a product without sizes uses its own price and refuses a made-up size', () => {
  assert.equal(priceFor({ pricePaise: 9900 })?.pricePaise, 9900);
  assert.equal(priceFor({ pricePaise: 9900 }, 'g250'), null);
});
test('discount percent only for an MRP above the price', () => {
  assert.equal(discountPercent(12000, 15000), 20);
  assert.equal(discountPercent(12000, 12000), 0);
  assert.equal(discountPercent(12000, 100), 0);
  assert.equal(discountPercent(12000, null), 0);
});
