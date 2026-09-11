import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PhamViKhuyenMai, Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type {
  DanhSachKhuyenMaiQuanTriDto,
  DoiTrangThaiKhuyenMaiQuanTriDto,
  KhuyenMaiQuanTriDto,
  LocKhuyenMaiQuanTriDto,
  LuuKhuyenMaiQuanTriDto,
} from './dto/quan-tri-khuyen-mai.dto';

export type NguCanhKhuyenMai = {
  tongTienDonHang: number;
  danhMucIds: string[];
  sanPhamIds: string[];
  thoiDiem?: Date;
};

export type QuyTacKhuyenMaiSnapshot = {
  id: string;
  ma: string;
  phamVi: PhamViKhuyenMai;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam?: number;
  batDauLuc: Date;
  ketThucLuc: Date;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  trangThai: TrangThaiBanGhi;
};

export type KetQuaDanhGiaKhuyenMai = {
  khuyenMaiId: string | null;
  ma: string;
  hopLe: boolean;
  lyDo: string | null;
  phamVi: PhamViKhuyenMai | null;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  giaTriGiam: number;
};

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type KhuyenMaiRow = Prisma.KhuyenMaiGetPayload<Record<string, never>>;

@Injectable()
export class KhuyenMaiService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSachQuanTri(query: LocKhuyenMaiQuanTriDto): Promise<DanhSachKhuyenMaiQuanTriDto> {
    const where: Prisma.KhuyenMaiWhereInput = {};
    const timKiem = query.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        { ma: { contains: timKiem } },
        { ten: { contains: timKiem } },
      ];
    }
    if (query.phamVi) where.phamVi = query.phamVi;
    if (query.trangThai) where.trangThai = query.trangThai;

    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.khuyenMai.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { ma: 'asc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.khuyenMai.count({ where }),
    ]);

    return {
      duLieu: rows.map((row) => this.toQuanTriDto(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layChiTietQuanTri(id: string): Promise<KhuyenMaiQuanTriDto> {
    return this.toQuanTriDto(await this.layBatBuoc(id));
  }

  async taoQuanTri(
    tacNhanId: string,
    dto: LuuKhuyenMaiQuanTriDto,
    metadata: MetadataAudit,
  ): Promise<KhuyenMaiQuanTriDto> {
    const [actor, data] = await Promise.all([
      this.layActor(tacNhanId),
      this.chuanBiDuLieuQuanTri(dto, 0),
    ]);

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const moi = await tx.khuyenMai.create({ data });
        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'KHUYEN_MAI_TAO',
            thucThe: 'khuyen_mai',
            thucTheId: moi.id,
            truoc: { tonTai: false },
            sau: this.snapshotAudit(moi),
            metadata,
          },
        });
        return moi.id;
      });
      return this.layChiTietQuanTri(id);
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async capNhatQuanTri(
    tacNhanId: string,
    id: string,
    dto: LuuKhuyenMaiQuanTriDto,
    metadata: MetadataAudit,
  ): Promise<KhuyenMaiQuanTriDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);
    const data = await this.chuanBiDuLieuQuanTri(dto, hienTai.soLanDaSuDung);

    try {
      await this.prisma.$transaction(async (tx) => {
        const sau = await tx.khuyenMai.update({ where: { id }, data });
        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'KHUYEN_MAI_SUA',
            thucThe: 'khuyen_mai',
            thucTheId: id,
            truoc: this.snapshotAudit(hienTai),
            sau: this.snapshotAudit(sau),
            metadata,
          },
        });
      });
      return this.layChiTietQuanTri(id);
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async doiTrangThaiQuanTri(
    tacNhanId: string,
    id: string,
    dto: DoiTrangThaiKhuyenMaiQuanTriDto,
    metadata: MetadataAudit,
  ): Promise<KhuyenMaiQuanTriDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);
    if (hienTai.trangThai === dto.trangThai) return this.toQuanTriDto(hienTai);

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.khuyenMai.update({
        where: { id },
        data: { trangThai: dto.trangThai },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'KHUYEN_MAI_DOI_TRANG_THAI',
          thucThe: 'khuyen_mai',
          thucTheId: id,
          truoc: this.snapshotAudit(hienTai),
          sau: this.snapshotAudit(sau),
          metadata,
        },
      });
    });

    return this.layChiTietQuanTri(id);
  }

  async danhGiaTheoMa(ma: string, nguCanh: NguCanhKhuyenMai): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = ma.trim();
    const row = await this.prisma.khuyenMai.findUnique({
      where: { ma: normalized },
    });

    if (!row) {
      return this.khongTimThay(normalized);
    }

    return this.danhGiaQuyTac(this.snapshot(row), nguCanh);
  }

  /**
   * Khóa promotion row, đánh giá lại trên dữ liệu order đã lock và chỉ sau đó mới tăng usage.
   * Nhờ chạy trong cùng transaction với Create Order, usage không bị tiêu nếu order rollback.
   */
  async danhGiaVaGhiNhanTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    nguCanh: NguCanhKhuyenMai,
  ): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = ma.trim();
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );

    if (locked.length !== 1) {
      return this.khongTimThay(normalized);
    }

    const row = await tx.khuyenMai.findUnique({
      where: { id: locked[0].id },
    });
    if (!row) {
      return this.khongTimThay(normalized);
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe) {
      return ketQua;
    }

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { increment: 1 } },
    });

    return ketQua;
  }

  /** Hoàn lại một lượt sử dụng khi đơn được hủy hợp lệ. Gọi sau khi order row đã lock. */
  async hoanTacSuDungTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
  ): Promise<boolean> {
    const normalized = ma.trim();
    if (!normalized) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    if (locked.length !== 1) return false;

    const row = await tx.khuyenMai.findUnique({
      where: { id: locked[0].id },
      select: { id: true, soLanDaSuDung: true },
    });
    if (!row || row.soLanDaSuDung <= 0) return false;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { decrement: 1 } },
    });
    return true;
  }

  danhGiaQuyTac(rule: QuyTacKhuyenMaiSnapshot, nguCanh: NguCanhKhuyenMai): KetQuaDanhGiaKhuyenMai {
    const meta = {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      giaTriGiam: Number(rule.giaTriGiam ?? 0),
    };
    const fail = (lyDo: string): KetQuaDanhGiaKhuyenMai => ({
      ...meta,
      hopLe: false,
      lyDo,
    });

    if (rule.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      return fail('Rule khuyến mại không hoạt động.');
    }

    if (!this.scopeTargetHopLe(rule)) {
      return fail('Rule khuyến mại có scope/target không hợp lệ.');
    }

    const thoiDiem = nguCanh.thoiDiem ?? new Date();
    if (
      thoiDiem.getTime() < rule.batDauLuc.getTime() ||
      thoiDiem.getTime() > rule.ketThucLuc.getTime()
    ) {
      return fail('Ngoài thời gian áp dụng.');
    }

    if (nguCanh.tongTienDonHang < rule.donHangToiThieu) {
      return fail('Chưa đạt giá trị đơn hàng tối thiểu.');
    }

    if (rule.gioiHanSuDung !== null && rule.soLanDaSuDung >= rule.gioiHanSuDung) {
      return fail('Rule đã đạt giới hạn sử dụng.');
    }

    if (
      rule.phamVi === PhamViKhuyenMai.DANH_MUC &&
      (!rule.danhMucSanPhamId || !nguCanh.danhMucIds.includes(rule.danhMucSanPhamId))
    ) {
      return fail('Đơn hàng không có danh mục được áp dụng.');
    }

    if (
      rule.phamVi === PhamViKhuyenMai.SAN_PHAM &&
      (!rule.sanPhamId || !nguCanh.sanPhamIds.includes(rule.sanPhamId))
    ) {
      return fail('Đơn hàng không có sản phẩm được áp dụng.');
    }

    if (meta.giaTriGiam <= 0) {
      return fail('Khuyến mại chưa được cấu hình giá trị giảm.');
    }

    return {
      ...meta,
      hopLe: true,
      lyDo: null,
    };
  }

  private async chuanBiDuLieuQuanTri(
    dto: LuuKhuyenMaiQuanTriDto,
    soLanDaSuDung: number,
  ): Promise<Prisma.KhuyenMaiUncheckedCreateInput> {
    const ma = dto.ma.trim().toUpperCase();
    const ten = dto.ten.trim();
    if (!ma) throw new BadRequestException('Mã khuyến mãi không được để trống.');
    if (!/^[A-Z0-9][A-Z0-9_-]{1,79}$/.test(ma)) {
      throw new BadRequestException('Mã khuyến mãi chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.');
    }
    if (!ten) throw new BadRequestException('Tên khuyến mãi không được để trống.');

    const batDauLuc = new Date(dto.batDauLuc);
    const ketThucLuc = new Date(dto.ketThucLuc);
    if (!(batDauLuc.getTime() < ketThucLuc.getTime())) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }

    const gioiHanSuDung = dto.gioiHanSuDung ?? null;
    if (gioiHanSuDung !== null && gioiHanSuDung < soLanDaSuDung) {
      throw new BadRequestException(
        `Giới hạn sử dụng không được nhỏ hơn số lượt đã dùng (${soLanDaSuDung}).`,
      );
    }

    let danhMucSanPhamId: string | null = null;
    let sanPhamId: string | null = null;
    if (dto.phamVi === PhamViKhuyenMai.DANH_MUC) {
      if (!dto.danhMucSanPhamId) {
        throw new BadRequestException('Khuyến mãi theo danh mục phải chọn danh mục sản phẩm.');
      }
      const danhMuc = await this.prisma.danhMucSanPham.findUnique({
        where: { id: dto.danhMucSanPhamId },
        select: { id: true, trangThai: true },
      });
      if (!danhMuc || danhMuc.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Danh mục áp dụng không tồn tại hoặc không hoạt động.');
      }
      danhMucSanPhamId = danhMuc.id;
    } else if (dto.phamVi === PhamViKhuyenMai.SAN_PHAM) {
      if (!dto.sanPhamId) {
        throw new BadRequestException('Khuyến mãi theo sản phẩm phải chọn sản phẩm.');
      }
      const sanPham = await this.prisma.sanPham.findUnique({
        where: { id: dto.sanPhamId },
        select: { id: true, trangThai: true },
      });
      if (!sanPham || sanPham.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Sản phẩm áp dụng không tồn tại hoặc không hoạt động.');
      }
      sanPhamId = sanPham.id;
    }

    return {
      ma,
      ten,
      phamVi: dto.phamVi,
      danhMucSanPhamId,
      sanPhamId,
      donHangToiThieu: dto.donHangToiThieu ?? 0,
      giaTriGiam: dto.giaTriGiam,
      batDauLuc,
      ketThucLuc,
      gioiHanSuDung,
    };
  }

  private async layBatBuoc(id: string): Promise<KhuyenMaiRow> {
    const row = await this.prisma.khuyenMai.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy khuyến mãi.');
    return row;
  }

  private async layActor(id: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân.');
    return actor;
  }

  private toQuanTriDto(row: KhuyenMaiRow): KhuyenMaiQuanTriDto {
    return {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      batDauLuc: row.batDauLuc,
      ketThucLuc: row.ketThucLuc,
      gioiHanSuDung: row.gioiHanSuDung,
      soLanDaSuDung: row.soLanDaSuDung,
      trangThai: row.trangThai,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshotAudit(row: KhuyenMaiRow) {
    return {
      ma: row.ma,
      ten: row.ten,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      batDauLuc: row.batDauLuc.toISOString(),
      ketThucLuc: row.ketThucLuc.toISOString(),
      gioiHanSuDung: row.gioiHanSuDung,
      soLanDaSuDung: row.soLanDaSuDung,
      trangThai: row.trangThai,
    };
  }

  private snapshot(row: {
    id: string;
    ma: string;
    phamVi: PhamViKhuyenMai;
    danhMucSanPhamId: string | null;
    sanPhamId: string | null;
    donHangToiThieu: Prisma.Decimal;
    giaTriGiam: Prisma.Decimal;
    batDauLuc: Date;
    ketThucLuc: Date;
    gioiHanSuDung: number | null;
    soLanDaSuDung: number;
    trangThai: TrangThaiBanGhi;
  }): QuyTacKhuyenMaiSnapshot {
    return {
      id: row.id,
      ma: row.ma,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      batDauLuc: row.batDauLuc,
      ketThucLuc: row.ketThucLuc,
      gioiHanSuDung: row.gioiHanSuDung,
      soLanDaSuDung: row.soLanDaSuDung,
      trangThai: row.trangThai,
    };
  }

  private khongTimThay(ma: string): KetQuaDanhGiaKhuyenMai {
    return {
      khuyenMaiId: null,
      ma,
      hopLe: false,
      lyDo: 'Không tìm thấy rule khuyến mại.',
      phamVi: null,
      danhMucSanPhamId: null,
      sanPhamId: null,
      giaTriGiam: 0,
    };
  }

  private scopeTargetHopLe(rule: QuyTacKhuyenMaiSnapshot): boolean {
    if (rule.phamVi === PhamViKhuyenMai.PLATFORM) {
      return rule.danhMucSanPhamId === null && rule.sanPhamId === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.DANH_MUC) {
      return rule.danhMucSanPhamId !== null && rule.sanPhamId === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.SAN_PHAM) {
      return rule.danhMucSanPhamId === null && rule.sanPhamId !== null;
    }
    return false;
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã khuyến mãi đã tồn tại.');
    }
  }
}
