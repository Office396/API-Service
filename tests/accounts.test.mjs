import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';
import { startTestServer } from './test-server.mjs';

test('account ownership and metering across the HTTP boundary', async t => {
  const app = await startTestServer();
  t.after(app.close);
  const call = (route, method = 'GET', cookie = '', data, headers) => fetch(app.origin + route, {
    method, headers: { cookie, origin: app.origin, 'content-type': 'application/json', ...headers },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const session = async (kind, credentials) => {
    const res = await call(`/api/auth/${kind}/email`, 'POST', '', credentials);
    assert.equal(res.status, 200, kind);
    const cookies = res.headers.getSetCookie();
    assert.ok(cookies.some(c => c.includes('HttpOnly')));
    return cookies.map(c => c.split(';')[0]).join('; ');
  };
  const list = async cookie => (await call('/api/keys', 'GET', cookie)).json();
  const create = (cookie, name) => call('/api/keys', 'POST', cookie, { name });
  const run = key => call('/v1/hash', 'POST', '', { input: 'hello' }, { authorization: `Bearer ${key}` });
  const remove = (cookie, id) => call(`/api/keys?id=${id}`, 'DELETE', cookie);
  const alice = { name: 'Alice', email: 'alice@example.test', password: randomBytes(24).toString('base64url') };
  const bob = { ...alice, name: 'Bob', email: 'bob@example.test' };

  const health = await fetch(app.origin + '/health');
  assert.equal(health.status, 200);
  assert.match(health.headers.get('cache-control'), /no-store/);
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal((await call('/api/keys')).status, 401, 'listing needs a session');
  assert.equal((await create('', 'anonymous')).status, 401);
  assert.equal((await remove('', 'key_000000000000')).status, 401);
  assert.equal((await run('tk_demo_local')).status, 401);
  const shortPassword = await call('/api/auth/sign-up/email', 'POST', '', { ...alice, password: alice.password.slice(0, 11) });
  assert.equal(shortPassword.status, 400);
  assert.match((await shortPassword.json()).error.message, /at least 12 characters/i);
  assert.equal(shortPassword.headers.get('set-cookie'), null);
  const a = await session('sign-up', alice);
  const b = await session('sign-up', bob);

  assert.equal((await call('/api/keys', 'POST', a, { name: 'not created' }, { origin: 'https://other.example' })).status, 403);
  assert.equal((await call('/api/keys', 'POST', a, { name: 'no origin' }, { origin: '' })).status, 403);
  const preview = { origin: 'https://preview.toolzync.test' };
  const previewCreate = await call('/api/keys', 'POST', a, { name: 'preview build' }, preview);
  assert.equal(previewCreate.status, 201, 'allowlisted origin can manage keys');
  const previewKey = (await previewCreate.json()).data;
  assert.equal((await call(`/api/keys?id=${previewKey.record.id}`, 'DELETE', a, undefined, preview)).status, 200);
  assert.equal((await run(previewKey.key)).status, 401, 'revoked keys stop authenticating');
  assert.equal((await call(`/api/keys?id=${previewKey.record.id}`, 'DELETE', a, undefined, preview)).status, 404);
  const attempts = await Promise.all([1, 2, 3].map(i => create(a, `key-${i}`)));
  assert.equal(attempts.filter(r => r.status === 201).length, 2);
  assert.equal(attempts.filter(r => r.status === 409).length, 1, 'only active keys count toward the cap');
  const [a1, a2] = await Promise.all(attempts.filter(r => r.ok).map(async r => (await r.json()).data));
  const b1 = (await (await create(b, 'Bob only')).json()).data;
  assert.deepEqual((await list(b)).data.map(k => k.id), [b1.record.id]);
  assert.equal((await list(a)).data.length, 3);
  assert.equal((await list(a)).data.filter(k => !k.revokedAt).length, 2);
  assert.equal((await list(a)).data.at(-1).revokedAt !== null, true, 'revoked keys sort after active ones');
  assert.equal((await remove(b, a1.record.id)).status, 404);
  assert.equal((await run(a1.key)).headers.get('x-quota-remaining'), '999');
  assert.equal((await run(a2.key)).headers.get('x-quota-remaining'), '998');
  assert.equal((await list(a)).meta.usage.used, 2);
  assert.equal((await list(b)).meta.usage.used, 0);
  const bad = await call('/v1/hash', 'POST', '', {}, { 'x-api-key': a1.key });
  assert.equal(bad.status, 400);
  assert.equal((await remove(a, a1.record.id)).status, 200);
  assert.equal((await run(a1.key)).status, 401);
  assert.equal((await list(a)).meta.usage.used, 2, 'revocation and invalid inputs do not reset or increase usage');
  const revokedA1 = (await list(a)).data.find(k => k.id === a1.record.id);
  assert.ok(revokedA1?.revokedAt, 'revoked keys stay on record for the dashboard');
  assert.equal((await create(a, 'replacement')).status, 201, 'a revoked key frees its slot');
  assert.equal((await create(a, 'over cap')).status, 409);

  const db = new Database(path.join(app.dir, 'toolzync.sqlite'), { fileMustExist: true });
  try {
    const stored = db.prepare('SELECT hash FROM api_keys WHERE id = ?').get(a2.record.id);
    assert.match(stored.hash, /^[a-f0-9]{64}$/);
    const keys = (await list(a)).data;
    assert.ok(!JSON.stringify(keys).includes(a2.key) && !('hash' in keys[0]));
    const { asOf } = (await list(a)).meta.usage;
    const now = new Date(asOf);
    const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1)).toISOString().slice(0, 7));
    db.prepare('INSERT INTO monthly_usage (ownerId, month, used) SELECT ownerId, ?, 37 FROM api_keys WHERE id = ?').run(months[4], a2.record.id);
    assert.deepEqual((await list(a)).meta.usage.history, months.map((month, i) => ({ month, used: i === 4 ? 37 : i === 5 ? 2 : 0 })));
    assert.deepEqual((await list(b)).meta.usage.history, months.map(month => ({ month, used: 0 })), 'history never includes another account');
    // Seed the final request of this account's month, rather than flooding the API.
    db.prepare('UPDATE monthly_usage SET used = 999 WHERE month = ? AND ownerId = (SELECT ownerId FROM api_keys WHERE id = ?)').run(months[5], a2.record.id);
  } finally { db.close(); }
  const last = await Promise.all([run(a2.key), run(a2.key)]);
  assert.deepEqual(last.map(r => r.status).sort(), [200, 429]);
  assert.equal((await last.find(r => r.status === 429).json()).error.code, 'quota_exceeded');
  assert.equal((await run(b1.key)).headers.get('x-quota-remaining'), '999');
  const meta = fields => call('/v1/meta-tag-generator', 'POST', '', fields, { 'x-api-key': b1.key });
  const pageFields = { title: 'Notes & "Ideas"', description: 'A guide to <head> tags.', url: 'https://example.test/notes' };
  const invalidMeta = await meta({ ...pageFields, url: 'not a URL' });
  assert.equal(invalidMeta.status, 400);
  assert.equal((await invalidMeta.json()).error.field, 'url');
  const response = await meta(pageFields);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-quota-remaining'), '998');
  const { data: tags } = await response.json();
  assert.ok(tags.html.includes('<meta property="og:title" content="Notes &amp; &quot;Ideas&quot;">'));
  assert.ok(tags.html.includes('A guide to &lt;head&gt; tags.'));
  assert.ok(!tags.html.includes('og:image'));
  await app.restart();
  assert.equal((await list(a)).meta.usage.used, 1000);
  assert.equal((await list(a)).data.find(k => k.id === a1.record.id)?.revokedAt, revokedA1.revokedAt);
  assert.equal((await run(a1.key)).status, 401);
  assert.equal((await list(b)).data[0].id, b1.record.id);
  assert.equal((await call('/api/auth/sign-out', 'POST', a, {})).status, 200);
  assert.equal((await call('/api/keys', 'GET', a)).status, 401, 'server invalidates logged-out sessions');
  assert.equal((await call('/api/keys', 'GET', b)).status, 200);
  assert.equal((await call('/api/auth/sign-in/email', 'POST', '', { email: alice.email, password: 'incorrect-password' })).status, 401);
  assert.ok((await list(await session('sign-in', alice))).data.some(k => k.id === a2.record.id));
});
