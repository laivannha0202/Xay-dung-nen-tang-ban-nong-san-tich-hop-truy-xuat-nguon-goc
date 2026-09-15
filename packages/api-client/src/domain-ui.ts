export const TRANG_THAI_DON_HANG_CANONICAL = [
  'CHO_THANH_TOAN',
  'DA_XAC_NHAN',
  'DANG_CHUAN_BI',
  'DA_DONG_GOI',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_THANH',
  'DA_HUY',
  'KHIEU_NAI',
  'HOAN_TIEN_MOT_PHAN',
  'HOAN_TIEN_TOAN_BO',
] as const;

export type TrangThaiDonHangCanonical = (typeof TRANG_THAI_DON_HANG_CANONICAL)[number];

export type SemanticTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const META_TRANG_THAI_DON_HANG: Record<
  TrangThaiDonHangCanonical,
  { label: string; tone: SemanticTone }
> = {
  CHO_THANH_TOAN: { label: 'Chờ thanh toán', tone: 'warning' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', tone: 'info' },
  DANG_CHUAN_BI: { label: 'Đang chuẩn bị', tone: 'info' },
  DA_DONG_GOI: { label: 'Đã đóng gói', tone: 'info' },
  DANG_GIAO: { label: 'Đang giao hàng', tone: 'info' },
  DA_GIAO: { label: 'Đã giao', tone: 'success' },
  HOAN_THANH: { label: 'Hoàn thành', tone: 'success' },
  DA_HUY: { label: 'Đã hủy', tone: 'danger' },
  KHIEU_NAI: { label: 'Khiếu nại', tone: 'danger' },
  HOAN_TIEN_MOT_PHAN: { label: 'Hoàn tiền một phần', tone: 'warning' },
  HOAN_TIEN_TOAN_BO: { label: 'Hoàn tiền toàn bộ', tone: 'warning' },
};

export function metaTrangThaiDonHang(value: string): {
  label: string;
  tone: SemanticTone;
} {
  return (
    META_TRANG_THAI_DON_HANG[value as TrangThaiDonHangCanonical] ?? {
      label: value,
      tone: 'neutral',
    }
  );
}

export function nhanTrangThaiDonHangCanonical(value: string): string {
  return metaTrangThaiDonHang(value).label;
}

export const LUA_CHON_TRANG_THAI_DON_HANG_KHACH = TRANG_THAI_DON_HANG_CANONICAL.map(
  (value) => ({
    value,
    label: META_TRANG_THAI_DON_HANG[value].label,
  }),
);

/**
 * Shipment dùng enum tiếng Anh ở Backend/Prisma. Các alias tiếng Việt cũ vẫn được
 * giữ để không làm hỏng dữ liệu/cache cũ trong lúc nâng cấp client.
 */
export const META_TRANG_THAI_VAN_CHUYEN: Record<string, { label: string; tone: SemanticTone }> = {
  CREATED: { label: 'Đã tạo vận đơn', tone: 'neutral' },
  PICKED_UP: { label: 'Đã lấy hàng', tone: 'info' },
  IN_TRANSIT: { label: 'Đang vận chuyển', tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'Đang giao hàng', tone: 'info' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  FAILED: { label: 'Giao thất bại', tone: 'danger' },
  RETURNED: { label: 'Đã hoàn về', tone: 'warning' },
  CHO_LAY_HANG: { label: 'Chờ lấy hàng', tone: 'warning' },
  DA_LAY_HANG: { label: 'Đã lấy hàng', tone: 'info' },
  DANG_VAN_CHUYEN: { label: 'Đang vận chuyển', tone: 'info' },
  DANG_GIAO: { label: 'Đang giao hàng', tone: 'info' },
  DA_GIAO: { label: 'Đã giao', tone: 'success' },
  GIAO_THAT_BAI: { label: 'Giao thất bại', tone: 'danger' },
  DA_HUY: { label: 'Đã hủy', tone: 'danger' },
};

export function metaTrangThaiVanChuyen(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_VAN_CHUYEN[value] ?? { label: value, tone: 'neutral' };
}

export const META_TRANG_THAI_THANH_TOAN: Record<string, { label: string; tone: SemanticTone }> = {
  CREATED: { label: 'Đã tạo', tone: 'neutral' },
  PENDING: { label: 'Chờ thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'danger' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  PARTIALLY_REFUNDED: { label: 'Hoàn tiền một phần', tone: 'warning' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'info' },
};

export function metaTrangThaiThanhToan(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_THANH_TOAN[value] ?? { label: value, tone: 'neutral' };
}

export const META_TRANG_THAI_DAT_CHO: Record<string, { label: string; tone: SemanticTone }> = {
  DANG_GIU: { label: 'Đang giữ hàng', tone: 'warning' },
  DA_BAN: { label: 'Đã ghi nhận bán', tone: 'success' },
  DA_GIAI_PHONG: { label: 'Đã giải phóng', tone: 'neutral' },
  HET_HAN: { label: 'Đã hết hạn', tone: 'danger' },
};

export function metaTrangThaiDatCho(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_DAT_CHO[value] ?? { label: value, tone: 'neutral' };
}

export type ThanhPhanCheckoutUi = {
  trangThai: string;
  giaTri: number | null;
  lyDo?: string | null;
};

export type MetaThanhPhanCheckout = {
  label: string;
  tone: SemanticTone;
  hienThiGiaTri: boolean;
};

export function metaThanhPhanCheckout(value: ThanhPhanCheckoutUi): MetaThanhPhanCheckout {
  if (value.trangThai === 'KHONG_AP_DUNG') {
    return {
      label: 'Chưa áp dụng',
      tone: 'neutral',
      hienThiGiaTri: false,
    };
  }

  if (value.trangThai === 'KHONG_HOP_LE') {
    return {
      label: 'Không hợp lệ',
      tone: 'warning',
      hienThiGiaTri: false,
    };
  }

  if (value.giaTri === null) {
    return {
      label: 'Đang cập nhật',
      tone: 'warning',
      hienThiGiaTri: false,
    };
  }

  return {
    label: 'Đã tính',
    tone: 'success',
    hienThiGiaTri: true,
  };
}

export const PHAM_VI_GIAO_HANG_AGRIMARKET = {
  ten: 'Tỉnh Hưng Yên',
  moTa: 'AgriMarket hiện hỗ trợ giao hàng trong tỉnh Hưng Yên.',
} as const;

const TEN_TINH_HUNG_YEN_HIEN_HANH = new Set(['hung yen', 'thai binh']);

function chuanHoaTenDiaPhuong(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/^(tinh|thanh pho)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chấp nhận cả nhãn "Thái Bình" cũ để sổ địa chỉ legacy vẫn hoạt động sau sắp xếp 2025.
 * Backend vẫn là nguồn sự thật cuối cùng khi preview/create-order.
 */
export function thuocPhamViGiaoHangHungYen(tinhThanh: string | null | undefined): boolean {
  if (!tinhThanh?.trim()) return false;
  return TEN_TINH_HUNG_YEN_HIEN_HANH.has(chuanHoaTenDiaPhuong(tinhThanh));
}

export const NHAN_PHUONG_THUC_THANH_TOAN: Record<string, string> = {
    MOCK: 'Thanh toán mô phỏng (Local Demo)',
COD: 'Thanh toán khi nhận hàng',
  VNPAY_SANDBOX: 'VNPay',
};

export function nhanPhuongThucThanhToan(value: string): string {
  return NHAN_PHUONG_THUC_THANH_TOAN[value] ?? value;
}

export function dinhDangQuyCachSanPham(value: {
  khoiLuong: number;
  donVi: string;
}): string {

  const donViGoc = value.donVi.trim();
  const donVi = donViGoc.toLocaleLowerCase('vi');
  const khoiLuong = value.khoiLuong;

  if (!Number.isFinite(khoiLuong) || khoiLuong <= 0) {
    return donViGoc || 'quy cách';
  }

  if (donVi === 'kg' && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)} g`;
  }

  if ((donVi === 'l' || donVi === 'lít' || donVi === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)} ml`;
  }

  const soLuong = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(khoiLuong);

  return `${soLuong} ${donViGoc}`.trim();
}

export const THUONG_HIEU_AGRIMARKET = {
  ten: 'AgriMarket',
  slogan: 'Nông sản sạch, cuộc sống xanh',
  primary: '#087A4B',
  primaryDark: '#06663F',
  primaryDarker: '#055235',
  soft: '#E0F5E9',
  softest: '#F1FAF5',
  page: '#F7FAF8',
  card: '#FFFFFF',
  border: '#DCE7DF',
  text: '#17251C',
  mutedText: '#67776D',
  success: '#16A365',
  warning: '#E99A32',
  danger: '#E6535F',
} as const;

/**
 * Helpers hiển thị giá / quy cách / tồn kho cho Customer Web.
 *
 * Ngữ nghĩa backend đã xác minh (Prisma schema + service + order snapshot):
 * - `BienTheSanPham.gia` là GIÁ CỦA 01 GÓI/QUY CÁCH ĐÓNG GÓI
 *   (ví dụ variant 250 g có gia = 12.000đ), KHÔNG phải giá trên 1 g/1 kg.
 *   Bằng chứng: `MucGioHang.soLuong: Int` × `donGia` = `thanhTien`
 *   (checkout-preview), `MucDonHang.donGiaSnapshot × soLuong`, và
 *   `kiemTraTon(soLuongGoi, soLuongKhaDung)` so sánh trực tiếp số gói.
 * - `soLuongKhaDung` là SỐ ĐƠN VỊ khả dụng (tổng onHand - reserved - blocked
 *   trên lô CO_THE_BAN), KHÔNG phải khối lượng g/kg. UI hiển thị "N đơn vị",
 *   không gọi mọi variant là "gói".
 *
 * Vì vậy UI TUYỆT ĐỐI không render `12.000đ/g` hay `Tồn khả dụng: 0 g`.
 */

export type QuyCachHienThi = {
  khoiLuong: number;
  donVi: string;
};

const DON_VI_KHOI_LUONG = new Set(['kg', 'g', 'gram']);

function laDonViKhoiLuong(donVi: string): boolean {
  return DON_VI_KHOI_LUONG.has(donVi.trim().toLocaleLowerCase('vi'));
}

/** "12000" -> "12.000" (vi-VN, làm tròn đồng). */
export function dinhDangGiaVND(gia: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(gia));
}

/** "100" / "100.5" theo vi-VN, tối đa 3 số lẻ (khớp Decimal(14,3) kho). */
export function dinhDangSoGoi(soLuong: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(soLuong);
}

/**
 * Mô tả 01 gói/quy cách đóng gói, ví dụ:
 * - { khoiLuong: 250, donVi: 'g' } -> "gói 250 g"
 * - { khoiLuong: 0.3, donVi: 'kg' } -> "gói 300 g"
 * - { khoiLuong: 10, donVi: 'quả' } -> "10 quả"
 */
export function hienThiGoiQuyCach(quyCach: QuyCachHienThi): string {
  const donViGoc = quyCach.donVi.trim();
  const spec = dinhDangQuyCachSanPham({
    khoiLuong: quyCach.khoiLuong,
    donVi: donViGoc || 'gói',
  });
  if (laDonViKhoiLuong(donViGoc)) {
    return `gói ${spec}`;
  }
  return spec;
}

/**
 * Giá 01 gói kèm quy cách đóng gói, ví dụ:
 * - (12000, { 250, 'g' }) -> "12.000đ / gói 250 g"
 * - (25000, { 0.3, 'kg' }) -> "25.000đ / gói 300 g"
 * - (35000, { 10, 'quả' }) -> "35.000đ / 10 quả"
 * Không bao giờ trả về dạng "12.000đ/g".
 */
export function hienThiGiaGoi(gia: number, quyCach: QuyCachHienThi): string {
  if (!Number.isFinite(gia) || gia <= 0) return 'Liên hệ';
  return `${dinhDangGiaVND(gia)}đ / ${hienThiGoiQuyCach(quyCach)}`;
}

/**
 * Khoảng giá danh sách từ dữ liệu thật:
 * - một mức giá -> "28.000đ"
 * - nhiều mức -> "28.000đ – 45.000đ"
 * Không gắn "/g" hay "/kg".
 */
export function hienThiKhoangGia(
  giaTu: number | null | undefined,
  giaDen: number | null | undefined,
): string {
  const coTu = typeof giaTu === 'number' && Number.isFinite(giaTu) && giaTu > 0;
  const coDen = typeof giaDen === 'number' && Number.isFinite(giaDen) && giaDen > 0;
  if (!coTu) return 'Liên hệ';
  if (coDen && (giaDen as number) > (giaTu as number)) {
    return `${dinhDangGiaVND(giaTu as number)}đ – ${dinhDangGiaVND(giaDen as number)}đ`;
  }
  return `${dinhDangGiaVND(giaTu as number)}đ`;
}

/**
 * Số đơn vị khả dụng, ví dụ 10 -> "10 đơn vị". Hết hàng caller render
 * "Tạm hết hàng". KHÔNG gọi mọi thứ là "gói" vì schema chưa có packagingType
 * (GOI/HOP/CHAI/TUI...) — "đơn vị" đúng với mọi variant (kg, quả, lít...).
 */
export function hienThiTonKhaDung(soLuongKhaDung: number): string {
  const soLuong = Math.max(0, soLuongKhaDung);
  return `${dinhDangSoGoi(soLuong)} đơn vị`;
}

/** Hết hàng khi tồn khả dụng <= 0. */
export function laHetHang(soLuongKhaDung: number | null | undefined): boolean {
  return !(typeof soLuongKhaDung === 'number' && soLuongKhaDung > 0);
}
