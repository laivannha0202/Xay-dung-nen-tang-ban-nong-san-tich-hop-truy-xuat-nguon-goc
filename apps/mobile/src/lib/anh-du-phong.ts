/**
 * Ảnh dự phòng mobile — port 1:1 từ customer-web `src/lib/demo-images.ts`.
 * Web dùng URL string `/images/...`, mobile dùng `require()` local asset.
 * Logic `chuanHoa` + thứ tự matching giữ nguyên để 2 nền tảng ra cùng ảnh.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- RN assets bắt buộc require, giống homepage-data.ts */

function chuanHoa(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnhSource = any;

const ANH = {
  caChua: require('../../assets/images/web/products/flash-ca-chua-bi.jpg'),
  xaLach: require('../../assets/images/web/products/flash-xa-lach-thuy-canh.jpg'),
  camSanh: require('../../assets/images/web/products/flash-cam-sanh.jpg'),
  trungGa: require('../../assets/images/web/products/flash-trung-ga-ta.jpg'),
  thitBo: require('../../assets/images/web/products/flash-thit-bo-sach.jpg'),
  supLo: require('../../assets/images/web/products/suploxanh.jpg'),
  dauTay: require('../../assets/images/web/products/dautaydalat.jpg'),
  gao: require('../../assets/images/web/products/gao.jpg'),
  tom: require('../../assets/images/web/products/tom.jpg'),
  boSap: require('../../assets/images/web/products/bo.jpg'),
  caRot: require('../../assets/images/web/products/carot.jpg'),
  chuoi: require('../../assets/images/web/products/chuoi.jpg'),
  namHuong: require('../../assets/images/web/products/nauhuong.jpg'),
} as const;

/**
 * Trả về ảnh dự phòng theo tên sản phẩm — cùng thứ tự ưu tiên với web.
 * Dùng khi `anhBiaUrl` null (sản phẩm test/PHIEN, sản phẩm chưa có ảnh).
 */
export function anhDuPhongSanPhamMobile(ten: string): AnhSource {
  const value = chuanHoa(ten ?? '');

  if (/(ca chua|tomato)/.test(value)) return ANH.caChua;
  if (/(xa lach|thuy canh)/.test(value)) return ANH.xaLach;
  if (/(cam|citrus|quyt)/.test(value)) return ANH.camSanh;
  if (/(trung|egg)/.test(value)) return ANH.trungGa;
  if (/(thit|bo|heo|meat|beef|pork)/.test(value)) return ANH.thitBo;
  if (/(sup lo|bong cai|broccoli|cauliflower)/.test(value)) return ANH.supLo;
  if (/(dau tay|strawberry)/.test(value)) return ANH.dauTay;
  if (/(st25|gao|rice|nep)/.test(value)) return ANH.gao;
  if (/(tom|ca|hai san|thuy san|fish|shrimp)/.test(value)) return ANH.tom;
  if (/(bo sap|bo|avocado)/.test(value)) return ANH.boSap;
  if (/(ca rot|carrot)/.test(value)) return ANH.caRot;
  if (/(chuoi|banana)/.test(value)) return ANH.chuoi;
  if (/(nam|mushroom)/.test(value)) return ANH.namHuong;
  if (/(rau|cai|spinach|leaf|mong toi)/.test(value)) return ANH.xaLach;

  return ANH.supLo;
}

/** Lọc sản phẩm test/seed khỏi homepage (PHIEN, giá hiệu lực, ...). */
export function laSanPhamTestHomepage(ten: string): boolean {
  const value = (ten ?? '').toLowerCase();
  return (
    value.includes('phien') ||
    value.includes('hiệu lực') ||
    value.includes('hieu luc') ||
    value.includes('giá hiệu lực') ||
    /^sản phẩm [a-z]\b/i.test(ten ?? '')
  );
}

const ANH_TRANG_TRAI = {
  anPhu: require('../../assets/images/web/farms/trang-trai-an-phu-lam-dong.jpg'),
  songHong: require('../../assets/images/web/farms/trang-trai-song-hong-ha-noi.jpg'),
  minhBach: require('../../assets/images/web/farms/trang-trai-minh-bach-ha-noi.jpg'),
} as const;

/** Port web `anhDuPhongTrangTrai` — dùng khi farm chưa có ảnh bìa. */
export function anhDuPhongTrangTraiMobile(ten: string): AnhSource {
  const value = chuanHoa(ten ?? '');
  if (/(da lat|cong nghe cao|an phu)/.test(value)) return ANH_TRANG_TRAI.anPhu;
  if (/(song hong|vung trong)/.test(value)) return ANH_TRANG_TRAI.songHong;
  return ANH_TRANG_TRAI.minhBach;
}
