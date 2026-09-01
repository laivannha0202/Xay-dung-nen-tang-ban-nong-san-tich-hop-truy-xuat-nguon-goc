import { Injectable } from '@nestjs/common';

import type { CheckoutPreviewDto } from './dto/checkout-preview.dto';
import { GioHangService } from './gio-hang.service';

const LY_DO_PROMOTION = 'Repository chưa có module/chính sách khuyến mãi để tính promotion.';
const LY_DO_SHIPPING = 'Repository chưa có nguồn sự thật về biểu phí vận chuyển để tính shipping.';
const LY_DO_POINTS = 'Repository chưa có module điểm thưởng để tính points.';

@Injectable()
export class CheckoutPreviewService {
  constructor(private readonly gioHangService: GioHangService) {}

  async lay(nguoiDungId: string): Promise<CheckoutPreviewDto> {
    const gioHang = await this.gioHangService.lay(nguoiDungId);

    const items = gioHang.muc.map((muc) => {
      const donGia = muc.bienThe.giaHienTai;
      const thanhTien = this.tien(donGia * muc.soLuong);

      return {
        mucGioHangId: muc.id,
        sanPhamId: muc.bienThe.sanPham.id,
        tenSanPham: muc.bienThe.sanPham.ten,
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

    const lyDoKhongTheXacNhan = [LY_DO_PROMOTION, LY_DO_SHIPPING, LY_DO_POINTS];

    if (items.length === 0) {
      lyDoKhongTheXacNhan.unshift('Giỏ hàng đang trống.');
    }

    if (items.some((item) => !item.coTheDatHang)) {
      lyDoKhongTheXacNhan.unshift('Có sản phẩm không đủ tồn khả dụng hiện tại.');
    }

    return {
      gioHangId: gioHang.id,
      items,
      price: {
        tamTinhHangHoa,
        tienTe: 'VND',
      },
      promotion: {
        trangThai: 'CHUA_CO_NGUON_SU_THAT',
        giaTri: null,
        lyDo: LY_DO_PROMOTION,
      },
      shipping: {
        trangThai: 'CHUA_CO_NGUON_SU_THAT',
        giaTri: null,
        lyDo: LY_DO_SHIPPING,
      },
      points: {
        trangThai: 'CHUA_CO_NGUON_SU_THAT',
        giaTri: null,
        lyDo: LY_DO_POINTS,
      },
      total: {
        tamTinhDaBiet: tamTinhHangHoa,
        tongThanhToan: null,
        coTheXacNhan: false,
        lyDoKhongTheXacNhan,
      },
    };
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }
}
