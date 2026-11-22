import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

try {
  await writeFile(new URL('../.env.local', import.meta.url),
    `BETTER_AUTH_URL=http://localhost:3000\nBETTER_AUTH_SECRET=${randomBytes(32).toString('base64url')}\n`,
    { flag: 'wx', mode: 0o600 });
  console.log('Local auth configured for http://localhost:3000.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env.local already exists; leaving it untouched. Set BETTER_AUTH_URL and BETTER_AUTH_SECRET there if needed.');
}
