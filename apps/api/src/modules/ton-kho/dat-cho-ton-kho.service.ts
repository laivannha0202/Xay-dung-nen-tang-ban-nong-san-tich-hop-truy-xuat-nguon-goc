import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';

import { PrismaService } from '../../database/prisma.service';
import {
  LoaiGiaoDichTonKho,
  LoaiPhieuKho,
  Prisma,
  TrangThaiBanGhi,
  TrangThaiDatChoTonKho,
  TrangThaiDonHang,
  TrangThaiLoSanPham,
  TrangThaiThanhToan,
} from '../../generated/prisma/client';

import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import {
  PhieuKhoWriterService,
  type TaoDongPhieuKhoInput,
} from '../phieu-kho/phieu-kho-writer.service';

import {
  TEN_CONG_VIEC_HET_HAN_DAT_CHO_TON_KHO,
  TEN_HANG_DOI_DAT_CHO_TON_KHO,
  TTL_DAT_CHO_MAC_DINH_MS,
} from './dat-cho-ton-kho.constants';

export type YeuCauDatChoTonKhoItem = {
  bienTheSanPhamId: string;
  soLuong: number;
};

export type YeuCauDatChoTonKho = {
  maThamChieu: string;
  items: YeuCauDatChoTonKhoItem[];
  ttlMs?: number;
};

export type PhanBoDatChoTonKho = {
  tonKhoLoId: string;
  khoId: string;
  maKho: string;
  loSanPhamId: string;
  maLo: string;
  ngayHetHan: string;
  bienTheSanPhamId: string;
  soLuong: number;
};

export type KetQuaDatChoTonKho = {
  id: string;
  maThamChieu: string;
  trangThai: TrangThaiDatChoTonKho;
  hetHanLuc: Date;
  ketThucLuc: Date | null;
  phanBo: PhanBoDatChoTonKho[];
};

type InventoryLockRow = {
  id: string;
  khoId: string;
  maKho: string;
  loSanPhamId: string;
  maLo: string;
  ngayHetHan: Date;
  bienTheSanPhamId: string;
  onHand: Prisma.Decimal;
  reserved: Prisma.Decimal;
  blocked: Prisma.Decimal;
};

type InventoryCurrentRow = {
  id: string;
  khoId: string;
  onHand: Prisma.Decimal;
  reserved: Prisma.Decimal;
};

type KetQuaKetThuc = {
  daThayDoi: boolean;
  ketQua: KetQuaDatChoTonKho;
};

