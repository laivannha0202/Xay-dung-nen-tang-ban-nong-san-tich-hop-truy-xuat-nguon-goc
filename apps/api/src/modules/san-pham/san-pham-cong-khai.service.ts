import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
  TrangThaiXacMinhChungNhan,
} from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';
import { tinhDiemXepHangSanPham, type ViTriXepHang } from './xep-hang-san-pham';

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
    bienThe: {
      include: {
        tonKhoLo: true;
      };
    };
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
    if (!danhMuc) {
      throw new NotFoundException('Không tìm thấy danh mục công khai.');
    }
    return this.layDanhSachTheoWhere(dto, {
      danhMucSanPhamId: danhMuc.id,
    });
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
    if (!farm) {
      throw new NotFoundException('Không tìm thấy trang trại công khai.');
    }
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
        soLuongKhaDung: this.soLuongKhaDungBienThe(item.tonKhoLo),
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
    this.kiemTraKhoang(dto);

    const and: Prisma.SanPhamWhereInput[] = [this.whereCongKhai(), extra];

    const timKiem = dto.timKiem?.trim();
    if (timKiem) {
      and.push({ ten: { contains: timKiem } });
    }

    const danhMuc = dto.danhMuc?.trim();
    if (danhMuc) {
      and.push({
        danhMucSanPham: {
          slug: danhMuc,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      });
    }

    if (dto.trangTraiId) {
      and.push({ trangTraiId: dto.trangTraiId });
    }

    const tinhThanh = dto.tinhThanh?.trim();
    if (tinhThanh) {
      and.push({
        trangTrai: {
          diaChi: { contains: tinhThanh },
        },
      });
    }

    const chungNhan = dto.chungNhan?.trim();
    if (chungNhan) {
      and.push({
        trangTrai: {
          chungNhan: {
            some: {
              loai: { contains: chungNhan },
              trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
              ngayHetHan: { gte: this.homNay() },
            },
          },
        },
      });
    }

    if (dto.giaTu !== undefined || dto.giaDen !== undefined) {
      and.push({
        bienThe: {
          some: {
            gia: {
              ...(dto.giaTu !== undefined ? { gte: dto.giaTu } : {}),
              ...(dto.giaDen !== undefined ? { lte: dto.giaDen } : {}),
            },
          },
        },
      });
    }

    if (dto.thuHoachTu || dto.thuHoachDen) {
      and.push({
        trangTrai: {
          muaVu: {
            some: {
              thuHoach: {
                some: {
                  ngayThuHoach: {
                    ...(dto.thuHoachTu ? { gte: this.ngayBatDau(dto.thuHoachTu) } : {}),
                    ...(dto.thuHoachDen ? { lte: this.ngayBatDau(dto.thuHoachDen) } : {}),
                  },
                },
              },
            },
          },
        },
      });
    }

    const rows = await this.prisma.sanPham.findMany({
      where: { AND: and },
      include: this.includeCongKhai(),
      orderBy: [{ ten: 'asc' }, { createdAt: 'asc' }],
    });

    const filtered = rows.filter((row) => {
      const available = this.soLuongKhaDungRow(row);
      if (dto.khaDung === 'CON_HANG') return available > 0;
      if (dto.khaDung === 'HET_HANG') return available <= 0;
      return true;
    });

    const sorted =
      dto.sapXep === 'PHU_HOP'
        ? await this.xepHangTheoPhuHop(filtered, dto)
        : [...filtered].sort((a, b) => this.soSanh(a, b, dto.sapXep));

    const tong = sorted.length;
    const skip = (dto.trang - 1) * dto.gioiHan;
    const selected = sorted.slice(skip, skip + dto.gioiHan);

    return {
      duLieu: await Promise.all(selected.map((row) => this.toTomTat(row))),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  private async xepHangTheoPhuHop(
    rows: SanPhamCongKhaiRow[],
    dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<SanPhamCongKhaiRow[]> {
    if (rows.length <= 1) return [...rows];

    const sanPhamIds = rows.map((row) => row.id);
    const trangTraiIds = Array.from(new Set(rows.map((row) => row.trangTraiId)));

    const [ratingByProduct, harvestByFarm] = await Promise.all([
      this.layRatingTheoSanPham(sanPhamIds),
      this.layThuHoachMoiNhatTheoTrangTrai(trangTraiIds),
    ]);

    const viTriNguoiDung =
      dto.viDoNguoiDung !== undefined && dto.kinhDoNguoiDung !== undefined
        ? {
            viDo: dto.viDoNguoiDung,
            kinhDo: dto.kinhDoNguoiDung,
          }
        : null;

    const timKiem = dto.timKiem?.trim() || null;

    return [...rows].sort((a, b) => {
      const scoreA = tinhDiemXepHangSanPham({
        ten: a.ten,
        tuKhoa: timKiem,
        soLuongKhaDung: this.soLuongKhaDungRow(a),
        ngayThuHoachGanNhat: harvestByFarm.get(a.trangTraiId) ?? null,
        diemDanhGiaTrungBinh: ratingByProduct.get(a.id) ?? null,
        viTriTrangTrai: this.viTriTrangTrai(a),
        viTriNguoiDung,
      });

      const scoreB = tinhDiemXepHangSanPham({
        ten: b.ten,
        tuKhoa: timKiem,
        soLuongKhaDung: this.soLuongKhaDungRow(b),
        ngayThuHoachGanNhat: harvestByFarm.get(b.trangTraiId) ?? null,
        diemDanhGiaTrungBinh: ratingByProduct.get(b.id) ?? null,
        viTriTrangTrai: this.viTriTrangTrai(b),
        viTriNguoiDung,
      });

      return (
        scoreB.tong - scoreA.tong || a.ten.localeCompare(b.ten, 'vi') || a.id.localeCompare(b.id)
      );
    });
  }

  private async layRatingTheoSanPham(sanPhamIds: string[]): Promise<Map<string, number>> {
    if (sanPhamIds.length === 0) return new Map();

    const reviews = await this.prisma.danhGia.findMany({
      where: {
        mucDonHang: {
          sanPhamId: { in: sanPhamIds },
        },
      },
      select: {
        diem: true,
        mucDonHang: {
          select: { sanPhamId: true },
        },
      },
    });

    const aggregate = new Map<string, { tong: number; soLuong: number }>();

    for (const review of reviews) {
      const sanPhamId = review.mucDonHang.sanPhamId;
      const current = aggregate.get(sanPhamId) ?? {
        tong: 0,
        soLuong: 0,
      };
      current.tong += review.diem;
      current.soLuong += 1;
      aggregate.set(sanPhamId, current);
    }

    return new Map<string, number>(
      Array.from(aggregate.entries()).map(
        ([sanPhamId, value]) => [sanPhamId, value.tong / value.soLuong] as const,
      ),
    );
  }

  private async layThuHoachMoiNhatTheoTrangTrai(
    trangTraiIds: string[],
  ): Promise<Map<string, Date>> {
    if (trangTraiIds.length === 0) return new Map();

    const harvests = await this.prisma.thuHoach.findMany({
      where: {
        muaVu: {
          trangTraiId: { in: trangTraiIds },
        },
      },
      select: {
        ngayThuHoach: true,
        muaVu: {
          select: { trangTraiId: true },
        },
      },
      orderBy: [{ ngayThuHoach: 'desc' }, { createdAt: 'desc' }],
    });

    const result = new Map<string, Date>();

    for (const harvest of harvests) {
      const trangTraiId = harvest.muaVu.trangTraiId;
      if (!result.has(trangTraiId)) {
        result.set(trangTraiId, harvest.ngayThuHoach);
      }
    }

    return result;
  }

  private viTriTrangTrai(row: SanPhamCongKhaiRow): ViTriXepHang | null {
    if (row.trangTrai.viDo === null || row.trangTrai.kinhDo === null) {
      return null;
    }

    return {
      viDo: Number(row.trangTrai.viDo),
      kinhDo: Number(row.trangTrai.kinhDo),
    };
  }

  private kiemTraKhoang(dto: TruyVanSanPhamCongKhaiDto): void {
    const coViDo = dto.viDoNguoiDung !== undefined;
    const coKinhDo = dto.kinhDoNguoiDung !== undefined;

    if (coViDo !== coKinhDo) {
      throw new BadRequestException('Vĩ độ và kinh độ người dùng phải được gửi cùng nhau.');
    }

    if (dto.giaTu !== undefined && dto.giaDen !== undefined && dto.giaTu > dto.giaDen) {
      throw new BadRequestException('Giá từ không được lớn hơn giá đến.');
    }

    if (dto.thuHoachTu && dto.thuHoachDen && dto.thuHoachTu > dto.thuHoachDen) {
      throw new BadRequestException('Ngày thu hoạch từ không được sau ngày đến.');
    }
  }

  private soSanh(
    a: SanPhamCongKhaiRow,
    b: SanPhamCongKhaiRow,
    sapXep: TruyVanSanPhamCongKhaiDto['sapXep'],
  ): number {
    if (sapXep === 'TEN_ZA') {
      return b.ten.localeCompare(a.ten, 'vi') || a.id.localeCompare(b.id);
    }
    if (sapXep === 'GIA_TANG') {
      return (
        this.giaThapNhat(a) - this.giaThapNhat(b) ||
        a.ten.localeCompare(b.ten, 'vi') ||
        a.id.localeCompare(b.id)
      );
    }
    if (sapXep === 'GIA_GIAM') {
      return (
        this.giaThapNhat(b) - this.giaThapNhat(a) ||
        a.ten.localeCompare(b.ten, 'vi') ||
        a.id.localeCompare(b.id)
      );
    }
    if (sapXep === 'MOI_NHAT') {
      return b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id);
    }
    return a.ten.localeCompare(b.ten, 'vi') || a.id.localeCompare(b.id);
  }

  private giaThapNhat(row: SanPhamCongKhaiRow): number {
    return Math.min(...row.bienThe.map((item) => Number(item.gia)));
  }

  private soLuongKhaDungRow(row: SanPhamCongKhaiRow): number {
    const value = row.bienThe.reduce(
      (tong, item) => tong + this.soLuongKhaDungBienThe(item.tonKhoLo),
      0,
    );
    return Math.max(0, Number(value.toFixed(3)));
  }

  private whereCongKhai(): Prisma.SanPhamWhereInput {
    return {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      trangTrai: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
      },
      danhMucSanPham: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      bienThe: { some: {} },
    };
  }

  private includeCongKhai() {
    const homNay = this.homNay();
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
        include: {
          tonKhoLo: {
            where: {
              kho: {
                trangThai: TrangThaiBanGhi.HOAT_DONG,
              },
              loSanPham: {
                trangThai: TrangThaiLoSanPham.CO_THE_BAN,
                ngayHetHan: { gte: homNay },
              },
            },
          },
        },
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
    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm công khai.');
    }
    return item;
  }

  private async toTomTat(row: SanPhamCongKhaiRow): Promise<SanPhamCongKhaiTomTatDto> {
    const prices = row.bienThe.map((item) => Number(item.gia));
    const cover = row.anh.find((item) => item.laAnhBia) ?? row.anh[0] ?? null;
    const soLuongKhaDung = this.soLuongKhaDungRow(row);

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
      khaDung: this.khaDung(row.bienThe.length > 0, soLuongKhaDung),
    };
  }

  private soLuongKhaDungBienThe(
    items: Array<{
      onHand: Prisma.Decimal;
      reserved: Prisma.Decimal;
      blocked: Prisma.Decimal;
    }>,
  ): number {
    const value = items.reduce(
      (tong, item) => tong + Number(item.onHand) - Number(item.reserved) - Number(item.blocked),
      0,
    );
    return Math.max(0, Number(value.toFixed(3)));
  }

  private khaDung(coGia: boolean, soLuongKhaDung: number): KhaDungSanPhamCongKhaiDto {
    const coTheDatHang = coGia && soLuongKhaDung > 0;
    return {
      coGia,
      soLuongKhaDung,
      coTheDatHang,
      lyDo: coTheDatHang ? 'Còn hàng.' : coGia ? 'Tạm hết hàng.' : 'Sản phẩm chưa có giá.',
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

  private homNay(): Date {
    const bayGio = new Date();
    return new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));
  }

  private ngayBatDau(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private ngay(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
