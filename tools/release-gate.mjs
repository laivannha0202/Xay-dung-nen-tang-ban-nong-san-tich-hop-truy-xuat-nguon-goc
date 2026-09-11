import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args, env = process.env) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function requireTestDatabase(name, value, expectedDatabase) {
  if (!value) {
    console.error(`❌ Thiếu ${name}. Release gate không được dùng database development.`);
    process.exit(2);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    console.error(`❌ ${name} không phải database URL hợp lệ.`);
    process.exit(2);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (database !== expectedDatabase) {
    console.error(
      `❌ ${name} phải trỏ chính xác tới database '${expectedDatabase}', hiện là '${database || '(rỗng)'}'.`,
    );
    process.exit(2);
  }
}

function readOpenApiDocument() {
  try {
    return JSON.parse(readFileSync('packages/api-client/openapi/agrimarket.json', 'utf8'));
  } catch (error) {
    console.error('❌ Không đọc được OpenAPI snapshot. Hãy chạy `pnpm api-client:sync`.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

const openApiDocument = readOpenApiDocument();

function requireOpenApiOperation(path, method, operationId) {
  const operation = openApiDocument?.paths?.[path]?.[method];
  if (!operation || operation.operationId !== operationId) {
    console.error(
      `❌ OpenAPI snapshot chưa đồng bộ: ${method.toUpperCase()} ${path} → ${operationId}.`,
    );
    console.error(
      '   Chạy `pnpm api-client:sync` (script tự khởi động API tạm thời), rồi chạy lại `pnpm release:gate`.',
    );
    console.error('   Hoặc dùng một lệnh `pnpm release:final` để sync OpenAPI trước rồi chạy toàn bộ gate.');
    process.exit(2);
  }
}

function requireOpenApiQueryParameter(path, method, parameterName) {
  const operation = openApiDocument?.paths?.[path]?.[method];
  const found = operation?.parameters?.some(
    (parameter) => parameter?.in === 'query' && parameter?.name === parameterName,
  );

  if (!found) {
    console.error(
      `❌ OpenAPI snapshot thiếu query '${parameterName}' cho ${method.toUpperCase()} ${path}.`,
    );
    console.error('   Hãy chạy `pnpm api-client:sync` từ Backend hiện tại.');
    process.exit(2);
  }
}

function requireOpenApiSchemaProperty(schemaName, propertyName) {
  const schema = openApiDocument?.components?.schemas?.[schemaName];
  if (!schema?.properties || !(propertyName in schema.properties)) {
    console.error(`❌ OpenAPI schema ${schemaName} thiếu field '${propertyName}'.`);
    console.error('   Hãy chạy `pnpm api-client:sync` từ Backend hiện tại.');
    process.exit(2);
  }
}

function requireCommittedOpenApiSnapshot() {
  const result = spawnSync(
    'git',
    ['diff', '--exit-code', '--', 'packages/api-client/openapi/agrimarket.json'],
    {
      stdio: 'inherit',
      shell: false,
      env: process.env,
    },
  );

  if (result.status !== 0) {
    console.error('\n❌ OpenAPI snapshot đã được regenerate nhưng chưa commit vào branch.');
    console.error(
      '   Commit packages/api-client/openapi/agrimarket.json rồi chạy lại `pnpm release:final`.',
    );
    process.exit(2);
  }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testShadowDatabaseUrl = process.env.TEST_SHADOW_DATABASE_URL;

requireTestDatabase('TEST_DATABASE_URL', testDatabaseUrl, 'agrimarket_test');
requireTestDatabase('TEST_SHADOW_DATABASE_URL', testShadowDatabaseUrl, 'agrimarket_test_shadow');

requireOpenApiOperation('/api/v1/suc-khoe', 'get', 'layTrangThaiSucKhoe');
requireOpenApiOperation('/api/v1/khach-hang/goi-y', 'get', 'layGoiYSanPhamCuaToi');
requireOpenApiOperation(
  '/api/v1/khach-hang/diem-thuong',
  'get',
  'layTongQuanDiemThuongCuaToi',
);
requireOpenApiOperation(
  '/api/v1/khach-hang/diem-thuong/giao-dich',
  'get',
  'layGiaoDichDiemThuongCuaToi',
);

// Commerce V8B: checkout preview phải phản ánh đúng address + promotion + loyalty.
requireOpenApiOperation('/api/v1/gio-hang/checkout-preview', 'get', 'layCheckoutPreview');
for (const parameterName of ['diaChiGiaoHangId', 'maKhuyenMai', 'diemSuDung']) {
  requireOpenApiQueryParameter('/api/v1/gio-hang/checkout-preview', 'get', parameterName);
}

// Create Order phải dùng cùng lựa chọn đã preview và luôn nhận địa chỉ giao hàng.
for (const propertyName of ['diaChiGiaoHangId', 'maKhuyenMai', 'diemSuDung']) {
  requireOpenApiSchemaProperty('TaoDonHangDto', propertyName);
}

// Payment Web/Mobile parity: Backend chọn callback theo kênh whitelist, client không truyền URL tùy ý.
requireOpenApiSchemaProperty('TaoThanhToanDto', 'kenhTraVe');
requireOpenApiOperation(
  '/api/v1/thanh-toan/callback/{gateway}/web',
  'get',
  'xuLyCallbackThanhToanWeb',
);

// Admin Promotion phải là contract chính thức, không chỉ runtime adapter trên Admin Web.
requireOpenApiOperation(
  '/api/v1/quan-tri/khuyen-mai',
  'get',
  'layDanhSachKhuyenMaiQuanTri',
);
requireOpenApiOperation('/api/v1/quan-tri/khuyen-mai', 'post', 'taoKhuyenMaiQuanTri');
requireOpenApiOperation(
  '/api/v1/quan-tri/khuyen-mai/{id}',
  'get',
  'layChiTietKhuyenMaiQuanTri',
);
requireOpenApiOperation(
  '/api/v1/quan-tri/khuyen-mai/{id}',
  'put',
  'capNhatKhuyenMaiQuanTri',
);
requireOpenApiOperation(
  '/api/v1/quan-tri/khuyen-mai/{id}/trang-thai',
  'patch',
  'doiTrangThaiKhuyenMaiQuanTri',
);

// release:final chạy api-client:sync trước release:gate. Nếu sync sinh snapshot mới thì
// snapshot đó phải được commit trước khi được phép coi gate là PASS.
requireCommittedOpenApiSnapshot();

const apiTestEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  TEST_DATABASE_URL: testDatabaseUrl,
  TEST_SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  BULLMQ_PREFIX: process.env.BULLMQ_PREFIX || `agrimarket:test:release:${process.pid}`,
};

console.log('AgriMarket — RELEASE QUALITY GATE');
console.log('================================');
console.log('✓ Database test đã được khóa an toàn.');
console.log('✓ OpenAPI snapshot chứa health + recommendation + loyalty + commerce V8B contracts.');
console.log('✓ OpenAPI snapshot đã được commit, không còn diff sau sync.');
console.log(`✓ BullMQ prefix: ${apiTestEnv.BULLMQ_PREFIX}`);

run('pnpm', ['api-client:ensure']);

// Nhiều E2E cố ý giữ ledger/order/history vì đây là dữ liệu immutable-oriented.
// Vì vậy release gate phải luôn bắt đầu từ DB disposable sạch; nếu chỉ migrate deploy
// thì fixture của lần chạy trước sẽ làm idempotency key, reservation, search và AI
// dataset đụng dữ liệu cũ và sinh false failure.
console.log('\n🧹 Reset agrimarket_test trước khi chạy API E2E...');
run(
  'pnpm',
  [
    '--filter',
    '@agrimarket/api',
    'exec',
    'prisma',
    'migrate',
    'reset',
    '--force',
    '--config',
    'prisma7.config.ts',
  ],
  apiTestEnv,
);
console.log('✓ agrimarket_test đã sạch và toàn bộ migration đã được áp dụng lại.');

run('pnpm', ['--filter', '@agrimarket/api', 'test'], apiTestEnv);
run('pnpm', ['lint']);
run('pnpm', ['typecheck']);
run('pnpm', ['build']);
run('git', ['diff', '--check']);

console.log('\n✅ RELEASE GATE PASS');
console.log('✅ OpenAPI + clean API E2E + lint + typecheck + build + diff-check đều PASS.');
