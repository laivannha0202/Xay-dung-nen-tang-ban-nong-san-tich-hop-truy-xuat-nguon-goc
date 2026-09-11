import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type {
  DanhSachGiaoDichDiemThuongDto,
  TongQuanDiemThuongDto,
} from './dto/phan-hoi-diem-thuong.dto';
import type { TruyVanGiaoDichDiemThuongDto } from './dto/truy-van-giao-dich-diem-thuong.dto';

export type KetQuaSuDungDiem = {
  diemSuDung: number;
  giaTriDiemDaDung: number;
  soDuSau: number;
};

@Injectable()
export class DiemThuongService {
  constructor(private readonly prisma: PrismaService) {}

  async layTongQuan(nguoiDungId: string): Promise<TongQuanDiemThuongDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const taiKhoan = await this.prisma.taiKhoanLoyalty.findUnique({
      where: { khachHangId },
      select: {
        diem: true,
        updatedAt: true,
        _count: { select: { giaoDich: true } },
      },
    });

    if (!taiKhoan) {
      return {
        diem: 0,
        tongGiaoDich: 0,
        capNhatLuc: null,
      };
    }

    return {
      diem: taiKhoan.diem,
      tongGiaoDich: taiKhoan._count.giaoDich,
      capNhatLuc: taiKhoan.updatedAt,
    };
  }

  async layGiaoDich(
    nguoiDungId: string,
    query: TruyVanGiaoDichDiemThuongDto,
  ): Promise<DanhSachGiaoDichDiemThuongDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const taiKhoan = await this.prisma.taiKhoanLoyalty.findUnique({
      where: { khachHangId },
      select: { id: true },
    });

    if (!taiKhoan) {
      return {
        items: [],
        tong: 0,
        trang: query.trang,
        gioiHan: query.gioiHan,
      };
    }

    const where = { loyaltyAccountId: taiKhoan.id };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, items] = await this.prisma.$transaction([
      this.prisma.giaoDichLoyalty.count({ where }),
      this.prisma.giaoDichLoyalty.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
        select: {
          id: true,
          bienDongDiem: true,
          soDuSau: true,
          lyDo: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items,
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  /**
   * Khóa loyalty account, kiểm tra số dư + conversion rate và ghi ledger debit trong cùng transaction.
   */
  async suDungTrongTransaction(
    tx: Prisma.TransactionClient,
    input: {
      khachHangId: string;
      diemSuDung: number;
      giaTriToiDa: number;
      maDonHang: string;
    },
  ): Promise<KetQuaSuDungDiem> {
    if (input.diemSuDung <= 0) {
      return { diemSuDung: 0, giaTriDiemDaDung: 0, soDuSau: 0 };
    }

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM loyalty_account
        WHERE khach_hang_id = ${input.khachHangId}
        FOR UPDATE
      `,
    );
    if (locked.length !== 1) {
      throw new BadRequestException('Khách hàng chưa có tài khoản điểm thưởng.');
    }

    const taiKhoan = await tx.taiKhoanLoyalty.findUnique({
      where: { id: locked[0].id },
      select: { id: true, diem: true },
    });
    if (!taiKhoan) {
      throw new BadRequestException('Không tìm thấy tài khoản điểm thưởng.');
    }
    if (taiKhoan.diem < input.diemSuDung) {
      throw new BadRequestException(`Số dư điểm không đủ. Hiện có ${taiKhoan.diem} điểm.`);
    }

    const settings = await tx.cauHinhHeThong.findUnique({
      where: { id: 1 },
      select: { giaTriQuyDoiMoiDiem: true },
    });
    const giaTriQuyDoiMoiDiem = Number(settings?.giaTriQuyDoiMoiDiem ?? 0);
    if (giaTriQuyDoiMoiDiem <= 0) {
      throw new BadRequestException('Hệ thống chưa cấu hình giá trị quy đổi điểm thưởng.');
    }

    const giaTriDiemDaDung = this.tien(input.diemSuDung * giaTriQuyDoiMoiDiem);
    if (giaTriDiemDaDung > this.tien(Math.max(0, input.giaTriToiDa))) {
      throw new BadRequestException(
        'Giá trị điểm thưởng vượt tiền hàng còn lại sau khuyến mãi.',
      );
    }

    const soDuSau = taiKhoan.diem - input.diemSuDung;
    await tx.taiKhoanLoyalty.update({
      where: { id: taiKhoan.id },
      data: { diem: { decrement: input.diemSuDung } },
    });
    await tx.giaoDichLoyalty.create({
      data: {
        loyaltyAccountId: taiKhoan.id,
        maThamChieu: this.maThamChieuSuDung(input.maDonHang),
        bienDongDiem: -input.diemSuDung,
        soDuSau,
        lyDo: `Sử dụng điểm cho đơn ${input.maDonHang}.`,
      },
    });

    return {
      diemSuDung: input.diemSuDung,
      giaTriDiemDaDung,
      soDuSau,
    };
  }

  /**
   * Hoàn điểm khi đơn bị hủy. Reference refund là unique nên ngay cả khi action bị retry cũng không cộng hai lần.
   */
  async hoanTrongTransaction(
    tx: Prisma.TransactionClient,
    input: { khachHangId: string; diemDaDung: number; maDonHang: string },
  ): Promise<boolean> {
    if (input.diemDaDung <= 0) return false;

    const maThamChieu = this.maThamChieuHoan(input.maDonHang);
    const daHoan = await tx.giaoDichLoyalty.findUnique({
      where: { maThamChieu },
      select: { id: true },
    });
    if (daHoan) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM loyalty_account
        WHERE khach_hang_id = ${input.khachHangId}
        FOR UPDATE
      `,
    );
    if (locked.length !== 1) {
      throw new ConflictException('Không tìm thấy tài khoản điểm để hoàn điểm của đơn hàng.');
    }

    const taiKhoan = await tx.taiKhoanLoyalty.findUnique({
      where: { id: locked[0].id },
      select: { id: true, diem: true },
    });
    if (!taiKhoan) {
      throw new ConflictException('Không tìm thấy tài khoản điểm để hoàn điểm của đơn hàng.');
    }

    const soDuSau = taiKhoan.diem + input.diemDaDung;
    await tx.taiKhoanLoyalty.update({
      where: { id: taiKhoan.id },
      data: { diem: { increment: input.diemDaDung } },
    });
    await tx.giaoDichLoyalty.create({
      data: {
        loyaltyAccountId: taiKhoan.id,
        maThamChieu,
        bienDongDiem: input.diemDaDung,
        soDuSau,
        lyDo: `Hoàn điểm do hủy đơn ${input.maDonHang}.`,
      },
    });
    return true;
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const khachHang = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });

    if (!khachHang) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }

    return khachHang.id;
  }

  private maThamChieuSuDung(maDonHang: string): string {
    return `ORDER:${maDonHang}:LOYALTY_REDEEM`;
  }

  private maThamChieuHoan(maDonHang: string): string {
    return `ORDER:${maDonHang}:LOYALTY_REFUND`;
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }
}
