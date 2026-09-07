
import { Text, View } from 'react-native';

export function HeroBanner() {
  return (
    <View
      className="
      gap-3
      rounded-3xl
      bg-primary
      p-5
      "
    >

      <Text
        className="
        text-2xl
        font-bold
        text-primary-foreground
        "
      >
        🌱 Nông sản sạch
      </Text>


      <Text
        className="
        leading-6
        text-primary-foreground
        "
      >
        Truy xuất nguồn gốc minh bạch
        từ trang trại đến người mua
      </Text>


    </View>
  );
}
