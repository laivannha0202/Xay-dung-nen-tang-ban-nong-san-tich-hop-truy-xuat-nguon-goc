import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

export type PaginationItem = number | 'dots';

type PaginationProps = {
  page: number;
  total: number;
  onChange: (page: number) => void;
};

function getPaginationRange(page: number, total: number): PaginationItem[] {
  const safeTotal = Math.max(1, Math.floor(total));
  const safePage = Math.min(Math.max(1, Math.floor(page)), safeTotal);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  if (safePage <= 3) {
    return [1, 2, 3, 4, 'dots', safeTotal];
  }

  if (safePage >= safeTotal - 2) {
    return [1, 'dots', safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
  }

  return [1, 'dots', safePage - 1, safePage, safePage + 1, 'dots', safeTotal];
}

const PAGE_BUTTON = 'h-9 min-w-9 items-center justify-center rounded-lg border px-2';
const NAV_BUTTON = 'h-9 w-9 items-center justify-center rounded-lg border';

export function Pagination({ page, total, onChange }: PaginationProps) {
  const safeTotal = Math.max(1, Math.floor(total));
  const safePage = Math.min(Math.max(1, Math.floor(page)), safeTotal);
  const range = getPaginationRange(safePage, safeTotal);
  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= safeTotal;

  return (
    <View
      accessibilityRole="menubar"
      accessibilityLabel={`Phân trang, trang ${safePage} trên ${safeTotal}`}
      className="flex-row flex-wrap items-center justify-center gap-2"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang trước"
        accessibilityState={{ disabled: prevDisabled }}
        disabled={prevDisabled}
        onPress={() => onChange(safePage - 1)}
        className={`${NAV_BUTTON} border-[#DDE7E1] bg-white ${prevDisabled ? 'opacity-40' : 'active:opacity-75'}`}
      >
        <Ionicons name="chevron-back" size={18} color="#405047" />
      </Pressable>

      {range.map((item, index) =>
        item === 'dots' ? (
          <View key={`dots-${index}`} className="h-9 min-w-6 items-center justify-center">
            <Text className="text-[15px] font-bold text-[#99A29D]">…</Text>
          </View>
        ) : (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={`Trang ${item}`}
            accessibilityState={{ selected: item === safePage, disabled: item === safePage }}
            onPress={() => onChange(item)}
            className={`${PAGE_BUTTON} ${
              item === safePage
                ? 'border-[#087A4B] bg-[#087A4B]'
                : 'border-[#DDE7E1] bg-white active:opacity-75'
            }`}
          >
            <Text
              className={`text-[14px] ${item === safePage ? 'font-extrabold text-white' : 'font-semibold text-[#405047]'}`}
            >
              {item}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Trang sau"
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={() => onChange(safePage + 1)}
        className={`${NAV_BUTTON} border-[#DDE7E1] bg-white ${nextDisabled ? 'opacity-40' : 'active:opacity-75'}`}
      >
        <Ionicons name="chevron-forward" size={18} color="#405047" />
      </Pressable>
    </View>
  );
}

export type { PaginationProps };
