import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { startTestServer } from './test-server.mjs';

test('catalogue tools run behind an account key and only successful results use quota', async t => {
  const app = await startTestServer();
  t.after(app.close);
  const headers = { origin: app.origin, 'content-type': 'application/json' };
  const signup = await fetch(app.origin + '/api/auth/sign-up/email', { method: 'POST', headers, body: JSON.stringify({ name: 'Tool fixture', email: 'catalog@example.test', password: randomBytes(24).toString('hex') }) });
  assert.equal(signup.status, 200);
  const cookie = signup.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const makeKey = async () => {
    const res = await fetch(app.origin + '/api/keys', { method: 'POST', headers: { ...headers, cookie }, body: '{"name":"Suite"}' });
    assert.equal(res.status, 201); return (await res.json()).data;
  };
  const { key } = await makeKey();
  const run = (slug, body, credential = key) => fetch(`${app.origin}/v1/${slug}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${credential}` }, body: JSON.stringify(body) });
  await t.test('regex-tester: captures, replacement, invalid syntax, invalid key', async () => {
    const body = { input: 'cat-12 dog-34', pattern: '([a-z]+)-(\\d+)', flags: 'g', replacement: '$2:$1' };
    assert.equal((await run('regex-tester', body, 'not-a-key')).status, 401);
    const res = await run('regex-tester', body);
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.matches.length, 2); assert.deepEqual(data.matches[0].groups, ['cat', '12']);
    assert.equal(data.result, '12:cat 34:dog');
    assert.equal(res.headers.get('x-quota-remaining'), '999');
    const bad = await run('regex-tester', { ...body, pattern: '(' });
    assert.ok([400, 422].includes(bad.status)); assert.equal(bad.headers.get('x-quota-remaining'), '999');
  });
});
