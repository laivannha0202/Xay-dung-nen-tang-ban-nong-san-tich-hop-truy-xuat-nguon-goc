import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import {
  donRedisChoTest,
  envTestCoLapRedis,
  moKetNoiRedis,
} from './redis-test-namespace.mjs';

function run(command, args, env = process.env) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // Windows: pnpm là pnpm.cmd/pnpm.ps1, cần shell để resolve; Linux giữ shell:false như cũ.
    shell: process.platform === 'win32',
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
    console.error(
      '   Hoặc dùng một lệnh `pnpm release:final` để sync OpenAPI trước rồi chạy toàn bộ gate.',
    );
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
requireOpenApiOperation('/api/v1/khach-hang/diem-thuong', 'get', 'layTongQuanDiemThuongCuaToi');
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
requireOpenApiOperation('/api/v1/quan-tri/khuyen-mai', 'get', 'layDanhSachKhuyenMaiQuanTri');
requireOpenApiOperation('/api/v1/quan-tri/khuyen-mai', 'post', 'taoKhuyenMaiQuanTri');
requireOpenApiOperation('/api/v1/quan-tri/khuyen-mai/{id}', 'get', 'layChiTietKhuyenMaiQuanTri');
requireOpenApiOperation('/api/v1/quan-tri/khuyen-mai/{id}', 'put', 'capNhatKhuyenMaiQuanTri');
requireOpenApiOperation(
  '/api/v1/quan-tri/khuyen-mai/{id}/trang-thai',
  'patch',
  'doiTrangThaiKhuyenMaiQuanTri',
);

// Complaint parity: Customer/Admin dùng cùng source-of-truth và Admin có workflow xử lý/refund thật.
requireOpenApiOperation('/api/v1/khieu-nai/cua-toi/thong-ke', 'get', 'layThongKeKhieuNaiCuaToi');
requireOpenApiOperation('/api/v1/quan-tri/khieu-nai/thong-ke', 'get', 'layThongKeKhieuNaiQuanTri');
requireOpenApiOperation(
  '/api/v1/quan-tri/khieu-nai/{id}/xu-ly',
  'patch',
  'capNhatXuLyKhieuNaiQuanTri',
);
requireOpenApiOperation(
  '/api/v1/quan-tri/khieu-nai/{id}/hoan-tien',
  'post',
  'hoanTienTheoKhieuNaiQuanTri',
);

// V16: khóa contract chứng từ kho + hóa đơn nội bộ và search đơn cho Admin.
requireOpenApiOperation('/api/v1/quan-tri/phieu-kho', 'get', 'layDanhSachPhieuKho');
requireOpenApiOperation('/api/v1/quan-tri/phieu-kho/{id}', 'get', 'layChiTietPhieuKho');
for (const parameterName of [
  'trangThai',
  'maKho',
  'maLo',
  'sku',
  'nguoiLap',
  'soLuongTu',
  'soLuongDen',
  'tuNgay',
  'denNgay',
]) {
  requireOpenApiQueryParameter('/api/v1/quan-tri/phieu-kho', 'get', parameterName);
}
requireOpenApiOperation('/api/v1/quan-tri/hoa-don-noi-bo', 'get', 'layDanhSachHoaDonNoiBo');
requireOpenApiOperation('/api/v1/quan-tri/hoa-don-noi-bo/{id}', 'get', 'layChiTietHoaDonNoiBo');
requireOpenApiOperation(
  '/api/v1/quan-tri/hoa-don-noi-bo/don-hang/{donHangId}/phat-hanh',
  'post',
  'phatHanhHoaDonNoiBo',
);
requireOpenApiQueryParameter('/api/v1/quan-tri/don-hang', 'get', 'timKiem');

// release:final chạy api-client:sync trước release:gate. Nếu sync sinh snapshot mới thì
// snapshot đó phải được commit trước khi được phép coi gate là PASS.
requireCommittedOpenApiSnapshot();

