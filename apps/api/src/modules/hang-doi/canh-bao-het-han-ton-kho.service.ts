import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';

export const SO_NGAY_CANH_BAO_HET_HAN_TON_KHO = 7;

export type TrangThaiCanhBaoHetHanTonKho = 'SAP_HET_HAN' | 'HET_HAN';

export type CanhBaoHetHanTonKhoItem = {
  tonKhoLoId: string;
  khoId: string;
  maKho: string;
  tenKho: string;
  loSanPhamId: string;
  maLo: string;
  sanPhamId: string;
  tenSanPham: string;
  bienTheSanPhamId: string;
  sku: string;
  tenTrangTrai: string;
  ngayHetHan: string;
  soNgayConLai: number;
  onHand: number;
  reserved: number;
  blocked: number;
  available: number;
  trangThai: TrangThaiCanhBaoHetHanTonKho;
};

export type KetQuaCanhBaoHetHanTonKho = {
  ngayThamChieu: string;
  soNgayCanhBao: number;
  tongSapHetHan: number;
  tongHetHan: number;
  sapHetHan: CanhBaoHetHanTonKhoItem[];
  hetHan: CanhBaoHetHanTonKhoItem[];
};

type TuyChonCanhBao = {
  ngayThamChieu?: string;
  soNgay?: number;
  gioiHan?: number;
};

type TonKhoCanhBaoRow = Prisma.TonKhoLoGetPayload<{
  include: {
    kho: true;
    loSanPham: {
      include: {
        thuHoach: {
          include: {
            muaVu: {
              include: {
                trangTrai: true;
              };
            };
          };
        };
      };
    };
    bienTheSanPham: {
      include: {
        sanPham: true;
      };
    };
  };
}>;

@Injectable()
export class CanhBaoHetHanTonKhoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cauHinhHeThong: CauHinhHeThongService,
  ) {}

  async layCanhBao(options: TuyChonCanhBao = {}): Promise<KetQuaCanhBaoHetHanTonKho> {
    const ngay = this.layNgayThamChieu(options.ngayThamChieu);
    const soNgay = this.chuanHoaSoNgay(
      options.soNgay ?? (await this.cauHinhHeThong.layNguongSapHetHanNgay()),
    );
    const gioiHan = this.chuanHoaGioiHan(options.gioiHan);
    const ketThuc = this.congNgay(ngay, soNgay);

    const base: Prisma.TonKhoLoWhereInput = {
      onHand: { gt: 0 },
    };
    const sapHetHanWhere: Prisma.TonKhoLoWhereInput = {
      ...base,
      loSanPham: {
        ngayHetHan: {
          gte: ngay,
          lte: ketThuc,
        },
      },
    };
    const hetHanWhere: Prisma.TonKhoLoWhereInput = {
      ...base,
      loSanPham: {
        ngayHetHan: {
          lt: ngay,
        },
      },
    };

    const include = {
      kho: true,
      loSanPham: {
        include: {
          thuHoach: {
            include: {
              muaVu: {
                include: {
                  trangTrai: true,
                },
              },
            },
          },
        },
      },
      bienTheSanPham: {
        include: {
          sanPham: true,
        },
      },
    } satisfies Prisma.TonKhoLoInclude;

    const [sapHetHan, hetHan, tongSapHetHan, tongHetHan] = await this.prisma.$transaction([
      this.prisma.tonKhoLo.findMany({
        where: sapHetHanWhere,
        include,
        orderBy: [
          { loSanPham: { ngayHetHan: 'asc' } },
          { loSanPham: { maLo: 'asc' } },
          { kho: { maKho: 'asc' } },
          { id: 'asc' },
        ],
        take: gioiHan,
      }),
      this.prisma.tonKhoLo.findMany({
        where: hetHanWhere,
        include,
        orderBy: [
          { loSanPham: { ngayHetHan: 'desc' } },
          { loSanPham: { maLo: 'asc' } },
          { kho: { maKho: 'asc' } },
          { id: 'asc' },
        ],
        take: gioiHan,
      }),
      this.prisma.tonKhoLo.count({ where: sapHetHanWhere }),
      this.prisma.tonKhoLo.count({ where: hetHanWhere }),
    ]);

    return {
      ngayThamChieu: ngay.toISOString().slice(0, 10),
      soNgayCanhBao: soNgay,
      tongSapHetHan,
      tongHetHan,
      sapHetHan: sapHetHan.map((item) => this.toItem(item, ngay, 'SAP_HET_HAN')),
      hetHan: hetHan.map((item) => this.toItem(item, ngay, 'HET_HAN')),
    };
  }

  private toItem(
    row: TonKhoCanhBaoRow,
    ngayThamChieu: Date,
    trangThai: TrangThaiCanhBaoHetHanTonKho,
  ): CanhBaoHetHanTonKhoItem {
    const onHand = Number(row.onHand);
    const reserved = Number(row.reserved);
    const blocked = Number(row.blocked);
    const expiry = row.loSanPham.ngayHetHan;

    return {
      tonKhoLoId: row.id,
      khoId: row.khoId,
      maKho: row.kho.maKho,
      tenKho: row.kho.ten,
      loSanPhamId: row.loSanPhamId,
      maLo: row.loSanPham.maLo,
      sanPhamId: row.bienTheSanPham.sanPham.id,
      tenSanPham: row.bienTheSanPham.sanPham.ten,
      bienTheSanPhamId: row.bienTheSanPhamId,
      sku: row.bienTheSanPham.sku,
      tenTrangTrai: row.loSanPham.thuHoach.muaVu.trangTrai.ten,
      ngayHetHan: expiry.toISOString().slice(0, 10),
      soNgayConLai: Math.round((expiry.getTime() - ngayThamChieu.getTime()) / 86_400_000),
      onHand,
      reserved,
      blocked,
      available: Number((onHand - reserved - blocked).toFixed(3)),
      trangThai,
    };
  }

  private layNgayThamChieu(value?: string): Date {
    if (value !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException('ngayThamChieu phải có dạng YYYY-MM-DD.');
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        throw new BadRequestException('ngayThamChieu không hợp lệ.');
      }
      return parsed;
    }

    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private chuanHoaSoNgay(value?: number): number {
    const soNgay = value ?? SO_NGAY_CANH_BAO_HET_HAN_TON_KHO;
    if (!Number.isInteger(soNgay) || soNgay < 1 || soNgay > 30) {
      throw new BadRequestException('soNgay phải là số nguyên từ 1 đến 30.');
    }
    return soNgay;
  }

  private chuanHoaGioiHan(value?: number): number {
    const gioiHan = value ?? 10;
    if (!Number.isInteger(gioiHan) || gioiHan < 1 || gioiHan > 50) {
      throw new BadRequestException('gioiHan phải là số nguyên từ 1 đến 50.');
    }
    return gioiHan;
  }

  private congNgay(date: Date, soNgay: number): Date {
    return new Date(date.getTime() + soNgay * 86_400_000);
  }
}
