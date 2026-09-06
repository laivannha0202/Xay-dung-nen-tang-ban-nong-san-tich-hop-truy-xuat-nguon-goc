import { Injectable } from '@nestjs/common';

import { CheckoutPricingService } from './checkout-pricing.service';
import type { CheckoutPreviewDto } from './dto/checkout-preview.dto';
import { GioHangService } from './gio-hang.service';

@Injectable()
export class CheckoutPreviewService {
  constructor(
    private readonly gioHangService: GioHangService,
    private readonly pricingService: CheckoutPricingService,
  ) {}

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
    const pricing = await this.pricingService.tinh(tamTinhHangHoa);

    const lyDoKhongTheXacNhan: string[] = [];

    if (items.length === 0) {
      lyDoKhongTheXacNhan.push('Giỏ hàng đang trống.');
    }

    if (items.some((item) => !item.coTheDatHang)) {
      lyDoKhongTheXacNhan.push('Có sản phẩm không đủ tồn khả dụng hiện tại.');
    }

    const coTheXacNhan = lyDoKhongTheXacNhan.length === 0;

    return {
      gioHangId: gioHang.id,
      items,
      price: {
        tamTinhHangHoa: pricing.tamTinhHangHoa,
        tienTe: 'VND',
      },
      promotion: {
        trangThai: 'KHONG_AP_DUNG',
        giaTri: 0,
        lyDo: 'Chưa áp dụng mã khuyến mãi cho checkout này.',
      },
      shipping: {
        trangThai: 'DA_TINH',
        giaTri: pricing.phiVanChuyen,
        lyDo:
          pricing.phiVanChuyen === 0
            ? 'Phí vận chuyển hiện tại bằng 0 theo cấu hình hệ thống.'
            : 'Phí vận chuyển được tính theo cấu hình hệ thống.',
      },
      points: {
        trangThai: 'KHONG_AP_DUNG',
        giaTri: 0,
        lyDo: 'Chưa sử dụng điểm loyalty cho checkout này.',
      },
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
