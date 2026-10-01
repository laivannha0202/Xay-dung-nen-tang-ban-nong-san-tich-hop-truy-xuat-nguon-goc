import { chuanHoaKhongDau } from '@agrimarket/api-client';

const ANH_LOCAL = {
  promo1: '/images/hero/promo-rau-cu-tuoi.jpg',
  promo2: '/images/hero/promo-trai-cay-theo-mua.jpg',
} as const;

function chuanHoa(value: string): string {
  return chuanHoaKhongDau(value);
}

export const ANH_PROMO_RAU_CU = ANH_LOCAL.promo1;
export const ANH_PROMO_TRAI_CAY = ANH_LOCAL.promo2;

/** Slider hero trang chủ — 6 banner nông sản mới, tự lướt mỗi 3s. */
export interface BannerHero {
  src: string;
  alt: string;
  href: string;
}

export const THOI_GIAN_LUOT_BANNER_MS = 3000;

export const DANH_SACH_BANNER_HERO: BannerHero[] = [
  {
    src: '/images/banners/hero-01-nguon-goc-minh-bach.png',
    alt: 'Từ trang trại đến bàn ăn — Nguồn gốc minh bạch',
    href: '/san-pham',
  },
  {
    src: '/images/banners/hero-02-rau-cu-thu-hoach-trong-ngay.png',
    alt: 'Rau củ thu hoạch trong ngày',
    href: '/san-pham?category=rau-cu',
  },
  {
    src: '/images/banners/hero-03-trai-cay-ngot-lanh-tu-nhien.png',
    alt: 'Trái cây ngọt lành tự nhiên',
    href: '/san-pham?category=trai-cay',
  },
  {
    src: '/images/banners/hero-04-thit-trung-thuy-san-tuoi-sach.png',
    alt: 'Thịt, trứng, thủy sản tươi sạch',
    href: '/san-pham?category=thit-trung',
  },
  {
    src: '/images/banners/hero-05-dac-san-vung-mien.png',
    alt: 'Đặc sản vùng miền',
    href: '/san-pham?category=dac-san',
  },
  {
    src: '/images/banners/hero-06-combo-uu-dai.png',
    alt: 'Combo ưu đãi tiết kiệm',
    href: '/san-pham?category=combo',
  },
];

export function anhDuPhongSanPham(ten: string): string {
  const value = chuanHoa(ten);

  if (/(ca chua|tomato)/.test(value)) return '/images/products/flash-ca-chua-bi.jpg';
  if (/(xa lach|thuy canh)/.test(value)) return '/images/products/flash-xa-lach-thuy-canh.jpg';
  if (/(cam|citrus|quyt)/.test(value)) return '/images/products/flash-cam-sanh.jpg';
  if (/(trung|egg)/.test(value)) return '/images/products/flash-trung-ga-ta.jpg';
  if (/(thit|bo|heo|meat|beef|pork)/.test(value)) return '/images/products/flash-thit-bo-sach.jpg';
  if (/(sup lo|bong cai|broccoli|cauliflower)/.test(value)) return '/images/products/suploxanh.jpg';
  if (/(dau tay|strawberry)/.test(value)) return '/images/products/dautaydalat.jpg';
  if (/(st25|gao|rice|nep)/.test(value)) return '/images/products/gao.jpg';
  if (/(tom|ca|hai san|thuy san|fish|shrimp)/.test(value)) return '/images/products/tom.jpg';
  if (/(bo sap|bo|avocado)/.test(value)) return '/images/products/bo.jpg';
  if (/(ca rot|carrot)/.test(value)) return '/images/products/carot.jpg';
  if (/(chuoi|banana)/.test(value)) return '/images/products/chuoi.jpg';
  if (/(nam|mushroom)/.test(value)) return '/images/products/nauhuong.jpg';
  if (/(rau|cai|spinach|leaf|mong toi)/.test(value)) return '/images/products/flash-xa-lach-thuy-canh.jpg';

  const defaultList = [
    '/images/products/suploxanh.jpg',
    '/images/products/flash-ca-chua-bi.jpg',
    '/images/products/flash-xa-lach-thuy-canh.jpg',
    '/images/products/flash-cam-sanh.jpg',
  ];
  return defaultList[0]!;
}

export function anhDuPhongTrangTrai(ten: string): string {
  const value = chuanHoa(ten);
  if (/(da lat|cong nghe cao|an phu)/.test(value)) return '/images/farms/trang-trai-an-phu-lam-dong.jpg';
  if (/(song hong|vung trong)/.test(value)) return '/images/farms/trang-trai-song-hong-ha-noi.jpg';
  return '/images/farms/trang-trai-minh-bach-ha-noi.jpg';
}
