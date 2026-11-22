import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { startTestServer } from './test-server.mjs';

// Run separately from production tests: Next's blocking-route diagnostics are dev-only.
test('signed-in client navigation to a tool does not block prerendering', async t => {
  const app = await startTestServer({ dev: true });
  t.after(app.close);
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  t.after(() => browser.close());
  const page = await browser.newPage({ baseURL: app.origin });
  const diagnostic = /blocking-prerender-current-time|unstable value `new Date\(\)`|missing-data-scroll-behavior|Detected `scroll-behavior: smooth`/i;
  const errors = [];
  page.on('console', m => { if (diagnostic.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const signup = await page.request.post('/api/auth/sign-up/email', { headers: { origin: app.origin },
    data: { name: 'Fixture', email: 'navigation@example.test', password: randomBytes(24).toString('hex') } });
  assert.equal(signup.status(), 200);
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  await page.getByText('navigation@example.test', { exact: true }).waitFor();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Tool library' }).click();
  await page.getByRole('link', { name: 'Base64 encoder', exact: true }).click();
  await page.getByRole('region', { name: 'Browser workbench' }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('header').getByRole('link', { name: 'Dashboard', exact: true }).waitFor();
  assert.doesNotMatch(app.diagnostics(), diagnostic);
  assert.deepEqual(errors, []);
  const health = await page.request.get('/health');
  assert.equal(health.status(), 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
});
