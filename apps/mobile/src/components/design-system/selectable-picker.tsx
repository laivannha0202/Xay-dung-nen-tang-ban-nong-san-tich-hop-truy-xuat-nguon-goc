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
 * Component này giữ đúng semantics Web: field gọn → Modal → search → chọn.
 *
 * Ghi chú kỹ thuật
 * ----------------
 * - Dùng `FlatList` để virtualize: không render cả 104 xã bằng `map`.
 * - `KeyboardAvoidingView` + `keyboardShouldPersistTaps="handled"` để bàn phím
 *   không che ô tìm kiếm và chạm option vẫn ăn.
 * - `SafeAreaView` bọc nội dung Modal để nút đóng luôn truy cập được trên
 *   máy có notch / home indicator.
 * - Không thêm thư viện mới.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

type SelectablePickerMobileProps = {
  label: string;
  value: string;
  options: PickerOptionMobile[];
  placeholder: string;
  /** Nội dung hiển thị khi không chọn (thay placeholder nếu muốn). */
  placeholderChuaChon?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Dòng phụ dưới field (ví dụ "Chọn xã/phường trước", "Đang tải..."). */
  helperText?: string;
  accessibilityLabel?: string;
  onChange: (value: string) => void;
};

const CHIEU_CAO_FIELD = 48;
const CHIEU_CAO_OPTION = 48;

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
  onChange,
}: SelectablePickerMobileProps) {
  const [mo, setMo] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');

  // Đóng selector cùng lúc đóng form để không giữ state cũ không mong muốn.
  useEffect(() => {
    if (!mo) setTuKhoa('');
  }, [mo]);

  const daChon = options.find((option) => option.value === value);
  const hienThi = daChon?.label ?? (placeholderChuaChon ?? placeholder);
  const nhanTienTruong = required ? `${label} *` : label;

  const ketQuaLoc = useMemo(() => {
    const tuKhoaChuanHoa = chuanHoaTenDiaBanMobile(tuKhoa);
    if (!tuKhoaChuanHoa) return options;
    return options.filter((option) => {
      const nhan = chuanHoaTenDiaBanMobile(option.label);
      const phu = chuanHoaTenDiaBanMobile(option.timThem ?? '');
      return nhan.includes(tuKhoaChuanHoa) || phu.includes(tuKhoaChuanHoa);
    });
  }, [options, tuKhoa]);

  function chon(option: PickerOptionMobile) {
    onChange(option.value);
    setMo(false);
  }

  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-[#374151]">{nhanTienTruong}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `${nhanTienTruong}: ${hienThi}`}
        accessibilityHint="Mở danh sách lựa chọn"
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={() => setMo(true)}
        className={[
          'min-h-[48px] flex-row items-center justify-between gap-2 rounded-xl border bg-white px-3.5',
          disabled || loading ? 'border-[#E5E7EB] bg-[#F9FAFB]' : 'border-[#E5E7EB] active:opacity-80',
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
          color={disabled || loading ? '#C7CDD9' : '#6B7280'}
        />
      </Pressable>

      {helperText ? (
        <Text className="text-[12px] leading-[18px] text-[#9CA3AF]">{helperText}</Text>
      ) : null}

      <Modal
        visible={mo}
        transparent
        animationType="slide"
        onRequestClose={() => setMo(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          {/* Vùng nền chạm để đóng. Ẩn khỏi accessibility tree vì đã có nút đóng
              rõ ràng ở header — tránh screen reader đọc một nút full-screen. */}
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            className="flex-1"
            onPress={() => setMo(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <View
              className="rounded-t-2xl border-t border-[#E5E7EB] bg-white"
              style={{ maxHeight: '88%' }}
            >
              <SafeAreaView edges={['top']} className="px-4 pb-2 pt-3">
                <View className="mb-3 flex-row items-center justify-between gap-3">
                  <Text numberOfLines={1} className="flex-1 text-[16px] font-bold text-[#111827]">
                    {nhanTienTruong}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Đóng ${nhanTienTruong.toLowerCase()}`}
                    onPress={() => setMo(false)}
                    hitSlop={8}
                    className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
                  >
                    <Ionicons name="close" size={21} color="#374151" />
                  </Pressable>
                </View>

                <View className="min-h-[44px] flex-row items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3">
                  <Ionicons name="search-outline" size={17} color="#9CA3AF" />
                  <TextInput
                    value={tuKhoa}
                    onChangeText={setTuKhoa}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                    autoCorrect={false}
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
              </SafeAreaView>

              {/* Wrapper có `flexShrink: 1` là bắt buộc: FlatList trong RN mặc
                  định `flexShrink = 0`, nên với 104 xã/phường nó sẽ tràn khỏi
                  sheet (`maxHeight: 88%`) và không cuộn được. */}
              <View style={{ flexShrink: 1 }}>
                <FlatList
                  data={ketQuaLoc}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  style={{ flexGrow: 0 }}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  ListEmptyComponent={
                    <Text className="px-4 py-8 text-center text-[14px] text-[#6B7280]">
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
                        onPress={() => chon(item)}
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
              </View>

              <SafeAreaView edges={['bottom']} className="border-t border-[#F3F4F6] px-4 pt-2">
                <Text className="pb-1 text-center text-[12px] text-[#9CA3AF]">
                  {ketQuaLoc.length} / {options.length} mục
                </Text>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

export type { SelectablePickerMobileProps };
