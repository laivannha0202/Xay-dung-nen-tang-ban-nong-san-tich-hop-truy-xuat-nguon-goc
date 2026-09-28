'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/**
 * Cắt riêng phần nội dung form địa chỉ trong `dia-chi.tsx`.
 * Trang sổ địa chỉ còn dùng `rounded-2xl` / `EAF7EF` cho card danh sách — đó là
 * ngoài phạm vi form nên không được dùng chung kết luận với form.
 */
function readForm() {
  const source = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const batDau = source.indexOf('const noiDungForm = (');
  const ketThuc = source.indexOf('function setField<');
  assert.ok(batDau >= 0 && ketThuc > batDau, 'Không tìm thấy khối noiDungForm');
  return source.slice(batDau, ketThuc);
}

function loadTsModule(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: filename,
  }).outputText;

  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

const diaBan = loadTsModule('apps/mobile/src/lib/dia-ban-chuan-hoa.ts');

// ---------------------------------------------------------------------------
// 1. Form KHÔNG được đổ danh sách xã/thôn xuống dưới
// ---------------------------------------------------------------------------

test('Address form không render danh sách xã/phường hay thôn/TDP trong form', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const form = readForm();

  // Trước đây form render `xaPhuongLoc.map(...)` và `danhSachThon.map(...)`
  // trực tiếp, khiến ~20 xã đổ sẵn xuống màn hình khi vừa mở form.
  assert.equal(diaChi.includes('xaPhuongLoc'), false);
  assert.equal(diaChi.includes('slice(0, 20)'), false);

  // `danhSachThon` giờ chỉ còn được map thành option cho picker, nằm NGOÀI khối
  // form. Form không được map danh sách ra giao diện.
  assert.equal(form.includes('.map('), false, 'Form không được map danh sách ra giao diện');
  assert.equal(form.includes('danhSachThon'), false, 'Form không được đụng danh sách thôn thô');

  // Cả hai trường địa bàn phải đi qua picker có tìm kiếm.
  const pickerUsages = form.match(/<SelectablePickerMobile/g) ?? [];
  assert.equal(pickerUsages.length, 2, 'Cần đúng 2 picker: Xã/Phường và Thôn/Tổ dân phố');
});

test('Xã/Phường và Thôn/Tổ dân phố dùng chung component picker có tìm kiếm', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  assert.equal(diaChi.includes('label="Xã/Phường"'), true);
  assert.equal(diaChi.includes('label="Thôn/Tổ dân phố"'), true);
  assert.equal(diaChi.includes("from '@/components/design-system'"), true);

  // Picker phải mở Modal, tìm kiếm, và dùng FlatList để virtualize.
  assert.equal(picker.includes('<Modal'), true);
  assert.equal(picker.includes('<FlatList'), true);
  assert.equal(picker.includes('chuanHoaTenDiaBanMobile'), true);
  assert.equal(picker.includes('KeyboardAvoidingView'), true);
  assert.equal(picker.includes('SafeAreaView'), true);

  // Không được render toàn bộ danh sách bằng .map trong picker.
  assert.equal(/\{\s*\w+\.map\(/.test(picker.split('renderItem')[0].split('data=')[1] ?? ''), false);
});

test('Field picker đóng lại sau khi chọn và hiển thị nhãn đã chọn', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  // Chọn option => cập nhật value + đóng modal.
  assert.match(picker, /function chon\(option[\s\S]*onChange\(option\.value\);[\s\S]*setMo\(false\);/);

  // Field hiển thị label của option đang chọn, placeholder khi chưa chọn.
  assert.match(picker, /const daChon = options\.find\(/);
  assert.match(picker, /const hienThi = daChon\?\.label/);
});

// ---------------------------------------------------------------------------
// 2. Thôn/Tổ dân phố: trạng thái chưa chọn xã / đang tải / không có dữ liệu
// ---------------------------------------------------------------------------

test('Thôn/Tổ dân phố disabled trước khi chọn xã và bắt buộc khi xã có dữ liệu', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  // Disabled khi chưa chọn xã hoặc đang tải danh sách thôn.
  assert.match(diaChi, /disabled=\{!form\.xaPhuongMa \|\| dangTaiThon\}/);
  assert.match(diaChi, /loading=\{dangTaiThon\}/);

  // Placeholder phản ánh đúng 3 trạng thái.
  assert.match(diaChi, /placeholderChuaChon=\{form\.xaPhuongMa \? undefined : 'Chọn xã\/phường trước'\}/);

  // Business rule giữ nguyên: xã có dữ liệu thôn => thôn bắt buộc.
  assert.match(diaChi, /required=\{luaChonThon\.length > 0\}/);
  assert.match(diaChi, /if \(danhSachThon\.length > 0 && !form\.thonToDanPhoMa\)/);
  assert.match(diaChi, /throw new Error\('Vui lòng chọn thôn\/tổ dân phố\.'\)/);

  // Helper cho trường hợp xã chưa có dữ liệu thôn.
  assert.match(
    diaChi,
    /Danh sách thôn\/tổ dân phố của khu vực này đang được cập nhật\./,
  );
});

test('Đổi xã sẽ reset thôn/tổ dân phố', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(
    diaChi,
    /if \(key === 'xaPhuongMa' && value !== current\.xaPhuongMa\) \{[\s\S]*thonToDanPhoMa: ''/,
  );
});

// ---------------------------------------------------------------------------
// 3. Bỏ interaction "Đổi" riêng, dùng select pattern chuẩn
// ---------------------------------------------------------------------------

test('Bỏ khối chọn xã dạng "Đổi" và nút lưu có icon trang trí', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const form = readForm();

  // Pattern select chuẩn: đã chọn xã thì field hiện nhãn + chevron, bấm lại để
  // đổi xã. Không còn khối xanh "Đổi" riêng.
  assert.equal(diaChi.includes('Chọn lại xã phường'), false);
  assert.equal(form.includes('>Đổi<'), false);
  assert.equal(form.includes('EAF7EF'), false);
  assert.equal(form.includes('rounded-2xl'), false);
  assert.equal(form.includes('save-outline'), false);
  assert.equal(form.includes('(cố định)'), false);

  // Icon trang trí trước mọi label đã bị bỏ.
  for (const icon of ['person-outline', 'call-outline', 'business-outline', 'navigate-outline', 'home-outline']) {
    assert.equal(form.includes(icon), false, `Còn icon trang trí trong form: ${icon}`);
  }
});

