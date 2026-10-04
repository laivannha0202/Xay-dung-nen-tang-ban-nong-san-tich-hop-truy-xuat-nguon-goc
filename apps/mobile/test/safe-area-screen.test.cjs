'use strict';

/**
 * Chốt lỗi giao diện: `className` trên `SafeAreaView` của
 * react-native-safe-area-context bị uniwind bỏ qua âm thầm.
 *
 * uniwind chỉ patch component của react-native (metro resolver ánh xạ
 * `react-native` -> `uniwind/components`). Mọi màn hình trước đây viết
 * `<SafeAreaView className="flex-1 bg-white">` nên trên máy thật:
 *   - SafeAreaView co theo nội dung (không lấp đầy vùng an toàn, không có nền),
 *   - khối `flex-1 justify-center` bên trong cao 0 px nên thẻ trạng thái rỗng
 *     tràn ngược lên đè thanh logo, tiêu đề/mô tả biến mất.
 *
 * Nay tất cả màn dùng `SafeAreaScreen` (ghim `flex: 1` bằng style thật rồi mới
 * áp className). Test dưới đây chặn tái phát: không được import trực tiếp
 * SafeAreaView của thư viện nữa, và khối chữ của EmptyState/ErrorState phải đi
 * qua className để không bị co về 0.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');
const mobileSrc = path.join(repoRoot, 'apps/mobile/src');
const wrapperPath = 'apps/mobile/src/components/layout/safe-area-screen.tsx';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function walk(dir, ext) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

const tsxFiles = walk(mobileSrc, '.tsx');
const relativeTsx = tsxFiles.map((file) => path.relative(repoRoot, file).split(path.sep).join('/'));

test('SafeAreaScreen is the only module allowed to use react-native-safe-area-context', () => {
  const offenders = relativeTsx.filter((file) => {
    if (file === wrapperPath) return false;
    return read(file).includes("from 'react-native-safe-area-context'");
  });

  assert.deepEqual(
    offenders,
    [],
    `Màn hình phải dùng SafeAreaScreen, không import SafeAreaView trực tiếp: ${offenders.join(', ')}`,
  );
  assert.equal(tsxFiles.length > 20, true, 'Expected the Mobile app to still contain screens');
});

test('SafeAreaScreen pins flex:1 with a real style on both layers', () => {
  const wrapper = read(wrapperPath);

  assert.equal(wrapper.includes('flex: 1'), true, 'Wrapper must pin flex: 1 with a plain style');
  // SafeAreaView ngoài cùng nhận style thật, className rơi vào View con.
  assert.match(wrapper, /<SafeAreaView[^>]*style=\{styles\.lapDay\}/s);
  assert.match(wrapper, /<View className=\{className\}/s);
});

test('No screen relies on a bare SafeAreaScreen without full-height styling', () => {
  const offenders = [];

  for (const file of relativeTsx) {
    const source = read(file);
    if (!source.includes('<SafeAreaScreen')) continue;

    const usages = source.match(/<SafeAreaScreen[^>]*>/g) ?? [];
    for (const usage of usages) {
      const coLapDay =
        /className="[^"]*\bflex-1\b/.test(usage) || /style=\{\{[^}]*flex:\s*1/.test(usage);
      if (!coLapDay) offenders.push(`${file}: ${usage.replace(/\s+/g, ' ')}`);
    }
  }

  assert.deepEqual(offenders, [], `Màn phải lấp đầy vùng an toàn: ${offenders.join(' | ')}`);
});

test('EmptyState/ErrorState render title and description through className', () => {
  const source = read('apps/mobile/src/components/design-system/empty-error.tsx');

  assert.equal(source.includes('>{title}</Text>'), true);
  assert.equal(source.includes('>{description}</Text>'), true);
  // style inline từng làm khối chữ bị co về 0 khi thẻ cha bị ép chiều cao.
  assert.equal(
    /<Text[^>]*\sstyle=\{\{/.test(source),
    false,
    'Text trong EmptyState/ErrorState phải style bằng className',
  );
});
