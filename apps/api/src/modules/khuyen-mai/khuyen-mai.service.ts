import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PhamViKhuyenMai, Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

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
      return this.khongTimThay(normalized);
    }

    return this.danhGiaQuyTac(this.snapshot(row), nguCanh);
  }

  /**
   * Khóa promotion row, đánh giá lại trên dữ liệu order đã lock và chỉ sau đó mới tăng usage.
   * Nhờ chạy trong cùng transaction với Create Order, usage không bị tiêu nếu order rollback.
   */
  async danhGiaVaGhiNhanTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    nguCanh: NguCanhKhuyenMai,
  ): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = ma.trim();
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );

    if (locked.length !== 1) {
      return this.khongTimThay(normalized);
    }

    const row = await tx.khuyenMai.findUnique({
      where: { id: locked[0].id },
    });
    if (!row) {
      return this.khongTimThay(normalized);
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe) {
      return ketQua;
    }

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { increment: 1 } },
    });

    return ketQua;
  }

  /** Hoàn lại một lượt sử dụng khi đơn được hủy hợp lệ. Gọi sau khi order row đã lock. */
  async hoanTacSuDungTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
  ): Promise<boolean> {
    const normalized = ma.trim();
    if (!normalized) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    if (locked.length !== 1) return false;

    const row = await tx.khuyenMai.findUnique({
      where: { id: locked[0].id },
      select: { id: true, soLanDaSuDung: true },
    });
    if (!row || row.soLanDaSuDung <= 0) return false;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { decrement: 1 } },
    });
    return true;
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

  private snapshot(row: {
    id: string;
    ma: string;
    phamVi: PhamViKhuyenMai;
    danhMucSanPhamId: string | null;
    sanPhamId: string | null;
    donHangToiThieu: Prisma.Decimal;
    giaTriGiam: Prisma.Decimal;
    batDauLuc: Date;
    ketThucLuc: Date;
    gioiHanSuDung: number | null;
    soLanDaSuDung: number;
    trangThai: TrangThaiBanGhi;
  }): QuyTacKhuyenMaiSnapshot {
    return {
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
    };
  }

  private khongTimThay(ma: string): KetQuaDanhGiaKhuyenMai {
    return {
      khuyenMaiId: null,
      ma,
      hopLe: false,
      lyDo: 'Không tìm thấy rule khuyến mại.',
      phamVi: null,
      danhMucSanPhamId: null,
      sanPhamId: null,
      giaTriGiam: 0,
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
