import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  TrangThaiDoiSoatNhaCungCap,
  TrangThaiDonHang,
  TrangThaiKhieuNai,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
} from '../../generated/prisma/client';
import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import { ChiTraNhaCungCapService } from '../chi-tra-nha-cung-cap/chi-tra-nha-cung-cap.service';
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
    private readonly cauHinhHeThong: CauHinhHeThongService,
    private readonly chiTraNhaCungCap: ChiTraNhaCungCapService,
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
    const thoiHanKhieuNaiNgay = await this.cauHinhHeThong.layThoiHanKhieuNaiNgay();

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
          doiSoatId: null,
          vanChuyen: {
            some: {
              suKien: {
                some: {
                  trangThai: TrangThaiVanChuyen.DELIVERED,
                  thoiGian: {
                    gte: input.batDauLuc,
                    lt: input.ketThucLuc,
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          maDon: true,
          tamTinh: true,
          createdAt: true,
          vanChuyen: {
            select: {
              suKien: {
                where: {
                  trangThai: TrangThaiVanChuyen.DELIVERED,
                  thoiGian: {
                    gte: input.batDauLuc,
                    lt: input.ketThucLuc,
                  },
                },
                select: { thoiGian: true },
              },
            },
          },
          muc: {
            select: {
              soLuong: true,
              donGiaSnapshot: true,
              danhMucSanPhamIdSnapshot: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      if (supplierOrders.length === 0) {
        throw new BadRequestException(
          'Kỳ đối soát không có supplier order HOAN_THANH với DELIVERED trong kỳ và chưa được đối soát.',
        );
      }

      const deliveredTimes = supplierOrders.map((order) => {
        const times = order.vanChuyen.flatMap((shipment) =>
          shipment.suKien.map((event) => event.thoiGian.getTime()),
        );
        if (times.length === 0) {
          throw new BadRequestException(`Supplier order ${order.maDon} thiếu DELIVERED trong kỳ.`);
        }
        return Math.max(...times);
      });

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

      const duDieuKienLuc = new Date(
        Math.max(...deliveredTimes) + thoiHanKhieuNaiNgay * 24 * 60 * 60 * 1000,
      );

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
          trangThai: TrangThaiDoiSoatNhaCungCap.DANG_CHO,
          duDieuKienLuc,
        },
        include: DOI_SOAT_INCLUDE,
      });

      const linked = await tx.donHangNhaCungCap.updateMany({
        where: {
          id: { in: supplierOrders.map((order) => order.id) },
          doiSoatId: null,
        },
        data: { doiSoatId: created.id },
      });
      if (linked.count !== supplierOrders.length) {
        throw new ConflictException(
          'Có supplier order vừa được đối soát bởi thao tác khác. Transaction đã rollback.',
        );
      }

      await this.soDuNhaCungCap.congDangChoTrongGiaoDich(
        tx,
        input.nhaCungCapId,
        this.fromCents(phaiTraCents),
      );

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'DOI_SOAT_TAO_DANG_CHO',
          thucThe: 'settlement',
          thucTheId: created.id,
          sau: this.snapshot(created),
          metadata,
        },
      });

      return this.mapDoiSoat(created);
    });
  }

  async giaiPhong(
    tacNhanId: string,
    id: string,
    metadata: MetadataAudit,
  ): Promise<DoiSoatNhaCungCapDto> {
    const actor = await this.layTacNhan(tacNhanId);

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM settlement WHERE id = ${id} FOR UPDATE
      `);
      if (locked.length !== 1) throw new NotFoundException('Không tìm thấy kỳ đối soát.');

      const current = await tx.doiSoatNhaCungCap.findUnique({
        where: { id },
        include: DOI_SOAT_INCLUDE,
      });
      if (!current) throw new NotFoundException('Không tìm thấy kỳ đối soát.');
      if (current.trangThai === TrangThaiDoiSoatNhaCungCap.KHA_DUNG) {
        return this.mapDoiSoat(current);
      }

      const now = new Date();
      if (current.duDieuKienLuc.getTime() > now.getTime()) {
        throw new ConflictException(
          `Settlement còn trong thời gian chờ đến ${current.duDieuKienLuc.toISOString()}.`,
        );
      }

      const [khongConHoanThanh, khieuNaiDangMo, refundDangCho] = await Promise.all([
        tx.donHangNhaCungCap.count({
          where: { doiSoatId: id, trangThai: { not: TrangThaiDonHang.HOAN_THANH } },
        }),
        tx.khieuNai.count({
          where: {
            trangThai: {
              in: [
                TrangThaiKhieuNai.MOI,
                TrangThaiKhieuNai.DANG_XU_LY,
                TrangThaiKhieuNai.CHAP_NHAN,
              ],
            },
            mucDonHang: { donHangNhaCungCap: { doiSoatId: id } },
          },
        }),
        tx.giaoDichThanhToan.count({
          where: {
            maGiaoDich: { startsWith: 'REFUND-' },
            trangThai: TrangThaiThanhToan.CREATED,
            thanhToan: {
              donHang: { donNhaCungCap: { some: { doiSoatId: id } } },
            },
          },
        }),
      ]);

      if (khongConHoanThanh > 0) {
        throw new ConflictException(
          'Có supplier order không còn HOAN_THANH; chưa thể giải phóng settlement.',
        );
      }
      if (khieuNaiDangMo > 0) {
        throw new ConflictException(
          'Settlement đang có khiếu nại chưa xử lý xong; tiền tiếp tục DANG_CHO.',
        );
      }
      if (refundDangCho > 0) {
        throw new ConflictException(
          'Settlement đang có refund chưa xác định kết quả; tiền tiếp tục DANG_CHO.',
        );
      }

      await this.soDuNhaCungCap.chuyenDangChoSangKhaDungTrongGiaoDich(
        tx,
        current.nhaCungCapId,
        Number(current.phaiTra),
      );

      const _payout = await this.chiTraNhaCungCap.taoTuDoiSoat(
        actor.id,
        current.id,
        metadata,
      );

      const updated = await tx.doiSoatNhaCungCap.update({
        where: { id },
        data: {
          trangThai: TrangThaiDoiSoatNhaCungCap.KHA_DUNG,
          giaiPhongLuc: now,
        },
        include: DOI_SOAT_INCLUDE,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'DOI_SOAT_GIAI_PHONG_KHA_DUNG',
          thucThe: 'settlement',
          thucTheId: id,
          truoc: this.snapshot(current),
          sau: this.snapshot(updated),
          metadata,
        },
      });

      return this.mapDoiSoat(updated);
    });
  }


  async dongBangTienKhiNhapNhay(
    doiSoatId: string,
    soTien: number,
    khieuNaiId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM settlement WHERE id = ${doiSoatId} FOR UPDATE`,
      );
      if (locked.length !== 1) return;

      const current = await tx.doiSoatNhaCungCap.findUnique({
        where: { id: doiSoatId },
        select: { id: true, nhaCungCapId: true, trangThai: true, phaiTra: true },
      });
      if (!current || current.trangThai !== TrangThaiDoiSoatNhaCungCap.KHA_DUNG) return;

      const phaiTraCents = Math.round(Number(current.phaiTra) * 100);
      let freezeCents = Math.round(soTien * 100);
      if (freezeCents > phaiTraCents) freezeCents = phaiTraCents;

      const balanceLocked = await tx.$queryRaw<Array<{ supplier_id: string; khaDung: number }>>(
        Prisma.sql`
          SELECT supplier_id, available AS khaDung
          FROM seller_balance
          WHERE supplier_id = ${current.nhaCungCapId}
          FOR UPDATE
        `,
      );
      if (balanceLocked.length !== 1) {
        throw new NotFoundException('Không tìm thấy số dư nhà cung cấp.');
      }
      const balanceRow = balanceLocked[0]!;
      const khaDung = Number(balanceRow.khaDung);
      if (khaDung * 100 < freezeCents) {
        throw new BadRequestException('Số dư khả dụng không đủ để đóng băng tiền khiếu nại.');
      }

      if (khieuNaiId) {
        await tx.khieuNai.update({
          where: { id: khieuNaiId },
          data: { soTienDongBang: freezeCents / 100 },
        });
      }

      await tx.soDuNhaCungCap.update({
        where: { nhaCungCapId: current.nhaCungCapId },
        data: {
          khaDung: { decrement: freezeCents / 100 },
          tamGiu: { increment: freezeCents / 100 },
        },
      });
    });
  }

  async moDongBangTienKhiNhapNhay(
    doiSoatId: string,
    khieuNaiId?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT id FROM settlement WHERE id = ${doiSoatId} FOR UPDATE`,
      );
      if (locked.length !== 1) return;

      const current = await tx.doiSoatNhaCungCap.findUnique({
        where: { id: doiSoatId },
        select: { id: true, nhaCungCapId: true, trangThai: true, phaiTra: true },
      });
      if (!current || current.trangThai !== TrangThaiDoiSoatNhaCungCap.KHA_DUNG) return;

      const phaiTraCents = Math.round(Number(current.phaiTra) * 100);
      const maxUnfreeze = phaiTraCents / 100;

      const balanceLocked = await tx.$queryRaw<Array<{ supplier_id: string; tamGiu: number }>>(
        Prisma.sql`
          SELECT supplier_id, withheld AS tamGiu
          FROM seller_balance
          WHERE supplier_id = ${current.nhaCungCapId}
          FOR UPDATE
        `,
      );
      if (balanceLocked.length !== 1) return;

      const balanceRow = balanceLocked[0]!;
      const tamGiu = Number(balanceRow.tamGiu);
      let unfreeze = Math.min(tamGiu, maxUnfreeze);

      if (khieuNaiId) {
        const khieuNai = await tx.khieuNai.findUnique({
          where: { id: khieuNaiId },
          select: { soTienDongBang: true },
        });
        const complaintFreeze = khieuNai ? Number(khieuNai.soTienDongBang) : 0;
        if (complaintFreeze <= 0) return;
        unfreeze = Math.min(complaintFreeze, maxUnfreeze, tamGiu);
      }

      if (unfreeze <= 0) return;

      await tx.soDuNhaCungCap.update({
        where: { nhaCungCapId: current.nhaCungCapId },
        data: {
          tamGiu: { decrement: unfreeze },
          khaDung: { increment: unfreeze },
        },
      });
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
      trangThai: row.trangThai,
      duDieuKienLuc: row.duDieuKienLuc.toISOString(),
      giaiPhongLuc: row.giaiPhongLuc?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private snapshot(row: DoiSoatDayDu): Prisma.InputJsonObject {
    return {
      nhaCungCapId: row.nhaCungCapId,
      batDauLuc: row.batDauLuc.toISOString(),
      ketThucLuc: row.ketThucLuc.toISOString(),
      doanhThu: Number(row.doanhThu),
      hoaHong: Number(row.hoaHong),
      hoanTien: Number(row.hoanTien),
      dieuChinh: Number(row.dieuChinh),
      phaiTra: Number(row.phaiTra),
      trangThai: row.trangThai,
      duDieuKienLuc: row.duDieuKienLuc.toISOString(),
      giaiPhongLuc: row.giaiPhongLuc?.toISOString() ?? null,
    };
  }
}
