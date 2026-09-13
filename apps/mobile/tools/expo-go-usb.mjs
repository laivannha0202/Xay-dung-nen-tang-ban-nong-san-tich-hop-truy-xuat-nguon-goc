import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyAdbDevices, selectPhysicalDevice } from './adb-devices.mjs';

/**
 * AGRIMARKET — EXPO GO + USB (Windows native, KHÔNG Docker).
 *
 * Canonical entry: `pnpm mobile:usb` → scripts/dev-mobile-usb.mjs → file này.
 * (`pnpm dev:mobile:usb` là alias cũ, giữ nguyên để tương thích.)
 *
 * Luồng:
 *   adb start-server → điện thoại USB thật → Expo Go → api-client ensure 1 lần
 *   → MySQL native 3306 + Redis/Memurai 6379 (fail fast, KHÔNG Docker)
 *   → reuse Nest API đang chạy hoặc start `@agrimarket/api start:dev`
 *     (reuse root .env qua ConfigModule envFilePath ['.env', '../../.env'])
 *   → adb reverse tcp:3000 + tcp:8081 (per-port, KHÔNG remove-all)
 *   → reuse Metro 8081 hoặc `expo start --go --localhost --port 8081`
 *   → tự mở exp://127.0.0.1:8081 trong Expo Go.
 */

const isWindows = process.platform === 'win32';
// Windows: Node KHÔNG spawn trực tiếp file .cmd khi shell:false (EINVAL),
// nên pnpm trên Windows bắt buộc resolve sang pnpm.cmd VÀ spawn qua shell.
// Phạm vi shell:true CHỈ giới hạn ở spawn pnpm. adb/node/execFile bên dưới
// luôn dùng shell:false.
const pnpmBin = isWindows ? 'pnpm.cmd' : 'pnpm';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(toolsDir, '..');
const repoRoot = path.resolve(mobileDir, '..', '..');

const API_HEALTH = 'http://127.0.0.1:3000/api/v1/suc-khoe';
const API_BASE_URL = 'http://127.0.0.1:3000';
const METRO_URL = 'http://127.0.0.1:8081';
const MYSQL_HOST = '127.0.0.1';
const MYSQL_PORT = 3306;
const REDIS_HOST = '127.0.0.1';
const REDIS_PORT = 6379;
const EXPO_GO_PACKAGE = 'host.exp.exponent';
const EXPECTED_EXPO_SDK_MAJOR = 57;
// Chỉ 2 port USB cần thiết. KHÔNG quản lý port khác, KHÔNG reverse --remove-all
// để không ảnh hưởng dev session khác trên cùng máy.
const USB_REVERSE_PORTS = [3000, 8081];

// Chỉ các process do script này tự start mới được Ctrl+C dừng.
// Process đã chạy từ trước (API/Metro reuse), MySQL, Memurai, adb daemon
// KHÔNG BAO GIỜ bị script kill.
const ownedChildren = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
}

function spawnPnpm(args, label, extraEnv = {}) {
  const child = spawn(pnpmBin, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    // shell CHỈ bật cho pnpm.cmd trên Windows (xem chú thích pnpmBin).
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, ...extraEnv },
  });
  ownedChildren.add(child);
  child.once('exit', (code) => {
    ownedChildren.delete(child);
    if (code && code !== 0) console.error(`[${label}] thoát với mã ${code}`);
  });
  return child;
}

