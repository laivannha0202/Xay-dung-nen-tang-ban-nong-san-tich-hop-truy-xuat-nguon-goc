/**
 * Regression: guard phiên Admin Web phải có MỘT nguồn.
 *
 * Trước đây 25 trang tự lặp lại 4 biến thể của cùng một đoạn:
 *   `const [phien] = useState(() => layPhienAdmin())` + `useEffect(... router.replace('/dang-nhap'))`
 * và một nhánh riêng `coQuyen(...)` đọc thẳng `sessionStorage`.
 *
 * Hai lỗi thật sinh ra từ việc lặp đó:
 *   1. `useState(() => layPhienAdmin())` chỉ đọc sessionStorage MỘT LẦN lúc mount và
 *      KHÔNG nghe `SU_KIEN_HET_PHIEN_ADMIN` → khi access token hết hạn giữa phiên,
 *      layout có chuyển hướng nhưng các trang vẫn render dữ liệu cũ.
 *   2. `coQuyen()` không reactive theo cùng lý do → nút thao tác vẫn hiện.
 *
 * `usePhienAdmin()` gom cả hai. Test này khóa lại để trang mới không tự viết lại.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve(process.cwd(), 'apps/admin-web/src/app');
const LIB_DIR = path.resolve(process.cwd(), 'apps/admin-web/src/lib');

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

const pages = tatCaPage();
const doc = (p) => fs.readFileSync(p, 'utf-8');
const rel = (p) => path.relative(APP_DIR, p);

/** Bỏ comment để pattern trong chú thích không bị tính nhầm là code. */
const boComment = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('1. hook usePhienAdmin tồn tại và là nguồn duy nhất', () => {
  const hook = fs.readFileSync(path.join(LIB_DIR, 'use-phien-admin.ts'), 'utf-8');

  assert.match(hook, /export function usePhienAdmin\(\)/);
  // phải nghe sự kiện hết phiên, nếu không thì lỗi "render dữ liệu cũ" quay lại
  assert.match(hook, /SU_KIEN_HET_PHIEN_ADMIN/);
  assert.match(hook, /damBaoPhienAdmin\(\)/);
  // phải tự chuyển hướng khi không có phiên
  assert.match(hook, /router\.replace\('\/dang-nhap'\)/);
});

test('2. KHÔNG trang nào tự viết lại guard phiên', () => {
  const offenders = [];

  for (const p of pages) {
    const source = boComment(doc(p));
    const ten = rel(p);

    // trang đăng nhập không cần guard (nó CHÍNH LÀ nơi tạo phiên)
    if (ten === path.join('dang-nhap', 'page.tsx')) continue;

    if (/router\.replace\('\/dang-nhap'\)/.test(source)) {
      offenders.push(`${ten}: tự chuyển hướng — dùng usePhienAdmin()`);
    }

    if (/useState\(\(\) => layPhienAdmin\(\)\)/.test(source)) {
      offenders.push(`${ten}: đọc sessionStorage 1 lần lúc mount`);
    }

    if (/\bcoQuyen\(/.test(source)) {
      offenders.push(`${ten}: dùng coQuyen() — không reactive khi phiên hết hạn`);
    }
  }

  assert.deepEqual(offenders, [], `\n${offenders.join('\n')}\n`);
});

test('3. trang nào đọc phiên/quyền thì phải đi qua hook', () => {
  // Không phải mọi trang đều cần hook: các trang chỉ hiển thị dữ liệu công khai
  // hoặc đã bị layout chặn thì không cần. Bất biến cần khóa là: trang nào CÓ
  // đọc phiên/quyền thì phải đọc qua hook, không đọc sessionStorage trực tiếp.
  const thieu = [];

  for (const p of pages) {
    const ten = rel(p);
    if (ten === path.join('dang-nhap', 'page.tsx')) continue;

    const source = boComment(doc(p));
    const docQuyen = /phien|quyen|Quyen/.test(source);
    const dungHook = source.includes('usePhienAdmin()');

    if (docQuyen && !dungHook) thieu.push(ten);
  }

  assert.deepEqual(thieu, [], `có đọc phiên/quyền nhưng không dùng hook: ${thieu.join(', ')}`);
});

test('4. layout vẫn là nơi chặn quyền theo mục điều hướng', () => {
  const layout = doc(path.resolve(APP_DIR, '..', 'components', 'khung-quan-tri.tsx'));

  // hook chỉ quyết định "có phiên"; quyền theo route vẫn do layout chặn
  assert.match(layout, /coTruyCapDuongDanAdmin\(/);
  assert.match(layout, /duongDanDauTienAdmin\(/);
});
