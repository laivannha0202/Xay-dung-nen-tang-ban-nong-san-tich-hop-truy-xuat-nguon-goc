import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type { CapNhatQuyTacHoaHongDto } from './dto/cap-nhat-quy-tac-hoa-hong.dto';
import type {
  DanhSachQuyTacHoaHongDto,
  QuyTacHoaHongDto,
} from './dto/phan-hoi-quy-tac-hoa-hong.dto';
import type { TaoQuyTacHoaHongDto } from './dto/tao-quy-tac-hoa-hong.dto';
import type { TruyVanQuyTacHoaHongDto } from './dto/truy-van-quy-tac-hoa-hong.dto';

const QUY_TAC_INCLUDE = {
  danhMucSanPham: {
    select: { id: true, ten: true },
  },
  nhaCungCap: {
    select: { id: true, ten: true },
  },
} satisfies Prisma.QuyTacHoaHongInclude;

type QuyTacDayDu = Prisma.QuyTacHoaHongGetPayload<{ include: typeof QUY_TAC_INCLUDE }>;
type DauVaoQuyTac = {
  tyLe: number;
  danhMucSanPhamId: string;
  nhaCungCapId: string;
  hieuLucTu: Date;
};
type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class QuyTacHoaHongService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: TruyVanQuyTacHoaHongDto): Promise<DanhSachQuyTacHoaHongDto> {
    const where: Prisma.QuyTacHoaHongWhereInput = {
      ...(query.danhMucSanPhamId ? { danhMucSanPhamId: query.danhMucSanPhamId } : {}),
      ...(query.nhaCungCapId ? { nhaCungCapId: query.nhaCungCapId } : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.quyTacHoaHong.count({ where }),
      this.prisma.quyTacHoaHong.findMany({
        where,
        include: QUY_TAC_INCLUDE,
        orderBy: [{ hieuLucTu: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.mapQuyTac(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async tao(
    tacNhanId: string,
    dto: TaoQuyTacHoaHongDto,
    metadata: MetadataAudit,
  ): Promise<QuyTacHoaHongDto> {
    const actor = await this.layTacNhan(tacNhanId);
    const input = this.chuanHoaInput(dto);

    return this.prisma.$transaction(async (tx) => {
      await this.kiemTraThamChieu(tx, input);
      await this.kiemTraTrung(tx, input);

      const created = await tx.quyTacHoaHong.create({
        data: input,
        include: QUY_TAC_INCLUDE,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'QUY_TAC_HOA_HONG_TAO',
          thucThe: 'commission_rule',
          thucTheId: created.id,
          sau: this.snapshot(created),
          metadata,
        },
      });

      return this.mapQuyTac(created);
    });
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatQuyTacHoaHongDto,
    metadata: MetadataAudit,
  ): Promise<QuyTacHoaHongDto> {
    const actor = await this.layTacNhan(tacNhanId);
    const input = this.chuanHoaInput(dto);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.quyTacHoaHong.findUnique({
        where: { id },
        include: QUY_TAC_INCLUDE,
      });
      if (!current) {
        throw new NotFoundException('Không tìm thấy quy tắc hoa hồng.');
      }
      if (current.hieuLucTu.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Quy tắc đã có hiệu lực không được sửa. Hãy tạo quy tắc mới với ngày hiệu lực mới.',
        );
      }

      await this.kiemTraThamChieu(tx, input);
      await this.kiemTraTrung(tx, input, id);

      const updated = await tx.quyTacHoaHong.update({
        where: { id },
        data: input,
        include: QUY_TAC_INCLUDE,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'QUY_TAC_HOA_HONG_CAP_NHAT',
          thucThe: 'commission_rule',
          thucTheId: id,
          truoc: this.snapshot(current),
          sau: this.snapshot(updated),
          metadata,
        },
      });

      return this.mapQuyTac(updated);
    });
  }

  async layQuyTacApDung(
    nhaCungCapId: string,
    danhMucSanPhamId: string,
    thoiDiem = new Date(),
  ): Promise<QuyTacHoaHongDto | null> {
    const row = await this.prisma.quyTacHoaHong.findFirst({
      where: {
        nhaCungCapId,
        danhMucSanPhamId,
        hieuLucTu: { lte: thoiDiem },
      },
      include: QUY_TAC_INCLUDE,
      orderBy: [{ hieuLucTu: 'desc' }, { createdAt: 'desc' }],
    });
    return row ? this.mapQuyTac(row) : null;
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

  private chuanHoaInput(dto: TaoQuyTacHoaHongDto | CapNhatQuyTacHoaHongDto): DauVaoQuyTac {
    const hieuLucTu = new Date(dto.hieuLucTu);
    if (Number.isNaN(hieuLucTu.getTime())) {
      throw new BadRequestException('Ngày hiệu lực không hợp lệ.');
    }
    return {
      tyLe: dto.tyLe,
      danhMucSanPhamId: dto.danhMucSanPhamId,
      nhaCungCapId: dto.nhaCungCapId,
      hieuLucTu,
    };
  }

  private async kiemTraThamChieu(tx: Prisma.TransactionClient, input: DauVaoQuyTac): Promise<void> {
    const [danhMuc, nhaCungCap] = await Promise.all([
      tx.danhMucSanPham.findUnique({
        where: { id: input.danhMucSanPhamId },
        select: { id: true, trangThai: true },
      }),
      tx.nhaCungCap.findUnique({
        where: { id: input.nhaCungCapId },
        select: { id: true, trangThai: true },
      }),
    ]);

    if (!danhMuc || danhMuc.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new BadRequestException('Danh mục áp dụng phải đang hoạt động.');
    }
    if (!nhaCungCap || nhaCungCap.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new BadRequestException('Nhà cung cấp áp dụng phải đang hoạt động.');
    }
  }

  private async kiemTraTrung(
    tx: Prisma.TransactionClient,
    input: DauVaoQuyTac,
    boQuaId?: string,
  ): Promise<void> {
    const duplicate = await tx.quyTacHoaHong.findFirst({
      where: {
        nhaCungCapId: input.nhaCungCapId,
        danhMucSanPhamId: input.danhMucSanPhamId,
        hieuLucTu: input.hieuLucTu,
        ...(boQuaId ? { id: { not: boQuaId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException(
        'Đã có quy tắc cho nhà cung cấp, danh mục và thời điểm hiệu lực này.',
      );
    }
  }

  private mapQuyTac(row: QuyTacDayDu): QuyTacHoaHongDto {
    return {
      id: row.id,
      tyLe: Number(row.tyLe),
      danhMucSanPhamId: row.danhMucSanPhamId,
      tenDanhMucSanPham: row.danhMucSanPham.ten,
      nhaCungCapId: row.nhaCungCapId,
      tenNhaCungCap: row.nhaCungCap.ten,
      hieuLucTu: row.hieuLucTu.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(row: QuyTacDayDu): {
    tyLe: number;
    danhMucSanPhamId: string;
    nhaCungCapId: string;
    hieuLucTu: string;
  } {
    return {
      tyLe: Number(row.tyLe),
      danhMucSanPhamId: row.danhMucSanPhamId,
      nhaCungCapId: row.nhaCungCapId,
      hieuLucTu: row.hieuLucTu.toISOString(),
    };
  }
}
