import { stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = resolve(packageDir, 'openapi/agrimarket.json');
const generated = resolve(packageDir, 'generated/index.ts');

let shouldGenerate;

try {
  const [snapshotStat, generatedStat] = await Promise.all([
    stat(snapshot),
    stat(generated),
  ]);

  shouldGenerate = snapshotStat.mtimeMs > generatedStat.mtimeMs;

  if (shouldGenerate) {
    console.log('OpenAPI snapshot mới hơn generated client; đang sinh lại...');
  }
} catch {
  shouldGenerate = true;
  console.log('Generated API client chưa tồn tại; đang sinh từ OpenAPI snapshot...');
}

if (!shouldGenerate) {
  process.exit(0);
}

const result = spawnSync('pnpm', ['run', 'generate'], {
  cwd: packageDir,
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
