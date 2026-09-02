import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiNguoiDung } from '../../generated/prisma/client';

import type { LocKhachHangQuanTriDto } from './dto/loc-khach-hang-quan-tri.dto';
import type {
  ChiTietKhachHangQuanTriDto,
  DanhSachDonHangKhachHangQuanTriDto,
  DanhSachKhachHangQuanTriDto,
  DanhSachKhieuNaiKhachHangQuanTriDto,
  KhachHangQuanTriTomTatDto,
  TrangThaiKhoaKhachHangQuanTriDto,
} from './dto/phan-hoi-khach-hang-quan-tri.dto';

type MetadataAudit = { ip: string | null; userAgent: string | null };

type KhachHangRow = Prisma.KhachHangGetPayload<{
  include: { nguoiDung: true; _count: { select: { donHang: true } } };
}>;

@Injectable()
export class KhachHangQuanTriService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: LocKhachHangQuanTriDto): Promise<DanhSachKhachHangQuanTriDto> {
    const and: Prisma.KhachHangWhereInput[] = [];
    const timKiem = query.timKiem?.trim();

    if (timKiem) {
      and.push({
        nguoiDung: {
          is: {
            OR: [
              { hoTen: { contains: timKiem } },
              { email: { contains: timKiem } },
              { soDienThoai: { contains: timKiem } },
            ],
          },
        },
      });
    }
    if (query.trangThai) {
      and.push({ nguoiDung: { is: { trangThai: query.trangThai } } });
    }

    const where: Prisma.KhachHangWhereInput = and.length ? { AND: and } : {};
    const trang = query.trang ?? 1;
    const gioiHan = query.gioiHan ?? 20;
    const skip = (trang - 1) * gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.khachHang.findMany({
        where,
        include: { nguoiDung: true, _count: { select: { donHang: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: gioiHan,
      }),
      this.prisma.khachHang.count({ where }),
    ]);

    const khieuNaiCount = await this.demKhieuNaiTheoKhachHang(rows.map((row) => row.id));
    return {
      items: rows.map((row) => this.toTomTat(row, khieuNaiCount.get(row.id) ?? 0)),
      tong,
      trang,
      gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<ChiTietKhachHangQuanTriDto> {
    const row = await this.khachHangBatBuoc(id);
    const khieuNaiCount = await this.demKhieuNaiTheoKhachHang([id]);
    return {
      ...this.toTomTat(row, khieuNaiCount.get(id) ?? 0),
      updatedAt: row.updatedAt,
    };
  }

  async layDonHang(id: string): Promise<DanhSachDonHangKhachHangQuanTriDto> {
    await this.khachHangTonTai(id);
    const rows = await this.prisma.donHang.findMany({
      where: { khachHangId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        maDonHang: true,
        trangThai: true,
        tongTien: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      items: rows.map((row) => ({ ...row, tongTien: Number(row.tongTien) })),
      tong: rows.length,
    };
  }

  async layKhieuNai(id: string): Promise<DanhSachKhieuNaiKhachHangQuanTriDto> {
    await this.khachHangTonTai(id);
    const rows = await this.prisma.khieuNai.findMany({
      where: { mucDonHang: { donHangNhaCungCap: { donHang: { khachHangId: id } } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        lyDo: true,
        moTa: true,
        createdAt: true,
        mucDonHang: {
          select: {
            tenSanPhamSnapshot: true,
            donHangNhaCungCap: { select: { donHang: { select: { maDonHang: true } } } },
          },
        },
      },
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        lyDo: row.lyDo,
        moTa: row.moTa,
        maDonHang: row.mucDonHang.donHangNhaCungCap.donHang.maDonHang,
        tenSanPham: row.mucDonHang.tenSanPhamSnapshot,
        createdAt: row.createdAt,
      })),
      tong: rows.length,
    };
  }

  khoa(
    tacNhanId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<TrangThaiKhoaKhachHangQuanTriDto> {
    return this.doiTrangThai(tacNhanId, id, TrangThaiNguoiDung.TAM_KHOA, metadata);
  }

  moKhoa(
    tacNhanId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<TrangThaiKhoaKhachHangQuanTriDto> {
    return this.doiTrangThai(tacNhanId, id, TrangThaiNguoiDung.HOAT_DONG, metadata);
  }

  private async doiTrangThai(
    tacNhanId: string,
    khachHangId: string,
    trangThai: TrangThaiNguoiDung,
    metadata: MetadataAudit,
  ): Promise<TrangThaiKhoaKhachHangQuanTriDto> {
    const [actor, customer] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.khachHang.findUnique({
        where: { id: khachHangId },
        select: { id: true, nguoiDungId: true },
      }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng.');

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM nguoi_dung WHERE id = ${customer.nguoiDungId} FOR UPDATE`;
      const current = await tx.nguoiDung.findUniqueOrThrow({ where: { id: customer.nguoiDungId } });
      if (current.trangThai === trangThai) {
        return { id: customer.id, nguoiDungId: customer.nguoiDungId, trangThai };
      }

      await tx.nguoiDung.update({ where: { id: customer.nguoiDungId }, data: { trangThai } });
      if (trangThai === TrangThaiNguoiDung.TAM_KHOA) {
        await tx.phienDangNhap.updateMany({
          where: { nguoiDungId: customer.nguoiDungId, thuHoiLuc: null },
          data: { thuHoiLuc: new Date() },
        });
      }
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong:
            trangThai === TrangThaiNguoiDung.TAM_KHOA ? 'KHACH_HANG_KHOA' : 'KHACH_HANG_MO_KHOA',
          thucThe: 'khach_hang',
          thucTheId: customer.id,
          truoc: { trangThai: current.trangThai },
          sau: { trangThai },
          metadata,
        },
      });
      return { id: customer.id, nguoiDungId: customer.nguoiDungId, trangThai };
    });
  }

  private async khachHangTonTai(id: string): Promise<void> {
    const count = await this.prisma.khachHang.count({ where: { id } });
    if (!count) throw new NotFoundException('Không tìm thấy khách hàng.');
  }

  private async khachHangBatBuoc(id: string): Promise<KhachHangRow> {
    const row = await this.prisma.khachHang.findUnique({
      where: { id },
      include: { nguoiDung: true, _count: { select: { donHang: true } } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy khách hàng.');
    return row;
  }

  private async demKhieuNaiTheoKhachHang(ids: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!ids.length) return result;
    const rows = await this.prisma.khieuNai.findMany({
      where: { mucDonHang: { donHangNhaCungCap: { donHang: { khachHangId: { in: ids } } } } },
      select: {
        mucDonHang: {
          select: { donHangNhaCungCap: { select: { donHang: { select: { khachHangId: true } } } } },
        },
      },
    });
    for (const row of rows) {
      const id = row.mucDonHang.donHangNhaCungCap.donHang.khachHangId;
      result.set(id, (result.get(id) ?? 0) + 1);
    }
    return result;
  }

  private toTomTat(row: KhachHangRow, tongKhieuNai: number): KhachHangQuanTriTomTatDto {
    return {
      id: row.id,
      nguoiDungId: row.nguoiDungId,
      email: row.nguoiDung.email,
      hoTen: row.nguoiDung.hoTen,
      soDienThoai: row.nguoiDung.soDienThoai,
      ngaySinh: row.ngaySinh?.toISOString().slice(0, 10) ?? null,
      trangThai: row.nguoiDung.trangThai,
      tongDonHang: row._count.donHang,
      tongKhieuNai,
      createdAt: row.createdAt,
    };
  }
}
