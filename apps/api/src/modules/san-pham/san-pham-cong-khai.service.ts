import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiXacMinhChungNhan } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';

import type {
  DanhSachSanPhamCongKhaiDto,
  KhaDungSanPhamCongKhaiDto,
  SanPhamCongKhaiChiTietDto,
  SanPhamCongKhaiTomTatDto,
  ThuHoachGanNhatTrangTraiDto,
} from './dto/phan-hoi-san-pham-cong-khai.dto';
import type { TruyVanSanPhamCongKhaiDto } from './dto/truy-van-san-pham-cong-khai.dto';

type SanPhamCongKhaiRow = Prisma.SanPhamGetPayload<{
  include: {
    trangTrai: {
      include: {
        nhaCungCap: true;
        chungNhan: true;
      };
    };
    danhMucSanPham: true;
    bienThe: true;
    anh: {
      include: {
        tepTin: true;
      };
    };
  };
}>;

@Injectable()
export class SanPhamCongKhaiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanSanPhamCongKhaiDto): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.layDanhSachTheoWhere(dto, {});
  }

  async layTheoDanhMuc(
    slug: string,
    dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    const danhMuc = await this.prisma.danhMucSanPham.findFirst({
      where: {
        slug,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!danhMuc) throw new NotFoundException('Không tìm thấy danh mục công khai.');
    return this.layDanhSachTheoWhere(dto, { danhMucSanPhamId: danhMuc.id });
  }

  async layTheoTrangTrai(
    trangTraiId: string,
    dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    const farm = await this.prisma.trangTrai.findFirst({
      where: {
        id: trangTraiId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
      },
      select: { id: true },
    });
    if (!farm) throw new NotFoundException('Không tìm thấy trang trại công khai.');
    return this.layDanhSachTheoWhere(dto, { trangTraiId: farm.id });
  }

  async layChiTiet(id: string): Promise<SanPhamCongKhaiChiTietDto> {
    const row = await this.layBatBuoc(id);
    const [tomTat, thuHoach] = await Promise.all([
      this.toTomTat(row),
      this.layThuHoachGanNhatTaiTrangTrai(row.trangTraiId),
    ]);
    return {
      ...tomTat,
      anh: await Promise.all(
        row.anh.map(async (item) => ({
          url: await this.tepTinService.taoSignedUrlAnhNoiBo(item.tepTinId),
          laAnhBia: item.laAnhBia,
          thuTu: item.thuTu,
        })),
      ),
      bienThe: row.bienThe.map((item) => ({
        id: item.id,
        sku: item.sku,
        khoiLuong: Number(item.khoiLuong),
        gia: Number(item.gia),
        donVi: item.donVi,
      })),
      thuHoachGanNhatTaiTrangTrai: thuHoach,
    };
  }

  async layLienQuan(id: string): Promise<DanhSachSanPhamCongKhaiDto> {
    const base = await this.layBatBuoc(id);
    const rows = await this.prisma.sanPham.findMany({
      where: {
        ...this.whereCongKhai(),
        id: { not: base.id },
        OR: [{ danhMucSanPhamId: base.danhMucSanPhamId }, { trangTraiId: base.trangTraiId }],
      },
      include: this.includeCongKhai(),
      orderBy: [{ ten: 'asc' }, { createdAt: 'asc' }],
      take: 24,
    });
    rows.sort((a, b) => {
      const aCategory = a.danhMucSanPhamId === base.danhMucSanPhamId ? 0 : 1;
      const bCategory = b.danhMucSanPhamId === base.danhMucSanPhamId ? 0 : 1;
      if (aCategory !== bCategory) return aCategory - bCategory;
      const aFarm = a.trangTraiId === base.trangTraiId ? 0 : 1;
      const bFarm = b.trangTraiId === base.trangTraiId ? 0 : 1;
      if (aFarm !== bFarm) return aFarm - bFarm;
      return a.ten.localeCompare(b.ten, 'vi');
    });
    const selected = rows.slice(0, 8);
    return {
      duLieu: await Promise.all(selected.map((row) => this.toTomTat(row))),
      tong: selected.length,
      trang: 1,
      gioiHan: 8,
    };
  }

  private async layDanhSachTheoWhere(
    dto: TruyVanSanPhamCongKhaiDto,
    extra: Prisma.SanPhamWhereInput,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    const where: Prisma.SanPhamWhereInput = {
      AND: [this.whereCongKhai(), extra],
    };
    const timKiem = dto.timKiem?.trim();
    if (timKiem) {
      (where.AND as Prisma.SanPhamWhereInput[]).push({
        ten: { contains: timKiem },
      });
    }
    const skip = (dto.trang - 1) * dto.gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.sanPham.findMany({
        where,
        include: this.includeCongKhai(),
        orderBy: [{ ten: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.sanPham.count({ where }),
    ]);
    return {
      duLieu: await Promise.all(rows.map((row) => this.toTomTat(row))),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  private whereCongKhai(): Prisma.SanPhamWhereInput {
    return {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      trangTrai: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
      },
      danhMucSanPham: { trangThai: TrangThaiBanGhi.HOAT_DONG },
      bienThe: { some: {} },
    };
  }

  private includeCongKhai() {
    const bayGio = new Date();
    // MySQL `DATE` là ngày lịch, không có timezone. Tạo UTC-midnight từ ngày local
    // để Prisma không đổi 31/08 thành 30/08 khi serialize trên máy UTC+7.
    const homNay = new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));
    return {
      trangTrai: {
        include: {
          nhaCungCap: true,
          chungNhan: {
            where: {
              trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
              ngayHetHan: { gte: homNay },
            },
            orderBy: [{ ngayHetHan: 'asc' }, { loai: 'asc' }],
          },
        },
      },
      danhMucSanPham: true,
      bienThe: {
        orderBy: [{ gia: 'asc' }, { khoiLuong: 'asc' }],
      },
      anh: {
        where: {
          tepTin: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            mimeType: { startsWith: 'image/' },
          },
        },
        include: { tepTin: true },
        orderBy: [{ laAnhBia: 'desc' }, { thuTu: 'asc' }, { createdAt: 'asc' }],
      },
    } satisfies Prisma.SanPhamInclude;
  }

  private async layBatBuoc(id: string): Promise<SanPhamCongKhaiRow> {
    const item = await this.prisma.sanPham.findFirst({
      where: {
        AND: [this.whereCongKhai(), { id }],
      },
      include: this.includeCongKhai(),
    });
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm công khai.');
    return item;
  }

  private async toTomTat(row: SanPhamCongKhaiRow): Promise<SanPhamCongKhaiTomTatDto> {
    const prices = row.bienThe.map((item) => Number(item.gia));
    const cover = row.anh.find((item) => item.laAnhBia) ?? row.anh[0] ?? null;
    return {
      id: row.id,
      ten: row.ten,
      moTa: row.moTa,
      danhMuc: {
        id: row.danhMucSanPham.id,
        ten: row.danhMucSanPham.ten,
        slug: row.danhMucSanPham.slug,
      },
      trangTrai: {
        id: row.trangTrai.id,
        ma: row.trangTrai.ma,
        ten: row.trangTrai.ten,
        diaChi: row.trangTrai.diaChi,
      },
      gia: {
        tu: Math.min(...prices),
        den: Math.max(...prices),
        tienTe: 'VND',
      },
      anhBiaUrl: cover ? await this.tepTinService.taoSignedUrlAnhNoiBo(cover.tepTinId) : null,
      chungNhan: row.trangTrai.chungNhan.map((item) => ({
        loai: item.loai,
        ma: item.ma,
        donViCap: item.donViCap,
        ngayHetHan: this.ngay(item.ngayHetHan),
      })),
      khaDung: this.khaDung(row.bienThe.length > 0),
    };
  }

  private khaDung(coGia: boolean): KhaDungSanPhamCongKhaiDto {
    return {
      coGia,
      soLuongKhaDung: null,
      coTheDatHang: false,
      lyDo: 'Chưa có dữ liệu tồn kho để xác nhận khả năng đặt hàng.',
    };
  }

  private async layThuHoachGanNhatTaiTrangTrai(
    trangTraiId: string,
  ): Promise<ThuHoachGanNhatTrangTraiDto | null> {
    const item = await this.prisma.thuHoach.findFirst({
      where: { muaVu: { trangTraiId } },
      include: { muaVu: true },
      orderBy: [{ ngayThuHoach: 'desc' }, { createdAt: 'desc' }],
    });
    if (!item) return null;
    return {
      ngayThuHoach: this.ngay(item.ngayThuHoach),
      cayTrong: item.muaVu.cayTrong,
      giong: item.muaVu.giong,
      phanLoai: item.phanLoai,
    };
  }

  private ngay(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
