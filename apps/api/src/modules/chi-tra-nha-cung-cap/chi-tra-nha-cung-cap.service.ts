import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiChiTraNhaCungCap } from '../../generated/prisma/client';
import { SoDuNhaCungCapService } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.service';

import type { CapNhatTrangThaiChiTraNhaCungCapDto } from './dto/cap-nhat-trang-thai-chi-tra-nha-cung-cap.dto';
import type {
  ChiTraNhaCungCapDto,
  DanhSachChiTraNhaCungCapDto,
} from './dto/phan-hoi-chi-tra-nha-cung-cap.dto';
import type { TaoChiTraNhaCungCapDto } from './dto/tao-chi-tra-nha-cung-cap.dto';
import type { TruyVanChiTraNhaCungCapDto } from './dto/truy-van-chi-tra-nha-cung-cap.dto';

const CHI_TRA_INCLUDE = {
  nhaCungCap: {
    select: {
      id: true,
      ma: true,
      ten: true,
    },
  },
} satisfies Prisma.ChiTraNhaCungCapInclude;

type ChiTraDayDu = Prisma.ChiTraNhaCungCapGetPayload<{
  include: typeof CHI_TRA_INCLUDE;
}>;

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class ChiTraNhaCungCapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly soDuNhaCungCap: SoDuNhaCungCapService,
  ) {}

  async layDanhSach(query: TruyVanChiTraNhaCungCapDto): Promise<DanhSachChiTraNhaCungCapDto> {
    const where: Prisma.ChiTraNhaCungCapWhereInput = {
      ...(query.nhaCungCapId ? { nhaCungCapId: query.nhaCungCapId } : {}),
      ...(query.trangThai ? { trangThai: query.trangThai } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.chiTraNhaCungCap.count({ where }),
      this.prisma.chiTraNhaCungCap.findMany({
        where,
        include: CHI_TRA_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);
    return {
      duLieu: rows.map((row) => this.mapChiTra(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<ChiTraNhaCungCapDto> {
    const row = await this.prisma.chiTraNhaCungCap.findUnique({
      where: { id },
      include: CHI_TRA_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy yêu cầu chi trả.');
    }
    return this.mapChiTra(row);
  }

  async tao(
    tacNhanId: string,
    dto: TaoChiTraNhaCungCapDto,
    metadata: MetadataAudit,
  ): Promise<ChiTraNhaCungCapDto> {
    this.validateAmount(dto.soTien);
    const actor = await this.layTacNhan(tacNhanId);

    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.chiTraNhaCungCap.findUnique({
          where: { maYeuCau: dto.maYeuCau },
          include: CHI_TRA_INCLUDE,
        });
        if (existing) {
          if (
            existing.nhaCungCapId !== dto.nhaCungCapId ||
            this.toCents(Number(existing.soTien)) !== this.toCents(dto.soTien)
          ) {
            throw new ConflictException('maYeuCau payout đã được dùng với dữ liệu khác.');
          }
          return this.mapChiTra(existing);
        }

        const supplier = await tx.nhaCungCap.findUnique({
          where: { id: dto.nhaCungCapId },
          select: { id: true },
        });
        if (!supplier) {
          throw new NotFoundException('Không tìm thấy nhà cung cấp.');
        }

        await this.soDuNhaCungCap.giuTienChiTraTrongGiaoDich(tx, dto.nhaCungCapId, dto.soTien);

        const created = await tx.chiTraNhaCungCap.create({
          data: {
            maYeuCau: dto.maYeuCau,
            nhaCungCapId: dto.nhaCungCapId,
            soTien: dto.soTien,
          },
          include: CHI_TRA_INCLUDE,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'PAYOUT_REQUESTED',
            thucThe: 'payout',
            thucTheId: created.id,
            sau: this.snapshot(created),
            metadata,
          },
        });

        return this.mapChiTra(created);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  }

  async capNhatTrangThai(
    tacNhanId: string,
    id: string,
    dto: CapNhatTrangThaiChiTraNhaCungCapDto,
    metadata: MetadataAudit,
  ): Promise<ChiTraNhaCungCapDto> {
    const actor = await this.layTacNhan(tacNhanId);
    if (dto.trangThai === TrangThaiChiTraNhaCungCap.FAILED) {
      const reason = dto.lyDoThatBai?.trim();
      if (!reason || reason.length < 3) {
        throw new BadRequestException('FAILED phải có lý do thất bại tối thiểu 3 ký tự.');
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`SELECT id FROM payout WHERE id = ${id} FOR UPDATE`,
        );
        if (locked.length !== 1) {
          throw new NotFoundException('Không tìm thấy yêu cầu chi trả.');
        }

        const current = await tx.chiTraNhaCungCap.findUnique({
          where: { id },
          include: CHI_TRA_INCLUDE,
        });
        if (!current) {
          throw new NotFoundException('Không tìm thấy yêu cầu chi trả.');
        }
        if (current.trangThai === dto.trangThai) {
          return this.mapChiTra(current);
        }

        this.validateTransition(current.trangThai, dto.trangThai);
        const now = new Date();
        let updated: ChiTraDayDu;

        if (dto.trangThai === TrangThaiChiTraNhaCungCap.PROCESSING) {
          updated = await tx.chiTraNhaCungCap.update({
            where: { id },
            data: {
              trangThai: TrangThaiChiTraNhaCungCap.PROCESSING,
              xuLyLuc: now,
            },
            include: CHI_TRA_INCLUDE,
          });
        } else if (dto.trangThai === TrangThaiChiTraNhaCungCap.PAID) {
          await this.soDuNhaCungCap.xacNhanChiTraThanhCongTrongGiaoDich(
            tx,
            current.nhaCungCapId,
            Number(current.soTien),
          );
          updated = await tx.chiTraNhaCungCap.update({
            where: { id },
            data: {
              trangThai: TrangThaiChiTraNhaCungCap.PAID,
              thanhToanLuc: now,
              lyDoThatBai: null,
            },
            include: CHI_TRA_INCLUDE,
          });
        } else {
          await this.soDuNhaCungCap.hoanTraChiTraThatBaiTrongGiaoDich(
            tx,
            current.nhaCungCapId,
            Number(current.soTien),
          );
          updated = await tx.chiTraNhaCungCap.update({
            where: { id },
            data: {
              trangThai: TrangThaiChiTraNhaCungCap.FAILED,
              thatBaiLuc: now,
              lyDoThatBai: dto.lyDoThatBai!.trim(),
            },
            include: CHI_TRA_INCLUDE,
          });
        }

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: this.auditAction(dto.trangThai),
            thucThe: 'payout',
            thucTheId: id,
            truoc: this.snapshot(current),
            sau: this.snapshot(updated),
            metadata,
          },
        });

        return this.mapChiTra(updated);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
  }

  private validateTransition(from: TrangThaiChiTraNhaCungCap, to: TrangThaiChiTraNhaCungCap): void {
    const ok =
      (from === TrangThaiChiTraNhaCungCap.REQUESTED &&
        to === TrangThaiChiTraNhaCungCap.PROCESSING) ||
      (from === TrangThaiChiTraNhaCungCap.PROCESSING &&
        (to === TrangThaiChiTraNhaCungCap.PAID || to === TrangThaiChiTraNhaCungCap.FAILED));
    if (!ok) {
      throw new ConflictException(`Không thể chuyển payout từ ${from} sang ${to}.`);
    }
  }

  private auditAction(status: TrangThaiChiTraNhaCungCap): string {
    if (status === TrangThaiChiTraNhaCungCap.PROCESSING) return 'PAYOUT_PROCESSING';
    if (status === TrangThaiChiTraNhaCungCap.PAID) return 'PAYOUT_PAID';
    return 'PAYOUT_FAILED';
  }

  private validateAmount(value: number): void {
    if (!Number.isFinite(value) || value <= 0 || this.toCents(value) <= 0) {
      throw new BadRequestException('Số tiền payout phải > 0.');
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
      throw new BadRequestException('Số tiền payout chỉ hỗ trợ tối đa 2 chữ số thập phân.');
    }
  }

  private async layTacNhan(tacNhanId: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: tacNhanId },
      select: { id: true, email: true },
    });
    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    }
    return actor;
  }

  private mapChiTra(row: ChiTraDayDu): ChiTraNhaCungCapDto {
    return {
      id: row.id,
      maYeuCau: row.maYeuCau,
      nhaCungCapId: row.nhaCungCapId,
      maNhaCungCap: row.nhaCungCap.ma,
      tenNhaCungCap: row.nhaCungCap.ten,
      soTien: Number(row.soTien),
      trangThai: row.trangThai,
      yeuCauLuc: row.yeuCauLuc.toISOString(),
      xuLyLuc: row.xuLyLuc?.toISOString() ?? null,
      thanhToanLuc: row.thanhToanLuc?.toISOString() ?? null,
      thatBaiLuc: row.thatBaiLuc?.toISOString() ?? null,
      lyDoThatBai: row.lyDoThatBai,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(row: ChiTraDayDu): {
    maYeuCau: string;
    nhaCungCapId: string;
    soTien: number;
    trangThai: TrangThaiChiTraNhaCungCap;
  } {
    return {
      maYeuCau: row.maYeuCau,
      nhaCungCapId: row.nhaCungCapId,
      soTien: Number(row.soTien),
      trangThai: row.trangThai,
    };
  }

  private toCents(value: number): number {
    return Math.round(value * 100);
  }
}
