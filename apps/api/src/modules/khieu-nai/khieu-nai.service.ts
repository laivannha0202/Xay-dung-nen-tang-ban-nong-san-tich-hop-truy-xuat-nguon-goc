import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiVanChuyen, type Prisma } from '../../generated/prisma/client';

import type {
  DanhSachKhieuNaiDto,
  DieuKienKhieuNaiMucDonHangDto,
  KhieuNaiDto,
} from './dto/phan-hoi-khieu-nai.dto';
import type { TaoKhieuNaiDto } from './dto/tao-khieu-nai.dto';
import type { TruyVanKhieuNaiDto } from './dto/truy-van-khieu-nai.dto';

const KHIEU_NAI_INCLUDE = {
  mucDonHang: {
    include: {
      donHangNhaCungCap: {
        include: {
          donHang: true,
          nhaCungCap: true,
          vanChuyen: {
            orderBy: { createdAt: 'asc' as const },
          },
        },
      },
      phanBo: {
        include: {
          tonKhoLo: {
            include: {
              kho: true,
              loSanPham: true,
            },
          },
        },
      },
    },
  },
  bangChung: {
    include: {
      tepTin: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.KhieuNaiInclude;

type KhieuNaiDayDu = Prisma.KhieuNaiGetPayload<{ include: typeof KHIEU_NAI_INCLUDE }>;

@Injectable()
export class KhieuNaiService {
  constructor(private readonly prisma: PrismaService) {}

  async tao(nguoiDungId: string, dto: TaoKhieuNaiDto): Promise<KhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, dto.mucDonHangId);

    if (muc.donHangNhaCungCap.vanChuyen.length === 0) {
      throw new BadRequestException('Chỉ order item đã giao mới được khiếu nại.');
    }

    const tepTinIds = this.chuanHoaTepTinIds(dto.tepTinIds);
    if (tepTinIds.length > 0) {
      await this.kiemTraBangChung(nguoiDungId, tepTinIds);
    }

    const created = await this.prisma.khieuNai.create({
      data: {
        mucDonHangId: muc.id,
        lyDo: dto.lyDo,
        moTa: dto.moTa.trim(),
        ...(tepTinIds.length > 0
          ? {
              bangChung: {
                create: tepTinIds.map((tepTinId) => ({ tepTinId })),
              },
            }
          : {}),
      },
      select: { id: true },
    });

    return this.layChiTietTheoId(created.id);
  }

  async layDieuKienMuc(
    nguoiDungId: string,
    mucDonHangId: string,
  ): Promise<DieuKienKhieuNaiMucDonHangDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, mucDonHangId);
    const daGiao = muc.donHangNhaCungCap.vanChuyen.length > 0;
    return {
      mucDonHangId: muc.id,
      sanPhamId: muc.sanPhamId,
      tenSanPham: muc.tenSanPhamSnapshot,
      sku: muc.skuBienTheSnapshot,
      daGiao,
      coTheKhieuNai: daGiao,
      lyDo: daGiao ? null : 'Chỉ order item đã giao mới được khiếu nại.',
    };
  }

  async layDanhSachCuaToi(
    nguoiDungId: string,
    query: TruyVanKhieuNaiDto,
  ): Promise<DanhSachKhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    return this.layDanhSach(query, {
      mucDonHang: {
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
    });
  }

  async layChiTietCuaToi(nguoiDungId: string, id: string): Promise<KhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const complaint = await this.prisma.khieuNai.findFirst({
      where: {
        id,
        mucDonHang: {
          donHangNhaCungCap: {
            donHang: { khachHangId },
          },
        },
      },
      include: KHIEU_NAI_INCLUDE,
    });
    if (!complaint) {
      throw new NotFoundException('Không tìm thấy khiếu nại của khách hiện tại.');
    }
    return this.mapKhieuNai(complaint);
  }

  async layDanhSachQuanTri(query: TruyVanKhieuNaiDto): Promise<DanhSachKhieuNaiDto> {
    return this.layDanhSach(query, {});
  }

  async layChiTietQuanTri(id: string): Promise<KhieuNaiDto> {
    return this.layChiTietTheoId(id);
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const khach = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!khach) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return khach.id;
  }

  private async layMucCuaKhach(khachHangId: string, mucDonHangId: string) {
    const muc = await this.prisma.mucDonHang.findFirst({
      where: {
        id: mucDonHangId,
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
      select: {
        id: true,
        sanPhamId: true,
        tenSanPhamSnapshot: true,
        skuBienTheSnapshot: true,
        donHangNhaCungCap: {
          select: {
            vanChuyen: {
              where: { trangThai: TrangThaiVanChuyen.DELIVERED },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!muc) {
      throw new NotFoundException('Không tìm thấy order item thuộc khách hiện tại.');
    }
    return muc;
  }

  private chuanHoaTepTinIds(ids: string[] | undefined): string[] {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new BadRequestException('Evidence không được chứa file trùng.');
    }
    return unique;
  }

  private async kiemTraBangChung(nguoiDungId: string, tepTinIds: string[]): Promise<void> {
    const files = await this.prisma.tepTin.findMany({
      where: {
        id: { in: tepTinIds },
        nguoiTaiLenId: nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        xoaLuc: null,
      },
      select: {
        id: true,
        mimeType: true,
      },
    });

    if (files.length !== tepTinIds.length) {
      throw new BadRequestException('Evidence phải là file active do chính khách hiện tại upload.');
    }
    const invalid = files.find(
      (file) => !file.mimeType.startsWith('image/') && !file.mimeType.startsWith('video/'),
    );
    if (invalid) {
      throw new BadRequestException('Evidence khiếu nại chỉ nhận ảnh hoặc video.');
    }
  }

  private async layDanhSach(
    query: TruyVanKhieuNaiDto,
    baseWhere: Prisma.KhieuNaiWhereInput,
  ): Promise<DanhSachKhieuNaiDto> {
    const where: Prisma.KhieuNaiWhereInput = {
      ...baseWhere,
      ...(query.lyDo ? { lyDo: query.lyDo } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, items] = await this.prisma.$transaction([
      this.prisma.khieuNai.count({ where }),
      this.prisma.khieuNai.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
        select: {
          id: true,
          lyDo: true,
          createdAt: true,
          _count: { select: { bangChung: true } },
          mucDonHang: {
            select: {
              tenSanPhamSnapshot: true,
              donHangNhaCungCap: {
                select: {
                  donHang: {
                    select: { maDonHang: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        lyDo: item.lyDo,
        maDonHang: item.mucDonHang.donHangNhaCungCap.donHang.maDonHang,
        tenSanPham: item.mucDonHang.tenSanPhamSnapshot,
        soBangChung: item._count.bangChung,
        createdAt: item.createdAt,
      })),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private async layChiTietTheoId(id: string): Promise<KhieuNaiDto> {
    const complaint = await this.prisma.khieuNai.findUnique({
      where: { id },
      include: KHIEU_NAI_INCLUDE,
    });
    if (!complaint) {
      throw new NotFoundException('Không tìm thấy khiếu nại.');
    }
    return this.mapKhieuNai(complaint);
  }

  private mapKhieuNai(item: KhieuNaiDayDu): KhieuNaiDto {
    const muc = item.mucDonHang;
    const suborder = muc.donHangNhaCungCap;
    const order = suborder.donHang;
    return {
      id: item.id,
      lyDo: item.lyDo,
      moTa: item.moTa,
      donHang: {
        id: order.id,
        maDonHang: order.maDonHang,
      },
      donNhaCungCap: {
        id: suborder.id,
        maDon: suborder.maDon,
        tenNhaCungCap: suborder.nhaCungCap.ten,
      },
      mucDonHang: {
        id: muc.id,
        sanPhamId: muc.sanPhamId,
        bienTheSanPhamId: muc.bienTheSanPhamId,
        tenSanPham: muc.tenSanPhamSnapshot,
        sku: muc.skuBienTheSnapshot,
        soLuong: muc.soLuong,
        donGia: Number(muc.donGiaSnapshot),
        thanhTien: Number((Number(muc.donGiaSnapshot) * muc.soLuong).toFixed(2)),
        maTrangTrai: muc.maTrangTraiSnapshot,
        tenTrangTrai: muc.tenTrangTraiSnapshot,
      },
      phanBo: muc.phanBo.map((allocation) => ({
        tonKhoLoId: allocation.tonKhoLoId,
        maKho: allocation.tonKhoLo.kho.maKho,
        maLo: allocation.tonKhoLo.loSanPham.maLo,
        maTruyXuat: allocation.tonKhoLo.loSanPham.maTruyXuat,
        soLuong: Number(allocation.soLuong),
      })),
      vanChuyen: suborder.vanChuyen.map((shipment) => ({
        id: shipment.id,
        maVanDon: shipment.maVanDon,
        trangThai: shipment.trangThai,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      })),
      bangChung: item.bangChung.map((evidence) => ({
        id: evidence.id,
        tepTinId: evidence.tepTinId,
        tenGoc: evidence.tepTin.tenGoc,
        mimeType: evidence.tepTin.mimeType,
        createdAt: evidence.createdAt,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
