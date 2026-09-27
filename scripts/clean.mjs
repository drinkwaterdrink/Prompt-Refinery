import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

for (const name of ['dist', 'server.js']) {
  await rm(resolve(process.cwd(), name), { recursive: true, force: true });
}
