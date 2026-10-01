/**
 * RESET DATABASE TEST — nguồn sự thật duy nhất cho mọi đường chạy e2e.
 *
 * Vì sao cần script này
 * --------------------
 * E2E/true-db test cố ý GIỮ lại ledger / order / reservation (dữ liệu
 * immutable-oriented), nên `afterAll` gần như không xóa gì. Hậu quả: lần chạy
 * thứ N bắt đầu trên DB đã bị lần chạy N-1 (và cả các lần `pnpm test` thủ
 * công) gài thêm hàng trăm dòng fixture.
 *
 * Hậu quả quan sát được, không phải lý thuyết:
 *   - `canh-bao-het-han-ton-kho.e2e-spec.ts` FAIL ổn định. Nguyên nhân đo
 *     được: service cắt danh sách ở `gioiHan` (tối đa 50), nhưng `agrimarket_test`
 *     đang có 101 dòng `inventory_lot.on_hand > 0` rơi vào cửa sổ "sắp hết hạn".
 *     Lô D7 của suite bị đẩy khỏi top-50 → `soNgayConLai: 7` không bao giờ xuất
 *     hiện, test nhận `0`. `tongSapHetHan` vẫn đúng vì `count()` không bị cắt —
 *     nên test "chết âm thầm" thay vì báo số liệu sai.
 *   - `release:gate` KHÔNG dính lỗi này vì nó đã reset DB trước khi chạy test.
 *     Còn `pnpm --filter @agrimarket/api test` thì không → CI xanh, máy dev đỏ.
 *
 * Script này đóng lại đúng khoảng cách đó: mọi đường chạy e2e đều bắt đầu từ
 * DB disposable sạch, nên "chạy ở CI" và "chạy ở máy" cho cùng một kết quả.
 *
 * Nguyên tắc an toàn (fail-closed, không có ngoại lệ)
 * ---------------------------------------------------
 * 1. Từ chối production.
 * 2. TEST_DATABASE_URL bắt buộc có, khác DATABASE_URL dev.
 * 3. Chỉ MySQL local/dev (127.0.0.1 / localhost / ::1) — không bao giờ reset
 *    database từ xa.
 * 4. Tên database phải chứa `test` — chặn nhầm database demo.
 * 5. `AGRIMARKET_SKIP_TEST_DB_RESET=1` để bỏ qua (release gate đã reset sẵn).
 * 6. Shadow DB: thử TEST_SHADOW_DATABASE_URL → SHADOW_DATABASE_URL → database
 *    anh em `${tenTest}_shadow`; lấy cái đầu tiên kết nối được. Nếu không có
 *    cái nào thì FAIL, không âm thầm bỏ shadow.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = resolve(rootDir, 'apps/api');

/** Nạp root `.env` (chỉ fill biến còn thiếu, không override) — giống prisma7.config.ts. */
function napEnv() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const dong = line.trim();
    if (!dong || dong.startsWith('#')) continue;
    const i = dong.indexOf('=');
    if (i < 0) continue;
    const tenBien = dong.slice(0, i).trim();
    if (process.env[tenBien] !== undefined) continue;
    let giaTri = dong.slice(i + 1).trim();
    if (
      (giaTri.startsWith('"') && giaTri.endsWith('"')) ||
      (giaTri.startsWith("'") && giaTri.endsWith("'"))
    ) {
      giaTri = giaTri.slice(1, -1);
    }
    process.env[tenBien] = giaTri;
  }
}

function tuChoi(thongBao) {
  console.error(`❌ ${thongBao}`);
  process.exit(2);
}

function tachUrl(giaTri, tenBien) {
  try {
    const url = new URL(giaTri);
    if (url.protocol !== 'mysql:') throw new Error('protocol');
    return url;
  } catch {
    return tuChoi(`${tenBien} không phải URL mysql:// hợp lệ.`);
  }
}

async function ketNoiDuoc(url) {
  try {
    const { default: mariadb } = await import('mariadb');
    const conn = await mariadb.createConnection({
      host: url.hostname,
      port: Number(url.port || '3306'),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
      connectTimeout: 4000,
    });
    await conn.end();
    return true;
  } catch {
    return false;
  }
}

function doiTenDatabase(url, tenMoi) {
  const doi = new URL(url.toString());
  doi.pathname = `/${tenMoi}`;
  return doi.toString();
}

napEnv();

if (process.env.AGRIMARKET_SKIP_TEST_DB_RESET === '1') {
  console.log('⏭  Bỏ qua reset DB test (AGRIMARKET_SKIP_TEST_DB_RESET=1).');
  process.exit(0);
}

if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
  tuChoi('TỪ CHỐI: môi trường production.');
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  tuChoi(
    'Thiếu TEST_DATABASE_URL. Môi trường test yêu cầu TEST_DATABASE_URL riêng biệt ' +
      '(xem .env.example).',
  );
}

