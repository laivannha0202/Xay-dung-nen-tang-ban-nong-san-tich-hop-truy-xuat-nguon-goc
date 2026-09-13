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
import type { FacetSanPhamCongKhaiDto, TuyChonFacetSanPhamCongKhaiDto } from './dto/phan-hoi-facet-san-pham-cong-khai.dto';

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

type TonKhoKhaDung = {
  onHand: Prisma.Decimal;
  reserved: Prisma.Decimal;
  blocked: Prisma.Decimal;
};

/**
 * Hàng nhẹ cho phase 1 của danh sách: chỉ scalar + giá biến thể + tồn khả
 * dụng, KHÔNG kèm include nặng (ảnh/chứng nhận/nhà cung cấp). Phase 2 chỉ
 * fetch include đầy đủ cho đúng các id thuộc trang hiện tại.
 */
type HangSanPhamNhe = {
  id: string;
  ten: string;
  createdAt: Date;
  noiBat: boolean;
  thuTuNoiBat: number | null;
  trangTraiId: string;
  danhMucSanPhamId: string;
  bienThe: Array<{
    id: string;
    gia: Prisma.Decimal;
    tonKhoLo: TonKhoKhaDung[];
  }>;
  trangTrai: {
    viDo: Prisma.Decimal | null;
    kinhDo: Prisma.Decimal | null;
  };
};

