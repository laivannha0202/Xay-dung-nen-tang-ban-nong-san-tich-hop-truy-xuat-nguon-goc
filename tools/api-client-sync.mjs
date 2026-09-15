import { spawn, spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import { join, resolve } from 'node:path';
import { platform, tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';

const isWindows = platform() === 'win32';
const pnpmBin = isWindows ? 'pnpm.cmd' : 'pnpm';

const repoRoot = resolve(import.meta.dirname, '..');

const rootEnv = resolve(repoRoot, '.env');
try {
  if (typeof process.loadEnvFile === 'function') process.loadEnvFile(rootEnv);
} catch {
  // CI co the inject env truc tiep va khong can .env.
}

const port = Number(process.env.API_CLIENT_SYNC_PORT ?? '3101');
const apiBase = `http://127.0.0.1:${port}`;
const healthUrl = `${apiBase}/api/v1/suc-khoe`;
const openapiUrl = `${apiBase}/openapi-json`;
const logDir = join(tmpdir(), 'agrimarket-api-client-sync');
const logPath = join(logDir, 'api.log');

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
    env: process.env,
    ...options,
  });

  if (result.error) {
    throw new Error(`${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} that bai voi ma ${result.status ?? 'unknown'}.`);
  }
}

function requireExpectedDatabase(name, value, expectedDatabase) {
  if (!value) {
    throw new Error(`Thieu ${name} trong che do sync bang database test.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} khong phai database URL hop le.`);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (database !== expectedDatabase) {
    throw new Error(
      `${name} phai tro chinh xac toi database '${expectedDatabase}', hien la '${database || '(rong)'}'.`,
    );
  }
}

function tcpOpen(host, portNumber, timeoutMs = 1500) {
  return new Promise((resolvePromise) => {
    const socket = net.connect({ host, port: portNumber, timeout: timeoutMs });
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolvePromise(value);
    };
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function requireServiceUrl(name, value, defaultPort) {
  if (!value) {
    throw new Error(`Thieu URL cho ${name}.`);
  }

  const parsed = new URL(value);
  const host = parsed.hostname;
  const servicePort = Number(parsed.port || defaultPort);

  if (!(await tcpOpen(host, servicePort))) {
    throw new Error(
      `${name} chua san sang tai ${host}:${servicePort}. ` +
        'Luồng nay khong tu khoi dong Docker; hay khoi dong native service truoc.',
    );
  }

  console.log(`✓ ${name}: ${host}:${servicePort}`);
}

async function waitForApi(child, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API sync process da thoat som voi ma ${child.exitCode}.`);
    }

    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1_500) });
      if (response.ok) return;
    } catch {
      // API van dang khoi dong.
    }

    await delay(750);
  }

  throw new Error(`API chua healthy sau ${timeoutMs / 1000}s tai ${healthUrl}.`);
}

async function stopProcessGroup(child) {
  if (!child || child.exitCode !== null) return;

  try {
    if (isWindows && child.pid) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: false,
      });
      return;
    }

    if (child.pid) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
    }
  } catch {
    // Process co the da thoat.
  }
}

function printLogTail() {
  try {
    const lines = readFileSync(logPath, 'utf8').split(/\r?\n/);
    console.error('\n--- API sync log (tail) ---');
    console.error(lines.slice(-60).join('\n'));
    console.error('--- end log ---');
  } catch {
    // Khong co log.
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

console.log('AgriMarket - OpenAPI / Orval sync');
console.log('=================================');
console.log(`API tam thoi: ${apiBase}`);
console.log(`Log: ${logPath}`);

const databaseUrl = apiEnv.DATABASE_URL;
const redisUrl =
  apiEnv.REDIS_URL ||
  `redis://${apiEnv.REDIS_HOST || '127.0.0.1'}:${apiEnv.REDIS_PORT || '6379'}`;

await requireServiceUrl('MySQL', databaseUrl, 3306);
await requireServiceUrl('Redis', redisUrl, 6379);

const logFd = openSync(logPath, 'w');
let api;

try {
  api = spawn(pnpmBin, ['--filter', '@agrimarket/api', 'start'], {
    cwd: repoRoot,
    detached: !isWindows,
    shell: isWindows,
    stdio: ['ignore', logFd, logFd],
    env: apiEnv,
  });

  await waitForApi(api);
  console.log(`✓ API healthy tai ${healthUrl}`);

  run(pnpmBin, ['--filter', '@agrimarket/api-client', 'snapshot'], {
    env: {
      ...apiEnv,
      API_OPENAPI_URL: openapiUrl,
    },
  });
  run(pnpmBin, ['--filter', '@agrimarket/api-client', 'generate']);
  run(pnpmBin, ['--filter', '@agrimarket/api-client', 'typecheck']);

  console.log('\n✅ API CLIENT SYNC PASS');
} catch (error) {
  printLogTail();
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (api) await stopProcessGroup(api);
  closeSync(logFd);
}
