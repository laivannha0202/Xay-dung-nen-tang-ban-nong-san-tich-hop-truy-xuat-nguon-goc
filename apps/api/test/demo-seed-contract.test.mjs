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
  assert.match(d, /ORD-20261004-0001/);
  assert.match(d, /demo\.customer@agrimarket\.local/);
  assert.match(d, /demo\.admin@agrimarket\.local/);
  assert.match(d, /TT-20261004-0001/);
  assert.match(d, /VD-20261004-0001/);
  assert.match(d, /LOYALTY-20261004-0001/);
  assert.match(d, /Flash Sale Nông Sản Cuối Tuần/);
});

test('1b. mã CÔNG KHAI không mang chữ SEED/DEMO (chỉ mã CŨ để đổi tên)', () => {
  const d = seed();

  // Bộ mã mới phải sạch.
  for (const ma of [
    /NCC-AGRIMARKET-01/,
    /TT-MINH-BACH-01/,
    /TT-AN-PHU-01/,
    /TT-PHU-NONG-01/,
    /TT-SONG-HONG-01/,
    /VGP-MINHBACH-2026-01/,
    /HC-ANPHU-2026-01/,
    /VGP-PHUNONG-2026-01/,
    /ATSH-SONGHONG-2026-01/,
  ]) {
    assert.match(d, ma);
  }

  // Mỗi mã công khai cũ chỉ được tồn tại dưới dạng hằng số "*_CU" dùng để đổi
  // tên trong DB, không được xuất hiện ở chỗ tạo/upsert dữ liệu mới.
  const MA_CONG_KHAI_CU = [
    'NCC-SEED-001',
    'KHO-SEED-001',
    'FLASH-SALE-DEMO-01',
    'TT-SEED-001',
    'TT-SEED-AN-PHU',
    'TT-SEED-PHU-NONG',
    'TT-SEED-SONG-HONG',
    'DEMO-VG-MB-01',
    'DEMO-HC-AP-01',
    'DEMO-VG-PN-01',
    'DEMO-ATSH-SH-01',
    'LO-SEED-002B',
    'LOYALTY-DEMO-001',
    'AGM-DEMO-ORDER-001',
    'AGM-DEMO-ORDER-001-01',
    'COD-DEMO-001',
    'VD-DEMO-001',
  ];
  const noiDungKhongComment = d
    .split('\n')
    .filter((line) => !/^\s*(\/\*|\*|\/\/)/.test(line))
    .join('\n');
  for (const ma of MA_CONG_KHAI_CU) {
    const dong = noiDungKhongComment.split('\n').filter((line) => line.includes(`'${ma}'`));
    assert.ok(
      dong.length > 0,
      `Mã cũ ${ma} phải còn hằng số để chuyenMaCongKhaiCu() đổi tên cho DB cũ.`,
    );
    assert.ok(
      dong.every((line) => /maCu:|CodeCu:|_CU\b|function maLoCu/.test(line)),
      `Mã cũ ${ma} chỉ được nằm trong hằng số *_CU / hàm maLoCu, không được dùng để tạo dữ liệu mới:\n${dong.join('\n')}`,
    );
  }

  // Chữ "DEMO" trong dữ liệu tạo mới là điều KHÔNG được phép.
  const taoMoi = noiDungKhongComment
    .split('\n')
    .filter((line) => /DEMO/.test(line))
    .filter(
      (line) =>
        !/(DEMO_[A-Z_]+|_DEMO\b)/.test(line) && // biến/hằng nội bộ của script
        !/CodeCu:/.test(line) && // khai báo mã chứng nhận cũ
        !/_CU\b/.test(line) && // hằng mã cũ
        !/console\.(log|error|warn)\(/.test(line),
    );
  assert.deepEqual(taoMoi, [], `Mã/tên công khai mới còn chữ DEMO:\n${taoMoi.join('\n')}`);
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
  assert.match(d, /ORDER:.*maDonHang|ORDER:\$\{DEMO_MA_DON_HANG\}|ORDER:ORD-2026/);
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
