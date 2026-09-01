import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiDonHang } from '../../generated/prisma/client';

import type { PhanHoiDongGoiDto } from './dto/phan-hoi-dong-goi.dto';
import type { XacNhanDongGoiDto } from './dto/xac-nhan-dong-goi.dto';
import {
  coTheChuyenTrangThaiDonHang059,
  validateChuyenTrangThaiDonHang059,
} from './may-trang-thai-don-hang';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

const DONG_GOI_INCLUDE = {
  donHang: {
    select: {
      id: true,
      maDonHang: true,
      trangThai: true,
    },
  },
  nhaCungCap: {
    select: {
      ten: true,
    },
  },
  muc: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      phanBo: {
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          tonKhoLo: {
            select: {
              id: true,
              bienTheSanPhamId: true,
              loSanPhamId: true,
              kho: {
                select: {
                  maKho: true,
                },
              },
              loSanPham: {
                select: {
                  maLo: true,
                  maTruyXuat: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.DonHangNhaCungCapInclude;

type DuLieuDongGoi = Prisma.DonHangNhaCungCapGetPayload<{
  include: typeof DONG_GOI_INCLUDE;
}>;

const DA_QUA_DONG_GOI = new Set<TrangThaiDonHang>([
  TrangThaiDonHang.DA_DONG_GOI,
  TrangThaiDonHang.DANG_GIAO,
  TrangThaiDonHang.DA_GIAO,
  TrangThaiDonHang.HOAN_THANH,
]);

@Injectable()
export class DongGoiService {
  constructor(private readonly prisma: PrismaService) {}

  async layChecklist(donNhaCungCapId: string): Promise<PhanHoiDongGoiDto> {
    const suborder = await this.prisma.donHangNhaCungCap.findUnique({
      where: { id: donNhaCungCapId },
      include: DONG_GOI_INCLUDE,
    });
    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để đóng gói.');
    }
    return this.phanHoi(suborder);
  }

  async batDau(
    tacNhanId: string,
    donNhaCungCapId: string,
    metadata: MetadataAudit,
  ): Promise<PhanHoiDongGoiDto> {
    const actor = await this.layActor(tacNhanId);
    await this.prisma.$transaction(
      async (tx) => {
        const suborder = await tx.donHangNhaCungCap.findUnique({
          where: { id: donNhaCungCapId },
          select: {
            id: true,
            maDon: true,
            donHangId: true,
            trangThai: true,
            donHang: { select: { trangThai: true } },
          },
        });
        if (!suborder) {
          throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để đóng gói.');
        }
        if (
          suborder.trangThai === TrangThaiDonHang.DANG_CHUAN_BI ||
          DA_QUA_DONG_GOI.has(suborder.trangThai)
        ) {
          return;
        }

        this.validateTransition(suborder.trangThai, TrangThaiDonHang.DANG_CHUAN_BI);

        if (suborder.donHang.trangThai === TrangThaiDonHang.DA_XAC_NHAN) {
          this.validateTransition(suborder.donHang.trangThai, TrangThaiDonHang.DANG_CHUAN_BI);
          const parentChanged = await tx.donHang.updateMany({
            where: {
              id: suborder.donHangId,
              trangThai: TrangThaiDonHang.DA_XAC_NHAN,
            },
            data: { trangThai: TrangThaiDonHang.DANG_CHUAN_BI },
          });
          if (parentChanged.count !== 1) {
            throw new ConflictException('Trạng thái đơn cha đã thay đổi, hãy tải lại.');
          }
        } else if (suborder.donHang.trangThai !== TrangThaiDonHang.DANG_CHUAN_BI) {
          throw new ConflictException(
            `Đơn cha phải ở DA_XAC_NHAN hoặc DANG_CHUAN_BI, hiện là ${suborder.donHang.trangThai}.`,
          );
        }

        const changed = await tx.donHangNhaCungCap.updateMany({
          where: {
            id: suborder.id,
            trangThai: TrangThaiDonHang.DA_XAC_NHAN,
          },
          data: { trangThai: TrangThaiDonHang.DANG_CHUAN_BI },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Trạng thái đơn nhà cung cấp đã thay đổi, hãy tải lại.');
        }

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'DON_HANG_BAT_DAU_DONG_GOI',
            thucThe: 'supplier_order',
            thucTheId: suborder.id,
            truoc: { trangThai: suborder.trangThai },
            sau: { trangThai: TrangThaiDonHang.DANG_CHUAN_BI },
            metadata,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
    return this.layChecklist(donNhaCungCapId);
  }

  async hoanTat(
    tacNhanId: string,
    donNhaCungCapId: string,
    dto: XacNhanDongGoiDto,
    metadata: MetadataAudit,
  ): Promise<PhanHoiDongGoiDto> {
    this.xacNhanExactChecklist(dto);
    const actor = await this.layActor(tacNhanId);

    await this.prisma.$transaction(
      async (tx) => {
        const suborder = await tx.donHangNhaCungCap.findUnique({
          where: { id: donNhaCungCapId },
          include: DONG_GOI_INCLUDE,
        });
        if (!suborder) {
          throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để đóng gói.');
        }
        if (DA_QUA_DONG_GOI.has(suborder.trangThai)) {
          return;
        }

        this.validateTransition(suborder.trangThai, TrangThaiDonHang.DA_DONG_GOI);
        if (suborder.donHang.trangThai !== TrangThaiDonHang.DANG_CHUAN_BI) {
          throw new ConflictException(
            `Đơn cha phải ở DANG_CHUAN_BI trước khi hoàn tất đóng gói, hiện là ${suborder.donHang.trangThai}.`,
          );
        }

        const danhGia = this.danhGia(suborder);
        if (!danhGia.dungSanPham) {
          throw new BadRequestException('Order allocation không khớp sản phẩm/biến thể đã đặt.');
        }
        if (!danhGia.dungBatch) {
          throw new BadRequestException('Đơn hàng thiếu batch allocation để đóng gói.');
        }
        if (!danhGia.dungQty) {
          throw new BadRequestException('Số lượng allocation không khớp số lượng OrderItem.');
        }
        if (!danhGia.qr) {
          throw new BadRequestException('Có batch chưa có QR Code; chưa thể hoàn tất đóng gói.');
        }

        const changed = await tx.donHangNhaCungCap.updateMany({
          where: {
            id: suborder.id,
            trangThai: TrangThaiDonHang.DANG_CHUAN_BI,
          },
          data: { trangThai: TrangThaiDonHang.DA_DONG_GOI },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Trạng thái đơn nhà cung cấp đã thay đổi, hãy tải lại.');
        }

        const chuaDongGoi = await tx.donHangNhaCungCap.count({
          where: {
            donHangId: suborder.donHangId,
            id: { not: suborder.id },
            trangThai: {
              notIn: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
                TrangThaiDonHang.DA_GIAO,
                TrangThaiDonHang.HOAN_THANH,
              ],
            },
          },
        });

        if (chuaDongGoi === 0) {
          this.validateTransition(suborder.donHang.trangThai, TrangThaiDonHang.DA_DONG_GOI);
          const parentChanged = await tx.donHang.updateMany({
            where: {
              id: suborder.donHangId,
              trangThai: TrangThaiDonHang.DANG_CHUAN_BI,
            },
            data: { trangThai: TrangThaiDonHang.DA_DONG_GOI },
          });
          if (parentChanged.count !== 1) {
            throw new ConflictException('Trạng thái đơn cha đã thay đổi, hãy tải lại.');
          }
        }

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'DON_HANG_HOAN_TAT_DONG_GOI',
            thucThe: 'supplier_order',
            thucTheId: suborder.id,
            truoc: { trangThai: suborder.trangThai },
            sau: {
              trangThai: TrangThaiDonHang.DA_DONG_GOI,
              checklist: {
                dungSanPham: true,
                dungBatch: true,
                dungQty: true,
                dongGoi: true,
                qr: true,
              },
            },
            metadata,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );
    return this.layChecklist(donNhaCungCapId);
  }

  private validateTransition(tu: TrangThaiDonHang, den: TrangThaiDonHang): void {
    if (!coTheChuyenTrangThaiDonHang059(tu, den)) {
      throw new ConflictException(`Không thể chuyển trạng thái từ ${tu} sang ${den}.`);
    }
    validateChuyenTrangThaiDonHang059(tu, den);
  }

  private async layActor(tacNhanId: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: tacNhanId },
      select: { id: true, email: true },
    });
    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân đóng gói.');
    }
    return actor;
  }

  private xacNhanExactChecklist(dto: XacNhanDongGoiDto): void {
    if (!dto.dungSanPham || !dto.dungBatch || !dto.dungQty || !dto.dongGoi || !dto.qr) {
      throw new BadRequestException(
        'Phải xác nhận đủ checklist: đúng sản phẩm, đúng batch, đúng qty, đóng gói, QR.',
      );
    }
  }

  private danhGia(suborder: DuLieuDongGoi) {
    const dungBatch =
      suborder.muc.length > 0 && suborder.muc.every((item) => item.phanBo.length > 0);
    const dungSanPham =
      dungBatch &&
      suborder.muc.every((item) =>
        item.phanBo.every(
          (allocation) => allocation.tonKhoLo.bienTheSanPhamId === item.bienTheSanPhamId,
        ),
      );
    const dungQty =
      dungBatch &&
      suborder.muc.every((item) => {
        const tong = item.phanBo.reduce((sum, allocation) => sum + Number(allocation.soLuong), 0);
        return Math.abs(tong - item.soLuong) <= 1e-9;
      });
    const qr =
      dungBatch &&
      suborder.muc.every((item) =>
        item.phanBo.every((allocation) => Boolean(allocation.tonKhoLo.loSanPham.maTruyXuat)),
      );
    return {
      dungSanPham,
      dungBatch,
      dungQty,
      dongGoi: DA_QUA_DONG_GOI.has(suborder.trangThai),
      qr,
    };
  }

  private phanHoi(suborder: DuLieuDongGoi): PhanHoiDongGoiDto {
    const danhGia = this.danhGia(suborder);
    return {
      donNhaCungCapId: suborder.id,
      maDonNhaCungCap: suborder.maDon,
      donHangId: suborder.donHang.id,
      maDonHang: suborder.donHang.maDonHang,
      tenNhaCungCap: suborder.nhaCungCap.ten,
      trangThaiDonHang: suborder.donHang.trangThai,
      trangThaiDonNhaCungCap: suborder.trangThai,
      coTheBatDau:
        suborder.trangThai === TrangThaiDonHang.DA_XAC_NHAN &&
        (suborder.donHang.trangThai === TrangThaiDonHang.DA_XAC_NHAN ||
          suborder.donHang.trangThai === TrangThaiDonHang.DANG_CHUAN_BI),
      coTheHoanTat:
        suborder.trangThai === TrangThaiDonHang.DANG_CHUAN_BI &&
        suborder.donHang.trangThai === TrangThaiDonHang.DANG_CHUAN_BI &&
        danhGia.dungSanPham &&
        danhGia.dungBatch &&
        danhGia.dungQty &&
        danhGia.qr,
      checklist: [
        {
          ma: 'DUNG_SAN_PHAM',
          nhan: 'Đúng sản phẩm',
          dat: danhGia.dungSanPham,
          lyDo: danhGia.dungSanPham ? null : 'Allocation không khớp biến thể OrderItem.',
        },
        {
          ma: 'DUNG_BATCH',
          nhan: 'Đúng batch',
          dat: danhGia.dungBatch,
          lyDo: danhGia.dungBatch ? null : 'Có OrderItem chưa có batch allocation.',
        },
        {
          ma: 'DUNG_QTY',
          nhan: 'Đúng qty',
          dat: danhGia.dungQty,
          lyDo: danhGia.dungQty ? null : 'Tổng allocation không khớp số lượng đã đặt.',
        },
        {
          ma: 'DONG_GOI',
          nhan: 'Đóng gói',
          dat: danhGia.dongGoi,
          lyDo: danhGia.dongGoi ? null : 'Chưa xác nhận hoàn tất đóng gói.',
        },
        {
          ma: 'QR',
          nhan: 'QR',
          dat: danhGia.qr,
          lyDo: danhGia.qr ? null : 'Có batch chưa có mã truy xuất QR.',
        },
      ],
      muc: suborder.muc.map((item) => ({
        id: item.id,
        tenSanPham: item.tenSanPhamSnapshot,
        sku: item.skuBienTheSnapshot,
        soLuong: item.soLuong,
        phanBo: item.phanBo.map((allocation) => ({
          tonKhoLoId: allocation.tonKhoLoId,
          maKho: allocation.tonKhoLo.kho.maKho,
          loSanPhamId: allocation.tonKhoLo.loSanPhamId,
          maLo: allocation.tonKhoLo.loSanPham.maLo,
          soLuong: Number(allocation.soLuong),
          coQr: Boolean(allocation.tonKhoLo.loSanPham.maTruyXuat),
          maTruyXuat: allocation.tonKhoLo.loSanPham.maTruyXuat,
        })),
      })),
    };
  }
}
