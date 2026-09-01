import { TrangThaiDonHang } from '../src/generated/prisma/client';
import {
  coTheChuyenTrangThaiDonHang059,
  danhSachTrangThaiTiepTheo059,
  laTrangThaiDonHangCotLoi059,
  LoiChuyenTrangThaiDonHang,
  TRANG_THAI_DON_HANG_COT_LOI_059,
  validateChuyenTrangThaiDonHang059,
} from '../src/modules/don-hang/may-trang-thai-don-hang';

const CORE = [
  TrangThaiDonHang.CHO_THANH_TOAN,
  TrangThaiDonHang.DA_XAC_NHAN,
  TrangThaiDonHang.DANG_CHUAN_BI,
  TrangThaiDonHang.DA_DONG_GOI,
  TrangThaiDonHang.DANG_GIAO,
  TrangThaiDonHang.DA_GIAO,
  TrangThaiDonHang.HOAN_THANH,
  TrangThaiDonHang.DA_HUY,
] as const;

const HOP_LE = [
  [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DA_XAC_NHAN],
  [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DA_HUY],
  [TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DANG_CHUAN_BI],
  [TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DA_HUY],
  [TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DA_DONG_GOI],
  [TrangThaiDonHang.DA_DONG_GOI, TrangThaiDonHang.DANG_GIAO],
  [TrangThaiDonHang.DANG_GIAO, TrangThaiDonHang.DA_GIAO],
  [TrangThaiDonHang.DA_GIAO, TrangThaiDonHang.HOAN_THANH],
] as const;

const FUTURE = [
  TrangThaiDonHang.KHIEU_NAI,
  TrangThaiDonHang.HOAN_TIEN_MOT_PHAN,
  TrangThaiDonHang.HOAN_TIEN_TOAN_BO,
] as const;

function key(tu: TrangThaiDonHang, den: TrangThaiDonHang): string {
  return `${tu}->${den}`;
}

describe('PHIEN-059 Order State Machine', () => {
  it('giữ exact 8 core states theo master', () => {
    expect(TRANG_THAI_DON_HANG_COT_LOI_059).toEqual(CORE);
  });

  it('validate đúng toàn bộ ma trận transition 8x8', () => {
    const allowed = new Set(HOP_LE.map(([tu, den]) => key(tu, den)));

    for (const tu of CORE) {
      for (const den of CORE) {
        const expected = allowed.has(key(tu, den));
        expect(coTheChuyenTrangThaiDonHang059(tu, den)).toBe(expected);

        if (expected) {
          expect(() => validateChuyenTrangThaiDonHang059(tu, den)).not.toThrow();
        } else {
          expect(() => validateChuyenTrangThaiDonHang059(tu, den)).toThrow(
            LoiChuyenTrangThaiDonHang,
          );
        }
      }
    }
  });

  it('trả next-state list đúng graph', () => {
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.CHO_THANH_TOAN)).toEqual([
      TrangThaiDonHang.DA_XAC_NHAN,
      TrangThaiDonHang.DA_HUY,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_XAC_NHAN)).toEqual([
      TrangThaiDonHang.DANG_CHUAN_BI,
      TrangThaiDonHang.DA_HUY,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DANG_CHUAN_BI)).toEqual([
      TrangThaiDonHang.DA_DONG_GOI,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_DONG_GOI)).toEqual([
      TrangThaiDonHang.DANG_GIAO,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DANG_GIAO)).toEqual([
      TrangThaiDonHang.DA_GIAO,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_GIAO)).toEqual([
      TrangThaiDonHang.HOAN_THANH,
    ]);
  });

  it('HOAN_THANH và DA_HUY là terminal core states', () => {
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.HOAN_THANH)).toEqual([]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_HUY)).toEqual([]);
  });

  it('không cho self-transition, skip hoặc backward transition', () => {
    const invalid = [
      [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.CHO_THANH_TOAN],
      [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DANG_CHUAN_BI],
      [TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DA_XAC_NHAN],
      [TrangThaiDonHang.DA_DONG_GOI, TrangThaiDonHang.DA_HUY],
      [TrangThaiDonHang.DANG_GIAO, TrangThaiDonHang.HOAN_THANH],
      [TrangThaiDonHang.HOAN_THANH, TrangThaiDonHang.DA_HUY],
    ] as const;

    for (const [tu, den] of invalid) {
      expect(coTheChuyenTrangThaiDonHang059(tu, den)).toBe(false);
      expect(() => validateChuyenTrangThaiDonHang059(tu, den)).toThrow(LoiChuyenTrangThaiDonHang);
    }
  });

  it('giữ future complaint/refund states ngoài core PHIEN-059', () => {
    for (const state of FUTURE) {
      expect(laTrangThaiDonHangCotLoi059(state)).toBe(false);
      expect(coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.HOAN_THANH, state)).toBe(false);
      expect(coTheChuyenTrangThaiDonHang059(state, TrangThaiDonHang.HOAN_THANH)).toBe(false);
      expect(() => validateChuyenTrangThaiDonHang059(TrangThaiDonHang.HOAN_THANH, state)).toThrow(
        LoiChuyenTrangThaiDonHang,
      );
      expect(() => validateChuyenTrangThaiDonHang059(state, TrangThaiDonHang.HOAN_THANH)).toThrow(
        LoiChuyenTrangThaiDonHang,
      );
    }
  });
});
