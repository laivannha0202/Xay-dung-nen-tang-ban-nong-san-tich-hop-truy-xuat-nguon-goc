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

test('Expo Go USB development path is one-command and API-client backed', () => {
  const rootPackage = json('package.json');
  const mobilePackage = json('apps/mobile/package.json');
  const tool = read('apps/mobile/tools/expo-go-usb.mjs');
  const runtime = read('apps/mobile/src/lib/api-runtime.ts');
  const envExample = read('apps/mobile/.env.example');
  const docs = read('docs/MOBILE-APP.md');

  assert.equal(
    rootPackage.scripts['dev:mobile:usb'],
    'pnpm --filter @agrimarket/mobile start:usb',
  );

  assert.equal(
    mobilePackage.scripts['start:usb'],
    'node tools/expo-go-usb.mjs',
  );

  assert.equal(
    mobilePackage.scripts['start:go'],
    'expo start --go',
  );

  assert.match(
    mobilePackage.scripts['prestart:usb'],
    /@agrimarket\/api-client ensure/,
  );

  assert.match(tool, /adb/);
  assert.match(tool, /reverse/);
  assert.match(tool, /3000/);
  assert.match(tool, /8081/);
  assert.match(tool, /--go/);
  assert.match(tool, /--localhost/);
  assert.match(tool, /host\.exp\.exponent/);
  assert.match(tool, /api\/v1\/suc-khoe/);
  assert.match(tool, /@agrimarket\/api/);

  assert.match(runtime, /http:\/\/127\.0\.0\.1:3000/);
  assert.match(runtime, /adb reverse tcp:3000 tcp:3000/);

  assert.match(
    envExample,
    /EXPO_PUBLIC_API_BASE_URL=http:\/\/127\.0\.0\.1:3000/,
  );

  assert.match(docs, /pnpm dev:mobile:usb/);
});

test('Mobile keeps generated API client as the contract boundary', () => {
  const mobilePackage = json('apps/mobile/package.json');
  const provider = read('apps/mobile/src/providers/app-providers.tsx');
  const apiRuntime = read('apps/mobile/src/lib/api-runtime.ts');
  const apiClientRuntime = read('packages/api-client/src/runtime.ts');
  const orval = read('packages/api-client/orval.config.ts');

  assert.equal(
    mobilePackage.dependencies['@agrimarket/api-client'],
    'workspace:*',
  );
  assert.match(provider, /cauHinhApiMobile/);
  assert.match(apiRuntime, /cauHinhApiClient/);
  assert.match(apiClientRuntime, /layApiBaseUrl/);
  assert.match(orval, /runtime:\s*'layApiBaseUrl\(\)'/);
});
