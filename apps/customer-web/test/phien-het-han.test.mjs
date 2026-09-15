import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docComponent(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${tenFile}`),
    'utf-8',
  );
}

function docLib(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/lib/${tenFile}`),
    'utf-8',
  );
}

function docApp(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/app/${relativePath}`),
    'utf-8',
  );
}

const phien = () => docLib('phien-khach-hang.ts');
const engine = () => docLib('xac-thuc-khach-hang.ts');
const overview = () => docComponent('tong-quan-tai-khoan-content.tsx');
const hoSo = () => docComponent('ho-so-khach-hang-content.tsx');
const diaChi = () => docComponent('so-dia-chi-content.tsx');
const header = () => docComponent('agri-header.tsx');

test('1. helper nhan dien phien het han qua HTTP 401', () => {
  const src = phien();
  assert.match(src, /export function laLoiPhienHetHan/);
  assert.match(src, /401/);
  assert.match(src, /export function xoaPhienKhachHang/);
  // Loi chuan chi nem SAU KHI refresh that bai o engine tap trung.
  assert.match(src, /LoiPhienKhachHangHetHan/);
});

test('2. overview /tai-khoan: 401 thi ve dang-nhap, khong tu xoa phien (engine tap trung lo)', () => {
  const o = overview();
  assert.match(o, /laLoiPhienHetHan/);
  assert.match(o, /\/dang-nhap\?next=\/tai-khoan/);
  // Khong goi xoaPhien truc tiep: 401 access token phai qua refresh truoc.
  assert.equal(o.includes('xoaPhienKhachHang'), false);
  // Restore im lang khi F5/tab moi truoc khi ket luan chua dang nhap.
  assert.match(o, /damBaoPhienKhachHang/);
});

test('3. ho-so: 401 khi tai va khi luu deu dua ve dang-nhap, khong tu xoa', () => {
  const h = hoSo();
  assert.match(h, /laLoiPhienHetHan/);
  assert.equal(h.includes('xoaPhienKhachHang'), false);
  assert.match(h, /\/dang-nhap\?next=\/tai-khoan\/ho-so/);
  assert.match(h, /damBaoPhienKhachHang/);
});

test('4. dia-chi: 401 khi tai/luu/mac-dinh/xoa deu dua ve dang-nhap, khong tu xoa', () => {
  const d = diaChi();
  assert.match(d, /laLoiPhienHetHan/);
  assert.equal(d.includes('xoaPhienKhachHang'), false);
  assert.match(d, /\/dang-nhap\?next=\/tai-khoan\/dia-chi/);
  assert.match(d, /damBaoPhienKhachHang/);
});

test('5. header: doc phien tu AuthProvider, refresh+retry tap trung, khong tu xoa', () => {
  const h = header();
  assert.match(h, /useXacThucKhachHang/);
  assert.equal(h.includes('xoaPhienKhachHang'), false);
  // Khong doc sessionStorage truc tiep de tranh lech trang thai giua cac tab.
  assert.equal(h.includes('layPhienKhachHang'), false);
  assert.match(h, /retry: 0/);
});

test('6. providers: react-query khong retry khi 401', () => {
  const src = docApp('providers.tsx');
  assert.match(src, /laLoiPhienHetHan/);
  assert.match(src, /retry/);
  assert.match(src, /PhienKhachHangProvider/);
});

test('7. xoa phien chi duoc goi tu engine tap trung', () => {
  assert.match(engine(), /xoaPhienKhachHang/);
  for (const src of [overview(), hoSo(), diaChi(), header()]) {
    assert.equal(src.includes('xoaPhienKhachHang'), false);
  }
});

test('8. khong mock, khong framework moi cho fix 401', () => {
  for (const src of [overview(), hoSo(), diaChi(), header(), phien(), engine()]) {
    assert.equal(src.includes('MOCK'), false);
  }
  const pkg = fs.readFileSync(path.resolve(process.cwd(), 'apps/customer-web/package.json'), 'utf-8');
  assert.equal(pkg.includes('"antd"'), false);
  assert.equal(pkg.includes('"lucide'), false);
});
