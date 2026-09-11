import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import { PhamViGiaoHangService } from '../giao-hang/pham-vi-giao-hang.service';
import { KhuyenMaiService } from '../khuyen-mai/khuyen-mai.service';

import { CheckoutPricingService } from './checkout-pricing.service';
import type { CheckoutPreviewDto } from './dto/checkout-preview.dto';
import type { TruyVanCheckoutPreviewDto } from './dto/truy-van-checkout-preview.dto';
import { GioHangService } from './gio-hang.service';

@Injectable()
export class CheckoutPreviewService {
  constructor(
    private readonly gioHangService: GioHangService,
    private readonly pricingService: CheckoutPricingService,
    private readonly khuyenMaiService: KhuyenMaiService,
    private readonly cauHinhHeThongService: CauHinhHeThongService,
    private readonly phamViGiaoHangService: PhamViGiaoHangService,
    private readonly prisma: PrismaService,
  ) {}

  async lay(
    nguoiDungId: string,
    query: TruyVanCheckoutPreviewDto = {},
  ): Promise<CheckoutPreviewDto> {
    const gioHang = await this.gioHangService.lay(nguoiDungId);

    const items = gioHang.muc.map((muc) => {
      const donGia = muc.bienThe.giaHienTai;
      const thanhTien = this.tien(donGia * muc.soLuong);

      return {
        mucGioHangId: muc.id,
        sanPhamId: muc.bienThe.sanPham.id,
        tenSanPham: muc.bienThe.sanPham.ten,
        anhBiaUrl: muc.bienThe.sanPham.anhBiaUrl,
        bienTheId: muc.bienThe.id,
        sku: muc.bienThe.sku,
        soLuong: muc.soLuong,
        donGia,
        thanhTien,
        soLuongKhaDung: muc.bienThe.soLuongKhaDung,
        coTheDatHang: muc.bienThe.coTheDatHang,
        nhaCungCap: {
          id: muc.bienThe.sanPham.trangTrai.nhaCungCap.id,
          ten: muc.bienThe.sanPham.trangTrai.nhaCungCap.ten,
        },
      };
    });

    const tamTinhHangHoa = this.tien(items.reduce((tong, item) => tong + item.thanhTien, 0));
    const lyDoKhongTheXacNhan: string[] = [];

    if (items.length === 0) {
      lyDoKhongTheXacNhan.push('Giỏ hàng đang trống.');
    }

    if (items.some((item) => !item.coTheDatHang)) {
      lyDoKhongTheXacNhan.push('Có sản phẩm không đủ tồn khả dụng hiện tại.');
    }

    const danhGiaGiaoHang = await this.phamViGiaoHangService.danhGiaDiaChi(
      nguoiDungId,
      query.diaChiGiaoHangId,
    );
    if (!danhGiaGiaoHang.hopLe) {
      lyDoKhongTheXacNhan.push(
        `Giao hàng: ${danhGiaGiaoHang.lyDo ?? 'Địa chỉ giao hàng không hợp lệ.'}`,
      );
    }

    const maKhuyenMai = query.maKhuyenMai?.trim() ?? '';
    let giamKhuyenMai = 0;
    let promotion: CheckoutPreviewDto['promotion'] = {
      trangThai: 'KHONG_AP_DUNG',
      giaTri: 0,
      lyDo: 'Chưa áp dụng mã khuyến mãi cho checkout này.',
    };

    if (maKhuyenMai) {
      const sanPhamIds = items.map((item) => item.sanPhamId);
      const productRows =
        sanPhamIds.length === 0
          ? []
          : await this.prisma.sanPham.findMany({
              where: { id: { in: sanPhamIds } },
              select: { id: true, danhMucSanPhamId: true },
            });
      const danhMucIds = [...new Set(productRows.map((row) => row.danhMucSanPhamId))];
      const ketQua = await this.khuyenMaiService.danhGiaTheoMa(maKhuyenMai, {
        tongTienDonHang: tamTinhHangHoa,
        danhMucIds,
        sanPhamIds,
      });

      if (ketQua.hopLe) {
        giamKhuyenMai = this.tien(Math.min(ketQua.giaTriGiam, tamTinhHangHoa));
        promotion = {
          trangThai: 'DA_TINH',
          giaTri: giamKhuyenMai,
          lyDo: `Đã áp dụng mã ${ketQua.ma}.`,
        };
      } else {
        const lyDo = ketQua.lyDo ?? 'Mã khuyến mãi không hợp lệ.';
        promotion = {
          trangThai: 'KHONG_HOP_LE',
          giaTri: 0,
          lyDo,
        };
        lyDoKhongTheXacNhan.push(`Khuyến mãi: ${lyDo}`);
      }
    }

    const diemSuDung = query.diemSuDung ?? 0;
    let giaTriDiemDaDung = 0;
    let points: CheckoutPreviewDto['points'] = {
      trangThai: 'KHONG_AP_DUNG',
      giaTri: 0,
      lyDo: 'Chưa sử dụng điểm loyalty cho checkout này.',
    };

    if (diemSuDung > 0) {
      const [taiKhoan, giaTriQuyDoiMoiDiem] = await Promise.all([
        this.prisma.taiKhoanLoyalty.findUnique({
          where: { khachHangId: gioHang.khachHangId },
          select: { diem: true },
        }),
        this.cauHinhHeThongService.layGiaTriQuyDoiMoiDiem(),
      ]);

      let lyDoDiem: string | null = null;
      if (!taiKhoan || taiKhoan.diem < diemSuDung) {
        lyDoDiem = `Số dư điểm không đủ. Hiện có ${taiKhoan?.diem ?? 0} điểm.`;
      } else if (giaTriQuyDoiMoiDiem <= 0) {
        lyDoDiem = 'Hệ thống chưa cấu hình giá trị quy đổi điểm thưởng.';
      } else {
        giaTriDiemDaDung = this.tien(diemSuDung * giaTriQuyDoiMoiDiem);
        const toiDaCoTheGiam = this.tien(Math.max(0, tamTinhHangHoa - giamKhuyenMai));
        if (giaTriDiemDaDung > toiDaCoTheGiam) {
          lyDoDiem = 'Giá trị điểm thưởng vượt tiền hàng còn lại sau khuyến mãi.';
          giaTriDiemDaDung = 0;
        }
      }

      if (lyDoDiem) {
        points = {
          trangThai: 'KHONG_HOP_LE',
          giaTri: 0,
          lyDo: lyDoDiem,
        };
        lyDoKhongTheXacNhan.push(`Điểm thưởng: ${lyDoDiem}`);
      } else {
        points = {
          trangThai: 'DA_TINH',
          giaTri: giaTriDiemDaDung,
          lyDo: `Đã áp dụng ${diemSuDung} điểm thưởng.`,
        };
      }
    }

    const pricing = await this.pricingService.tinh(tamTinhHangHoa, {
      giamKhuyenMai,
      giaTriDiemDaDung,
    });
    const coTheXacNhan = lyDoKhongTheXacNhan.length === 0;

    return {
      gioHangId: gioHang.id,
      items,
      price: {
        tamTinhHangHoa: pricing.tamTinhHangHoa,
        tienTe: 'VND',
      },
      promotion,
      shipping: danhGiaGiaoHang.hopLe
        ? {
            trangThai: 'DA_TINH',
            giaTri: pricing.phiVanChuyen,
            lyDo:
              pricing.phiVanChuyen === 0
                ? 'Địa chỉ thuộc phạm vi Hưng Yên; phí vận chuyển hiện tại bằng 0 theo cấu hình hệ thống.'
                : 'Địa chỉ thuộc phạm vi Hưng Yên; phí vận chuyển được tính theo cấu hình hệ thống.',
          }
        : {
            trangThai: 'KHONG_HOP_LE',
            giaTri: null,
            lyDo: danhGiaGiaoHang.lyDo ?? 'Địa chỉ giao hàng không hợp lệ.',
          },
      points,
      total: {
        tamTinhDaBiet: pricing.tamTinhHangHoa,
        tongThanhToan: coTheXacNhan ? pricing.tongThanhToan : null,
        coTheXacNhan,
        lyDoKhongTheXacNhan,
      },
    };
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }
}
