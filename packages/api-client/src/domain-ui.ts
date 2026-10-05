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

/**
 * Lý do giao thất bại có cấu trúc (enum `LyDoGiaoThatBai` ở backend).
 * KHÔNG hiển thị raw enum cho khách và KHÔNG suy diễn động cơ:
 * `KHONG_LIEN_LAC_DUOC` chỉ ghi nhận "không liên lạc được / khách không nghe máy".
 */
export const LY_DO_GIAO_THAT_BAI_CANONICAL = [
  'KHONG_LIEN_LAC_DUOC',
  'KHACH_HEN_LAI',
  'KHACH_TU_CHOI_NHAN',
  'SAI_DIA_CHI',
  'LY_DO_KHAC',
] as const;

export type LyDoGiaoThatBaiCanonical = (typeof LY_DO_GIAO_THAT_BAI_CANONICAL)[number];

export const META_LY_DO_GIAO_THAT_BAI: Record<
  LyDoGiaoThatBaiCanonical,
  { label: string; moTaMacDinh: string }
> = {
  KHONG_LIEN_LAC_DUOC: {
    label: 'Không liên lạc được với người nhận',
    moTaMacDinh: 'Không liên lạc được với người nhận.',
  },
  KHACH_HEN_LAI: {
    label: 'Người nhận hẹn giao lại',
    moTaMacDinh: 'Người nhận hẹn giao lại.',
  },
  KHACH_TU_CHOI_NHAN: {
    label: 'Người nhận từ chối nhận hàng',
    moTaMacDinh: 'Người nhận từ chối nhận hàng.',
  },
  SAI_DIA_CHI: {
    label: 'Không thể giao do thông tin địa chỉ',
    moTaMacDinh: 'Không thể giao do thông tin địa chỉ.',
  },
  LY_DO_KHAC: {
    label: 'Giao hàng chưa thành công',
    moTaMacDinh: 'Giao hàng chưa thành công.',
  },
};

