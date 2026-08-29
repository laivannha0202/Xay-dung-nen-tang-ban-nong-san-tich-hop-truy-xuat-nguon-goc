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

import type { CapNhatChungNhanDto } from './dto/cap-nhat-chung-nhan.dto';
import type {
  ChungNhanChiTietDto,
  ChungNhanTomTatDto,
  DanhSachChungNhanDto,
} from './dto/phan-hoi-chung-nhan.dto';
import type { TaoChungNhanDto } from './dto/tao-chung-nhan.dto';
import type { TruyVanChungNhanDto } from './dto/truy-van-chung-nhan.dto';
import type { XacMinhChungNhanDto } from './dto/xac-minh-chung-nhan.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type ChungNhanListRow = Prisma.ChungNhanGetPayload<{
  include: {
    trangTrai: true;
  };
}>;

type ChungNhanDetailRow = Prisma.ChungNhanGetPayload<{
  include: {
    trangTrai: true;
    tepTin: true;
  };
}>;

const MIME_CHUNG_NHAN = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class ChungNhanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanChungNhanDto): Promise<DanhSachChungNhanDto> {
    const where: Prisma.ChungNhanWhereInput = {};

    if (dto.trangTraiId) {
      where.trangTraiId = dto.trangTraiId;
    }

    if (dto.trangThaiXacMinh) {
      where.trangThaiXacMinh = dto.trangThaiXacMinh;
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
          loai: {
            contains: timKiem,
          },
        },
        {
          donViCap: {
            contains: timKiem,
          },
        },
        {
          trangTrai: {
            ten: {
              contains: timKiem,
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.chungNhan.findMany({
        where,
        include: {
          trangTrai: true,
        },
        orderBy: [
          {
            ngayHetHan: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.chungNhan.count({
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

  async layChiTiet(id: string): Promise<ChungNhanChiTietDto> {
    const row = await this.prisma.chungNhan.findUnique({
      where: { id },
      include: {
        trangTrai: true,
        tepTin: true,
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy chứng nhận.');
    }

    return this.toChiTiet(row);
  }

  async tao(
    tacNhanId: string,
    dto: TaoChungNhanDto,
    metadata: MetadataAudit,
  ): Promise<ChungNhanChiTietDto> {
    const actor = await this.layActor(tacNhanId);

    await this.layTrangTraiHoatDong(dto.trangTraiId);
    await this.kiemTraTepTin(dto.tepTinId, tacNhanId);

    const ngayCap = this.taoNgay(dto.ngayCap);
    const ngayHetHan = this.taoNgay(dto.ngayHetHan);

    this.kiemTraKhoangNgay(ngayCap, ngayHetHan);

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const moi = await tx.chungNhan.create({
          data: {
            trangTraiId: dto.trangTraiId,
            loai: dto.loai.trim(),
            ma: dto.ma.trim(),
            donViCap: dto.donViCap.trim(),
            ngayCap,
            ngayHetHan,
            tepTinId: dto.tepTinId,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'CHUNG_NHAN_TAO',
            thucThe: 'chung_nhan',
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
    dto: CapNhatChungNhanDto,
    metadata: MetadataAudit,
  ): Promise<ChungNhanChiTietDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layRaw(id)]);

    const data: Prisma.ChungNhanUncheckedUpdateInput = {};

    if (dto.trangTraiId !== undefined) {
      await this.layTrangTraiHoatDong(dto.trangTraiId);
      data.trangTraiId = dto.trangTraiId;
    }

    if (dto.loai !== undefined) {
      data.loai = dto.loai.trim();
    }

    if (dto.ma !== undefined) {
      data.ma = dto.ma.trim();
    }

    if (dto.donViCap !== undefined) {
      data.donViCap = dto.donViCap.trim();
    }

    const ngayCap = dto.ngayCap !== undefined ? this.taoNgay(dto.ngayCap) : hienTai.ngayCap;

    const ngayHetHan =
      dto.ngayHetHan !== undefined ? this.taoNgay(dto.ngayHetHan) : hienTai.ngayHetHan;

    this.kiemTraKhoangNgay(ngayCap, ngayHetHan);

    if (dto.ngayCap !== undefined) {
      data.ngayCap = ngayCap;
    }

    if (dto.ngayHetHan !== undefined) {
      data.ngayHetHan = ngayHetHan;
    }

    if (dto.tepTinId !== undefined) {
      await this.kiemTraTepTin(dto.tepTinId, tacNhanId);
      data.tepTinId = dto.tepTinId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    data.trangThaiXacMinh = TrangThaiXacMinhChungNhan.CHO_XAC_MINH;
    data.lyDoTuChoi = null;
    data.xacMinhLuc = null;
    data.canhBao30NgayLuc = null;
    data.canhBao7NgayLuc = null;
    data.canhBaoHetHanLuc = null;

    try {
      await this.prisma.$transaction(async (tx) => {
        const sau = await tx.chungNhan.update({
          where: { id },
          data,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'CHUNG_NHAN_SUA',
            thucThe: 'chung_nhan',
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

  async xacMinh(
    tacNhanId: string,
    id: string,
    dto: XacMinhChungNhanDto,
    metadata: MetadataAudit,
  ): Promise<ChungNhanChiTietDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layRaw(id)]);

    if (dto.trangThaiXacMinh === TrangThaiXacMinhChungNhan.CHO_XAC_MINH) {
      throw new BadRequestException('Endpoint xác minh chỉ nhận DA_XAC_MINH hoặc TU_CHOI.');
    }

    const lyDo = dto.lyDoTuChoi?.trim();

    if (dto.trangThaiXacMinh === TrangThaiXacMinhChungNhan.TU_CHOI && !lyDo) {
      throw new BadRequestException('Phải nhập lý do khi từ chối chứng nhận.');
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.chungNhan.update({
        where: { id },
        data: {
          trangThaiXacMinh: dto.trangThaiXacMinh,
          lyDoTuChoi: dto.trangThaiXacMinh === TrangThaiXacMinhChungNhan.TU_CHOI ? lyDo : null,
          xacMinhLuc: new Date(),
          canhBao30NgayLuc: null,
          canhBao7NgayLuc: null,
          canhBaoHetHanLuc: null,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong:
            dto.trangThaiXacMinh === TrangThaiXacMinhChungNhan.DA_XAC_MINH
              ? 'CHUNG_NHAN_XAC_MINH'
              : 'CHUNG_NHAN_TU_CHOI',
          thucThe: 'chung_nhan',
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

  private async layTrangTraiHoatDong(id: string): Promise<void> {
    const farm = await this.prisma.trangTrai.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
      },
    });

    if (!farm) {
      throw new BadRequestException('Trang trại không tồn tại hoặc đã ngừng hoạt động.');
    }
  }

  private async kiemTraTepTin(id: string, tacNhanId: string): Promise<void> {
    const tep = await this.tepTinService.layMetadata(id, tacNhanId);

    if (!MIME_CHUNG_NHAN.has(tep.mimeType)) {
      throw new BadRequestException('File chứng nhận chỉ hỗ trợ PDF/JPEG/PNG/WebP.');
    }
  }

  private taoNgay(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      throw new BadRequestException('Ngày chứng nhận không hợp lệ.');
    }

    return date;
  }

  private kiemTraKhoangNgay(ngayCap: Date, ngayHetHan: Date): void {
    if (ngayHetHan.getTime() <= ngayCap.getTime()) {
      throw new BadRequestException('Ngày hết hạn phải sau ngày cấp.');
    }
  }

  private async layRaw(id: string) {
    const item = await this.prisma.chungNhan.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy chứng nhận.');
    }

    return item;
  }

  private toTomTat(row: ChungNhanListRow): ChungNhanTomTatDto {
    return {
      id: row.id,
      loai: row.loai,
      ma: row.ma,
      donViCap: row.donViCap,
      ngayCap: this.dateOnly(row.ngayCap),
      ngayHetHan: this.dateOnly(row.ngayHetHan),
      trangTrai: {
        id: row.trangTrai.id,
        ma: row.trangTrai.ma,
        ten: row.trangTrai.ten,
      },
      trangThaiXacMinh: row.trangThaiXacMinh,
      lyDoTuChoi: row.lyDoTuChoi,
      xacMinhLuc: row.xacMinhLuc,
      canhBao30NgayLuc: row.canhBao30NgayLuc,
      canhBao7NgayLuc: row.canhBao7NgayLuc,
      canhBaoHetHanLuc: row.canhBaoHetHanLuc,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async toChiTiet(row: ChungNhanDetailRow): Promise<ChungNhanChiTietDto> {
    return {
      ...this.toTomTat(row),
      tepTin: {
        id: row.tepTin.id,
        tenGoc: row.tepTin.tenGoc,
        mimeType: row.tepTin.mimeType,
        url: await this.tepTinService.taoSignedUrlNoiBo(row.tepTin.id, 'xem'),
      },
    };
  }

  private snapshot(item: {
    trangTraiId: string;
    loai: string;
    ma: string;
    donViCap: string;
    ngayCap: Date;
    ngayHetHan: Date;
    tepTinId: string;
    trangThaiXacMinh: TrangThaiXacMinhChungNhan;
    lyDoTuChoi: string | null;
    xacMinhLuc: Date | null;
    canhBao30NgayLuc: Date | null;
    canhBao7NgayLuc: Date | null;
    canhBaoHetHanLuc: Date | null;
  }) {
    return {
      trangTraiId: item.trangTraiId,
      loai: item.loai,
      ma: item.ma,
      donViCap: item.donViCap,
      ngayCap: this.dateOnly(item.ngayCap),
      ngayHetHan: this.dateOnly(item.ngayHetHan),
      tepTinId: item.tepTinId,
      trangThaiXacMinh: item.trangThaiXacMinh,
      lyDoTuChoi: item.lyDoTuChoi,
      xacMinhLuc: item.xacMinhLuc,
      canhBao30NgayLuc: item.canhBao30NgayLuc,
      canhBao7NgayLuc: item.canhBao7NgayLuc,
      canhBaoHetHanLuc: item.canhBaoHetHanLuc,
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã chứng nhận đã tồn tại.');
    }
  }
}
