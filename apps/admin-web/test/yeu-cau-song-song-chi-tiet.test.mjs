/**
 * Regression: bỏ waterfall ở màn chi tiết KHÔNG được đánh đổi bằng việc mất
 * toàn bộ màn hình khi một request PHỤ hỏng.
 *
 * AGRIMARKET-ADMIN-REQUEST-WATERFALL-V1
 *
 * Trước khi bỏ waterfall: `layChiTiet()` được `await` riêng và `setChiTiet()`
 * chạy TRƯỚC khi gọi danh sách liên quan ⇒ danh sách phụ lỗi vẫn giữ được
 * màn chi tiết. Khi gộp tất cả vào `Promise.all` trần, một request phụ reject
 * làm cả `Promise.all` reject ⇒ `catch` ⇒ `setChiTiet` KHÔNG chạy ⇒ người dùng
 * mất trắng màn chi tiết dù request chính đã thành công.
 *
 * Policy chuẩn (đã áp ở trang-trai/nha-cung-cap, áp lại cho mua-vu/thu-hoach/
 * lo-san-pham):
 * 1. Request CHÍNH bắt buộc thành công — không bọc `.catch`, để lỗi nổi lên
 *    `catch` và hiện `message.error`.
 * 2. Request PHỤ bọc `.catch(...)` — lỗi hạ về `null` thay vì làm hỏng cả
 *    `Promise.all`.
 * 3. State phụ phải LUÔN có giá trị kết thúc (`?? []`), không đọc thẳng
 *    `x.duLieu` trên biến có thể `null`, và không để lại `null` — vì `null` là
 *    sentinel "đang tải" ở các màn này, giữ nguyên `null` khiến bảng mắc vô
 *    hạn ở "Đang tải...".
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const docApp = (rel) =>
  fs.readFileSync(path.resolve(process.cwd(), `apps/admin-web/src/app/${rel}`), 'utf-8');

/** Thân `moChiTiet` — nơi duy nhất được phép song song hoá. */
function moChiTiet(rel) {
  const src = docApp(rel);
  const start = src.indexOf('const moChiTiet = async (id: string) => {');
  assert.notEqual(start, -1, `${rel}: không tìm thấy moChiTiet`);
  const end = src.indexOf('\n  };', start);
  assert.notEqual(end, -1, `${rel}: không tìm thấy điểm kết thúc moChiTiet`);
  return src.slice(start, end);
}

const CASES = [
  { rel: 'mua-vu/page.tsx', phu: ['layDanhSachNhatKy', 'layDanhSachThuHoach'] },
  { rel: 'thu-hoach/page.tsx', phu: ['layDanhSachLo'] },
  { rel: 'lo-san-pham/page.tsx', phu: ['layDanhSachTonKho', 'layDanhSachKiemDinh'] },
  {
    rel: 'trang-trai/page.tsx',
    phu: ['layDanhSachChungNhan', 'layDanhSachMuaVu', 'layDanhSachSanPham'],
  },
  { rel: 'nha-cung-cap/page.tsx', phu: ['layDanhSachTrangTrai'] },
];

test('mọi màn chi tiết: request chính đứng đầu Promise.all và KHÔNG bị nuốt lỗi', () => {
  for (const { rel } of CASES) {
    const khoi = moChiTiet(rel);
    // Phần tử đầu của Promise.all là `layChiTiet(id)` và không kèm `.catch`.
    assert.match(
      khoi,
      /Promise\.all\(\[\s*\n\s*layChiTiet\(id\)\s*,/,
      `${rel}: layChiTiet(id) phải là phần tử đầu của Promise.all`,
    );
    assert.doesNotMatch(
      khoi,
      /layChiTiet\(id\)\s*\.catch/,
      `${rel}: KHÔNG được nuốt lỗi request chính`,
    );
    // Đường báo lỗi cho request chính phải còn nguyên.
    assert.match(khoi, /catch \(error\)/, `${rel}: phải còn catch`);
    assert.match(khoi, /message\.error\(/, `${rel}: lỗi chính phải hiện qua message.error`);
  }
});

test('mọi màn chi tiết: request phụ đều bọc .catch nên không làm hỏng cả Promise.all', () => {
  for (const { rel, phu } of CASES) {
    const khoi = moChiTiet(rel);
    for (const ten of phu) {
      assert.ok(khoi.includes(ten), `${rel}: không thấy ${ten} trong moChiTiet`);
      // Lời gọi request phụ phải kết thúc bằng `.catch(`.
      assert.match(
        khoi,
        new RegExp(`${ten}\\([\\s\\S]{0,400}?\\)\\s*\\.catch\\s*\\(`),
        `${rel}: ${ten} (request phụ) phải bọc .catch`,
      );
    }
  }
});

/** 3 màn dùng sentinel `null` cho state phụ — phải hạ về `[]` khi request lỗi. */
const BA_MAN_NULL = ['mua-vu/page.tsx', 'thu-hoach/page.tsx', 'lo-san-pham/page.tsx'];

test('3 màn sentinel `null`: không đọc thẳng .duLieu trên biến phụ có thể null', () => {
  for (const rel of BA_MAN_NULL) {
    const khoi = moChiTiet(rel);
    // Dạng cũ `setX(lots.duLieu)` sẽ ném TypeError khi request phụ rơi về null.
    assert.doesNotMatch(
      khoi,
      /set[A-Z]\w*\(\w+\.duLieu\)/,
      `${rel}: phải dùng \`x?.duLieu ?? []\`, không đọc thẳng \`x.duLieu\``,
    );
  }
});

test('3 màn sentinel `null`: luôn gán giá trị kết thúc, không mắc "Đang tải..." vô hạn', () => {
  for (const rel of BA_MAN_NULL) {
    const khoi = moChiTiet(rel);
    // Ít nhất một state phụ phải hạ về `[]` khi request lỗi.
    assert.match(
      khoi,
      /set[A-Z]\w*\(\w+\?\.duLieu \?\? \[\]\)/,
      `${rel}: thiếu mẫu setX(x?.duLieu ?? [])`,
    );
    // Và phải báo cho người dùng biết phần phụ đã hỏng, không hiển thị nhầm
    // "Chưa có dữ liệu" như thể dữ liệu thật sự rỗng.
    assert.match(khoi, /message\.warning\(/, `${rel}: phải cảnh báo khi dữ liệu phụ lỗi`);
  }
});

test('2 màn dùng sentinel `[]`: đọc .duLieu phải được bảo vệ bằng `if (x)`', () => {
  for (const { rel } of [
    { rel: 'trang-trai/page.tsx' },
    { rel: 'nha-cung-cap/page.tsx' },
  ]) {
    const khoi = moChiTiet(rel);
    for (const dong of [...khoi.matchAll(/set[A-Z]\w*\((\w+)\.duLieu\)/g)]) {
      assert.match(
        khoi,
        new RegExp(`if \\(${dong[1]}\\)`),
        `${rel}: set(${dong[1]}.duLieu) phải được bảo vệ bằng \`if (${dong[1]})\``,
      );
    }
  }
});