export function metaLyDoGiaoThatBai(value: string): { label: string; moTaMacDinh: string } {
  return (
    META_LY_DO_GIAO_THAT_BAI[value as LyDoGiaoThatBaiCanonical] ?? {
      label: 'Giao hàng chưa thành công',
      moTaMacDinh: 'Giao hàng chưa thành công.',
    }
  );
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

/**
 * Nhãn trạng thái thanh toán ĐÃ TÍNH ĐẾN phương thức.
 *
 * Nghiệp vụ: đơn COD đã xác nhận vẫn có `thanhToan.trangThai = PENDING`
 * (chưa thu tiền khi giao). Nếu render thẳng nhãn trạng thái chung thì ra
 * "Chờ thanh toán" — gây hiểu nhầm rằng đơn COD đang nợ/chờ thu online.
 * Vì vậy tách lớp vỏ bản tin theo phương thức:
 *   COD + PENDING/CREATED  → "Thanh toán khi nhận hàng"
 *   COD + PAID             → "Đã thu tiền (COD)"
 *   COD + FAILED           → "Thu tiền khi giao thất bại"
 *   COD + REFUNDED/...     → theo trạng thái hoàn tiền
 *   Các phương thức khác   → nhãn trạng thái chung (VNPay...)
 *
 * Không nuốt lỗi: đây chỉ là lớp hiển thị, KHÔNG đổi state machine backend.
 */
export function nhanTrangThaiThanhToanTheoPhuongThuc(phuongThuc: string, trangThai: string): string {
  if (phuongThuc === 'COD') {
    switch (trangThai) {
      case 'PENDING':
      case 'CREATED':
        return 'Thanh toán khi nhận hàng';
      case 'PAID':
        return 'Đã thu tiền (COD)';
      case 'FAILED':
        return 'Thu tiền khi giao thất bại';
      default:
        return metaTrangThaiThanhToan(trangThai).label;
    }
  }
  return metaTrangThaiThanhToan(trangThai).label;
}

/**
 * `TrangThaiDatChoTonKho` (Backend). `DA_XAC_NHAN` là trạng thái COD/VNPay đã
 * commit quyền giữ hàng — KHÔNG còn bị TTL hết hạn, nên tồn được dành cho
 * fulfillment đến khi xuất kho. Trước đây map thiếu khoá này nên Mobile hiện
 * raw enum `DA_XAC_NHAN` cho khách.
 */
export const META_TRANG_THAI_DAT_CHO: Record<string, { label: string; tone: SemanticTone }> = {
  DANG_GIU: { label: 'Đang giữ hàng', tone: 'warning' },
  DA_XAC_NHAN: { label: 'Đã cam kết tồn', tone: 'success' },
  DA_BAN: { label: 'Đã xuất kho', tone: 'success' },
  DA_GIAI_PHONG: { label: 'Đã giải phóng', tone: 'neutral' },
  HET_HAN: { label: 'Đã hết hạn', tone: 'danger' },
};

export function metaTrangThaiDatCho(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_DAT_CHO[value] ?? { label: value, tone: 'neutral' };
}

/**
 * Reservation chỉ có "hạn giữ tồn" khi còn ở DANG_GIU. Từ DA_XAC_NHAN trở đi
 * tồn đã commit cho fulfillment nên hiển thị mốc "giữ tồn đến ..." là SAI
 * ngữ nghĩa (Mobile đã từng hiện mốc này cho mọi trạng thái).
 */
export function reservationConHanGia(value: string): boolean {
  return value === 'DANG_GIU';
}

/** `TrangThaiLoSanPham` (Backend) — trạng thái lô trong truy xuất công khai. */
export const META_TRANG_THAI_LO_SAN_PHAM: Record<string, { label: string; tone: SemanticTone }> = {
  MOI_TAO: { label: 'Lô mới tạo, chờ xử lý', tone: 'neutral' },
  CHO_KIEM_DINH: { label: 'Chờ kiểm định chất lượng', tone: 'warning' },
  CO_THE_BAN: { label: 'Đạt điều kiện bán', tone: 'success' },
  TAM_GIU: { label: 'Tạm giữ', tone: 'warning' },
  KHONG_DAT: { label: 'Không đạt chất lượng', tone: 'danger' },
  THU_HOI: { label: 'Đã thu hồi', tone: 'danger' },
  HET_HANG: { label: 'Đã hết hàng', tone: 'neutral' },
  HET_HAN: { label: 'Đã hết hạn', tone: 'danger' },
};

export function metaTrangThaiLoSanPham(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_LO_SAN_PHAM[value] ?? { label: value, tone: 'neutral' };
}

/** `TrangThaiMuaVu` (Backend) — mùa vụ ở trang trại. */
export const META_TRANG_THAI_MUA_VU: Record<string, { label: string; tone: SemanticTone }> = {
  KE_HOACH: { label: 'Đang kế hoạch', tone: 'neutral' },
  DANG_CANH_TAC: { label: 'Đang canh tác', tone: 'info' },
  CHO_THU_HOACH: { label: 'Chờ thu hoạch', tone: 'warning' },
  DA_KET_THUC: { label: 'Đã kết thúc', tone: 'success' },
  HUY: { label: 'Đã hủy', tone: 'danger' },
};

export function metaTrangThaiMuaVu(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_MUA_VU[value] ?? { label: value, tone: 'neutral' };
}

/** `LoaiSuKienCanhTac` (Backend) — nhật ký canh tác công khai trong truy xuất. */
export const META_LOAI_SU_KIEN_CANH_TAC: Record<string, string> = {
  TUOI: 'Tưới nước',
  BON_PHAN: 'Bón phân',
  SAU_BENH: 'Sâu bệnh',
  KIEM_TRA: 'Kiểm tra ruộng',
  THOI_TIET: 'Thời tiết',
  KHAC: 'Hoạt động khác',
};

export function metaLoaiSuKienCanhTac(value: string): string {
  return META_LOAI_SU_KIEN_CANH_TAC[value] ?? value;
}

/** `LoaiSuKienTruyXuat` (Backend) — mốc hành trình công khai của lô. */
export const META_LOAI_SU_KIEN_TRUY_XUAT: Record<string, string> = {
  CANH_TAC: 'Canh tác',
  THU_HOACH: 'Thu hoạch',
  KIEM_DINH: 'Kiểm định',
  DONG_GOI: 'Đóng gói',
  NHAP_KHO: 'Nhập kho',
  XUAT_KHO: 'Xuất kho',
  GIAO_HANG: 'Giao hàng',
};

export function metaLoaiSuKienTruyXuat(value: string): string {
  return META_LOAI_SU_KIEN_TRUY_XUAT[value] ?? value;
}

/** `KetQuaKiemDinhChatLuong` (Backend) — kết quả kiểm định lô. */
export const META_KET_QUA_KIEM_DINH: Record<string, { label: string; tone: SemanticTone }> = {
  PASSED: { label: 'Đạt', tone: 'success' },
  FAILED: { label: 'Không đạt', tone: 'danger' },
  HOLD: { label: 'Tạm giữ', tone: 'warning' },
  RECALLED: { label: 'Đã thu hồi', tone: 'danger' },
};

export function metaKetQuaKiemDinh(value: string): { label: string; tone: SemanticTone } {
  return META_KET_QUA_KIEM_DINH[value] ?? { label: value, tone: 'neutral' };
}

/** `TrangThaiXacMinhChungNhan` (Backend) — trạng thái xác minh chứng nhận trang trại. */
export const META_TRANG_THAI_XAC_MINH_CHUNG_NHAN: Record<string, { label: string; tone: SemanticTone }> = {
  CHO_XAC_MINH: { label: 'Chờ xác minh', tone: 'info' },
  DA_XAC_MINH: { label: 'Đã xác minh', tone: 'success' },
  TU_CHOI: { label: 'Từ chối', tone: 'danger' },
};

export function metaTrangThaiXacMinhChungNhan(value: string): { label: string; tone: SemanticTone } {
  return META_TRANG_THAI_XAC_MINH_CHUNG_NHAN[value] ?? { label: value, tone: 'neutral' };
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

/**
 * Chuẩn hoá chuỗi để tìm kiếm không dấu — nguồn duy nhất cho cả 3 app.
 *
 * Bước đổi `đ` → `d` là BẮT BUỘC: `normalize('NFD')` không tách được chữ Đ
 * (U+0110) vì nó là ký tự riêng chứ không phải chữ D + dấu. Bỏ qua bước này thì
 * tìm "Đà Lạt" / "Đức Thọ" sẽ không khớp "đà lạt" / "đức thọ".
 *
 * Trước đây có 12 bản copy trong repo, 3 bản thiếu bước này nên âm thầm hỏng.
 */
export function chuanHoaKhongDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
}

function chuanHoaTenDiaPhuong(value: string): string {
  return chuanHoaKhongDau(value)
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
  // MOCK chỉ tồn tại ở môi trường local/sandbox (không phải phương thức khách
  // được chọn ở checkout), nhưng nhãn vẫn phải là tiếng Việt thân thiện vì
  // `don-hang/[id]` và `thanh-toan/ket-qua` render thẳng nhãn này. Customer Web
  // đã dùng cùng cách diễn đạt ("Thanh toán thử nghiệm") — không để chữ
  // "Local Demo" lọt ra UI khách.
  MOCK: 'Thanh toán thử nghiệm',
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

/**
 * Mã đơn hàng Backend sinh từ UUID idempotency key nên rất dài
 * (`ORD-` + 32 hex = 36 ký tự) và làm vỡ layout trên mobile.
 *
 * CHỈ rút gọn phần NHÌN THẤY. `maDonHang` đầy đủ vẫn được giữ nguyên cho
 * copy, tra cứu và mọi lệnh gọi API — không có mã thay thế nào được sinh ra
 * nên không phát sinh rủi ro trùng mã. Backend không có cột "public code" riêng
 * cho đơn hàng, nên ở đây không thêm migration chỉ để làm đẹp UI.
 */
export function maDonHangHienThi(value: string): string {
  const ma = value.trim().toUpperCase();
  if (ma.length <= 24) return ma;

  const viTriGach = ma.indexOf('-');
  const tienTo = viTriGach >= 0 ? ma.slice(0, viTriGach + 1) : '';
  const thanMa = viTriGach >= 0 ? ma.slice(viTriGach + 1) : ma;

  return `${tienTo}${thanMa.slice(0, 8)}…${thanMa.slice(-6)}`;
}
