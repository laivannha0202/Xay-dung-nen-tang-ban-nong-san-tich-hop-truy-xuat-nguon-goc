
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';

type SearchBarProps = {
  placeholder?: string;
  onPress?: () => void;
};

export function SearchBar({
  placeholder = 'Tìm rau củ, trái cây...',
  onPress,
}: SearchBarProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tìm kiếm"
      onPress={onPress}
      className="
        flex-row
        items-center
        rounded-xl
        border
        border-border
        bg-card
        px-4
        py-3
        active:opacity-80
      "
    >
      <MaterialIcons name="search" size={20} color="#67776D" />

      <Text className="ml-3 text-sm text-muted-foreground">
        {placeholder}
      </Text>
    </Pressable>
  );
}
