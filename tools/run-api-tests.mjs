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
 *   `tools/reset-test-db.mjs` dọn MySQL; Redis thì dọn ở chính script này bằng
 *   `tools/redis-test-namespace.mjs` — cùng một đường chạy cho cả DB lẫn cache.
 *
 * Chốt an toàn vẫn giữ nguyên:
 *   - production -> từ chối.
 *   - TEST_DATABASE_URL thiếu / trùng DATABASE_URL -> fail trước khi reset.
 *   - reset chỉ chạy trên MySQL local với tên database chứa "test".
 *   - Redis chỉ xoá trong namespace `...:test:...`, KHÔNG FLUSHALL/FLUSHDB.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { donRedisChoTest, envTestCoLapRedis, moKetNoiRedis } from './redis-test-namespace.mjs';

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

/**
 * ÉP namespace Redis của test khác dev TRƯỚC khi bất kỳ bước nào spawn tiến
 * trình. Không làm thì `pnpm --filter @agrimarket/api test` ghi đè lên
 * `agrimarket:cache:` / `agrimarket:bull` — đúng namespace máy dev đang dùng.
 *
 * `EMAIL_TRANSPORT_MODE=memory` và `FILE_STORAGE_MODE=memory` là contract đã có
 * của release gate: full-suite logic sản phẩm phải chạy được trên máy KHÔNG cài
 * Mailpit và KHÔNG cài MinIO, và phải cho kết quả giống hệt CI. Worker
 * `EmailWorker` vẫn chạy đủ đường BullMQ + retry, chỉ không mở socket SMTP;
 * `TepTinService` vẫn chạy đủ đường validate + DB + phân quyền, chỉ không mở
 * socket S3. Các spec tự nhận biết chế độ qua `FILE_STORAGE_MODE` và khẳng định
 * đúng theo chế độ đang chạy (`apps/api/test/tep-tin.e2e-spec.ts`).
 *
 * Không ép thì `.env` không có 2 biến này -> suite âm thầm cần Mailpit + MinIO
 * và đỏ với `ECONNREFUSED` trên máy không cài chúng, trong khi CI vẫn xanh.
 * Phần tích hợp thật nằm ở gate riêng `pnpm --filter @agrimarket/api
 * test:mailpit` (xem `tools/run-api-mailpit-tests.mjs`).
 */
const envChay = {
  ...envTestCoLapRedis(process.env),
  EMAIL_TRANSPORT_MODE: process.env.EMAIL_TRANSPORT_MODE || 'memory',
  FILE_STORAGE_MODE: process.env.FILE_STORAGE_MODE || 'memory',
};
Object.assign(process.env, envChay);

async function donRedis(soDong) {
  const redisUrl = envChay.REDIS_URL;

  if (!redisUrl) {
    console.log(`⏭  ${soDong}: thiếu REDIS_URL, bỏ qua dọn Redis namespace test.`);
    return;
  }

  let client;

  try {
    client = await moKetNoiRedis(redisUrl);
  } catch (error) {
    // Redis hạ tầng không chạy thì không có gì để dọn. KHÔNG fail ở đây: phần
    // lớn test không cần Redis, và chặn cả suite vì Redis tắt sẽ giấu lỗi
    // test thật. Lỗi Redis thật sẽ nổ lên ở phần test tự khởi tạo AppModule.
    const lyDo = error instanceof Error ? error.message : String(error);
    console.log(`⏭  ${soDong}: không kết nối được Redis (${lyDo}). Bỏ qua dọn namespace test.`);
    return;
  }

  try {
    const { daXoa, boQua } = await donRedisChoTest(client, envChay, {
      quyMo: (dong) => console.log(dong),
    });

    for (const bo of boQua) console.log(`⏭  Bỏ qua "${bo.namespace}": ${bo.lyDo}`);
    console.log(`✓ ${soDong}: đã xoá ${daXoa} key trong namespace test (Redis dev giữ nguyên).`);
  } finally {
    await client.quit();
  }
}

// Thứ tự cố ý: reset DB -> don Redis -> chạy test. Reset DB trước để nếu nó
// fail-fast (thiếu TEST_DATABASE_URL, trùng DATABASE_URL, sai shadow) thì dừng
// luôn, chưa đụng gì vào Redis; don Redis sau để cache/queue của lần chạy trước
// không sót lại gây suite đọc dữ liệu cũ.
const buoc = [
  { ten: 'reset DB test', args: [resolve(rootDir, 'tools/reset-test-db.mjs')] },
  { ten: 'don Redis namespace test', donRedis: true },
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

  if (step.donRedis) {
    await donRedis('Trước test');
    continue;
  }

  const ketQua = spawnSync(process.execPath, step.args, {
    cwd: apiDir,
    stdio: 'inherit',
    env: envChay,
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

await donRedis('Sau E2E');

console.log('\n✅ API: unit + e2e PASS');
