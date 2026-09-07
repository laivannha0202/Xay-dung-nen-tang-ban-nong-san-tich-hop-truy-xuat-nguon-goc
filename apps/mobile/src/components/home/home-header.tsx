
import { Text, View } from 'react-native';

export function HomeHeader() {
  return (
    <View className="gap-1">
      <Text className="text-sm text-muted-foreground">
        📍 Hà Nội
      </Text>

      <Text className="text-3xl font-bold text-foreground">
        Xin chào AgriMarket 👋
      </Text>

      <Text className="text-sm text-muted-foreground">
        Nông sản sạch từ trang trại minh bạch
      </Text>
    </View>
  );
}
