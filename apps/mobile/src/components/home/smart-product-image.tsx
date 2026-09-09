import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import matOngRung from '../../../assets/images/home/products/mat-ong-rung.png';
import caHoiNaUy from '../../../assets/images/home/products/ca-hoi-na-uy.png';
import bongCaiXanh from '../../../assets/images/home/products/bong-cai-xanh.png';
import featuredCaRot from '../../../assets/images/home/lower/featured-ca-rot.png';
import featuredThitHeo from '../../../assets/images/home/lower/featured-thit-heo.png';
import featuredGaoSt25 from '../../../assets/images/home/lower/featured-gao-st25.png';
import dealCamSanh from '../../../assets/images/home/lower/deal-cam-sanh.png';
import dealXaLach from '../../../assets/images/home/lower/deal-xa-lach.png';
import farmAnPhu from '../../../assets/images/home/lower/farm-an-phu.png';
import trungImg from '../../../assets/images/home/categories/trung.png';
import traiCayImg from '../../../assets/images/home/categories/trai-cay.png';
import thuySanImg from '../../../assets/images/home/categories/thuy-san.png';

const GREEN_SOFT = '#EAF5EE';

type Props = {
  uri?: string | null;
  name: string;
};

function boDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function anhLocalTheoTen(name: string): ImageSource | null {
  const text = boDau(name);

  if (text.includes('mat ong')) return matOngRung;
  if (text.includes('ca hoi')) return caHoiNaUy;
  if (text.includes('bong cai') || text.includes('broccoli')) return bongCaiXanh;
  if (text.includes('ca rot')) return featuredCaRot;
  if (text.includes('thit heo') || text.includes('thit lon')) return featuredThitHeo;
  if (text.includes('gao')) return featuredGaoSt25;
  if (text.includes('cam')) return dealCamSanh;
  if (text.includes('ca chua')) return farmAnPhu;
  if (text.includes('xa lach') || text.includes('dua leo') || text.includes('rau cai')) {
    return dealXaLach;
  }
  if (text.includes('trung')) return trungImg;
  if (text.includes('ca loc') || text.includes('tom') || text.includes('cua ')) return thuySanImg;
  if (text.includes('tao') || text.includes('chuoi') || text.includes('trai cay')) {
    return traiCayImg;
  }

  return null;
}

/**
 * Ưu tiên ảnh API. Ảnh local chỉ là fallback khi URL lỗi/mất mạng.
 * Mapping theo tên dùng so khớp cụ thể để tránh nhầm "cà chua" thành "cá".
 */
export function SmartProductImage({ uri, name }: Props) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const localSource = useMemo(() => anhLocalTheoTen(name), [name]);

  const source = useMemo<ImageSource | null>(() => {
    if (uri && !remoteFailed) return { uri };
    return localSource;
  }, [localSource, remoteFailed, uri]);

  if (!source) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: GREEN_SOFT,
        }}
      >
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F7FBF8',
          }}
        >
          <Ionicons name="leaf-outline" size={34} color="#84B99A" />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={source}
      contentFit="cover"
      cachePolicy="none"
      recyclingKey={uri ?? name}
      transition={160}
      accessibilityLabel={`Ảnh ${name}`}
      onError={() => setRemoteFailed(true)}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
