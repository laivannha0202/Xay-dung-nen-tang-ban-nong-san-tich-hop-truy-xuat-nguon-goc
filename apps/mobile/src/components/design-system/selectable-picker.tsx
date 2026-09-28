/**
 * Select có tìm kiếm cho Mobile — native thay thế Mantine `Select` của Web.
 *
 * Vì sao cần
 * ----------
 * Customer Web dùng `<Select searchable />`: bình thường chỉ hiện 1 field,
 * bấm vào mới mở danh sách option, chọn xong đóng. Mobile trước đây render
 * thẳng danh sách xã/phường (khoảng 20 mục) và cả danh sách thôn/tổ dân phố
 * xuống trong form, làm form bị đổ nội dung ngay khi vừa mở.
 *
 * Kiến trúc: KHÔNG tự mở Modal
 * ---------------------------
 * Bản đầu tiên cho `SelectablePickerMobile` tự bọc một bottom-sheet `Modal`.
 * Vì màn hình sổ địa chỉ đã mở form trong một `Modal` khác, việc lồng hai
 * native Modal sinh ra đúng những lỗi người dùng gặp phải:
 *   - `animationType="slide"` kéo cả vùng nhìn, giống màn hình bị nhảy lên;
 *   - nền tối `bg-black/40` làm form địa chỉ phía sau lọt ra, đọc như sheet
 *     gãy chứ không phải một màn hình chọn;
 *   - `autoFocus` bật bàn phím ngay khi mở, đẩy layout lúc vừa vào;
 *   - hai tầng Modal trên Android làm nút Back bắt nhầm tầng.
 *
 * Nên component được tách làm hai phần, **không component nào tự mở Modal**:
 *
 *   `SelectablePickerMobile` — chỉ là field (nút + label + helper). Bấm vào gọi
 *                             `onOpen()`; màn hình chủ quyết định mở gì.
 *   `SelectablePickerScreen` — nội dung selector full-screen: header cố định,
 *                             ô tìm kiếm cố định, `FlatList` chiếm phần còn
 *                             lại. Không có backdrop, không bottom sheet.
 *
 * Màn hình chủ render **một** `Modal presentationStyle="fullScreen"` duy nhất và
 * đổi nội dung bằng state ⇒ không còn nested native Modal nào, selector phủ kín
 * màn hình nên không nhìn thấy form phía sau, và trạng thái form được giữ nguyên
 * vì cùng nằm trong một cây component.
 *
 * Ghi chú kỹ thuật
 * ----------------
 * - `FlatList` virtualize 104 xã/phường, không render toàn bộ bằng `map`.
 * - Ô tìm kiếm **không** `autoFocus`: người dùng bấm mới mở bàn phím.
 * - Không hiện dòng đếm "104 / 104 mục" — chi tiết kỹ thuật, gây nhiễu.
 * - Không thêm thư viện mới.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chuanHoaTenDiaBanMobile } from '@/lib/dia-ban-chuan-hoa';

export type PickerOptionMobile = {
  value: string;
  label: string;
  /** Chuỗi phụ để tìm kiếm (ví dụ mã địa bàn). Mặc định lấy `label`. */
  timThem?: string;
};

const CHIEU_CAO_FIELD = 48;
const CHIEU_CAO_OPTION = 48;
const CHIEU_CAO_NUT = 44;

/** Lọc option theo từ khoá đã chuẩn hoá (không dấu). Dùng chung field/screen. */
export function locPickerOptionMobile(
  options: PickerOptionMobile[],
  tuKhoa: string,
): PickerOptionMobile[] {
  const tuKhoaChuanHoa = chuanHoaTenDiaBanMobile(tuKhoa);
  if (!tuKhoaChuanHoa) return options;
  return options.filter((option) => {
    const nhan = chuanHoaTenDiaBanMobile(option.label);
    const phu = chuanHoaTenDiaBanMobile(option.timThem ?? '');
    return nhan.includes(tuKhoaChuanHoa) || phu.includes(tuKhoaChuanHoa);
  });
}

type SelectablePickerMobileProps = {
  label: string;
  value: string;
  options: PickerOptionMobile[];
  placeholder: string;
  /** Nội dung hiển thị khi chưa chọn (thay placeholder nếu muốn). */
  placeholderChuaChon?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Dòng phụ dưới field (ví dụ "Chọn xã/phường trước"). */
  helperText?: string;
  accessibilityLabel?: string;
  /** Mở selector. Component KHÔNG tự quyết định mở bằng cách nào. */
  onOpen: () => void;
};

/**
 * Field dạng select — hiển thị giá trị đã chọn hoặc placeholder, bấm để mở
 * selector. Không chứa Modal, không chứa state mở/đóng.
 */