// ---------------------------------------------------------------------------
// 4. Parity hierarchy + terminology với Customer Web
// ---------------------------------------------------------------------------

test('Mobile và Web dùng cùng terminology cho form địa chỉ', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  const nhan = [
    'Tên người nhận',
    'Số điện thoại',
    'Tỉnh',
    'Xã/Phường',
    'Thôn/Tổ dân phố',
    'Địa chỉ chi tiết',
    'Đặt làm địa chỉ mặc định',
    'Hủy',
    'Lưu địa chỉ',
  ];

  for (const label of nhan) {
    assert.equal(diaChi.includes(label), true, `Mobile thiếu: ${label}`);
    assert.equal(web.includes(label), true, `Web thiếu: ${label}`);
  }
});

test('Thứ tự field Mobile khớp Web (Mobile chỉ thu 1 cột)', () => {
  const form = readForm();
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  const thuTu = (source) => {
    const markers = [
      'Tên người nhận',
      'Số điện thoại',
      'Tỉnh',
      'Xã/Phường',
      'Thôn/Tổ dân phố',
      'Địa chỉ chi tiết',
      'Đặt làm địa chỉ mặc định',
      'Hủy',
      'Lưu địa chỉ',
    ];
    const viTri = markers.map((m) => source.indexOf(m));
    assert.equal(
      viTri.every((p) => p >= 0),
      true,
      `Thiếu nhãn: ${markers.filter((_, i) => viTri[i] < 0).join(', ')}`,
    );
    return viTri;
  };

  const a = thuTu(form);
  const b = thuTu(web);
  for (let i = 1; i < a.length; i += 1) {
    assert.equal(a[i] > a[i - 1], true, `Thứ tự field Mobile sai tại vị trí ${i}`);
    assert.equal(b[i] > b[i - 1], true, `Thứ tự field Web sai tại vị trí ${i}`);
  }
});

test('Cả hai nền tảng cùng giữ quy tắc chỉ giao hàng Hưng Yên', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  for (const source of [diaChi, web]) {
    assert.equal(
      source.includes('AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên.'),
      true,
    );
  }
  assert.equal(diaChi.includes('TINH_HUNG_YEN'), true);
  assert.equal(web.includes('TINH_HUNG_YEN'), true);
});

