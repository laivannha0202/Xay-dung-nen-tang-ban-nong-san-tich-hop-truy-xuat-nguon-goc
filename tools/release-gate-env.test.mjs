/**
 * Regression test: `pnpm release:gate` phải chạy được.
 *
 * Root cause (AGRIMARKET-RELEASE-GATE-ENV):
 *   tools/run-jest-vm.mjs fail-fast khi DATABASE_URL === TEST_DATABASE_URL, nhưng
 *   tools/release-gate.mjs lại gán CẢ HAI biến bằng testDatabaseUrl. Kết quả mọi lần
 *   chạy `pnpm release:gate` / `pnpm release:final` (và CI release workflow) đều exit 2
 *   trước khi chạy được test API.
 *
 * Contract cần giữ:
 *   1. env chạy API test: DATABASE_URL khác TEST_DATABASE_URL, và cả hai phải là DB test.
 *   2. env `prisma migrate reset`: DATABASE_URL phải TRỎ ĐÚNG database test, vì
 *      prisma7.config.ts chỉ đọc DATABASE_URL.
 *   3. BASE_URL dùng cho API test không được là dev/demo DB (đây là điều kiện gốc).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const releaseGatePath = path.join(toolsDir, 'release-gate.mjs');
const jestRunnerPath = path.join(toolsDir, 'run-jest-vm.mjs');

const releaseGateSource = readFileSync(releaseGatePath, 'utf8');
const jestRunnerSource = readFileSync(jestRunnerPath, 'utf8');

/** Trích env literal mà release-gate truyền cho từng bước. */
function envVarTrong(source, tenBien) {
  const match = source.match(new RegExp(`${tenBien}:\\s*([A-Za-z_][A-Za-z0-9_]*)`));
  return match?.[1] ?? null;
}

test('run-jest-vm.mjs vẫn giữ chốt an toàn DATABASE_URL !== TEST_DATABASE_URL', () => {
  assert.match(
    jestRunnerSource,
    /if \(testDatabaseUrl === databaseUrl\)/,
    'run-jest-vm.mjs phải còn điều kiện fail-fast DATABASE_URL === TEST_DATABASE_URL',
  );
  assert.match(
    jestRunnerSource,
    /TEST_DATABASE_URL không được trùng DATABASE_URL/,
    'run-jest-vm.mjs phải còn thông báo lỗi tương ứng',
  );
});

test('release-gate.mjs truyền DATABASE_URL khác TEST_DATABASE_URL cho bước test API', () => {
  const databaseUrl = envVarTrong(releaseGateSource, 'DATABASE_URL');
  const testDatabaseUrl = envVarTrong(releaseGateSource, 'TEST_DATABASE_URL');

  assert.notEqual(databaseUrl, null, 'release-gate.mjs phải khai báo DATABASE_URL cho env test');
  assert.notEqual(testDatabaseUrl, null, 'release-gate.mjs phải khai báo TEST_DATABASE_URL');

  assert.notEqual(
    databaseUrl,
    testDatabaseUrl,
    'DATABASE_URL và TEST_DATABASE_URL phải trỏ hai biến khác nhau, nếu không ' +
      'run-jest-vm.mjs sẽ exit(2) và release gate không bao giờ chạy tới bước test API.',
  );
});

test('release-gate.mjs dùng env riêng để migrate reset trỏ đúng database test', () => {
  const resetEnvName = releaseGateSource.match(
    /'prisma',\s*\n\s*'migrate',\s*\n\s*'reset',[\s\S]*?\n\s*([A-Za-z_][A-Za-z0-9_]*),\s*\n\s*\);/,
  )?.[1];

  assert.notEqual(
    resetEnvName,
    null,
    'phải tìm thấy env truyền cho bước `prisma migrate reset` trong release-gate.mjs',
  );
  assert.equal(
    resetEnvName,
    'dbResetEnv',
    'bước `prisma migrate reset` phải dùng dbResetEnv vì prisma7.config.ts chỉ đọc DATABASE_URL ' +
      `và cần trỏ đúng database test (hiện đang dùng ${resetEnvName}).`,
  );

  assert.match(
    releaseGateSource,
    /const dbResetEnv = \{[\s\S]*?DATABASE_URL: testDatabaseUrl,/,
    'dbResetEnv phải đặt DATABASE_URL = testDatabaseUrl',
  );
});

test('release-gate.mjs không gán base env (demo) cho các bước test', () => {
  // apiTestEnv phải kế thừa baseEnv (đã lọc biến agent) chứ không gán trực tiếp
  // process.env, để không vô tình đưa DATABASE_URL demo vào môi trường test.
  assert.match(
    releaseGateSource,
    /const apiTestEnv = \{\s*\n\s*\.\.\.baseEnv,/,
    'apiTestEnv phải spread baseEnv đã lọc',
  );
  assert.match(
    releaseGateSource,
    /const dbResetEnv = \{\s*\n\s*\.\.\.apiTestEnv,/,
    'dbResetEnv phải kế thừa apiTestEnv',
  );
});
