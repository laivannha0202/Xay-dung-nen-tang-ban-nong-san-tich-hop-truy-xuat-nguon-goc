import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { LoaiNoiDungTrangChu } from '../../generated/prisma/client';

import type {
  DanhSachNoiDungTrangChuQuanTriDto,
  DoiTrangThaiNoiDungTrangChuDto,
  LocNoiDungTrangChuQuanTriDto,
  LuuNoiDungTrangChuDto,
  NoiDungTrangChuDto,
  TrangChuCongKhaiDto,
  TruyVanNoiDungTrangChuCongKhaiDto,
} from './dto/noi-dung-trang-chu.dto';
import { VI_TRI_NOI_DUNG_TRANG_CHU } from './dto/noi-dung-trang-chu.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type NoiDungRow = Prisma.NoiDungTrangChuGetPayload<Record<string, never>>;

@Injectable()
export class NoiDungTrangChuService {
  constructor(private readonly prisma: PrismaService) {}

  async layTrangChuCongKhai(
    query: TruyVanNoiDungTrangChuCongKhaiDto,
  ): Promise<TrangChuCongKhaiDto> {
    const now = new Date();
    const base: Prisma.NoiDungTrangChuWhereInput = {
      hienThi: true,
      OR: [{ batDauLuc: null }, { batDauLuc: { lte: now } }],
      AND: [
        { OR: [{ ketThucLuc: null }, { ketThucLuc: { gte: now } }] },
      ],
    };
    const whereFor = (
      loai: LoaiNoiDungTrangChu,
    ): Prisma.NoiDungTrangChuWhereInput => ({
      AND: [base, { loai }],
    });

    const orderBy = [{ thuTu: 'asc' as const }, { createdAt: 'asc' as const }];
    const loaiCanLay: LoaiNoiDungTrangChu[] = query.loai
      ? [query.loai]
      : [
          LoaiNoiDungTrangChu.BANNER,
          LoaiNoiDungTrangChu.KIEN_THUC,
          LoaiNoiDungTrangChu.CAU_CHUYEN_TRANG_TRAI,
        ];

    const [banners, kienThuc, cauChuyen] = await Promise.all(
      (
        [
          LoaiNoiDungTrangChu.BANNER,
          LoaiNoiDungTrangChu.KIEN_THUC,
          LoaiNoiDungTrangChu.CAU_CHUYEN_TRANG_TRAI,
        ] as const
      ).map((loai) =>
        loaiCanLay.includes(loai)
          ? this.prisma.noiDungTrangChu.findMany({ where: whereFor(loai), orderBy })
          : Promise.resolve([] as NoiDungRow[]),
      ),
    );

    return {
      banners: (banners ?? []).map((row) => this.toDto(row)),
      kienThuc: (kienThuc ?? []).map((row) => this.toDto(row)),
      cauChuyenTrangTrai: (cauChuyen ?? []).map((row) => this.toDto(row)),
    };
  }

