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

const failed = checks.filter((item) => !item.ok);

console.log('\n==========================');
if (failed.length === 0) {
  console.log('✅ RUNTIME SMOKE PASS');
  console.log('✅ API + OpenAPI + Customer + Admin + Metro đều sẵn sàng.');
  process.exit(0);
}

console.error(`❌ RUNTIME SMOKE FAIL: ${failed.map((item) => item.name).join(', ')}`);
process.exit(1);
