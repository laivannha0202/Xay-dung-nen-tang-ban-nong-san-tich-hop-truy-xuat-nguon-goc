import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
  TrangThaiVanChuyen,
} from '../../generated/prisma/client';

import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import { homNay, lamTronSoLuong } from '../common/tien-te.util';
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
  // AGRIMARKET-FIX01B-RESERVED-RECONCILE
  private readonly logger = new Logger(DatChoTonKhoService.name);

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

    const hetHanLuc = new Date(Date.now() + ttlMs);

    const reservationId = await this.prisma.$transaction(
      async (tx) => {
        const daCo = await tx.datChoTonKho.findUnique({
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
            return daCo.id;
          }

          throw new BadRequestException('Mã tham chiếu giữ hàng đã được sử dụng.');
        }

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
        'Không lên lịch được thời gian giữ hàng; đã giải phóng tồn kho đã giữ.',
        {
          cause: error,
        },
      );
    }

    return this.layKetQua(reservationId);
  }

  /**
   * Payment/COD chỉ xác nhận quyền giữ hàng cho Order.
   * Không giảm onHand, không tạo ORDER_SHIP, không tạo PXK.
   * Reservation đã DA_XAC_NHAN không còn bị TTL worker hết hạn.
   */
  async xacNhanThanhToan(id: string): Promise<KetQuaDatChoTonKho> {
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
          throw new NotFoundException('Không tìm thấy thông tin giữ hàng.');
        }

        const reservation = await tx.datChoTonKho.findUniqueOrThrow({
          where: { id },
          select: {
            trangThai: true,
          },
        });

        if (
          reservation.trangThai === TrangThaiDatChoTonKho.DA_XAC_NHAN ||
          reservation.trangThai === TrangThaiDatChoTonKho.DA_BAN
        ) {
          return;
        }

        if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
          throw new ConflictException(
            'Trạng thái giữ hàng của đơn đã thay đổi nên chưa thể xác nhận. Vui lòng tải lại và thử lại, nếu cần hãy liên hệ tổng đài AgriMarket để được hỗ trợ.',
          );
        }

        await tx.datChoTonKho.update({
          where: { id },
          data: {
            trangThai: TrangThaiDatChoTonKho.DA_XAC_NHAN,
            xacNhanLuc: new Date(),
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
          throw new NotFoundException('Không tìm thấy thông tin giữ hàng.');
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
            'Trạng thái giữ hàng của đơn đã thay đổi nên chưa thể xác nhận. Vui lòng tải lại và thử lại, nếu cần hãy liên hệ tổng đài AgriMarket để được hỗ trợ.',
          );
        }

        if (reservation.hetHanLuc.getTime() <= Date.now()) {
          throw new BadRequestException('Thời gian giữ hàng của đơn đã hết trước khi thanh toán được xác nhận. Vui lòng đặt lại đơn hoặc liên hệ tổng đài AgriMarket để được hỗ trợ.');
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
    vanChuyenId: string,
  ): Promise<boolean> {
    const suborder = await tx.donHangNhaCungCap.findUnique({
      where: { id: donHangNhaCungCapId },
      select: {
        id: true,
        maDon: true,
        donHang: { select: { id: true, maDonHang: true } },
        muc: {
          select: {
            phanBo: {
              select: { tonKhoLoId: true, soLuong: true },
            },
          },
        },
      },
    });

    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để xuất kho.');
    }

    const shipment = await tx.vanChuyen.findFirst({
      where: {
        id: vanChuyenId,
        donHangNhaCungCapId,
        trangThai: TrangThaiVanChuyen.PICKED_UP,
      },
      select: { id: true },
    });
    if (!shipment) {
      throw new BadRequestException(
        'Shipment phải thuộc đúng đơn nhà cung cấp và ở PICKED_UP trước khi xuất kho.',
      );
    }

    const reservation = await tx.datChoTonKho.findUnique({
      where: { maThamChieu: `ORDER:${suborder.donHang.maDonHang}` },
      select: { id: true, trangThai: true },
    });
    // AGRIMARKET-P0-PICKED-UP: xuất kho vật lý là thời điểm inventory commit.
    // Reservation thực tế chỉ tới DA_XAC_NHAN sau payment/COD commit (không đường
    // production nào set DA_BAN trước shipment); DA_BAN được flip nguyên tử ngay
    // sau khi dispatch thành công bên dưới. DA_BAN seed trực tiếp (E2E/test) vẫn
    // đi đường cũ không đổi.
    if (
      !reservation ||
      (reservation.trangThai !== TrangThaiDatChoTonKho.DA_BAN &&
        reservation.trangThai !== TrangThaiDatChoTonKho.DA_XAC_NHAN)
    ) {
      throw new BadRequestException(
        'Đơn chưa có inventory commit hợp lệ; không thể xuất kho vật lý.',
      );
    }

    const maThamChieu = `SHIP:${vanChuyenId}`;
    const daCoPhieu = await tx.phieuKho.count({
      where: { maThamChieu, loai: LoaiPhieuKho.XUAT },
    });
    if (daCoPhieu > 0) return false;

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

    type LotXuat = {
      id: string;
      khoId: string;
      onHand: Prisma.Decimal;
      reserved: Prisma.Decimal;
      blocked: Prisma.Decimal;
      qty: number;
    };

    // Khoá tất cả lot trong MỘT câu lệnh thay vì N câu lệnh tuần tự.
    // `ORDER BY id` để thứ tự khoá cố định, tránh deadlock giữa hai phiên
    // đặt hàng song song.
    const lotIds = [...tongTheoTonKho.keys()].sort();
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        khoId: string;
        onHand: Prisma.Decimal;
        reserved: Prisma.Decimal;
        blocked: Prisma.Decimal;
      }>
    >(Prisma.sql`
      SELECT id, kho_id AS khoId, on_hand AS onHand, reserved, blocked
      FROM inventory_lot
      WHERE id IN (${Prisma.join(lotIds)})
      ORDER BY id
      FOR UPDATE
    `);
    const rowTheoId = new Map(rows.map((row) => [row.id, row]));
    if (rowTheoId.size !== lotIds.length) {
      throw new NotFoundException('Lô tồn kho của phân bổ đơn hàng không còn tồn tại.');
    }

    const lots: LotXuat[] = [];
    for (const tonKhoLoId of lotIds) {
      const qty = tongTheoTonKho.get(tonKhoLoId)!;
      const row = rowTheoId.get(tonKhoLoId)!;
      if (Number(row.onHand) + 1e-9 < qty) {
        throw new BadRequestException('Tồn kho khả dụng nhỏ hơn phân bổ khi xuất kho.');
      }
      lots.push({ ...row, qty });
    }

    const xuatTuReserved = lots.every((row) => Number(row.reserved) + 1e-9 >= row.qty);

    if (!xuatTuReserved) {
      const dangCoHangCachLy = lots.some((row) => Number(row.blocked) + 1e-9 >= row.qty);
      if (dangCoHangCachLy) {
        throw new BadRequestException(
          'Hàng hoàn đang ở blocked/cách ly; phải QC và tái giữ chỗ trước khi giao lại.',
        );
      }
      throw new BadRequestException(
        'Reserved inventory nhỏ hơn allocation khi xuất shipment hiện tại.',
      );
    }

    const dongTheoKho = new Map<string, TaoDongPhieuKhoInput[]>();
    for (const row of lots) {
      await tx.tonKhoLo.update({
        where: { id: row.id },
        data: {
          onHand: { decrement: row.qty },
          reserved: { decrement: row.qty },
        },
      });

      const giaoDich = await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: row.id,
          loai: LoaiGiaoDichTonKho.ORDER_SHIP,
          soLuong: row.qty,
        },
      });

      const dong = dongTheoKho.get(row.khoId) ?? [];
      dong.push({
        tonKhoLoId: row.id,
        soLuong: row.qty,
        giaoDich: [
          {
            id: giaoDich.id,
            vaiTro: 'XUAT_BAN',
          },
        ],
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
        ghiChu:
          'ORDER_SHIP chỉ tiêu thụ inventory đã reserved; hàng blocked phải QC/tái giữ chỗ trước khi giao lại.',
        dong,
      });
    }

    // Dispatch đã trừ tồn đúng lot FEFO + ghi ORDER_SHIP + PXK SHIP: ở trên.
    // Flip DA_XAC_NHAN -> DA_BAN (chỉ đổi state, KHÔNG động tồn/ledger nữa) để
    // reservation phản ánh inventory commit; DA_BAN chặn release thường và là
    // điều kiện các bước sau (RETURNED/QC). Idempotent theo shipment (daCoPhieu).
    if (reservation.trangThai === TrangThaiDatChoTonKho.DA_XAC_NHAN) {
      await tx.datChoTonKho.update({
        where: { id: reservation.id },
        data: {
          trangThai: TrangThaiDatChoTonKho.DA_BAN,
          ketThucLuc: new Date(),
        },
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
              select: { tonKhoLoId: true, soLuong: true },
            },
          },
        },
      },
    });
    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để nhập hàng hoàn.');
    }

    const shipment = await tx.vanChuyen.findFirst({
      where: {
        id: vanChuyenId,
        donHangNhaCungCapId,
        trangThai: TrangThaiVanChuyen.RETURNED,
      },
      select: { id: true },
    });
    if (!shipment) {
      throw new BadRequestException(
        'Shipment phải thuộc đúng đơn nhà cung cấp và ở RETURNED trước khi nhập hàng hoàn.',
      );
    }

    const maThamChieuXuat = `SHIP:${vanChuyenId}`;
    const maThamChieuXuatLegacy = `SHIP:${suborder.maDon}`;
    const daXuat = await tx.phieuKho.count({
      where: {
        loai: LoaiPhieuKho.XUAT,
        OR: [{ maThamChieu: maThamChieuXuat }, { maThamChieu: maThamChieuXuatLegacy }],
      },
    });
    if (daXuat === 0) {
      throw new BadRequestException(
        'Không thể nhập hàng hoàn khi chính shipment chưa có PXK xuất giao.',
      );
    }

    const maThamChieu = `RETURN:${vanChuyenId}`;
    const daCoPhieu = await tx.phieuKho.count({
      where: { maThamChieu, loai: LoaiPhieuKho.NHAP },
    });
    if (daCoPhieu > 0) return false;

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
    // Khoá tất cả lot trong MỘT câu lệnh thay vì N câu lệnh tuần tự.
    const lotIds = [...tongTheoTonKho.keys()].sort();
    const rows = await tx.$queryRaw<Array<{ id: string; khoId: string }>>(Prisma.sql`
      SELECT id, kho_id AS khoId
      FROM inventory_lot
      WHERE id IN (${Prisma.join(lotIds)})
      ORDER BY id
      FOR UPDATE
    `);
    const rowTheoId = new Map(rows.map((row) => [row.id, row]));
    if (rowTheoId.size !== lotIds.length) {
      throw new NotFoundException('Lô tồn kho của hàng hoàn không còn tồn tại.');
    }

    for (const tonKhoLoId of lotIds) {
      const qty = tongTheoTonKho.get(tonKhoLoId)!;
      const row = rowTheoId.get(tonKhoLoId)!;

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
        ghiChu:
          'RETURN_IN theo từng shipment; onHand và blocked cùng tăng nên available không tăng.',
        dong,
      });
    }

    return true;
  }

  /**
   * V12 - Returned stock QC.
   * PASS: blocked giam, available tang (khong giam onHand).
   * DAMAGE/EXPIRE: blocked giam, onHand giam, movement tuong ung.
   */
  async kiemTraChatLuongLoTrongTransaction(
    tx: Prisma.TransactionClient,
    tonKhoLoId: string,
    soLuong: number,
    quyetDinh: 'PASS' | 'DAMAGE' | 'EXPIRE',
    lyDo: string,
    nguoiThucHienId: string,
  ): Promise<{ daThayDoi: boolean; maThamChieu: string }> {
    const qty = this.soLuong(soLuong);
    if (qty <= 0) {
      throw new BadRequestException('So luong QC phai > 0.');
    }

    const rows = await tx.$queryRaw<
      Array<{ id: string; khoId: string; onHand: number; blocked: number }>
    >(
      Prisma.sql`
        SELECT id, kho_id AS khoId, on_hand AS onHand, blocked
        FROM inventory_lot
        WHERE id = ${tonKhoLoId}
        FOR UPDATE
      `,
    );
    if (rows.length !== 1) {
      throw new NotFoundException('Khong tim thay lo ton kho de kiem tra chat luong.');
    }
    const row = rows[0]!;
    if (Number(row.blocked) + 1e-9 < qty) {
      throw new BadRequestException('So luong blocked khong du de kiem tra chat luong.');
    }

    const maThamChieu = `QC:${tonKhoLoId}:${Date.now()}`;
    const daCoPhieu = await tx.phieuKho.count({
      where: { maThamChieu },
    });
    if (daCoPhieu > 0) {
      return { daThayDoi: false, maThamChieu };
    }

    let loaiGiaoDich: LoaiGiaoDichTonKho;
    let giamOnHand = false;
    if (quyetDinh === 'PASS') {
      loaiGiaoDich = LoaiGiaoDichTonKho.QC_PASS;
      giamOnHand = false;
      // Ledger sign convention: QC_PASS releases blocked inventory back to available
      // without touching onHand. Positive soLuong records the quantity moving out of blocked.
    } else if (quyetDinh === 'DAMAGE') {
      loaiGiaoDich = LoaiGiaoDichTonKho.DAMAGE;
      giamOnHand = true;
    } else {
      loaiGiaoDich = LoaiGiaoDichTonKho.EXPIRE;
      giamOnHand = true;
    }

    await tx.tonKhoLo.update({
      where: { id: row.id },
      data: {
        blocked: { decrement: qty },
        ...(giamOnHand ? { onHand: { decrement: qty } } : {}),
      },
    });

    const giaoDichId = (
      await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: row.id,
          loai: loaiGiaoDich,
          soLuong: qty,
        },
      })
    ).id;

    const lyDoPhieu =
      quyetDinh === 'PASS'
        ? 'QC passed: released tu blocked sang available'
        : quyetDinh === 'DAMAGE'
          ? 'QC failed: damage'
          : 'QC failed: expire';

    await this.phieuKhoWriter.taoTrongTransaction(tx, {
      loai: LoaiPhieuKho.DIEU_CHINH,
      donHangId: null,
      khoNguonId: row.khoId,
      maThamChieu,
      lyDo: lyDoPhieu,
      ghiChu: `QC decision ${quyetDinh}: ${lyDo}`,
      nguoiLapId: nguoiThucHienId,
      dong: [
        {
          tonKhoLoId: row.id,
          soLuong: qty,
          giaoDich: [
            {
              id: giaoDichId,
              vaiTro: quyetDinh === 'PASS' ? 'QC_PASS' : `QC_${quyetDinh}`,
            },
          ],
        },
      ],
    });

    return { daThayDoi: true, maThamChieu };
  }

  /**
   * Physical dispatch trong transaction shipment.
   * Chỉ hợp lệ khi Payment/COD đã commit reservation (DA_XAC_NHAN).
   * Nếu đã DA_BAN thì coi là idempotent; trạng thái khác là xung đột nghiệp vụ.
   */
  async xacNhanDaBanTrongTransaction(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<boolean> {
    const changed = await this.ketThucTrongTransaction(
      tx,
      id,
      TrangThaiDatChoTonKho.DA_BAN,
      LoaiGiaoDichTonKho.ORDER_SHIP,
      true,
      false,
    );

    if (changed) {
      return true;
    }

    const current = await tx.datChoTonKho.findUnique({
      where: { id },
      select: { trangThai: true },
    });

    if (current?.trangThai === TrangThaiDatChoTonKho.DA_BAN) {
      return false;
    }

    throw new ConflictException(
      `Không thể ORDER_SHIP reservation từ trạng thái ${current?.trangThai ?? 'KHONG_TON_TAI'}.`,
    );
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
      throw new NotFoundException('Không tìm thấy thông tin giữ hàng.');
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

    const trangThaiChoPhep = new Set<TrangThaiDatChoTonKho>(
      trangThaiMoi === TrangThaiDatChoTonKho.DA_BAN
        ? [TrangThaiDatChoTonKho.DA_XAC_NHAN]
        : chiKhiHetHan
          ? [TrangThaiDatChoTonKho.DANG_GIU]
          : [
              TrangThaiDatChoTonKho.DANG_GIU,
              TrangThaiDatChoTonKho.DA_XAC_NHAN,
            ],
    );

    if (!trangThaiChoPhep.has(reservation.trangThai)) {
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
        throw new NotFoundException('Lô tồn kho của giữ hàng không còn tồn tại.');
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
        throw new BadRequestException('Số lượng đang giữ nhỏ hơn chi tiết giữ hàng.');
      }

      if (truOnHand && Number(row.onHand) + 1e-9 < qty) {
        throw new BadRequestException('Tồn kho khả dụng nhỏ hơn chi tiết giữ hàng.');
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
          throw new BadRequestException('Xuất kho giao hàng bắt buộc phải có sổ tồn kho.');
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

  /**
   * Tổng reserved chuẩn = tổng item thuộc reservation còn ACTIVE.
   * DANG_GIU: checkout chưa commit payment.
   * DA_XAC_NHAN: payment/COD đã commit quyền giữ hàng, chưa physical shipment.
   */
  private async tinhReservedHoatDongTrongTransaction(
    tx: Prisma.TransactionClient,
    tonKhoLoId: string,
  ): Promise<number> {
    const rows = await tx.$queryRaw<Array<{ reservedKyVong: Prisma.Decimal }>>(
      Prisma.sql`
        SELECT COALESCE(SUM(item.so_luong), 0) AS reservedKyVong
        FROM inventory_reservation_item AS item
        INNER JOIN inventory_reservation AS reservation
          ON reservation.id = item.dat_cho_ton_kho_id
        WHERE item.ton_kho_lo_id = ${tonKhoLoId}
          AND reservation.trang_thai IN ('DANG_GIU', 'DA_XAC_NHAN')
      `,
    );

    return this.soLuong(Number(rows[0]?.reservedKyVong ?? 0));
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
        LEFT JOIN thu_hoi_lo_san_pham thlsp
          ON thlsp.lo_san_pham_id = lsp.id
        -- AGRIMARKET-TRACEABILITY: FEFO chỉ được nhìn lô cùng nguồn với sản phẩm.
        -- Defense-in-depth cho TonKhoLo cross-farm đã tồn tại từ DB cũ / dữ liệu lỗi:
        -- sp.trang_trai_id = mv.trang_trai_id  <=>  variant.product.farm = batch.harvest.season.farm
        INNER JOIN bien_the_san_pham btsp
          ON btsp.id = il.bien_the_san_pham_id
        INNER JOIN san_pham sp
          ON sp.id = btsp.san_pham_id
        INNER JOIN thu_hoach th
          ON th.id = lsp.thu_hoach_id
        INNER JOIN mua_vu mv
          ON mv.id = th.mua_vu_id
        WHERE il.bien_the_san_pham_id = ${bienTheSanPhamId}
          AND sp.trang_trai_id = mv.trang_trai_id
          AND il.on_hand > 0
          AND k.trang_thai = ${TrangThaiBanGhi.HOAT_DONG}
          AND lsp.trang_thai = ${TrangThaiLoSanPham.CO_THE_BAN}
          AND lsp.ngay_het_han >= ${homNay}
          AND thlsp.id IS NULL
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
      throw new BadRequestException('Không có tồn kho hợp lệ để giữ hàng.');
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
      throw new NotFoundException('Không tìm thấy thông tin giữ hàng.');
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
      throw new BadRequestException('Mã tham chiếu giữ hàng phải dài 1-191 ký tự.');
    }

    return normalized;
  }

  private chuanHoaItems(items: YeuCauDatChoTonKhoItem[]): YeuCauDatChoTonKhoItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Giữ hàng phải có ít nhất một mặt hàng.');
    }

    const merged = new Map<string, number>();

    for (const item of items) {
      const id = item.bienTheSanPhamId.trim();
      if (!id) {
        throw new BadRequestException('Thiếu thông tin biến thể sản phẩm khi giữ hàng.');
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
      throw new BadRequestException('Thời gian giữ hàng phải là số nguyên từ 50ms đến 1 giờ.');
    }

    return ttl;
  }

  private chuanHoaSoLuong(value: number): number {
    if (!Number.isFinite(value) || value <= 0 || value > 99999999999.999) {
      throw new BadRequestException('Số lượng giữ hàng phải > 0 và <= 99999999999.999.');
    }

    const normalized = this.soLuong(value);
    if (Math.abs(value - normalized) > 1e-9) {
      throw new BadRequestException('Số lượng giữ hàng tối đa 3 chữ số thập phân.');
    }

    return normalized;
  }

  private soLuong(value: number): number {
    return lamTronSoLuong(value);
  }

  private homNay(): Date {
    return homNay();
  }
}
