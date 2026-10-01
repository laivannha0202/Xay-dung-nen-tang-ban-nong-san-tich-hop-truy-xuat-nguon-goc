/**
 * CHẠY TOÀN BỘ TEST API TỪ MỘT SHELL TRẦNG.
 *
 * Vì sao cần
 * ----------
 * `pnpm --filter @agrimarket/api test` trước đây fail ở bước jest với
 * "Thiếu TEST_DATABASE_URL" khi chạy từ shell chưa export biến môi trường,
 * trong khi `pnpm release:gate` (truyền env sẵn) chạy được. Đó lại là dạng
 * "CI xanh / máy dev đỏ" mà release gate sinh ra.
 *
 * Cách sửa đúng chỗ, không nới lỏng chốt an toàn:
 *   - `tools/reset-test-db.mjs` và `tools/run-jest-vm.mjs` CỐ TÌNH chỉ tin
 *     `process.env` (không tự nạp `.env`), vì test `test-database-isolation`
 *     truyền `TEST_DATABASE_URL: undefined` và đòi runner phải fail-fast.
 *   - Script này là tầng duy nhất nạp `.env`, rồi truyền env đã nạp xuống hai
 *     runner kia. Như vậy "shell trần" và "release gate" hội tụ về cùng một
 *     đường chạy.
 *
 * Chốt an toàn vẫn giữ nguyên:
 *   - production -> từ chối.
 *   - TEST_DATABASE_URL thiếu / trùng DATABASE_URL -> fail trước khi reset.
 *   - reset chỉ chạy trên MySQL local với tên database chứa "test".
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = resolve(rootDir, 'apps/api');

/** Nạp root `.env` (chỉ fill biến còn thiếu, KHÔNG override biến đã có). */
function napRootEnv() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const dong = line.trim();
    if (!dong || dong.startsWith('#')) continue;

    const i = dong.indexOf('=');
    if (i < 0) continue;

    const tenBien = dong.slice(0, i).trim();
    if (process.env[tenBien] !== undefined) continue;

    let giaTri = dong.slice(i + 1).trim();
    if (
      (giaTri.startsWith('"') && giaTri.endsWith('"')) ||
      (giaTri.startsWith("'") && giaTri.endsWith("'"))
    ) {
      giaTri = giaTri.slice(1, -1);
    }
    process.env[tenBien] = giaTri;
  }
}

napRootEnv();

const buoc = [
  { ten: 'reset DB test', args: [resolve(rootDir, 'tools/reset-test-db.mjs')] },
  {
    ten: 'unit test',
    args: [
      resolve(rootDir, 'tools/run-jest-vm.mjs'),
      './test/jest-unit.json',
      ...process.argv.slice(2),
    ],
  },
  {
    ten: 'e2e test',
    args: [
      resolve(rootDir, 'tools/run-jest-vm.mjs'),
      './test/jest-e2e.json',
      ...process.argv.slice(2),
    ],
  },
];

for (const step of buoc) {
  console.log(`\n▶ ${step.ten}`);
  const ketQua = spawnSync(process.execPath, step.args, {
    cwd: apiDir,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (ketQua.error) {
    console.error(`[run-api-tests] Không chạy được "${step.ten}":`, ketQua.error.message);
    process.exit(1);
  }

  if (ketQua.status !== 0) {
    console.error(`\n❌ ${step.ten} FAIL (exit ${ketQua.status}).`);
    process.exit(ketQua.status ?? 1);
  }
}

console.log('\n✅ API: unit + e2e PASS');
