import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PhamViKhuyenMai, TrangThaiBanGhi } from '../../generated/prisma/client';

export type NguCanhKhuyenMai = {
  tongTienDonHang: number;
  danhMucIds: string[];
  sanPhamIds: string[];
  thoiDiem?: Date;
};

export type QuyTacKhuyenMaiSnapshot = {
  id: string;
  ma: string;
  phamVi: PhamViKhuyenMai;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam?: number;
  batDauLuc: Date;
  ketThucLuc: Date;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  trangThai: TrangThaiBanGhi;
};

export type KetQuaDanhGiaKhuyenMai = {
  khuyenMaiId: string | null;
  ma: string;
  hopLe: boolean;
  lyDo: string | null;
  phamVi: PhamViKhuyenMai | null;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  giaTriGiam: number;
};

@Injectable()
export class KhuyenMaiService {
  constructor(private readonly prisma: PrismaService) {}

  async danhGiaTheoMa(ma: string, nguCanh: NguCanhKhuyenMai): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = ma.trim();
    const row = await this.prisma.khuyenMai.findUnique({
      where: { ma: normalized },
    });

    if (!row) {
      return {
        khuyenMaiId: null,
        ma: normalized,
        hopLe: false,
        lyDo: 'Không tìm thấy rule khuyến mại.',
        phamVi: null,
        danhMucSanPhamId: null,
        sanPhamId: null,
        giaTriGiam: 0,
      };
    }

    return this.danhGiaQuyTac(
      {
        id: row.id,
        ma: row.ma,
        phamVi: row.phamVi,
        danhMucSanPhamId: row.danhMucSanPhamId,
        sanPhamId: row.sanPhamId,
        donHangToiThieu: Number(row.donHangToiThieu),
        giaTriGiam: Number(row.giaTriGiam),
        batDauLuc: row.batDauLuc,
        ketThucLuc: row.ketThucLuc,
        gioiHanSuDung: row.gioiHanSuDung,
        soLanDaSuDung: row.soLanDaSuDung,
        trangThai: row.trangThai,
      },
      nguCanh,
    );
  }

  danhGiaQuyTac(rule: QuyTacKhuyenMaiSnapshot, nguCanh: NguCanhKhuyenMai): KetQuaDanhGiaKhuyenMai {
    const meta = {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      giaTriGiam: Number(rule.giaTriGiam ?? 0),
    };
    const fail = (lyDo: string): KetQuaDanhGiaKhuyenMai => ({
      ...meta,
      hopLe: false,
      lyDo,
    });

    if (rule.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      return fail('Rule khuyến mại không hoạt động.');
    }

    if (!this.scopeTargetHopLe(rule)) {
      return fail('Rule khuyến mại có scope/target không hợp lệ.');
    }

    const thoiDiem = nguCanh.thoiDiem ?? new Date();
    if (
      thoiDiem.getTime() < rule.batDauLuc.getTime() ||
      thoiDiem.getTime() > rule.ketThucLuc.getTime()
    ) {
      return fail('Ngoài thời gian áp dụng.');
    }

    if (nguCanh.tongTienDonHang < rule.donHangToiThieu) {
      return fail('Chưa đạt giá trị đơn hàng tối thiểu.');
    }

    if (rule.gioiHanSuDung !== null && rule.soLanDaSuDung >= rule.gioiHanSuDung) {
      return fail('Rule đã đạt giới hạn sử dụng.');
    }

    if (
      rule.phamVi === PhamViKhuyenMai.DANH_MUC &&
      (!rule.danhMucSanPhamId || !nguCanh.danhMucIds.includes(rule.danhMucSanPhamId))
    ) {
      return fail('Đơn hàng không có danh mục được áp dụng.');
    }

    if (
      rule.phamVi === PhamViKhuyenMai.SAN_PHAM &&
      (!rule.sanPhamId || !nguCanh.sanPhamIds.includes(rule.sanPhamId))
    ) {
      return fail('Đơn hàng không có sản phẩm được áp dụng.');
    }

    if (meta.giaTriGiam <= 0) {
      return fail('Khuyến mại chưa được cấu hình giá trị giảm.');
    }

    return {
      ...meta,
      hopLe: true,
      lyDo: null,
    };
  }

  private scopeTargetHopLe(rule: QuyTacKhuyenMaiSnapshot): boolean {
    if (rule.phamVi === PhamViKhuyenMai.PLATFORM) {
      return rule.danhMucSanPhamId === null && rule.sanPhamId === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.DANH_MUC) {
      return rule.danhMucSanPhamId !== null && rule.sanPhamId === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.SAN_PHAM) {
      return rule.danhMucSanPhamId === null && rule.sanPhamId !== null;
    }
    return false;
  }
}
