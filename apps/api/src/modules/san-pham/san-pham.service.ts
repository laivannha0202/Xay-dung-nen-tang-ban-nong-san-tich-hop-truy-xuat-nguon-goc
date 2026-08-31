import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatSanPhamDto } from './dto/cap-nhat-san-pham.dto';
import type { DanhSachSanPhamDto, SanPhamDto } from './dto/phan-hoi-san-pham.dto';
import type { TaoSanPhamDto } from './dto/tao-san-pham.dto';
import type { TruyVanSanPhamDto } from './dto/truy-van-san-pham.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type SanPhamRow = Prisma.SanPhamGetPayload<{
  include: {
    trangTrai: {
      select: {
        id: true;
        ma: true;
        ten: true;
        trangThai: true;
      };
    };
    danhMucSanPham: {
      select: {
        id: true;
        ten: true;
        slug: true;
        trangThai: true;
      };
    };
  };
}>;

@Injectable()
export class SanPhamService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanSanPhamDto): Promise<DanhSachSanPhamDto> {
    const where: Prisma.SanPhamWhereInput = {};

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    if (dto.trangTraiId) {
      where.trangTraiId = dto.trangTraiId;
    }

    if (dto.danhMucSanPhamId) {
      where.danhMucSanPhamId = dto.danhMucSanPhamId;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.ten = {
        contains: timKiem,
      };
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.sanPham.findMany({
        where,
        include: this.includeNguon(),
        orderBy: [
          {
            ten: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.sanPham.count({
        where,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<SanPhamDto> {
    return this.toDto(await this.layBatBuoc(id));
  }

  async tao(tacNhanId: string, dto: TaoSanPhamDto, metadata: MetadataAudit): Promise<SanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    const [trangTrai, danhMuc] = await Promise.all([
      this.layTrangTraiHoatDong(dto.trangTraiId),
      this.layDanhMucHoatDong(dto.danhMucSanPhamId),
    ]);

    const ten = this.chuanHoaTen(dto.ten);

    const moTa = this.chuanHoaMoTa(dto.moTa);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.sanPham.create({
        data: {
          ten,
          moTa,
          trangTraiId: trangTrai.id,
          danhMucSanPhamId: danhMuc.id,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_TAO',
          thucThe: 'san_pham',
          thucTheId: moi.id,
          truoc: {
            tonTai: false,
          },
          sau: this.snapshot(moi),
          metadata,
        },
      });

      return moi.id;
    });

    return this.layChiTiet(id);
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<SanPhamDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (dto.trangTraiId !== undefined && dto.trangTraiId !== hienTai.trangTraiId) {
      await this.layTrangTraiHoatDong(dto.trangTraiId);
    }

    if (dto.danhMucSanPhamId !== undefined && dto.danhMucSanPhamId !== hienTai.danhMucSanPhamId) {
      await this.layDanhMucHoatDong(dto.danhMucSanPhamId);
    }

    const data: Prisma.SanPhamUncheckedUpdateInput = {};

    if (dto.ten !== undefined) {
      data.ten = this.chuanHoaTen(dto.ten);
    }

    if (dto.moTa !== undefined) {
      data.moTa = this.chuanHoaMoTa(dto.moTa);
    }

    if (dto.trangTraiId !== undefined) {
      data.trangTraiId = dto.trangTraiId;
    }

    if (dto.danhMucSanPhamId !== undefined) {
      data.danhMucSanPhamId = dto.danhMucSanPhamId;
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.sanPham.update({
        where: {
          id,
        },
        data,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_SUA',
          thucThe: 'san_pham',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTiet(id);
  }

  async doiTrangThai(
    tacNhanId: string,
    id: string,
    trangThai: TrangThaiBanGhi,
    metadata: MetadataAudit,
  ): Promise<SanPhamDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (hienTai.trangThai === trangThai) {
      return this.toDto(hienTai);
    }

    if (trangThai === TrangThaiBanGhi.HOAT_DONG) {
      await Promise.all([
        this.layTrangTraiHoatDong(hienTai.trangTraiId),
        this.layDanhMucHoatDong(hienTai.danhMucSanPhamId),
      ]);
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.sanPham.update({
        where: {
          id,
        },
        data: {
          trangThai,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SAN_PHAM_DOI_TRANG_THAI',
          thucThe: 'san_pham',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTiet(id);
  }

  private includeNguon() {
    return {
      trangTrai: {
        select: {
          id: true,
          ma: true,
          ten: true,
          trangThai: true,
        },
      },
      danhMucSanPham: {
        select: {
          id: true,
          ten: true,
          slug: true,
          trangThai: true,
        },
      },
    } as const;
  }

  private async layBatBuoc(id: string): Promise<SanPhamRow> {
    const item = await this.prisma.sanPham.findUnique({
      where: {
        id,
      },
      include: this.includeNguon(),
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }

    return item;
  }

  private async layActor(id: string): Promise<{
    id: string;
    email: string;
  }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }

    return actor;
  }

  private async layTrangTraiHoatDong(id: string): Promise<{
    id: string;
  }> {
    const item = await this.prisma.trangTrai.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new BadRequestException('Trang trại phải tồn tại và đang hoạt động.');
    }

    return item;
  }

  private async layDanhMucHoatDong(id: string): Promise<{
    id: string;
  }> {
    const item = await this.prisma.danhMucSanPham.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new BadRequestException('Danh mục sản phẩm phải tồn tại và đang hoạt động.');
    }

    return item;
  }

  private chuanHoaTen(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Tên sản phẩm không được để trống.');
    }

    return normalized;
  }

  private chuanHoaMoTa(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized ? normalized : null;
  }

  private toDto(row: SanPhamRow): SanPhamDto {
    return {
      id: row.id,
      ten: row.ten,
      moTa: row.moTa,
      trangTraiId: row.trangTraiId,
      trangTrai: {
        id: row.trangTrai.id,
        ma: row.trangTrai.ma,
        ten: row.trangTrai.ten,
        trangThai: row.trangTrai.trangThai,
      },
      danhMucSanPhamId: row.danhMucSanPhamId,
      danhMucSanPham: {
        id: row.danhMucSanPham.id,
        ten: row.danhMucSanPham.ten,
        slug: row.danhMucSanPham.slug,
        trangThai: row.danhMucSanPham.trangThai,
      },
      trangThai: row.trangThai,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(item: {
    ten: string;
    moTa: string | null;
    trangTraiId: string;
    danhMucSanPhamId: string;
    trangThai: TrangThaiBanGhi;
  }) {
    return {
      ten: item.ten,
      moTa: item.moTa,
      trangTraiId: item.trangTraiId,
      danhMucSanPhamId: item.danhMucSanPhamId,
      trangThai: item.trangThai,
    };
  }
}
