import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

type SearchBarProps = {
  placeholder?: string;
  onPress?: () => void;
};

export function SearchBar({
  placeholder = 'Tìm rau củ, trái cây, trang trại...',
  onPress,
}: SearchBarProps) {
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Tìm kiếm nông sản"
      onPress={onPress}
      className="min-h-[52px] flex-row items-center rounded-2xl bg-[#F1F4F2] px-4 active:opacity-80"
    >
      <Ionicons name="search-outline" size={26} color="#7A857E" />
      <Text numberOfLines={1} className="ml-3 flex-1 text-[15px] text-[#8C9690]">
        {placeholder}
      </Text>
    </Pressable>
  );
}
