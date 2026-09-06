import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const API_HEALTH = 'http://127.0.0.1:3000/api/v1/suc-khoe';
const WEB_URL = 'http://127.0.0.1:3001';

const children = new Set();

function spawnPnpm(args, label) {
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    shell: false,
    detached: process.platform !== 'win32',
  });

  children.add(child);
  child.once('exit', (code) => {
    children.delete(child);
    if (code && code !== 0) {
      console.error(`[${label}] thoát với mã ${code}`);
    }
  });

  return child;
}

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(url, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await reachable(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  return false;
}

function lanIp() {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return null;
}

function stop() {
  for (const child of children) {
    try {
      if (process.platform !== 'win32' && child.pid) {
        process.kill(-child.pid, 'SIGTERM');
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // Process may already be gone.
    }
  }
}

process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

console.log('AgriMarket Customer Stack');
console.log('1) Khởi động hạ tầng Docker...');
const docker = spawnPnpm(['docker:up'], 'docker');
await new Promise((resolve, reject) => {
  docker.once('exit', (code) => (code === 0 ? resolve() : reject(new Error('docker:up thất bại'))));
});

let apiChild = null;
if (await reachable(API_HEALTH)) {
  console.log('2) API đã chạy tại :3000');
} else {
  console.log('2) Khởi động API...');
  apiChild = spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');

  if (!(await waitFor(API_HEALTH, 60_000))) {
    stop();
    throw new Error(`API không healthy sau 60s: ${API_HEALTH}`);
  }

  console.log('   API healthy.');
}

console.log('3) Khởi động Customer Web...');
const webChild = spawnPnpm(['--filter', '@agrimarket/customer-web', 'dev'], 'customer-web');

if (!(await waitFor(WEB_URL, 60_000))) {
  stop();
  throw new Error(`Customer Web không phản hồi sau 60s: ${WEB_URL}`);
}

console.log('');
console.log(`✓ Local: ${WEB_URL}`);
const ip = lanIp();
if (ip) {
  console.log(`✓ LAN Web: http://${ip}:3001`);
  console.log(`✓ LAN API: http://${ip}:3000/api/v1`);
}
console.log('Nhấn Ctrl+C để dừng API/Web (Docker vẫn giữ nguyên).');

await new Promise((resolve) => {
  webChild.once('exit', resolve);
  apiChild?.once('exit', resolve);
});

stop();
