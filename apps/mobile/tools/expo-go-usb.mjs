import { execFileSync, spawn } from 'node:child_process';

const API_HEALTH = 'http://127.0.0.1:3000/api/v1/suc-khoe';
const API_BASE_URL = 'http://127.0.0.1:3000';
const METRO_URL = 'http://127.0.0.1:8081';
const EXPO_GO_PACKAGE = 'host.exp.exponent';
const EXPECTED_EXPO_SDK_MAJOR = 57;
const USB_REVERSE_PORTS = [3000, 8081, 9000];

const children = new Set();

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
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    shell: false,
    detached: process.platform !== 'win32',
    env: { ...process.env, ...extraEnv },
  });
  children.add(child);
  child.once('exit', (code) => {
    children.delete(child);
    if (code && code !== 0) console.error(`[${label}] thoát với mã ${code}`);
  });
  return child;
}

function stopChildren() {
  for (const child of children) {
    try {
      if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGTERM');
      else child.kill('SIGTERM');
    } catch {
      // Process may already be gone.
    }
  }
}

process.on('SIGINT', () => {
  stopChildren();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopChildren();
  process.exit(0);
});

function parseAdbDevices() {
  let output;
  try {
    output = exec('adb', ['devices', '-l']);
  } catch {
    throw new Error('Không tìm thấy adb. Cài Android platform-tools của hệ thống rồi chạy lại.');
  }

  const lines = output.split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean);
  const unauthorized = lines.filter((line) => /\bunauthorized\b/.test(line));
  if (unauthorized.length > 0) {
    throw new Error('Điện thoại đang unauthorized. Mở khóa điện thoại và bấm "Allow USB debugging".');
  }

  const connected = lines
    .filter((line) => /\bdevice\b/.test(line))
    .map((line) => ({ serial: line.split(/\s+/)[0], line }));

  const requested = process.env.ANDROID_SERIAL?.trim();
  if (requested) {
    const match = connected.find((item) => item.serial === requested);
    if (!match) throw new Error(`ANDROID_SERIAL=${requested} không ở trạng thái device.`);
    return match;
  }

  const physical = connected.filter(
    ({ serial, line }) =>
      !serial.startsWith('emulator-') && !/waydroid/i.test(line) && !/\bmodel:sdk_/i.test(line),
  );
  if (physical.length === 0) {
    throw new Error('ADB chưa thấy điện thoại thật. Cắm USB, bật USB debugging rồi chạy `adb devices -l`.');
  }
  if (physical.length > 1) {
    const list = physical.map((item) => item.serial).join(', ');
    throw new Error(`Có nhiều điện thoại ADB (${list}). Chạy lại với ANDROID_SERIAL=<serial> pnpm dev:mobile:usb`);
  }
  return physical[0];
}

function ensureExpoGo(serial) {
  try {
    const output = exec('adb', ['-s', serial, 'shell', 'pm', 'path', EXPO_GO_PACKAGE]);
    if (!output.includes('package:')) throw new Error('missing');
  } catch {
    throw new Error('Chưa thấy Expo Go trên điện thoại. Cài Expo Go rồi chạy lại.');
  }
}

