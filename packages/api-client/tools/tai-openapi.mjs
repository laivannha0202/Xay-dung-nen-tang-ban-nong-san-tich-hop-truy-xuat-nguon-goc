import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const url = process.env.API_OPENAPI_URL ?? 'http://127.0.0.1:3000/openapi-json';
const target = resolve('openapi/agrimarket.json');

const response = await fetch(url);

if (!response.ok) {
  throw new Error(`Không tải được OpenAPI: HTTP ${response.status} từ ${url}`);
}

const document = await response.json();

const requiredOperations = [
  {
    path: '/api/v1/suc-khoe',
    method: 'get',
    operationId: 'layTrangThaiSucKhoe',
  },
  {
    path: '/api/v1/khach-hang/goi-y',
    method: 'get',
    operationId: 'layGoiYSanPhamCuaToi',
  },
  {
    path: '/api/v1/khach-hang/diem-thuong',
    method: 'get',
    operationId: 'layTongQuanDiemThuongCuaToi',
  },
  {
    path: '/api/v1/khach-hang/diem-thuong/giao-dich',
    method: 'get',
    operationId: 'layGiaoDichDiemThuongCuaToi',
  },
];

for (const required of requiredOperations) {
  const operation = document?.paths?.[required.path]?.[required.method];

  if (!operation) {
    throw new Error(`OpenAPI không có ${required.method.toUpperCase()} ${required.path}.`);
  }

  if (operation.operationId !== required.operationId) {
    throw new Error(
      `operationId không ổn định tại ${required.method.toUpperCase()} ${required.path}: ` +
        `${operation.operationId ?? 'undefined'} (mong đợi ${required.operationId})`,
    );
  }
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Đã lưu OpenAPI snapshot: ${target}`);
for (const required of requiredOperations) {
  console.log(`✓ ${required.method.toUpperCase()} ${required.path} → ${required.operationId}`);
}
