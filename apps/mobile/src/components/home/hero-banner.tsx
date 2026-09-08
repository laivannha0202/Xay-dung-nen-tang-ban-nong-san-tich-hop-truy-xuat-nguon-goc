import { Image } from 'expo-image';
import { Pressable } from 'react-native';

export function HeroBanner({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Khám phá nông sản sạch"
      onPress={onPress}
      className="overflow-hidden rounded-[22px] active:opacity-95"
    >
      <Image
        source={require('../../../assets/images/home/hero-agri.png')}
        contentFit="cover"
        transition={120}
        style={{
          width: '100%',
          aspectRatio: 712 / 274,
        }}
      />
    </Pressable>
  );
}
