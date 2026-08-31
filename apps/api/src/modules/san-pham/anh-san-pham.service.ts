import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';

import type { GanAnhSanPhamDto } from './dto/gan-anh-san-pham.dto';
import type { AnhSanPhamDto, DanhSachAnhSanPhamDto } from './dto/phan-hoi-anh-san-pham.dto';
import type { SapXepAnhSanPhamDto } from './dto/sap-xep-anh-san-pham.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

const MIME_ANH_SAN_PHAM = ['image/jpeg', 'image/png', 'image/webp'] as const;

@Injectable()
export class AnhSanPhamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(sanPhamId: string): Promise<DanhSachAnhSanPhamDto> {
    await this.laySanPhamBatBuoc(sanPhamId);

    const rows = await this.prisma.sanPhamAnh.findMany({
      where: { sanPhamId },
      include: { tepTin: true },
      orderBy: [{ thuTu: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      duLieu: await Promise.all(rows.map((row) => this.toDto(row))),
      tong: rows.length,
    };
  }

  async ganNhieu(
    tacNhanId: string,
    sanPhamId: string,
    dto: GanAnhSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<DanhSachAnhSanPhamDto> {
    const [actor] = await Promise.all([
      this.layActor(tacNhanId),
      this.laySanPhamBatBuoc(sanPhamId),
    ]);

    const teps = await this.prisma.tepTin.findMany({
      where: {
        id: { in: dto.tepTinIds },
        nguoiTaiLenId: tacNhanId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        mimeType: { in: [...MIME_ANH_SAN_PHAM] },
      },
    });

    if (teps.length !== dto.tepTinIds.length) {
      throw new BadRequestException(
        'Mọi TepTin phải là JPEG/PNG/WebP đang hoạt động và do chính tác nhân tải lên.',
      );
    }

    const daGan = await this.prisma.sanPhamAnh.findMany({
      where: { sanPhamId, tepTinId: { in: dto.tepTinIds } },
      select: { tepTinId: true },
    });
    if (daGan.length) {
      throw new ConflictException('Có ảnh đã được gắn vào sản phẩm.');
    }

    const tepMap = new Map(teps.map((item) => [item.id, item]));
    const tepsTheoThuTu = dto.tepTinIds.map((id) => tepMap.get(id)!);

    await this.prisma.$transaction(async (tx) => {
      const hienTai = await tx.sanPhamAnh.findMany({
        where: { sanPhamId },
        select: { thuTu: true, laAnhBia: true },
      });
      const maxThuTu = hienTai.reduce((max, item) => Math.max(max, item.thuTu), -1);
      const daCoAnhBia = hienTai.some((item) => item.laAnhBia);

      for (let index = 0; index < tepsTheoThuTu.length; index += 1) {
        const tep = tepsTheoThuTu[index]!;
        const moi = await tx.sanPhamAnh.create({
          data: {
            sanPhamId,
            tepTinId: tep.id,
            laAnhBia: !daCoAnhBia && index === 0,
            thuTu: maxThuTu + index + 1,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'SAN_PHAM_ANH_THEM',
            thucThe: 'san_pham_anh',
            thucTheId: moi.id,
            truoc: { tonTai: false },
            sau: {
              sanPhamId,
              tepTinId: tep.id,
              laAnhBia: moi.laAnhBia,
              thuTu: moi.thuTu,
            },
            metadata: { ...metadata, sanPhamId },
          },
        });
      }
    });

    return this.layDanhSach(sanPhamId);
  }

  async datAnhBia(
    tacNhanId: string,
    sanPhamId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<DanhSachAnhSanPhamDto> {
    const [actor, target] = await Promise.all([
      this.layActor(tacNhanId),
      this.layAnhThuocSanPham(sanPhamId, id),
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.sanPhamAnh.updateMany({ where: { sanPhamId }, data: { laAnhBia: false } });
      await tx.sanPhamAnh.update({ where: { id: target.id }, data: { laAnhBia: true } });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_ANH_DAT_BIA',
          thucThe: 'san_pham_anh',
          thucTheId: target.id,
          truoc: { laAnhBia: target.laAnhBia },
          sau: { laAnhBia: true },
          metadata: { ...metadata, sanPhamId, tepTinId: target.tepTinId },
        },
      });
    });

    return this.layDanhSach(sanPhamId);
  }

  async sapXep(
    tacNhanId: string,
    sanPhamId: string,
    dto: SapXepAnhSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<DanhSachAnhSanPhamDto> {
    const [actor, rows] = await Promise.all([
      this.layActor(tacNhanId),
      this.prisma.sanPhamAnh.findMany({ where: { sanPhamId }, select: { id: true, thuTu: true } }),
    ]);
    await this.laySanPhamBatBuoc(sanPhamId);

    const current = rows.map((item) => item.id).sort();
    const requested = [...dto.anhIds].sort();
    if (
      current.length !== requested.length ||
      current.some((id, index) => id !== requested[index])
    ) {
      throw new BadRequestException('anhIds phải chứa đúng toàn bộ ảnh hiện tại của sản phẩm.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < dto.anhIds.length; index += 1) {
        await tx.sanPhamAnh.update({ where: { id: dto.anhIds[index]! }, data: { thuTu: index } });
      }
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_ANH_SAP_XEP',
          thucThe: 'san_pham',
          thucTheId: sanPhamId,
          truoc: { anhIds: rows.sort((a, b) => a.thuTu - b.thuTu).map((item) => item.id) },
          sau: { anhIds: dto.anhIds },
          metadata,
        },
      });
    });

    return this.layDanhSach(sanPhamId);
  }

  async xoa(
    tacNhanId: string,
    sanPhamId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<void> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layAnhThuocSanPham(sanPhamId, id),
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.sanPhamAnh.delete({ where: { id } });

      if (hienTai.laAnhBia) {
        const tiepTheo = await tx.sanPhamAnh.findFirst({
          where: { sanPhamId },
          orderBy: [{ thuTu: 'asc' }, { createdAt: 'asc' }],
        });
        if (tiepTheo) {
          await tx.sanPhamAnh.update({ where: { id: tiepTheo.id }, data: { laAnhBia: true } });
        }
      }

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_ANH_XOA',
          thucThe: 'san_pham_anh',
          thucTheId: id,
          truoc: {
            sanPhamId,
            tepTinId: hienTai.tepTinId,
            laAnhBia: hienTai.laAnhBia,
            thuTu: hienTai.thuTu,
          },
          sau: { tonTai: false },
          metadata: { ...metadata, sanPhamId },
        },
      });
    });
  }

  private async laySanPhamBatBuoc(id: string): Promise<void> {
    const count = await this.prisma.sanPham.count({ where: { id } });
    if (count !== 1) throw new NotFoundException('Không tìm thấy sản phẩm.');
  }

  private async layAnhThuocSanPham(sanPhamId: string, id: string) {
    const item = await this.prisma.sanPhamAnh.findFirst({
      where: { id, sanPhamId },
      include: { tepTin: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy ảnh của sản phẩm.');
    return item;
  }

  private async layActor(id: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân.');
    return actor;
  }

  private async toDto(row: {
    id: string;
    sanPhamId: string;
    tepTinId: string;
    laAnhBia: boolean;
    thuTu: number;
    createdAt: Date;
    updatedAt: Date;
    tepTin: { tenGoc: string; mimeType: string; kichThuoc: bigint };
  }): Promise<AnhSanPhamDto> {
    return {
      id: row.id,
      sanPhamId: row.sanPhamId,
      tepTinId: row.tepTinId,
      tenGoc: row.tepTin.tenGoc,
      mimeType: row.tepTin.mimeType,
      kichThuoc: Number(row.tepTin.kichThuoc),
      laAnhBia: row.laAnhBia,
      thuTu: row.thuTu,
      url: await this.tepTinService.taoSignedUrlAnhNoiBo(row.tepTinId),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
