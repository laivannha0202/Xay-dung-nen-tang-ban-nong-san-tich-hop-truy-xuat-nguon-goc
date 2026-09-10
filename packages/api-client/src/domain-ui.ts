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
  DANG_GIAO: { label: 'Đang giao', tone: 'info' },
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

export const LUA_CHON_TRANG_THAI_DON_HANG_KHACH = TRANG_THAI_DON_HANG_CANONICAL.slice(0, 8).map(
  (value) => ({
    value,
    label: META_TRANG_THAI_DON_HANG[value].label,
  }),
);

export const META_TRANG_THAI_VAN_CHUYEN: Record<string, { label: string; tone: SemanticTone }> = {
  CREATED: { label: 'Đã tạo vận đơn', tone: 'neutral' },
  CHO_LAY_HANG: { label: 'Chờ lấy hàng', tone: 'warning' },
  DA_LAY_HANG: { label: 'Đã lấy hàng', tone: 'info' },
  DANG_VAN_CHUYEN: { label: 'Đang vận chuyển', tone: 'info' },
  DANG_GIAO: { label: 'Đang giao', tone: 'info' },
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

export const NHAN_PHUONG_THUC_THANH_TOAN: Record<string, string> = {
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
