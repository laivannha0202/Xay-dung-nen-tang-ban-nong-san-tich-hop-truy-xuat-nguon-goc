const ANH_LOCAL = {
  hero: '/images/hero/hero-main.png',
  promo1: '/images/hero/promo-rau-cu-tuoi.jpg',
  promo2: '/images/hero/promo-trai-cay-theo-mua.jpg',
  trace: '/images/banners/app-banner-card.png',
  story: '/images/stories/story-nong-dan-dong-thap-trong-xoai.jpg',
  shipping: '/images/banners/free-shipping-card.png',
  appCard: '/images/banners/app-download-card.png',
  appBanner: '/images/banners/app-banner-full.png',
} as const;

function chuanHoa(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const ANH_HERO_AGRIMARKET = ANH_LOCAL.hero;
export const ANH_PROMO_RAU_CU = ANH_LOCAL.promo1;
export const ANH_PROMO_TRAI_CAY = ANH_LOCAL.promo2;
export const ANH_TRUY_XUAT_AGRIMARKET = ANH_LOCAL.trace;
export const ANH_CAU_CHUYEN_TRANG_TRAI = ANH_LOCAL.story;
export const ANH_MIEN_PHI_VAN_CHUYEN = ANH_LOCAL.shipping;
export const ANH_TAI_UNG_DUNG_CARD = ANH_LOCAL.appCard;
export const ANH_APP_BANNER = ANH_LOCAL.appBanner;

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

export function anhDuPhongDanhMuc(ten: string): string {
  const value = chuanHoa(ten);

  if (/(rau|cu)/.test(value)) return '/images/categories/quick-rau-cu.png';
  if (/(trai|qua|fruit)/.test(value)) return '/images/categories/quick-trai-cay.png';
  if (/(gao|ngu coc|lua|nep)/.test(value)) return '/images/categories/quick-gao-ngu-coc.png';
  if (/(thit|trung)/.test(value)) return '/images/categories/quick-thit-trung.png';
  if (/(thuy san|ca|tom|hai san)/.test(value)) return '/images/categories/quick-thuy-san.png';
  if (/(do kho|gia vi)/.test(value)) return '/images/categories/quick-do-kho-gia-vi.png';
  if (/(dac san)/.test(value)) return '/images/categories/quick-dac-san.png';
  if (/(organic|huu co)/.test(value)) return '/images/categories/quick-organic.png';
  if (/vietgap/.test(value)) return '/images/categories/quick-vietgap.png';
  if (/(che bien)/.test(value)) return '/images/categories/quick-che-bien.png';
  if (/(combo)/.test(value)) return '/images/categories/quick-combo.png';
  if (/(qua tang)/.test(value)) return '/images/categories/quick-qua-tang.png';

  return '/images/categories/quick-rau-cu.png';
}

export function anhDuPhongTrangTrai(ten: string): string {
  const value = chuanHoa(ten);
  if (/(da lat|cong nghe cao|an phu)/.test(value)) return '/images/farms/trang-trai-an-phu-lam-dong.jpg';
  if (/(song hong|vung trong)/.test(value)) return '/images/farms/trang-trai-song-hong-ha-noi.jpg';
  return '/images/farms/trang-trai-minh-bach-ha-noi.jpg';
}
