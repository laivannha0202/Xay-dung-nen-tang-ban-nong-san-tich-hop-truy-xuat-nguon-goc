'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const fields = [
  'tamTinhHangHoa',
  'phiVanChuyen',
  'maKhuyenMai',
  'giamKhuyenMai',
  'diemDaDung',
  'giaTriDiemDaDung',
];

test('Customer Web, Mobile and Admin render the same persisted order pricing snapshot', () => {
  const web = read('apps/customer-web/src/components/chi-tiet-don-hang-content.tsx');
  const mobile = read('apps/mobile/src/app/don-hang/[id].tsx');
  const admin = read('apps/admin-web/src/app/don-hang/page.tsx');
  const mobileType = read('apps/mobile/src/lib/api-don-hang.ts');
  const adminAdapter = read('apps/admin-web/src/lib/api-don-hang.ts');

  for (const field of fields) {
    assert.equal(web.includes(`order.${field}`), true, `Customer Web thiếu ${field}`);
    assert.equal(mobile.includes(`order.${field}`), true, `Mobile thiếu ${field}`);
    assert.equal(admin.includes(field), true, `Admin thiếu ${field}`);
    assert.equal(mobileType.includes(field), true, `Mobile type thiếu ${field}`);
    assert.equal(adminAdapter.includes(field), true, `Admin adapter thiếu ${field}`);
  }

  assert.equal(web.includes('Tổng thanh toán'), true);
  assert.equal(mobile.includes('Chi tiết thanh toán'), true);
  assert.equal(admin.includes('Cơ cấu giá đã chốt'), true);
});

test('pricing snapshot is read from persisted order fields, not current promotion configuration', () => {
  const backend = read('apps/api/src/modules/don-hang/don-hang-pricing-snapshot.service.ts');

  for (const field of fields) {
    assert.equal(backend.includes(field), true, `Backend pricing snapshot thiếu ${field}`);
  }

  assert.equal(backend.includes('khuyenMaiService'), false);
  assert.equal(backend.includes('cauHinhHeThongService'), false);
});
