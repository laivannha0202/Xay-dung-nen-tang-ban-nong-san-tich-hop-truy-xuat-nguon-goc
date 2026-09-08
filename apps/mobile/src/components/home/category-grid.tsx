import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

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

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'rau-cu', ten: 'Rau củ', slug: 'rau-cu' },
  { id: 'trai-cay', ten: 'Trái cây', slug: 'trai-cay' },
  { id: 'gao', ten: 'Gạo', slug: 'gao' },
  { id: 'trung', ten: 'Trứng', slug: 'trung' },
  { id: 'thit', ten: 'Thịt', slug: 'thit' },
  { id: 'thuy-san', ten: 'Thủy sản', slug: 'thuy-san' },
  { id: 'organic', ten: 'Organic', slug: 'organic' },
  { id: 'dac-san', ten: 'Đặc sản', slug: 'dac-san' },
];

const images = {
  rau: require('../../../assets/images/home/categories/rau-cu.png'),
  trai: require('../../../assets/images/home/categories/trai-cay.png'),
  gao: require('../../../assets/images/home/categories/gao.png'),
  trung: require('../../../assets/images/home/categories/trung.png'),
  thit: require('../../../assets/images/home/categories/thit.png'),
  thuySan: require('../../../assets/images/home/categories/thuy-san.png'),
  organic: require('../../../assets/images/home/categories/organic.png'),
  dacSan: require('../../../assets/images/home/categories/dac-san.png'),
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
  if (text.includes('thuy') || text.includes('ca') || text.includes('hai san')) return images.thuySan;
  if (text.includes('organic') || text.includes('huu co')) return images.organic;
  if (text.includes('dac san') || text.includes('mat ong')) return images.dacSan;

  return images.rau;
}

export function CategoryGrid({
  categories,
  onPress,
  onViewAll,
}: Props) {
  const items = categories.length > 0 ? categories.slice(0, 8) : FALLBACK_CATEGORIES;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[22px] font-bold text-[#17251C]">Danh mục</Text>

        <Pressable
          accessibilityRole="button"
          onPress={onViewAll}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-sm font-medium text-[#087744]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color="#087744" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 10 }}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.ten}
            onPress={() => onPress(item.slug)}
            className="w-[72px] items-center gap-2 active:opacity-70"
          >
            <View className="h-[58px] w-[58px] overflow-hidden rounded-[18px] bg-[#F6F9F7]">
              <Image
                source={categoryImage(item.ten)}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            <Text
              numberOfLines={1}
              className="w-full text-center text-[11px] font-medium text-[#26352D]"
            >
              {item.ten}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
