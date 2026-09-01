import { TrangThaiDonHang } from '../../generated/prisma/client';

export const TRANG_THAI_DON_HANG_COT_LOI_059 = [
  TrangThaiDonHang.CHO_THANH_TOAN,
  TrangThaiDonHang.DA_XAC_NHAN,
  TrangThaiDonHang.DANG_CHUAN_BI,
  TrangThaiDonHang.DA_DONG_GOI,
  TrangThaiDonHang.DANG_GIAO,
  TrangThaiDonHang.DA_GIAO,
  TrangThaiDonHang.HOAN_THANH,
  TrangThaiDonHang.DA_HUY,
] as const satisfies readonly TrangThaiDonHang[];

export type TrangThaiDonHangCotLoi059 = (typeof TRANG_THAI_DON_HANG_COT_LOI_059)[number];

const CAC_CHUYEN_TRANG_THAI_059: Readonly<
  Record<TrangThaiDonHangCotLoi059, readonly TrangThaiDonHangCotLoi059[]>
> = {
  [TrangThaiDonHang.CHO_THANH_TOAN]: [TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DA_HUY],
  [TrangThaiDonHang.DA_XAC_NHAN]: [TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DA_HUY],
  [TrangThaiDonHang.DANG_CHUAN_BI]: [TrangThaiDonHang.DA_DONG_GOI],
  [TrangThaiDonHang.DA_DONG_GOI]: [TrangThaiDonHang.DANG_GIAO],
  [TrangThaiDonHang.DANG_GIAO]: [TrangThaiDonHang.DA_GIAO],
  [TrangThaiDonHang.DA_GIAO]: [TrangThaiDonHang.HOAN_THANH],
  [TrangThaiDonHang.HOAN_THANH]: [],
  [TrangThaiDonHang.DA_HUY]: [],
};

const TAP_TRANG_THAI_COT_LOI_059 = new Set<TrangThaiDonHang>(TRANG_THAI_DON_HANG_COT_LOI_059);

export class LoiChuyenTrangThaiDonHang extends Error {
  constructor(
    readonly tu: TrangThaiDonHang,
    readonly den: TrangThaiDonHang,
    message?: string,
  ) {
    super(message ?? `Không thể chuyển trạng thái đơn hàng từ ${tu} sang ${den}.`);
    this.name = 'LoiChuyenTrangThaiDonHang';
  }
}

export function laTrangThaiDonHangCotLoi059(
  value: TrangThaiDonHang,
): value is TrangThaiDonHangCotLoi059 {
  return TAP_TRANG_THAI_COT_LOI_059.has(value);
}

export function danhSachTrangThaiTiepTheo059(
  hienTai: TrangThaiDonHangCotLoi059,
): readonly TrangThaiDonHangCotLoi059[] {
  return [...CAC_CHUYEN_TRANG_THAI_059[hienTai]];
}

export function coTheChuyenTrangThaiDonHang059(
  tu: TrangThaiDonHang,
  den: TrangThaiDonHang,
): boolean {
  if (!laTrangThaiDonHangCotLoi059(tu) || !laTrangThaiDonHangCotLoi059(den)) {
    return false;
  }

  return CAC_CHUYEN_TRANG_THAI_059[tu].includes(den);
}

export function validateChuyenTrangThaiDonHang059(
  tu: TrangThaiDonHang,
  den: TrangThaiDonHang,
): void {
  if (!laTrangThaiDonHangCotLoi059(tu)) {
    throw new LoiChuyenTrangThaiDonHang(
      tu,
      den,
      `Trạng thái nguồn ${tu} nằm ngoài core Order State Machine PHIEN-059.`,
    );
  }

  if (!laTrangThaiDonHangCotLoi059(den)) {
    throw new LoiChuyenTrangThaiDonHang(
      tu,
      den,
      `Trạng thái đích ${den} nằm ngoài core Order State Machine PHIEN-059.`,
    );
  }

  if (!coTheChuyenTrangThaiDonHang059(tu, den)) {
    throw new LoiChuyenTrangThaiDonHang(tu, den);
  }
}
