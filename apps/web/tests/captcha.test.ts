// Run with: npm test --workspace @rasvani/web   (Node's built-in test runner, no extra packages)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyTurnstile } from '../lib/captcha-core.ts';

const SECRET = 'test-secret';
/** Fake Cloudflare: "good" tokens work once, then report timeout-or-duplicate; anything else is invalid. */
function fakeProvider(goodTokens: string[]) {
  const used = new Set<string>();
  let calls = 0;
  const fetchImpl = (async (_url: string, init: { body: URLSearchParams }) => {
    calls += 1;
    const token = init.body.get('response') ?? '';
    const body = used.has(token) ? { success: false, 'error-codes': ['timeout-or-duplicate'] }
      : goodTokens.includes(token) ? (used.add(token), { success: true })
      : { success: false, 'error-codes': ['invalid-input-response'] };
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls: () => calls };
}

test('rejects a missing token without calling the provider', async () => {
  const provider = fakeProvider(['good']);
  for (const token of [undefined, null, '']) {
    const result = await verifyTurnstile({ token, secret: SECRET, fetchImpl: provider.fetchImpl });
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.reason, 'missing');
  }
  assert.equal(provider.calls(), 0);
});

test('rejects an invalid token', async () => {
  const result = await verifyTurnstile({ token: 'forged', secret: SECRET, fetchImpl: fakeProvider(['good']).fetchImpl });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'invalid');
});

test('accepts a good token once and rejects the same token when reused', async () => {
  const provider = fakeProvider(['good']);
  assert.deepEqual(await verifyTurnstile({ token: 'good', secret: SECRET, fetchImpl: provider.fetchImpl }), { ok: true });
  const again = await verifyTurnstile({ token: 'good', secret: SECRET, fetchImpl: provider.fetchImpl });
  assert.equal(again.ok, false);
  assert.equal(again.ok === false && again.reason, 'expired');
});

test('fails closed with a clear message when the provider is down', async () => {
  const down = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
  const result = await verifyTurnstile({ token: 'good', secret: SECRET, fetchImpl: down });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, 'unavailable');
  const bad = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
  const result2 = await verifyTurnstile({ token: 'good', secret: SECRET, fetchImpl: bad });
  assert.equal(result2.ok === false && result2.reason, 'unavailable');
});

test('is switched off only when no secret key is configured', async () => {
  assert.deepEqual(await verifyTurnstile({ token: undefined, secret: undefined }), { ok: true });
});

test('rejects an oversized token', async () => {
  const result = await verifyTurnstile({ token: 'x'.repeat(5000), secret: SECRET, fetchImpl: fakeProvider([]).fetchImpl });
  assert.equal(result.ok, false);
});
