import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { LoaiGiaoDichTonKho, Prisma } from '../../generated/prisma/client';
import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';

import type {
  BaoCaoCanhBaoTonKhoItemDto,
  BaoCaoHaoHutTonKhoItemDto,
  BaoCaoTonKhoItemDto,
  DanhSachBaoCaoCanhBaoTonKhoDto,
  DanhSachBaoCaoHaoHutTonKhoDto,
  DanhSachBaoCaoTonKhoDto,
} from './dto/phan-hoi-bao-cao-ton-kho.dto';
import type {
  TruyVanBaoCaoHaoHutTonKhoDto,
  TruyVanBaoCaoTonKhoDto,
} from './dto/truy-van-bao-cao-ton-kho.dto';

const MOT_NGAY_MS = 86_400_000;

const TON_KHO_INCLUDE = {
  kho: true,
  loSanPham: true,
  bienTheSanPham: {
    include: {
      sanPham: true,
    },
  },
} satisfies Prisma.TonKhoLoInclude;

const HAO_HUT_INCLUDE = {
  tonKhoLo: {
    include: TON_KHO_INCLUDE,
  },
} satisfies Prisma.GiaoDichTonKhoInclude;

type TonKhoRow = Prisma.TonKhoLoGetPayload<{ include: typeof TON_KHO_INCLUDE }>;
type HaoHutRow = Prisma.GiaoDichTonKhoGetPayload<{ include: typeof HAO_HUT_INCLUDE }>;