function getExpoGoVersion(serial) {
  try {
    const output = exec('adb', ['-s', serial, 'shell', 'dumpsys', 'package', EXPO_GO_PACKAGE]);
    const match = output.match(/versionName=([^\s]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function ensureCompatibleExpoGo(serial) {
  const version = getExpoGoVersion(serial);
  if (!version) {
    throw new Error('Không đọc được version Expo Go trên điện thoại. Hãy cài lại Expo Go tương thích SDK 57.');
  }
  const major = Number.parseInt(version.split('.')[0], 10);
  if (major !== EXPECTED_EXPO_SDK_MAJOR) {
    throw new Error([
      `Expo Go ${version} không tương thích với Expo SDK ${EXPECTED_EXPO_SDK_MAJOR}.`,
      '',
      'Cài Expo Go tương thích rồi chạy lại:',
      `pnpm dlx expo-go download android ${EXPECTED_EXPO_SDK_MAJOR}`,
    ].join('\n'));
  }
  return version;
}

function removeReverse(serial, port) {
  try {
    exec('adb', ['-s', serial, 'reverse', '--remove', `tcp:${port}`]);
  } catch {
    // Mapping chưa tồn tại là bình thường.
  }
}

function addReverse(serial, port) {
  exec('adb', ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
}

function setupUsbReverse(serial) {
  for (const port of USB_REVERSE_PORTS) removeReverse(serial, port);
  try {
    for (const port of USB_REVERSE_PORTS) addReverse(serial, port);
  } catch (error) {
    const message = [error?.message, error?.stderr, error?.stdout].filter(Boolean).join('\n');
    if (!/Address already in use/i.test(message)) throw error;
    console.warn('⚠ ADB còn listener cũ; dọn reverse của đúng điện thoại rồi thiết lập lại.');
    exec('adb', ['-s', serial, 'reverse', '--remove-all']);
    for (const port of USB_REVERSE_PORTS) addReverse(serial, port);
  }
}

function getReverseMappings(serial) {
  return exec('adb', ['-s', serial, 'reverse', '--list']);
}

function ensureReverse(serial, port) {
  const mappings = getReverseMappings(serial);
  const expected = `tcp:${port} tcp:${port}`;
  if (!mappings.includes(expected)) throw new Error(`ADB reverse cho port ${port} chưa được thiết lập đúng.`);
}

function forceStopExpoGo(serial) {
  try {
    exec('adb', ['-s', serial, 'shell', 'am', 'force-stop', EXPO_GO_PACKAGE]);
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

async function metroReady() {
  try {
    const response = await fetch(`${METRO_URL}/status`, { signal: AbortSignal.timeout(1500) });
    const text = await response.text();
    return response.ok && text.includes('packager-status:running');
  } catch {
    return false;
  }
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

console.log('');
console.log('AgriMarket Mobile — Expo Go + USB');
console.log('=================================');

const device = parseAdbDevices();
console.log(`✓ Điện thoại: ${device.serial}`);
console.log(`  ${device.line}`);
ensureExpoGo(device.serial);
const expoGoVersion = ensureCompatibleExpoGo(device.serial);
console.log(`✓ Expo Go ${expoGoVersion} tương thích SDK ${EXPECTED_EXPO_SDK_MAJOR}`);
console.log('✓ Giữ nguyên ứng dụng Expo Go chính thức trên điện thoại; script chỉ nối USB/Metro/API/assets.');

console.log('');
console.log('1) Kiểm tra Backend...');
let apiChild = null;
if (await reachable(API_HEALTH)) {
  console.log('✓ API đã chạy tại 127.0.0.1:3000');
} else {
  console.log('   API chưa chạy → khởi động Docker local...');
  await runOnce(['--dir', '../..', 'docker:up'], 'docker');
  console.log('   Khởi động Nest API...');
  apiChild = spawnPnpm(['--filter', '@agrimarket/api', 'start:dev'], 'api');
  const healthy = await waitFor(() => reachable(API_HEALTH), 90_000);
  if (!healthy) {
    stopChildren();
    throw new Error(`API không healthy sau 90 giây: ${API_HEALTH}`);
  }
  console.log('✓ API healthy');
}

console.log('');
console.log('2) Nối USB...');
setupUsbReverse(device.serial);
for (const port of USB_REVERSE_PORTS) ensureReverse(device.serial, port);
console.log('✓ phone:3000 → host:3000 (Nest API + seed product assets)');
console.log('✓ phone:8081 → host:8081 (Expo Metro)');
console.log('✓ phone:9000 → host:9000 (MinIO signed product assets)');

if (await reachable(`${METRO_URL}/status`)) {
  throw new Error([
    'Port 8081 đã có process đang chạy trước khi AgriMarket khởi động Metro.',
    'Có thể đây là Metro cũ/stale session.',
    '',
    'Kiểm tra:',
    '  ss -tlnp | grep 8081',
    '',
    'Dừng đúng process Metro cũ rồi chạy lại:',
    '  pnpm dev:mobile:usb',
  ].join('\n'));
}

console.log('');
console.log('3) Khởi động Expo Go...');
const expoArgs = [
  '--filter', '@agrimarket/mobile', 'exec', 'expo', 'start', '--go', '--localhost', '--port', '8081',
];
if (process.env.EXPO_CLEAR === '1') {
  expoArgs.push('--clear');
  console.log('✓ Metro cache sẽ được xoá');
}

const expoChild = spawnPnpm(expoArgs, 'expo-go', {
  EXPO_PUBLIC_API_BASE_URL: API_BASE_URL,
  EXPO_PACKAGER_PROXY_URL: 'http://127.0.0.1:8081',
});
const metroIsReady = await waitFor(metroReady, 60_000);
if (!metroIsReady) {
  stopChildren();
  throw new Error([
    'Metro không sẵn sàng sau 60 giây tại 127.0.0.1:8081.',
    'Nếu log có ENOSPC thì đó là giới hạn file watcher của Linux, không phải lỗi Expo Go trên điện thoại.',
    'AgriMarket không tự thay đổi sysctl; giữ cấu hình hệ điều hành do bạn quản lý.',
  ].join('\n'));
}
console.log('✓ Metro ready');

console.log('   Làm sạch phiên Expo Go cũ...');
forceStopExpoGo(device.serial);
await sleep(700);
try {
  exec('adb', ['-s', device.serial, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'exp://127.0.0.1:8081']);
  console.log('✓ Đã gửi link dự án sang Expo Go');
} catch {
  console.warn('⚠ Không tự mở được Expo Go. Mở Expo Go trên điện thoại và chọn project đang chạy.');
}

console.log('');
console.log('=================================');
console.log('AgriMarket đang chạy theo luồng:');
console.log('Phone Expo Go');
console.log('  ├─ 127.0.0.1:8081 → USB → Metro');
console.log('  ├─ 127.0.0.1:3000 → USB → Nest API');
console.log('  └─ 127.0.0.1:9000 → USB → MinIO assets');
console.log('');
console.log('Không cần Android Studio / Gradle / NDK / Waydroid.');
console.log('Không phụ thuộc IP Wi-Fi cho Metro, API hoặc ảnh MinIO local.');
console.log('Nhấn Ctrl+C để dừng Expo/API do lệnh này khởi động.');
console.log('Docker vẫn được giữ chạy để lần sau khởi động nhanh hơn.');
console.log('');

await new Promise((resolve) => {
  expoChild.once('exit', resolve);
  apiChild?.once('exit', resolve);
});
stopChildren();