const baseEnv = { ...process.env };
for (const key of Object.keys(baseEnv)) {
  if (/agent|pi|claude|cursor|windsurf/i.test(key) && key !== 'PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION') {
    delete baseEnv[key];
  }
}
baseEnv.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = 'yes';
// tools/run-jest-vm.mjs fail-fast khi DATABASE_URL trùng TEST_DATABASE_URL để bảo vệ
// database demo. Khi NODE_ENV=test, PrismaService chỉ dùng TEST_DATABASE_URL và bỏ qua
// DATABASE_URL, nên ở bước chạy test, DATABASE_URL chỉ còn vai trò "không phải DB demo".
// Trỏ sang test shadow để chắc chắn gate không bao giờ chạm agrimarket dev/demo, kể cả
// khi CI vốn đã đặt DATABASE_URL = TEST_DATABASE_URL.
// Riêng `prisma migrate reset` đọc DATABASE_URL từ prisma7.config.ts nên phải trỏ
// đúng database test -> dùng dbResetEnv riêng.
const apiTestEnv = {
  ...envTestCoLapRedis(baseEnv),
  DATABASE_URL: testShadowDatabaseUrl,
  SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  TEST_DATABASE_URL: testDatabaseUrl,
  TEST_SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  // BullMQ của gate phải theo PID để hai lần chạy song song không đụng nhau.
  // `envTestCoLapRedis` đã ép sang `agrimarket:test:bull` khi prefix trong env là
  // prefix dev; ở đây thêm PID để không dính dữ liệu của lần chạy trước.
  BULLMQ_PREFIX: process.env.BULLMQ_PREFIX || `agrimarket:test:release:${process.pid}`,
  FILE_STORAGE_MODE: 'memory',
  EMAIL_TRANSPORT_MODE: 'memory',
};

const dbResetEnv = {
  ...apiTestEnv,
  DATABASE_URL: testDatabaseUrl,
  SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  // `pnpm --filter @agrimarket/api test` tự gọi tools/reset-test-db.mjs. Gate đã
  // reset ngay trên nên bỏ qua lần thứ hai, tránh migrate 64 migration hai lần.
  AGRIMARKET_SKIP_TEST_DB_RESET: '1',
};

console.log('AgriMarket — RELEASE QUALITY GATE');
console.log('================================');
console.log('✓ Database test đã được khóa an toàn.');
console.log('✓ OpenAPI snapshot chứa health + recommendation + loyalty + commerce V8B contracts.');
console.log('✓ OpenAPI snapshot đã được commit, không còn diff sau sync.');
console.log(`✓ BullMQ prefix: ${apiTestEnv.BULLMQ_PREFIX}`);
console.log(`✓ Redis cache prefix: ${apiTestEnv.REDIS_PREFIX}`);

/**
 * Dọn namespace Redis test TRƯỚC khi chạy suite.
 *
 * Gate chạy nhiều e2e giữ dữ liệu (BullMQ `removeOnComplete` chỉ dọn sau 1h), nên
 * nếu không dọn thì cache `cau-hinh-he-thong` / `quyen` của lần chạy trước còn
 * nằm trong Redis và suite sau đọc được giá trị cũ -> chập chờn. Chỉ xoá trong
 * namespace `...:test:...`; Redis dev không bị đụng. Xem
 * `tools/redis-test-namespace.mjs`.
 */
async function donRedisTest(soDong) {
  if (!apiTestEnv.REDIS_URL) {
    console.log(`⏭  ${soDong}: thiếu REDIS_URL, bỏ qua dọn Redis namespace test.`);
    return;
  }

  let client;

  try {
    client = await moKetNoiRedis(apiTestEnv.REDIS_URL);
  } catch (error) {
    const lyDo = error instanceof Error ? error.message : String(error);
    console.log(`⏭  ${soDong}: không kết nối được Redis (${lyDo}). Bỏ qua dọn namespace test.`);
    return;
  }

  try {
    const { daXoa, boQua } = await donRedisChoTest(client, apiTestEnv, {
      quyMo: (dong) => console.log(dong),
    });
    for (const bo of boQua) console.log(`⏭  Bỏ qua "${bo.namespace}": ${bo.lyDo}`);
    console.log(`✓ ${soDong}: đã xoá ${daXoa} key trong namespace test.`);
  } finally {
    await client.quit();
  }
}