@Injectable()
export class BaoCaoTonKhoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cauHinhHeThong: CauHinhHeThongService,
  ) {}

  async layTonKho(query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoTonKhoDto> {
    const where = this.whereTonKho(query);
    const skip = (query.trang - 1) * query.gioiHan;
    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.tonKhoLo.findMany({
        where,
        include: TON_KHO_INCLUDE,
        orderBy: [
          { kho: { maKho: 'asc' } },
          { loSanPham: { ngayHetHan: 'asc' } },
          { bienTheSanPham: { sku: 'asc' } },
          { id: 'asc' },
        ],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.tonKhoLo.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item) => this.mapTonKho(item)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async laySapHetHan(query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoCanhBaoTonKhoDto> {
    const ngay = this.dauNgayUtc(new Date());
    const soNgayCanhBao = await this.cauHinhHeThong.layNguongSapHetHanNgay();
    const ketThuc = new Date(ngay.getTime() + soNgayCanhBao * MOT_NGAY_MS);
    const where = this.whereTonKho(query, {
      onHand: { gt: 0 },
      loSanPham: { ngayHetHan: { gte: ngay, lte: ketThuc } },
    });
    return this.layCanhBao(query, where, ngay, soNgayCanhBao, 'asc');
  }

  async layHetHan(query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoCanhBaoTonKhoDto> {
    const ngay = this.dauNgayUtc(new Date());
    const soNgayCanhBao = await this.cauHinhHeThong.layNguongSapHetHanNgay();
    const where = this.whereTonKho(query, {
      onHand: { gt: 0 },
      loSanPham: { ngayHetHan: { lt: ngay } },
    });
    return this.layCanhBao(query, where, ngay, soNgayCanhBao, 'desc');
  }

  async layHaoHut(query: TruyVanBaoCaoHaoHutTonKhoDto): Promise<DanhSachBaoCaoHaoHutTonKhoDto> {
    const tonKhoWhere = this.whereTonKho(query);
    const where: Prisma.GiaoDichTonKhoWhereInput = {
      loai: query.loai
        ? query.loai
        : { in: [LoaiGiaoDichTonKho.DAMAGE, LoaiGiaoDichTonKho.EXPIRE] },
      ...(Object.keys(tonKhoWhere).length > 0 ? { tonKhoLo: tonKhoWhere } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.giaoDichTonKho.findMany({
        where,
        include: HAO_HUT_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.giaoDichTonKho.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item) => this.mapHaoHut(item)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private async layCanhBao(
    query: TruyVanBaoCaoTonKhoDto,
    where: Prisma.TonKhoLoWhereInput,
    ngay: Date,
    soNgayCanhBao: number,
    thuTuHetHan: 'asc' | 'desc',
  ): Promise<DanhSachBaoCaoCanhBaoTonKhoDto> {
    const skip = (query.trang - 1) * query.gioiHan;
    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.tonKhoLo.findMany({
        where,
        include: TON_KHO_INCLUDE,
        orderBy: [
          { loSanPham: { ngayHetHan: thuTuHetHan } },
          { kho: { maKho: 'asc' } },
          { bienTheSanPham: { sku: 'asc' } },
          { id: 'asc' },
        ],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.tonKhoLo.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item) => this.mapCanhBao(item, ngay)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
      ngayThamChieu: ngay.toISOString().slice(0, 10),
      soNgayCanhBao,
    };
  }

  private whereTonKho(
    query: TruyVanBaoCaoTonKhoDto,
    batBuoc?: Prisma.TonKhoLoWhereInput,
  ): Prisma.TonKhoLoWhereInput {
    const and: Prisma.TonKhoLoWhereInput[] = [];
    if (batBuoc) and.push(batBuoc);
    if (query.khoId) and.push({ khoId: query.khoId });
    const timKiem = query.timKiem?.trim();
    if (timKiem) {
      and.push({
        OR: [
          { kho: { maKho: { contains: timKiem } } },
          { kho: { ten: { contains: timKiem } } },
          { loSanPham: { maLo: { contains: timKiem } } },
          { bienTheSanPham: { sku: { contains: timKiem } } },
          { bienTheSanPham: { sanPham: { ten: { contains: timKiem } } } },
        ],
      });
    }
    return and.length > 0 ? { AND: and } : {};
  }

  private mapTonKho(item: TonKhoRow): BaoCaoTonKhoItemDto {
    const onHand = Number(item.onHand);
    const reserved = Number(item.reserved);
    const blocked = Number(item.blocked);
    return {
      id: item.id,
      kho: { id: item.kho.id, maKho: item.kho.maKho, ten: item.kho.ten },
      loSanPham: {
        id: item.loSanPham.id,
        maLo: item.loSanPham.maLo,
        ngayHetHan: item.loSanPham.ngayHetHan.toISOString().slice(0, 10),
      },
      bienThe: {
        id: item.bienTheSanPham.id,
        sku: item.bienTheSanPham.sku,
        sanPhamId: item.bienTheSanPham.sanPham.id,
        tenSanPham: item.bienTheSanPham.sanPham.ten,
      },
      onHand,
      reserved,
      blocked,
      available: Number((onHand - reserved - blocked).toFixed(3)),
    };
  }

  private mapCanhBao(item: TonKhoRow, ngay: Date): BaoCaoCanhBaoTonKhoItemDto {
    return {
      ...this.mapTonKho(item),
      soNgayConLai: Math.round(
        (item.loSanPham.ngayHetHan.getTime() - ngay.getTime()) / MOT_NGAY_MS,
      ),
    };
  }

  private mapHaoHut(item: HaoHutRow): BaoCaoHaoHutTonKhoItemDto {
    const tonKho = item.tonKhoLo;
    return {
      id: item.id,
      tonKhoLoId: item.tonKhoLoId,
      loai: item.loai,
      soLuong: Number(item.soLuong),
      kho: { id: tonKho.kho.id, maKho: tonKho.kho.maKho, ten: tonKho.kho.ten },
      loSanPham: {
        id: tonKho.loSanPham.id,
        maLo: tonKho.loSanPham.maLo,
        ngayHetHan: tonKho.loSanPham.ngayHetHan.toISOString().slice(0, 10),
      },
      bienThe: {
        id: tonKho.bienTheSanPham.id,
        sku: tonKho.bienTheSanPham.sku,
        sanPhamId: tonKho.bienTheSanPham.sanPham.id,
        tenSanPham: tonKho.bienTheSanPham.sanPham.ten,
      },
      createdAt: item.createdAt.toISOString(),
    };
  }

  private dauNgayUtc(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
}
