import {
  LoaiGiamGiaKhuyenMai,
  PhamViKhuyenMai,
  TrangThaiBanGhi,
} from '../../generated/prisma/client';
import { CheckoutPricingService } from '../gio-hang/checkout-pricing.service';
import { KhuyenMaiService, type QuyTacKhuyenMaiSnapshot } from './khuyen-mai.service';

function rule(overrides: Partial<QuyTacKhuyenMaiSnapshot> = {}): QuyTacKhuyenMaiSnapshot {
  return {
    id: 'rule-1',
    ma: 'RAU10',
    phamVi: PhamViKhuyenMai.PLATFORM,
    danhMucSanPhamId: null,
    sanPhamId: null,
    trangTraiId: null,
    loaiGiam: LoaiGiamGiaKhuyenMai.SO_TIEN,
    donHangToiThieu: 200_000,
    giaTriGiam: 50_000,
    giamToiDa: null,
    gioiHanMoiKhach: null,
    batDauLuc: new Date('2026-10-05T00:00:00.000Z'),
    ketThucLuc: new Date('2026-10-20T00:00:00.000Z'),
    gioiHanSuDung: 100,
    soLanDaSuDung: 0,
    trangThai: TrangThaiBanGhi.HOAT_DONG,
    ...overrides,
  };
}

describe('KhuyenMaiService.danhGiaQuyTac (pure, khong can DB)', () => {
  const service = new KhuyenMaiService({} as never);
  const giuaKy = new Date('2026-10-10T00:00:00.000Z');

  it('voucher hop le khi dung thoi gian, du min order, con luot', () => {
    const ketQua = service.danhGiaQuyTac(rule(), {
      tongTienDonHang: 200_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: giuaKy,
    });
    expect(ketQua).toMatchObject({ hopLe: true, ma: 'RAU10', giaTriGiam: 50_000 });
  });

  it('thieu min order 1d cung bi reject', () => {
    const ketQua = service.danhGiaQuyTac(rule(), {
      tongTienDonHang: 199_999,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: giuaKy,
    });
    expect(ketQua).toMatchObject({ hopLe: false, lyDo: 'Chưa đạt giá trị đơn hàng tối thiểu.' });
  });

  it('chua toi gio / het han / paused deu khong ap dung', () => {
    const truoc = service.danhGiaQuyTac(rule(), {
      tongTienDonHang: 500_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: new Date('2026-10-04T23:59:59.000Z'),
    });
    expect(truoc).toMatchObject({ hopLe: false, lyDo: 'Ngoài thời gian áp dụng.' });

    const sau = service.danhGiaQuyTac(rule(), {
      tongTienDonHang: 500_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: new Date('2026-10-20T00:00:01.000Z'),
    });
    expect(sau).toMatchObject({ hopLe: false, lyDo: 'Ngoài thời gian áp dụng.' });

    const paused = service.danhGiaQuyTac(rule({ trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG }), {
      tongTienDonHang: 500_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: giuaKy,
    });
    expect(paused).toMatchObject({ hopLe: false, lyDo: 'Rule khuyến mại không hoạt động.' });
  });

  it('het usage limit / sai scope / chua cau hinh gia tri', () => {
    const hetLuot = service.danhGiaQuyTac(rule({ soLanDaSuDung: 100 }), {
      tongTienDonHang: 500_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: giuaKy,
    });
    expect(hetLuot).toMatchObject({ hopLe: false, lyDo: 'Rule đã đạt giới hạn sử dụng.' });

    const saiDanhMuc = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.DANH_MUC, danhMucSanPhamId: 'dm-1' }),
      { tongTienDonHang: 500_000, danhMucIds: ['dm-khac'], sanPhamIds: [], thoiDiem: giuaKy },
    );
    expect(saiDanhMuc).toMatchObject({
      hopLe: false,
      lyDo: 'Đơn hàng không có danh mục được áp dụng.',
    });

    const dungSanPham = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.SAN_PHAM, sanPhamId: 'sp-1' }),
      { tongTienDonHang: 500_000, danhMucIds: [], sanPhamIds: ['sp-1'], thoiDiem: giuaKy },
    );
    expect(dungSanPham.hopLe).toBe(true);

    const saiSanPham = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.SAN_PHAM, sanPhamId: 'sp-1' }),
      { tongTienDonHang: 500_000, danhMucIds: [], sanPhamIds: ['sp-khac'], thoiDiem: giuaKy },
    );
    expect(saiSanPham).toMatchObject({
      hopLe: false,
      lyDo: 'Đơn hàng không có sản phẩm được áp dụng.',
    });

    const zero = service.danhGiaQuyTac(rule({ giaTriGiam: 0 }), {
      tongTienDonHang: 500_000,
      danhMucIds: [],
      sanPhamIds: [],
      thoiDiem: giuaKy,
    });
    expect(zero).toMatchObject({
      hopLe: false,
      lyDo: 'Khuyến mại chưa được cấu hình giá trị giảm.',
    });
  });
});

