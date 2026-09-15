import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const isWindows = platform() === 'win32';
const pnpmBin = isWindows ? 'pnpm.cmd' : 'pnpm';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, '..');
const mode = (process.argv[2] ?? 'all').toLowerCase();

const validModes = new Set(['api', 'customer', 'admin', 'mobile', 'web', 'all']);
if (!validModes.has(mode)) {
  console.error(`Mode khong hop le: ${mode}`);
  console.error('Dung: api | customer | admin | mobile | web | all');
  process.exit(2);
}

const rootEnv = path.join(repoRoot, '.env');
if (fs.existsSync(rootEnv) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(rootEnv);
  } catch (error) {
    console.error(`❌ Khong doc duoc .env: ${error.message}`);
    process.exit(1);
  }
}

const MYSQL_HOST = process.env.MYSQL_HOST?.trim() || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || '3306');
const REDIS_HOST = process.env.REDIS_HOST?.trim() || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || '6379');

const children = new Map();
let shuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tcpOpen(host, port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(value);
    };
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function reachable(url, timeoutMs = 1800) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(url)) return true;
    await sleep(700);
  }
  return false;
}

function runOnce(args, label) {
  console.log(`\n[${label}] pnpm ${args.join(' ')}`);
  const result = spawnSync(pnpmBin, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
    env: process.env,
  });
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} that bai (ma ${result.status ?? 'unknown'}).`);
  }
}

function stopChildTree(child) {
  if (!child?.pid || child.exitCode !== null) return;

  try {
    if (isWindows) {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: false,
      });
    } else {
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

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children.values()) {
    stopChildTree(child);
  }
  children.clear();

  setTimeout(() => process.exit(exitCode), 50).unref();
}

function spawnPnpm(args, label, extraEnv = {}) {
  console.log(`[${label}] start: pnpm ${args.join(' ')}`);
  const child = spawn(pnpmBin, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, ...extraEnv },
  });

  children.set(label, child);

  child.on('error', (error) => {
    console.error(`❌ [${label}] spawn error: ${error.message}`);
    shutdown(1);
  });

  child.once('exit', (code, signal) => {
    children.delete(label);
    if (shuttingDown) return;

    console.error(
      `\n❌ [${label}] da thoat (${signal ? `signal ${signal}` : `code ${code ?? 0}`}).`,
    );
    console.error('Dung toan bo dev stack de tranh trang thai nua-song nua-chet.');
    shutdown(code && code !== 0 ? code : 1);
  });

  return child;
}

async function requireNativeInfra() {
  const mysqlOk = await tcpOpen(MYSQL_HOST, MYSQL_PORT);
  if (!mysqlOk) {
    throw new Error(
      [
        `MySQL native chua chay tai ${MYSQL_HOST}:${MYSQL_PORT}.`,
        'Du an da bo Docker, nen phai khoi dong MySQL service tren may.',
        'Neu .env cu dang dung 3307, script migrate se dua ve 3306.',
      ].join('\n'),
    );
  }
  console.log(`✓ MySQL native: ${MYSQL_HOST}:${MYSQL_PORT}`);

  const redisOk = await tcpOpen(REDIS_HOST, REDIS_PORT);
  if (!redisOk) {
    throw new Error(
      [
        `Redis/Memurai native chua chay tai ${REDIS_HOST}:${REDIS_PORT}.`,
        'Khoi dong Redis hoac Memurai service tren may roi chay lai.',
      ].join('\n'),
    );
  }
  console.log(`✓ Redis/Memurai native: ${REDIS_HOST}:${REDIS_PORT}`);
}

async function ensureApi() {
  const health = 'http://127.0.0.1:3000/api/v1/suc-khoe';

  if (await reachable(health)) {
    console.log('✓ API :3000 da chay -> reuse.');
    return;
  }

  if (await tcpOpen('127.0.0.1', 3000)) {
    throw new Error(
      'Port 3000 dang bi process khac chiem nhung khong phai AgriMarket API healthy.',
    );
  }

  await requireNativeInfra();

  spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');

  if (!(await waitFor(health, 90_000))) {
    throw new Error(`API khong healthy sau 90s: ${health}`);
  }

  console.log('✓ API healthy: http://127.0.0.1:3000');
}

async function ensureCustomer() {
  const url = 'http://127.0.0.1:3001/';
  if (await reachable(url)) {
    console.log('✓ Customer Web :3001 da chay -> reuse.');
    return;
  }
  if (await tcpOpen('127.0.0.1', 3001)) {
    throw new Error('Port 3001 dang bi process khac chiem.');
  }

  spawnPnpm(['--filter', '@agrimarket/customer-web', 'dev'], 'customer-web');
  if (!(await waitFor(url, 90_000))) {
    throw new Error(`Customer Web khong phan hoi sau 90s: ${url}`);
  }
  console.log('✓ Customer Web: http://127.0.0.1:3001');
}

async function ensureAdmin() {
  const url = 'http://127.0.0.1:3002/';
  if (await reachable(url)) {
    console.log('✓ Admin Web :3002 da chay -> reuse.');
    return;
  }
  if (await tcpOpen('127.0.0.1', 3002)) {
    throw new Error('Port 3002 dang bi process khac chiem.');
  }

  spawnPnpm(['--filter', '@agrimarket/admin-web', 'dev'], 'admin-web');
  if (!(await waitFor(url, 90_000))) {
    throw new Error(`Admin Web khong phan hoi sau 90s: ${url}`);
  }
  console.log('✓ Admin Web: http://127.0.0.1:3002');
}

async function metroReady() {
  try {
    const response = await fetch('http://127.0.0.1:8081/status', {
      signal: AbortSignal.timeout(1500),
    });
    const text = await response.text();
    return response.ok && text.toLowerCase().includes('packager-status:running');
  } catch {
    return false;
  }
}

async function ensureMobile() {
  if (await metroReady()) {
    console.log('✓ Expo Metro :8081 da chay -> reuse.');
    return;
  }

  if (await tcpOpen('127.0.0.1', 8081)) {
    throw new Error(
      'Port 8081 dang bi process khac chiem. Dong process do roi chay lai Expo.',
    );
  }

  spawnPnpm(['--filter', '@agrimarket/mobile', 'start'], 'mobile-expo');

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await metroReady()) {
      console.log('✓ Expo Metro: http://127.0.0.1:8081');
      return;
    }
    await sleep(700);
  }

  throw new Error('Expo Metro khong san sang tai :8081 sau 90s.');
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  console.log('');
  console.log('AgriMarket Dev Stack - native + Expo LAN');
  console.log('========================================');
  console.log(`Mode: ${mode}`);
  console.log('Docker: OFF');
  console.log('USB reverse: OFF');
  console.log('');

  if (!fs.existsSync(rootEnv)) {
    console.warn('⚠ Chua co root .env. Hay copy .env.example -> .env neu API thieu bien moi truong.');
  }

  runOnce(['--filter', '@agrimarket/api-client', 'ensure'], 'api-client');

  await ensureApi();

  if (mode === 'customer' || mode === 'web' || mode === 'all') {
    await ensureCustomer();
  }

  if (mode === 'admin' || mode === 'web' || mode === 'all') {
    await ensureAdmin();
  }

  if (mode === 'mobile' || mode === 'all') {
    await ensureMobile();
  }

  console.log('');
  console.log('========================================');
  console.log('AGRIMARKET DEV READY');
  console.log('========================================');
  console.log('API      : http://127.0.0.1:3000');
  if (mode === 'customer' || mode === 'web' || mode === 'all')
    console.log('Customer : http://127.0.0.1:3001');
  if (mode === 'admin' || mode === 'web' || mode === 'all')
    console.log('Admin    : http://127.0.0.1:3002');
  if (mode === 'mobile' || mode === 'all')
    console.log('Mobile   : Expo Go / LAN / Metro :8081');
  console.log('');
  console.log('Nhan Ctrl+C de dung cac process do launcher nay khoi dong.');
  console.log('');

  if (children.size === 0) {
    await new Promise(() => setInterval(() => {}, 60_000));
  } else {
    await new Promise(() => {});
  }
} catch (error) {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
}
