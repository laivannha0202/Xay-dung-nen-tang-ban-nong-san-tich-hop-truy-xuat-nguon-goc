import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  KetQuaKiemDinhChatLuong,
  TrangThaiBanGhi,
  TrangThaiLoSanPham,
} from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import { TepTinService } from '../tep-tin/tep-tin.service';

import type {
  DanhSachKiemDinhChatLuongDto,
  KiemDinhChatLuongChiTietDto,
  KiemDinhChatLuongTomTatDto,
} from './dto/phan-hoi-kiem-dinh-chat-luong.dto';
import type { TaoKiemDinhChatLuongDto } from './dto/tao-kiem-dinh-chat-luong.dto';
import type { TruyVanKiemDinhChatLuongDto } from './dto/truy-van-kiem-dinh-chat-luong.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type KiemDinhRow = Prisma.KiemDinhChatLuongGetPayload<{
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
    nguoiKiemDinh: true;
    anh: {
      include: {
        tepTin: true;
      };
    };
  };
}>;

type LoNguon = Prisma.LoSanPhamGetPayload<{
  include: {
    thuHoach: true;
  };
}>;

@Injectable()
export class KiemDinhChatLuongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tepTinService: TepTinService,
  ) {}

  async layDanhSach(dto: TruyVanKiemDinhChatLuongDto): Promise<DanhSachKiemDinhChatLuongDto> {
    const where: Prisma.KiemDinhChatLuongWhereInput = {};

    if (dto.loSanPhamId) {
      where.loSanPhamId = dto.loSanPhamId;
    }

    if (dto.ketQua) {
      where.ketQua = dto.ketQua;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          loSanPham: {
            maLo: {
              contains: timKiem,
            },
          },
        },
        {
          phanHang: {
            contains: timKiem,
          },
        },
        {
          nguoiKiemDinh: {
            email: {
              contains: timKiem,
            },
          },
        },
        {
          nguoiKiemDinh: {
            hoTen: {
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
      this.prisma.kiemDinhChatLuong.findMany({
        where,
        include: this.includeDayDu(),
        orderBy: [
          {
            ngayKiemDinh: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.kiemDinhChatLuong.count({
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

  async layChiTiet(id: string): Promise<KiemDinhChatLuongChiTietDto> {
    const row = await this.prisma.kiemDinhChatLuong.findUnique({
      where: { id },
      include: this.includeDayDu(),
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy kiểm định chất lượng.');
    }

    const anh = await Promise.all(
      row.anh
        .sort((a, b) => a.thuTu - b.thuTu)
        .map(async (item) => ({
          tepTinId: item.tepTinId,
          tenGoc: item.tepTin.tenGoc,
          mimeType: item.tepTin.mimeType,
          thuTu: item.thuTu,
          url: await this.tepTinService.taoSignedUrlAnhNoiBo(item.tepTinId),
        })),
    );

    return {
      ...this.toTomTat(row),
      anh,
    };
  }

  async tao(
    tacNhanId: string,
    loSanPhamId: string,
    dto: TaoKiemDinhChatLuongDto,
    metadata: MetadataAudit,
  ): Promise<KiemDinhChatLuongChiTietDto> {
    const actor = await this.layActor(tacNhanId);

    const tepTinIds = dto.tepTinIds ?? [];

    await this.kiemTraQuyenAnh(tacNhanId, tepTinIds);

    const ngayKiemDinh = this.taoNgay(dto.ngayKiemDinh);

    const phanHang = this.chuanHoaNullable(dto.phanHang);

    const ghiChu = this.chuanHoaNullable(dto.ghiChu);

    if (dto.ketQua === KetQuaKiemDinhChatLuong.PASSED && !phanHang) {
      throw new BadRequestException('Kết quả PASSED bắt buộc có phân hạng.');
    }

    const id = await this.prisma.$transaction(async (tx) => {
      await this.khoaLo(tx, loSanPhamId);

      const lo = await this.layLoBatBuoc(tx, loSanPhamId);

      this.kiemTraTrangThaiChoKetQua(lo, dto.ketQua);

      this.kiemTraNgay(ngayKiemDinh, lo, dto.ketQua);

      if (tepTinIds.length > 0) {
        const soAnhHopLe = await tx.tepTin.count({
          where: {
            id: {
              in: tepTinIds,
            },
            trangThai: TrangThaiBanGhi.HOAT_DONG,
            mimeType: {
              startsWith: 'image/',
            },
          },
        });

        if (soAnhHopLe !== tepTinIds.length) {
          throw new BadRequestException(
            'Danh sách ảnh có file không còn hoạt động hoặc không phải ảnh.',
          );
        }
      }

      const trangThaiMoi = this.trangThaiTheoKetQua(dto.ketQua);

      const moi = await tx.kiemDinhChatLuong.create({
        data: {
          loSanPhamId,
          ngayKiemDinh,
          nguoiKiemDinhId: actor.id,
          ketQua: dto.ketQua,
          phanHang,
          ghiChu,
          ...(tepTinIds.length
            ? {
                anh: {
                  create: tepTinIds.map((tepTinId, index) => ({
                    tepTinId,
                    thuTu: index,
                  })),
                },
              }
            : {}),
        },
      });

      const loSau = await tx.loSanPham.update({
        where: {
          id: lo.id,
        },
        data: {
          trangThai: trangThaiMoi,
          phanHangChatLuong: dto.ketQua === KetQuaKiemDinhChatLuong.PASSED ? phanHang : null,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'KIEM_DINH_CHAT_LUONG_TAO',
          thucThe: 'kiem_dinh_chat_luong',
          thucTheId: moi.id,
          truoc: {
            tonTai: false,
          },
          sau: {
            loSanPhamId,
            ngayKiemDinh: this.dateOnly(ngayKiemDinh),
            nguoiKiemDinhId: actor.id,
            ketQua: dto.ketQua,
            phanHang,
            ghiChu,
            tepTinIds,
          },
          metadata,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'LO_SAN_PHAM_CAP_NHAT_CHAT_LUONG',
          thucThe: 'lo_san_pham',
          thucTheId: lo.id,
          truoc: this.snapshotLo(lo),
          sau: this.snapshotLo(loSau),
          metadata: {
            ...metadata,
            kiemDinhChatLuongId: moi.id,
            ketQua: dto.ketQua,
          },
        },
      });

      return moi.id;
    });

    return this.layChiTiet(id);
  }

  private async layActor(id: string): Promise<{
    id: string;
    email: string;
    hoTen: string;
  }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        hoTen: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy người kiểm định.');
    }

    return actor;
  }

  private async kiemTraQuyenAnh(nguoiDungId: string, tepTinIds: string[]): Promise<void> {
    for (const tepTinId of tepTinIds) {
      const metadata = await this.tepTinService.layMetadata(tepTinId, nguoiDungId);

      if (!metadata.mimeType.startsWith('image/')) {
        throw new BadRequestException('Kiểm định chỉ nhận ảnh JPEG/PNG/WebP.');
      }
    }
  }

  private async khoaLo(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
      }>
    >`
        SELECT id
        FROM lo_san_pham
        WHERE id = ${id}
        FOR UPDATE
      `;

    if (rows.length !== 1) {
      throw new BadRequestException('Lô sản phẩm không tồn tại.');
    }
  }

  private async layLoBatBuoc(tx: Prisma.TransactionClient, id: string): Promise<LoNguon> {
    const lo = await tx.loSanPham.findUnique({
      where: {
        id,
      },
      include: {
        thuHoach: true,
      },
    });

    if (!lo) {
      throw new BadRequestException('Lô sản phẩm không tồn tại.');
    }

    return lo;
  }

  private kiemTraTrangThaiChoKetQua(lo: LoNguon, ketQua: KetQuaKiemDinhChatLuong): void {
    const coTheKiemDinhThongThuong =
      lo.trangThai === TrangThaiLoSanPham.CHO_KIEM_DINH ||
      lo.trangThai === TrangThaiLoSanPham.TAM_GIU;

    if (ketQua === KetQuaKiemDinhChatLuong.RECALLED) {
      const coTheRecall =
        coTheKiemDinhThongThuong || lo.trangThai === TrangThaiLoSanPham.CO_THE_BAN;

      if (!coTheRecall) {
        throw new BadRequestException(
          'RECALLED chỉ áp dụng cho Lô CHO_KIEM_DINH, TAM_GIU hoặc CO_THE_BAN.',
        );
      }

      return;
    }

    if (!coTheKiemDinhThongThuong) {
      throw new BadRequestException(
        'Lô phải ở CHO_KIEM_DINH hoặc TAM_GIU để ghi kết quả kiểm định này.',
      );
    }
  }

  private kiemTraNgay(ngayKiemDinh: Date, lo: LoNguon, ketQua: KetQuaKiemDinhChatLuong): void {
    if (ngayKiemDinh.getTime() < lo.thuHoach.ngayThuHoach.getTime()) {
      throw new BadRequestException('Ngày kiểm định không được trước ngày Thu hoạch.');
    }

    const now = new Date();

    const homNayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (ngayKiemDinh.getTime() > homNayUtc.getTime()) {
      throw new BadRequestException('Ngày kiểm định không được ở tương lai.');
    }

    if (
      ketQua === KetQuaKiemDinhChatLuong.PASSED &&
      ngayKiemDinh.getTime() > lo.ngayHetHan.getTime()
    ) {
      throw new BadRequestException(
        'Lô đã quá ngày hết hạn tại thời điểm kiểm định nên không thể PASSED.',
      );
    }
  }

  private trangThaiTheoKetQua(ketQua: KetQuaKiemDinhChatLuong): TrangThaiLoSanPham {
    switch (ketQua) {
      case KetQuaKiemDinhChatLuong.PASSED:
        return TrangThaiLoSanPham.CO_THE_BAN;
      case KetQuaKiemDinhChatLuong.FAILED:
        return TrangThaiLoSanPham.KHONG_DAT;
      case KetQuaKiemDinhChatLuong.HOLD:
        return TrangThaiLoSanPham.TAM_GIU;
      case KetQuaKiemDinhChatLuong.RECALLED:
        return TrangThaiLoSanPham.THU_HOI;
    }
  }

  private taoNgay(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      throw new BadRequestException('Ngày kiểm định không hợp lệ.');
    }

    return date;
  }

  private chuanHoaNullable(value: string | undefined): string | null {
    const text = value?.trim();

    return text ? text : null;
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
      nguoiKiemDinh: true,
      anh: {
        include: {
          tepTin: true,
        },
      },
    } as const;
  }

  private toTomTat(row: KiemDinhRow): KiemDinhChatLuongTomTatDto {
    return {
      id: row.id,
      loSanPham: {
        id: row.loSanPham.id,
        maLo: row.loSanPham.maLo,
        trangThai: row.loSanPham.trangThai,
        cayTrong: row.loSanPham.thuHoach.muaVu.cayTrong,
        giong: row.loSanPham.thuHoach.muaVu.giong,
        trangTrai: row.loSanPham.thuHoach.muaVu.trangTrai.ten,
        ngayThuHoach: this.dateOnly(row.loSanPham.thuHoach.ngayThuHoach),
        ngayHetHan: this.dateOnly(row.loSanPham.ngayHetHan),
      },
      ngayKiemDinh: this.dateOnly(row.ngayKiemDinh),
      nguoiKiemDinh: {
        id: row.nguoiKiemDinh.id,
        email: row.nguoiKiemDinh.email,
        hoTen: row.nguoiKiemDinh.hoTen,
      },
      ketQua: row.ketQua,
      phanHang: row.phanHang,
      ghiChu: row.ghiChu,
      soAnh: row.anh.length,
      createdAt: row.createdAt,
    };
  }

  private snapshotLo(lo: {
    maLo: string;
    trangThai: TrangThaiLoSanPham;
    phanHangChatLuong: string | null;
    conLai: Prisma.Decimal;
  }) {
    return {
      maLo: lo.maLo,
      trangThai: lo.trangThai,
      phanHangChatLuong: lo.phanHangChatLuong,
      conLai: Number(lo.conLai),
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
