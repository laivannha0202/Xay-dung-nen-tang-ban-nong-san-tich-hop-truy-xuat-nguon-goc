import { Image } from 'expo-image';
import { Pressable } from 'react-native';

import heroImage from '../../../assets/images/home/hero-agri.png';

export function HeroBanner({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Khám phá nông sản sạch"
      onPress={onPress}
      className="overflow-hidden rounded-[22px] active:opacity-95"
    >
      <Image
        source={heroImage}
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
