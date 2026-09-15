import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  Prisma,
  TrangThaiDonHang,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
} from '../../generated/prisma/client';

import { ShippingAdapterRegistry } from './adapter/shipping-adapter.registry';
import type { CapNhatTrangThaiVanChuyenDto } from './dto/cap-nhat-trang-thai-van-chuyen.dto';
import type { GiaoHangDonHangCuaToiDto } from './dto/phan-hoi-giao-hang-khach.dto';

const CHUYEN_TRANG_THAI_VAN_CHUYEN: Record<
  TrangThaiVanChuyen,
  readonly TrangThaiVanChuyen[]
> = {
  CREATED: [TrangThaiVanChuyen.PICKED_UP],
  PICKED_UP: [
    TrangThaiVanChuyen.IN_TRANSIT,
    TrangThaiVanChuyen.FAILED,
  ],
  IN_TRANSIT: [
    TrangThaiVanChuyen.OUT_FOR_DELIVERY,
    TrangThaiVanChuyen.FAILED,
  ],
  OUT_FOR_DELIVERY: [
    TrangThaiVanChuyen.DELIVERED,
    TrangThaiVanChuyen.FAILED,
  ],
  DELIVERED: [],
  FAILED: [TrangThaiVanChuyen.RETURNED],
  RETURNED: [],
};

const TRANG_THAI_DANG_GIAO = new Set<TrangThaiVanChuyen>([
  TrangThaiVanChuyen.PICKED_UP,
  TrangThaiVanChuyen.IN_TRANSIT,
  TrangThaiVanChuyen.OUT_FOR_DELIVERY,
]);

export type PhanHoiCapNhatVanChuyenQuanTri = {
  vanChuyenId: string;
  maVanDon: string;
  trangThai: TrangThaiVanChuyen;
  donHangId: string;
  donHangTrangThai: TrangThaiDonHang;
  codDaThanhToan: boolean;
};

