import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const url = process.env.API_OPENAPI_URL ?? 'http://127.0.0.1:3000/openapi-json';
const target = resolve('openapi/agrimarket.json');

const response = await fetch(url);

if (!response.ok) {
  throw new Error(`Không tải được OpenAPI: HTTP ${response.status} từ ${url}`);
}

const document = await response.json();
const health = document?.paths?.['/api/v1/suc-khoe']?.get;

if (!health) {
  throw new Error('OpenAPI không có GET /api/v1/suc-khoe.');
}

if (health.operationId !== 'layTrangThaiSucKhoe') {
  throw new Error(`operationId health không ổn định: ${health.operationId ?? 'undefined'}`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Đã lưu OpenAPI snapshot: ${target}`);
console.log('operationId: layTrangThaiSucKhoe');
