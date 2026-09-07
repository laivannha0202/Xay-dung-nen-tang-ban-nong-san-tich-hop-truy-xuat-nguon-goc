
import { Pressable, Text } from 'react-native';

export function SearchBar() {
  return (
    <Pressable
      className="
      flex-row
      items-center
      rounded-2xl
      border
      border-border
      bg-card
      px-4
      py-4
      active:opacity-80
      "
    >
      <Text>
        🔍
      </Text>

      <Text
        className="
        ml-3
        text-muted-foreground
        "
      >
        Tìm sản phẩm, trang trại...
      </Text>
    </Pressable>
  );
}
