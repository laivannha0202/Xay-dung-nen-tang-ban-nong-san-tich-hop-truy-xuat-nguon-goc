import {
  TrangThaiBanGhi,
  TrangThaiDonHang,
  TrangThaiLoSanPham,
} from '../../generated/prisma/client';
import type { PrismaService } from '../../database/prisma.service';

export const LOAI_TUONG_TAC_RECOMMENDATION = [
  'PURCHASE',
  'WISHLIST',
  'RATING',
  'FOLLOW_FARM',
] as const;

export type LoaiTuongTacRecommendation = (typeof LOAI_TUONG_TAC_RECOMMENDATION)[number];

export type TuongTacRecommendation = {
  nguonId: string;
  khachHangId: string;
  sanPhamId: string | null;
  loai: LoaiTuongTacRecommendation;
  giaTri: number;
  thoiGian: Date;
  danhMucSanPhamId: string | null;
  trangTraiId: string | null;
};

export type SanPhamRecommendationFeature = {
  sanPhamId: string;
  danhMucSanPhamId: string;
  trangTraiId: string;
  congKhai: boolean;
  khaDung: boolean;
  soLuongKhaDung: number;
  giaMin: number | null;
  giaMax: number | null;
  createdAt: Date;
};

export type PhanChiaRecommendation = {
  train: TuongTacRecommendation[];
  validation: TuongTacRecommendation[];
  test: TuongTacRecommendation[];
  coldStart: TuongTacRecommendation[];
  auxiliary: TuongTacRecommendation[];
};

export type ThongKeRecommendationDataset = {
  soKhachHang: number;
  soSanPham: number;
  tongTuongTac: number;
  theoLoai: Record<LoaiTuongTacRecommendation, number>;
  soCapKhachHangSanPham: number;
  matDoTuongTac: number;
  doThua: number;
  soKhachHangDuDieuKienDanhGia: number;
  soKhachHangColdStart: number;
  phanChia: {
    train: number;
    validation: number;
    test: number;
    coldStart: number;
    auxiliary: number;
  };
};

export type RecommendationDataset = {
  phienBan: '1.0';
  thoiDiemChot: Date;
  tuongTac: TuongTacRecommendation[];
  sanPham: SanPhamRecommendationFeature[];
  phanChia: PhanChiaRecommendation;
  thongKe: ThongKeRecommendationDataset;
};

const TRANG_THAI_DON_HANG_DUOC_TINH_MUA = [
  TrangThaiDonHang.DA_GIAO,
  TrangThaiDonHang.HOAN_THANH,
] as const;

function lamTron(value: number): number {
  return Number(value.toFixed(6));
}

