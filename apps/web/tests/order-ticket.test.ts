import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketTypeFor } from '../lib/orders.ts';

test('before dispatch a customer can request a cancellation', () => {
  for (const status of ['placed', 'confirmed', 'accepted', 'preparing', 'ready']) assert.equal(ticketTypeFor(status), 'cancel');
});
test('from dispatch on only a refund can be requested', () => {
  for (const status of ['dispatched', 'delivered']) assert.equal(ticketTypeFor(status), 'refund');
});
test('a cancelled order accepts no new request', () => {
  assert.equal(ticketTypeFor('cancelled'), null);
});
