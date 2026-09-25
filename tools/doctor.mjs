import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, '..');
const envPath = path.join(repoRoot, '.env');

if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // env load handled below
  }
}

const checks = [];

function ok(name, detail) {
  console.log(`✓ ${name}: ${detail}`);
  checks.push({ name, ok: true });
}

function warn(name, detail) {
  console.log(`⚠️  ${name}: ${detail}`);
}

function fail(name, detail) {
  console.error(`❌ ${name}: ${detail}`);
  checks.push({ name, ok: false });
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

function privateIps() {
  const result = [];
  for (const [name, entries] of Object.entries(networkInterfaces())) {
    for (const entry of entries ?? []) {
      const family = typeof entry.family === 'string' ? entry.family : String(entry.family);
      if ((family === 'IPv4' || family === '4') && !entry.internal) {
        result.push(`${name}=${entry.address}`);
      }
    }
  }
  return result;
}

console.log('AgriMarket Doctor');
console.log('=================');

// 1. Node version check (>=24 <25)
const nodeVerMatch = process.version.match(/^v(\d+)\./);
const majorNode = nodeVerMatch ? Number(nodeVerMatch[1]) : 0;
if (majorNode === 24) {
  ok('Node.js', `${process.version} (chuẩn >=24 <25)`);
} else {
  fail('Node.js', `${process.version} (yêu cầu Node.js 24.x)`);
}

// 2. pnpm version check
try {
  const pnpmVersion = execSync('pnpm -v', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  if (pnpmVersion) {
    ok('pnpm', `${pnpmVersion}`);
  }
} catch {
  warn('pnpm', 'khong the kiem tra pnpm CLI');
}

// 3. .env check
if (fs.existsSync(envPath)) {
  ok('.env', envPath);
} else {
  fail('.env', 'chưa có; sao chép: copy .env.example .env');
}

// 4. MySQL port check
const mysqlHost = process.env.MYSQL_HOST || '127.0.0.1';
const mysqlPort = Number(process.env.MYSQL_PORT || '3306');
if (await tcpOpen(mysqlHost, mysqlPort)) {
  ok('MySQL', `${mysqlHost}:${mysqlPort}`);
} else {
  fail('MySQL', `${mysqlHost}:${mysqlPort} chưa mở`);
}

// 5. Redis/Memurai port check
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT || '6379');
if (await tcpOpen(redisHost, redisPort)) {
  ok('Redis/Memurai', `${redisHost}:${redisPort}`);
} else {
  fail('Redis/Memurai', `${redisHost}:${redisPort} chưa mở`);
}

// 6. LAN IPv4 check
const ips = privateIps();
if (ips.length > 0) {
  ok('LAN IPv4', ips.join(' | '));
} else {
  fail('LAN IPv4', 'không tìm thấy card mạng phù hợp cho Expo LAN');
}

// 7. API check (Pre-start semantics: healthy -> PASS, not running -> INFO/WARN, unrelated service -> WARN)
const apiPortOpen = await tcpOpen('127.0.0.1', 3000, 800);
if (apiPortOpen) {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/suc-khoe', { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      ok('API (:3000)', 'http://127.0.0.1:3000/api/v1/suc-khoe (đang chạy healthy)');
    } else {
      warn('API (:3000)', `Port 3000 mở nhưng API trả về HTTP ${response.status}`);
    }
  } catch {
    warn('API (:3000)', 'Port 3000 mở nhưng endpoint /suc-khoe không phản hồi đúng (có thể do service khác chiếm port)');
  }
} else {
  console.log('ℹ API (:3000): Chưa chạy (bình thường trước khi pnpm dev). Dùng `pnpm runtime:smoke` sau khi khởi động stack.');
}

console.log('');
const failed = checks.filter((item) => !item.ok);
if (failed.length === 0) {
  console.log('✅ DOCTOR PASS');
  process.exit(0);
}
console.error(`❌ DOCTOR FAIL: ${failed.map((item) => item.name).join(', ')}`);
process.exit(1);
