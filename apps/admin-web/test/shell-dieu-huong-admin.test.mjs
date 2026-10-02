/**
 * Regression: shell Admin phải giữ nguyên khi đổi route + menu phải gọn mà
 * không mất nghiệp vụ.
 *
 * 1) AGRIMARKET-ADMIN-SHELL-PERSIST-V8
 *    Bug: effect bootstrap gắn `pathname` và `setDaKhoiTao(false)` ở MỌI lần
 *    đổi route ⇒ mỗi lần click menu là toàn màn hình bị thay bằng loader
 *    "Đang kiểm tra phiên quản trị..." dù `damBaoPhienAdmin()` có fast-path.
 *    Không được phép quay lại mô hình "reset loading theo pathname".
 *
 * 2) AGRIMARKET-ADMIN-MENU-V8
 *    Menu chỉ là lớp trình bày: mọi route trong DIEU_HUONG_ADMIN vẫn phải có
 *    page thật, vẫn được `coTruyCapDuongDanAdmin` chặn, và không route nào
 *    "mồ côi" (có page nhưng không có quyền quản lý điều hướng).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(process.cwd(), 'apps/admin-web/src/app');
const LIB_DIR = path.resolve(process.cwd(), 'apps/admin-web/src/lib');
const COMPONENT_DIR = path.resolve(process.cwd(), 'apps/admin-web/src/components');

const doc = (p) => fs.readFileSync(p, 'utf-8');
const shell = doc(path.join(COMPONENT_DIR, 'khung-quan-tri.tsx'));
const quyen = doc(path.join(LIB_DIR, 'quyen-admin.ts'));
const phien = doc(path.join(LIB_DIR, 'phien-dang-nhap-admin.ts'));

/** Bỏ comment để pattern trong chú thích không bị tính nhầm là code. */
const boComment = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const shellCode = boComment(shell);

// ── 1. Shell không reset loading khi đổi route ─────────────────────────────