@Injectable()
export class GiaoHangService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingAdapterRegistry: ShippingAdapterRegistry,
  ) {}

  async layTheoDonHangCuaToi(
    nguoiDungId: string,
    donHangId: string,
  ): Promise<GiaoHangDonHangCuaToiDto> {
    const donHang = await this.prisma.donHang.findFirst({
      where: {
        id: donHangId,
        khachHang: {
          nguoiDungId,
        },
      },
      select: {
        id: true,
        maDonHang: true,
        donNhaCungCap: {
          orderBy: {
            maDon: 'asc',
          },
          select: {
            id: true,
            maDon: true,
            nhaCungCap: {
              select: {
                ten: true,
              },
            },
            vanChuyen: {
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                id: true,
                maVanDon: true,
                trangThai: true,
                createdAt: true,
                updatedAt: true,
                suKien: {
                  orderBy: [{ thoiGian: 'asc' }, { id: 'asc' }],
                  select: {
                    id: true,
                    trangThai: true,
                    moTa: true,
                    viTri: true,
                    thoiGian: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!donHang) {
      throw new NotFoundException('Không tìm thấy đơn hàng của bạn.');
    }

    return {
      donHangId: donHang.id,
      maDonHang: donHang.maDonHang,
      vanChuyen: donHang.donNhaCungCap.flatMap((suborder) =>
        suborder.vanChuyen.map((shipment) => ({
          id: shipment.id,
          donHangNhaCungCapId: suborder.id,
          maDonNhaCungCap: suborder.maDon,
          tenNhaCungCap: suborder.nhaCungCap.ten,
          maVanDon: shipment.maVanDon,
          trangThai: shipment.trangThai,
          createdAt: shipment.createdAt,
          updatedAt: shipment.updatedAt,
          suKien: shipment.suKien,
        })),
      ),
    };
  }

  /**
   * Tạo vận đơn MOCK sau khi supplier-order hoàn tất đóng gói.
   * Idempotent: nếu đang có shipment chưa FAILED/RETURNED thì dùng lại.
   *
   * Project hiện chỉ có MOCK shipping adapter; khi nối hãng vận chuyển thật,
   * giữ nguyên entry-point này và thay adapter trong registry.
   */
  async taoVanDonSauDongGoi(donHangNhaCungCapId: string): Promise<{
    id: string;
    maVanDon: string;
    trangThai: TrangThaiVanChuyen;
  }> {
    const suborder = await this.prisma.donHangNhaCungCap.findUnique({
      where: {
        id: donHangNhaCungCapId,
      },
      select: {
        id: true,
        maDon: true,
        trangThai: true,
        donHang: {
          select: {
            id: true,
            maDonHang: true,
            tenNguoiNhanSnapshot: true,
            soDienThoaiSnapshot: true,
            diaChiGiaoHangSnapshot: true,
          },
        },
      },
    });

    if (!suborder) {
      throw new NotFoundException('Không tìm thấy đơn nhà cung cấp để tạo vận đơn.');
    }

    if (
      suborder.trangThai !== TrangThaiDonHang.DA_DONG_GOI &&
      suborder.trangThai !== TrangThaiDonHang.DANG_GIAO &&
      suborder.trangThai !== TrangThaiDonHang.DA_GIAO &&
      suborder.trangThai !== TrangThaiDonHang.HOAN_THANH
    ) {
      throw new ConflictException(
        `Chỉ tạo vận đơn sau khi đóng gói; trạng thái hiện tại là ${suborder.trangThai}.`,
      );
    }

    const active = await this.prisma.vanChuyen.findFirst({
      where: {
        donHangNhaCungCapId,
        trangThai: {
          notIn: [
            TrangThaiVanChuyen.FAILED,
            TrangThaiVanChuyen.RETURNED,
          ],
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        maVanDon: true,
        trangThai: true,
      },
    });

    if (active) {
      return active;
    }

    const hoTen = suborder.donHang.tenNguoiNhanSnapshot?.trim();
    const soDienThoai = suborder.donHang.soDienThoaiSnapshot?.trim();
    const diaChi = suborder.donHang.diaChiGiaoHangSnapshot?.trim();

    if (!hoTen || !soDienThoai || !diaChi) {
      throw new BadRequestException(
        'Đơn hàng thiếu snapshot người nhận/địa chỉ nên chưa thể tạo vận đơn.',
      );
    }

    const soLan = await this.prisma.vanChuyen.count({
      where: {
        donHangNhaCungCapId,
      },
    });

    const adapter = this.shippingAdapterRegistry.get('MOCK');
    const adapterResult = await adapter.createShipment({
      donHangNhaCungCapId,
      maThamChieu: `${suborder.maDon}-S${soLan + 1}`,
      nguoiNhan: {
        hoTen,
        soDienThoai,
        diaChi,
      },
      ghiChu: `AgriMarket ${suborder.donHang.maDonHang}`,
    });

    const trangThai = adapterResult.state as TrangThaiVanChuyen;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.vanChuyen.create({
          data: {
            donHangNhaCungCapId,
            maVanDon: adapterResult.trackingNumber,
            trangThai,
          },
          select: {
            id: true,
            maVanDon: true,
            trangThai: true,
          },
        });

        await tx.suKienTheoDoiVanChuyen.create({
          data: {
            vanChuyenId: created.id,
            trangThai,
            moTa: 'Đã tạo vận đơn',
            viTri: 'AgriMarket',
          },
        });

        return created;
      });
    } catch (error) {
      // Race/idempotency: đọc lại shipment active nếu request đồng thời.
      const raced = await this.prisma.vanChuyen.findFirst({
        where: {
          donHangNhaCungCapId,
          trangThai: {
            notIn: [
              TrangThaiVanChuyen.FAILED,
              TrangThaiVanChuyen.RETURNED,
            ],
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          maVanDon: true,
          trangThai: true,
        },
      });

      if (raced) {
        return raced;
      }

      throw error;
    }
  }

  /**
   * Entry-point duy nhất cho Admin/demo cập nhật shipment.
   *
   * Quan trọng với COD:
   * - Shipment DELIVERED chỉ đánh dấu COD=PAID khi TẤT CẢ supplier-order
   *   của parent order đã DA_GIAO/HOAN_THANH.
   * - Điều này tránh đơn nhiều trang trại bị ghi nhận đã thu đủ COD
   *   ngay khi mới giao xong một phần.
   */
  async capNhatTrangThaiQuanTri(
    vanChuyenId: string,
    dto: CapNhatTrangThaiVanChuyenDto,
  ): Promise<PhanHoiCapNhatVanChuyenQuanTri> {
    const current = await this.prisma.vanChuyen.findUnique({
      where: {
        id: vanChuyenId,
      },
      select: {
        id: true,
        maVanDon: true,
        trangThai: true,
        donHangNhaCungCap: {
          select: {
            id: true,
            donHangId: true,
            trangThai: true,
          },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('Không tìm thấy vận đơn.');
    }

    if (current.trangThai === dto.trangThai) {
      return this.layPhanHoiCapNhat(current.id, false);
    }

    const allowed = CHUYEN_TRANG_THAI_VAN_CHUYEN[current.trangThai];
    if (!allowed.includes(dto.trangThai)) {
      throw new ConflictException(
        `Không thể chuyển vận đơn từ ${current.trangThai} sang ${dto.trangThai}.`,
      );
    }

    let codDaThanhToan = false;

    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.vanChuyen.updateMany({
        where: {
          id: current.id,
          trangThai: current.trangThai,
        },
        data: {
          trangThai: dto.trangThai,
        },
      });

      if (changed.count !== 1) {
        throw new ConflictException(
          'Trạng thái vận đơn vừa thay đổi ở thao tác khác. Hãy tải lại.',
        );
      }

      await tx.suKienTheoDoiVanChuyen.create({
        data: {
          vanChuyenId: current.id,
          trangThai: dto.trangThai,
          moTa: dto.moTa?.trim() || this.moTaMacDinh(dto.trangThai),
          viTri: dto.viTri?.trim() || null,
          thoiGian: new Date(),
        },
      });

      if (TRANG_THAI_DANG_GIAO.has(dto.trangThai)) {
        await tx.donHangNhaCungCap.updateMany({
          where: {
            id: current.donHangNhaCungCap.id,
            trangThai: {
              in: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
              ],
            },
          },
          data: {
            trangThai: TrangThaiDonHang.DANG_GIAO,
          },
        });

        await tx.donHang.updateMany({
          where: {
            id: current.donHangNhaCungCap.donHangId,
            trangThai: {
              in: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
              ],
            },
          },
          data: {
            trangThai: TrangThaiDonHang.DANG_GIAO,
          },
        });
      }

      if (dto.trangThai === TrangThaiVanChuyen.DELIVERED) {
        await tx.donHangNhaCungCap.updateMany({
          where: {
            id: current.donHangNhaCungCap.id,
            trangThai: {
              in: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
                TrangThaiDonHang.DA_GIAO,
              ],
            },
          },
          data: {
            trangThai: TrangThaiDonHang.DA_GIAO,
          },
        });

        const chuaGiaoXong = await tx.donHangNhaCungCap.count({
          where: {
            donHangId: current.donHangNhaCungCap.donHangId,
            trangThai: {
              notIn: [
                TrangThaiDonHang.DA_GIAO,
                TrangThaiDonHang.HOAN_THANH,
              ],
            },
          },
        });

        if (chuaGiaoXong === 0) {
          await tx.donHang.updateMany({
            where: {
              id: current.donHangNhaCungCap.donHangId,
              trangThai: {
                in: [
                  TrangThaiDonHang.DA_DONG_GOI,
                  TrangThaiDonHang.DANG_GIAO,
                  TrangThaiDonHang.DA_GIAO,
                ],
              },
            },
            data: {
              trangThai: TrangThaiDonHang.DA_GIAO,
            },
          });

          codDaThanhToan = await this.danhDauCodDaThuTienTrongTransaction(
            tx,
            current.donHangNhaCungCap.donHangId,
          );
        }
      }
    });

    return this.layPhanHoiCapNhat(current.id, codDaThanhToan);
  }

  private async danhDauCodDaThuTienTrongTransaction(
    tx: Prisma.TransactionClient,
    donHangId: string,
  ): Promise<boolean> {
    const payments = await tx.thanhToan.findMany({
      where: {
        donHangId,
        phuongThuc: 'COD',
        trangThai: {
          in: [
            TrangThaiThanhToan.CREATED,
            TrangThaiThanhToan.PENDING,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    const paymentIds = payments.map((payment) => payment.id);
    if (paymentIds.length === 0) {
      return false;
    }

    const now = new Date();

    await tx.thanhToan.updateMany({
      where: {
        id: {
          in: paymentIds,
        },
        phuongThuc: 'COD',
        trangThai: {
          in: [
            TrangThaiThanhToan.CREATED,
            TrangThaiThanhToan.PENDING,
          ],
        },
      },
      data: {
        trangThai: TrangThaiThanhToan.PAID,
      },
    });

    await tx.giaoDichThanhToan.updateMany({
      where: {
        thanhToanId: {
          in: paymentIds,
        },
        trangThai: {
          in: [
            TrangThaiThanhToan.CREATED,
            TrangThaiThanhToan.PENDING,
          ],
        },
      },
      data: {
        trangThai: TrangThaiThanhToan.PAID,
        thoiGian: now,
      },
    });

    return true;
  }

  private async layPhanHoiCapNhat(
    vanChuyenId: string,
    codDaThanhToan: boolean,
  ): Promise<PhanHoiCapNhatVanChuyenQuanTri> {
    const shipment = await this.prisma.vanChuyen.findUniqueOrThrow({
      where: {
        id: vanChuyenId,
      },
      select: {
        id: true,
        maVanDon: true,
        trangThai: true,
        donHangNhaCungCap: {
          select: {
            donHang: {
              select: {
                id: true,
                trangThai: true,
              },
            },
          },
        },
      },
    });

    return {
      vanChuyenId: shipment.id,
      maVanDon: shipment.maVanDon,
      trangThai: shipment.trangThai,
      donHangId: shipment.donHangNhaCungCap.donHang.id,
      donHangTrangThai: shipment.donHangNhaCungCap.donHang.trangThai,
      codDaThanhToan,
    };
  }

  private moTaMacDinh(trangThai: TrangThaiVanChuyen): string {
    const labels: Record<TrangThaiVanChuyen, string> = {
      CREATED: 'Đã tạo vận đơn',
      PICKED_UP: 'Đơn vị vận chuyển đã nhận hàng',
      IN_TRANSIT: 'Hàng đang được vận chuyển',
      OUT_FOR_DELIVERY: 'Hàng đang được giao tới người nhận',
      DELIVERED: 'Giao hàng thành công',
      FAILED: 'Giao hàng chưa thành công',
      RETURNED: 'Hàng đã hoàn về',
    };

    return labels[trangThai];
  }
}