export function SelectablePickerMobile({
  label,
  value,
  options,
  placeholder,
  placeholderChuaChon,
  required = false,
  disabled = false,
  loading = false,
  helperText,
  accessibilityLabel,
  onOpen,
}: SelectablePickerMobileProps) {
  const daChon = options.find((option) => option.value === value);
  const hienThi = daChon?.label ?? (placeholderChuaChon ?? placeholder);
  const nhanTienTruong = required ? `${label} *` : label;
  const khoa = disabled || loading;

  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-[#374151]">{nhanTienTruong}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `${nhanTienTruong}: ${hienThi}`}
        accessibilityHint="Mở danh sách lựa chọn"
        accessibilityState={{ disabled: khoa }}
        disabled={khoa}
        onPress={onOpen}
        className={[
          'min-h-[48px] flex-row items-center justify-between gap-2 rounded-xl border bg-white px-3.5',
          khoa ? 'border-[#E5E7EB] bg-[#F9FAFB]' : 'border-[#E5E7EB] active:opacity-80',
        ].join(' ')}
        style={{ minHeight: CHIEU_CAO_FIELD }}
      >
        <Text
          numberOfLines={1}
          className={
            daChon
              ? 'flex-1 text-[15px] text-[#111827]'
              : 'flex-1 text-[15px] text-[#9CA3AF]'
          }
        >
          {loading ? 'Đang tải...' : hienThi}
        </Text>
        <Ionicons
          name="chevron-down"
          size={17}
          color={khoa ? '#C7CDD9' : '#6B7280'}
        />
      </Pressable>

      {helperText ? (
        <Text className="text-[12px] leading-[18px] text-[#9CA3AF]">{helperText}</Text>
      ) : null}
    </View>
  );
}

type SelectablePickerScreenProps = {
  /** Tiêu đề header, ví dụ "Chọn xã/phường". */
  title: string;
  searchPlaceholder: string;
  value: string;
  options: PickerOptionMobile[];
  /** Chọn xong: cập nhật giá trị rồi quay lại màn trước. */
  onSelect: (value: string) => void;
  /** Đóng selector mà không chọn (nút back, nút đóng, phím Back Android). */
  onClose: () => void;
};

/**
 * Selector full-screen. Được render bên trong `Modal presentationStyle="fullScreen"`
 * của màn hình chủ — phủ kín màn hình nên không có gì lọt ra phía sau.
 *
 * Bố cục: header cố định → ô tìm kiếm cố định → `FlatList` chiếm phần còn lại.
 */
export function SelectablePickerScreen({
  title,
  searchPlaceholder,
  value,
  options,
  onSelect,
  onClose,
}: SelectablePickerScreenProps) {
  const [tuKhoa, setTuKhoa] = useState('');

  const ketQuaLoc = useMemo(
    () => locPickerOptionMobile(options, tuKhoa),
    [options, tuKhoa],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header cố định — không cuộn theo danh sách. */}
      <View className="flex-row items-center gap-1 border-b border-[#E5E7EB] px-2 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quay lại, đóng ${title.toLowerCase()}`}
          accessibilityHint="Quay lại màn hình trước"
          onPress={onClose}
          hitSlop={8}
          style={{ minWidth: CHIEU_CAO_NUT, minHeight: CHIEU_CAO_NUT }}
          className="flex-row items-center justify-center gap-0.5 rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
          <Text numberOfLines={1} className="text-[16px] font-semibold text-[#111827]">
            {title}
          </Text>
        </Pressable>
      </View>

      {/* Ô tìm kiếm cố định. KHÔNG autoFocus — bấm mới mở bàn phím, tránh
          layout nhảy lúc vừa vào selector. */}
      <View className="border-b border-[#F3F4F6] px-4 pb-3 pt-2">
        <View className="min-h-[44px] flex-row items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3">
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            value={tuKhoa}
            onChangeText={setTuKhoa}
            placeholder={searchPlaceholder}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={searchPlaceholder}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="min-h-[44px] flex-1 text-[15px] text-[#111827]"
          />
          {tuKhoa ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá tìm kiếm"
              onPress={() => setTuKhoa('')}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center"
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Danh sách chiếm hết phần còn lại; virtualize cho 104 xã/phường.
          KeyboardAvoidingView chỉ bọc riêng list (iOS) nên header + ô tìm kiếm
          không bị đẩy khi bàn phím mở. */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={ketQuaLoc}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <Text className="px-4 py-10 text-center text-[14px] text-[#6B7280]">
              Không tìm thấy dữ liệu phù hợp.
            </Text>
          }
          renderItem={({ item }) => {
            const selected = item.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, selected }}
                accessibilityLabel={item.label}
                onPress={() => onSelect(item.value)}
                className={[
                  'min-h-[48px] flex-row items-center justify-between gap-3 border-b border-[#F3F4F6] px-4 active:opacity-70',
                  selected ? 'bg-[#F2F8F4]' : 'bg-white',
                ].join(' ')}
                style={{ minHeight: CHIEU_CAO_OPTION }}
              >
                <Text
                  numberOfLines={2}
                  className={
                    selected
                      ? 'flex-1 text-[15px] font-semibold text-[#0B7A48]'
                      : 'flex-1 text-[15px] text-[#111827]'
                  }
                >
                  {item.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={19} color="#0B7A48" />
                ) : null}
              </Pressable>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export type { SelectablePickerMobileProps, SelectablePickerScreenProps };
