import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function docLib(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/lib/${tenFile}`),
    'utf-8',
  );
}

function docComponent(tenFile) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/components/${tenFile}`),
    'utf-8',
  );
}

function docTrang(relativePath) {
  return fs.readFileSync(
    path.resolve(process.cwd(), `apps/customer-web/src/app/${relativePath}`),
    'utf-8',
  );
}

function docApi(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf-8');
}

const engine = () => docLib('xac-thuc-khach-hang.ts');
const phien = () => docLib('phien-khach-hang.ts');

test('1. contract DangNhapDto co ghiNho optional boolean', () => {
  const dto = docApi('packages/api-client/generated/model/dangNhapDto.ts');
  assert.match(dto, /ghiNho\?/);
  assert.match(dto, /boolean/);

  const snapshot = docApi('packages/api-client/openapi/agrimarket.json');
  assert.match(snapshot, /"ghiNho"/);

  const backendDto = docApi('apps/api/src/modules/xac-thuc/dto/dang-nhap.dto.ts');
  assert.match(backendDto, /ghiNho/);
  assert.match(backendDto, /IsBoolean/);
  assert.match(backendDto, /IsOptional/);
});

test('2. trang dang-nhap gui dung lua chon ghi nho', () => {
  const src = docTrang('dang-nhap/page.tsx');
  // Checkbox mac dinh true, gui that qua engine tap trung.
  assert.match(src, /Checkbox/);
  assert.match(src, /Ghi nhớ đăng nhập/);
  assert.match(src, /dangNhapKhachHang/);
  assert.match(src, /lamMoiTrangThai/);
  // Khong goi generated dangNhap truc tiep, khong tu luu phien.
  assert.equal(src.includes('luuPhienKhachHang'), false);
  assert.equal(
    /from '@agrimarket\/api-client'/.test(src),
    false,
  );
});

test('3. engine dang-nhap truyen ghiNho + credentials include', () => {
  const src = engine();
  assert.match(src, /export async function dangNhapKhachHang/);
  assert.match(src, /ghiNho: boolean/);
  assert.match(src, /nenTang: 'WEB'/);
  assert.match(src, /ghiNho/);
  assert.match(src, /credentials: 'include'/);
  // Refresh + logout deu gui cookie HttpOnly.
  const credentials = src.match(/credentials: 'include'/g) || [];
  assert.ok(credentials.length >= 3);
  assert.match(src, /lamMoiToken/);
  assert.match(src, /dangXuat/);
});

test('4. refresh single-flight, khong spam, co generation guard', () => {
  const src = engine();
  assert.match(src, /loiHuaLamMoi/);
  assert.match(src, /theHePhien/);
  // Proactive bang mot setTimeout dung thoi diem, khong setInterval.
  assert.match(src, /setTimeout\(/);
  assert.equal(/setInterval\(/.test(src), false);
  // Logout/login huy refresh dang bay de khong ghi de phien moi.
  assert.match(src, /theHe !== theHePhien/);
});

test('5. wrapper retry dung 1 lan, chi logout that khi refresh 401', () => {
  const src = engine();
  assert.match(src, /export async function thucThiApiKhachHang/);
  assert.match(src, /damBaoPhienKhachHang/);
  assert.match(src, /lamMoiPhienKhachHang/);
  assert.match(src, /LoiPhienKhachHangHetHan/);
  assert.match(src, /LoiChuaDangNhapKhachHang/);
  // Loi mang khi refresh: nem tiep de giu phien, khong logout oan.
  assert.match(src, /Lỗi mạng/);
});

test('6. khong luu refreshToken/matKhau o bat ky storage JS nao', () => {
  const src = phien();
  assert.match(src, /sessionStorage/);
  assert.equal(src.includes('localStorage'), false);
  // Khong co field refreshToken trong phien luu (chi comment canh bao).
  assert.equal(/refreshToken\s*:/.test(src), false);
  assert.match(src, /accessTokenExpiresAt/);
  // Khong setItem mat khau.
  assert.equal(/setItem.*matKhau/i.test(src), false);
  assert.equal(/setItem.*refresh/i.test(src), false);

  const eng = engine();
  assert.equal(eng.includes('localStorage'), false);
  assert.equal(/sessionStorage\.setItem.*refresh/i.test(eng), false);
});

test('7. 13 api modules di qua wrapper chung, khong tu gan Bearer', () => {
  const modules = [
    'apps/customer-web/src/lib/api-gio-hang.ts',
    'apps/customer-web/src/lib/api-ho-so-khach-hang.ts',
    'apps/customer-web/src/lib/api-don-hang.ts',
    'apps/customer-web/src/lib/api-wishlist.ts',
    'apps/customer-web/src/lib/api-danh-gia.ts',
    'apps/customer-web/src/lib/api-checkout.ts',
    'apps/customer-web/src/lib/api-khieu-nai.ts',
    'apps/customer-web/src/lib/api-giao-hang.ts',
    'apps/customer-web/src/lib/api-thanh-toan.ts',
    'apps/customer-web/src/lib/api-diem-thuong.ts',
    'apps/customer-web/src/lib/api-dia-chi-khach-hang.ts',
    'apps/customer-web/src/lib/api-goi-y.ts',
    'apps/customer-web/src/lib/api-theo-doi-trang-trai.ts',
  ];
  for (const file of modules) {
    const src = docApi(file);
    assert.match(src, /thucThiApiKhachHang/);
    assert.equal(src.includes('bearerOptionsKhachHang'), false);
  }
});

test('8. AuthProvider bootstrap + dang-xuat hoan chinh + dong bo tab', () => {
  const provider = docComponent('phien-khach-hang-provider.tsx');
  assert.match(provider, /damBaoPhienKhachHang/);
  assert.match(provider, /dangXuatKhachHang/);
  assert.match(provider, /dang-tai/);
  assert.match(provider, /da-dang-nhap/);
  assert.match(provider, /langNghePhienKhachHangThayDoi/);

  const khung = docComponent('khung-tai-khoan.tsx');
  assert.match(khung, /useXacThucKhachHang/);
  assert.match(khung, /dangXuat/);
  assert.match(khung, /router\.replace\('\/dang-nhap'\)/);
  // Khong chi xoa local: phai revoke cookie o backend qua provider.
  assert.equal(khung.includes('xoaPhienKhachHang'), false);
});

test('9. backend: session vs persistent cookie + giu nguyen khi rotate', () => {
  const controller = docApi('apps/api/src/modules/xac-thuc/xac-thuc.controller.ts');
  assert.match(controller, /maxAge/);
  assert.match(controller, /Path=\/api\/v1\/xac-thuc|path: '\/api\/v1\/xac-thuc'/);
  assert.match(controller, /datRefreshCookie/);
  assert.match(controller, /xoaRefreshCookie/);

  const service = docApi('apps/api/src/modules/xac-thuc/xac-thuc.service.ts');
  assert.match(service, /ghiNho/);
  // Refresh JWT mang claim ghiNho, rotate giu nguyen lua chon.
  assert.match(service, /payload\.ghiNho/);
  // MOBILE van nhan refreshToken trong body nhu contract cu.
  assert.match(controller, /MOBILE/);
});
