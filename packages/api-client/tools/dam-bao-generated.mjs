import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generated = resolve(packageDir, 'generated/index.ts');

try {
  await access(generated);
  process.exit(0);
} catch {
  console.log('Generated API client chưa tồn tại; đang sinh từ OpenAPI snapshot...');
}

const result = spawnSync('pnpm', ['run', 'generate'], {
  cwd: packageDir,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
