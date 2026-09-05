import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export type KhaDungFilter = 'TAT_CA' | 'CON_HANG' | 'HET_HANG';
export type SapXepFilter = 'PHU_HOP' | 'TEN_AZ' | 'TEN_ZA' | 'GIA_TANG' | 'GIA_GIAM' | 'MOI_NHAT';

export type BoLocSanPhamMobile = {
  danhMuc: string | null;
  trangTraiId: string | null;
  tinhThanh: string;
  chungNhan: string | null;
  giaTu: string;
  giaDen: string;
  thuHoachTu: string;
  thuHoachDen: string;
  khaDung: KhaDungFilter;
  sapXep: SapXepFilter;
};

export type FilterOption = {
  value: string;
  label: string;
};

type FilterBottomSheetProps = {
  open: boolean;
  value: BoLocSanPhamMobile;
  categories: FilterOption[];
  farms: FilterOption[];
  certificates: FilterOption[];
  onChange: (value: BoLocSanPhamMobile) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
};

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-semibold text-foreground">{children}</Text>;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={[
        'rounded-full border px-3 py-2 active:opacity-80',
        selected ? 'border-primary bg-primary' : 'border-border bg-card',
      ].join(' ')}
    >
      <Text
        className={
          selected ? 'text-sm font-semibold text-primary-foreground' : 'text-sm text-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
}) {
  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Tất cả" selected={value === null} onPress={() => onChange(null)} />
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(value === option.value ? null : option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function TextField({
  label,
  value,
  placeholder,
  keyboardType,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  onChangeText: (value: string) => void;
}) {
  return (
    <View className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#718078"
        className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
      />
    </View>
  );
}

export function FilterBottomSheet({
  open,
  value,
  categories,
  farms,
  certificates,
  onChange,
  onApply,
  onReset,
  onClose,
}: FilterBottomSheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng bộ lọc"
          className="flex-1"
          onPress={onClose}
        />

        <View
          className="rounded-t-3xl border-t border-border bg-background px-5 pb-6 pt-4"
          style={{ maxHeight: '88%' }}
        >
          <View className="mb-4 items-center">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          <View className="mb-4 flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-2xl font-bold text-foreground">Bộ lọc nông sản</Text>
              <Text className="text-sm text-muted-foreground">
                Điều kiện chỉ được áp dụng khi bạn nhấn “Áp dụng”.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="rounded-full border border-border bg-card px-3 py-2 active:opacity-80"
            >
              <Text className="font-semibold text-foreground">Đóng</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 20, paddingBottom: 24 }}
          >
            <OptionGroup
              label="Danh mục"
              value={value.danhMuc}
              options={categories}
              onChange={(danhMuc) => onChange({ ...value, danhMuc })}
            />

            <OptionGroup
              label="Trang trại"
              value={value.trangTraiId}
              options={farms}
              onChange={(trangTraiId) => onChange({ ...value, trangTraiId })}
            />

            <OptionGroup
              label="Chứng nhận"
              value={value.chungNhan}
              options={certificates}
              onChange={(chungNhan) => onChange({ ...value, chungNhan })}
            />

            <TextField
              label="Tỉnh / thành"
              value={value.tinhThanh}
              placeholder="Ví dụ: Lâm Đồng"
              onChangeText={(tinhThanh) => onChange({ ...value, tinhThanh })}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Giá từ"
                  value={value.giaTu}
                  placeholder="0"
                  keyboardType="numeric"
                  onChangeText={(giaTu) => onChange({ ...value, giaTu })}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Giá đến"
                  value={value.giaDen}
                  placeholder="Không giới hạn"
                  keyboardType="numeric"
                  onChangeText={(giaDen) => onChange({ ...value, giaDen })}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Thu hoạch từ"
                  value={value.thuHoachTu}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(thuHoachTu) => onChange({ ...value, thuHoachTu })}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Thu hoạch đến"
                  value={value.thuHoachDen}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(thuHoachDen) => onChange({ ...value, thuHoachDen })}
                />
              </View>
            </View>

            <View className="gap-2">
              <FieldLabel>Khả dụng</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {(
                  [
                    ['TAT_CA', 'Tất cả'],
                    ['CON_HANG', 'Còn hàng'],
                    ['HET_HANG', 'Hết hàng'],
                  ] as const
                ).map(([optionValue, label]) => (
                  <Chip
                    key={optionValue}
                    label={label}
                    selected={value.khaDung === optionValue}
                    onPress={() =>
                      onChange({
                        ...value,
                        khaDung: optionValue as KhaDungFilter,
                      })
                    }
                  />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <FieldLabel>Sắp xếp</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {(
                  [
                    ['PHU_HOP', 'Phù hợp'],
                    ['TEN_AZ', 'Tên A → Z'],
                    ['TEN_ZA', 'Tên Z → A'],
                    ['GIA_TANG', 'Giá tăng dần'],
                    ['GIA_GIAM', 'Giá giảm dần'],
                    ['MOI_NHAT', 'Mới nhất'],
                  ] as const
                ).map(([optionValue, label]) => (
                  <Chip
                    key={optionValue}
                    label={label}
                    selected={value.sapXep === optionValue}
                    onPress={() =>
                      onChange({
                        ...value,
                        sapXep: optionValue as SapXepFilter,
                      })
                    }
                  />
                ))}
              </View>
            </View>

            <View className="gap-3 pt-2">
              <Pressable
                accessibilityRole="button"
                onPress={onApply}
                className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
              >
                <Text className="font-semibold text-primary-foreground">Áp dụng bộ lọc</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onReset}
                className="min-h-12 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 active:opacity-80"
              >
                <Text className="font-semibold text-foreground">Xóa bộ lọc</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