describe('KhuyenMai PERCENT + gioi han moi khach + pham vi trang trai', () => {
  const service = new KhuyenMaiService({} as never);
  const giuaKy = new Date('2026-10-10T00:00:00.000Z');
  const ctx = {
    tongTienDonHang: 200_000,
    danhMucIds: [],
    sanPhamIds: [],
    trangTraiIds: ['farm-1'],
    thoiDiem: giuaKy,
  };

  it('RAU10 10% tren don 200k = 20k', () => {
    const ketQua = service.danhGiaQuyTac(
      rule({ loaiGiam: LoaiGiamGiaKhuyenMai.PHAN_TRAM, giaTriGiam: 10 }),
      ctx,
    );
    expect(ketQua).toMatchObject({ hopLe: true, giaTriGiam: 20_000 });
  });

  it('giam toi da 15k chan percent', () => {
    const ketQua = service.danhGiaQuyTac(
      rule({ loaiGiam: LoaiGiamGiaKhuyenMai.PHAN_TRAM, giaTriGiam: 10, giamToiDa: 15_000 }),
      ctx,
    );
    expect(ketQua).toMatchObject({ hopLe: true, giaTriGiam: 15_000 });
  });

  it('percent > 100 / <= 0 bi reject', () => {
    for (const pct of [0, -5, 101]) {
      const ketQua = service.danhGiaQuyTac(
        rule({ loaiGiam: LoaiGiamGiaKhuyenMai.PHAN_TRAM, giaTriGiam: pct }),
        ctx,
      );
      expect(ketQua.hopLe).toBe(false);
    }
  });

  it('pham vi trang trai chi match dung farm', () => {
    const dung = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.TRANG_TRAI, trangTraiId: 'farm-1' }),
      ctx,
    );
    expect(dung.hopLe).toBe(true);

    const sai = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.TRANG_TRAI, trangTraiId: 'farm-1' }),
      { ...ctx, trangTraiIds: ['farm-khac'] },
    );
    expect(sai).toMatchObject({
      hopLe: false,
      lyDo: 'Đơn hàng không có sản phẩm từ trang trại được áp dụng.',
    });
  });

  it('scope/target thieu farm id bi fail dong', () => {
    const ketQua = service.danhGiaQuyTac(
      rule({ phamVi: PhamViKhuyenMai.TRANG_TRAI, trangTraiId: null }),
      ctx,
    );
    expect(ketQua).toMatchObject({
      hopLe: false,
      lyDo: 'Rule khuyến mại có scope/target không hợp lệ.',
    });
  });
});

describe('CheckoutPricingService.tinh (base -> voucher -> diem -> ship -> total)', () => {
  const prismaStub = {
    cauHinhHeThong: {
      findUnique: async () => ({
        phiVanChuyenCoBan: 20_000,
        nguongMienPhiVanChuyen: 300_000,
      }),
    },
  };

  it('voucher truoc, diem sau, khong double discount, tong chot dung', async () => {
    const service = new CheckoutPricingService(prismaStub as never);
    // tamTinh 100k (da la gia hieu luc sau flash) - voucher 10k - diem 5k + ship 20k
    const ketQua = await service.tinh(100_000, { giamKhuyenMai: 10_000, giaTriDiemDaDung: 5_000 });
    expect(ketQua).toMatchObject({
      tamTinhHangHoa: 100_000,
      giamKhuyenMai: 10_000,
      giaTriDiemDaDung: 5_000,
      phiVanChuyen: 20_000,
      tongThanhToan: 105_000,
    });
  });

  it('mien phi ship khi subtotal cham nguong, voucher khong vuot subtotal', async () => {
    const service = new CheckoutPricingService(prismaStub as never);
    const free = await service.tinh(300_000, { giamKhuyenMai: 50_000 });
    expect(free.phiVanChuyen).toBe(0);
    expect(free.tongThanhToan).toBe(250_000);

    await expect(service.tinh(100_000, { giamKhuyenMai: 100_001 })).rejects.toThrow(
      'Giảm khuyến mại không được vượt tiền hàng.',
    );
    await expect(
      service.tinh(100_000, { giamKhuyenMai: 10_000, giaTriDiemDaDung: 90_001 }),
    ).rejects.toThrow('Giá trị điểm thưởng không được vượt tiền hàng còn lại.');
    await expect(service.tinh(100_000, { giamKhuyenMai: -1 })).rejects.toThrow(
      'Thành phần giảm giá checkout không được âm.',
    );
  });
});
