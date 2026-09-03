import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiThanhToan } from '../../generated/prisma/client';

import type {
  BaoCaoDonHangDoanhThuDto,
  BaoCaoDonHangDoanhThuItemDto,
} from './dto/phan-hoi-bao-cao-don-hang-doanh-thu.dto';
import type { TruyVanBaoCaoDonHangDoanhThuDto } from './dto/truy-van-bao-cao-don-hang-doanh-thu.dto';

const TRANG_THAI_THANH_TOAN_CO_DOANH_THU: TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PAID,
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

const INCLUDE_CHI_TIET = {
  donHangNhaCungCap: {
    include: {
      donHang: true,
      nhaCungCap: true,
    },
  },
} satisfies Prisma.MucDonHangInclude;

type MucDonHangChiTiet = Prisma.MucDonHangGetPayload<{ include: typeof INCLUDE_CHI_TIET }>;

@Injectable()
export class BaoCaoDonHangDoanhThuService {
  constructor(private readonly prisma: PrismaService) {}

  async layBaoCao(query: TruyVanBaoCaoDonHangDoanhThuDto): Promise<BaoCaoDonHangDoanhThuDto> {
    const where = this.taoWhere(query);
    const skip = (query.trang - 1) * query.gioiHan;

    const [summaryRows, rows] = await this.prisma.$transaction([
      this.prisma.mucDonHang.findMany({
        where,
        select: {
          soLuong: true,
          donGiaSnapshot: true,
          donHangNhaCungCap: {
            select: { donHangId: true },
          },
        },
      }),
      this.prisma.mucDonHang.findMany({
        where,
        include: INCLUDE_CHI_TIET,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    const danhMucIds = [...new Set(rows.map((item) => item.danhMucSanPhamIdSnapshot))];
    const danhMuc =
      danhMucIds.length === 0
        ? []
        : await this.prisma.danhMucSanPham.findMany({
            where: { id: { in: danhMucIds } },
            select: { id: true, ten: true },
          });
    const tenDanhMuc = new Map(danhMuc.map((item) => [item.id, item.ten]));

    const tongDonHang = new Set(summaryRows.map((item) => item.donHangNhaCungCap.donHangId)).size;
    const tongSoLuong = summaryRows.reduce((tong, item) => tong + item.soLuong, 0);
    const doanhThuGop = this.lamTronTien(
      summaryRows.reduce((tong, item) => tong + Number(item.donGiaSnapshot) * item.soLuong, 0),
    );

    return {
      duLieu: rows.map((item) =>
        this.toItem(item, tenDanhMuc.get(item.danhMucSanPhamIdSnapshot) ?? null),
      ),
      tongDonHang,
      tongMuc: summaryRows.length,
      tongSoLuong,
      doanhThuGop,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private taoWhere(query: TruyVanBaoCaoDonHangDoanhThuDto): Prisma.MucDonHangWhereInput {
    const createdAt = this.taoKhoangNgay(query.tuNgay, query.denNgay);
    return {
      ...(query.trangTraiId ? { trangTraiId: query.trangTraiId } : {}),
      ...(query.danhMucSanPhamId ? { danhMucSanPhamIdSnapshot: query.danhMucSanPhamId } : {}),
      donHangNhaCungCap: {
        donHang: {
          ...(createdAt ? { createdAt } : {}),
          thanhToan: {
            some: {
              trangThai: { in: TRANG_THAI_THANH_TOAN_CO_DOANH_THU },
            },
          },
        },
      },
    };
  }

  private taoKhoangNgay(tuNgay?: string, denNgay?: string): Prisma.DateTimeFilter | undefined {
    const batDau = tuNgay ? this.parseNgay(tuNgay) : undefined;
    const ketThucNgay = denNgay ? this.parseNgay(denNgay) : undefined;
    if (batDau && ketThucNgay && batDau.getTime() > ketThucNgay.getTime()) {
      throw new BadRequestException('tuNgay không được sau denNgay.');
    }
    if (!batDau && !ketThucNgay) return undefined;

    return {
      ...(batDau ? { gte: batDau } : {}),
      ...(ketThucNgay ? { lt: new Date(ketThucNgay.getTime() + 86_400_000) } : {}),
    };
  }

  private parseNgay(value: string): Date {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('Ngày báo cáo không hợp lệ; dùng YYYY-MM-DD.');
    }
    return parsed;
  }

  private toItem(
    item: MucDonHangChiTiet,
    tenDanhMucSanPham: string | null,
  ): BaoCaoDonHangDoanhThuItemDto {
    const supplierOrder = item.donHangNhaCungCap;
    const order = supplierOrder.donHang;
    return {
      id: item.id,
      donHangId: order.id,
      maDonHang: order.maDonHang,
      trangThaiDonHang: order.trangThai,
      ngayDatHang: order.createdAt.toISOString(),
      donHangNhaCungCapId: supplierOrder.id,
      maDonNhaCungCap: supplierOrder.maDon,
      trangThaiDonNhaCungCap: supplierOrder.trangThai,
      nhaCungCap: {
        id: supplierOrder.nhaCungCap.id,
        ma: supplierOrder.nhaCungCap.ma,
        ten: supplierOrder.nhaCungCap.ten,
      },
      sanPhamId: item.sanPhamId,
      tenSanPham: item.tenSanPhamSnapshot,
      sku: item.skuBienTheSnapshot,
      trangTraiId: item.trangTraiId,
      maTrangTrai: item.maTrangTraiSnapshot,
      tenTrangTrai: item.tenTrangTraiSnapshot,
      danhMucSanPhamId: item.danhMucSanPhamIdSnapshot,
      tenDanhMucSanPham,
      soLuong: item.soLuong,
      donGia: Number(item.donGiaSnapshot),
      doanhThuGop: this.lamTronTien(Number(item.donGiaSnapshot) * item.soLuong),
    };
  }

  private lamTronTien(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
