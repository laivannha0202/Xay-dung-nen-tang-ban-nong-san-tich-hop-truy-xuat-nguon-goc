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

const validModes = new Set(['api', 'customer', 'admin', 'mobile', 'mobile-go', 'web', 'all']);
if (!validModes.has(mode)) {
  console.error(`Mode khong hop le: ${mode}`);
  console.error('Dung: api | customer | admin | mobile | mobile-go | web | all');
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
const childLogs = new Map();
const logsDir = path.join(repoRoot, 'logs');
const HEALTH_TIMEOUT_MS = Number(process.env.DEV_STACK_TIMEOUT_MS || 90_000);
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

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001B\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function tailFile(file, maxLines = 40) {
  try {
    if (!fs.existsSync(file)) return [];
    const lines = stripAnsi(fs.readFileSync(file, 'utf8')).split(/\r?\n/);
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
    return lines.slice(-maxLines);
  } catch {
    return [];
  }
}

function listeningPid(port) {
  if (!isWindows) return null;
  try {
    const result = spawnSync('netstat', ['-ano'], { encoding: 'utf8' });
    if (result.status !== 0 || !result.stdout) return null;
    for (const line of result.stdout.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const local = parts[1] ?? '';
      const pid = Number(parts[parts.length - 1]);
      if (local.endsWith(`:${port}`) && Number.isFinite(pid)) return pid;
    }
  } catch {
    // Khong doc duoc netstat thi bo qua, van in loi chung.
  }
  return null;
}

function portTakenHint(port) {
  const pid = listeningPid(port);
  if (!pid) return `Port ${port} dang bi process khac chiem.`;
  return [`Port ${port} dang bi PID ${pid} chiem.`, `Giai phong: taskkill /PID ${pid} /T /F`].join(
    '\n',
  );
}

async function waitUntil(probe, timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) return true;
    // nest/next dang watch nen app chet van giu watcher: chi fail-fast khi ca process thoat.
    if (child && child.exitCode !== null) return false;
    await sleep(700);
  }
  return false;
}

async function waitFor(url, timeoutMs, child) {
  return waitUntil(() => reachable(url), timeoutMs, child);
}

const manualCommands = {
  api: 'pnpm --filter @agrimarket/api start:dev',
  'customer-web': 'pnpm --filter @agrimarket/customer-web dev',
  'admin-web': 'pnpm --filter @agrimarket/admin-web dev',
  'mobile-expo': 'pnpm --filter @agrimarket/mobile start',
  'mobile-expo-go': 'pnpm --filter @agrimarket/mobile start',
};

function reportStartupFailure(label, url, reason) {
  const logFile = childLogs.get(label);
  console.error(`\n❌ ${label} khong khoi dong duoc: ${reason}`);

  if (logFile) {
    const relative = path.relative(repoRoot, logFile);
    const tail = tailFile(logFile, 40);
    console.error(`\n--- 40 dong cuoi cua ${relative} ---`);
    if (tail.length === 0) {
      console.error('(process khong ghi ra gi - co the bi Windows tat hoac treo)');
    } else {
      for (const line of tail) console.error(line);
    }
    console.error(`--- het ${relative} ---\n`);
  } else {
    console.error('\n(Ti trinh nay chay truc tiep tren terminal nen khong ghi log file.');
    console.error(' Loi that cua no da duoc in ngay tren terminal nay.)\n');
  }

  let port;
  try {
    port = new URL(url).port || null;
  } catch {
    port = null;
  }
  if (port) {
    const pid = listeningPid(Number(port));
    if (pid) {
      console.error(portTakenHint(Number(port)));
      console.error('Neu PID do chinh la AgriMarket cu cua ban, tat no truocc da.');
    }
  }

  console.error(
    `\nChay rieng "${manualCommands[label] ?? 'pnpm dev'}" de xem loi that cua ${label}.`,
  );
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

  // Khong unref: giu process song thêm 50ms de flush log va de exit code dung
  // (Ctrl+C -> 0, loi khoi dong -> 1).
  setTimeout(() => process.exit(exitCode), 50);
}

/**
 * @param {string[]} args
 * @param {string} label
 * @param {Record<string, string>} [extraEnv]
 * @param {{ foreground?: boolean }} [options]
 *   `foreground: true` = giao terminal that cho process con (stdio inherit) de no co TTY that.
 *   Expo CLI chi hien QR + Terminal UI khi `process.stdout.isTTY` true; neu pipe
 *   stdout (nhu phan `pnpm dev`) thi Expo chay o che do non-interactive va khong in QR.
 *   Process foreground khong ghi duoc logs/<label>.log (khong pipe stdout) nen
 *   reportStartupFailure se bao loi that o chinh terminal nay.
 */
