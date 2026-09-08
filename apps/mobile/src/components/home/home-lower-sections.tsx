import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import featuredRauCai from '../../../assets/images/home/lower/featured-rau-cai.png';
import featuredCaRot from '../../../assets/images/home/lower/featured-ca-rot.png';
import featuredBiDo from '../../../assets/images/home/lower/featured-bi-do.png';
import featuredThitHeo from '../../../assets/images/home/lower/featured-thit-heo.png';
import featuredCaHoi from '../../../assets/images/home/lower/featured-ca-hoi.png';
import featuredGaoSt25 from '../../../assets/images/home/lower/featured-gao-st25.png';
import dealCamSanh from '../../../assets/images/home/lower/deal-cam-sanh.png';
import dealXaLach from '../../../assets/images/home/lower/deal-xa-lach.png';
import farmMinhBach from '../../../assets/images/home/lower/farm-minh-bach.png';
import farmAnPhu from '../../../assets/images/home/lower/farm-an-phu.png';
import farmPhuNong from '../../../assets/images/home/lower/farm-phu-nong.png';
import farmSongHong from '../../../assets/images/home/lower/farm-song-hong.png';
import sustainableBanner from '../../../assets/images/home/lower/sustainable-banner.png';

const GREEN = '#0B8F4D';
const DARK = '#17251C';
const MUTED = '#7A857E';
const STAR = '#FFB51B';

type FeaturedItem = {
  name: string;
  price: string;
  unit: string;
  rating: string;
  reviews: number;
  image: number;
};

type DealItem = {
  name: string;
  farm: string;
  price: string;
  oldPrice: string;
  discount: string;
  image: number;
};

type FarmItem = {
  name: string;
  location: string;
  rating: string;
  reviews: number;
  image: number;
};

const FEATURED: FeaturedItem[] = [
  { name: 'Rau cải xanh', price: '20.000đ', unit: '/300g', rating: '4.8', reviews: 124, image: featuredRauCai },
  { name: 'Cà rốt hữu cơ', price: '25.000đ', unit: '/500g', rating: '4.9', reviews: 98, image: featuredCaRot },
  { name: 'Bí đỏ', price: '30.000đ', unit: '/1kg', rating: '4.7', reviews: 76, image: featuredBiDo },
  { name: 'Thịt heo sạch', price: '150.000đ', unit: '/500g', rating: '5.0', reviews: 205, image: featuredThitHeo },
  { name: 'Cá hồi tươi', price: '220.000đ', unit: '/300g', rating: '4.9', reviews: 112, image: featuredCaHoi },
  { name: 'Gạo ST25', price: '120.000đ', unit: '/1kg', rating: '4.8', reviews: 189, image: featuredGaoSt25 },
];

const DEALS: DealItem[] = [
  { name: 'Cam sành', farm: 'Đặc sản Hà Giang', price: '28.000đ', oldPrice: '35.000đ', discount: '-20%', image: dealCamSanh },
  { name: 'Rau xà lách thủy canh', farm: 'Trang trại Minh Bạch', price: '25.000đ', oldPrice: '30.000đ', discount: '-15%', image: dealXaLach },
];

const FARMS: FarmItem[] = [
  { name: 'Trang trại Minh Bạch', location: 'Hà Nội', rating: '4.8', reviews: 124, image: farmMinhBach },
  { name: 'Trang trại An Phú', location: 'Lâm Đồng', rating: '4.7', reviews: 98, image: farmAnPhu },
  { name: 'HTX Phú Nông', location: 'Đồng Nai', rating: '4.6', reviews: 89, image: farmPhuNong },
  { name: 'Trang trại Sông Hồng', location: 'Hà Nội', rating: '4.8', reviews: 103, image: farmSongHong },
];

function SectionHeader({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPress}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color="#087744" />
        </Pressable>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function TwoColumns({ children }: { children: React.ReactNode[] }) {
  const rows: React.ReactNode[][] = [];

  for (let i = 0; i < children.length; i += 2) {
    rows.push(children.slice(i, i + 2));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, index) => (
        <View key={index} style={styles.gridRow}>
          <View style={styles.column}>{row[0]}</View>
          <View style={styles.column}>{row[1] ?? null}</View>
        </View>
      ))}
    </View>
  );
}