test('Cả hai nền tảng cùng gọi API địa bàn Hưng Yên, không hard-code danh sách', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  assert.equal(diaChi.includes('layDanhSachXaPhuongHungYenMobile'), true);
  assert.equal(diaChi.includes('layDanhSachThonToDanPhoMobile'), true);
  assert.equal(web.includes('layDanhSachXaPhuongHungYen'), true);
  assert.equal(web.includes('layDanhSachThonToDanPho'), true);

  // Không được nhúng danh sách xã/thôn cứng trong mã nguồn.
  assert.equal(/Xã A Sào/.test(diaChi), false);
  assert.equal(/Xã Ân Thi/.test(diaChi), false);
});

test('Nhãn xã/phường ghép giống Web (Phường/Xã + tên)', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  assert.match(diaChi, /nhanLoaiXaPhuongMobile\(item\.loai\)/);
  assert.match(web, /nhanLoaiXaPhuong\(item\.loai\)/);
  assert.equal(diaBan.nhanLoaiXaPhuongMobile('PHUONG'), 'Phường');
  assert.equal(diaBan.nhanLoaiXaPhuongMobile('XA'), 'Xã');
  assert.equal(diaBan.nhanLoaiXaPhuongMobile(''), 'Xã');
});

// ---------------------------------------------------------------------------
// 5. Tìm kiếm không dấu
// ---------------------------------------------------------------------------

test('Tìm kiếm địa bàn khớp cả ký tự có dấu lẫn không dấu', () => {
  const { chuanHoaTenDiaBanMobile } = diaBan;

  assert.equal(chuanHoaTenDiaBanMobile('Kiến Xương'), 'kien xuong');
  assert.equal(chuanHoaTenDiaBanMobile('Ân Thi'), 'an thi');
  assert.equal(chuanHoaTenDiaBanMobile('Đức Thọ'), 'duc tho');
  assert.equal(chuanHoaTenDiaBanMobile('Phường Quang Trung'), 'phuong quang trung');

  const duLieu = [
    { ten: 'Xã Kiến Xương' },
    { ten: 'Xã Ân Thi' },
    { ten: 'Thị trấn Văn Lâm' },
  ];
  const tim = (tuKhoa) => {
    const k = chuanHoaTenDiaBanMobile(tuKhoa);
    return duLieu.filter((item) => chuanHoaTenDiaBanMobile(item.ten).includes(k)).map((i) => i.ten);
  };

  assert.deepEqual(tim('kien xuong'), ['Xã Kiến Xương']);
  assert.deepEqual(tim('an thi'), ['Xã Ân Thi']);
  assert.deepEqual(tim('văn lâm'), ['Thị trấn Văn Lâm']);
  assert.deepEqual(tim('van lam'), ['Thị trấn Văn Lâm']);
  assert.deepEqual(tim('khong ton tai'), []);
});

test('Picker lọc trên cả nhãn và chuỗi phụ (mã/tên đầy đủ)', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  assert.match(picker, /const nhan = chuanHoaTenDiaBanMobile\(option\.label\);/);
  assert.match(picker, /const phu = chuanHoaTenDiaBanMobile\(option\.timThem \?\? ''\);/);
  assert.match(picker, /nhan\.includes\(tuKhoaChuanHoa\) \|\| phu\.includes\(tuKhoaChuanHoa\)/);
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------

test('Picker và option có accessibility role/label/touch target >= 44px', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  // Field = button, có hint và báo trạng thái disabled.
  assert.match(picker, /accessibilityRole="button"[\s\S]{0,400}accessibilityState=\{\{ disabled: disabled \|\| loading \}\}/);
  assert.match(picker, /accessibilityLabel=\{accessibilityLabel \?\? `\$\{nhanTienTruong\}: \$\{hienThi\}`\}/);
  assert.match(picker, /accessibilityHint="Mở danh sách lựa chọn"/);

  // Option = radio (chọn một) nên `checked` mới đúng ngữ nghĩa a11y.
  assert.match(picker, /accessibilityRole="radio"\s*accessibilityState=\{\{ checked: selected, selected \}\}/);

  // Touch target >= 44px cho field, ô tìm kiếm, option và nút đóng.
  assert.match(picker, /const CHIEU_CAO_FIELD = 48;/);
  assert.match(picker, /const CHIEU_CAO_OPTION = 48;/);
  assert.match(picker, /min-h-\[44px\]/);
  assert.match(picker, /className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"/);

  // Nút đóng selector luôn truy cập được.
  assert.match(picker, /accessibilityLabel=\{`Đóng \$\{nhanTienTruong\.toLowerCase\(\)\}`\}/);

  // Vùng nền đóng không được đọc như một nút full-screen.
  assert.match(picker, /importantForAccessibility="no"[\s\S]{0,120}className="flex-1"/);
});

test('Danh sách option cuộn được thay vì tràn khỏi sheet (FlatList phải co lại)', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  // 104 xã/phường x 48px = ~5000px: nếu FlatList không co lại theo
  // `maxHeight: '88%'` của sheet thì danh sách tràn ra ngoài và không cuộn.
  assert.match(picker, /style=\{\{ maxHeight: '88%' \}\}/);
  assert.match(
    picker,
    /<View style=\{\{ flexShrink: 1 \}\}>\s*<FlatList/,
    'FlatList phải nằm trong wrapper flexShrink: 1',
  );
  assert.match(picker, /style=\{\{ flexGrow: 0 \}\}/);
});

