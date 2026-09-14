import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docNguon(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf-8');
}

const seed = () => docNguon('apps/api/scripts/seed-data.ts');
const pkg = () => JSON.parse(docNguon('package.json'));
const smoke = () => docNguon('scripts/smoke-demo.mjs');

test('1. stable demo identities (no random business values)', () => {
  const d = seed();
  assert.match(d, /AGM-DEMO-ORDER-001/);
  assert.match(d, /demo\.customer@agrimarket\.local/);
  assert.match(d, /demo\.admin@agrimarket\.local/);
  assert.match(d, /COD-DEMO-001/);
  assert.match(d, /VD-DEMO-001/);
  assert.match(d, /LOYALTY-DEMO-001/);
  assert.match(d, /FLASH-SALE-DEMO-01/);
});

test('2. production guard refuses credential seeding', () => {
  const d = seed();
  assert.match(d, /NODE_ENV.*production/);
  assert.match(d, /Từ chối seed demo/);
});

test('3. exact trace fixture chain exists in seed', () => {
  const d = seed();
  assert.match(d, /phanBoDonHang/);
  assert.match(d, /maTruyXuat/);
  assert.match(d, /ORDER:.*maDonHang|ORDER:\$\{DEMO_MA_DON_HANG\}|ORDER:AGM-DEMO/);
  assert.match(d, /DA_BAN/);
  assert.match(d, /ORDER_RESERVE/);
  assert.match(d, /ORDER_SHIP/);
});

test('4. no duplicate seed records (upsert/find-first patterns)', () => {
  const d = seed();
  assert.match(d, /findUnique\(\{\s*where: \{ maDonHang/);
  assert.match(d, /deleteMany\(\{ where: \{ mucDonHangId/);
  assert.match(d, /hetHanLuc|ketThucLuc/);
});

test('5. canonical scripts exist', () => {
  const scripts = pkg().scripts;
  assert.ok(scripts['db:seed:demo'], 'missing pnpm db:seed:demo');
  assert.ok(scripts['demo:smoke'], 'missing pnpm demo:smoke');
  assert.match(scripts['db:seed:demo'], /seed-data\.ts/);
  assert.match(scripts['demo:smoke'], /smoke-demo\.mjs/);
});

test('6. demo smoke validates exact allocation (no guessed batch)', () => {
  const d = smoke();
  assert.match(d, /phanBo/);
  assert.match(d, /maTruyXuat/);
  assert.match(d, /truy-xuat/);
  assert.match(d, /process\.exit\(1\)/);
  assert.equal(/latest|mới nhất.*lô|first.*batch/i.test(d), false);
});

test('7. no supplier/farm login actors in demo seed', () => {
  const d = seed();
  assert.equal(/supplier.*login|farm.*login|dang-nhap.*ncc/i.test(d), false);
  assert.match(d, /KHACH_HANG/);
  assert.match(d, /ADMIN/);
});
