import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';

import type {
  CapNhatHienThiDanhGiaQuanTriDto,
  DanhGiaQuanTriDto,
  DanhSachDanhGiaQuanTriDto,
  LocDanhGiaQuanTriDto,
} from './dto/quan-tri-danh-gia.dto';

const includeReview = {
  mucDonHang: {
    include: {
      donHangNhaCungCap: {
        include: {
          donHang: {
            include: {
              khachHang: {
                include: { nguoiDung: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.DanhGiaInclude;

type ReviewRow = Prisma.DanhGiaGetPayload<{ include: typeof includeReview }>;

@Injectable()
export class DanhGiaQuanTriService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: LocDanhGiaQuanTriDto): Promise<DanhSachDanhGiaQuanTriDto> {
    const timKiem = query.timKiem?.trim();
    const where: Prisma.DanhGiaWhereInput = {
      ...(query.diem ? { diem: query.diem } : {}),
      ...(query.hienThi !== undefined ? { hienThi: query.hienThi } : {}),
      ...(timKiem
        ? {
            OR: [
              { binhLuan: { contains: timKiem } },
              { mucDonHang: { tenSanPhamSnapshot: { contains: timKiem } } },
              { mucDonHang: { skuBienTheSnapshot: { contains: timKiem } } },
              {
                mucDonHang: {
                  donHangNhaCungCap: {
                    donHang: { maDonHang: { contains: timKiem } },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.danhGia.findMany({
        where,
        include: includeReview,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.danhGia.count({ where }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async capNhatHienThi(
    actorId: string,
    id: string,
    dto: CapNhatHienThiDanhGiaQuanTriDto,
  ): Promise<DanhGiaQuanTriDto> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: actorId },
      select: { id: true, email: true },
    });
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');

    const current = await this.prisma.danhGia.findUnique({
      where: { id },
      include: includeReview,
    });
    if (!current) throw new NotFoundException('Không tìm thấy đánh giá.');

    const lyDo = dto.lyDo?.trim() || null;
    if (!dto.hienThi && !lyDo) {
      throw new BadRequestException('Phải nhập lý do khi ẩn đánh giá.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.danhGia.update({
        where: { id },
        data: dto.hienThi
          ? { hienThi: true, lyDoAn: null, anLuc: null, anBoi: null }
          : { hienThi: false, lyDoAn: lyDo, anLuc: new Date(), anBoi: actor.email },
        include: includeReview,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: dto.hienThi ? 'DANH_GIA_HIEN_THI' : 'DANH_GIA_AN',
          thucThe: 'review',
          thucTheId: id,
          truoc: { hienThi: current.hienThi, lyDoAn: current.lyDoAn },
          sau: { hienThi: row.hienThi, lyDoAn: row.lyDoAn },
        },
      });

      return row;
    });

    return this.toDto(updated);
  }

  private toDto(row: ReviewRow): DanhGiaQuanTriDto {
    const order = row.mucDonHang.donHangNhaCungCap.donHang;
    return {
      id: row.id,
      mucDonHangId: row.mucDonHangId,
      sanPhamId: row.mucDonHang.sanPhamId,
      tenSanPham: row.mucDonHang.tenSanPhamSnapshot,
      sku: row.mucDonHang.skuBienTheSnapshot,
      maDonHang: order.maDonHang,
      hoTenKhach: order.khachHang.nguoiDung.hoTen,
      diem: row.diem,
      binhLuan: row.binhLuan,
      hienThi: row.hienThi,
      lyDoAn: row.lyDoAn,
      anBoi: row.anBoi,
      anLuc: row.anLuc,
      createdAt: row.createdAt,
    };
  }
}