/** Dừng CHỈ các child do script tạo. Không đụng process có sẵn. */
function stopOwnedChildren() {
  for (const child of ownedChildren) {
    try {
      if (!isWindows && child.pid) process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch {
      // Process may already be gone.
    }
  }
}

// Tìm adb trên cả máy PATH thiếu (Windows cài platform-tools ở C:\platform-tools
// nhưng chưa thêm PATH). Giữ 'adb' gốc nếu đã có trong PATH để không đổi
// hành vi trên Linux/CI.
let adbBin = 'adb';
function resolveAdbBinary() {
  try {
    execFileSync(adbBin, ['version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    return adbBin;
  } catch {
    // Tiếp tục dò các vị trí phổ biến.
  }
  const userProfile = process.env.USERPROFILE || '';
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe'),
    process.env.ANDROID_SDK_ROOT &&
      path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb.exe'),
    localAppData && path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    userProfile &&
      path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    userProfile && path.join(userProfile, 'Downloads', 'platform-tools', 'adb.exe'),
    'C:\\platform-tools\\adb.exe',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        process.env.PATH = `${path.dirname(candidate)}${path.delimiter}${process.env.PATH || ''}`;
        execFileSync(candidate, ['version'], { stdio: ['ignore', 'pipe', 'pipe'] });
        return candidate;
      }
    } catch {
      // Thử ứng viên tiếp theo.
    }
  }
  return adbBin;
}

