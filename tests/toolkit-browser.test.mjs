import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { startTestServer } from './test-server.mjs';

async function openToolkit(t, options = {}) {
  const app = await startTestServer();
  t.after(app.close);
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
  t.after(() => browser.close());
  const page = await browser.newPage({ baseURL: app.origin, ...options });
  page.setDefaultTimeout(6000);
  return page;
}

test('try a tool, find its workbench and keep it in the local toolkit', async t => {
  const page = await openToolkit(t);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/', { waitUntil: 'networkidle' });
  const lab = page.getByRole('region', { name: 'Live playground' });
  const headline = await page.locator('h1').boundingBox();
  const panel = await lab.boundingBox();
  assert.ok(panel.x >= headline.x + headline.width, 'desktop layout shows the playable panel beside the introduction');
  await lab.getByLabel('Input', { exact: true }).fill('{');
  await lab.getByRole('button', { name: 'Run tool' }).click();
  await lab.getByRole('alert').waitFor();
  await lab.getByLabel('Input', { exact: true }).fill('{"sample":42}');
  await lab.getByRole('button', { name: 'Run tool' }).click();
  assert.equal(await lab.locator('pre').innerText(), '{\n  "sample": 42\n}');
  await lab.getByRole('button', { name: 'Base64', exact: true }).click();
  await lab.getByLabel('Input', { exact: true }).fill('café');
  await lab.getByLabel('Input', { exact: true }).press('Control+Enter');
  assert.equal(await lab.locator('pre').innerText(), Buffer.from('café').toString('base64'));

  await page.keyboard.press('Control+k');
  const finder = page.getByRole('dialog', { name: 'Find a tool' });
  await finder.getByRole('searchbox').fill('json formatter');
  await finder.getByRole('searchbox').press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/tools/json-formatter');
  await page.getByRole('button', { name: 'Save JSON formatter', exact: true }).click();
  await page.getByLabel('JSON input', { exact: true }).fill('{"value":7}');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const file = await downloading;
  assert.equal(file.suggestedFilename(), 'formatted.json');
  const chunks = [];
  for await (const chunk of await file.createReadStream()) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString(), '{\n  "value": 7\n}');

  await page.goto('/tools?view=saved', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'JSON formatter', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Base64 encoder', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Remove JSON formatter', exact: true }).click();
  await page.getByRole('heading', { name: 'Your shelf is empty' }).waitFor();
  await page.getByRole('button', { name: /^Live tools/ }).click();
  await page.getByRole('searchbox', { name: 'Search the library' }).fill('hash');
  await page.getByRole('link', { name: 'Hash generator', exact: true }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('searchbox', { name: 'Search the library' }).inputValue(), 'hash');
  assert.equal(await page.getByRole('link', { name: 'Base64 encoder', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('link', { name: 'Base64 encoder', exact: true }).waitFor();
  assert.equal(await page.getByRole('searchbox', { name: 'Search the library' }).inputValue(), '');
  await page.goBack();
  await page.waitForURL('**/tools?q=hash');
  await page.getByRole('link', { name: 'Base64 encoder', exact: true }).waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('searchbox', { name: 'Search the library' }).inputValue(), 'hash');
  assert.deepEqual(pageErrors, []);
});

test('scrolling follows the example from browser input through the engine to the API', async t => {
  const page = await openToolkit(t, { viewport: { width: 1280, height: 820 }, reducedMotion: 'no-preference' });
  await page.goto('/#request-path', { waitUntil: 'networkidle' });
  const story = page.getByRole('region', { name: 'Follow one request.' });
  const readout = story.getByRole('group', { name: 'Example readout' });
  await story.getByLabel('Example title').selectOption({ label: 'Café menu · Spring' });
  const moveTo = async chapter => story.getByRole('heading', { name: chapter, exact: true }).evaluate(heading => {
    heading.closest('li').scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await moveTo('Normalize the text.');
  await story.getByRole('button', { name: 'Transform', exact: true, pressed: true }).waitFor();
  assert.equal(await readout.locator('code').innerText(), 'cafe-menu-spring');
  await moveTo('Call it from a script.');
  await story.getByRole('button', { name: 'API request', exact: true, pressed: true }).waitFor();
  assert.match(await readout.locator('code').innerText(), /POST \/v1\/slug/);
  await story.getByRole('button', { name: 'Copy cURL' }).waitFor();
  await moveTo('Start with a title.');
  await story.getByRole('button', { name: 'Input', exact: true, pressed: true }).waitFor();
  assert.match(await readout.locator('code').innerText(), /Café menu · Spring/);
});

test('mobile reduced-motion journey: roadmap, live preview and plan enquiry', async t => {
  const page = await openToolkit(t, { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  const lab = page.getByRole('region', { name: 'Live playground' });
  assert.equal(await lab.locator('svg rect').evaluate(el => getComputedStyle(el).animationName), 'none');
  const story = page.getByRole('region', { name: 'Follow one request.' });
  const apiStep = story.getByRole('button', { name: 'API request', exact: true });
  await apiStep.focus();
  await page.keyboard.press('Enter');
  await story.getByRole('button', { name: 'API request', exact: true, pressed: true }).waitFor();
  assert.match(await story.getByRole('group', { name: 'Example readout' }).innerText(), /friday-release-notes/);
  await page.locator('#home-title').scrollIntoViewIfNeeded();
  assert.equal(await apiStep.getAttribute('aria-pressed'), 'true', 'scrolling does not advance reduced-motion playback');
  const find = page.getByRole('button', { name: 'Find a tool', exact: true });
  await find.click();
  await page.getByRole('dialog').getByRole('searchbox').fill('does not exist');
  await page.getByText(/No live tool matches/).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.ok(await find.evaluate(el => el === document.activeElement), 'closing search returns focus');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Tool library' }).click();
  const search = page.getByRole('searchbox', { name: 'Search the library' });
  await search.pressSequentially('merge pdf');
  assert.equal(await search.inputValue(), 'merge pdf', 'rapid typing retains the complete query');
  await page.getByRole('button', { name: 'See roadmap matches' }).click();
  await page.getByRole('link', { name: 'Merge PDF', exact: true }).click();
  await page.getByRole('heading', { name: 'This tool is planned.' }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'Browser workbench' }).count(), 0);

  await page.goto('/tools/meta-tag-generator', { waitUntil: 'networkidle' });
  const wb = page.getByRole('region', { name: 'Browser workbench' });
  await wb.getByLabel('Canonical URL').fill('incomplete');
  await wb.getByRole('alert').waitFor();
  await wb.getByLabel('Canonical URL').fill('https://example.com/article');
  await wb.getByLabel('Page title').fill('Ideas & sketches');
  await wb.getByLabel('Image URL (optional)').fill('https://example.com/cover.jpg');
  assert.match(await wb.locator('pre').innerText(), /summary_large_image/);
  assert.match(await wb.locator('pre').innerText(), /Ideas &amp; sketches/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  await page.goto('/pricing', { waitUntil: 'networkidle' });
  await page.getByLabel('Monthly API requests').fill('50001');
  await page.getByRole('link', { name: 'Ask about Scale' }).click();
  await page.getByText('Scale plan', { exact: true }).waitFor();
  await page.getByLabel('Your name').fill('Test Fixture');
  await page.getByLabel('Work email').fill('fixture@example.test');
  await page.getByLabel('What are you building?').fill('Comparing limits for a test integration.');
  await page.getByRole('button', { name: 'Send request' }).click();
  await page.getByText('Request received', { exact: true }).waitFor();
});