function FeaturedCard({
  item,
  onPress,
}: {
  item: FeaturedItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
    >
      <Image source={item.image} contentFit="cover" style={styles.featuredImage} />

      <View style={styles.featuredInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>

        <View style={styles.compactPriceRow}>
          <Text numberOfLines={1} style={styles.price}>{item.price}</Text>
          <Text numberOfLines={1} style={styles.unit}>{item.unit}</Text>
        </View>

        <View style={styles.featuredBottom}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={STAR} />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>

          <View style={styles.cartButton}>
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function DealCard({
  item,
  countdown,
  onPress,
}: {
  item: DealItem;
  countdown: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.dealCard, pressed && styles.pressed]}
    >
      <View style={styles.dealImageWrap}>
        <Image source={item.image} contentFit="cover" style={styles.fill} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
      </View>

      <View style={styles.dealInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.farmText}>{item.farm}</Text>

        <Text style={styles.dealPrice}>{item.price}</Text>
        <Text style={styles.oldPrice}>{item.oldPrice}</Text>

        <View style={styles.dealBottom}>
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={12} color="#E34A33" />
            <Text numberOfLines={1} style={styles.timerText}>{countdown}</Text>
          </View>

          <View style={styles.cartButton}>
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FarmCard({
  item,
  onPress,
}: {
  item: FarmItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.farmCard, pressed && styles.pressed]}
    >
      <Image source={item.image} contentFit="cover" style={styles.farmImage} />

      <View style={styles.farmInfo}>
        <Text numberOfLines={1} style={styles.farmName}>{item.name}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location" size={12} color="#68746D" />
          <Text numberOfLines={1} style={styles.metaText}>{item.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={STAR} />
          <Text style={styles.farmRating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>

        <View style={styles.farmButton}>
          <Text style={styles.farmButtonText}>Xem trang trại</Text>
        </View>
      </View>
    </Pressable>
  );
}

function useCountdown(initial = 12 * 3600 + 18 * 60 + 45) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((current) => (current <= 0 ? initial : current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [initial]);

  return useMemo(() => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }, [seconds]);
}

export function HomeLowerSections() {
  const router = useRouter();
  const countdown = useCountdown();
  const openExplore = () => router.push('/kham-pha');

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <SectionHeader
          title="Sản phẩm nổi bật"
          subtitle="Nông sản chất lượng cao, được nhiều người tin chọn"
          onPress={openExplore}
        />

        <TwoColumns>
          {FEATURED.map((item) => (
            <FeaturedCard key={item.name} item={item} onPress={openExplore} />
          ))}
        </TwoColumns>
      </View>

      <Divider />

      <Pressable
        accessibilityRole="button"
        onPress={openExplore}
        style={({ pressed }) => [styles.bannerWrap, pressed && styles.pressed]}
      >
        <Image
          source={sustainableBanner}
          contentFit="cover"
          style={styles.banner}
        />
      </Pressable>

      <Divider />

      <View style={styles.section}>
        <SectionHeader
          title="Ưu đãi hôm nay"
          subtitle="Giá tốt mỗi ngày"
          onPress={openExplore}
        />

        <TwoColumns>
          {DEALS.map((item) => (
            <DealCard
              key={item.name}
              item={item}
              countdown={countdown}
              onPress={openExplore}
            />
          ))}
        </TwoColumns>
      </View>

      <Divider />

      <View style={styles.section}>
        <SectionHeader
          title="Trang trại tiêu biểu"
          subtitle="Kết nối trực tiếp với các trang trại uy tín"
          onPress={openExplore}
        />

        <TwoColumns>
          {FARMS.map((item) => (
            <FarmCard key={item.name} item={item} onPress={openExplore} />
          ))}
        </TwoColumns>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingTop: 2,
    paddingBottom: 4,
  },
  section: {
    width: '100%',
  },
  divider: {
    height: 8,
    marginHorizontal: -20,
    marginVertical: 16,
    backgroundColor: '#F5F6F5',
  },
  headerWrap: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    color: DARK,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  subtitle: {
    marginTop: 2,
    color: '#929A95',
    fontSize: 12,
    lineHeight: 16,
  },
  viewAll: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  viewAllText: {
    color: '#087744',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    width: '100%',
    gap: 8,
  },
  gridRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },

  featuredCard: {
    width: '100%',
    height: 124,
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDE4DF',
    backgroundColor: '#FFFFFF',
  },
  featuredImage: {
    width: '46%',
    height: '100%',
    backgroundColor: '#EEF4EF',
  },
  featuredInfo: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  productName: {
    color: '#202A24',
    fontSize: 12.5,
    lineHeight: 15,
    fontWeight: '800',
  },
  compactPriceRow: {
    marginTop: 5,
  },
  price: {
    color: '#087744',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  unit: {
    marginTop: 1,
    color: MUTED,
    fontSize: 8.5,
  },
  featuredBottom: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  ratingRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    color: '#2D3932',
    fontSize: 9.5,
    fontWeight: '700',
  },
  reviews: {
    color: '#89918C',
    fontSize: 7.5,
  },
  cartButton: {
    width: 29,
    height: 29,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: GREEN,
  },

  bannerWrap: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 15,
  },
  banner: {
    width: '100%',
    aspectRatio: 712 / 236,
  },

  dealCard: {
    width: '100%',
    height: 148,
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DED8',
    backgroundColor: '#FFFDFC',
  },
  dealImageWrap: {
    position: 'relative',
    width: '47%',
    height: '100%',
    backgroundColor: '#FFF4EF',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    borderRadius: 5,
    backgroundColor: '#F14D31',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dealInfo: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  farmText: {
    marginTop: 2,
    color: '#87908A',
    fontSize: 8.5,
  },
  dealPrice: {
    marginTop: 6,
    color: '#087744',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  oldPrice: {
    color: '#969E99',
    fontSize: 8.5,
    textDecorationLine: 'line-through',
  },
  dealBottom: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timer: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 7,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  timerText: {
    minWidth: 0,
    flex: 1,
    color: '#E34A33',
    fontSize: 7,
    fontWeight: '700',
  },

  farmCard: {
    width: '100%',
    height: 104,
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDE4DF',
    backgroundColor: '#FFFFFF',
  },
  farmImage: {
    width: '47%',
    height: '100%',
    backgroundColor: '#EEF4EF',
  },
  farmInfo: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  farmName: {
    color: '#202A24',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    minWidth: 0,
    flex: 1,
    color: '#7E8882',
    fontSize: 8,
  },
  farmRating: {
    color: '#E69D00',
    fontSize: 8.5,
    fontWeight: '700',
  },
  farmButton: {
    marginTop: 'auto',
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: GREEN,
    paddingHorizontal: 4,
  },
  farmButtonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.72,
  },
});