test('Form Mobile có accessibility cho checkbox mặc định và nút lưu', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(diaChi, /accessibilityLabel="Đặt làm địa chỉ mặc định"/);
  assert.match(diaChi, /accessibilityLabel="Lưu địa chỉ"/);
  assert.match(diaChi, /accessibilityLabel="Đóng biểu mẫu địa chỉ"/);
});

// ---------------------------------------------------------------------------
// 7. Form trong Modal, không đẩy danh sách địa chỉ
// ---------------------------------------------------------------------------

test('Form mở trong Modal riêng thay vì nằm inline trong danh sách', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(diaChi, /<Modal\s*\n\s*visible=\{formMo\}/);
  assert.match(diaChi, /suaId \? 'Sửa địa chỉ' : 'Thêm địa chỉ'/);
  assert.match(diaChi, /onRequestClose=\{dongForm\}/);
  assert.match(diaChi, /keyboardDismissMode="on-drag"/);

  // Không còn khối form inline trong ScrollView danh sách.
  assert.equal(/\{formMo \? \(\s*\n\s*<View className="gap-4 rounded-\[22px\]/.test(diaChi), false);
});

test('Tải danh sách xã chỉ chạy khi mở form, không chạy sẵn từ trang danh sách', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(
    diaChi,
    /useEffect\(\(\) => \{\s*\n\s*if \(!formMo\) return;\s*\n\s*setDangTaiXaPhuong\(true\);[\s\S]*?layDanhSachXaPhuongHungYenMobile\(\)/,
  );
  assert.match(diaChi, /if \(!formMo \|\| !form\.xaPhuongMa\) \{/);
});

test('Cả hai picker đều báo trạng thái đang tải thay vì hiện placeholder sai', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  // Xã/phường: khi sửa địa chỉ cũ, field không được nháy placeholder rồi mới
  // hiện tên đã lưu.
  assert.match(diaChi, /label="Xã\/Phường"[\s\S]{0,400}?loading=\{dangTaiXaPhuong\}/);
  // Thôn/TDP: đang tải thì hiện "Đang tải..." chứ không phải "Chọn xã trước".
  assert.match(diaChi, /loading=\{dangTaiThon\}/);
});

// ---------------------------------------------------------------------------
// 8. Business rules không bị phá
// ---------------------------------------------------------------------------

test('Giữ nguyên validate create/update address', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');
  const web = read('apps/customer-web/src/components/so-dia-chi-content.tsx');

  for (const source of [diaChi, web]) {
    assert.match(source, /ten\.length < 2 \|\| dong\.length < 3/);
    assert.match(source, /\/\^\[0-9\+\]\{9,20\}\$\/\.test\(phone\)/);
    assert.match(source, /if \(!form\.xaPhuongMa\)/);
    assert.match(source, /Vui lòng chọn xã\/phường thuộc tỉnh Hưng Yên\./);
  }
});

test('Giữ nguyên API create/update/delete/set-default', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.equal(diaChi.includes('taoDiaChiTaiKhoanMobile'), true);
  assert.equal(diaChi.includes('capNhatDiaChiTaiKhoanMobile'), true);
  assert.equal(diaChi.includes('xoaDiaChiTaiKhoanMobile'), true);
  assert.equal(diaChi.includes('datDiaChiMacDinhTaiKhoanMobile'), true);
  // Tỉnh luôn gửi Hưng Yên, không cho người dùng đổi.
  assert.match(diaChi, /tinhThanh: TINH_HUNG_YEN,/);
});