@Injectable()
export class DatChoTonKhoService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(TEN_HANG_DOI_DAT_CHO_TON_KHO)
    private readonly queue: Queue,
    private readonly cauHinhHeThong: CauHinhHeThongService,
    private readonly phieuKhoWriter: PhieuKhoWriterService,
  ) {}

  async datCho(dto: YeuCauDatChoTonKho): Promise<KetQuaDatChoTonKho> {
    await this.giaiPhongHetHanDaQua();

    const maThamChieu = this.chuanHoaThamChieu(dto.maThamChieu);
    const items = this.chuanHoaItems(dto.items);
    const ttlMs = this.chuanHoaTtl(dto.ttlMs ?? (await this.cauHinhHeThong.layReservationTtlMs()));

    const daCo = await this.prisma.datChoTonKho.findUnique({
      where: { maThamChieu },
      select: {
        id: true,
        trangThai: true,
        hetHanLuc: true,
      },
    });

    if (daCo) {
      if (
        daCo.trangThai === TrangThaiDatChoTonKho.DANG_GIU &&
        daCo.hetHanLuc.getTime() > Date.now()
      ) {
        return this.layKetQua(daCo.id);
      }

      throw new BadRequestException('Mã tham chiếu reservation đã được sử dụng.');
    }

    const hetHanLuc = new Date(Date.now() + ttlMs);

    const reservationId = await this.prisma.$transaction(
      async (tx) => {
        const header = await tx.datChoTonKho.create({
          data: {
            maThamChieu,
            hetHanLuc,
          },
          select: { id: true },
        });

        let thuTu = 0;

        for (const item of items) {
          let conLai = item.soLuong;

          const rows = await this.lockFefoRows(tx, item.bienTheSanPhamId);

          for (const row of rows) {
            if (conLai <= 0) break;

            const available = this.soLuong(
              Number(row.onHand) - Number(row.reserved) - Number(row.blocked),
            );
            if (available <= 0) continue;

            const lay = this.soLuong(Math.min(conLai, available));
            if (lay <= 0) continue;

            await tx.tonKhoLo.update({
              where: { id: row.id },
              data: {
                reserved: {
                  increment: lay,
                },
              },
            });

            await tx.giaoDichTonKho.create({
              data: {
                tonKhoLoId: row.id,
                loai: LoaiGiaoDichTonKho.ORDER_RESERVE,
                soLuong: lay,
              },
            });

            await tx.mucDatChoTonKho.create({
              data: {
                datChoTonKhoId: header.id,
                tonKhoLoId: row.id,
                soLuong: lay,
                thuTu,
              },
            });

            thuTu += 1;
            conLai = this.soLuong(conLai - lay);
          }

          if (conLai > 0) {
            throw new BadRequestException(`Không đủ tồn kho hợp lệ theo FEFO. Thiếu ${conLai}.`);
          }
        }

        return header.id;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );

    try {
      await this.lenLichHetHan(reservationId, hetHanLuc);
    } catch (error) {
      await this.giaiPhong(reservationId);

      throw new ServiceUnavailableException(
        'Không lên lịch được TTL reservation; đã giải phóng tồn.',
        {
          cause: error,
        },
      );
    }

    return this.layKetQua(reservationId);
  }

  async giaiPhong(id: string): Promise<KetQuaDatChoTonKho> {
    return (
      await this.ketThuc(
        id,
        TrangThaiDatChoTonKho.DA_GIAI_PHONG,
        LoaiGiaoDichTonKho.ORDER_RELEASE,
        false,
        false,
      )
    ).ketQua;
  }

  async giaiPhongTrongTransaction(tx: Prisma.TransactionClient, id: string): Promise<boolean> {
    return this.ketThucTrongTransaction(
      tx,
      id,
      TrangThaiDatChoTonKho.DA_GIAI_PHONG,
      LoaiGiaoDichTonKho.ORDER_RELEASE,
      false,
      false,
    );
  }

  /**
   * Payment commit boundary.
   *
   * DA_BAN ở schema legacy được giữ để tương thích dữ liệu/client, nhưng từ đây
   * mang nghĩa "đã cam kết tồn sau thanh toán":
   * - KHÔNG giảm onHand;
   * - KHÔNG giảm reserved;
   * - KHÔNG ghi ORDER_SHIP/PXK.
   *
   * Xuất kho vật lý chỉ xảy ra khi shipment chuyển PICKED_UP.
   */
  async xacNhanDaBan(id: string): Promise<KetQuaDatChoTonKho> {
    await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`
            SELECT id
            FROM inventory_reservation
            WHERE id = ${id}
            FOR UPDATE
          `,
        );

        if (locked.length !== 1) {
          throw new NotFoundException('Không tìm thấy inventory reservation.');
        }

        const reservation = await tx.datChoTonKho.findUniqueOrThrow({
          where: { id },
          select: {
            trangThai: true,
            hetHanLuc: true,
          },
        });

        if (reservation.trangThai === TrangThaiDatChoTonKho.DA_BAN) {
          return;
        }

        if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
          throw new BadRequestException(
            `Không thể commit inventory từ trạng thái ${reservation.trangThai}.`,
          );
        }

        if (reservation.hetHanLuc.getTime() <= Date.now()) {
          throw new BadRequestException('Reservation đã hết hạn trước thời điểm payment commit.');
        }

        await tx.datChoTonKho.update({
          where: { id },
          data: {
            trangThai: TrangThaiDatChoTonKho.DA_BAN,
            ketThucLuc: new Date(),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );

    return this.layKetQua(id);
  }

  /**
   * Xuất kho theo supplier-order tại thời điểm hãng vận chuyển PICKED_UP.
   * Idempotent theo phiếu kho SHIP:<maDonNhaCungCap>.
   */
  async xacNhanXuatKhoDonNhaCungCapTrongTransaction(
    tx: Prisma.TransactionClient,
    donHangNhaCungCapId: string,
  ): Promise<boolean> {
    const suborder = await tx.donHangNhaCungCap.findUnique({
      where: { id: donHangNhaCungCapId },
      select: {
        id: true,
        maDon: true,
        donHang: {
          select: {
            id: true,
            maDonHang: true,
          },
        },
        muc: {
          select: {
            phanBo: {
              select: {
                tonKhoLoId: true,
                soLuong: true,
              },
            },
          },
        },
      },
    });

    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để xuất kho.');
    }

    const reservation = await tx.datChoTonKho.findUnique({
      where: { maThamChieu: `ORDER:${suborder.donHang.maDonHang}` },
      select: { trangThai: true },
    });

    if (!reservation || reservation.trangThai !== TrangThaiDatChoTonKho.DA_BAN) {
      throw new BadRequestException(
        'Đơn chưa có inventory commit hợp lệ; không thể xuất kho vật lý.',
      );
    }

    const maThamChieu = `SHIP:${suborder.maDon}`;
    const daCoPhieu = await tx.phieuKho.count({
      where: {
        maThamChieu,
        loai: LoaiPhieuKho.XUAT,
      },
    });
    if (daCoPhieu > 0) {
      return false;
    }

    const tongTheoTonKho = new Map<string, number>();
    for (const muc of suborder.muc) {
      for (const phanBo of muc.phanBo) {
        const qty = this.soLuong(Number(phanBo.soLuong));
        tongTheoTonKho.set(
          phanBo.tonKhoLoId,
          this.soLuong((tongTheoTonKho.get(phanBo.tonKhoLoId) ?? 0) + qty),
        );
      }
    }

    if (tongTheoTonKho.size === 0) {
      throw new BadRequestException('Đơn nhà cung cấp chưa có allocation theo lô để xuất kho.');
    }

    const dongTheoKho = new Map<string, TaoDongPhieuKhoInput[]>();

    for (const tonKhoLoId of [...tongTheoTonKho.keys()].sort()) {
      const qty = tongTheoTonKho.get(tonKhoLoId)!;

      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          khoId: string;
          onHand: Prisma.Decimal;
          reserved: Prisma.Decimal;
        }>
      >(
        Prisma.sql`
          SELECT
            id,
            kho_id AS khoId,
            on_hand AS onHand,
            reserved
          FROM inventory_lot
          WHERE id = ${tonKhoLoId}
          FOR UPDATE
        `,
      );

      if (rows.length !== 1) {
        throw new NotFoundException('Inventory lot của order allocation không còn tồn tại.');
      }

      const row = rows[0]!;
      if (Number(row.reserved) + 1e-9 < qty) {
        throw new BadRequestException('Reserved inventory nhỏ hơn allocation khi xuất kho.');
      }
      if (Number(row.onHand) + 1e-9 < qty) {
        throw new BadRequestException('On-hand inventory nhỏ hơn allocation khi xuất kho.');
      }

      await tx.tonKhoLo.update({
        where: { id: tonKhoLoId },
        data: {
          reserved: { decrement: qty },
          onHand: { decrement: qty },
        },
      });

      const giaoDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
          soLuong: qty,
        },
      });

      const dong = dongTheoKho.get(row.khoId) ?? [];
      dong.push({
        tonKhoLoId,
        soLuong: qty,
        giaoDich: [{ id: giaoDich.id, vaiTro: 'XUAT_BAN' }],
      });
      dongTheoKho.set(row.khoId, dong);
    }

    for (const [khoNguonId, dong] of [...dongTheoKho.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      await this.phieuKhoWriter.taoTrongTransaction(tx, {
        loai: LoaiPhieuKho.XUAT,
        donHangId: suborder.donHang.id,
        khoNguonId,
        maThamChieu,
        lyDo: 'Xuất kho bàn giao đơn vị vận chuyển',
        ghiChu: 'ORDER_SHIP chỉ ghi khi shipment PICKED_UP; payment commit không làm giảm onHand.',
        dong,
      });
    }

    return true;
  }

  /**
   * Hàng giao thất bại hoàn về kho:
   * onHand tăng lại vì hàng đã quay về vật lý, nhưng blocked cũng tăng cùng lượng
   * nên available không tăng. Hàng phải QC lại trước khi bán tiếp.
   */
  async nhapHangHoanCachLyDonNhaCungCapTrongTransaction(
    tx: Prisma.TransactionClient,
    donHangNhaCungCapId: string,
    vanChuyenId: string,
  ): Promise<boolean> {
    const suborder = await tx.donHangNhaCungCap.findUnique({
      where: { id: donHangNhaCungCapId },
      select: {
        id: true,
        maDon: true,
        donHang: { select: { id: true } },
        muc: {
          select: {
            phanBo: {
              select: {
                tonKhoLoId: true,
                soLuong: true,
              },
            },
          },
        },
      },
    });

    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để nhập hàng hoàn.');
    }

    const maThamChieuXuat = `SHIP:${suborder.maDon}`;
    const daXuat = await tx.phieuKho.count({
      where: {
        maThamChieu: maThamChieuXuat,
        loai: LoaiPhieuKho.XUAT,
      },
    });
    if (daXuat === 0) {
      throw new BadRequestException('Không thể nhập hàng hoàn khi đơn chưa có PXK xuất giao.');
    }

    const maThamChieu = `RETURN:${vanChuyenId}`;
    const daCoPhieu = await tx.phieuKho.count({
      where: {
        maThamChieu,
        loai: LoaiPhieuKho.NHAP,
      },
    });
    if (daCoPhieu > 0) {
      return false;
    }

    const tongTheoTonKho = new Map<string, number>();
    for (const muc of suborder.muc) {
      for (const phanBo of muc.phanBo) {
        const qty = this.soLuong(Number(phanBo.soLuong));
        tongTheoTonKho.set(
          phanBo.tonKhoLoId,
          this.soLuong((tongTheoTonKho.get(phanBo.tonKhoLoId) ?? 0) + qty),
        );
      }
    }

    if (tongTheoTonKho.size === 0) {
      throw new BadRequestException('Đơn nhà cung cấp không có allocation để nhập hàng hoàn.');
    }

    const dongTheoKho = new Map<string, TaoDongPhieuKhoInput[]>();

    for (const tonKhoLoId of [...tongTheoTonKho.keys()].sort()) {
      const qty = tongTheoTonKho.get(tonKhoLoId)!;

      const rows = await tx.$queryRaw<Array<{ id: string; khoId: string }>>(
        Prisma.sql`
          SELECT id, kho_id AS khoId
          FROM inventory_lot
          WHERE id = ${tonKhoLoId}
          FOR UPDATE
        `,
      );

      if (rows.length !== 1) {
        throw new NotFoundException('Inventory lot của hàng hoàn không còn tồn tại.');
      }

      const row = rows[0]!;

      await tx.tonKhoLo.update({
        where: { id: tonKhoLoId },
        data: {
          onHand: { increment: qty },
          blocked: { increment: qty },
        },
      });

      const giaoDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId,
          loai: LoaiGiaoDichTonKho.RETURN_IN,
          soLuong: qty,
        },
      });

      const dong = dongTheoKho.get(row.khoId) ?? [];
      dong.push({
        tonKhoLoId,
        soLuong: qty,
        giaoDich: [{ id: giaoDich.id, vaiTro: 'NHAP_HANG_HOAN_CACH_LY' }],
      });
      dongTheoKho.set(row.khoId, dong);
    }

    for (const [khoDichId, dong] of [...dongTheoKho.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      await this.phieuKhoWriter.taoTrongTransaction(tx, {
        loai: LoaiPhieuKho.NHAP,
        donHangId: suborder.donHang.id,
        khoDichId,
        maThamChieu,
        lyDo: 'Nhập hàng giao thất bại hoàn về kho',
        ghiChu: 'Hàng hoàn được cộng onHand và blocked đồng thời; phải QC lại trước khi mở bán.',
        dong,
      });
    }

    return true;
  }

  async hetHan(id: string): Promise<KetQuaDatChoTonKho> {
    const result = await this.ketThuc(
      id,
      TrangThaiDatChoTonKho.HET_HAN,
      LoaiGiaoDichTonKho.ORDER_RELEASE,
      false,
      true,
    );

    if (result.daThayDoi) {
      await this.dongBoDonHangKhiReservationHetHan(result.ketQua.maThamChieu);
    }

    return result.ketQua;
  }

  async giaiPhongHetHanDaQua(): Promise<number> {
    const rows = await this.prisma.datChoTonKho.findMany({
      where: {
        trangThai: TrangThaiDatChoTonKho.DANG_GIU,
        hetHanLuc: {
          lte: new Date(),
        },
      },
      select: { id: true },
      orderBy: [{ hetHanLuc: 'asc' }, { id: 'asc' }],
      take: 100,
    });

    let count = 0;

    for (const row of rows) {
      const result = await this.ketThuc(
        row.id,
        TrangThaiDatChoTonKho.HET_HAN,
        LoaiGiaoDichTonKho.ORDER_RELEASE,
        false,
        true,
      );

      if (result.daThayDoi) {
        await this.dongBoDonHangKhiReservationHetHan(result.ketQua.maThamChieu);
        count += 1;
      }
    }

    return count;
  }

  private async dongBoDonHangKhiReservationHetHan(maThamChieu: string): Promise<void> {
    const prefix = 'ORDER:';
    if (!maThamChieu.startsWith(prefix)) {
      return;
    }

    const maDonHang = maThamChieu.slice(prefix.length).trim();
    if (!maDonHang) {
      return;
    }

    const order = await this.prisma.donHang.findUnique({
      where: {
        maDonHang,
      },
      select: {
        id: true,
        trangThai: true,
      },
    });

    if (!order || order.trangThai !== TrangThaiDonHang.CHO_THANH_TOAN) {
      return;
    }

    const payments = await this.prisma.thanhToan.findMany({
      where: {
        donHangId: order.id,
        trangThai: {
          in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
        },
      },
      select: {
        id: true,
      },
    });

    const paymentIds = payments.map((payment) => payment.id);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.donHang.updateMany({
        where: {
          id: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_HUY,
        },
      });

      await tx.donHangNhaCungCap.updateMany({
        where: {
          donHangId: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_HUY,
        },
      });

      if (paymentIds.length === 0) {
        return;
      }

      await tx.thanhToan.updateMany({
        where: {
          id: {
            in: paymentIds,
          },
          trangThai: {
            in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
          },
        },
        data: {
          trangThai: TrangThaiThanhToan.CANCELLED,
        },
      });

      await tx.giaoDichThanhToan.updateMany({
        where: {
          thanhToanId: {
            in: paymentIds,
          },
          trangThai: {
            in: [TrangThaiThanhToan.CREATED, TrangThaiThanhToan.PENDING],
          },
        },
        data: {
          trangThai: TrangThaiThanhToan.CANCELLED,
          thoiGian: now,
        },
      });
    });
  }

  private async ketThuc(
    id: string,
    trangThaiMoi: TrangThaiDatChoTonKho,
    loaiLedger: LoaiGiaoDichTonKho,
    truOnHand: boolean,
    chiKhiHetHan: boolean,
  ): Promise<KetQuaKetThuc> {
    const daThayDoi = await this.prisma.$transaction(
      (tx) =>
        this.ketThucTrongTransaction(tx, id, trangThaiMoi, loaiLedger, truOnHand, chiKhiHetHan),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );

    return {
      daThayDoi,
      ketQua: await this.layKetQua(id),
    };
  }

  private async ketThucTrongTransaction(
    tx: Prisma.TransactionClient,
    id: string,
    trangThaiMoi: TrangThaiDatChoTonKho,
    loaiLedger: LoaiGiaoDichTonKho,
    truOnHand: boolean,
    chiKhiHetHan: boolean,
  ): Promise<boolean> {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM inventory_reservation
        WHERE id = ${id}
        FOR UPDATE
      `,
    );

    if (locked.length !== 1) {
      throw new NotFoundException('Không tìm thấy inventory reservation.');
    }

    const reservation = await tx.datChoTonKho.findUniqueOrThrow({
      where: { id },
      include: {
        muc: {
          orderBy: {
            thuTu: 'asc',
          },
        },
      },
    });

    if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
      return false;
    }

    if (chiKhiHetHan && reservation.hetHanLuc.getTime() > Date.now()) {
      return false;
    }

    const mucTheoLockOrder = [...reservation.muc].sort((a, b) =>
      a.tonKhoLoId.localeCompare(b.tonKhoLoId),
    );

    // AGRIMARKET-V16-ORDER-SHIP-PXK-THEO-KHO
    // Một chứng từ xuất chỉ thuộc một kho nguồn. Reservation FEFO có thể
    // phân bổ cùng đơn qua nhiều kho, vì vậy phải group dòng PXK theo khoId.
    const dongPhieuXuatTheoKho = new Map<string, TaoDongPhieuKhoInput[]>();

    for (const muc of mucTheoLockOrder) {
      const rows = await tx.$queryRaw<InventoryCurrentRow[]>(
        Prisma.sql`
          SELECT
            id,
            kho_id AS khoId,
            on_hand AS onHand,
            reserved
          FROM inventory_lot
          WHERE id = ${muc.tonKhoLoId}
          FOR UPDATE
        `,
      );

      if (rows.length !== 1) {
        throw new NotFoundException('Inventory lot của reservation không còn tồn tại.');
      }

      const row = rows[0]!;
      const qty = Number(muc.soLuong);

      let reservedCanGiam = qty;

      if (chiKhiHetHan) {
        // Expiry cleanup phải fail-safe với dữ liệu stale từ lần chạy/test cũ.
        // Không được lấy reserved đang thuộc reservation còn sống hoặc DA_BAN.
        const protectedItems = await tx.mucDatChoTonKho.findMany({
          where: {
            tonKhoLoId: muc.tonKhoLoId,
            datChoTonKhoId: {
              not: reservation.id,
            },
            datChoTonKho: {
              OR: [
                {
                  trangThai: TrangThaiDatChoTonKho.DA_BAN,
                },
                {
                  trangThai: TrangThaiDatChoTonKho.DANG_GIU,
                  hetHanLuc: {
                    gt: new Date(),
                  },
                },
              ],
            },
          },
          select: {
            soLuong: true,
          },
        });

        const protectedQty = this.soLuong(
          protectedItems.reduce((sum, item) => sum + Number(item.soLuong), 0),
        );
        const coTheQuyChoExpired = this.soLuong(Math.max(0, Number(row.reserved) - protectedQty));

        reservedCanGiam = this.soLuong(Math.min(qty, coTheQuyChoExpired));
      } else if (Number(row.reserved) + 1e-9 < qty) {
        // Normal cancel/release vẫn strict để không che lỗi nghiệp vụ thật.
        throw new BadRequestException('Reserved inventory nhỏ hơn reservation item.');
      }

      if (truOnHand && Number(row.onHand) + 1e-9 < qty) {
        throw new BadRequestException('On-hand inventory nhỏ hơn reservation item.');
      }

      if (reservedCanGiam > 0 || truOnHand) {
        await tx.tonKhoLo.update({
          where: { id: muc.tonKhoLoId },
          data: {
            ...(reservedCanGiam > 0
              ? {
                  reserved: {
                    decrement: reservedCanGiam,
                  },
                }
              : {}),
            ...(truOnHand
              ? {
                  onHand: {
                    decrement: qty,
                  },
                }
              : {}),
          },
        });
      }

      const soLuongLedger = truOnHand ? qty : reservedCanGiam;
      const giaoDich =
        soLuongLedger > 0
          ? await tx.giaoDichTonKho.create({
              data: {
                tonKhoLoId: muc.tonKhoLoId,
                loai: loaiLedger,
                soLuong: soLuongLedger,
              },
            })
          : null;

      if (loaiLedger === LoaiGiaoDichTonKho.ORDER_SHIP) {
        if (!giaoDich) {
          throw new BadRequestException('ORDER_SHIP bắt buộc phải có inventory ledger.');
        }

        const dong = dongPhieuXuatTheoKho.get(row.khoId) ?? [];
        dong.push({
          tonKhoLoId: muc.tonKhoLoId,
          soLuong: qty,
          giaoDich: [{ id: giaoDich.id, vaiTro: 'XUAT_BAN' }],
        });
        dongPhieuXuatTheoKho.set(row.khoId, dong);
      }
    }

    if (loaiLedger === LoaiGiaoDichTonKho.ORDER_SHIP && dongPhieuXuatTheoKho.size > 0) {
      const maDonHang = reservation.maThamChieu.startsWith('ORDER:')
        ? reservation.maThamChieu.slice('ORDER:'.length)
        : null;
      const order = maDonHang
        ? await tx.donHang.findUnique({ where: { maDonHang }, select: { id: true } })
        : null;

      for (const [khoNguonId, dong] of [...dongPhieuXuatTheoKho.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        await this.phieuKhoWriter.taoTrongTransaction(tx, {
          loai: LoaiPhieuKho.XUAT,
          donHangId: order?.id ?? null,
          khoNguonId,
          maThamChieu: reservation.maThamChieu,
          lyDo: 'Xuất kho bán hàng',
          ghiChu:
            'PXK theo từng kho nguồn, tạo atomic cùng ORDER_SHIP ledger khi reservation chuyển DA_BAN.',
          dong,
        });
      }
    }

    await tx.datChoTonKho.update({
      where: { id },
      data: {
        trangThai: trangThaiMoi,
        ketThucLuc: new Date(),
      },
    });

    return true;
  }

  private async lockFefoRows(
    tx: Prisma.TransactionClient,
    bienTheSanPhamId: string,
  ): Promise<InventoryLockRow[]> {
    const homNay = this.homNay();

    const rows = await tx.$queryRaw<InventoryLockRow[]>(
      Prisma.sql`
        SELECT
          il.id AS id,
          il.kho_id AS khoId,
          k.ma_kho AS maKho,
          il.lo_san_pham_id AS loSanPhamId,
          lsp.ma_lo AS maLo,
          lsp.ngay_het_han AS ngayHetHan,
          il.bien_the_san_pham_id AS bienTheSanPhamId,
          il.on_hand AS onHand,
          il.reserved AS reserved,
          il.blocked AS blocked
        FROM inventory_lot il
        INNER JOIN kho k
          ON k.id = il.kho_id
        INNER JOIN lo_san_pham lsp
          ON lsp.id = il.lo_san_pham_id
        WHERE il.bien_the_san_pham_id = ${bienTheSanPhamId}
          AND il.on_hand > 0
          AND k.trang_thai = ${TrangThaiBanGhi.HOAT_DONG}
          AND lsp.trang_thai = ${TrangThaiLoSanPham.CO_THE_BAN}
          AND lsp.ngay_het_han >= ${homNay}
        ORDER BY
          lsp.ngay_het_han ASC,
          lsp.ma_lo ASC,
          k.ma_kho ASC,
          il.created_at ASC,
          il.id ASC
        FOR UPDATE
      `,
    );

    if (rows.length === 0) {
      throw new BadRequestException('Không có tồn kho hợp lệ để reservation.');
    }

    return rows;
  }

  private async layKetQua(id: string): Promise<KetQuaDatChoTonKho> {
    const reservation = await this.prisma.datChoTonKho.findUnique({
      where: { id },
      include: {
        muc: {
          orderBy: {
            thuTu: 'asc',
          },
          include: {
            tonKhoLo: {
              include: {
                kho: true,
                loSanPham: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Không tìm thấy inventory reservation.');
    }

    return {
      id: reservation.id,
      maThamChieu: reservation.maThamChieu,
      trangThai: reservation.trangThai,
      hetHanLuc: reservation.hetHanLuc,
      ketThucLuc: reservation.ketThucLuc,
      phanBo: reservation.muc.map((muc) => ({
        tonKhoLoId: muc.tonKhoLoId,
        khoId: muc.tonKhoLo.khoId,
        maKho: muc.tonKhoLo.kho.maKho,
        loSanPhamId: muc.tonKhoLo.loSanPhamId,
        maLo: muc.tonKhoLo.loSanPham.maLo,
        ngayHetHan: muc.tonKhoLo.loSanPham.ngayHetHan.toISOString().slice(0, 10),
        bienTheSanPhamId: muc.tonKhoLo.bienTheSanPhamId,
        soLuong: Number(muc.soLuong),
      })),
    };
  }

  private async lenLichHetHan(id: string, hetHanLuc: Date): Promise<void> {
    const delay = Math.max(0, hetHanLuc.getTime() - Date.now());

    const options: JobsOptions = {
      delay,
      jobId: `het-han-${id}`,
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 500,
      },
    };

    await this.queue.add(
      TEN_CONG_VIEC_HET_HAN_DAT_CHO_TON_KHO,
      {
        datChoTonKhoId: id,
      },
      options,
    );
  }

  private chuanHoaThamChieu(value: string): string {
    const normalized = value.trim();

    if (normalized.length < 1 || normalized.length > 191) {
      throw new BadRequestException('Mã tham chiếu reservation phải dài 1-191 ký tự.');
    }

    return normalized;
  }

  private chuanHoaItems(items: YeuCauDatChoTonKhoItem[]): YeuCauDatChoTonKhoItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Reservation phải có ít nhất một item.');
    }

    const merged = new Map<string, number>();

    for (const item of items) {
      const id = item.bienTheSanPhamId.trim();
      if (!id) {
        throw new BadRequestException('bienTheSanPhamId không được trống.');
      }

      const soLuong = this.chuanHoaSoLuong(item.soLuong);
      merged.set(id, this.soLuong((merged.get(id) ?? 0) + soLuong));
    }

    return [...merged.entries()]
      .map(([bienTheSanPhamId, soLuong]) => ({
        bienTheSanPhamId,
        soLuong,
      }))
      .sort((a, b) => a.bienTheSanPhamId.localeCompare(b.bienTheSanPhamId));
  }

  private chuanHoaTtl(value?: number): number {
    const ttl = value ?? TTL_DAT_CHO_MAC_DINH_MS;

    if (!Number.isInteger(ttl) || ttl < 50 || ttl > 60 * 60 * 1000) {
      throw new BadRequestException('TTL reservation phải là số nguyên từ 50ms đến 1 giờ.');
    }

    return ttl;
  }

  private chuanHoaSoLuong(value: number): number {
    if (!Number.isFinite(value) || value <= 0 || value > 99999999999.999) {
      throw new BadRequestException('Số lượng reservation phải > 0 và <= 99999999999.999.');
    }

    const normalized = this.soLuong(value);
    if (Math.abs(value - normalized) > 1e-9) {
      throw new BadRequestException('Số lượng reservation tối đa 3 chữ số thập phân.');
    }

    return normalized;
  }

  private soLuong(value: number): number {
    return Number(value.toFixed(3));
  }

  private homNay(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