// Đồng bộ API client ĐÚNG MỘT LẦN tại đây. Metro được chạy qua
// `pnpm exec expo ...` (không phải `pnpm start`) nên prestart KHÔNG
// kích hoạt ensure lần hai — hết lỗi double-ensure.
function ensureApiClientOnce() {
  console.log('📦 Đồng bộ API client (1 lần duy nhất)...');
  const result = spawnSync(pnpmBin, ['--filter', '@agrimarket/api-client', 'ensure'], {
    cwd: repoRoot,
    stdio: 'inherit',
    // shell CHỈ cho pnpm.cmd trên Windows (xem chú thích pnpmBin).
    shell: isWindows,
    env: process.env,
  });
  if (result.error) {
    throw new Error(`Không chạy được api-client:ensure: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `api-client:ensure thất bại (mã ${result.status ?? 'unknown'}). ` +
        'Chạy `pnpm api-client:sync` để regenerate từ backend rồi thử lại.',
    );
  }
  console.log('✓ API Client synchronized');
}

// Nạp root .env vào process.env (chỉ fill biến còn thiếu, không override).
// Lý do: `pnpm --filter @agrimarket/api start:dev` chạy với cwd apps/api,
// nơi `import 'dotenv/config'` của prisma7.config.ts chỉ thấy apps/api/.env
// (không tồn tại); root .env mới chứa DATABASE_URL/SHADOW_DATABASE_URL native
// mà `prisma generate` bắt buộc phải có. ConfigModule runtime vẫn reuse root
// .env qua envFilePath ['.env', '../../.env'] như cũ.
// Dùng Node built-in loadEnvFile — không thêm dependency, không duplicate env
// parser, không hard-code credential, không commit secret.
function seedRootEnv() {
  const rootEnv = path.join(repoRoot, '.env');
  if (!fs.existsSync(rootEnv)) {
    throw new Error(
      'Không thấy root .env. Backend native cần root .env (DATABASE_URL, MYSQL_*, REDIS_*) — ' +
        'tạo từ .env.example rồi chạy lại `pnpm mobile:usb`.',
    );
  }
  process.loadEnvFile(rootEnv);
  console.log('✓ Đã nạp root .env hiện tại cho Backend native');
}

function isTcpPortOpen(host, port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

process.on('SIGINT', () => {
  stopOwnedChildren();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopOwnedChildren();
  process.exit(0);
});

/**
 * Windows ADB recovery: start-server một lần rồi retry ngắn (USB enumeration
 * trên Windows đôi khi cần 1-2 giây). Không loop vô hạn, không kill server.
 */
async function readAdbDevicesWithRecovery() {
  try {
    exec(adbBin, ['start-server']);
  } catch {
    // start-server thất bại thì vẫn thử đọc devices bên dưới.
  }
  let lastOutput = '';
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      lastOutput = exec(adbBin, ['devices', '-l']);
      lastError = null;
      return lastOutput;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(800);
    }
  }
  if (lastError) {
    throw new Error('Không tìm thấy adb. Cài Android platform-tools của hệ thống rồi chạy lại.');
  }
  return lastOutput;
}

async function parseAdbDevices() {
  const output = await readAdbDevicesWithRecovery();
  const requested = process.env.ANDROID_SERIAL?.trim();
  try {
    return selectPhysicalDevice(classifyAdbDevices(output, requested));
  } catch (error) {
    // Khi vẫn không thấy máy thật: in output đã sanitize (chỉ serial/model,
    // không có secret) rồi dừng. Không dùng Android Studio/emulator.
    console.error('');
    console.error('--- adb devices -l ---');
    console.error(String(output || '').trim() || '(trống)');
    console.error('----------------------');
    throw error;
  }
}

function ensureExpoGo(serial) {
  try {
    const output = exec(adbBin, ['-s', serial, 'shell', 'pm', 'path', EXPO_GO_PACKAGE]);
    if (!output.includes('package:')) throw new Error('missing');
  } catch {
    throw new Error('Chưa cài Expo Go trên điện thoại. Cài Expo Go từ Play Store rồi chạy lại.');
  }
}

function getExpoGoVersion(serial) {
  try {
    const output = exec(adbBin, ['-s', serial, 'shell', 'dumpsys', 'package', EXPO_GO_PACKAGE]);
    const match = output.match(/versionName=([^\s]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function ensureCompatibleExpoGo(serial) {
  const version = getExpoGoVersion(serial);
  if (!version) {
    throw new Error(
      'Không đọc được version Expo Go trên điện thoại. Hãy cài lại Expo Go tương thích SDK 57.',
    );
  }
  const major = Number.parseInt(version.split('.')[0], 10);
  if (major !== EXPECTED_EXPO_SDK_MAJOR) {
    throw new Error(
      [
        `Expo Go ${version} không tương thích với Expo SDK ${EXPECTED_EXPO_SDK_MAJOR}.`,
        '',
        'Cài Expo Go tương thích rồi chạy lại.',
      ].join('\n'),
    );
  }
  return version;
}

function removeReverse(serial, port) {
  try {
    exec(adbBin, ['-s', serial, 'reverse', '--remove', `tcp:${port}`]);
  } catch {
    // Mapping chưa tồn tại là bình thường.
  }
}

function addReverse(serial, port) {
  exec(adbBin, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
}

function getReverseMappings(serial) {
  return exec(adbBin, ['-s', serial, 'reverse', '--list']);
}

function ensureReverse(serial, port) {
  const mappings = getReverseMappings(serial);
  const expected = `tcp:${port} tcp:${port}`;
  if (!mappings.includes(expected))
    throw new Error(`ADB reverse cho port ${port} chưa được thiết lập đúng.`);
}

/**
 * Chỉ quản lý đúng port 3000/8081 của session này.
 * Mapping cũ còn dùng được thì reuse; thiếu/sai thì remove + add lại per-port.
 * KHÔNG dùng remove-all để không phá dev session khác.
 */
function setupUsbReverse(serial) {
  for (const port of USB_REVERSE_PORTS) {
    let mappings = '';
    try {
      mappings = getReverseMappings(serial);
    } catch {
      mappings = '';
    }
    if (mappings.includes(`tcp:${port} tcp:${port}`)) {
      console.log(`✓ reuse adb reverse tcp:${port} → tcp:${port}`);
      continue;
    }
    removeReverse(serial, port);
    addReverse(serial, port);
  }
}

function forceStopExpoGo(serial) {
  try {
    exec(adbBin, ['-s', serial, 'shell', 'am', 'force-stop', EXPO_GO_PACKAGE]);
  } catch {
    // Không fatal; launch bên dưới vẫn có thể hoạt động.
  }
}

async function reachable(url, timeoutMs = 1500) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

// Metro trên Windows có thể chỉ listen trên ::1 (Expo --localhost resolve
// localhost → ::1) thay vì 127.0.0.1, nên phải check dual-stack. Nếu chỉ check
// IPv4 sẽ tưởng port trống, start Metro thứ hai và dính EADDRINUSE.
const METRO_STATUS_URLS = ['http://127.0.0.1:8081/status', 'http://[::1]:8081/status'];

async function metroReady() {
  for (const url of METRO_STATUS_URLS) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      const text = await response.text();
      if (response.ok && text.includes('packager-status:running')) return true;
    } catch {
      // Thử địa chỉ tiếp theo.
    }
  }
  return false;
}

async function metroPortOccupied() {
  return (await isTcpPortOpen('127.0.0.1', 8081)) || (await isTcpPortOpen('::1', 8081));
}

// Metro do script start PHẢI reachable qua IPv4, vì adb reverse trên host
// forward về 127.0.0.1 — Metro ::1-only khiến Expo Go báo "Something went wrong".
async function metroReadyIPv4() {
  try {
    const response = await fetch('http://127.0.0.1:8081/status', {
      signal: AbortSignal.timeout(1500),
    });
    const text = await response.text();
    return response.ok && text.includes('packager-status:running');
  } catch {
    return false;
  }
}

// NODE_OPTIONS ép Node resolve localhost → 127.0.0.1 trước, để `expo start
// --localhost` bind IPv4 thay vì ::1-only trên Windows.
function ipv4FirstNodeOptions() {
  const current = process.env.NODE_OPTIONS ?? '';
  if (current.includes('dns-result-order')) return current;
  return `${current} --dns-result-order=ipv4first`.trim();
}

async function waitFor(check, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return true;
    await sleep(700);
  }
  return false;
}

async function runOnce(args, label) {
  const child = spawnPnpm(args, label);
  return new Promise((resolve, reject) => {
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} thất bại với mã ${code}`));
    });
  });
}

async function ensureNativeService(host, port, failMessage, hint) {
  if (await isTcpPortOpen(host, port)) return true;
  throw new Error([failMessage, '', hint].join('\n'));
}

try {
  console.log('');
  console.log('AgriMarket Mobile — Expo Go + USB (native, không Docker)');
  console.log('=========================================================');

  adbBin = resolveAdbBinary();
  const device = await parseAdbDevices();
  console.log(`✓ Điện thoại: ${device.serial}`);
  console.log(`  ${device.line}`);
  ensureExpoGo(device.serial);
  const expoGoVersion = ensureCompatibleExpoGo(device.serial);
  console.log(`✓ Expo Go ${expoGoVersion} tương thích SDK ${EXPECTED_EXPO_SDK_MAJOR}`);
  console.log(
    '✓ Giữ nguyên ứng dụng Expo Go chính thức trên điện thoại; script chỉ nối USB/Metro/API.',
  );

  console.log('');
  console.log('0) Đồng bộ API client...');
  ensureApiClientOnce();

  console.log('');
  console.log('1) Kiểm tra native services + Backend...');
  seedRootEnv();
  await ensureNativeService(
    MYSQL_HOST,
    MYSQL_PORT,
    'MySQL 127.0.0.1:3306 chưa chạy.',
    'Khởi động MySQL native Windows (port 3306) rồi chạy lại `pnpm mobile:usb`. USB flow không dùng Docker.',
  );
  console.log(`✓ MySQL native ${MYSQL_HOST}:${MYSQL_PORT}`);
  await ensureNativeService(
    REDIS_HOST,
    REDIS_PORT,
    'Redis/Memurai 127.0.0.1:6379 chưa chạy.',
    'Khởi động Memurai/Redis native Windows (port 6379) rồi chạy lại `pnpm mobile:usb`. USB flow không dùng Docker.',
  );
  console.log(`✓ Redis/Memurai native ${REDIS_HOST}:${REDIS_PORT}`);

  // Backend reuse root .env hiện tại qua ConfigModule
  // (envFilePath ['.env', '../../.env']); spawn từ repoRoot nên
  // `pnpm --filter @agrimarket/api start:dev` chạy với cwd apps/api và
  // đọc đúng root .env — không hard-code credential, không duplicate parser.
  let apiChild = null;
  let apiOwned = false;
  if (await reachable(API_HEALTH)) {
    console.log('✓ API đã chạy tại 127.0.0.1:3000 → reuse, không start thêm.');
  } else {
    console.log('   API chưa chạy → khởi động Nest API native (dùng root .env hiện tại)...');
    apiChild = spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');
    apiOwned = true;
    const healthy = await waitFor(() => reachable(API_HEALTH), 90_000);
    if (!healthy) {
      stopOwnedChildren();
      throw new Error(`API không healthy sau 90 giây: ${API_HEALTH}`);
    }
    console.log('✓ API healthy');
  }

  console.log('');
  console.log('2) Nối USB...');
  setupUsbReverse(device.serial);
  for (const port of USB_REVERSE_PORTS) ensureReverse(device.serial, port);
  console.log('✓ phone:3000 → host:3000 (Nest API)');
  console.log('✓ phone:8081 → host:8081 (Expo Metro)');

  // Port 8081: tái sử dụng Metro của chính AgriMarket nếu còn chạy,
  // chỉ fatal khi port bị chương trình khác chiếm (kèm PID để xử lý).
  // NGOẠI LỆ: Metro reuse nhưng ::1-only (IPv4 refuse) thì KHÔNG an toàn cho
  // USB — adb reverse forward về 127.0.0.1, Expo Go sẽ báo "Something went
  // wrong". Trường hợp này fail rõ thay vì reuse mù; script không tự kill
  // process của session khác.
  let reuseMetro = false;
  if (await metroReady()) {
    if (await metroReadyIPv4()) {
      reuseMetro = true;
      console.log('✓ Metro 8081 của AgriMarket vẫn chạy → tái sử dụng, không start mới.');
    } else {
      const pidHint = isWindows ? 'netstat -ano | findstr :8081' : 'ss -tlnp | grep 8081';
      throw new Error(
        [
          'Metro 8081 đang chạy nhưng CHỈ listen IPv6 (::1), điện thoại qua adb reverse (IPv4 127.0.0.1) không tải được bundle.',
          '',
          'Tìm PID Metro cũ đang giữ port:',
          `  ${pidHint}`,
          '',
          'Dừng đúng Metro cũ đó (ví dụ trên Windows: taskkill /PID <pid> /T /F), rồi chạy lại:',
          '  pnpm mobile:usb',
          '',
          'Lần chạy lại script sẽ tự start Metro bind IPv4 để Expo Go tải được project.',
        ].join('\n'),
      );
    }
  } else if (await metroPortOccupied()) {
    const pidHint = isWindows ? 'netstat -ano | findstr :8081' : 'ss -tlnp | grep 8081';
    throw new Error(
      [
        'Port 8081 đang bị một chương trình KHÁC (không phải Metro AgriMarket) chiếm.',
        '',
        'Tìm PID đang giữ port:',
        `  ${pidHint}`,
        '',
        'Dừng đúng process đó rồi chạy lại:',
        '  pnpm mobile:usb',
      ].join('\n'),
    );
  }

  console.log('');
  console.log('3) Khởi động Expo Go...');
  let expoChild = null;
  let metroOwned = false;
  if (!reuseMetro) {
    const expoArgs = [
      '--filter',
      '@agrimarket/mobile',
      'exec',
      'expo',
      'start',
      '--go',
      '--localhost',
      '--port',
      '8081',
    ];
    if (process.env.EXPO_CLEAR === '1') {
      expoArgs.push('--clear');
      console.log('✓ Metro cache sẽ được xoá');
    }

    expoChild = spawnPnpm(expoArgs, 'expo-go', {
      EXPO_PUBLIC_API_BASE_URL: API_BASE_URL,
      EXPO_PACKAGER_PROXY_URL: 'http://127.0.0.1:8081',
      NODE_OPTIONS: ipv4FirstNodeOptions(),
    });
    metroOwned = true;
    const metroIsReady = await waitFor(metroReadyIPv4, 60_000);
    if (!metroIsReady) {
      stopOwnedChildren();
      throw new Error(
        [
          'Metro không sẵn sàng sau 60 giây tại 127.0.0.1:8081.',
          'Kiểm tra log Expo phía trên rồi chạy lại `pnpm mobile:usb`.',
        ].join('\n'),
      );
    }
  }
  console.log('✓ Metro ready');

  console.log('   Làm sạch phiên Expo Go cũ...');
  forceStopExpoGo(device.serial);
  await sleep(700);
  let expoOpened = false;
  try {
    exec(adbBin, [
      '-s',
      device.serial,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      'exp://127.0.0.1:8081',
    ]);
    expoOpened = true;
    console.log('✓ Đã gửi link dự án sang Expo Go');
  } catch {
    console.warn('⚠ Không tự mở được Expo Go. Mở Expo Go trên điện thoại; Metro USB đang sẵn sàng.');
  }

  const reverseList = getReverseMappings(device.serial);
  const reverse3000Ok = reverseList.includes('tcp:3000 tcp:3000');
  const reverse8081Ok = reverseList.includes('tcp:8081 tcp:8081');

  console.log('');
  console.log('================================================');
  console.log('AGRIMARKET — EXPO GO USB READY');
  console.log('================================================');
  console.log('');
  console.log('Device:');
  console.log(`${device.serial} / ${device.line}`);
  console.log('');
  console.log('Backend:');
  console.log('http://127.0.0.1:3000 ✅');
  console.log('');
  console.log('MySQL native:');
  console.log(`${MYSQL_HOST}:${MYSQL_PORT} ✅`);
  console.log('');
  console.log('Redis/Memurai:');
  console.log(`${REDIS_HOST}:${REDIS_PORT} ✅`);
  console.log('');
  console.log('Metro:');
  console.log('http://127.0.0.1:8081 ✅');
  console.log('');
  console.log('ADB reverse:');
  console.log(`phone:3000 -> host:3000 ${reverse3000Ok ? '✅' : '❌'}`);
  console.log(`phone:8081 -> host:8081 ${reverse8081Ok ? '✅' : '❌'}`);
  console.log('');
  console.log('Expo Go:');
  console.log(`${EXPO_GO_PACKAGE} ✅`);
  console.log('');
  console.log('Project:');
  console.log(`exp://127.0.0.1:8081 ${expoOpened ? '✅' : '(mở tay trong Expo Go)'}`);
  console.log('');
  console.log('Không cần:');
  console.log('Docker');
  console.log('Android Studio');
  console.log('emulator');
  console.log('LAN IP');
  console.log('Wi-Fi');
  console.log('');
  console.log('================================================');
  console.log('Nhấn Ctrl+C để dừng process do lệnh này khởi động.');
  console.log('(Backend/Metro đã chạy từ trước được giữ nguyên.)');
  console.log('');

  // Lifecycle deterministic: chỉ required long-running process giữ script sống.
  //  - Metro do script start → primary là expoChild.
  //  - Metro reuse + API do script start → primary là apiChild.
  //  - Cả hai reuse → không sở hữu process nào, park tới Ctrl+C.
  // API child exit KHÔNG được giết Metro đang tốt: nếu apiChild (auxiliary khi
  // metroOwned) exit, chỉ log lỗi, Metro tiếp tục phục vụ.
  if (metroOwned && apiOwned && apiChild) {
    apiChild.once('exit', (code) => {
      if (code && code !== 0) {
        console.error(
          `[api] process Nest tự thoát (mã ${code}) — Metro USB vẫn chạy. ` +
            'Kiểm tra log API rồi restart API riêng nếu cần.',
        );
      }
    });
  }

  if (metroOwned && expoChild) {
    await new Promise((resolve) => {
      expoChild.once('exit', resolve);
    });
  } else if (apiOwned && apiChild) {
    await new Promise((resolve) => {
      apiChild.once('exit', resolve);
    });
  } else {
    // Không sở hữu process nào (reuse cả API + Metro): giữ script sống tới
    // Ctrl+C. Cần interval ref'd để event loop không trống — nếu không Node
    // thoát ngay với mã 13 (unsettled top-level await).
    await new Promise(() => {
      setInterval(() => {}, 60_000);
    });
  }
  stopOwnedChildren();
} catch (error) {
  stopOwnedChildren();
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
