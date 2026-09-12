import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const nextTypes = join(__dirname, '..', 'apps', 'customer-web', '.next', 'dev', 'types');

try {
  rmSync(nextTypes, { recursive: true, force: true });
  console.log(`[clean-next-types] Removed stale generated types: ${nextTypes}`);
} catch (error) {
  console.warn(`[clean-next-types] Could not remove types dir: ${error.message}`);
}