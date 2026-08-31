import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import type { CapNhatBienTheSanPhamDto } from './dto/cap-nhat-bien-the-san-pham.dto';
import type {
  BienTheSanPhamDto,
  DanhSachBienTheSanPhamDto,
} from './dto/phan-hoi-bien-the-san-pham.dto';
import type { TaoBienTheSanPhamDto } from './dto/tao-bien-the-san-pham.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class BienTheSanPhamService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(sanPhamId: string): Promise<DanhSachBienTheSanPhamDto> {
    await this.laySanPhamBatBuoc(sanPhamId);

    const rows = await this.prisma.bienTheSanPham.findMany({
      where: {
        sanPhamId,
      },
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          sku: 'asc',
        },
      ],
    });

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong: rows.length,
    };
  }

  async tao(
    tacNhanId: string,
    sanPhamId: string,
    dto: TaoBienTheSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<BienTheSanPhamDto> {
    const [actor] = await Promise.all([
      this.layActor(tacNhanId),
      this.laySanPhamBatBuoc(sanPhamId),
    ]);

    const sku = this.chuanHoaSku(dto.sku);

    const donVi = this.chuanHoaDonVi(dto.donVi);

    this.kiemTraSoDuong(dto.khoiLuong, 'Khối lượng');

    this.kiemTraSoDuong(dto.gia, 'Giá');

    await this.kiemTraTrung(sanPhamId, sku, dto.khoiLuong, donVi, null);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.bienTheSanPham.create({
        data: {
          sanPhamId,
          sku,
          khoiLuong: dto.khoiLuong,
          gia: dto.gia,
          donVi,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'BIEN_THE_SAN_PHAM_TAO',
          thucThe: 'bien_the_san_pham',
          thucTheId: moi.id,
          truoc: {
            tonTai: false,
          },
          sau: this.snapshot(moi),
          metadata: {
            ...metadata,
            sanPhamId,
          },
        },
      });

      return moi.id;
    });

    return this.layChiTietThuocSanPham(sanPhamId, id);
  }

  async capNhat(
    tacNhanId: string,
    sanPhamId: string,
    id: string,
    dto: CapNhatBienTheSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<BienTheSanPhamDto> {
    const [actor, hienTai] = await Promise.all([
      this.layActor(tacNhanId),
      this.layChiTietThuocSanPham(sanPhamId, id),
    ]);

    const sku = dto.sku !== undefined ? this.chuanHoaSku(dto.sku) : hienTai.sku;

    const khoiLuong = dto.khoiLuong ?? hienTai.khoiLuong;

    const gia = dto.gia ?? hienTai.gia;

    const donVi = dto.donVi !== undefined ? this.chuanHoaDonVi(dto.donVi) : hienTai.donVi;

    this.kiemTraSoDuong(khoiLuong, 'Khối lượng');

    this.kiemTraSoDuong(gia, 'Giá');

    await this.kiemTraTrung(sanPhamId, sku, khoiLuong, donVi, id);

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.bienTheSanPham.update({
        where: {
          id,
        },
        data: {
          sku,
          khoiLuong,
          gia,
          donVi,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'BIEN_THE_SAN_PHAM_SUA',
          thucThe: 'bien_the_san_pham',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata: {
            ...metadata,
            sanPhamId,
            giaTruoc: hienTai.gia,
            giaSau: Number(sau.gia),
          },
        },
      });
    });

    return this.layChiTietThuocSanPham(sanPhamId, id);
  }

  private async laySanPhamBatBuoc(id: string): Promise<void> {
    const count = await this.prisma.sanPham.count({
      where: {
        id,
      },
    });

    if (count !== 1) {
      throw new NotFoundException('Không tìm thấy sản phẩm.');
    }
  }

  private async layChiTietThuocSanPham(sanPhamId: string, id: string): Promise<BienTheSanPhamDto> {
    const item = await this.prisma.bienTheSanPham.findFirst({
      where: {
        id,
        sanPhamId,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy biến thể của sản phẩm.');
    }

    return this.toDto(item);
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

  private async kiemTraTrung(
    sanPhamId: string,
    sku: string,
    khoiLuong: number,
    donVi: string,
    boQuaId: string | null,
  ): Promise<void> {
    const trungSku = await this.prisma.bienTheSanPham.findFirst({
      where: {
        sku,
        ...(boQuaId
          ? {
              NOT: {
                id: boQuaId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (trungSku) {
      throw new ConflictException('SKU đã tồn tại.');
    }

    const trungQuyCach = await this.prisma.bienTheSanPham.findFirst({
      where: {
        sanPhamId,
        khoiLuong,
        donVi,
        ...(boQuaId
          ? {
              NOT: {
                id: boQuaId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (trungQuyCach) {
      throw new ConflictException('Sản phẩm đã có biến thể cùng khối lượng và đơn vị.');
    }
  }

  private chuanHoaSku(value: string): string {
    const normalized = value.trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('SKU không được để trống.');
    }

    return normalized;
  }

  private chuanHoaDonVi(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException('Đơn vị không được để trống.');
    }

    return normalized;
  }

  private kiemTraSoDuong(value: number, field: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`${field} phải lớn hơn 0.`);
    }
  }

  private toDto(row: {
    id: string;
    sanPhamId: string;
    sku: string;
    khoiLuong: unknown;
    gia: unknown;
    donVi: string;
    createdAt: Date;
    updatedAt: Date;
  }): BienTheSanPhamDto {
    return {
      id: row.id,
      sanPhamId: row.sanPhamId,
      sku: row.sku,
      khoiLuong: Number(row.khoiLuong),
      gia: Number(row.gia),
      donVi: row.donVi,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(row: {
    sanPhamId: string;
    sku: string;
    khoiLuong: unknown;
    gia: unknown;
    donVi: string;
  }) {
    return {
      sanPhamId: row.sanPhamId,
      sku: row.sku,
      khoiLuong: Number(row.khoiLuong),
      gia: Number(row.gia),
      donVi: row.donVi,
    };
  }
}
