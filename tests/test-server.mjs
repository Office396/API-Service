import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// Always bind to loopback and use a disposable database, including in the dev regression.
export async function startTestServer({ dev = false } = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const socket = net.createServer().listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const { port } = socket.address();
  await new Promise(resolve => socket.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const dir = await mkdtemp(path.join(tmpdir(), 'toolzync-accounts-'));
  const env = { ...process.env, NODE_ENV: dev ? 'development' : 'production', BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: randomBytes(32).toString('hex'), TOOLZYNC_DATA_DIR: dir, NEXT_TELEMETRY_DISABLED: '1',
    TOOLZYNC_ALLOWED_ORIGINS: 'https://preview.toolzync.test' };
  let child, closed, log = '';
  async function start() {
    child = spawn(process.execPath, ['node_modules/next/dist/bin/next', dev ? 'dev' : 'start', '-H', '127.0.0.1', '-p', String(port)],
      { cwd: root, env, stdio: dev ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'ignore', 'inherit'], windowsHide: true });
    if (dev) {
      const capture = chunk => { log = (log + chunk).slice(-64000); };
      child.stdout.on('data', capture);
      child.stderr.on('data', capture);
    }
    closed = once(child, 'exit');
    for (let i = 0; i < 100 && child.exitCode === null; i++) {
      try { const res = await fetch(origin); await res.text(); if (res.ok) return; } catch { /* starting */ }
      await delay(100);
    }
    throw new Error(dev ? `Test dev server did not start. ${log}` : 'Test server did not start. Run npm run build first.');
  }
  async function stop() {
    if (child?.exitCode !== null || child.signalCode !== null) return;
    // On Windows the next dev CLI forks a separate server process.
    if (dev && process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill();
    await closed;
  }
  async function close() { await stop(); await rm(dir, { recursive: true, force: true, maxRetries: 3 }); }
  try { await start(); } catch (error) { await close(); throw error; }
  return { origin, dir, close, diagnostics: () => log, async restart() { await stop(); await start(); } };
}
