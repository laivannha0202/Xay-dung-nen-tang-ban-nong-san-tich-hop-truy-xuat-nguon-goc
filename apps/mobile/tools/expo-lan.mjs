import { spawn } from 'node:child_process';
import { networkInterfaces, platform } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = platform() === 'win32';
const pnpmBin = isWindows ? 'pnpm.cmd' : 'pnpm';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(toolsDir, '..');
const repoRoot = path.resolve(mobileDir, '..', '..');

function isPrivateIpv4(ip) {
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  const m = ip.match(/^172\.(\d+)\./);
  return Boolean(m && Number(m[1]) >= 16 && Number(m[1]) <= 31);
}

function scoreInterface(name, address) {
  const n = name.toLowerCase();
  let score = 0;

  if (isPrivateIpv4(address)) score += 100;
  if (/(wi-?fi|wireless|wlan)/i.test(name)) score += 50;
  if (/(ethernet|eth)/i.test(name)) score += 40;
  if (/(virtual|vmware|vbox|wsl|docker|tailscale|hyper-v|vethernet)/i.test(n)) score -= 100;

  if (/^192\.168\./.test(address)) score += 30;
  else if (/^10\./.test(address)) score += 20;
  else if (/^172\./.test(address)) score += 10;

  return score;
}

function detectLanIp() {
  const manual = process.env.AGRIMARKET_LAN_IP?.trim();
  if (manual) return manual;

  const candidates = [];
  for (const [name, entries] of Object.entries(networkInterfaces())) {
    for (const entry of entries ?? []) {
      const family = typeof entry.family === 'string' ? entry.family : String(entry.family);
      if ((family === 'IPv4' || family === '4') && !entry.internal) {
        candidates.push({
          name,
          address: entry.address,
          score: scoreInterface(name, entry.address),
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    throw new Error(
      'Khong tim thay LAN IPv4. Hay ket noi Wi-Fi/LAN hoac dat AGRIMARKET_LAN_IP=<ip-cua-may>.',
    );
  }

  const winner = candidates[0];
  console.log(`✓ LAN interface: ${winner.name} -> ${winner.address}`);
  if (candidates.length > 1) {
    console.log(
      '  Neu Expo chon sai card mang, dat AGRIMARKET_LAN_IP de override.',
    );
  }
  return winner.address;
}

async function apiHealthy() {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/v1/suc-khoe', {
      signal: AbortSignal.timeout(1800),
    });
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await apiHealthy())) {
  console.error('');
  console.error('❌ API chua healthy tai http://127.0.0.1:3000/api/v1/suc-khoe');
  console.error('   Chay mot trong cac lenh sau truoc:');
  console.error('   pnpm dev:api');
  console.error('   pnpm dev:mobile');
  console.error('   pnpm dev');
  process.exit(1);
}

const lanIp = detectLanIp();
const explicitApi = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl =
  explicitApi && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(explicitApi)
    ? explicitApi.replace(/\/+$/, '')
    : `http://${lanIp}:3000`;

console.log('');
console.log('AgriMarket Mobile - Expo Go + LAN');
console.log('=================================');
console.log(`✓ API host: ${apiBaseUrl}`);
console.log('✓ Metro: port 8081 / mode LAN');
console.log('✓ Expo LAN truc tiep; khong can ket noi cap USB.');
console.log('✓ Dien thoai va may tinh phai cung Wi-Fi/LAN.');
console.log('');

const child = spawn(
  pnpmBin,
  [
    '--filter',
    '@agrimarket/mobile',
    'exec',
    'expo',
    'start',
    '--go',
    '--lan',
    '--port',
    '8081',
  ],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
      REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
    },
  },
);

child.on('error', (error) => {
  console.error(`❌ Khong khoi dong duoc Expo: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
