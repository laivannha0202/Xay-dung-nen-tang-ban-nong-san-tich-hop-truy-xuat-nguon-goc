import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';
import { GiaHieuLucService } from './gia-hieu-luc.service';

import type {
  ChienDichFlashSaleChiTietDto,
  ChienDichFlashSaleCongKhaiDto,
  DanhSachChienDichFlashSaleDto,
  DoiTrangThaiChienDichFlashSaleDto,
  LocChienDichFlashSaleDto,
  LuuChienDichFlashSaleDto,
  MucFlashSaleCongKhaiDto,
  ThemMucFlashSaleDto,
} from './dto/flash-sale.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type ChienDichRow = Prisma.ChienDichFlashSaleGetPayload<{
  include: { muc: true };
}>;

@Injectable()
export class FlashSaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
    private readonly giaHieuLucService: GiaHieuLucService,
  ) {}

  async layActiveCongKhai(now = new Date()): Promise<ChienDichFlashSaleCongKhaiDto[]> {
    const campaigns = await this.prisma.chienDichFlashSale.findMany({
      where: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        batDauLuc: { lte: now },
        ketThucLuc: { gte: now },
      },
      include: {
        muc: {
          where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          include: {
            bienTheSanPham: {
              include: {
                sanPham: {
                  include: {
                    trangTrai: {
                      include: {
                        nhaCungCap: true,
                        chungNhan: {
                          where: {
                            trangThaiXacMinh: 'DA_XAC_MINH',
                            ngayHetHan: { gte: this.homNay() },
                          },
                          select: { loai: true },
                        },
                      },
                    },
                    danhMucSanPham: true,
                    anh: {
                      where: {
                        tepTin: {
                          trangThai: TrangThaiBanGhi.HOAT_DONG,
                          mimeType: { startsWith: 'image/' },
                        },
                      },
                      orderBy: [{ laAnhBia: 'desc' }, { thuTu: 'asc' }],
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ batDauLuc: 'asc' }, { createdAt: 'asc' }],
    });

    // Một nguồn sự thật cho giá hiệu lực: quyết định include/skip theo đúng
    // resolver dùng chung cho cart/checkout/order.
    const bienTheIds = Array.from(
      new Set(
        campaigns.flatMap((campaign) =>
          campaign.muc.map((item) => item.bienTheSanPham.id),
        ),
      ),
    );
    const giaMap = await this.giaHieuLucService.resolveNhieu(bienTheIds, now);

    const result: ChienDichFlashSaleCongKhaiDto[] = [];

    for (const campaign of campaigns) {
      const muc: MucFlashSaleCongKhaiDto[] = [];

      for (const item of campaign.muc) {
        const bienThe = item.bienTheSanPham;
        const sanPham = bienThe.sanPham;
        const trangTrai = sanPham.trangTrai;

        if (
          sanPham.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
          trangTrai.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
          trangTrai.nhaCungCap.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
          sanPham.danhMucSanPham.trangThai !== TrangThaiBanGhi.HOAT_DONG
        ) {
          continue;
        }

        // AGRIMARKET_FLASH_PUBLIC_SOLDOUT_V2
        const gia = giaMap.get(bienThe.id);
        if (!gia) continue;

        const giaGoc = gia.giaGoc;
        const giaFlashCauHinh = Number(item.giaFlash);
        const quotaConLai =
          item.gioiHanTong == null
            ? Number.POSITIVE_INFINITY
            : Math.max(0, item.gioiHanTong - item.soLuongDaBan);
        const cauHinhFlashHopLe =
          giaFlashCauHinh > 0 && giaFlashCauHinh < giaGoc;

        const flashDangAp =
          gia.loaiGia === 'FLASH_SALE' &&
          gia.chienDichId === campaign.id &&
          gia.mucFlashSaleId === item.id;

        const flashDaHetSuat =
          gia.loaiGia === 'NORMAL' &&
          cauHinhFlashHopLe &&
          (gia.soLuongKhaDung <= 0 || quotaConLai <= 0);

        if (!flashDangAp && !flashDaHetSuat) {
          continue;
        }

        const giaFlash = flashDangAp ? gia.giaHieuLuc : giaFlashCauHinh;
        const soLuongKhaDung = Math.max(
          0,
          Math.min(gia.soLuongKhaDung, quotaConLai),
        );

        const anhBia = sanPham.anh[0] ?? null;
        muc.push({
          sanPhamId: sanPham.id,
          bienTheSanPhamId: bienThe.id,
          ten: sanPham.ten,
          anhBiaUrl: anhBia
            ? await this.tepTinService.taoSignedUrlAnhNoiBo(anhBia.tepTinId)
            : null,
          sku: bienThe.sku,
          khoiLuong: Number(bienThe.khoiLuong),
          donVi: bienThe.donVi,
          giaGoc,
          giaFlash,
          phanTramGiam: Math.round(((giaGoc - giaFlash) / giaGoc) * 100),
          soLuongKhaDung,
          trangTrai: { id: trangTrai.id, ten: trangTrai.ten },
          chungNhan: trangTrai.chungNhan.map((c) => ({ loai: c.loai })),
        });
      }

      if (muc.length === 0) continue;

      result.push({
        id: campaign.id,
        ten: campaign.ten,
        moTa: campaign.moTa,
        batDauLuc: campaign.batDauLuc,
        ketThucLuc: campaign.ketThucLuc,
        muc,
      });
    }

    return result;
  }

  async layDanhSachQuanTri(
    query: LocChienDichFlashSaleDto,
  ): Promise<DanhSachChienDichFlashSaleDto> {
    const where: Prisma.ChienDichFlashSaleWhereInput = {};
    if (query.trangThai) where.trangThai = query.trangThai;

    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.chienDichFlashSale.findMany({
        where,
        orderBy: [{ batDauLuc: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.chienDichFlashSale.count({ where }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layChiTietQuanTri(id: string): Promise<ChienDichFlashSaleChiTietDto> {
    const row = await this.layBatBuoc(id);
    return { ...this.toDto(row), muc: row.muc.map((m) => this.toMucDto(m)) };
  }

  async taoQuanTri(
    tacNhanId: string,
    dto: LuuChienDichFlashSaleDto,
    metadata: MetadataAudit,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    const actor = await this.layActor(tacNhanId);
    const data = this.chuanBiChienDich(dto);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.chienDichFlashSale.create({ data, include: { muc: true } });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'FLASH_SALE_TAO',
          thucThe: 'chien_dich_flash_sale',
          thucTheId: moi.id,
          truoc: { tonTai: false },
          sau: this.snapshotChienDich(moi),
          metadata,
        },
      });
      return moi.id;
    });

    return this.layChiTietQuanTri(id);
  }

  async capNhatQuanTri(
    tacNhanId: string,
    id: string,
    dto: LuuChienDichFlashSaleDto,
    metadata: MetadataAudit,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(id),
    ]);
    const data = this.chuanBiChienDich(dto);

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.chienDichFlashSale.update({
        where: { id },
        data,
        include: { muc: true },
      });
      await this.assertKhongTrungLich(tx, sau.id, sau.batDauLuc, sau.ketThucLuc, sau.muc.map((m) => m.bienTheSanPhamId));
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'FLASH_SALE_SUA',
          thucThe: 'chien_dich_flash_sale',
          thucTheId: id,
          truoc: this.snapshotChienDich(hienTai),
          sau: this.snapshotChienDich(sau),
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(id);
  }

  async doiTrangThaiQuanTri(
    tacNhanId: string,
    id: string,
    dto: DoiTrangThaiChienDichFlashSaleDto,
    metadata: MetadataAudit,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(id),
    ]);
    if (hienTai.trangThai === dto.trangThai) {
      return { ...this.toDto(hienTai), muc: hienTai.muc.map((m) => this.toMucDto(m)) };
    }

    if (dto.trangThai === TrangThaiBanGhi.HOAT_DONG) {
      await this.prisma.$transaction(async (tx) => {
        await this.assertKhongTrungLich(
          tx,
          hienTai.id,
          hienTai.batDauLuc,
          hienTai.ketThucLuc,
          hienTai.muc
            .filter((m) => m.trangThai === TrangThaiBanGhi.HOAT_DONG)
            .map((m) => m.bienTheSanPhamId),
        );
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.chienDichFlashSale.update({
        where: { id },
        data: { trangThai: dto.trangThai },
        include: { muc: true },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'FLASH_SALE_DOI_TRANG_THAI',
          thucThe: 'chien_dich_flash_sale',
          thucTheId: id,
          truoc: this.snapshotChienDich(hienTai),
          sau: this.snapshotChienDich(sau),
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(id);
  }

  async themMucQuanTri(
    tacNhanId: string,
    chienDichId: string,
    dto: ThemMucFlashSaleDto,
    metadata: MetadataAudit,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    const [actor, chienDich] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(chienDichId),
    ]);

    const bienThe = await this.layBienTheBanDuoc(dto.bienTheSanPhamId);
    const giaGoc = Number(bienThe.gia);
    if (!(dto.giaFlash > 0 && dto.giaFlash < giaGoc)) {
      throw new BadRequestException('Giá flash phải > 0 và nhỏ hơn giá gốc hiện tại.');
    }

    await this.prisma.$transaction(async (tx) => {
      const trung = await tx.mucFlashSale.findFirst({
        where: {
          chienDichId,
          bienTheSanPhamId: dto.bienTheSanPhamId,
        },
        select: { id: true },
      });
      if (trung) {
        throw new ConflictException('Biến thể đã tồn tại trong chiến dịch này.');
      }

      await this.assertKhongTrungLich(
        tx,
        chienDichId,
        chienDich.batDauLuc,
        chienDich.ketThucLuc,
        [dto.bienTheSanPhamId],
      );

      const moi = await tx.mucFlashSale.create({
        data: {
          chienDichId,
          bienTheSanPhamId: dto.bienTheSanPhamId,
          giaFlash: dto.giaFlash,
          gioiHanTong: dto.gioiHanTong ?? null,
          gioiHanMoiKhach: dto.gioiHanMoiKhach ?? null,
        },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'FLASH_SALE_THEM_MUC',
          thucThe: 'muc_flash_sale',
          thucTheId: moi.id,
          truoc: { tonTai: false },
          sau: {
            chienDichId,
            bienTheSanPhamId: dto.bienTheSanPhamId,
            giaFlash: Number(moi.giaFlash),
          },
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(chienDichId);
  }

  async xoaMucQuanTri(
    tacNhanId: string,
    chienDichId: string,
    mucId: string,
    metadata: MetadataAudit,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    const [actor, muc] = await Promise.all([
      this.layActor(tacNhanId),
      this.prisma.mucFlashSale.findFirst({
        where: { id: mucId, chienDichId },
      }),
    ]);
    if (!muc) throw new NotFoundException('Không tìm thấy mục flash sale trong chiến dịch.');

    await this.prisma.$transaction(async (tx) => {
      await tx.mucFlashSale.delete({ where: { id: muc.id } });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'FLASH_SALE_XOA_MUC',
          thucThe: 'muc_flash_sale',
          thucTheId: muc.id,
          truoc: {
            chienDichId: muc.chienDichId,
            bienTheSanPhamId: muc.bienTheSanPhamId,
            giaFlash: Number(muc.giaFlash),
          },
          sau: { tonTai: false },
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(chienDichId);
  }

  private chuanBiChienDich(
    dto: LuuChienDichFlashSaleDto,
  ): Prisma.ChienDichFlashSaleUncheckedCreateInput {
    const ten = dto.ten.trim();
    if (!ten) throw new BadRequestException('Tên chiến dịch không được để trống.');
    const batDauLuc = new Date(dto.batDauLuc);
    const ketThucLuc = new Date(dto.ketThucLuc);
    if (Number.isNaN(batDauLuc.getTime()) || Number.isNaN(ketThucLuc.getTime())) {
      throw new BadRequestException('Thời gian chiến dịch không hợp lệ.');
    }
    if (!(batDauLuc.getTime() < ketThucLuc.getTime())) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }
    return {
      ten,
      moTa: dto.moTa?.trim() ? dto.moTa.trim() : null,
      batDauLuc,
      ketThucLuc,
    };
  }

  private async assertKhongTrungLich(
    tx: Prisma.TransactionClient,
    chienDichId: string,
    batDau: Date,
    ketThuc: Date,
    bienTheIds: string[],
  ): Promise<void> {
    if (bienTheIds.length === 0) return;
    const trung = await tx.mucFlashSale.findFirst({
      where: {
        bienTheSanPhamId: { in: bienTheIds },
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        chienDichId: { not: chienDichId },
        chienDich: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          batDauLuc: { lte: ketThuc },
          ketThucLuc: { gte: batDau },
        },
      },
      select: { id: true, bienTheSanPhamId: true },
    });
    if (trung) {
      throw new ConflictException(
        `Biến thể ${trung.bienTheSanPhamId} đã có flash sale khác trùng thời gian.`,
      );
    }
  }

  private async layBienTheBanDuoc(id: string) {
    const item = await this.prisma.bienTheSanPham.findFirst({
      where: {
        id,
        sanPham: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          danhMucSanPham: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          trangTrai: {
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            nhaCungCap: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          },
        },
      },
      select: { id: true, gia: true },
    });
    if (!item) {
      throw new BadRequestException('Biến thể không tồn tại hoặc không còn được bán.');
    }
    return item;
  }

  private async layBatBuoc(id: string): Promise<ChienDichRow> {
    const row = await this.prisma.chienDichFlashSale.findUnique({
      where: { id },
      include: { muc: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy chiến dịch flash sale.');
    return row;
  }

  private async layActor(id: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân.');
    return actor;
  }

  private toDto(row: {
    id: string;
    ten: string;
    moTa: string | null;
    batDauLuc: Date;
    ketThucLuc: Date;
    trangThai: TrangThaiBanGhi;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return { ...row };
  }

  private toMucDto(row: {
    id: string;
    chienDichId: string;
    bienTheSanPhamId: string;
    giaFlash: Prisma.Decimal;
    gioiHanTong: number | null;
    gioiHanMoiKhach: number | null;
    soLuongDaBan: number;
    trangThai: TrangThaiBanGhi;
  }) {
    return {
      id: row.id,
      chienDichId: row.chienDichId,
      bienTheSanPhamId: row.bienTheSanPhamId,
      giaFlash: Number(row.giaFlash),
      gioiHanTong: row.gioiHanTong,
      gioiHanMoiKhach: row.gioiHanMoiKhach,
      soLuongDaBan: row.soLuongDaBan,
      trangThai: row.trangThai,
    };
  }

  private snapshotChienDich(row: {
    ten: string;
    moTa: string | null;
    batDauLuc: Date;
    ketThucLuc: Date;
    trangThai: TrangThaiBanGhi;
  }) {
    return {
      ten: row.ten,
      moTa: row.moTa,
      batDauLuc: row.batDauLuc.toISOString(),
      ketThucLuc: row.ketThucLuc.toISOString(),
      trangThai: row.trangThai,
    };
  }

  private homNay(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
}