  async layDanhSachQuanTri(
    query: LocNoiDungTrangChuQuanTriDto,
  ): Promise<DanhSachNoiDungTrangChuQuanTriDto> {
    const where: Prisma.NoiDungTrangChuWhereInput = {};
    if (query.loai) where.loai = query.loai;
    if (query.hienThi !== undefined) where.hienThi = query.hienThi;
    const timKiem = query.timKiem?.trim();
    if (timKiem) {
      where.OR = [
        { tieuDe: { contains: timKiem } },
        { nhan: { contains: timKiem } },
        { moTa: { contains: timKiem } },
      ];
    }

    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.noiDungTrangChu.findMany({
        where,
        orderBy: [{ thuTu: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.noiDungTrangChu.count({ where }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layChiTietQuanTri(id: string): Promise<NoiDungTrangChuDto> {
    return this.toDto(await this.layBatBuoc(id));
  }

  async taoQuanTri(
    tacNhanId: string,
    dto: LuuNoiDungTrangChuDto,
    metadata: MetadataAudit,
  ): Promise<NoiDungTrangChuDto> {
    const actor = await this.layActor(tacNhanId);
    const data = this.chuanBiDuLieu(dto);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.noiDungTrangChu.create({ data });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NOI_DUNG_TRANG_CHU_TAO',
          thucThe: 'noi_dung_trang_chu',
          thucTheId: moi.id,
          truoc: { tonTai: false },
          sau: this.snapshot(moi),
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
    dto: LuuNoiDungTrangChuDto,
    metadata: MetadataAudit,
  ): Promise<NoiDungTrangChuDto> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(id),
    ]);
    const data = this.chuanBiDuLieu(dto);

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.noiDungTrangChu.update({ where: { id }, data });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NOI_DUNG_TRANG_CHU_SUA',
          thucThe: 'noi_dung_trang_chu',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(id);
  }

  async doiTrangThaiQuanTri(
    tacNhanId: string,
    id: string,
    dto: DoiTrangThaiNoiDungTrangChuDto,
    metadata: MetadataAudit,
  ): Promise<NoiDungTrangChuDto> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(id),
    ]);
    if (hienTai.hienThi === dto.hienThi) return this.toDto(hienTai);

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.noiDungTrangChu.update({
        where: { id },
        data: { hienThi: dto.hienThi },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NOI_DUNG_TRANG_CHU_DOI_TRANG_THAI',
          thucThe: 'noi_dung_trang_chu',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(id);
  }

  async xoaQuanTri(
    tacNhanId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<void> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layBatBuoc(id),
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.noiDungTrangChu.delete({ where: { id } });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NOI_DUNG_TRANG_CHU_XOA',
          thucThe: 'noi_dung_trang_chu',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: { tonTai: false },
          metadata,
        },
      });
    });
  }

  private chuanBiDuLieu(
    dto: LuuNoiDungTrangChuDto,
  ): Prisma.NoiDungTrangChuUncheckedCreateInput {
    const tieuDe = dto.tieuDe.trim();
    if (!tieuDe) {
      throw new BadRequestException('Tiêu đề không được để trống.');
    }
    const nhan = dto.nhan?.trim() ? dto.nhan.trim() : null;
    const moTa = dto.moTa?.trim() ? dto.moTa.trim() : null;
    const anhUrl = this.chuanHoaUrl(dto.anhUrl, 'Ảnh');
    const duongDan = this.chuanHoaUrl(dto.duongDan, 'Đường dẫn');
    const viTri = dto.viTri?.trim() ? dto.viTri.trim() : null;

    if (dto.loai === LoaiNoiDungTrangChu.BANNER && viTri) {
      const hopLe = (VI_TRI_NOI_DUNG_TRANG_CHU as readonly string[]).includes(viTri);
      if (!hopLe) {
        throw new BadRequestException(
          `Vị trí banner phải thuộc: ${VI_TRI_NOI_DUNG_TRANG_CHU.join(', ')}.`,
        );
      }
    }

    const batDauLuc = dto.batDauLuc ? new Date(dto.batDauLuc) : null;
    const ketThucLuc = dto.ketThucLuc ? new Date(dto.ketThucLuc) : null;
    if (batDauLuc && Number.isNaN(batDauLuc.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu không hợp lệ.');
    }
    if (ketThucLuc && Number.isNaN(ketThucLuc.getTime())) {
      throw new BadRequestException('Thời gian kết thúc không hợp lệ.');
    }
    if (batDauLuc && ketThucLuc && !(batDauLuc.getTime() <= ketThucLuc.getTime())) {
      throw new BadRequestException('Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.');
    }

    return {
      loai: dto.loai,
      tieuDe,
      nhan,
      moTa,
      anhUrl,
      duongDan,
      viTri,
      thuTu: dto.thuTu ?? 0,
      hienThi: dto.hienThi ?? true,
      batDauLuc,
      ketThucLuc,
    };
  }

  private chuanHoaUrl(
    value: string | null | undefined,
    tenTruong: string,
  ): string | null {
    if (value === undefined || value === null) return null;
    const normalized = value.trim();
    if (!normalized) return null;
    const hopLe =
      normalized.startsWith('/') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('https://');
    if (!hopLe) {
      throw new BadRequestException(
        `${tenTruong} phải là đường dẫn nội bộ (bắt đầu bằng /) hoặc URL http(s).`,
      );
    }
    return normalized;
  }

  private async layBatBuoc(id: string): Promise<NoiDungRow> {
    const row = await this.prisma.noiDungTrangChu.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy nội dung trang chủ.');
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

  private toDto(row: NoiDungRow): NoiDungTrangChuDto {
    return {
      id: row.id,
      loai: row.loai,
      tieuDe: row.tieuDe,
      nhan: row.nhan,
      moTa: row.moTa,
      anhUrl: row.anhUrl,
      duongDan: row.duongDan,
      viTri: row.viTri,
      thuTu: row.thuTu,
      hienThi: row.hienThi,
      batDauLuc: row.batDauLuc,
      ketThucLuc: row.ketThucLuc,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(row: NoiDungRow) {
    return {
      loai: row.loai,
      tieuDe: row.tieuDe,
      nhan: row.nhan,
      moTa: row.moTa,
      anhUrl: row.anhUrl,
      duongDan: row.duongDan,
      viTri: row.viTri,
      thuTu: row.thuTu,
      hienThi: row.hienThi,
      batDauLuc: row.batDauLuc?.toISOString() ?? null,
      ketThucLuc: row.ketThucLuc?.toISOString() ?? null,
    };
  }
}
