import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  LoaiGiamGiaKhuyenMai,
  PhamViKhuyenMai,
  Prisma,
  TrangThaiBanGhi,
} from '../../generated/prisma/client';

import { lamTronTien } from '../common/tien-te.util';

import type { KhuyenMaiKhachHangDto } from './dto/khuyen-mai-khach-hang.dto';

import type {
  DanhSachKhuyenMaiQuanTriDto,
  DoiTrangThaiKhuyenMaiQuanTriDto,
  KhuyenMaiQuanTriDto,
  LocKhuyenMaiQuanTriDto,
  LuuKhuyenMaiQuanTriDto,
} from './dto/quan-tri-khuyen-mai.dto';

export type NguCanhKhuyenMai = {
  khachHangId?: string;
  tongTienDonHang: number;
  danhMucIds: string[];
  sanPhamIds: string[];
  trangTraiIds?: string[];
  thoiDiem?: Date;
};

export type QuyTacKhuyenMaiSnapshot = {
  id: string;
  ma: string;
  phamVi: PhamViKhuyenMai;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  trangTraiId?: string | null;
  loaiGiam?: LoaiGiamGiaKhuyenMai;
  donHangToiThieu: number;
  giaTriGiam?: number;
  giamToiDa?: number | null;
  gioiHanMoiKhach?: number | null;
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
  trangTraiId: string | null;
  loaiGiam: LoaiGiamGiaKhuyenMai | null;
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
      where.OR = [{ ma: { contains: timKiem } }, { ten: { contains: timKiem } }];
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

  // AUTO_VOUCHER_WALLET_SERVICE_V1
  async layCongKhaiKhachHang(): Promise<KhuyenMaiKhachHangDto[]> {
    const now = new Date();
    const rows = await this.prisma.khuyenMai.findMany({
      where: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        batDauLuc: { lte: now },
        ketThucLuc: { gte: now },
      },
      orderBy: [{ ketThucLuc: 'asc' }, { giaTriGiam: 'desc' }],
    });

    return rows
      .filter((row) => this.conLuotKhuyenMai(row))
      .map((row) => this.toKhachHangDto(row, false));
  }

  async layDaLuuKhachHang(nguoiDungId: string): Promise<KhuyenMaiKhachHangDto[]> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    const now = new Date();
    const rows = await this.prisma.khachHangKhuyenMai.findMany({
      where: {
        khachHangId,
        khuyenMai: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          batDauLuc: { lte: now },
          ketThucLuc: { gte: now },
        },
      },
      include: { khuyenMai: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((row) => row.khuyenMai)
      .filter((row) => this.conLuotKhuyenMai(row))
      .map((row) => this.toKhachHangDto(row, true));
  }

  async luuKhuyenMaiKhachHang(
    nguoiDungId: string,
    khuyenMaiId: string,
  ): Promise<KhuyenMaiKhachHangDto> {
    const [khachHangId, row] = await Promise.all([
      this.layKhachHangIdTheoNguoiDung(nguoiDungId),
      this.prisma.khuyenMai.findUnique({ where: { id: khuyenMaiId } }),
    ]);

    if (!row) throw new NotFoundException('Không tìm thấy voucher.');
    if (!this.dangHieuLucChoKhachHang(row, new Date()) || !this.conLuotKhuyenMai(row)) {
      throw new BadRequestException('Voucher hiện không còn khả dụng để lưu.');
    }

    await this.prisma.khachHangKhuyenMai.upsert({
      where: {
        khachHangId_khuyenMaiId: {
          khachHangId,
          khuyenMaiId,
        },
      },
      create: { khachHangId, khuyenMaiId },
      update: {},
    });

    return this.toKhachHangDto(row, true);
  }

  async boLuuKhuyenMaiKhachHang(nguoiDungId: string, khuyenMaiId: string): Promise<void> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    await this.prisma.khachHangKhuyenMai.deleteMany({
      where: { khachHangId, khuyenMaiId },
    });
  }

  async danhGiaTheoMa(ma: string, nguCanh: NguCanhKhuyenMai): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = this.chuanHoaMa(ma);
    const row = await this.prisma.khuyenMai.findUnique({
      where: { ma: normalized },
    });

    if (!row) {
      return this.khongTimThay(normalized);
    }

    if (nguCanh.khachHangId) {
      const daLuu = await this.prisma.khachHangKhuyenMai.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: nguCanh.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { id: true, soLanDaSuDung: true },
      });
      if (!daLuu) return this.ketQuaChuaLuu(this.snapshot(row));
      if (daLuu.soLanDaSuDung >= (row.gioiHanMoiKhach ?? 1)) {
        return this.ketQuaDaDung(this.snapshot(row));
      }
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
    const normalized = this.chuanHoaMa(ma);
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];

    if (locked.length !== 1 || !lockedPromotion) return this.khongTimThay(normalized);

    const row = await tx.khuyenMai.findUnique({ where: { id: lockedPromotion.id } });
    if (!row) return this.khongTimThay(normalized);

    let viKhachHangId: string | null = null;
    if (nguCanh.khachHangId) {
      const lockedWallet = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT id
          FROM khach_hang_khuyen_mai
          WHERE khach_hang_id = ${nguCanh.khachHangId}
            AND khuyen_mai_id = ${row.id}
          FOR UPDATE
        `,
      );
      if (lockedWallet.length !== 1) return this.ketQuaChuaLuu(this.snapshot(row));

      const daLuu = await tx.khachHangKhuyenMai.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: nguCanh.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { id: true, soLanDaSuDung: true },
      });
      if (!daLuu) return this.ketQuaChuaLuu(this.snapshot(row));
      if (daLuu.soLanDaSuDung >= (row.gioiHanMoiKhach ?? 1)) {
        return this.ketQuaDaDung(this.snapshot(row));
      }
      viKhachHangId = daLuu.id;
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe) return ketQua;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { increment: 1 } },
    });
    if (viKhachHangId) {
      await tx.khachHangKhuyenMai.update({
        where: { id: viKhachHangId },
        data: { soLanDaSuDung: { increment: 1 } },
      });
    }

    return ketQua;
  }

  /** Hoàn lại một lượt sử dụng khi đơn được hủy hợp lệ. Gọi sau khi order row đã lock. */
  async hoanTacSuDungTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    khachHangId?: string,
  ): Promise<boolean> {
    const normalized = this.chuanHoaMa(ma);
    if (!normalized) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];
    if (locked.length !== 1 || !lockedPromotion) return false;

    const row = await tx.khuyenMai.findUnique({
      where: { id: lockedPromotion.id },
      select: { id: true, soLanDaSuDung: true },
    });
    if (!row || row.soLanDaSuDung <= 0) return false;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { decrement: 1 } },
    });

    if (khachHangId) {
      const wallet = await tx.khachHangKhuyenMai.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { id: true, soLanDaSuDung: true },
      });
      if (wallet && wallet.soLanDaSuDung > 0) {
        await tx.khachHangKhuyenMai.update({
          where: { id: wallet.id },
          data: { soLanDaSuDung: { decrement: 1 } },
        });
      }
    }
    return true;
  }

  danhGiaQuyTac(rule: QuyTacKhuyenMaiSnapshot, nguCanh: NguCanhKhuyenMai): KetQuaDanhGiaKhuyenMai {
    const meta = {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      trangTraiId: rule.trangTraiId ?? null,
      loaiGiam: rule.loaiGiam ?? LoaiGiamGiaKhuyenMai.SO_TIEN,
      giaTriGiam: 0,
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

    if (
      rule.phamVi === PhamViKhuyenMai.TRANG_TRAI &&
      (!rule.trangTraiId || !(nguCanh.trangTraiIds ?? []).includes(rule.trangTraiId))
    ) {
      return fail('Đơn hàng không có sản phẩm từ trang trại được áp dụng.');
    }

    const giam = this.tinhGiamGia(rule, nguCanh.tongTienDonHang);
    if (giam <= 0) {
      return fail('Khuyến mại chưa được cấu hình giá trị giảm.');
    }

    return {
      ...meta,
      giaTriGiam: giam,
      hopLe: true,
      lyDo: null,
    };
  }

  /**
   * So tien giam thuc te tren tong tien don hang.
   * PHAN_TRAM: tongTien * % (lam tron), tran giamToiDa, khong vuot tongTien.
   * SO_TIEN: khong vuot tongTien.
   */
  tinhGiamGia(
    rule: Pick<QuyTacKhuyenMaiSnapshot, 'loaiGiam' | 'giaTriGiam' | 'giamToiDa'>,
    tongTienDonHang: number,
  ): number {
    const tongTien = lamTronTien(tongTienDonHang);
    if (!(tongTien > 0)) return 0;
    if (rule.loaiGiam === LoaiGiamGiaKhuyenMai.PHAN_TRAM) {
      const phanTram = Number(rule.giaTriGiam ?? 0);
      if (!(phanTram > 0 && phanTram <= 100)) return 0;
      let giam = lamTronTien((tongTien * phanTram) / 100);
      if (rule.giamToiDa !== null && rule.giamToiDa !== undefined) {
        giam = Math.min(giam, lamTronTien(rule.giamToiDa));
      }
      return Math.min(giam, tongTien);
    }
    return Math.min(lamTronTien(Number(rule.giaTriGiam ?? 0)), tongTien);
  }

  private async chuanBiDuLieuQuanTri(
    dto: LuuKhuyenMaiQuanTriDto,
    soLanDaSuDung: number,
  ): Promise<Prisma.KhuyenMaiUncheckedCreateInput> {
    const ma = this.chuanHoaMa(dto.ma);
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

    const loaiGiam = dto.loaiGiam ?? LoaiGiamGiaKhuyenMai.SO_TIEN;
    const giaTriGiam = Number(dto.giaTriGiam);
    if (loaiGiam === LoaiGiamGiaKhuyenMai.PHAN_TRAM) {
      if (!(giaTriGiam > 0 && giaTriGiam <= 100)) {
        throw new BadRequestException('Phần trăm giảm phải lớn hơn 0 và không vượt quá 100.');
      }
    } else if (!(giaTriGiam >= 0.01)) {
      throw new BadRequestException('Số tiền giảm phải lớn hơn 0.');
    }

    const giamToiDa = dto.giamToiDa ?? null;
    if (giamToiDa !== null && !(giamToiDa >= 0)) {
      throw new BadRequestException('Giảm tối đa không được âm.');
    }
    if (loaiGiam === LoaiGiamGiaKhuyenMai.SO_TIEN && giamToiDa !== null) {
      throw new BadRequestException('Giảm tối đa chỉ áp dụng cho khuyến mãi theo phần trăm.');
    }

    const gioiHanMoiKhach = dto.gioiHanMoiKhach ?? null;
    if (gioiHanMoiKhach !== null && gioiHanMoiKhach < 1) {
      throw new BadRequestException('Giới hạn mỗi khách phải lớn hơn 0.');
    }
    if (gioiHanMoiKhach !== null && gioiHanSuDung !== null && gioiHanMoiKhach > gioiHanSuDung) {
      throw new BadRequestException('Giới hạn mỗi khách không được vượt tổng lượt sử dụng.');
    }

    let danhMucSanPhamId: string | null = null;
    let sanPhamId: string | null = null;
    let trangTraiId: string | null = null;
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
    } else if (dto.phamVi === PhamViKhuyenMai.TRANG_TRAI) {
      if (!dto.trangTraiId) {
        throw new BadRequestException('Khuyến mãi theo trang trại phải chọn trang trại.');
      }
      const trangTrai = await this.prisma.trangTrai.findUnique({
        where: { id: dto.trangTraiId },
        select: { id: true, trangThai: true },
      });
      if (!trangTrai || trangTrai.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        throw new BadRequestException('Trang trại áp dụng không tồn tại hoặc không hoạt động.');
      }
      trangTraiId = trangTrai.id;
    }

    return {
      ma,
      ten,
      moTa: dto.moTa?.trim() || null,
      phamVi: dto.phamVi,
      danhMucSanPhamId,
      sanPhamId,
      trangTraiId,
      loaiGiam,
      donHangToiThieu: dto.donHangToiThieu ?? 0,
      giaTriGiam: dto.giaTriGiam,
      giamToiDa,
      gioiHanMoiKhach,
      batDauLuc,
      ketThucLuc,
      gioiHanSuDung,
    };
  }

  private async layKhachHangIdTheoNguoiDung(nguoiDungId: string): Promise<string> {
    const row = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!row) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return row.id;
  }

  private dangHieuLucChoKhachHang(row: KhuyenMaiRow, now: Date): boolean {
    return (
      row.trangThai === TrangThaiBanGhi.HOAT_DONG &&
      row.batDauLuc.getTime() <= now.getTime() &&
      row.ketThucLuc.getTime() >= now.getTime()
    );
  }

  private conLuotKhuyenMai(row: KhuyenMaiRow): boolean {
    return row.gioiHanSuDung === null || row.soLanDaSuDung < row.gioiHanSuDung;
  }

  private toKhachHangDto(row: KhuyenMaiRow, daLuu: boolean): KhuyenMaiKhachHangDto {
    const soLuotConLai =
      row.gioiHanSuDung === null ? null : Math.max(0, row.gioiHanSuDung - row.soLanDaSuDung);

    return {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      moTa: row.moTa,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      trangTraiId: row.trangTraiId,
      loaiGiam: row.loaiGiam,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      giamToiDa: row.giamToiDa === null ? null : Number(row.giamToiDa),
      gioiHanMoiKhach: row.gioiHanMoiKhach,
      batDauLuc: row.batDauLuc,
      ketThucLuc: row.ketThucLuc,
      gioiHanSuDung: row.gioiHanSuDung,
      soLanDaSuDung: row.soLanDaSuDung,
      soLuotConLai,
      daLuu,
    };
  }

  // AGRIMARKET-VOUCHER-PER-CUSTOMER-V1
  private ketQuaDaDung(rule: QuyTacKhuyenMaiSnapshot): KetQuaDanhGiaKhuyenMai {
    return {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      hopLe: false,
      lyDo: 'Voucher này đã hết lượt sử dụng cho tài khoản.',
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      trangTraiId: rule.trangTraiId ?? null,
      loaiGiam: rule.loaiGiam ?? LoaiGiamGiaKhuyenMai.SO_TIEN,
      giaTriGiam: Number(rule.giaTriGiam ?? 0),
    };
  }

  private ketQuaChuaLuu(rule: QuyTacKhuyenMaiSnapshot): KetQuaDanhGiaKhuyenMai {
    return {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      hopLe: false,
      lyDo: 'Voucher chưa được lưu vào tài khoản.',
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      trangTraiId: rule.trangTraiId ?? null,
      loaiGiam: rule.loaiGiam ?? LoaiGiamGiaKhuyenMai.SO_TIEN,
      giaTriGiam: Number(rule.giaTriGiam ?? 0),
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
      moTa: row.moTa,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      trangTraiId: row.trangTraiId,
      loaiGiam: row.loaiGiam,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      giamToiDa: row.giamToiDa === null ? null : Number(row.giamToiDa),
      gioiHanMoiKhach: row.gioiHanMoiKhach,
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
      moTa: row.moTa,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      trangTraiId: row.trangTraiId,
      loaiGiam: row.loaiGiam,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      giamToiDa: row.giamToiDa === null ? null : Number(row.giamToiDa),
      gioiHanMoiKhach: row.gioiHanMoiKhach,
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
    trangTraiId: string | null;
    loaiGiam: LoaiGiamGiaKhuyenMai;
    donHangToiThieu: Prisma.Decimal;
    giaTriGiam: Prisma.Decimal;
    giamToiDa: Prisma.Decimal | null;
    gioiHanMoiKhach: number | null;
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
      trangTraiId: row.trangTraiId,
      loaiGiam: row.loaiGiam,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      giamToiDa: row.giamToiDa === null ? null : Number(row.giamToiDa),
      gioiHanMoiKhach: row.gioiHanMoiKhach,
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
      trangTraiId: null,
      loaiGiam: null,
      giaTriGiam: 0,
    };
  }

  private scopeTargetHopLe(rule: QuyTacKhuyenMaiSnapshot): boolean {
    const danhMuc = rule.danhMucSanPhamId ?? null;
    const sanPham = rule.sanPhamId ?? null;
    const trangTrai = rule.trangTraiId ?? null;
    if (rule.phamVi === PhamViKhuyenMai.PLATFORM) {
      return danhMuc === null && sanPham === null && trangTrai === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.DANH_MUC) {
      return danhMuc !== null && sanPham === null && trangTrai === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.SAN_PHAM) {
      return danhMuc === null && sanPham !== null && trangTrai === null;
    }
    if (rule.phamVi === PhamViKhuyenMai.TRANG_TRAI) {
      return danhMuc === null && sanPham === null && trangTrai !== null;
    }
    return false;
  }

  private chuanHoaMa(value: string): string {
    return value.trim().toUpperCase();
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã khuyến mãi đã tồn tại.');
    }
  }
}