test('1. setDaKhoiTao(false) CHỈ nằm trong nhánh bootstrap đầu tiên', () => {
  const lanDauBlock = shellCode.slice(
    shellCode.indexOf('const lanDau ='),
    shellCode.indexOf('let active = true;'),
  );

  assert.ok(lanDauBlock, 'phải còn nhánh phân biệt lần đầu / điều hướng');
  assert.match(lanDauBlock, /if \(lanDau\) \{[\s\S]*setDaKhoiTao\(false\)/);
  // Nhánh "KHÔNG phải lần đầu" (đổi route) tuyệt đối không set loading.
  assert.equal(/setDaKhoiTao\(false\)/.test(lanDauBlock.replace(/if \(lanDau\)[\s\S]*/, '')), false);

  // Chỉ đúng MỘT chỗ gọi setDaKhoiTao(false) trong toàn bộ shell.
  const soLanReset = shellCode.match(/setDaKhoiTao\(false\)/g) ?? [];
  assert.equal(soLanReset.length, 1, `setDaKhoiTao(false) phải xuất hiện đúng 1 lần, thấy ${soLanReset.length}`);
});

test('2. đổi route vẫn chạy damBaoPhienAdmin() + kiểm tra quyền', () => {
  // Không được bỏ refresh-token logic khi điều hướng.
  assert.match(shell, /void damBaoPhienAdmin\(\)\.then/);
  // Fast-path vẫn còn nguyên trong lớp phiên.
  assert.match(phien, /if \(hienTai && !accessTokenSapHetHan\(hienTai\)\) \{\s*return Promise\.resolve\(hienTai\);/);
  // Permission vẫn bị chặn ở layout.
  assert.match(shell, /coTruyCapDuongDanAdmin\(/);
  assert.match(shell, /duongDanDauTienAdmin\(/);
});

test('3. hiển thị loader toàn màn hình chỉ khi CHƯA bootstrap', () => {
  const guard = shellCode.slice(
    shellCode.indexOf('if (!daKhoiTao || !phien)'),
    shellCode.indexOf('const menuTaiKhoan'),
  );
  assert.ok(guard.includes('Đang kiểm tra phiên quản trị...'));
  // Không được render children khi chưa bootstrap (tránh nháy nội dung).
  assert.equal(/if \(!daKhoiTao \|\| !phien\)[\s\S]*\{children\}/.test(guard), false);
});

test('4. vùng Content có phản hồi riêng khi đổi route', () => {
  // Skeleton của app/loading.tsx nằm trong Suspense của segment app/ ⇒ chỉ
  // Content loading, Sidebar/Header (trong layout) không bị ẩn.
  const loading = boComment(doc(path.join(APP_DIR, 'loading.tsx')));
  assert.match(loading, /export default function LoadingNoiDung\(\)/);
  assert.equal(/KhungQuanTri|Sider|Header/.test(loading), false);
  assert.equal(fs.existsSync(path.join(APP_DIR, 'dang-nhap', 'loading.tsx')), false);
});

/** Giá trị của `NHOM_MENU_CHI_GOM` — mục nhóm ảo, KHÔNG phải route. */
function giaTriNhomAo() {
  const m = quyen.match(/export const NHOM_MENU_CHI_GOM\s*=\s*'([^']+)'/);
  assert.ok(m, 'không tìm thấy khai báo NHOM_MENU_CHI_GOM');
  return m[1];
}

// ── 2. Menu gọn nhưng không mất nghiệp vụ ───────────────────────────────────

/**
 * Đọc từng khai báo `muc(path, ...)` trong khối DIEU_HUONG_ADMIN cùng
 * `menuCha` / `hienThiMenu` / `chiMenu` tương ứng.
 *
 * Hiểu tường minh mục nhóm ảo khai báo bằng constant (`muc(NHOM_MENU_CHI_GOM,
 * ..., { chiMenu: true })`), KHÔNG dựa vào việc regex string-literal vô tình
 * bỏ sót nó.
 */
function docMenu() {
  const code = boComment(quyen);
  const nhomAo = giaTriNhomAo();
  const moDau = code.indexOf('export const DIEU_HUONG_ADMIN');
  const ketThuc = code.indexOf('\n];', moDau);
  assert.notEqual(moDau, -1, 'không tìm thấy DIEU_HUONG_ADMIN');
  assert.notEqual(ketThuc, -1, 'không tìm thấy điểm kết thúc DIEU_HUONG_ADMIN');
  const khoi = code.slice(moDau, ketThuc);

  // Mỗi khai báo bắt đầu bằng `muc('path', ...)` HOẶC `muc(CONSTANT, ...)`.
  const moc = [...khoi.matchAll(/\bmuc\(\s*(?:'([^']+)'|([A-Z_][A-Z0-9_]*))/g)];
  const out = [];

  for (let i = 0; i < moc.length; i += 1) {
    const batDau = moc[i].index;
    const ket = i + 1 < moc.length ? moc[i + 1].index : khoi.length;
    const block = khoi.slice(batDau, ket);
    const path = moc[i][1] ?? nhomAo;
    // `menuCha` có thể là string literal HOẶC constant (NHOM_MENU_CHI_GOM).
    const chaMatch = block.match(/menuCha:\s*(?:'([^']+)'|([A-Z_][A-Z0-9_]*))/) ;
    const cha = chaMatch ? (chaMatch[1] ?? nhomAo) : null;
    out.push({
      path,
      cha,
      an: /hienThiMenu:\s*false/.test(block),
      ao: /chiMenu:\s*true/.test(block) || path === nhomAo,
    });
  }

  return out;
}

const MENU = docMenu();

/** Chỉ các route thật (đã loại mục nhóm ảo) — nguồn duy nhất cho đếm route. */
function routeTrongQuyen() {
  return MENU.filter((m) => !m.ao).map((m) => m.path);
}

function tatCaPage() {
  const out = [];
  const duyet = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) duyet(p);
      else if (entry.name === 'page.tsx') out.push(p);
    }
  };
  duyet(APP_DIR);
  return out;
}

test('5. đúng 35 khai báo = 34 route thật + 1 nhóm ảo, mọi route đều có page thật', () => {
  // Đếm tường minh trên cấu trúc đã parse, không dựa vào regex bỏ sót.
  assert.equal(MENU.length, 35, `DIEU_HUONG_ADMIN phải có đúng 35 khai báo, thấy ${MENU.length}`);
  const ao = MENU.filter((m) => m.ao);
  assert.equal(ao.length, 1, `phải có đúng 1 mục nhóm ảo, thấy ${ao.length}`);
  assert.equal(ao[0].path, giaTriNhomAo());
  const routes = routeTrongQuyen();
  const thieu = [];

  for (const route of routes) {
    const dir = path.join(APP_DIR, route === '/' ? '' : route.slice(1));
    if (!fs.existsSync(path.join(dir, 'page.tsx'))) thieu.push(route);
  }

  assert.deepEqual(thieu, [], `route không có page: ${thieu.join(', ')}`);
  // 34 route quản trị + /dang-nhap = 35 page.
  assert.equal(routes.length, 34);
  assert.equal(tatCaPage().length, 35);
});

test('6. không có page mồ côi (page không nằm trong DIEU_HUONG_ADMIN)', () => {
  const routes = new Set(routeTrongQuyen());
  const mồCôi = [];

  for (const page of tatCaPage()) {
    const rel = path
      .relative(APP_DIR, page)
      .replace(/\\/g, '/')
      .replace(/\/?page\.tsx$/, '')
      .replace(/\/$/, '');
    const route = rel === 'page' ? '/' : `/${rel}`;
    if (route === '/dang-nhap') continue;
    if (!routes.has(route)) mồCôi.push(route);
  }

  assert.deepEqual(mồCôi, [], `page mồ côi: ${mồCôi.join(', ')}`);
});

test('7. route ẩn khỏi menu vẫn được guard quyền và còn trong tìm nhanh', () => {
  // Dùng MENU đã parse (hiểu virtual group), không dùng regex mong manh.
  const an = MENU.filter((m) => m.an).map((m) => m.path);
  assert.deepEqual(an.sort(), ['/giao-dich-ton-kho', '/nhat-ky-kiem-toan']);

  // Hai route HIDE_FROM_MENU: ledger tồn kho + audit log.
  assert.match(quyen, /muc\('\/giao-dich-ton-kho', 'Ledger tồn kho', \['kho\.xem'\], 'kho-van', \{\s*hienThiMenu: false,/);
  assert.match(quyen, /muc\('\/nhat-ky-kiem-toan', 'Audit Log', \['audit\.xem'\], 'he-thong', \{\s*hienThiMenu: false,/);

  // Guard phải lọc theo ROUTE_ADMIN (đã bỏ mục nhóm ảo), không lọc theo menu.
  assert.match(quyen, /export const ROUTE_ADMIN = DIEU_HUONG_ADMIN\.filter\(laRoute\);/);
  assert.match(quyen, /export function timMucAdmin[\s\S]*ROUTE_ADMIN\.find/);
  assert.match(quyen, /coTruyCapDuongDanAdmin[\s\S]*timMucAdmin\(pathname\)/);

  // Ô tìm nhanh dùng ROUTE_ADMIN (gồm route ẩn), không dùng cây menu.
  assert.match(shell, /ROUTE_ADMIN\.filter\(\(item\) => coQuyenMoMucAdmin/);
});

test('8. cây menu không chôn route: mục con được nâng lên cấp 1 khi cha không được phép', () => {
  assert.match(quyen, /if \(cha\) continue;\s*goc\.push\(taoNode\(mucHienTai\)\);/);
  // Menu nhóm ảo không được render Link (không phải route).
  assert.match(shell, /isRoute \? \(\s*<Link href=\{node\.muc\.path\}>/);
});

test('9. mục nhóm ảo bị loại khỏi guard quyền', () => {
  assert.match(quyen, /function laRoute\([\s\S]*chiMenu !== true/);
  assert.match(quyen, /duongDanDauTienAdmin[\s\S]*ROUTE_ADMIN\.find/);
});

// ── 3. Tính đúng đắn của cây menu (dùng MENU đã parse ở trên) ──

test('10. KHÔNG mục nào tự làm cha của chính nó', () => {
  // Lỗi đã xảy ra thật: `menuCha` trỏ về `path` ⇒ `taoNode` đệ quy vô hạn ⇒
  // toàn bộ Admin render "This page couldn't load" (Maximum call stack).
  const tuThamChieu = MENU.filter((m) => m.cha === m.path);
  assert.deepEqual(tuThamChieu.map((m) => m.path), [], 'mục tự tham chiếu cha sẽ treo cây menu');
});

test('11. KHÔNG có vòng menu', () => {
  const theoPath = new Map(MENU.map((m) => [m.path, m]));

  for (const muc of theoPath.values()) {
    const chuoi = [muc.path];
    let hienTai = muc;
    while (hienTai?.cha) {
      assert.ok(!chuoi.includes(hienTai.cha), `vòng menu: ${[...chuoi, hienTai.cha].join(' → ')}`);
      chuoi.push(hienTai.cha);
      hienTai = theoPath.get(hienTai.cha);
    }
  }
});

test('12. mọi menuCha đều trỏ tới một route có thật', () => {
  const routes = new Set(MENU.map((m) => m.path));
  const treo = MENU.filter((m) => m.cha && !routes.has(m.cha));

  assert.deepEqual(treo.map((m) => `${m.path} → ${m.cha}`), [], 'menuCha trỏ tới route không tồn tại');
});

test('13. đúng 2 route HIDE_FROM_MENU, và không mục nào bị gắn dưới chúng', () => {
  const an = MENU.filter((m) => m.an).map((m) => m.path);
  assert.deepEqual(an.sort(), ['/giao-dich-ton-kho', '/nhat-ky-kiem-toan']);

  for (const muc of MENU) {
    if (!muc.cha) continue;
    assert.equal(an.includes(muc.cha), false, `${muc.path} bị gắn dưới route ẩn ${muc.cha}`);
  }
});

test('14. 4 nhóm menu giữ đúng nhãn nghiệm thu', () => {
  for (const nhan of [
    'Thương mại điện tử',
    'Nguồn cung & chất lượng',
    'Kho & truy xuất',
    'Tài chính & hệ thống',
  ]) {
    assert.ok(shell.includes(`label: '${nhan}'`), `thiếu nhóm menu: ${nhan}`);
  }
});
