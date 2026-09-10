import { Injectable, NotFoundException } from '@nestjs/common';

import {
  xepHangHybridAffinityV1,
  xepHangMostPopular90d,
  type GoiYRecommendation,
} from '../../ai/recommendation/baseline-recommendation';
import { BoDuLieuRecommendationBuilder } from '../../ai/recommendation/bo-du-lieu-recommendation';
import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import { SanPhamCongKhaiService } from '../san-pham/san-pham-cong-khai.service';
import type { SanPhamCongKhaiTomTatDto } from '../san-pham/dto/phan-hoi-san-pham-cong-khai.dto';

import type { DanhSachGoiYSanPhamDto } from './dto/phan-hoi-goi-y.dto';

@Injectable()
export class GoiYService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sanPhamCongKhaiService: SanPhamCongKhaiService,
  ) {}

  async layChoNguoiDung(nguoiDungId: string, gioiHan: number): Promise<DanhSachGoiYSanPhamDto> {
    const khachHangId = await this.khachHangBatBuoc(nguoiDungId);
    const thoiDiem = new Date();
    const dataset = await new BoDuLieuRecommendationBuilder(this.prisma).tao(thoiDiem);

    const context = {
      khachHangId,
      thoiDiem,
      lichSu: dataset.tuongTac,
      auxiliary: dataset.phanChia.auxiliary,
      sanPham: dataset.sanPham,
      topK: gioiHan,
    };

    const hybrid = xepHangHybridAffinityV1(context);
    const caNhanHoa = hybrid.some(
      (item) => item.thanhPhan.danhMuc > 0 || item.thanhPhan.trangTrai > 0,
    );

    const chienLuoc = caNhanHoa ? 'HYBRID_AFFINITY_V1' : 'MOST_POPULAR_90D';
    const xepHang = caNhanHoa ? hybrid : xepHangMostPopular90d(context);
    const duLieu = await Promise.all(xepHang.map((item) => this.lamGiau(item)));

    return {
      chienLuoc,
      caNhanHoa,
      duLieu,
      tong: duLieu.length,
    };
  }

  private async lamGiau(item: GoiYRecommendation) {
    const chiTiet = await this.sanPhamCongKhaiService.layChiTiet(item.sanPhamId);
    const sanPham: SanPhamCongKhaiTomTatDto = {
      id: chiTiet.id,
      ten: chiTiet.ten,
      moTa: chiTiet.moTa,
      danhMuc: chiTiet.danhMuc,
      trangTrai: chiTiet.trangTrai,
      gia: chiTiet.gia,
      quyCach: chiTiet.quyCach,
      anhBiaUrl: chiTiet.anhBiaUrl,
      chungNhan: chiTiet.chungNhan,
      khaDung: chiTiet.khaDung,
    };

    return {
      sanPham,
      diem: item.diem,
      thanhPhan: item.thanhPhan,
    };
  }

  private async khachHangBatBuoc(nguoiDungId: string): Promise<string> {
    const khachHang = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      select: { id: true, trangThai: true },
    });

    if (!khachHang || khachHang.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng đang hoạt động.');
    }

    return khachHang.id;
  }
}
