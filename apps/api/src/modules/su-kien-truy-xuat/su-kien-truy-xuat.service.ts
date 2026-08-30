import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { LoaiSuKienTruyXuat } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type {
  DanhSachSuKienTruyXuatDto,
  SuKienTruyXuatDto,
} from './dto/phan-hoi-su-kien-truy-xuat.dto';
import type { TaoSuKienTruyXuatDto } from './dto/tao-su-kien-truy-xuat.dto';
import type { TruyVanSuKienTruyXuatDto } from './dto/truy-van-su-kien-truy-xuat.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type SuKienRow = Prisma.SuKienTruyXuatGetPayload<{
  include: {
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
  };
}>;

type LoNguon = Prisma.LoSanPhamGetPayload<{
  include: {
    thuHoach: {
      include: {
        muaVu: true;
      };
    };
  };
}>;

@Injectable()
export class SuKienTruyXuatService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanSuKienTruyXuatDto): Promise<DanhSachSuKienTruyXuatDto> {
    const where: Prisma.SuKienTruyXuatWhereInput = {};

    if (dto.loSanPhamId) {
      where.loSanPhamId = dto.loSanPhamId;
    }

    if (dto.loai) {
      where.loai = dto.loai;
    }

    if (dto.congKhai !== undefined) {
      where.congKhai = dto.congKhai;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          diaDiem: {
            contains: timKiem,
          },
        },
        {
          loSanPham: {
            maLo: {
              contains: timKiem,
            },
          },
        },
        {
          loSanPham: {
            thuHoach: {
              muaVu: {
                cayTrong: {
                  contains: timKiem,
                },
              },
            },
          },
        },
        {
          loSanPham: {
            thuHoach: {
              muaVu: {
                trangTrai: {
                  ten: {
                    contains: timKiem,
                  },
                },
              },
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.suKienTruyXuat.findMany({
        where,
        include: this.includeDayDu(),
        orderBy: [
          {
            thoiGian: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.suKienTruyXuat.count({
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

  async layChiTiet(id: string): Promise<SuKienTruyXuatDto> {
    const row = await this.prisma.suKienTruyXuat.findUnique({
      where: {
        id,
      },
      include: this.includeDayDu(),
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy sự kiện truy xuất.');
    }

    return this.toDto(row);
  }

  async tao(
    tacNhanId: string,
    loSanPhamId: string,
    dto: TaoSuKienTruyXuatDto,
    metadataAudit: MetadataAudit,
  ): Promise<SuKienTruyXuatDto> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: {
        id: tacNhanId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }

    const lo = await this.prisma.loSanPham.findUnique({
      where: {
        id: loSanPhamId,
      },
      include: {
        thuHoach: {
          include: {
            muaVu: true,
          },
        },
      },
    });

    if (!lo) {
      throw new NotFoundException('Không tìm thấy Lô sản phẩm.');
    }

    const thoiGian = this.taoThoiGian(dto.thoiGian);

    this.kiemTraThoiGian(dto.loai, dto.thoiGian, lo);

    const diaDiem = dto.diaDiem.trim();

    if (!diaDiem) {
      throw new BadRequestException('Địa điểm không được để trống.');
    }

    const metadata = dto.metadata;

    this.kiemTraMetadata(metadata);

    const metadataJson: Prisma.InputJsonValue | null = metadata
      ? (metadata as Prisma.InputJsonValue)
      : null;

    const congKhai = dto.congKhai ?? false;

    const id = await this.prisma.$transaction(async (tx) => {
      const created = await tx.suKienTruyXuat.create({
        data: {
          loSanPhamId,
          loai: dto.loai,
          thoiGian,
          diaDiem,
          ...(metadataJson
            ? {
                metadata: metadataJson,
              }
            : {}),
          congKhai,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'SU_KIEN_TRUY_XUAT_TAO',
          thucThe: 'su_kien_truy_xuat',
          thucTheId: created.id,
          truoc: {
            tonTai: false,
          },
          sau: {
            loSanPhamId,
            loai: dto.loai,
            thoiGian: thoiGian.toISOString(),
            diaDiem,
            metadata: metadataJson,
            congKhai,
          },
          metadata: metadataAudit,
        },
      });

      return created.id;
    });

    return this.layChiTiet(id);
  }

  private taoThoiGian(value: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Thời gian sự kiện không hợp lệ.');
    }

    if (parsed.getTime() > Date.now()) {
      throw new BadRequestException('Thời gian sự kiện không được ở tương lai.');
    }

    return parsed;
  }

  private kiemTraThoiGian(loai: LoaiSuKienTruyXuat, thoiGianGoc: string, lo: LoNguon): void {
    const ngaySuKien = thoiGianGoc.slice(0, 10);

    const ngayTrong = this.dateOnly(lo.thuHoach.muaVu.ngayTrong);

    const ngayThuHoach = this.dateOnly(lo.thuHoach.ngayThuHoach);

    if (loai === LoaiSuKienTruyXuat.CANH_TAC) {
      if (ngaySuKien < ngayTrong || ngaySuKien > ngayThuHoach) {
        throw new BadRequestException(
          'Sự kiện CANH_TAC phải nằm từ ngày trồng đến hết ngày Thu hoạch.',
        );
      }

      return;
    }

    if (loai === LoaiSuKienTruyXuat.THU_HOACH) {
      if (ngaySuKien !== ngayThuHoach) {
        throw new BadRequestException('Sự kiện THU_HOACH phải đúng ngày Thu hoạch nguồn của Lô.');
      }

      return;
    }

    if (ngaySuKien < ngayThuHoach) {
      throw new BadRequestException(
        'Sự kiện sau Thu hoạch không được trước ngày Thu hoạch nguồn của Lô.',
      );
    }
  }

  private kiemTraMetadata(metadata: Record<string, unknown> | undefined): void {
    if (!metadata) {
      return;
    }

    const serialized = JSON.stringify(metadata);

    if (Buffer.byteLength(serialized, 'utf8') > 8 * 1024) {
      throw new BadRequestException('Metadata sự kiện tối đa 8 KiB.');
    }
  }

  private includeDayDu() {
    return {
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
    } as const;
  }

  private toDto(row: SuKienRow): SuKienTruyXuatDto {
    return {
      id: row.id,
      loSanPham: {
        id: row.loSanPham.id,
        maLo: row.loSanPham.maLo,
        maTruyXuat: row.loSanPham.maTruyXuat,
        cayTrong: row.loSanPham.thuHoach.muaVu.cayTrong,
        giong: row.loSanPham.thuHoach.muaVu.giong,
        trangTrai: row.loSanPham.thuHoach.muaVu.trangTrai.ten,
      },
      loai: row.loai,
      thoiGian: row.thoiGian.toISOString(),
      diaDiem: row.diaDiem,
      metadata: row.metadata ? (row.metadata as Record<string, unknown>) : null,
      congKhai: row.congKhai,
      createdAt: row.createdAt,
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
