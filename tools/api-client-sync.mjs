import { spawn, spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const repoRoot = resolve(import.meta.dirname, '..');
const port = Number(process.env.API_CLIENT_SYNC_PORT ?? '3101');
const apiBase = `http://127.0.0.1:${port}`;
const healthUrl = `${apiBase}/api/v1/suc-khoe`;
const openapiUrl = `${apiBase}/openapi-json`;
const logDir = '/tmp/agrimarket-api-client-sync';
const logPath = `${logDir}/api.log`;

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} thất bại với mã ${result.status ?? 'unknown'}.`);
  }
}

function requireExpectedDatabase(name, value, expectedDatabase) {
  if (!value) {
    throw new Error(`Thiếu ${name} trong chế độ sync bằng database test.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} không phải database URL hợp lệ.`);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (database !== expectedDatabase) {
    throw new Error(
      `${name} phải trỏ chính xác tới database '${expectedDatabase}', hiện là '${database || '(rỗng)'}'.`,
    );
  }
}

async function waitForApi(child, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API sync process đã thoát sớm với mã ${child.exitCode}.`);
    }

    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1_500) });
      if (response.ok) return;
    } catch {
      // API vẫn đang khởi động.
    }

    await delay(750);
  }

  throw new Error(`API chưa healthy sau ${timeoutMs / 1000}s tại ${healthUrl}.`);
}

async function stopProcessGroup(child) {
  if (child.exitCode !== null) return;

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      return;
    }
  }

  const deadline = Date.now() + 5_000;
  while (child.exitCode === null && Date.now() < deadline) {
    await delay(100);
  }

  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }
}

function printLogTail() {
  try {
    const lines = readFileSync(logPath, 'utf8').split(/\r?\n/);
    console.error('\n--- API sync log (tail) ---');
    console.error(lines.slice(-60).join('\n'));
    console.error('--- end log ---');
  } catch {
    // Không có log để in.
  }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testShadowDatabaseUrl = process.env.TEST_SHADOW_DATABASE_URL;
const useTestDatabase = Boolean(testDatabaseUrl || testShadowDatabaseUrl);

if (useTestDatabase) {
  requireExpectedDatabase('TEST_DATABASE_URL', testDatabaseUrl, 'agrimarket_test');
  requireExpectedDatabase(
    'TEST_SHADOW_DATABASE_URL',
    testShadowDatabaseUrl,
    'agrimarket_test_shadow',
  );
}

const apiEnv = useTestDatabase
  ? {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      SHADOW_DATABASE_URL: testShadowDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      TEST_SHADOW_DATABASE_URL: testShadowDatabaseUrl,
      BULLMQ_PREFIX: process.env.BULLMQ_PREFIX || `agrimarket:test:api-sync:${process.pid}`,
      PORT: String(port),
    }
  : {
      ...process.env,
      PORT: String(port),
    };

await mkdir(logDir, { recursive: true });

console.log('AgriMarket — OpenAPI / Orval sync');
console.log('================================');
console.log(`API tạm thời: ${apiBase}`);
console.log(`Log: ${logPath}`);
if (useTestDatabase) {
  console.log('✓ API sync đang dùng agrimarket_test + agrimarket_test_shadow.');
  console.log(`✓ BullMQ prefix: ${apiEnv.BULLMQ_PREFIX}`);
}

// Docker up là idempotent và giúp Prisma/Redis/worker dependencies sẵn sàng.
run('pnpm', ['docker:up']);

// child_process.spawn yêu cầu stream stdio đã có fd. Mở file đồng bộ để tránh
// createWriteStream vẫn còn fd=null tại thời điểm spawn trên Node.js 24.
const logFd = openSync(logPath, 'w');
let api;

try {
  api = spawn('pnpm', ['--filter', '@agrimarket/api', 'start'], {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: apiEnv,
  });

  await waitForApi(api);
  console.log(`✓ API healthy tại ${healthUrl}`);

  run('pnpm', ['--filter', '@agrimarket/api-client', 'snapshot'], {
    env: {
      ...apiEnv,
      API_OPENAPI_URL: openapiUrl,
    },
  });
  run('pnpm', ['--filter', '@agrimarket/api-client', 'generate']);
  run('pnpm', ['--filter', '@agrimarket/api-client', 'typecheck']);

  console.log('\n✅ API CLIENT SYNC PASS');
  console.log('✓ OpenAPI snapshot đã lấy từ source Backend hiện tại.');
  console.log('✓ Orval client đã generate lại.');
  console.log('✓ API client typecheck PASS.');
} catch (error) {
  printLogTail();
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (api) {
    await stopProcessGroup(api);
  }
  closeSync(logFd);
}
