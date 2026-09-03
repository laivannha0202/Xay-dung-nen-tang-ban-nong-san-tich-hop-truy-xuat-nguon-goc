import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiDonHang } from '../../generated/prisma/client';
import { SoDuNhaCungCapService } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.service';

import type {
  DanhSachDoiSoatNhaCungCapDto,
  DoiSoatNhaCungCapDto,
} from './dto/phan-hoi-doi-soat.dto';
import type { TaoDoiSoatDto } from './dto/tao-doi-soat.dto';
import type { TruyVanDoiSoatDto } from './dto/truy-van-doi-soat.dto';

const DOI_SOAT_INCLUDE = {
  nhaCungCap: {
    select: {
      id: true,
      ma: true,
      ten: true,
    },
  },
} satisfies Prisma.DoiSoatNhaCungCapInclude;

type DoiSoatDayDu = Prisma.DoiSoatNhaCungCapGetPayload<{
  include: typeof DOI_SOAT_INCLUDE;
}>;

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type QuyTacRutGon = {
  danhMucSanPhamId: string;
  tyLe: Prisma.Decimal;
  hieuLucTu: Date;
  createdAt: Date;
};

@Injectable()
export class DoiSoatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly soDuNhaCungCap: SoDuNhaCungCapService,
  ) {}

  async layDanhSach(query: TruyVanDoiSoatDto): Promise<DanhSachDoiSoatNhaCungCapDto> {
    const where: Prisma.DoiSoatNhaCungCapWhereInput = query.nhaCungCapId
      ? { nhaCungCapId: query.nhaCungCapId }
      : {};
    const skip = (query.trang - 1) * query.gioiHan;

    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.doiSoatNhaCungCap.count({ where }),
      this.prisma.doiSoatNhaCungCap.findMany({
        where,
        include: DOI_SOAT_INCLUDE,
        orderBy: [{ ketThucLuc: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.mapDoiSoat(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<DoiSoatNhaCungCapDto> {
    const row = await this.prisma.doiSoatNhaCungCap.findUnique({
      where: { id },
      include: DOI_SOAT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy kỳ đối soát.');
    }
    return this.mapDoiSoat(row);
  }

  async tao(
    tacNhanId: string,
    dto: TaoDoiSoatDto,
    metadata: MetadataAudit,
  ): Promise<DoiSoatNhaCungCapDto> {
    const actor = await this.layTacNhan(tacNhanId);
    const input = this.chuanHoaInput(dto);

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM nha_cung_cap
        WHERE id = ${input.nhaCungCapId}
        FOR UPDATE
      `);
      if (locked.length === 0) {
        throw new NotFoundException('Không tìm thấy nhà cung cấp.');
      }

      const overlap = await tx.doiSoatNhaCungCap.findFirst({
        where: {
          nhaCungCapId: input.nhaCungCapId,
          batDauLuc: { lt: input.ketThucLuc },
          ketThucLuc: { gt: input.batDauLuc },
        },
        select: { id: true },
      });
      if (overlap) {
        throw new BadRequestException(
          'Khoảng thời gian đối soát bị chồng lấn với kỳ đã tồn tại của nhà cung cấp.',
        );
      }

      const supplierOrders = await tx.donHangNhaCungCap.findMany({
        where: {
          nhaCungCapId: input.nhaCungCapId,
          trangThai: TrangThaiDonHang.HOAN_THANH,
          updatedAt: {
            gte: input.batDauLuc,
            lt: input.ketThucLuc,
          },
        },
        select: {
          id: true,
          maDon: true,
          tamTinh: true,
          createdAt: true,
          muc: {
            select: {
              soLuong: true,
              donGiaSnapshot: true,
              danhMucSanPhamIdSnapshot: true,
            },
          },
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      });
      if (supplierOrders.length === 0) {
        throw new BadRequestException('Kỳ đối soát không có supplier order HOAN_THANH.');
      }

      const categoryIds = [
        ...new Set(
          supplierOrders.flatMap((order) => order.muc.map((item) => item.danhMucSanPhamIdSnapshot)),
        ),
      ];
      const rules = await tx.quyTacHoaHong.findMany({
        where: {
          nhaCungCapId: input.nhaCungCapId,
          danhMucSanPhamId: { in: categoryIds },
          hieuLucTu: { lt: input.ketThucLuc },
        },
        select: {
          danhMucSanPhamId: true,
          tyLe: true,
          hieuLucTu: true,
          createdAt: true,
        },
        orderBy: [{ hieuLucTu: 'asc' }, { createdAt: 'asc' }],
      });

      const doanhThuCents = supplierOrders.reduce(
        (sum, order) => sum + this.toCents(Number(order.tamTinh)),
        0,
      );
      let hoaHongCents = 0;

      for (const order of supplierOrders) {
        const itemRevenueCents = order.muc.reduce(
          (sum, item) => sum + this.toCents(Number(item.donGiaSnapshot) * Number(item.soLuong)),
          0,
        );
        if (itemRevenueCents !== this.toCents(Number(order.tamTinh))) {
          throw new BadRequestException(
            `Supplier order ${order.maDon} có snapshot line total không khớp tạm tính.`,
          );
        }

        for (const item of order.muc) {
          const rule = this.layQuyTac(rules, item.danhMucSanPhamIdSnapshot, order.createdAt);
          if (!rule) {
            throw new BadRequestException(
              `Thiếu commission rule áp dụng cho category ${item.danhMucSanPhamIdSnapshot} tại thời điểm order ${order.maDon}.`,
            );
          }
          const lineCents = this.toCents(Number(item.donGiaSnapshot) * Number(item.soLuong));
          hoaHongCents += Math.round((lineCents * Number(rule.tyLe)) / 100);
        }
      }

      const hoanTienCents = this.toCents(input.hoanTien);
      const dieuChinhCents = this.toCents(input.dieuChinh);
      if (hoanTienCents > doanhThuCents) {
        throw new BadRequestException('Refund quy thuộc supplier không được vượt doanh thu kỳ.');
      }

      const phaiTraCents = doanhThuCents - hoaHongCents - hoanTienCents - dieuChinhCents;
      if (phaiTraCents < 0) {
        throw new BadRequestException(
          'Payable âm. Hãy kiểm tra refund/adjustment trước khi tạo kỳ đối soát.',
        );
      }

      const created = await tx.doiSoatNhaCungCap.create({
        data: {
          nhaCungCapId: input.nhaCungCapId,
          batDauLuc: input.batDauLuc,
          ketThucLuc: input.ketThucLuc,
          doanhThu: this.fromCents(doanhThuCents),
          hoaHong: this.fromCents(hoaHongCents),
          hoanTien: this.fromCents(hoanTienCents),
          dieuChinh: this.fromCents(dieuChinhCents),
          phaiTra: this.fromCents(phaiTraCents),
        },
        include: DOI_SOAT_INCLUDE,
      });

      await this.soDuNhaCungCap.congKhaDungTrongGiaoDich(
        tx,
        input.nhaCungCapId,
        this.fromCents(phaiTraCents),
      );

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'DOI_SOAT_TAO',
          thucThe: 'settlement',
          thucTheId: created.id,
          sau: this.snapshot(created),
          metadata,
        },
      });

      return this.mapDoiSoat(created);
    });
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

  private chuanHoaInput(dto: TaoDoiSoatDto): {
    nhaCungCapId: string;
    batDauLuc: Date;
    ketThucLuc: Date;
    hoanTien: number;
    dieuChinh: number;
  } {
    const batDauLuc = new Date(dto.batDauLuc);
    const ketThucLuc = new Date(dto.ketThucLuc);
    if (
      Number.isNaN(batDauLuc.getTime()) ||
      Number.isNaN(ketThucLuc.getTime()) ||
      batDauLuc.getTime() >= ketThucLuc.getTime()
    ) {
      throw new BadRequestException('Khoảng thời gian đối soát không hợp lệ.');
    }

    const hoanTien = this.money(dto.hoanTien ?? 0, 'Refund');
    if (hoanTien < 0) {
      throw new BadRequestException('Refund phải >= 0.');
    }
    const dieuChinh = this.money(dto.dieuChinh ?? 0, 'Điều chỉnh');

    return {
      nhaCungCapId: dto.nhaCungCapId,
      batDauLuc,
      ketThucLuc,
      hoanTien,
      dieuChinh,
    };
  }

  private layQuyTac(
    rules: QuyTacRutGon[],
    danhMucSanPhamId: string,
    thoiDiem: Date,
  ): QuyTacRutGon | null {
    let result: QuyTacRutGon | null = null;
    for (const rule of rules) {
      if (
        rule.danhMucSanPhamId === danhMucSanPhamId &&
        rule.hieuLucTu.getTime() <= thoiDiem.getTime()
      ) {
        result = rule;
      }
    }
    return result;
  }

  private money(value: number, label: string): number {
    if (!Number.isFinite(value)) {
      throw new BadRequestException(`${label} không hợp lệ.`);
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
      throw new BadRequestException(`${label} chỉ hỗ trợ tối đa 2 chữ số thập phân.`);
    }
    return this.fromCents(this.toCents(value));
  }

  private toCents(value: number): number {
    return Math.round(value * 100);
  }

  private fromCents(value: number): number {
    return value / 100;
  }

  private mapDoiSoat(row: DoiSoatDayDu): DoiSoatNhaCungCapDto {
    return {
      id: row.id,
      nhaCungCapId: row.nhaCungCapId,
      maNhaCungCap: row.nhaCungCap.ma,
      tenNhaCungCap: row.nhaCungCap.ten,
      batDauLuc: row.batDauLuc.toISOString(),
      ketThucLuc: row.ketThucLuc.toISOString(),
      doanhThu: Number(row.doanhThu),
      hoaHong: Number(row.hoaHong),
      hoanTien: Number(row.hoanTien),
      dieuChinh: Number(row.dieuChinh),
      phaiTra: Number(row.phaiTra),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(row: DoiSoatDayDu): {
    nhaCungCapId: string;
    batDauLuc: string;
    ketThucLuc: string;
    doanhThu: number;
    hoaHong: number;
    hoanTien: number;
    dieuChinh: number;
    phaiTra: number;
  } {
    return {
      nhaCungCapId: row.nhaCungCapId,
      batDauLuc: row.batDauLuc.toISOString(),
      ketThucLuc: row.ketThucLuc.toISOString(),
      doanhThu: Number(row.doanhThu),
      hoaHong: Number(row.hoaHong),
      hoanTien: Number(row.hoanTien),
      dieuChinh: Number(row.dieuChinh),
      phaiTra: Number(row.phaiTra),
    };
  }
}
