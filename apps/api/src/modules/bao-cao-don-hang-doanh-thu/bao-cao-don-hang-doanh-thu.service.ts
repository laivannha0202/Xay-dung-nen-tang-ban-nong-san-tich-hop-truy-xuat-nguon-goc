import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiThanhToan } from '../../generated/prisma/client';

import type {
  BaoCaoDonHangDoanhThuDto,
  BaoCaoDonHangDoanhThuItemDto,
  DoanhThuTheoNgayItemDto,
} from './dto/phan-hoi-bao-cao-don-hang-doanh-thu.dto';
import type { TruyVanBaoCaoDonHangDoanhThuDto } from './dto/truy-van-bao-cao-don-hang-doanh-thu.dto';

const TRANG_THAI_THANH_TOAN_CO_DOANH_THU: TrangThaiThanhToan[] = [
  TrangThaiThanhToan.PAID,
  TrangThaiThanhToan.PARTIALLY_REFUNDED,
  TrangThaiThanhToan.REFUNDED,
];

const MOT_NGAY_MS = 86_400_000;
const MUI_GIO_VIET_NAM_MS = 7 * 60 * 60 * 1000;
const SO_NGAY_TOI_DA_BIEU_DO = 31;

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


  /**
   * Aggregate doanh thu gộp theo ngày nghiệp vụ Việt Nam (UTC+7).
   * Chỉ 1 query DB cho toàn khoảng ngày, tránh dashboard bắn 1 HTTP request/ngày.
   */
  async layDoanhThuTheoNgay(
    query: TruyVanBaoCaoDonHangDoanhThuDto,
  ): Promise<DoanhThuTheoNgayItemDto[]> {
    if (!query.tuNgay || !query.denNgay) {
      throw new BadRequestException('Báo cáo theo ngày yêu cầu đủ tuNgay và denNgay.');
    }

    const batDau = this.parseNgayVietNam(query.tuNgay);
    const ketThuc = this.parseNgayVietNam(query.denNgay);

    if (batDau.getTime() > ketThuc.getTime()) {
      throw new BadRequestException('tuNgay không được sau denNgay.');
    }

    const soNgay = Math.floor((ketThuc.getTime() - batDau.getTime()) / MOT_NGAY_MS) + 1;
    if (soNgay > SO_NGAY_TOI_DA_BIEU_DO) {
      throw new BadRequestException(
        `Báo cáo theo ngày hỗ trợ tối đa ${SO_NGAY_TOI_DA_BIEU_DO} ngày.`,
      );
    }

    const rows = await this.prisma.mucDonHang.findMany({
      where: this.taoWhere(query),
      select: {
        soLuong: true,
        donGiaSnapshot: true,
        donHangNhaCungCap: {
          select: {
            donHang: {
              select: { createdAt: true },
            },
          },
        },
      },
    });

    const tongTheoNgay = new Map<string, number>();
    for (const item of rows) {
      const ngay = this.ngayVietNamTuUtc(item.donHangNhaCungCap.donHang.createdAt);
      const doanhThu = Number(item.donGiaSnapshot) * item.soLuong;
      tongTheoNgay.set(ngay, (tongTheoNgay.get(ngay) ?? 0) + doanhThu);
    }

    return this.lietKeNgay(query.tuNgay, query.denNgay).map((ngay) => ({
      ngay,
      doanhThuGop: this.lamTronTien(tongTheoNgay.get(ngay) ?? 0),
    }));
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
    const batDau = tuNgay ? this.parseNgayVietNam(tuNgay) : undefined;
    const ketThucNgay = denNgay ? this.parseNgayVietNam(denNgay) : undefined;
    if (batDau && ketThucNgay && batDau.getTime() > ketThucNgay.getTime()) {
      throw new BadRequestException('tuNgay không được sau denNgay.');
    }
    if (!batDau && !ketThucNgay) return undefined;

    return {
      ...(batDau ? { gte: batDau } : {}),
      ...(ketThucNgay ? { lt: new Date(ketThucNgay.getTime() + MOT_NGAY_MS) } : {}),
    };
  }

  /**
   * Input YYYY-MM-DD là ngày nghiệp vụ Việt Nam.
   * DB vẫn lưu UTC: 00:00 VN tương ứng 17:00 UTC của ngày trước.
   */
  private parseNgayVietNam(value: string): Date {
    const parsedUtc = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsedUtc.getTime()) || parsedUtc.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('Ngày báo cáo không hợp lệ; dùng YYYY-MM-DD.');
    }
    return new Date(parsedUtc.getTime() - MUI_GIO_VIET_NAM_MS);
  }

  private ngayVietNamTuUtc(value: Date): string {
    return new Date(value.getTime() + MUI_GIO_VIET_NAM_MS).toISOString().slice(0, 10);
  }

  private lietKeNgay(tuNgay: string, denNgay: string): string[] {
    const batDau = new Date(`${tuNgay}T00:00:00.000Z`).getTime();
    const ketThuc = new Date(`${denNgay}T00:00:00.000Z`).getTime();
    const result: string[] = [];

    for (let time = batDau; time <= ketThuc; time += MOT_NGAY_MS) {
      result.push(new Date(time).toISOString().slice(0, 10));
    }

    return result;
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
