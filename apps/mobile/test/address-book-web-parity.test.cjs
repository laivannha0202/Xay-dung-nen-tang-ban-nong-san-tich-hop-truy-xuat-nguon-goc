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

/**
 * Bỏ comment (`//` và `/** *\/`) để assert về hành vi chỉ nhìn vào code thật.
 * File picker có comment mô tả đúng những thứ đã bị gỡ (bottom sheet,
 * `bg-black/40`, `autoFocus`…) nên nếu đọc cả comment sẽ báo động giả.
 */
function boComment(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
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

  // Field (SelectablePickerMobile) + selector full-screen (SelectablePickerScreen).
  assert.equal(picker.includes('export function SelectablePickerMobile'), true);
  assert.equal(picker.includes('export function SelectablePickerScreen'), true);
  assert.equal(picker.includes('<FlatList'), true);
  assert.equal(picker.includes('chuanHoaTenDiaBanMobile'), true);
  assert.equal(picker.includes('KeyboardAvoidingView'), true);
  // SafeAreaView của react-native-safe-area-context không nhận className (uniwind
  // chỉ patch component react-native) nên màn selector dùng wrapper SafeAreaScreen.
  assert.equal(picker.includes('SafeAreaScreen'), true);
  assert.equal(picker.includes("from 'react-native-safe-area-context'"), false);

  // Không được render toàn bộ danh sách bằng .map trong picker.
  assert.equal(/\{\s*\w+\.map\(/.test(picker.split('renderItem')[0].split('data=')[1] ?? ''), false);
});

test('Field picker hiển thị nhãn đã chọn, chỉ gọi onOpen chứ không tự mở Modal', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  // Field hiển thị label của option đang chọn, placeholder khi chưa chọn.
  assert.match(picker, /const daChon = options\.find\(/);
  assert.match(picker, /const hienThi = daChon\?\.label/);

  // Bấm field chỉ gọi `onOpen`; quyết định mở gì thuộc màn hình chủ.
  assert.match(picker, /onPress=\{onOpen\}/);
  assert.equal(
    /onChange[(:]/.test(boComment(picker)),
    false,
    'Field không sở hữu onChange — không tự đóng selector',
  );
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

  // Field gọi onOpen, không tự mở gì.
  assert.match(diaChi, /label="Thôn\/Tổ dân phố"[\s\S]{0,600}onOpen=\{\(\) => setManHinhMo\('thon-to-dan-pho'\)\}/);
  assert.match(diaChi, /label="Xã\/Phường"[\s\S]{0,300}onOpen=\{\(\) => setManHinhMo\('xa-phuong'\)\}/);

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
  assert.match(picker, /accessibilityRole="button"[\s\S]{0,400}accessibilityState=\{\{ disabled: khoa \}\}/);
  assert.match(picker, /accessibilityLabel=\{accessibilityLabel \?\? `\$\{nhanTienTruong\}: \$\{hienThi\}`\}/);
  assert.match(picker, /accessibilityHint="Mở danh sách lựa chọn"/);

  // Option = radio (chọn một) nên `checked` mới đúng ngữ nghĩa a11y.
  assert.match(picker, /accessibilityRole="radio"\s*accessibilityState=\{\{ checked: selected, selected \}\}/);

  // Touch target >= 44px cho field, header, ô tìm kiếm và option.
  assert.match(picker, /const CHIEU_CAO_FIELD = 48;/);
  assert.match(picker, /const CHIEU_CAO_OPTION = 48;/);
  assert.match(picker, /const CHIEU_CAO_NUT = 44;/);
  assert.match(picker, /min-h-\[44px\]/);
  assert.match(picker, /style=\{\{ minWidth: CHIEU_CAO_NUT, minHeight: CHIEU_CAO_NUT \}\}/);

  // Header có nút quay lại luôn truy cập được.
  assert.match(picker, /accessibilityLabel=\{`Quay lại, đóng \$\{title\.toLowerCase\(\)\}`\}/);
});

test('Selector full-screen: không còn bottom sheet, overlay, autoFocus hay footer đếm', () => {
  const code = boComment(read('apps/mobile/src/components/design-system/selectable-picker.tsx'));
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  // Không còn kiểu bottom sheet: nền tối, justify-end, maxHeight 88%,
  // wrapper flexShrink, flexGrow 0, bo tròn đầu sheet.
  for (const mau of [
    'transparent',
    'justify-end',
    'bg-black/40',
    "maxHeight: '88%'",
    'flexShrink: 1',
    'flexGrow: 0',
    'rounded-t-2xl',
  ]) {
    assert.equal(code.includes(mau), false, `Picker còn kiểu bottom sheet: ${mau}`);
  }

  // Không tự mở Modal (tránh nested modal), không tự bật bàn phím, không trượt.
  assert.equal(/<Modal/.test(code), false, 'Picker không được tự mở Modal');
  assert.equal(/\bautoFocus\b/.test(code), false, 'Không autoFocus — bấm mới mở bàn phím');
  assert.equal(/animationType/.test(code), false, 'Picker không tự quyết định animation');

  // Không hiện dòng đếm "104 / 104 mục" cho người dùng.
  assert.equal(/mục/.test(code), false, 'Không hiện dòng đếm mục');

  // Cấu trúc full-screen: SafeAreaScreen flex 1 → header → search → FlatList flex 1.
  assert.match(
    code,
    /<SafeAreaScreen edges=\{\['top', 'bottom'\]\} style=\{\{ flex: 1, backgroundColor: '#FFFFFF' \}\}>/,
  );
  assert.match(code, /<FlatList[\s\S]{0,400}style=\{\{ flex: 1 \}\}/);

  // Modal duy nhất phải fullScreen + fade (không pageSheet/slide).
  assert.equal((diaChi.match(/<Modal/g) ?? []).length, 1, 'Phải chỉ có MỘT Modal native');
  assert.match(diaChi, /presentationStyle="fullScreen"/);
  assert.match(diaChi, /animationType="fade"/);
  assert.equal(diaChi.includes('presentationStyle="pageSheet"'), false);
  assert.equal(/animationType="slide"/.test(diaChi), false);
});

test('Header và ô tìm kiếm cố định, chỉ danh sách mới bị bàn phím đẩy', () => {
  const picker = read('apps/mobile/src/components/design-system/selectable-picker.tsx');

  // Header và ô tìm kiếm nằm NGOÀI KeyboardAvoidingView nên không bị nhảy.
  const kav = picker.indexOf('<KeyboardAvoidingView');
  const flatList = picker.indexOf('<FlatList');
  const searchInput = picker.indexOf('<TextInput');
  assert.ok(kav > 0 && flatList > kav, 'Phải có KeyboardAvoidingView bọc FlatList');
  assert.ok(
    searchInput < kav,
    'Ô tìm kiếm phải nằm trước KeyboardAvoidingView để không bị đẩy',
  );

  // Bàn phím mở vẫn chạm được option.
  assert.match(picker, /keyboardShouldPersistTaps="handled"/);
  assert.match(picker, /keyboardDismissMode="on-drag"/);
});

test('Nút Back Android không bắt nhầm tầng: selector về form, form mới đóng', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(diaChi, /onRequestClose=\{dangMoForm \? dongForm : quayLaiForm\}/);
});

test('Chọn xong trong selector quay lại form và giữ nguyên dữ liệu đã nhập', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  // Chọn => setField (cập nhật đúng field) rồi quay lại form.
  assert.match(
    diaChi,
    /function chonXaPhuong\(value: string\) \{\s*setField\('xaPhuongMa', value\);\s*quayLaiForm\(\);/,
  );
  assert.match(
    diaChi,
    /function chonThon\(value: string\) \{\s*setField\('thonToDanPhoMa', value\);\s*quayLaiForm\(\);/,
  );

  // Quay lại form KHÔNG reset form.
  assert.match(
    diaChi,
    /function quayLaiForm\(\) \{\s*setManHinhMo\('form'\);/,
  );

  // Cả hai selector dùng chung SelectablePickerScreen (không có sheet riêng).
  assert.equal((diaChi.match(/<SelectablePickerScreen/g) ?? []).length, 2);
  assert.match(
    diaChi,
    /<SelectablePickerScreen\s*\n\s*title=\{TIEU_DE_MAN_HINH\['xa-phuong'\]\}/,
  );
  assert.match(
    diaChi,
    /<SelectablePickerScreen\s*\n\s*title=\{TIEU_DE_MAN_HINH\['thon-to-dan-pho'\]\}/,
  );
});

test('Đóng form reset cả form lẫn màn hình đang hiện trong Modal', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(diaChi, /function dongForm\(\) \{[\s\S]{0,200}setManHinhMo\(null\);/);
  assert.match(diaChi, /const modalMo = manHinhMo !== null;/);
  assert.match(diaChi, /const dangMoForm = manHinhMo === 'form';/);
  assert.match(diaChi, /visible=\{modalMo\}/);
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

test('Form mở trong Modal full-screen thay vì nằm inline trong danh sách', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  assert.match(diaChi, /<Modal\s*\n\s*visible=\{modalMo\}/);
  assert.match(diaChi, /suaId \? 'Sửa địa chỉ' : 'Thêm địa chỉ'/);
  assert.match(diaChi, /keyboardDismissMode="on-drag"/);

  // Không còn khối form inline trong ScrollView danh sách.
  assert.equal(/\{formMo \? \(\s*\n\s*<View className="gap-4 rounded-\[22px\]/.test(diaChi), false);
});

test('Tải danh sách xã chạy khi mở form, giữ nguyên trong lúc selector đang mở', () => {
  const diaChi = read('apps/mobile/src/app/tai-khoan/dia-chi.tsx');

  // Chỉ tải khi Modal có mở; đang ở selector vẫn giữ list để quay lại form
  // không phải chờ tải lại.
  assert.match(
    diaChi,
    /useEffect\(\(\) => \{\s*\n\s*if \(manHinhMo === null\) return;\s*\n\s*setDangTaiXaPhuong\(true\);[\s\S]*?layDanhSachXaPhuongHungYenMobile\(\)/,
  );

  // Thôn: đang hiển thị selector thôn thì không tải lại và không xoá list.
  assert.match(diaChi, /if \(manHinhMo === 'thon-to-dan-pho'\) return;/);
  assert.match(diaChi, /if \(!modalMo \|\| !form\.xaPhuongMa\) \{/);
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