function batDauNgayUtc(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function soSanhTuongTac(a: TuongTacRecommendation, b: TuongTacRecommendation): number {
  return (
    a.thoiGian.getTime() - b.thoiGian.getTime() ||
    a.khachHangId.localeCompare(b.khachHangId) ||
    a.loai.localeCompare(b.loai) ||
    a.nguonId.localeCompare(b.nguonId)
  );
}

export function phanChiaRecommendationTheoThoiGian(
  tuongTac: TuongTacRecommendation[],
): PhanChiaRecommendation {
  const auxiliary = tuongTac.filter((item) => item.loai === 'FOLLOW_FARM').sort(soSanhTuongTac);

  const trucTiep = tuongTac.filter(
    (item) => item.loai !== 'FOLLOW_FARM' && item.sanPhamId !== null,
  );

  const theoKhachHang = new Map<string, TuongTacRecommendation[]>();

  for (const item of trucTiep) {
    const current = theoKhachHang.get(item.khachHangId) ?? [];
    current.push(item);
    theoKhachHang.set(item.khachHangId, current);
  }

  const train: TuongTacRecommendation[] = [];
  const validation: TuongTacRecommendation[] = [];
  const test: TuongTacRecommendation[] = [];
  const coldStart: TuongTacRecommendation[] = [];

  for (const items of theoKhachHang.values()) {
    const sorted = [...items].sort(soSanhTuongTac);

    if (sorted.length < 3) {
      coldStart.push(...sorted);
      continue;
    }

    train.push(...sorted.slice(0, -2));
    validation.push(sorted.at(-2)!);
    test.push(sorted.at(-1)!);
  }

  return {
    train: train.sort(soSanhTuongTac),
    validation: validation.sort(soSanhTuongTac),
    test: test.sort(soSanhTuongTac),
    coldStart: coldStart.sort(soSanhTuongTac),
    auxiliary,
  };
}

export function tinhThongKeRecommendationDataset(
  tuongTac: TuongTacRecommendation[],
  sanPham: SanPhamRecommendationFeature[],
  phanChia: PhanChiaRecommendation,
): ThongKeRecommendationDataset {
  const khachHangIds = new Set(tuongTac.map((item) => item.khachHangId));

  const theoLoai: Record<LoaiTuongTacRecommendation, number> = {
    PURCHASE: 0,
    WISHLIST: 0,
    RATING: 0,
    FOLLOW_FARM: 0,
  };

  for (const item of tuongTac) {
    theoLoai[item.loai] += 1;
  }

  const capKhachHangSanPham = new Set(
    tuongTac
      .filter((item) => item.sanPhamId !== null)
      .map((item) => `${item.khachHangId}:${item.sanPhamId}`),
  );

  const mauSo = khachHangIds.size * sanPham.length;
  const matDo = mauSo > 0 ? capKhachHangSanPham.size / mauSo : 0;

  const khachHangDuDieuKien = new Set(phanChia.test.map((item) => item.khachHangId));

  const khachHangColdStart = new Set(phanChia.coldStart.map((item) => item.khachHangId));

  return {
    soKhachHang: khachHangIds.size,
    soSanPham: sanPham.length,
    tongTuongTac: tuongTac.length,
    theoLoai,
    soCapKhachHangSanPham: capKhachHangSanPham.size,
    matDoTuongTac: lamTron(matDo),
    doThua: lamTron(mauSo > 0 ? 1 - matDo : 0),
    soKhachHangDuDieuKienDanhGia: khachHangDuDieuKien.size,
    soKhachHangColdStart: khachHangColdStart.size,
    phanChia: {
      train: phanChia.train.length,
      validation: phanChia.validation.length,
      test: phanChia.test.length,
      coldStart: phanChia.coldStart.length,
      auxiliary: phanChia.auxiliary.length,
    },
  };
}

export class BoDuLieuRecommendationBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async tao(thoiDiemChot = new Date()): Promise<RecommendationDataset> {
    const [muaHang, yeuThich, danhGia, theoDoiTrangTrai, sanPham] = await Promise.all([
      this.layMuaHang(),
      this.layYeuThich(),
      this.layDanhGia(),
      this.layTheoDoiTrangTrai(),
      this.laySanPham(thoiDiemChot),
    ]);

    const tuongTac = [...muaHang, ...yeuThich, ...danhGia, ...theoDoiTrangTrai].sort(
      soSanhTuongTac,
    );

    const phanChia = phanChiaRecommendationTheoThoiGian(tuongTac);

    return {
      phienBan: '1.0',
      thoiDiemChot,
      tuongTac,
      sanPham,
      phanChia,
      thongKe: tinhThongKeRecommendationDataset(tuongTac, sanPham, phanChia),
    };
  }

  private async layMuaHang(): Promise<TuongTacRecommendation[]> {
    const rows = await this.prisma.mucDonHang.findMany({
      where: {
        donHangNhaCungCap: {
          donHang: {
            trangThai: {
              in: [...TRANG_THAI_DON_HANG_DUOC_TINH_MUA],
            },
          },
        },
      },
      select: {
        id: true,
        sanPhamId: true,
        danhMucSanPhamIdSnapshot: true,
        trangTraiId: true,
        soLuong: true,
        donHangNhaCungCap: {
          select: {
            donHang: {
              select: {
                khachHangId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      nguonId: row.id,
      khachHangId: row.donHangNhaCungCap.donHang.khachHangId,
      sanPhamId: row.sanPhamId,
      loai: 'PURCHASE' as const,
      giaTri: row.soLuong,
      thoiGian: row.donHangNhaCungCap.donHang.createdAt,
      danhMucSanPhamId: row.danhMucSanPhamIdSnapshot,
      trangTraiId: row.trangTraiId,
    }));
  }

  private async layYeuThich(): Promise<TuongTacRecommendation[]> {
    const rows = await this.prisma.sanPhamYeuThich.findMany({
      select: {
        id: true,
        khachHangId: true,
        sanPhamId: true,
        createdAt: true,
        sanPham: {
          select: {
            danhMucSanPhamId: true,
            trangTraiId: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      nguonId: row.id,
      khachHangId: row.khachHangId,
      sanPhamId: row.sanPhamId,
      loai: 'WISHLIST' as const,
      giaTri: 1,
      thoiGian: row.createdAt,
      danhMucSanPhamId: row.sanPham.danhMucSanPhamId,
      trangTraiId: row.sanPham.trangTraiId,
    }));
  }

  private async layDanhGia(): Promise<TuongTacRecommendation[]> {
    const rows = await this.prisma.danhGia.findMany({
      select: {
        id: true,
        diem: true,
        createdAt: true,
        mucDonHang: {
          select: {
            sanPhamId: true,
            danhMucSanPhamIdSnapshot: true,
            trangTraiId: true,
            donHangNhaCungCap: {
              select: {
                donHang: {
                  select: {
                    khachHangId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      nguonId: row.id,
      khachHangId: row.mucDonHang.donHangNhaCungCap.donHang.khachHangId,
      sanPhamId: row.mucDonHang.sanPhamId,
      loai: 'RATING' as const,
      giaTri: row.diem,
      thoiGian: row.createdAt,
      danhMucSanPhamId: row.mucDonHang.danhMucSanPhamIdSnapshot,
      trangTraiId: row.mucDonHang.trangTraiId,
    }));
  }

  private async layTheoDoiTrangTrai(): Promise<TuongTacRecommendation[]> {
    const rows = await this.prisma.theoDoiTrangTrai.findMany({
      select: {
        id: true,
        khachHangId: true,
        trangTraiId: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      nguonId: row.id,
      khachHangId: row.khachHangId,
      sanPhamId: null,
      loai: 'FOLLOW_FARM' as const,
      giaTri: 1,
      thoiGian: row.createdAt,
      danhMucSanPhamId: null,
      trangTraiId: row.trangTraiId,
    }));
  }

  private async laySanPham(thoiDiemChot: Date): Promise<SanPhamRecommendationFeature[]> {
    const homNay = batDauNgayUtc(thoiDiemChot);

    const rows = await this.prisma.sanPham.findMany({
      select: {
        id: true,
        danhMucSanPhamId: true,
        trangTraiId: true,
        trangThai: true,
        createdAt: true,
        trangTrai: {
          select: {
            trangThai: true,
            nhaCungCap: {
              select: {
                trangThai: true,
              },
            },
          },
        },
        danhMucSanPham: {
          select: {
            trangThai: true,
          },
        },
        bienThe: {
          select: {
            gia: true,
            tonKhoLo: {
              where: {
                kho: {
                  trangThai: TrangThaiBanGhi.HOAT_DONG,
                },
                loSanPham: {
                  trangThai: TrangThaiLoSanPham.CO_THE_BAN,
                  ngayHetHan: {
                    gte: homNay,
                  },
                },
              },
              select: {
                onHand: true,
                reserved: true,
                blocked: true,
              },
            },
          },
        },
      },
    });

    return rows
      .map((row) => {
        const prices = row.bienThe.map((item) => Number(item.gia));

        const soLuongKhaDung = row.bienThe.reduce(
          (tong, bienThe) =>
            tong +
            bienThe.tonKhoLo.reduce(
              (subtotal, tonKho) =>
                subtotal + Number(tonKho.onHand) - Number(tonKho.reserved) - Number(tonKho.blocked),
              0,
            ),
          0,
        );

        const congKhai =
          row.trangThai === TrangThaiBanGhi.HOAT_DONG &&
          row.trangTrai.trangThai === TrangThaiBanGhi.HOAT_DONG &&
          row.trangTrai.nhaCungCap.trangThai === TrangThaiBanGhi.HOAT_DONG &&
          row.danhMucSanPham.trangThai === TrangThaiBanGhi.HOAT_DONG &&
          prices.length > 0;

        const available = Math.max(0, Number(soLuongKhaDung.toFixed(3)));

        return {
          sanPhamId: row.id,
          danhMucSanPhamId: row.danhMucSanPhamId,
          trangTraiId: row.trangTraiId,
          congKhai,
          khaDung: congKhai && available > 0,
          soLuongKhaDung: available,
          giaMin: prices.length > 0 ? Math.min(...prices) : null,
          giaMax: prices.length > 0 ? Math.max(...prices) : null,
          createdAt: row.createdAt,
        };
      })
      .sort((a, b) => a.sanPhamId.localeCompare(b.sanPhamId));
  }
}
