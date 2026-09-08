import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function HeroBanner() {
  const router = useRouter();

  return (
    <View className="overflow-hidden rounded-2xl bg-primary">
      <View className="flex-row items-center justify-between p-5">
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="rounded-md bg-warning/15 px-2 py-1">
              <Text className="text-xs font-bold text-warning">
                DEAL
              </Text>
            </View>
            <Text className="text-xs font-medium text-primary-foreground/80">
              Mới hôm nay
            </Text>
          </View>

          <Text className="text-xl font-bold text-primary-foreground">
            Nông sản sạch
          </Text>

          <Text className="w-64 text-sm leading-5 text-primary-foreground/80">
            Truy xuất nguồn gốc minh bạch từ trang trại đến người mua
          </Text>
        </View>

        <MaterialIcons
          name="local-florist"
          size={64}
          color="#FFFFFF"
          className="opacity-20"
        />
      </View>

      <View className="px-5 pb-5">
        <Pressable
          onPress={() =>
            router.push({ pathname: '/kham-pha', params: { danhMuc: 'organic' } })
          }
          className="rounded-lg bg-primary-foreground py-2.5 items-center"
        >
          <Text className="text-sm font-semibold text-primary">
            Xem ngay
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
