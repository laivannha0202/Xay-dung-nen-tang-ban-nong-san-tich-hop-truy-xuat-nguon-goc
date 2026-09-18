import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docApp(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/admin-web/src/app/${relativePath}`),
    'utf-8',
  );
}

function docLib(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), `apps/admin-web/src/lib/${relativePath}`), 'utf-8');
}

const tongQuan = () => docApp('page.tsx');
const baoCaoDoanhThu = () => docApp('bao-cao-don-hang-doanh-thu/page.tsx');
const baoCaoTonKho = () => docApp('bao-cao-ton-kho/page.tsx');
const baoCaoTruyXuat = () => docApp('bao-cao-truy-xuat/page.tsx');
const libDashboard = () => docLib('api-dashboard.ts');

test('1. dashboard uses real backend endpoints, no hardcoded KPIs', () => {
  const d = tongQuan();
  assert.match(d, /apiLayDashboard/);
  assert.match(d, /apiLayBaoCaoDonHangDoanhThu/);
  assert.match(d, /apiLayDoanhThuTheoNgay/);
  assert.equal(/doanhThu:\s*\d{5,}/.test(d), false);
  assert.equal(/Math\.random/.test(d), false);
  assert.equal(/setTimeout\(.*mock|MOCK|FAKE/i.test(d), false);
});

test('2. dashboard shows operational attention with factual navigation', () => {
  const d = tongQuan();
  for (const href of ['/don-hang', '/lo-san-pham', '/kiem-dinh-chat-luong', '/chung-nhan', '/bao-cao-ton-kho', '/bao-cao-truy-xuat', '/bao-cao-don-hang-doanh-thu']) {
    assert.ok(d.includes(`'${href}'`) || d.includes(`"${href}"`), `missing nav ${href}`);
  }
  // Exact backend enums for attention filters
  for (const e of ['CHO_THANH_TOAN', 'DANG_CHUAN_BI', 'KHIEU_NAI', 'CHO_KIEM_DINH', 'TAM_GIU', 'THU_HOI', 'HOLD', 'FAILED', 'CHO_XAC_MINH']) {
    assert.ok(d.includes(e), `missing exact enum ${e}`);
  }
});

test('3. dashboard distinguishes loading/error/empty, failure is not zero', () => {
  const d = tongQuan();
  assert.match(d, /dang-tai/);
  assert.match(d, /Không tải được/);
  assert.match(d, /Chưa có dữ liệu|Không có mục nào/);
  // No silent zero fallback: error branches render messages, not formatted zeros
  assert.equal(/catch.*setTongKy\(\{\s*tongDonHang:\s*0/s.test(d), false);
});

test('4. dashboard date filter passes exact Vietnam business dates to backend', () => {
  const d = tongQuan();
  const lib = libDashboard();
  assert.match(d, /RangePicker/);
  assert.match(d, /tuNgay, denNgay/);
  assert.match(lib, /tuNgay/);
  assert.match(lib, /denNgay/);
  assert.match(lib, /YYYY-MM-DD/);
  assert.match(lib, /31/);
});

test('5. per-day chart uses one server aggregate endpoint, no N requests/day', () => {
  const lib = libDashboard();
  assert.match(lib, /layDoanhThuTheoNgay/);
  assert.match(lib, /doanhThuGop/);
  assert.equal(lib.includes('Promise.all('), false);
  assert.equal(lib.includes('layBaoCaoDonHangDoanhThu'), false);
  assert.equal(lib.includes('doanhThu7Ngay'), false);
  const d = tongQuan();
  assert.equal(d.includes('doanhThu7Ngay'), false);
});

test('6. revenue report keeps gross semantics, no truncated export/chart', () => {
  const d = baoCaoDoanhThu();
  assert.match(d, /chưa trừ hoàn tiền|hoàn tiền/i);
  assert.match(d, /parent order/i);
  assert.equal(d.includes('xuatCsv'), false);
  assert.equal(d.includes('Xuất CSV'), false);
  assert.equal(d.includes('URL.createObjectURL'), false);
  assert.equal(/new Map<string, number>\(\)/.test(d), false);
  assert.match(d, /tongDonHang/);
  assert.match(d, /doanhThuGop/);
});

test('7. trace report uses exact batch status enum', () => {
  const d = baoCaoTruyXuat();
  for (const e of ['MOI_TAO', 'CHO_KIEM_DINH', 'CO_THE_BAN', 'TAM_GIU', 'KHONG_DAT', 'THU_HOI', 'HET_HANG']) {
    assert.ok(d.includes(e), `missing batch enum ${e}`);
  }
  assert.equal(d.includes('DANG_KIEM_DINH'), false);
  assert.equal(/SAN_SANG|DA_THU_HOI/.test(d), false);
});

test('8. dashboard/report gated by exact permission codes', () => {
  const d = tongQuan();
  for (const p of ['phan_quyen.quan_ly', 'don_hang.xu_ly', 'lo_san_pham.xem', 'kiem_dinh_chat_luong.xem', 'chung_nhan.xem', 'kho.xem']) {
    assert.ok(d.includes(p), `missing permission ${p}`);
  }
  assert.match(baoCaoDoanhThu(), /phan_quyen\.quan_ly/);
  assert.match(baoCaoTonKho(), /kho\.xem/);
  assert.match(baoCaoTruyXuat(), /lo_san_pham\.xem/);
});

test('9. no decorative dashboard styling on touched pages', () => {
  for (const src of [tongQuan(), baoCaoDoanhThu(), baoCaoTonKho(), baoCaoTruyXuat()]) {
    assert.equal(src.includes('linear-gradient'), false);
  }
  assert.equal(tongQuan().includes('Xin chào'), false);
  assert.equal(/AI dashboard|trend arrows|▲|▼\s*\d+%/i.test(tongQuan()), false);
});

test('10. finance stays out of dashboard KPIs', () => {
  const d = tongQuan();
  assert.equal(/hoa_hong|Hoa hồng|commission|doi_soat|Đối soát|chi_tra|Chi trả/i.test(d), false);
});

test('11. attention counts use server totals via gioiHan 1', () => {
  const d = tongQuan();
  assert.ok((d.match(/gioiHan: 1/g) ?? []).length >= 6, 'expected >= 6 count queries');
  assert.match(d, /\.tong/);
});
