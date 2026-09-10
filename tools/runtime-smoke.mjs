import { spawnSync } from 'node:child_process';
import process from 'node:process';

const checks = [];

async function checkHttp(name, url, validate) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (validate) {
      validate(text, response);
    }

    console.log(`✓ ${name}: ${url}`);
    checks.push({ name, ok: true });
  } catch (error) {
    console.error(`❌ ${name}: ${url}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    checks.push({ name, ok: false });
  }
}

function checkAdb() {
  const result = spawnSync('adb', ['devices', '-l'], {
    encoding: 'utf8',
    shell: false,
  });

  if (result.error || result.status !== 0) {
    console.error('❌ ADB: không chạy được `adb devices -l`.');
    checks.push({ name: 'ADB', ok: false });
    return;
  }

  const devices = result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\sdevice\b/.test(line));

  if (devices.length === 0) {
    console.error('❌ ADB: chưa thấy điện thoại Android ở trạng thái device.');
    checks.push({ name: 'ADB', ok: false });
    return;
  }

  console.log(`✓ ADB: ${devices.length} thiết bị sẵn sàng`);
  for (const device of devices) console.log(`  ${device}`);
  checks.push({ name: 'ADB', ok: true });
}

function checkReverse() {
  const result = spawnSync('adb', ['reverse', '--list'], {
    encoding: 'utf8',
    shell: false,
  });

  if (result.error || result.status !== 0) {
    console.error('❌ ADB reverse: không đọc được mapping.');
    checks.push({ name: 'ADB reverse', ok: false });
    return;
  }

  const text = result.stdout;
  const api = text.includes('tcp:3000 tcp:3000');
  const metro = text.includes('tcp:8081 tcp:8081');

  if (!api || !metro) {
    console.error('❌ ADB reverse: cần cả tcp:3000 và tcp:8081.');
    console.error(text.trim() || '   (không có mapping)');
    checks.push({ name: 'ADB reverse', ok: false });
    return;
  }

  console.log('✓ ADB reverse: phone:3000 → host:3000 và phone:8081 → host:8081');
  checks.push({ name: 'ADB reverse', ok: true });
}

console.log('AgriMarket — RUNTIME SMOKE');
console.log('==========================');

await checkHttp('API health', 'http://127.0.0.1:3000/api/v1/suc-khoe', (text) => {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Health response không hợp lệ.');
});

await checkHttp('OpenAPI', 'http://127.0.0.1:3000/openapi-json', (text) => {
  const document = JSON.parse(text);
  const recommendation = document?.paths?.['/api/v1/khach-hang/goi-y']?.get;
  if (recommendation?.operationId !== 'layGoiYSanPhamCuaToi') {
    throw new Error('OpenAPI chưa có recommendation operationId mới nhất.');
  }
});

await checkHttp('Customer Web', 'http://127.0.0.1:3001/');
await checkHttp('Admin Web', 'http://127.0.0.1:3002/');
await checkHttp('Metro', 'http://127.0.0.1:8081/status', (text) => {
  if (!text.toLowerCase().includes('packager-status:running')) {
    throw new Error(`Metro status không hợp lệ: ${text.slice(0, 120)}`);
  }
});

checkAdb();
checkReverse();

const failed = checks.filter((item) => !item.ok);

console.log('\n==========================');
if (failed.length === 0) {
  console.log('✅ RUNTIME SMOKE PASS');
  console.log('✅ API + OpenAPI + Customer + Admin + Metro + USB reverse đều sẵn sàng.');
  process.exit(0);
}

console.error(`❌ RUNTIME SMOKE FAIL: ${failed.map((item) => item.name).join(', ')}`);
process.exit(1);