function spawnPnpm(args, label, extraEnv = {}, { foreground = false } = {}) {
  console.log(`[${label}] start: pnpm ${args.join(' ')}`);
  const child = spawn(pnpmBin, args, {
    cwd: repoRoot,
    stdio: foreground ? 'inherit' : ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, ...extraEnv },
  });

  if (foreground) {
    children.set(label, child);
  } else {
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, `${label}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'w' });
    childLogs.set(label, logFile);
    console.log(`[${label}] log: ${path.relative(repoRoot, logFile)}`);

    // Van hien thi terminal nhu cu, nhung giu lai de bao loi that khi khoi dong fail.
    for (const stream of [child.stdout, child.stderr]) {
      if (!stream) continue;
      stream.on('data', (chunk) => {
        logStream.write(chunk);
        process.stdout.write(chunk);
      });
    }

    children.set(label, child);
  }

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
    throw new Error(portTakenHint(3000));
  }

  await requireNativeInfra();

  const child = spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');

  if (!(await waitFor(health, HEALTH_TIMEOUT_MS, child))) {
    reportStartupFailure(
      'api',
      health,
      `khong healthy sau ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s`,
    );
    throw new Error('API khong healthy. Xem loi that ben tren.');
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
    throw new Error(portTakenHint(3001));
  }

  const child = spawnPnpm(['--filter', '@agrimarket/customer-web', 'dev'], 'customer-web');
  if (!(await waitFor(url, HEALTH_TIMEOUT_MS, child))) {
    reportStartupFailure(
      'customer-web',
      url,
      `khong phan hoi sau ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s`,
    );
    throw new Error('Customer Web khong phan hoi. Xem loi that ben tren.');
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
    throw new Error(portTakenHint(3002));
  }

  const child = spawnPnpm(['--filter', '@agrimarket/admin-web', 'dev'], 'admin-web');
  if (!(await waitFor(url, HEALTH_TIMEOUT_MS, child))) {
    reportStartupFailure(
      'admin-web',
      url,
      `khong phan hoi sau ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s`,
    );
    throw new Error('Admin Web khong phan hoi. Xem loi that ben tren.');
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
    throw new Error(`${portTakenHint(8081)}\nDong process do roi chay lai Expo.`);
  }

  const child = spawnPnpm(['--filter', '@agrimarket/mobile', 'start'], 'mobile-expo');

  if (await waitUntil(metroReady, HEALTH_TIMEOUT_MS, child)) {
    console.log('✓ Expo Metro: http://127.0.0.1:8081');
    return;
  }

  reportStartupFailure(
    'mobile-expo',
    'http://127.0.0.1:8081/status',
    `Expo Metro khong san sang sau ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s`,
  );
  throw new Error('Expo Metro khong san sang. Xem loi that ben tren.');
}

function spawnPnpmForeground(args, label, extraEnv = {}) {
  return spawnPnpm(args, label, extraEnv, { foreground: true });
}

/**
 * Mode foreground: giao terminal that cho Expo de no co TTY that.
 * - Expo CLI kiem tra `process.stdout.isTTY`; chi khi TRUE moi in QR + Terminal UI.
 * - Khi Expo chay foreground, khong the polling `/status` (stdout bi chuyen truc tiep
 *   sang console cua Expo) nen bo qua readiness polling va giu process song.
 */
async function ensureMobileForeground() {
  if (await tcpOpen('127.0.0.1', 8081)) {
    throw new Error(
      [
        `${portTakenHint(8081)}`,
        'Metro dang chay san nen khong the gan Terminal UI (QR) vao process da co.',
        'Dong no roi chay lai `pnpm dev`.',
        'Neu ban khong can QR (chi can app chay), dung `pnpm dev:mobile`.',
      ].join('\n'),
    );
  }

  console.log('');
  console.log('Expo chay FOREGROUND: terminal nay duoc giao cho Expo de hien QR.');
  console.log('Scan QR bang Expo Go (dien thoai + may tinh cung Wi-Fi/LAN).');
  console.log('API van chay background va ghi log o logs/api.log.');
  console.log('');

  spawnPnpmForeground(['--filter', '@agrimarket/mobile', 'start'], 'mobile-expo-go');
}

function printReadyBanner(currentMode) {
  console.log('');
  console.log('========================================');
  console.log('AGRIMARKET DEV READY');
  console.log('========================================');
  console.log('API      : http://127.0.0.1:3000');
  if (currentMode === 'customer' || currentMode === 'web' || currentMode === 'all')
    console.log('Customer : http://127.0.0.1:3001');
  if (currentMode === 'admin' || currentMode === 'web' || currentMode === 'all')
    console.log('Admin    : http://127.0.0.1:3002');
  if (currentMode === 'mobile-go' || currentMode === 'all')
    console.log('Mobile   : Expo Go foreground (co QR) / Metro :8081');
  else if (currentMode === 'mobile') console.log('Mobile   : Expo Go background / Metro :8081');
  console.log('');
  console.log('Nhan Ctrl+C de dung cac process do launcher nay khoi dong.');
  console.log('');
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
    console.warn(
      '⚠ Chua co root .env. Hay copy .env.example -> .env neu API thieu bien moi truong.',
    );
  }

  runOnce(['--filter', '@agrimarket/api-client', 'ensure'], 'api-client');

  await ensureApi();

  if (mode === 'customer' || mode === 'web' || mode === 'all') {
    await ensureCustomer();
  }

  if (mode === 'admin' || mode === 'web' || mode === 'all') {
    await ensureAdmin();
  }

  if (mode === 'mobile') {
    await ensureMobile();
  }

  printReadyBanner(mode);

  // Bat ke sau banner: Expo foreground chiem terminal ngay khi bat dau.
  // Mode `all` cung chay foreground de `pnpm dev` luon hien QR de quet.
  if (mode === 'mobile-go' || mode === 'all') {
    await ensureMobileForeground();
  }

  if (children.size === 0) {
    await new Promise(() => setInterval(() => {}, 60_000));
  } else {
    await new Promise(() => {});
  }
} catch (error) {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
}