@Injectable()
export class SanPhamCongKhaiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanSanPhamCongKhaiDto): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.layDanhSachTheoWhere(dto, {});
  }

  async layFacets(): Promise<FacetSanPhamCongKhaiDto> {
    const homNay = this.homNay();

    const rows = await this.prisma.sanPham.findMany({
      where: this.whereCongKhai(),
      select: {
        id: true,
        danhMucSanPham: {
          select: {
            slug: true,
            ten: true,
          },
        },
        trangTrai: {
          select: {
            id: true,
            ten: true,
            diaChi: true,
            chungNhan: {
              where: {
                trangThaiXacMinh:
                  TrangThaiXacMinhChungNhan.DA_XAC_MINH,
                ngayHetHan: {
                  gte: homNay,
                },
              },
              select: {
                loai: true,
              },
            },
          },
        },
        bienThe: {
          select: { gia: true },
        },
      },
    });

    const danhMuc =
      new Map<string, TuyChonFacetSanPhamCongKhaiDto>();
    const trangTrai =
      new Map<string, TuyChonFacetSanPhamCongKhaiDto>();
    const chungNhan =
      new Map<string, TuyChonFacetSanPhamCongKhaiDto>();
    const tinhThanh =
      new Map<string, TuyChonFacetSanPhamCongKhaiDto>();

    const tang = (
      map: Map<string, TuyChonFacetSanPhamCongKhaiDto>,
      value: string,
      label: string,
    ): void => {
      const current = map.get(value);

      if (current) {
        current.soSanPham += 1;
        return;
      }

      map.set(value, {
        value,
        label,
        soSanPham: 1,
      });
    };

    let giaMin: number | null = null;
    let giaMax: number | null = null;

    for (const row of rows) {
      tang(
        danhMuc,
        row.danhMucSanPham.slug,
        row.danhMucSanPham.ten,
      );

      tang(
        trangTrai,
        row.trangTrai.id,
        row.trangTrai.ten,
      );

      const diaChi = row.trangTrai.diaChi.trim();
      if (diaChi) {
        tang(tinhThanh, diaChi, diaChi);
      }

      for (const bienThe of row.bienThe) {
        const gia = Number(bienThe.gia);
        if (giaMin === null || gia < giaMin) giaMin = gia;
        if (giaMax === null || gia > giaMax) giaMax = gia;
      }

      const loaiChungNhan = new Set(
        row.trangTrai.chungNhan
          .map((item) => item.loai.trim())
          .filter(Boolean),
      );

      for (const loai of loaiChungNhan) {
        tang(
          chungNhan,
          loai,
          loai,
        );
      }
    }

    const sapXep = (
      map: Map<string, TuyChonFacetSanPhamCongKhaiDto>,
    ): TuyChonFacetSanPhamCongKhaiDto[] =>
      Array.from(map.values()).sort(
        (a, b) =>
          a.label.localeCompare(b.label, 'vi') ||
          a.value.localeCompare(b.value),
      );

    return {
      danhMuc: sapXep(danhMuc),
      trangTrai: sapXep(trangTrai),
      chungNhan: sapXep(chungNhan),
      tinhThanh: sapXep(tinhThanh),
      gia: { min: giaMin, max: giaMax },
    };
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
    const [danhGiaMap, thuHoach] = await Promise.all([
      this.layTomTatDanhGia([row.id]),
      this.layThuHoachGanNhatCuaSanPham(row.bienThe.map((item) => item.id)),
    ]);
    const tomTat = await this.toTomTat(row, danhGiaMap.get(row.id));
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
    const danhGiaMap = await this.layTomTatDanhGia(selected.map((row) => row.id));
    return {
      duLieu: await Promise.all(
        selected.map((row) => this.toTomTat(row, danhGiaMap.get(row.id))),
      ),
      tong: selected.length,
      trang: 1,
      gioiHan: 8,
    };
  }

  /**
   * Chiến lược pagination danh sách công khai:
   * - DB (count + orderBy + skip/take trong cùng transaction): khi
   *   sapXep thuộc {TEN_AZ, TEN_ZA, MOI_NHAT}, khaDung = TAT_CA và không lọc
   *   noiBat. Mọi filter đã nằm trong `where` nên total/trang lấy trực tiếp từ
   *   DB, không load thừa. Lưu ý collation: thứ tự tên dùng collation của
   *   MySQL, có thể khác đôi chút so với locale 'vi' của Node với ký tự có dấu.
   * - Application-side trên hàng nhẹ: GIA_TANG/GIA_GIAM (giá sắp xếp = min giá
   *   biến thể; audit BienTheSanPham: Prisma chỉ hỗ trợ order parent theo
   *   `_count` của child (xem BienTheSanPhamOrderByRelationAggregateInput),
   *   không có `_min(gia)` — đẩy sort giá xuống DB chỉ có thể bằng raw SQL
   *   hoặc cột denormalized, sẽ đổi semantic/tie-break hiện tại nên giữ
   *   application-side),
   *   PHU_HOP (ranking đa yếu tố: từ khóa/rating/thu hoạch/khoảng cách),
   *   khaDung CON_HANG/HET_HANG (availability = onHand - reserved - blocked
   *   trên lô CO_THE_BAN chưa hết hạn ở kho hoạt động — giữ tính toán Node để
   *   không sai business), và noiBat (giữ semantic NULLS LAST cho thuTuNoiBat).
   *   Phase 1 chỉ select scalar + giá + tồn; phase 2 chỉ fetch include đầy đủ
   *   cho đúng các id thuộc trang. Total trong mọi trường hợp đều chính xác.
   */
  private async layDanhSachTheoWhere(
    dto: TruyVanSanPhamCongKhaiDto,
    extra: Prisma.SanPhamWhereInput,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    this.kiemTraKhoang(dto);
    const where = this.whereDanhSach(dto, extra);

    if (this.coThePhanTrangDb(dto)) {
      const skip = (dto.trang - 1) * dto.gioiHan;
      const [tong, rows] = await this.prisma.$transaction([
        this.prisma.sanPham.count({ where }),
        this.prisma.sanPham.findMany({
          where,
          include: this.includeCongKhai(),
          orderBy: this.orderByDb(dto.sapXep),
          skip,
          take: dto.gioiHan,
        }),
      ]);
      const danhGiaMap = await this.layTomTatDanhGia(rows.map((row) => row.id));
      return {
        duLieu: await Promise.all(
          rows.map((row) => this.toTomTat(row, danhGiaMap.get(row.id))),
        ),
        tong,
        trang: dto.trang,
        gioiHan: dto.gioiHan,
      };
    }

    const hangs: HangSanPhamNhe[] = await this.prisma.sanPham.findMany({
      where,
      select: {
        id: true,
        ten: true,
        createdAt: true,
        noiBat: true,
        thuTuNoiBat: true,
        trangTraiId: true,
        danhMucSanPhamId: true,
        bienThe: {
          select: {
            id: true,
            gia: true,
            tonKhoLo: {
              where: this.whereTonKhaDung(this.homNay()),
              select: { onHand: true, reserved: true, blocked: true },
            },
          },
        },
        trangTrai: { select: { viDo: true, kinhDo: true } },
      },
    });

    const filtered = hangs.filter((row) => {
      const available = this.soLuongKhaDungRow(row);
      if (dto.khaDung === 'CON_HANG') return available > 0;
      if (dto.khaDung === 'HET_HANG') return available <= 0;
      return true;
    });

    let sorted =
      dto.sapXep === 'PHU_HOP'
        ? await this.xepHangTheoPhuHop(filtered, dto)
        : [...filtered].sort((a, b) => this.soSanh(a, b, dto.sapXep));

    if (dto.noiBat === true) {
      sorted = [...sorted].sort(
        (a, b) =>
          this.thuTuNoiBatComp(a.thuTuNoiBat, b.thuTuNoiBat) ||
          a.ten.localeCompare(b.ten, 'vi') ||
          a.id.localeCompare(b.id),
      );
    }

    const tong = sorted.length;
    const skip = (dto.trang - 1) * dto.gioiHan;
    const trangHangs = sorted.slice(skip, skip + dto.gioiHan);
    if (trangHangs.length === 0) {
      return { duLieu: [], tong, trang: dto.trang, gioiHan: dto.gioiHan };
    }

    const chiTiet = await this.prisma.sanPham.findMany({
      where: { id: { in: trangHangs.map((row) => row.id) } },
      include: this.includeCongKhai(),
    });
    const theoId = new Map(chiTiet.map((row) => [row.id, row]));
    const rows = trangHangs
      .map((row) => theoId.get(row.id))
      .filter((row): row is SanPhamCongKhaiRow => row !== undefined);
    const danhGiaMap = await this.layTomTatDanhGia(rows.map((row) => row.id));

    return {
      duLieu: await Promise.all(
        rows.map((row) => this.toTomTat(row, danhGiaMap.get(row.id))),
      ),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  private coThePhanTrangDb(dto: TruyVanSanPhamCongKhaiDto): boolean {
    if (dto.khaDung !== 'TAT_CA') return false;
    if (dto.noiBat === true) return false;
    return (
      dto.sapXep === 'TEN_AZ' || dto.sapXep === 'TEN_ZA' || dto.sapXep === 'MOI_NHAT'
    );
  }

  private orderByDb(
    sapXep: TruyVanSanPhamCongKhaiDto['sapXep'],
  ): Prisma.SanPhamOrderByWithRelationInput[] {
    if (sapXep === 'TEN_ZA') return [{ ten: 'desc' }, { id: 'asc' }];
    if (sapXep === 'MOI_NHAT') return [{ createdAt: 'desc' }, { id: 'asc' }];
    return [{ ten: 'asc' }, { id: 'asc' }];
  }

  private whereDanhSach(
    dto: TruyVanSanPhamCongKhaiDto,
    extra: Prisma.SanPhamWhereInput,
  ): Prisma.SanPhamWhereInput {
    const and: Prisma.SanPhamWhereInput[] = [this.whereCongKhai(), extra];

    const timKiem = dto.timKiem?.trim();
    if (timKiem) {
      and.push({
        OR: [
          { ten: { contains: timKiem } },
          { bienThe: { some: { sku: { contains: timKiem } } } },
        ],
      });
    }

    if (dto.noiBat !== undefined) {
      and.push({ noiBat: dto.noiBat });
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

    // Lọc theo ngày thu hoạch của ĐÚNG lô đang bán của product
    // (BienThe → TonKhoLo → Lo → ThuHoach). Bản cũ lọc Farm có harvest
    // trong khoảng rồi match mọi product của farm — sai cùng kiểu với
    // detail cũ (cá của farm rau vẫn lọt filter "thu hoạch hôm nay").
    if (dto.thuHoachTu || dto.thuHoachDen) {
      const homNay = this.homNay();
      and.push({
        bienThe: {
          some: {
            tonKhoLo: {
              some: {
                kho: { trangThai: TrangThaiBanGhi.HOAT_DONG },
                loSanPham: {
                  trangThai: TrangThaiLoSanPham.CO_THE_BAN,
                  ngayHetHan: { gte: homNay },
                  thuHoach: {
                    ngayThuHoach: {
                      ...(dto.thuHoachTu ? { gte: this.ngayBatDau(dto.thuHoachTu) } : {}),
                      ...(dto.thuHoachDen ? { lte: this.ngayBatDau(dto.thuHoachDen) } : {}),
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return { AND: and };
  }

  private thuTuNoiBatComp(
    a: number | null,
    b: number | null,
  ): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  }

  private async layTomTatDanhGia(
    sanPhamIds: string[],
  ): Promise<Map<string, { diemTrungBinh: number | null; tongLuot: number }>> {
    const result = new Map<string, { diemTrungBinh: number | null; tongLuot: number }>();
    for (const sanPhamId of sanPhamIds) {
      result.set(sanPhamId, { diemTrungBinh: null, tongLuot: 0 });
    }
    if (sanPhamIds.length === 0) return result;
    const reviews = await this.prisma.danhGia.findMany({
      where: { mucDonHang: { sanPhamId: { in: sanPhamIds } } },
      select: { diem: true, mucDonHang: { select: { sanPhamId: true } } },
    });
    const agg = new Map<string, { tong: number; soLuong: number }>();
    for (const review of reviews) {
      const sanPhamId = review.mucDonHang.sanPhamId;
      const current = agg.get(sanPhamId) ?? { tong: 0, soLuong: 0 };
      current.tong += review.diem;
      current.soLuong += 1;
      agg.set(sanPhamId, current);
    }
    for (const [sanPhamId, value] of agg) {
      result.set(sanPhamId, {
        diemTrungBinh: Number((value.tong / value.soLuong).toFixed(2)),
        tongLuot: value.soLuong,
      });
    }
    return result;
  }

  private async xepHangTheoPhuHop(
    rows: HangSanPhamNhe[],
    dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<HangSanPhamNhe[]> {
    if (rows.length <= 1) return [...rows];

    const sanPhamIds = rows.map((row) => row.id);

    // Freshness PHẢI theo lô của chính product (Variant → TonKhoLo →
    // Lo → ThuHoach), KHÔNG lấy harvest bất kỳ của farm cộng điểm cho
    // mọi product (cùng lỗi semantic với Product Detail cũ).
    const [ratingByProduct, harvestByProduct] = await Promise.all([
      this.layRatingTheoSanPham(sanPhamIds),
      this.layNgayThuHoachTheoSanPham(rows),
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
        ngayThuHoachGanNhat: harvestByProduct.get(a.id) ?? null,
        diemDanhGiaTrungBinh: ratingByProduct.get(a.id) ?? null,
        viTriTrangTrai: this.viTriTrangTrai(a),
        viTriNguoiDung,
      });

      const scoreB = tinhDiemXepHangSanPham({
        ten: b.ten,
        tuKhoa: timKiem,
        soLuongKhaDung: this.soLuongKhaDungRow(b),
        ngayThuHoachGanNhat: harvestByProduct.get(b.id) ?? null,
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

  /**
   * Ngày thu hoạch cho signal freshness PHU_HOP, tính theo ĐÚNG lô đang
   * bán của từng product. Áp cùng quy tắc single-harvest như detail:
   * product có lô thuộc nhiều harvest khác nhau → không nhận điểm
   * freshness (null) thay vì cộng điểm từ harvest không chắc chắn.
   */
  private async layNgayThuHoachTheoSanPham(
    rows: HangSanPhamNhe[],
  ): Promise<Map<string, Date>> {
    const result = new Map<string, Date>();
    const bienTheIds = rows.flatMap((row) => row.bienThe.map((item) => item.id));
    if (bienTheIds.length === 0) return result;

    const tons = await this.prisma.tonKhoLo.findMany({
      where: {
        bienTheSanPhamId: { in: bienTheIds },
        ...this.whereTonKhaDung(this.homNay()),
      },
      select: {
        bienTheSanPhamId: true,
        loSanPham: {
          select: {
            thuHoachId: true,
            thuHoach: { select: { ngayThuHoach: true } },
          },
        },
      },
    });

    const sanPhamCuaBienThe = new Map<string, string>();
    for (const row of rows) {
      for (const item of row.bienThe) {
        sanPhamCuaBienThe.set(item.id, row.id);
      }
    }

    const harvestCuaSanPham = new Map<string, Map<string, Date>>();
    for (const ton of tons) {
      const sanPhamId = sanPhamCuaBienThe.get(ton.bienTheSanPhamId);
      if (!sanPhamId) continue;
      let theoHarvest = harvestCuaSanPham.get(sanPhamId);
      if (!theoHarvest) {
        theoHarvest = new Map<string, Date>();
        harvestCuaSanPham.set(sanPhamId, theoHarvest);
      }
      if (!theoHarvest.has(ton.loSanPham.thuHoachId)) {
        theoHarvest.set(ton.loSanPham.thuHoachId, ton.loSanPham.thuHoach.ngayThuHoach);
      }
    }

    for (const [sanPhamId, theoHarvest] of harvestCuaSanPham) {
      if (theoHarvest.size !== 1) continue;
      const ngay = [...theoHarvest.values()][0]!;
      result.set(sanPhamId, ngay);
    }

    return result;
  }

  private viTriTrangTrai(row: HangSanPhamNhe): ViTriXepHang | null {
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
    a: HangSanPhamNhe,
    b: HangSanPhamNhe,
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

  private giaThapNhat(row: HangSanPhamNhe): number {
    return Math.min(...row.bienThe.map((item) => Number(item.gia)));
  }

  private soLuongKhaDungRow(row: HangSanPhamNhe): number {
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
            where: this.whereTonKhaDung(homNay),
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

  /**
   * Điều kiện tồn khả dụng: kho hoạt động + lô CO_THE_BAN + chưa hết hạn.
   * Dùng chung cho include chi tiết, hàng nhẹ phase 1 và (gián tiếp) filter
   * khaDung — một nguồn sự thật duy nhất cho availability.
   */
  private whereTonKhaDung(homNay: Date): Prisma.TonKhoLoWhereInput {
    return {
      kho: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      loSanPham: {
        trangThai: TrangThaiLoSanPham.CO_THE_BAN,
        ngayHetHan: { gte: homNay },
      },
    };
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

  private async toTomTat(
    row: SanPhamCongKhaiRow,
    danhGia?: { diemTrungBinh: number | null; tongLuot: number },
  ): Promise<SanPhamCongKhaiTomTatDto> {
    const prices = row.bienThe.map((item) => Number(item.gia));
    const cover = row.anh.find((item) => item.laAnhBia) ?? row.anh[0] ?? null;
    const soLuongKhaDung = this.soLuongKhaDungRow(row);
    const bienTheDaiDien = row.bienThe[0]!;

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
      quyCach: {
        khoiLuong: Number(bienTheDaiDien.khoiLuong),
        donVi: bienTheDaiDien.donVi,
      },
      anhBiaUrl: cover ? await this.tepTinService.taoSignedUrlAnhNoiBo(cover.tepTinId) : null,
      chungNhan: row.trangTrai.chungNhan.map((item) => ({
        loai: item.loai,
        ma: item.ma,
        donViCap: item.donViCap,
        ngayHetHan: this.ngay(item.ngayHetHan),
      })),
      khaDung: this.khaDung(row.bienThe.length > 0, soLuongKhaDung),
      danhGia: {
        diemTrungBinh: danhGia?.diemTrungBinh ?? null,
        tongLuot: danhGia?.tongLuot ?? 0,
      },
      noiBat: row.noiBat,
      thuTuNoiBat: row.thuTuNoiBat,
    };
  }

  private soLuongKhaDungBienThe(items: TonKhoKhaDung[]): number {
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

  /**
   * Thu hoạch gần nhất ĐÁNG TIN của sản phẩm: đi qua tồn kho lô của chính
   * các biến thể (BienThe → TonKhoLo → LoSanPham → ThuHoach → MuaVu), chỉ
   * tính lô đang bán/chưa hết hạn ở kho hoạt động (cùng điều kiện tồn khả
   * dụng). KHÔNG dùng harvest mới nhất của farm rồi gắn cho mọi product
   * (sai nghiệp vụ: Cá hồi không thể có nguồn gốc "Rau thủy canh").
   *
   * Quy tắc ambiguous: một product có thể có nhiều variant/lot thuộc nhiều
   * harvest khác nhau. Chỉ khi TẤT CẢ lô đang bán của product cùng đúng MỘT
   * harvest mới dám hiển thị; nhiều harvest khác nhau → trả null để
   * frontend dẫn user quét mã lô (trace chính xác theo LoSanPham).
   */
  private async layThuHoachGanNhatCuaSanPham(
    bienTheIds: string[],
  ): Promise<ThuHoachGanNhatTrangTraiDto | null> {
    if (bienTheIds.length === 0) return null;
    const tons = await this.prisma.tonKhoLo.findMany({
      where: {
        bienTheSanPhamId: { in: bienTheIds },
        ...this.whereTonKhaDung(this.homNay()),
      },
      include: {
        loSanPham: {
          include: {
            thuHoach: { include: { muaVu: true } },
          },
        },
      },
    });
    const theoThuHoach = new Map<string, (typeof tons)[number]>();
    for (const ton of tons) {
      if (!theoThuHoach.has(ton.loSanPham.thuHoachId)) {
        theoThuHoach.set(ton.loSanPham.thuHoachId, ton);
      }
    }
    if (theoThuHoach.size !== 1) return null;
    const chon = [...theoThuHoach.values()][0]!;
    return {
      ngayThuHoach: this.ngay(chon.loSanPham.thuHoach.ngayThuHoach),
      cayTrong: chon.loSanPham.thuHoach.muaVu.cayTrong,
      giong: chon.loSanPham.thuHoach.muaVu.giong,
      phanLoai: chon.loSanPham.thuHoach.phanLoai,
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
