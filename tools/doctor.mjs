import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, '..');
const envPath = path.join(repoRoot, '.env');

if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

const checks = [];

function ok(name, detail) {
  console.log(`✓ ${name}: ${detail}`);
  checks.push({ name, ok: true });
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

async function httpCheck(name, url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (response.ok) ok(name, url);
    else fail(name, `${url} -> HTTP ${response.status}`);
  } catch {
    fail(name, `${url} chua phan hoi`);
  }
}

console.log('AgriMarket Doctor');
console.log('=================');

if (fs.existsSync(envPath)) ok('.env', envPath);
else fail('.env', 'chua co; copy .env.example -> .env');

const mysqlHost = process.env.MYSQL_HOST || '127.0.0.1';
const mysqlPort = Number(process.env.MYSQL_PORT || '3306');
if (await tcpOpen(mysqlHost, mysqlPort)) ok('MySQL', `${mysqlHost}:${mysqlPort}`);
else fail('MySQL', `${mysqlHost}:${mysqlPort} chua mo`);

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT || '6379');
if (await tcpOpen(redisHost, redisPort)) ok('Redis/Memurai', `${redisHost}:${redisPort}`);
else fail('Redis/Memurai', `${redisHost}:${redisPort} chua mo`);

const ips = privateIps();
if (ips.length > 0) ok('LAN IPv4', ips.join(' | '));
else fail('LAN IPv4', 'khong tim thay card mang phu hop cho Expo LAN');

await httpCheck('API', 'http://127.0.0.1:3000/api/v1/suc-khoe');

console.log('');
const failed = checks.filter((item) => !item.ok);
if (failed.length === 0) {
  console.log('✅ DOCTOR PASS');
  process.exit(0);
}
console.error(`❌ DOCTOR FAIL: ${failed.map((item) => item.name).join(', ')}`);
process.exit(1);
