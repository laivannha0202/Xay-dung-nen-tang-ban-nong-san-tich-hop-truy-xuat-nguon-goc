import { stat, utimes } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = resolve(packageDir, 'openapi/agrimarket.json');
const generated = resolve(packageDir, 'generated/index.ts');

// Trên Windows, 'pnpm' là pnpm.cmd và bắt buộc gọi qua shell;
// spawnSync('pnpm', ...) với shell:false luôn ENOENT (status null → Exit 1
// mà không in gì — đúng triệu chứng "snapshot mới hơn ... Exit status 1").
const isWindows = platform() === 'win32';
const pnpmBin = isWindows ? 'pnpm.cmd' : 'pnpm';

let shouldGenerate;

try {
  const [snapshotStat, generatedStat] = await Promise.all([stat(snapshot), stat(generated)]);

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

const result = spawnSync(pnpmBin, ['run', 'generate'], {
  cwd: packageDir,
  stdio: 'inherit',
  shell: isWindows,
});

if (result.error) {
  console.error(`Không thể chạy '${pnpmBin} run generate': ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`'${pnpmBin} run generate' thất bại với mã ${result.status ?? 'unknown'}.`);
  process.exit(result.status ?? 1);
}

// Orval có thể bỏ qua ghi file khi nội dung không đổi (giữ mtime cũ),
// khiến lần ensure sau vẫn thấy snapshot "mới hơn" và generate lại vô ích.
// Chạm mtime sau khi generate thành công để ensure hội tụ (idempotent):
// vừa generate từ snapshot hiện tại xong thì generated mặc định đồng bộ.
try {
  const now = new Date();
  await utimes(generated, now, now);
} catch {
  // Không fatal: lần ensure sau sẽ generate lại, app vẫn chạy đúng.
}

console.log('✓ API client đã đồng bộ từ OpenAPI snapshot.');
