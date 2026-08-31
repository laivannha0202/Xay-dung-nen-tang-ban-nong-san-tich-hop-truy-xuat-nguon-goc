import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import { TepTinService } from '../tep-tin/tep-tin.service';

import type { CapNhatDanhMucSanPhamDto } from './dto/cap-nhat-danh-muc-san-pham.dto';
import type {
  DanhMucSanPhamDto,
  DanhSachDanhMucSanPhamDto,
} from './dto/phan-hoi-danh-muc-san-pham.dto';
import type { TaoDanhMucSanPhamDto } from './dto/tao-danh-muc-san-pham.dto';
import type { TruyVanDanhMucSanPhamDto } from './dto/truy-van-danh-muc-san-pham.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type DanhMucRow = Prisma.DanhMucSanPhamGetPayload<{
  include: {
    danhMucCha: {
      select: {
        id: true;
        ten: true;
        slug: true;
      };
    };
    anh: {
      select: {
        id: true;
        tenGoc: true;
        mimeType: true;
        trangThai: true;
      };
    };
    _count: {
      select: {
        danhMucCon: true;
      };
    };
  };
}>;

@Injectable()
export class DanhMucSanPhamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanDanhMucSanPhamDto): Promise<DanhSachDanhMucSanPhamDto> {
    const where: Prisma.DanhMucSanPhamWhereInput = {};

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    if (dto.danhMucChaId) {
      where.danhMucChaId = dto.danhMucChaId;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          ten: {
            contains: timKiem,
          },
        },
        {
          slug: {
            contains: timKiem.toLowerCase(),
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.danhMucSanPham.findMany({
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
      this.prisma.danhMucSanPham.count({
        where,
      }),
    ]);

    return {
      duLieu: await Promise.all(rows.map((row) => this.toDto(row))),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<DanhMucSanPhamDto> {
    return this.toDto(await this.layBatBuoc(id));
  }

  async tao(
    tacNhanId: string,
    dto: TaoDanhMucSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<DanhMucSanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    const ten = this.chuanHoaTen(dto.ten);

    const slug = this.chuanHoaSlug(dto.slug);

    const danhMucChaId = dto.danhMucChaId ?? null;

    const anhId = dto.anhId ?? null;

    await Promise.all([this.kiemTraDanhMucCha(danhMucChaId, null), this.kiemTraAnh(anhId)]);

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const moi = await tx.danhMucSanPham.create({
          data: {
            ten,
            slug,
            danhMucChaId,
            anhId,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'DANH_MUC_SAN_PHAM_TAO',
            thucThe: 'danh_muc_san_pham',
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
    } catch (error) {
      this.nemLoiUnique(error);

      throw error;
    }
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatDanhMucSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<DanhMucSanPhamDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (dto.danhMucChaId !== undefined) {
      await this.kiemTraDanhMucCha(dto.danhMucChaId, id);
    }

    if (dto.anhId !== undefined) {
      await this.kiemTraAnh(dto.anhId);
    }

    const data: Prisma.DanhMucSanPhamUncheckedUpdateInput = {};

    if (dto.ten !== undefined) {
      data.ten = this.chuanHoaTen(dto.ten);
    }

    if (dto.slug !== undefined) {
      data.slug = this.chuanHoaSlug(dto.slug);
    }

    if (dto.danhMucChaId !== undefined) {
      data.danhMucChaId = dto.danhMucChaId;
    }

    if (dto.anhId !== undefined) {
      data.anhId = dto.anhId;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const sau = await tx.danhMucSanPham.update({
          where: {
            id,
          },
          data,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'DANH_MUC_SAN_PHAM_SUA',
            thucThe: 'danh_muc_san_pham',
            thucTheId: id,
            truoc: this.snapshot(hienTai),
            sau: this.snapshot(sau),
            metadata,
          },
        });
      });
    } catch (error) {
      this.nemLoiUnique(error);

      throw error;
    }

    return this.layChiTiet(id);
  }

  async doiTrangThai(
    tacNhanId: string,
    id: string,
    trangThai: TrangThaiBanGhi,
    metadata: MetadataAudit,
  ): Promise<DanhMucSanPhamDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (hienTai.trangThai === trangThai) {
      return this.toDto(hienTai);
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.danhMucSanPham.update({
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
          hanhDong: 'DANH_MUC_SAN_PHAM_DOI_TRANG_THAI',
          thucThe: 'danh_muc_san_pham',
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
      danhMucCha: {
        select: {
          id: true,
          ten: true,
          slug: true,
        },
      },
      anh: {
        select: {
          id: true,
          tenGoc: true,
          mimeType: true,
          trangThai: true,
        },
      },
      _count: {
        select: {
          danhMucCon: true,
        },
      },
    } as const;
  }

  private async layBatBuoc(id: string): Promise<DanhMucRow> {
    const item = await this.prisma.danhMucSanPham.findUnique({
      where: {
        id,
      },
      include: this.includeNguon(),
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy danh mục sản phẩm.');
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

  private async kiemTraDanhMucCha(
    parentId: string | null,
    currentId: string | null,
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    if (currentId && parentId === currentId) {
      throw new BadRequestException('Danh mục không thể là cha của chính nó.');
    }

    let cursor: string | null = parentId;

    const visited = new Set<string>();

    while (cursor) {
      if (currentId && cursor === currentId) {
        throw new BadRequestException('Quan hệ danh mục cha tạo thành chu trình.');
      }

      if (visited.has(cursor)) {
        throw new BadRequestException('Cây danh mục hiện tại có chu trình không hợp lệ.');
      }

      visited.add(cursor);

      const node: {
        id: string;
        danhMucChaId: string | null;
      } | null = await this.prisma.danhMucSanPham.findUnique({
        where: {
          id: cursor,
        },
        select: {
          id: true,
          danhMucChaId: true,
        },
      });

      if (!node) {
        throw new NotFoundException('Không tìm thấy danh mục cha.');
      }

      cursor = node.danhMucChaId;
    }
  }

  private async kiemTraAnh(anhId: string | null): Promise<void> {
    if (!anhId) {
      return;
    }

    const anh = await this.prisma.tepTin.findFirst({
      where: {
        id: anhId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
        mimeType: true,
      },
    });

    if (!anh) {
      throw new NotFoundException('Không tìm thấy ảnh đang hoạt động.');
    }

    if (!anh.mimeType.startsWith('image/')) {
      throw new BadRequestException('Danh mục chỉ được gắn file ảnh.');
    }
  }

  private chuanHoaTen(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Tên danh mục không được để trống.');
    }

    return normalized;
  }

  private chuanHoaSlug(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      throw new BadRequestException('Slug danh mục không hợp lệ.');
    }

    return normalized;
  }

  private async toDto(row: DanhMucRow): Promise<DanhMucSanPhamDto> {
    let anh: DanhMucSanPhamDto['anh'] = null;

    if (
      row.anh &&
      row.anh.trangThai === TrangThaiBanGhi.HOAT_DONG &&
      row.anh.mimeType.startsWith('image/')
    ) {
      anh = {
        id: row.anh.id,
        tenGoc: row.anh.tenGoc,
        mimeType: row.anh.mimeType,
        url: await this.tepTinService.taoSignedUrlAnhNoiBo(row.anh.id),
      };
    }

    return {
      id: row.id,
      ten: row.ten,
      slug: row.slug,
      danhMucChaId: row.danhMucChaId,
      danhMucCha: row.danhMucCha
        ? {
            id: row.danhMucCha.id,
            ten: row.danhMucCha.ten,
            slug: row.danhMucCha.slug,
          }
        : null,
      anhId: row.anhId,
      anh,
      trangThai: row.trangThai,
      soDanhMucCon: row._count.danhMucCon,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(item: {
    ten: string;
    slug: string;
    danhMucChaId: string | null;
    anhId: string | null;
    trangThai: TrangThaiBanGhi;
  }) {
    return {
      ten: item.ten,
      slug: item.slug,
      danhMucChaId: item.danhMucChaId,
      anhId: item.anhId,
      trangThai: item.trangThai,
    };
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Slug danh mục sản phẩm đã tồn tại.');
    }
  }
}
