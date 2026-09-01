import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiXacMinhChungNhan } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { TepTinService } from '../tep-tin/tep-tin.service';

import type { CapNhatTrangTraiDto } from './dto/cap-nhat-trang-trai.dto';
import type {
  DanhSachTrangTraiDto,
  TrangTraiChiTietDto,
  TrangTraiCongKhaiChiTietDto,
  TrangTraiTomTatDto,
} from './dto/phan-hoi-trang-trai.dto';
import type { TaoTrangTraiDto } from './dto/tao-trang-trai.dto';
import type { TruyVanTrangTraiDto } from './dto/truy-van-trang-trai.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type TrangTraiDanhSachRow = Prisma.TrangTraiGetPayload<{
  include: {
    nhaCungCap: true;
    _count: {
      select: {
        anh: true;
      };
    };
  };
}>;

type TrangTraiChiTietRow = Prisma.TrangTraiGetPayload<{
  include: {
    nhaCungCap: true;
    anh: {
      include: {
        tepTin: true;
      };
    };
  };
}>;

type TrangTraiSnapshotRow = Prisma.TrangTraiGetPayload<{
  include: {
    anh: true;
  };
}>;

@Injectable()
export class TrangTraiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanTrangTraiDto): Promise<DanhSachTrangTraiDto> {
    const where: Prisma.TrangTraiWhereInput = {};

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    if (dto.nhaCungCapId) {
      where.nhaCungCapId = dto.nhaCungCapId;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          ma: {
            contains: timKiem,
          },
        },
        {
          ten: {
            contains: timKiem,
          },
        },
        {
          diaChi: {
            contains: timKiem,
          },
        },
        {
          nhaCungCap: {
            ten: {
              contains: timKiem,
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.trangTrai.findMany({
        where,
        include: {
          nhaCungCap: true,
          _count: {
            select: {
              anh: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.trangTrai.count({
        where,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.toTomTat(row)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<TrangTraiChiTietDto> {
    const row = await this.prisma.trangTrai.findUnique({
      where: { id },
      include: {
        nhaCungCap: true,
        anh: {
          where: {
            tepTin: {
              trangThai: TrangThaiBanGhi.HOAT_DONG,
              mimeType: {
                startsWith: 'image/',
              },
            },
          },
          include: {
            tepTin: true,
          },
          orderBy: {
            thuTu: 'asc',
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy trang trại.');
    }

    return this.toChiTiet(row);
  }

  async layCongKhai(id: string): Promise<TrangTraiCongKhaiChiTietDto> {
    const bayGio = new Date();
    const homNay = new Date(Date.UTC(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate()));

    const row = await this.prisma.trangTrai.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        nhaCungCap: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      },
      include: {
        nhaCungCap: true,
        anh: {
          where: {
            tepTin: {
              trangThai: TrangThaiBanGhi.HOAT_DONG,
              mimeType: {
                startsWith: 'image/',
              },
            },
          },
          include: {
            tepTin: true,
          },
          orderBy: {
            thuTu: 'asc',
          },
        },
        chungNhan: {
          where: {
            trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
            ngayHetHan: {
              gte: homNay,
            },
          },
          orderBy: [{ ngayHetHan: 'asc' }, { loai: 'asc' }],
        },
        muaVu: {
          orderBy: [{ ngayTrong: 'desc' }, { createdAt: 'desc' }],
          take: 12,
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy trang trại công khai.');
    }

    const chiTiet = await this.toChiTiet(row);
    const ngay = (value: Date) => value.toISOString().slice(0, 10);

    return {
      ...chiTiet,
      chungNhan: row.chungNhan.map((item) => ({
        id: item.id,
        loai: item.loai,
        ma: item.ma,
        donViCap: item.donViCap,
        ngayCap: ngay(item.ngayCap),
        ngayHetHan: ngay(item.ngayHetHan),
      })),
      muaVu: row.muaVu.map((item) => ({
        id: item.id,
        cayTrong: item.cayTrong,
        giong: item.giong,
        ngayTrong: ngay(item.ngayTrong),
        ngayDuKienThuHoach: ngay(item.ngayDuKienThuHoach),
        sanLuongDuKienKg: Number(item.sanLuongDuKienKg),
        trangThai: item.trangThai,
      })),
    };
  }

  async tao(
    tacNhanId: string,
    dto: TaoTrangTraiDto,
    metadata: MetadataAudit,
  ): Promise<TrangTraiChiTietDto> {
    const actor = await this.layActor(tacNhanId);

    this.kiemTraCapGps(dto.viDo, dto.kinhDo);

    await this.layNhaCungCapHoatDong(dto.nhaCungCapId);

    const anhIds = await this.kiemTraAnhIds(dto.anhIds ?? [], tacNhanId);

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const moi = await tx.trangTrai.create({
          data: {
            ma: dto.ma.trim(),
            ten: dto.ten.trim(),
            diaChi: dto.diaChi.trim(),
            viDo: dto.viDo,
            kinhDo: dto.kinhDo,
            dienTichHa: dto.dienTichHa,
            nhaCungCapId: dto.nhaCungCapId,
          },
        });

        if (anhIds.length) {
          await tx.trangTraiAnh.createMany({
            data: anhIds.map((tepTinId, index) => ({
              trangTraiId: moi.id,
              tepTinId,
              thuTu: index,
            })),
          });
        }

        const sau = await tx.trangTrai.findUniqueOrThrow({
          where: {
            id: moi.id,
          },
          include: {
            anh: true,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'TRANG_TRAI_TAO',
            thucThe: 'trang_trai',
            thucTheId: moi.id,
            truoc: {
              tonTai: false,
            },
            sau: this.snapshot(sau),
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
    dto: CapNhatTrangTraiDto,
    metadata: MetadataAudit,
  ): Promise<TrangTraiChiTietDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuocRaw(id)]);

    const data: Prisma.TrangTraiUncheckedUpdateInput = {};

    if (dto.ma !== undefined) {
      data.ma = dto.ma.trim();
    }

    if (dto.ten !== undefined) {
      data.ten = dto.ten.trim();
    }

    if (dto.diaChi !== undefined) {
      data.diaChi = dto.diaChi.trim();
    }

    if (dto.viDo !== undefined) {
      data.viDo = dto.viDo;
    }

    if (dto.kinhDo !== undefined) {
      data.kinhDo = dto.kinhDo;
    }

    if (dto.dienTichHa !== undefined) {
      data.dienTichHa = dto.dienTichHa;
    }

    if (dto.nhaCungCapId !== undefined) {
      await this.layNhaCungCapHoatDong(dto.nhaCungCapId);
      data.nhaCungCapId = dto.nhaCungCapId;
    }

    const viDoMoi =
      dto.viDo !== undefined ? dto.viDo : hienTai.viDo === null ? null : Number(hienTai.viDo);

    const kinhDoMoi =
      dto.kinhDo !== undefined
        ? dto.kinhDo
        : hienTai.kinhDo === null
          ? null
          : Number(hienTai.kinhDo);

    this.kiemTraCapGps(viDoMoi, kinhDoMoi);

    const anhIds =
      dto.anhIds !== undefined ? await this.kiemTraAnhIds(dto.anhIds, tacNhanId) : undefined;

    if (Object.keys(data).length === 0 && anhIds === undefined) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.trangTrai.update({
          where: { id },
          data,
        });

        if (anhIds !== undefined) {
          await tx.trangTraiAnh.deleteMany({
            where: {
              trangTraiId: id,
            },
          });

          if (anhIds.length) {
            await tx.trangTraiAnh.createMany({
              data: anhIds.map((tepTinId, index) => ({
                trangTraiId: id,
                tepTinId,
                thuTu: index,
              })),
            });
          }
        }

        const sau = await tx.trangTrai.findUniqueOrThrow({
          where: { id },
          include: {
            anh: true,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'TRANG_TRAI_SUA',
            thucThe: 'trang_trai',
            thucTheId: id,
            truoc: this.snapshot(hienTai),
            sau: this.snapshot(sau),
            metadata,
          },
        });
      });

      return this.layChiTiet(id);
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async doiTrangThai(
    tacNhanId: string,
    id: string,
    trangThai: TrangThaiBanGhi,
    metadata: MetadataAudit,
  ): Promise<TrangTraiChiTietDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuocRaw(id)]);

    if (hienTai.trangThai === trangThai) {
      return this.layChiTiet(id);
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.trangTrai.update({
        where: { id },
        data: {
          trangThai,
        },
        include: {
          anh: true,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'TRANG_TRAI_DOI_TRANG_THAI',
          thucThe: 'trang_trai',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTiet(id);
  }

  private async layActor(id: string): Promise<{
    id: string;
    email: string;
  }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
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

  private async layNhaCungCapHoatDong(id: string): Promise<void> {
    const supplier = await this.prisma.nhaCungCap.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
      },
    });

    if (!supplier) {
      throw new BadRequestException('Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động.');
    }
  }

  private async kiemTraAnhIds(ids: string[], tacNhanId: string): Promise<string[]> {
    const unique = [...new Set(ids)];

    if (unique.length !== ids.length) {
      throw new BadRequestException('Danh sách ảnh không được trùng lặp.');
    }

    if (unique.length > 10) {
      throw new BadRequestException('Mỗi trang trại tối đa 10 ảnh.');
    }

    const metadata = await Promise.all(
      unique.map((id) => this.tepTinService.layMetadata(id, tacNhanId)),
    );

    if (metadata.some((item) => !item.mimeType.startsWith('image/'))) {
      throw new BadRequestException('Trang trại chỉ được gắn tệp ảnh.');
    }

    return unique;
  }

  private kiemTraCapGps(viDo: number | null | undefined, kinhDo: number | null | undefined): void {
    const coViDo = viDo !== null && viDo !== undefined;
    const coKinhDo = kinhDo !== null && kinhDo !== undefined;

    if (coViDo !== coKinhDo) {
      throw new BadRequestException('GPS phải có đồng thời vĩ độ và kinh độ.');
    }
  }

  private async layBatBuocRaw(id: string): Promise<TrangTraiSnapshotRow> {
    const item = await this.prisma.trangTrai.findUnique({
      where: { id },
      include: {
        anh: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy trang trại.');
    }

    return item;
  }

  private toTomTat(row: TrangTraiDanhSachRow): TrangTraiTomTatDto {
    return {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      diaChi: row.diaChi,
      viDo: row.viDo === null ? null : Number(row.viDo),
      kinhDo: row.kinhDo === null ? null : Number(row.kinhDo),
      dienTichHa: row.dienTichHa === null ? null : Number(row.dienTichHa),
      nhaCungCap: {
        id: row.nhaCungCap.id,
        ma: row.nhaCungCap.ma,
        ten: row.nhaCungCap.ten,
      },
      soAnh: row._count.anh,
      trangThai: row.trangThai,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async toChiTiet(row: TrangTraiChiTietRow): Promise<TrangTraiChiTietDto> {
    const anh = await Promise.all(
      row.anh.map(async (item) => ({
        tepTinId: item.tepTinId,
        tenGoc: item.tepTin.tenGoc,
        mimeType: item.tepTin.mimeType,
        thuTu: item.thuTu,
        url: await this.tepTinService.taoSignedUrlAnhNoiBo(item.tepTinId),
      })),
    );

    return {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      diaChi: row.diaChi,
      viDo: row.viDo === null ? null : Number(row.viDo),
      kinhDo: row.kinhDo === null ? null : Number(row.kinhDo),
      dienTichHa: row.dienTichHa === null ? null : Number(row.dienTichHa),
      nhaCungCap: {
        id: row.nhaCungCap.id,
        ma: row.nhaCungCap.ma,
        ten: row.nhaCungCap.ten,
      },
      soAnh: row.anh.length,
      anh,
      trangThai: row.trangThai,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(item: TrangTraiSnapshotRow) {
    return {
      ma: item.ma,
      ten: item.ten,
      diaChi: item.diaChi,
      viDo: item.viDo === null ? null : Number(item.viDo),
      kinhDo: item.kinhDo === null ? null : Number(item.kinhDo),
      dienTichHa: item.dienTichHa === null ? null : Number(item.dienTichHa),
      nhaCungCapId: item.nhaCungCapId,
      anhIds: item.anh.sort((a, b) => a.thuTu - b.thuTu).map((anh) => anh.tepTinId),
      trangThai: item.trangThai,
    };
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã trang trại đã tồn tại.');
    }
  }
}
