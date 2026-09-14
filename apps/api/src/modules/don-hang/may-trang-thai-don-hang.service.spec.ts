import { TrangThaiDonHang } from '../../generated/prisma/client';

import {
  coTheChuyenTrangThaiDonHang059,
  danhSachTrangThaiTiepTheo059,
  laTrangThaiDonHangCotLoi059,
  LoiChuyenTrangThaiDonHang,
  validateChuyenTrangThaiDonHang059,
} from './may-trang-thai-don-hang';

/**
 * Unit test DB-free cho Order State Machine PHIEN-059.
 *
 * Admin Order Management + Fulfillment UI chỉ được render action khi backend
 * cho phép chuyển trạng thái; spec này khóa các quy tắc mà UI phụ thuộc:
 * - Luồng core: CHO_THANH_TOAN -> DA_XAC_NHAN -> DANG_CHUAN_BI -> DA_DONG_GOI
 *   -> DANG_GIAO -> DA_GIAO -> HOAN_THANH.
 * - Hủy (DA_HUY) chỉ từ CHO_THANH_TOAN / DA_XAC_NHAN — sau khi bắt đầu chuẩn
 *   bị hoặc giao thì action hủy phải vắng mặt/bị chặn.
 * - KHIEU_NAI / HOAN_TIEN_* nằm ngoài core machine: order/payment/shipment/
 *   complaint status độc lập, không gộp chung.
 */
describe('may-trang-thai-don-hang (PHIEN-059)', () => {
  it('cho phep luong core day du', () => {
    const luong: Array<[TrangThaiDonHang, TrangThaiDonHang]> = [
      [TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DA_XAC_NHAN],
      [TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DANG_CHUAN_BI],
      [TrangThaiDonHang.DANG_CHUAN_BI, TrangThaiDonHang.DA_DONG_GOI],
      [TrangThaiDonHang.DA_DONG_GOI, TrangThaiDonHang.DANG_GIAO],
      [TrangThaiDonHang.DANG_GIAO, TrangThaiDonHang.DA_GIAO],
      [TrangThaiDonHang.DA_GIAO, TrangThaiDonHang.HOAN_THANH],
    ];

    for (const [tu, den] of luong) {
      expect(coTheChuyenTrangThaiDonHang059(tu, den)).toBe(true);
      expect(() => validateChuyenTrangThaiDonHang059(tu, den)).not.toThrow();
    }
  });

  it('chi cho huy tu CHO_THANH_TOAN / DA_XAC_NHAN', () => {
    expect(coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DA_HUY)).toBe(
      true,
    );
    expect(coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DA_HUY)).toBe(
      true,
    );

    const khongDuocHuy = [
      TrangThaiDonHang.DANG_CHUAN_BI,
      TrangThaiDonHang.DA_DONG_GOI,
      TrangThaiDonHang.DANG_GIAO,
      TrangThaiDonHang.DA_GIAO,
      TrangThaiDonHang.HOAN_THANH,
      TrangThaiDonHang.DA_HUY,
    ] as const;

    for (const tu of khongDuocHuy) {
      expect(coTheChuyenTrangThaiDonHang059(tu, TrangThaiDonHang.DA_HUY)).toBe(false);
      expect(() => validateChuyenTrangThaiDonHang059(tu, TrangThaiDonHang.DA_HUY)).toThrow(
        LoiChuyenTrangThaiDonHang,
      );
    }
  });

  it('chan transition nhay coc va trang thai terminal', () => {
    expect(
      coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.CHO_THANH_TOAN, TrangThaiDonHang.DANG_GIAO),
    ).toBe(false);
    expect(
      coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.DA_XAC_NHAN, TrangThaiDonHang.DA_DONG_GOI),
    ).toBe(false);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.HOAN_THANH)).toEqual([]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_HUY)).toEqual([]);
  });

  it('KHIEU_NAI / HOAN_TIEN_* nam ngoai core machine (status doc lap)', () => {
    const ngoaiCore = [
      TrangThaiDonHang.KHIEU_NAI,
      TrangThaiDonHang.HOAN_TIEN_MOT_PHAN,
      TrangThaiDonHang.HOAN_TIEN_TOAN_BO,
    ] as const;

    for (const trangThai of ngoaiCore) {
      expect(laTrangThaiDonHangCotLoi059(trangThai)).toBe(false);
    }

    for (const tu of ngoaiCore) {
      for (const den of ngoaiCore) {
        expect(coTheChuyenTrangThaiDonHang059(tu, den)).toBe(false);
      }
      expect(
        coTheChuyenTrangThaiDonHang059(TrangThaiDonHang.CHO_THANH_TOAN, tu),
      ).toBe(false);
    }
  });

  it('danhSachTrangThaiTiepTheo059 tra dung ung vien cho admin actions', () => {
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.CHO_THANH_TOAN)).toEqual([
      TrangThaiDonHang.DA_XAC_NHAN,
      TrangThaiDonHang.DA_HUY,
    ]);
    expect(danhSachTrangThaiTiepTheo059(TrangThaiDonHang.DA_DONG_GOI)).toEqual([
      TrangThaiDonHang.DANG_GIAO,
    ]);
  });
});
