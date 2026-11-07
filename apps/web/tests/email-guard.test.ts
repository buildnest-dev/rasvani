import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mirrors the guards in lib/firebase/admin.ts and app/actions/session.ts: letters such as "s" must never be rejected.
const plain = (email: string) => email.length > 0 && email.length <= 254 && !email.includes('/') && !/\s/.test(email);

test('normal emails are accepted, including ones with the letter s', () => {
  for (const email of ['rasvanifoods@gmail.com', 'zyqotech@gmail.com', 'sam.s+x@example.co.in']) assert.equal(plain(email), true);
});
test('emails that could address another Firestore path or contain spaces are refused', () => {
  for (const email of ['a/b@x.com', 'a b@x.com', '']) assert.equal(plain(email), false);
});
