import { spawn } from 'node:child_process';
import { networkInterfaces, platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const API_HEALTH = 'http://127.0.0.1:3000/api/v1/suc-khoe';
const WEB_URL = 'http://127.0.0.1:3001';

const children = new Set();

function pnpmBin() {
  return platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function spawnPnpm(args, label) {
  const child = spawn(pnpmBin(), args, {
    stdio: 'inherit',
    shell: false,
    detached: platform() !== 'win32',
  });

  children.add(child);
  child.once('exit', (code) => {
    children.delete(child);
    if (code && code !== 0) {
      console.error(`[${label}] thoát với mã ${code}`);
    }
  });

  child.on('error', (err) => {
    console.error(`[${label}] spawn error: ${err.message}`);
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
      if (platform() !== 'win32' && child.pid) {
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

let apiChild = null;
if (await reachable(API_HEALTH)) {
  console.log('API đã chạy tại :3000');
} else {
  console.log('Khởi động API (nếu có)...');
  apiChild = spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');

  if (!(await waitFor(API_HEALTH, 60_000))) {
    console.warn('API không healthy sau 60s — frontend vẫn chạy mà không cần API.');
    apiChild?.kill('SIGTERM');
    apiChild = null;
  } else {
    console.log('   API healthy.');
  }
}

console.log('Khởi động Customer Web...');
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
  if (apiChild) console.log(`✓ LAN API: http://${ip}:3000/api/v1`);
}
console.log('Nhấn Ctrl+C để dừng (API sẽ dừng theo nếu đã khởi động).');

await new Promise((resolve) => {
  webChild.once('exit', resolve);
  apiChild?.once('exit', resolve);
});

stop();