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
const resetTestDbPath = path.join(toolsDir, 'reset-test-db.mjs');

const releaseGateSource = readFileSync(releaseGatePath, 'utf8');
const jestRunnerSource = readFileSync(jestRunnerPath, 'utf8');
const resetTestDbSource = readFileSync(resetTestDbPath, 'utf8');

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

test('bước reset database test truyền dbResetEnv (DATABASE_URL trỏ đúng database test)', () => {
  // Sau PHIEN-FIX-E2E-DB-ISOLATION, bước reset đã chuyển sang
  // `node tools/reset-test-db.mjs` (nguồn sự thật duy nhất, dùng chung với
  // `pnpm --filter @agrimarket/api test`). Env truyền vào vẫn phải là
  // dbResetEnv vì prisma7.config.ts chỉ đọc DATABASE_URL.
  assert.match(
    releaseGateSource,
    /run\(\s*'node',\s*\[\s*'tools\/reset-test-db\.mjs'\s*\],\s*dbResetEnv,?\s*\);/,
    'release-gate.mjs phải gọi `node tools/reset-test-db.mjs` với dbResetEnv.',
  );

  assert.match(
    releaseGateSource,
    /const dbResetEnv = \{[\s\S]*?DATABASE_URL: testDatabaseUrl,/,
    'dbResetEnv phải đặt DATABASE_URL = testDatabaseUrl',
  );
});

test('reset-test-db.mjs trỏ DATABASE_URL về TEST_DATABASE_URL cho prisma CLI', () => {
  // prisma7.config.ts đọc `env('DATABASE_URL')`. Nếu script này không override
  // thì lệnh reset sẽ xóa nhầm database dev/demo — đây là chốt an toàn gốc.
  assert.match(
    resetTestDbSource,
    /DATABASE_URL: testDatabaseUrl,/,
    'reset-test-db.mjs phải đặt DATABASE_URL = testDatabaseUrl khi gọi prisma CLI.',
  );
  assert.match(
    resetTestDbSource,
    /testDatabaseUrl === process\.env\.DATABASE_URL/,
    'reset-test-db.mjs phải từ chối chạy khi TEST_DATABASE_URL trùng DATABASE_URL.',
  );
  assert.match(
    resetTestDbSource,
    /AGRIMARKET_SKIP_TEST_DB_RESET/,
    'reset-test-db.mjs phải có cờ bỏ qua để release gate không reset hai lần.',
  );
});

test('apps/api gọi reset DB trước khi chạy e2e (CI và máy dev cùng một DB sạch)', () => {
  const apiPackage = JSON.parse(
    readFileSync(path.join(toolsDir, '..', 'apps/api/package.json'), 'utf8'),
  );

  const runApiTestsSource = readFileSync(path.join(toolsDir, 'run-api-tests.mjs'), 'utf8');

  assert.match(
    apiPackage.scripts.test ?? '',
    /tools\/run-api-tests\.mjs/,
    'apps/api script "test" phải chạy qua tools/run-api-tests.mjs.',
  );

  // Script test phải reset DB test trước khi chạy e2e.
  assert.match(
    runApiTestsSource,
    /tools\/reset-test-db\.mjs/,
    'tools/run-api-tests.mjs phải reset database test trước khi chạy jest e2e.',
  );
  assert.match(
    runApiTestsSource,
    /run-jest-vm\.mjs',\s*\n?\s*'\.\/test\/jest-e2e\.json/,
    'tools/run-api-tests.mjs phải chạy jest-e2e.',
  );

  // Và phải nạp `.env` ở đúng tầng này: `run-jest-vm.mjs` cố tình KHÔNG nạp để
  // giữ chốt fail-fast của `test-database-isolation`.
  assert.match(runApiTestsSource, /napRootEnv\(\);/, 'run-api-tests.mjs phải nạp root .env.');
  assert.doesNotMatch(
    jestRunnerSource,
    /readFileSync\([^)]*\.env/,
    'run-jest-vm.mjs không được tự nạp .env — sẽ vô hiệu chốt fail-fast của test isolation.',
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