await donRedisTest('Trước API test');

run('pnpm', ['api-client:ensure']);

// Chốt contract env của chính release gate: nếu DATABASE_URL trùng TEST_DATABASE_URL
// thì run-jest-vm.mjs sẽ exit(2) và gate chết trước khi chạy test API.
run('node', ['--test', 'tools/release-gate-env.test.mjs']);
run('node', ['--test', 'tools/redis-test-namespace.test.mjs']);

// Chặn CVE trước khi vào main. Chạy sớm (trước cả DB reset) để lỗi bảo mật lộ
// ra trong vài giây thay vì sau 40 phút test. Xem tools/kiem-tra-bao-mat.mjs.
console.log('\n🛡  Kiểm tra dependency security...');
run('node', ['tools/kiem-tra-bao-mat.mjs']);
console.log('✓ Không có advisory critical/high chưa được xử lý.');

// Nhiều E2E cố ý giữ ledger/order/history vì đây là dữ liệu immutable-oriented.
// Vì vậy release gate phải luôn bắt đầu từ DB disposable sạch; nếu chỉ migrate deploy
// thì fixture của lần chạy trước sẽ làm idempotency key, reservation, search và AI
// dataset đụng dữ liệu cũ và sinh false failure.
//
// Reset do `tools/reset-test-db.mjs` đảm nhiệm — đúng script mà
// `pnpm --filter @agrimarket/api test` cũng gọi. Nhờ vậy CI và máy dev cùng
// bắt đầu từ một DB sạch, thay vì CI xanh / máy dev đỏ.
console.log('\n🧹 Reset agrimarket_test trước khi chạy API E2E...');
run('node', ['tools/reset-test-db.mjs'], dbResetEnv);
console.log('✓ agrimarket_test đã sạch và toàn bộ migration đã được áp dụng lại.');

run('pnpm', ['--filter', '@agrimarket/api', 'test'], apiTestEnv);
await donRedisTest('Sau API test');

// Gate tích hợp Mailpit: SMTP THẬT + Mailpit thật. Tách riêng khỏi full-suite vì
// full-suite phải chạy được trên máy không có Mailpit (xem
// tools/run-api-mailpit-tests.mjs). Ở đây có Mailpit service nên gate này là
// BẮT BUỘC và không skip được.
const mailpitEnv = {
  ...apiTestEnv,
  EMAIL_TRANSPORT_MODE: '',
  SMTP_HOST: process.env.SMTP_HOST || '127.0.0.1',
  SMTP_PORT: process.env.SMTP_PORT || '1025',
  MAILPIT_HTTP_HOST: process.env.MAILPIT_HTTP_HOST || '127.0.0.1',
  MAILPIT_HTTP_PORT: process.env.MAILPIT_HTTP_PORT || '8025',
};
delete mailpitEnv.EMAIL_TRANSPORT_MODE;
console.log(`\n📮 Mailpit SMTP integration gate (${mailpitEnv.SMTP_HOST}:${mailpitEnv.SMTP_PORT})...`);
run('pnpm', ['--filter', '@agrimarket/api', 'test:mailpit'], mailpitEnv);
run('pnpm', ['--filter', '@agrimarket/customer-web', 'test']);
run('pnpm', ['--filter', '@agrimarket/admin-web', 'test']);
run('pnpm', ['--filter', '@agrimarket/mobile', 'test']);
run('pnpm', ['--filter', '@agrimarket/mobile', 'ci:validate']);
run('pnpm', ['--filter', '@agrimarket/mobile', 'security:validate']);
run('pnpm', ['--filter', '@agrimarket/mobile', 'e2e:validate']);
run('pnpm', ['lint']);
run('pnpm', ['typecheck']);
run('pnpm', ['build']);
run('git', ['diff', '--check']);

console.log('\n✅ RELEASE GATE PASS');
console.log(
  '✅ OpenAPI + API E2E + Mailpit integration + Customer/Admin/Mobile tests + lint + typecheck + build + diff-check đều PASS.',
);
