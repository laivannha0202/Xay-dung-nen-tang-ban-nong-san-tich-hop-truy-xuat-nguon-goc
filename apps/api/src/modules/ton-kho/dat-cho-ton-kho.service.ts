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
  Prisma,
  TrangThaiBanGhi,
  TrangThaiDatChoTonKho,
  TrangThaiLoSanPham,
} from '../../generated/prisma/client';

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
  ) {}

  async datCho(dto: YeuCauDatChoTonKho): Promise<KetQuaDatChoTonKho> {
    await this.giaiPhongHetHanDaQua();

    const maThamChieu = this.chuanHoaThamChieu(dto.maThamChieu);
    const items = this.chuanHoaItems(dto.items);
    const ttlMs = this.chuanHoaTtl(dto.ttlMs);

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

  async xacNhanDaBan(id: string): Promise<KetQuaDatChoTonKho> {
    return (
      await this.ketThuc(
        id,
        TrangThaiDatChoTonKho.DA_BAN,
        LoaiGiaoDichTonKho.ORDER_SHIP,
        true,
        false,
      )
    ).ketQua;
  }

  async hetHan(id: string): Promise<KetQuaDatChoTonKho> {
    return (
      await this.ketThuc(
        id,
        TrangThaiDatChoTonKho.HET_HAN,
        LoaiGiaoDichTonKho.ORDER_RELEASE,
        false,
        true,
      )
    ).ketQua;
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
        count += 1;
      }
    }

    return count;
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

    for (const muc of mucTheoLockOrder) {
      const rows = await tx.$queryRaw<InventoryCurrentRow[]>(
        Prisma.sql`
          SELECT
            id,
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

      if (Number(row.reserved) + 1e-9 < qty) {
        throw new BadRequestException('Reserved inventory nhỏ hơn reservation item.');
      }

      if (truOnHand && Number(row.onHand) + 1e-9 < qty) {
        throw new BadRequestException('On-hand inventory nhỏ hơn reservation item.');
      }

      await tx.tonKhoLo.update({
        where: { id: muc.tonKhoLoId },
        data: {
          reserved: {
            decrement: qty,
          },
          ...(truOnHand
            ? {
                onHand: {
                  decrement: qty,
                },
              }
            : {}),
        },
      });

      await tx.giaoDichTonKho.create({
        data: {
          tonKhoLoId: muc.tonKhoLoId,
          loai: loaiLedger,
          soLuong: qty,
        },
      });
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
