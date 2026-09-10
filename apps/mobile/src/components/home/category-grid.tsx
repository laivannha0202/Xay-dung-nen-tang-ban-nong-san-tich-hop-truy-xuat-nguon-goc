import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import rauCuImage from '../../../assets/images/home/categories/rau-cu.png';
import traiCayImage from '../../../assets/images/home/categories/trai-cay.png';
import gaoImage from '../../../assets/images/home/categories/gao.png';
import trungImage from '../../../assets/images/home/categories/trung.png';
import thitImage from '../../../assets/images/home/categories/thit.png';
import thuySanImage from '../../../assets/images/home/categories/thuy-san.png';
import organicImage from '../../../assets/images/home/categories/organic.png';
import dacSanImage from '../../../assets/images/home/categories/dac-san.png';

type Category = {
  id: string;
  ten: string;
  slug: string;
};

type Props = {
  categories: Category[];
  onPress: (slug: string) => void;
  onViewAll?: () => void;
};

const images = {
  rau: rauCuImage,
  trai: traiCayImage,
  gao: gaoImage,
  trung: trungImage,
  thit: thitImage,
  thuySan: thuySanImage,
  organic: organicImage,
  dacSan: dacSanImage,
};

function boDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function categoryImage(name: string) {
  const text = boDau(name);

  if (text.includes('trai') || text.includes('qua')) return images.trai;
  if (text.includes('gao') || text.includes('luong thuc')) return images.gao;
  if (text.includes('trung')) return images.trung;
  if (text.includes('thit')) return images.thit;
  if (text.includes('thuy') || text.includes('hai san') || text === 'ca') return images.thuySan;
  if (text.includes('organic') || text.includes('huu co')) return images.organic;
  if (text.includes('dac san') || text.includes('mat ong')) return images.dacSan;
  return images.rau;
}

export function CategoryGrid({ categories, onPress, onViewAll }: Props) {
  const { width } = useWindowDimensions();
  const items = categories.slice(0, 8);
  const availableWidth = Math.max(320, width - 40);
  const itemWidth = availableWidth / Math.max(1, Math.min(items.length, 8));
  const imageSize = Math.max(36, Math.min(46, itemWidth - 5));

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[22px] font-extrabold tracking-[-0.4px] text-[#17251C]">
          Danh mục
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onViewAll}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-sm font-semibold text-[#087A4B]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color="#087A4B" />
        </Pressable>
      </View>

      {items.length > 0 ? (
        <ScrollRow items={items} itemWidth={itemWidth} imageSize={imageSize} onPress={onPress} width={width} />
      ) : (
        <View className="rounded-2xl bg-[#F7FAF8] px-4 py-5">
          <Text className="text-sm text-[#67776D]">Danh mục sẽ hiển thị khi API trả dữ liệu công khai.</Text>
        </View>
      )}
    </View>
  );
}

function ScrollRow({
  items,
  itemWidth,
  imageSize,
  onPress,
  width,
}: {
  items: Category[];
  itemWidth: number;
  imageSize: number;
  onPress: (slug: string) => void;
  width: number;
}) {
  return (
    <View className="flex-row">
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.ten}
          onPress={() => onPress(item.slug)}
          style={{ width: itemWidth }}
          className="items-center active:opacity-70"
        >
          <View
            style={{ width: imageSize, height: imageSize, borderRadius: 14 }}
            className="overflow-hidden bg-[#F5F8F6]"
          >
            <Image
              source={categoryImage(item.ten)}
              contentFit="cover"
              transition={100}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text
            numberOfLines={2}
            style={{ fontSize: width <= 380 ? 8 : 9 }}
            className="mt-2 min-h-[24px] w-full text-center font-semibold leading-[11px] text-[#354139]"
          >
            {item.ten}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
