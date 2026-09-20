import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolsDir, '..');
const target = process.argv[2];

if (!target) {
  console.error('Thiếu thư mục test.');
  process.exit(2);
}

const testDir = resolve(root, target);
const files = readdirSync(testDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(?:test|spec)\.(?:mjs|cjs|js)$/.test(entry.name))
  .map((entry) => join(testDir, entry.name))
  .sort();

if (files.length === 0) {
  console.error(`Không tìm thấy test trong ${target}`);
  process.exit(2);
}

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...files], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
