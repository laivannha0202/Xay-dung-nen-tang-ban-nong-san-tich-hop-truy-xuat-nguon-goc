/**
 * GATE TÍCH HỢP MAILPIT — chạy riêng, KHÔNG nằm trong `pnpm test`.
 *
 * Vì sao tách khỏi `tools/run-api-tests.mjs`
 * -----------------------------------------
 * `run-api-tests.mjs` ép `EMAIL_TRANSPORT_MODE=memory`: full-suite logic sản
 * phẩm phải chạy được trên máy không có Mailpit, và phải cho kết quả giống
 * hệt release gate. Nhưng "không có Mailpit" KHÔNG đồng nghĩa với "đường gửi mail
 * qua SMTP đã được kiểm". Nếu bỏ hẳn phần SMTP thật thì mất coverage; nếu nhồi
 * vào full-suite thì máy dev đỏ mơ hồ (`ECONNREFUSED 127.0.0.1:1025`).
 *
 * Vậy nên: hai gate, hai mục đích, cùng dùng chung mọi chốt an toàn DB/Redis.
 *   `pnpm --filter @agrimarket/api test`         -> logic sản phẩm, memory transport
 *   `pnpm --filter @agrimarket/api test:mailpit` -> SMTP + Mailpit thật
 *
 * Yêu cầu Mailpit: SMTP 1025, HTTP 8025 (đổi được qua `SMTP_HOST`/`SMTP_PORT`
 * và `MAILPIT_HTTP_PORT`). Thiếu Mailpit -> FAIL, không skip. Xem
 * `apps/api/test/email-mailpit.integration-spec.ts`.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { donRedisChoTest, envTestCoLapRedis, moKetNoiRedis } from './redis-test-namespace.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = resolve(rootDir, 'apps/api');

/** Nạp root `.env` giống hệt `run-api-tests.mjs` để hai gate hội tụ env. */
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
 * Xoá `EMAIL_TRANSPORT_MODE` khỏi env gate: đây là gate SMTP THẬT.
 *
 * `.env` hoặc shell của người dùng có thể còn sót `memory` từ lần chạy
 * full-suite trước; nếu không xoá, test sẽ xanh mà chẳng qua SMTP nào — đúng
 * kiểu xanh giả mà gate này sinh ra để chặn.
 */
const envChay = envTestCoLapRedis(process.env);
envChay.NODE_ENV = 'test';

delete envChay.EMAIL_TRANSPORT_MODE;
delete process.env.EMAIL_TRANSPORT_MODE;

async function donRedis(soDong) {
  if (!envChay.REDIS_URL) {
    console.log(`⏭  ${soDong}: thiếu REDIS_URL, bỏ qua dọn Redis namespace test.`);
    return;
  }

  let client;

  try {
    client = await moKetNoiRedis(envChay.REDIS_URL);
  } catch (error) {
    const lyDo = error instanceof Error ? error.message : String(error);
    console.log(`⏭  ${soDong}: không kết nối được Redis (${lyDo}).`);
    return;
  }

  try {
    const { daXoa } = await donRedisChoTest(client, envChay, {
      quyMo: (dong) => console.log(dong),
    });
    console.log(`✓ ${soDong}: đã xoá ${daXoa} key trong namespace test.`);
  } finally {
    await client.quit();
  }
}

console.log('📮 AgriMarket — MAILPIT INTEGRATION GATE');
console.log('=========================================');
console.log(`   SMTP : ${envChay.SMTP_HOST ?? '127.0.0.1'}:${envChay.SMTP_PORT ?? '1025'}`);
console.log(
  `   HTTP : ${envChay.MAILPIT_HTTP_HOST ?? '127.0.0.1'}:${envChay.MAILPIT_HTTP_PORT ?? '8025'}`,
);

await donRedis('Trước Mailpit gate');

const ketQua = spawnSync(
  process.execPath,
  [
    resolve(rootDir, 'tools/run-jest-vm.mjs'),
    './test/jest-e2e-mailpit.json',
    ...process.argv.slice(2),
  ],
  {
    cwd: apiDir,
    stdio: 'inherit',
    env: envChay,
    shell: false,
  },
);

if (ketQua.error) {
  console.error('[run-api-mailpit-tests] Không chạy được jest:', ketQua.error.message);
  process.exit(1);
}

if (ketQua.status !== 0) {
  console.error(
    '\n❌ Mailpit integration gate FAIL.\n' +
      '   Nếu lỗi là ECONNREFUSED tới SMTP 1025 / HTTP 8025 thì đó là thiếu ' +
      'dịch vụ Mailpit, KHÔNG phải bug sản phẩm. Phần logic không cần SMTP vẫn ' +
      'chạy bằng `pnpm --filter @agrimarket/api test`.',
  );
  process.exit(ketQua.status ?? 1);
}

await donRedis('Sau Mailpit gate');

console.log('\n✅ MAILPIT INTEGRATION GATE PASS');
