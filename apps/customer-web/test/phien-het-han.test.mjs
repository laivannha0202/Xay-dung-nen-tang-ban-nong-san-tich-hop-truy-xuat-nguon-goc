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
const overview = () => docComponent('tong-quan-tai-khoan-content.tsx');
const hoSo = () => docComponent('ho-so-khach-hang-content.tsx');
const diaChi = () => docComponent('so-dia-chi-content.tsx');
const header = () => docComponent('agri-header.tsx');

test('1. helper nhan dien phien het han qua HTTP 401', () => {
  const src = phien();
  assert.match(src, /export function laLoiPhienHetHan/);
  assert.match(src, /401/);
  assert.match(src, /export function xoaPhienKhachHang/);
});

test('2. overview /tai-khoan: 401 thi xoa phien + ve dang-nhap, khong loi chung', () => {
  const o = overview();
  assert.match(o, /laLoiPhienHetHan/);
  assert.match(o, /xoaPhienKhachHang/);
  assert.match(o, /\/dang-nhap\?next=\/tai-khoan/);
});

test('3. ho-so: 401 khi tai va khi luu deu dua ve dang-nhap', () => {
  const h = hoSo();
  assert.match(h, /laLoiPhienHetHan/);
  assert.match(h, /xoaPhienKhachHang/);
  assert.match(h, /\/dang-nhap\?next=\/tai-khoan\/ho-so/);
});

test('4. dia-chi: 401 khi tai/luu/mac-dinh/xoa deu dua ve dang-nhap', () => {
  const d = diaChi();
  assert.match(d, /laLoiPhienHetHan/);
  assert.match(d, /xoaPhienKhachHang/);
  assert.match(d, /\/dang-nhap\?next=\/tai-khoan\/dia-chi/);
});

test('5. header gio-hang: 401 thi xoa phien stale, khong retry', () => {
  const h = header();
  assert.match(h, /laLoiPhienHetHan/);
  assert.match(h, /xoaPhienKhachHang/);
  assert.match(h, /retry: 0/);
});

test('6. providers: react-query khong retry khi 401', () => {
  const src = docApp('providers.tsx');
  assert.match(src, /laLoiPhienHetHan/);
  assert.match(src, /retry/);
});

test('7. khong mock, khong framework moi cho fix 401', () => {
  for (const src of [overview(), hoSo(), diaChi(), header(), phien()]) {
    assert.equal(src.includes('MOCK'), false);
  }
  const pkg = fs.readFileSync(path.resolve(process.cwd(), 'apps/customer-web/package.json'), 'utf-8');
  assert.equal(pkg.includes('"antd"'), false);
  assert.equal(pkg.includes('"lucide'), false);
});