if (testDatabaseUrl === process.env.DATABASE_URL) {
  tuChoi('TEST_DATABASE_URL không được trùng DATABASE_URL (môi trường dev).');
}

const urlTest = tachUrl(testDatabaseUrl, 'TEST_DATABASE_URL');
const tenDatabase = decodeURIComponent(urlTest.pathname.replace(/^\/+/, ''));
const hostLocal = ['127.0.0.1', 'localhost', '::1', '[::1]'];

if (!hostLocal.includes(urlTest.hostname)) {
  tuChoi(
    `TỪ CHỐI: chỉ reset MySQL local/dev. Host hiện tại: ${urlTest.hostname}. ` +
      'Database test phải nằm trên máy.',
  );
}

if (!/test/i.test(tenDatabase)) {
  tuChoi(
    `TỪ CHỐI: tên database "${tenDatabase}" không chứa "test". ` +
      'Chốt này chặn việc reset nhầm database demo/dev.',
  );
}

if (!/^[A-Za-z0-9_]+$/.test(tenDatabase)) {
  tuChoi(`TỪ CHỐI: tên database "${tenDatabase}" chứa ký tự lạ.`);
}

// --- Chọn shadow DB: lần lượt thử các nguồn, lấy cái đầu tiên kết nối được ---
const ungVienShadow = [];
if (process.env.TEST_SHADOW_DATABASE_URL) {
  ungVienShadow.push(['TEST_SHADOW_DATABASE_URL', process.env.TEST_SHADOW_DATABASE_URL]);
}
if (process.env.SHADOW_DATABASE_URL) {
  ungVienShadow.push(['SHADOW_DATABASE_URL', process.env.SHADOW_DATABASE_URL]);
}
ungVienShadow.push([
  `sinh từ TEST_DATABASE_URL (${tenDatabase}_shadow)`,
  doiTenDatabase(urlTest, `${tenDatabase}_shadow`),
]);

let shadowUrl = null;
let shadowNguon = null;
for (const [nguon, giaTri] of ungVienShadow) {
  let url;
  try {
    url = new URL(giaTri);
    if (url.protocol !== 'mysql:') continue;
  } catch {
    continue;
  }
  if (await ketNoiDuoc(url)) {
    shadowUrl = giaTri;
    shadowNguon = nguon;
    break;
  }
}

if (!shadowUrl) {
  console.error('❌ Không kết nối được shadow database nào. Đã thử:');
  for (const [nguon] of ungVienShadow) console.error(`   - ${nguon}`);
  tuChoi(
    'Cần ít nhất một shadow DB dùng được cho `prisma migrate reset`. ' +
      'Thiết lập TEST_SHADOW_DATABASE_URL hoặc tạo database `<ten>_shadow`.',
  );
}

console.log('🧹 Reset database test');
console.log(`   Database : ${tenDatabase} @ ${urlTest.hostname}`);
console.log(`   Shadow   : ${shadowNguon}`);

// prisma7.config.ts chỉ đọc DATABASE_URL, nên phải trỏ đúng database test.
const envPrisma = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  SHADOW_DATABASE_URL: shadowUrl,
  PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
};

// pnpm workspace dùng `nodeLinker: hoisted`, nên prisma CLI thường nằm ở
// `node_modules/prisma` của ROOT chứ không phải của apps/api.
// Gọi thẳng entry point JS bằng `process.execPath` để không phụ thuộc shell:
// file shim trong `.bin` là `.cmd` trên Windows nên `spawnSync` không spawn
// được nếu không bật shell (và bật shell thì mất cross-platform).
const ungVienPrisma = [
  resolve(apiDir, 'node_modules/prisma/build/index.js'),
  resolve(rootDir, 'node_modules/prisma/build/index.js'),
].filter((duongDan) => existsSync(duongDan));

if (ungVienPrisma.length === 0) {
  tuChoi('Không tìm thấy prisma CLI. Chạy `pnpm install` trước.');
}

const ketQua = spawnSync(
  process.execPath,
  [ungVienPrisma[0], 'migrate', 'reset', '--force', '--config', 'prisma7.config.ts'],
  { cwd: apiDir, stdio: 'inherit', env: envPrisma, shell: false },
);

if (ketQua.error) {
  console.error('[reset-test-db] Không chạy được prisma CLI:', ketQua.error.message);
  process.exit(1);
}

if (ketQua.status !== 0) {
  console.error(
    '[reset-test-db] `prisma migrate reset` thất bại. ' +
      'E2E sẽ chạy trên DB cũ có fixture tích tụ — dừng lại thay vì báo cáo sai.',
  );
  process.exit(ketQua.status ?? 1);
}

console.log('✓ Database test đã sạch, toàn bộ migration đã được áp dụng lại.');
