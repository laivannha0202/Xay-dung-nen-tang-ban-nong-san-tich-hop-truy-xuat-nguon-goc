const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mobileDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileDir, '..', '..');

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function json(rel) {
  return JSON.parse(read(rel));
}

test('canonical entry `pnpm mobile:usb` delegates to expo-go-usb.mjs', () => {
  const rootPackage = json('package.json');
  const delegate = read('scripts/dev-mobile-usb.mjs');

  assert.equal(rootPackage.scripts['mobile:usb'], 'node scripts/dev-mobile-usb.mjs');
  assert.match(delegate, /apps.*mobile.*tools.*expo-go-usb\.mjs/);
  // Alias cũ vẫn tồn tại để tương thích, nhưng canonical là mobile:usb.
  assert.equal(
    rootPackage.scripts['dev:mobile:usb'],
    'pnpm --filter @agrimarket/mobile start:usb',
  );
  assert.equal(json('apps/mobile/package.json').scripts['start:usb'], 'node tools/expo-go-usb.mjs');
});

test('USB flow has NO Docker dependency', () => {
  const tool = read('apps/mobile/tools/expo-go-usb.mjs');

  assert(!tool.includes('docker:up'), 'must not call pnpm docker:up');
  assert(!tool.includes('docker compose'), 'must not call docker compose');
  assert(!tool.includes('docker:down'), 'must not call pnpm docker:down');
  assert(!/spawn\w*\(\s*['"]docker['"]/.test(tool), 'must not spawn docker binary');
  assert(!/exec\(\s*['"]docker['"]/.test(tool), 'must not exec docker binary');
});

test('USB flow targets physical phone + Expo Go + reverse + Metro Go mode', () => {
  const tool = read('apps/mobile/tools/expo-go-usb.mjs');
  // Bộ lọc emulator/physical sống ở helper dùng chung (không duplicate).
  const helpers = read('apps/mobile/tools/adb-devices.mjs');

  assert.match(tool, /adb/);
  assert.match(tool, /adb-devices\.mjs/);
  assert.match(tool, /selectPhysicalDevice/);
  assert.match(helpers, /emulator-/);
  assert.match(helpers, /waydroid/i);
  assert.match(tool, /ANDROID_SERIAL/);
  assert.match(tool, /host\.exp\.exponent/);
  assert.match(tool, /reverse/);
  assert.match(tool, /3000/);
  assert.match(tool, /8081/);
  assert(!tool.includes("'--remove-all'"), 'must not invoke reverse --remove-all');
  assert.match(tool, /--go/);
  assert.match(tool, /--localhost/);
  assert.match(tool, /EXPO_PUBLIC_API_BASE_URL/);
  assert.match(tool, /http:\/\/127\.0\.0\.1:3000/);
  assert.match(tool, /api\/v1\/suc-khoe/);
  assert.match(tool, /@agrimarket\/api/);
  assert.match(tool, /loadEnvFile/);
  assert.match(tool, /MySQL 127\.0\.0\.1:3306 chưa chạy/);
  assert.match(tool, /Redis\/Memurai 127\.0\.0\.1:6379 chưa chạy/);
  // Không dùng emulator/dev-client/native package làm target trong USB mode.
  assert(!/emulator-5554/.test(tool), 'must not target emulator-5554');
  assert(
    !/com\.agrimarket\.mobile/.test(tool),
    'USB Expo Go flow must not launch native package',
  );
  assert(!/expo run:android/.test(tool), 'USB Expo Go flow must not prebuild/run:android');
  assert(!/10\.0\.2\.2/.test(tool), 'USB mode must not use emulator loopback');
});

test('USB flow supports Windows pnpm invocation', () => {
  const tool = read('apps/mobile/tools/expo-go-usb.mjs');

  assert.match(tool, /pnpm\.cmd/);
  assert.match(tool, /shell: isWindows/);
  // adb chạy qua execFileSync (shell:false mặc định), không bật shell bừa bãi.
  assert.match(tool, /execFileSync/);
  // Metro trên Windows có thể listen ::1-only → phải check dual-stack.
  assert.match(tool, /::1/);
  assert.match(tool, /metroPortOccupied/);
  // Metro tự start phải bind IPv4 (adb reverse cần 127.0.0.1).
  assert.match(tool, /dns-result-order=ipv4first/);
  assert.match(tool, /metroReadyIPv4/);
  // Reuse mù Metro ::1-only bị cấm (Expo Go sẽ "Something went wrong").
  assert.match(tool, /CHỈ listen IPv6/);
  // Park khi reuse toàn bộ phải giữ event loop (tránh Node exit 13).
  assert.match(tool, /setInterval/);
});

test('mobile runtime + env example stay on USB loopback', () => {
  const runtime = read('apps/mobile/src/lib/api-runtime.ts');
  const envExample = read('apps/mobile/.env.example');

  assert.match(runtime, /http:\/\/127\.0\.0\.1:3000/);
  assert.match(runtime, /adb reverse tcp:3000 tcp:3000/);
  assert.match(envExample, /EXPO_PUBLIC_API_BASE_URL=http:\/\/127\.0\.0\.1:3000/);
  assert(!/MYSQL_|DATABASE_URL|REDIS_/.test(envExample), 'mobile env must not hold DB credentials');
});

test('docs describe Windows native USB flow without Docker', () => {
  const docs = read('docs/MOBILE-APP.md');

  assert.match(docs, /pnpm mobile:usb/);
  assert.match(docs, /Memurai/);
  assert(!/khởi động Docker \+ Nest API/.test(docs), 'docs must not say USB starts Docker');
});

test('Mobile keeps generated API client as the contract boundary', () => {
  const mobilePackage = json('apps/mobile/package.json');
  const provider = read('apps/mobile/src/providers/app-providers.tsx');
  const apiRuntime = read('apps/mobile/src/lib/api-runtime.ts');
  const apiClientRuntime = read('packages/api-client/src/runtime.ts');
  const orval = read('packages/api-client/orval.config.ts');

  assert.equal(mobilePackage.dependencies['@agrimarket/api-client'], 'workspace:*');
  assert.match(provider, /cauHinhApiMobile/);
  assert.match(apiRuntime, /cauHinhApiClient/);
  assert.match(apiClientRuntime, /layApiBaseUrl/);
  assert.match(orval, /runtime:\s*'layApiBaseUrl\(\)'/);
});

// --- Unit test helper parse adb output (không cần điện thoại thật) ---

async function loadAdbHelpers() {
  return import('../tools/adb-devices.mjs');
}

test('adb parse: emulator-only => no physical device', async () => {
  const { classifyAdbDevices, selectPhysicalDevice } = await loadAdbHelpers();
  const output = [
    'List of devices attached',
    'emulator-5554          device product:sdk_gphone64_x86_64 model:sdk_gphone64_x86_64 device:emu64xa transport_id:1',
    '',
  ].join('\n');
  const parsed = classifyAdbDevices(output);
  assert.equal(parsed.physical.length, 0);
  assert.equal(parsed.emulators.length, 1);
  assert.throws(() => selectPhysicalDevice(parsed), /chỉ thấy emulator/);
});

test('adb parse: one physical phone => selected', async () => {
  const { classifyAdbDevices, selectPhysicalDevice } = await loadAdbHelpers();
  const output = [
    'List of devices attached',
    'R58Mxxxx             device product:a12snsxx model:SM_A125F device:a12s transport_id:2',
    '',
  ].join('\n');
  const parsed = classifyAdbDevices(output);
  assert.equal(parsed.physical.length, 1);
  const device = selectPhysicalDevice(parsed);
  assert.equal(device.serial, 'R58Mxxxx');
});

test('adb parse: unauthorized => allow-prompt error', async () => {
  const { classifyAdbDevices, selectPhysicalDevice } = await loadAdbHelpers();
  const output = ['List of devices attached', 'R58Mxxxx             unauthorized transport_id:2', ''].join(
    '\n',
  );
  const parsed = classifyAdbDevices(output);
  assert.equal(parsed.unauthorized.length, 1);
  assert.throws(() => selectPhysicalDevice(parsed), /Allow USB debugging/);
});

test('adb parse: two physical phones => require ANDROID_SERIAL', async () => {
  const { classifyAdbDevices, selectPhysicalDevice } = await loadAdbHelpers();
  const output = [
    'List of devices attached',
    'R58Maaaa             device product:a12snsxx model:SM_A125F device:a12s transport_id:2',
    'R58Mbbbb             device product:a12snsxx model:SM_A125F device:a12s transport_id:3',
    '',
  ].join('\n');
  const parsed = classifyAdbDevices(output);
  assert.equal(parsed.physical.length, 2);
  assert.throws(() => selectPhysicalDevice(parsed), /ANDROID_SERIAL/);
  const picked = selectPhysicalDevice({ ...parsed, requestedSerial: 'R58Mbbbb' });
  assert.equal(picked.serial, 'R58Mbbbb');
});

test('adb parse: offline => reconnect guidance', async () => {
  const { classifyAdbDevices, selectPhysicalDevice } = await loadAdbHelpers();
  const output = ['List of devices attached', 'R58Mxxxx             offline transport_id:2', ''].join('\n');
  const parsed = classifyAdbDevices(output);
  assert.equal(parsed.offline.length, 1);
  assert.throws(() => selectPhysicalDevice(parsed), /offline/);
});
