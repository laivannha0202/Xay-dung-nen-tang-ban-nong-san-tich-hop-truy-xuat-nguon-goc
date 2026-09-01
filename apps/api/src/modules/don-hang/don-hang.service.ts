import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';
import type { GioHangDto } from '../gio-hang/dto/phan-hoi-gio-hang.dto';
import { GioHangService } from '../gio-hang/gio-hang.service';
import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';

import type { MucDonHangDuKienDto, TaoDonHangDto } from './dto/tao-don-hang.dto';
import type { DonHangPhanHoiDto } from './dto/phan-hoi-don-hang.dto';

type CartLocked = Prisma.GioHangGetPayload<{
  include: {
    muc: {
      include: {
        bienTheSanPham: {
          include: {
            sanPham: {
              include: {
                danhMucSanPham: true;
                trangTrai: {
                  include: {
                    nhaCungCap: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

type CartLockedItem = CartLocked['muc'][number];

@Injectable()
export class DonHangService {
  private readonly logger = new Logger(DonHangService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gioHangService: GioHangService,
    private readonly datChoTonKhoService: DatChoTonKhoService,
  ) {}

  async tao(nguoiDungId: string, dto: TaoDonHangDto): Promise<DonHangPhanHoiDto> {
    const maDonHang = this.maDonHang(dto.maYeuCau);
    const maReservation = this.maReservation(maDonHang);

    const daCo = await this.prisma.donHang.findUnique({
      where: { maDonHang },
      select: { id: true },
    });
    if (daCo) {
      return this.layPhanHoi(daCo.id, maReservation);
    }

    const gioHang = await this.gioHangService.lay(nguoiDungId);
    this.validateCart(gioHang, dto.items);

    const datCho = await this.datChoTonKhoService.datCho({
      maThamChieu: maReservation,
      items: gioHang.muc.map((muc) => ({
        bienTheSanPhamId: muc.bienThe.id,
        soLuong: muc.soLuong,
      })),
    });

    let donHangId: string;

    try {
      donHangId = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.donHang.findUnique({
            where: { maDonHang },
            select: { id: true },
          });
          if (existing) {
            return existing.id;
          }

          const khachHang = await tx.khachHang.findFirst({
            where: {
              nguoiDungId,
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
            select: { id: true },
          });
          if (!khachHang) {
            throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
          }

          const lockRows = await tx.$queryRaw<Array<{ id: string }>>(
            Prisma.sql`
                SELECT id
                FROM cart
                WHERE id = ${gioHang.id}
                  AND khach_hang_id = ${khachHang.id}
                FOR UPDATE
              `,
          );
          if (lockRows.length !== 1) {
            throw new BadRequestException('Giỏ hàng không còn tồn tại.');
          }

          const cartLocked = await tx.gioHang.findUniqueOrThrow({
            where: { id: gioHang.id },
            include: {
              muc: {
                orderBy: { createdAt: 'asc' },
                include: {
                  bienTheSanPham: {
                    include: {
                      sanPham: {
                        include: {
                          danhMucSanPham: true,
                          trangTrai: {
                            include: {
                              nhaCungCap: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          this.validateCartLocked(cartLocked, dto.items);

          const groups = this.groupBySupplier(cartLocked.muc);
          const tongTien = this.tien(
            cartLocked.muc.reduce(
              (tong, muc) => tong + Number(muc.bienTheSanPham.gia) * muc.soLuong,
              0,
            ),
          );

          const order = await tx.donHang.create({
            data: {
              maDonHang,
              khachHangId: khachHang.id,
              tongTien,
            },
            select: { id: true },
          });

          let supplierIndex = 0;

          for (const [nhaCungCapId, items] of groups) {
            supplierIndex += 1;

            const tamTinh = this.tien(
              items.reduce((tong, muc) => tong + Number(muc.bienTheSanPham.gia) * muc.soLuong, 0),
            );

            const suborder = await tx.donHangNhaCungCap.create({
              data: {
                maDon: this.maSuborder(maDonHang, supplierIndex),
                donHangId: order.id,
                nhaCungCapId,
                tamTinh,
              },
              select: { id: true },
            });

            for (const muc of items) {
              const variant = muc.bienTheSanPham;
              const product = variant.sanPham;
              const farm = product.trangTrai;

              const orderItem = await tx.mucDonHang.create({
                data: {
                  donHangNhaCungCapId: suborder.id,
                  sanPhamId: product.id,
                  bienTheSanPhamId: variant.id,
                  trangTraiId: farm.id,
                  soLuong: muc.soLuong,
                  donGiaSnapshot: variant.gia,
                  tenSanPhamSnapshot: product.ten,
                  skuBienTheSnapshot: variant.sku,
                  khoiLuongBienTheSnapshot: variant.khoiLuong,
                  donViBienTheSnapshot: variant.donVi,
                  maTrangTraiSnapshot: farm.ma,
                  tenTrangTraiSnapshot: farm.ten,
                },
                select: { id: true },
              });

              const phanBo = datCho.phanBo.filter(
                (allocation) => allocation.bienTheSanPhamId === variant.id,
              );

              const tongPhanBo = this.soLuong(
                phanBo.reduce((tong, allocation) => tong + allocation.soLuong, 0),
              );

              if (Math.abs(tongPhanBo - muc.soLuong) > 1e-9) {
                throw new BadRequestException(
                  'Reservation allocation không khớp số lượng OrderItem.',
                );
              }

              if (phanBo.length === 0) {
                throw new BadRequestException('OrderItem không có inventory allocation.');
              }

              await tx.phanBoDonHang.createMany({
                data: phanBo.map((allocation) => ({
                  mucDonHangId: orderItem.id,
                  tonKhoLoId: allocation.tonKhoLoId,
                  soLuong: allocation.soLuong,
                })),
              });
            }
          }

          return order.id;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 10_000,
          timeout: 20_000,
        },
      );
    } catch (error) {
      try {
        await this.datChoTonKhoService.giaiPhong(datCho.id);
      } catch (releaseError) {
        this.logger.error(
          `Không release được reservation ${datCho.id} sau Create Order rollback.`,
          releaseError instanceof Error ? releaseError.stack : String(releaseError),
        );
      }
      throw error;
    }

    return this.layPhanHoi(donHangId, maReservation);
  }

  private validateCart(gioHang: GioHangDto, itemsDuKien: MucDonHangDuKienDto[]): void {
    if (gioHang.muc.length === 0) {
      throw new BadRequestException('Giỏ hàng đang trống.');
    }

    const expected = this.expectedMap(itemsDuKien);

    if (expected.size !== gioHang.muc.length) {
      throw new BadRequestException('Cart đã thay đổi so với dữ liệu Create Order.');
    }

    for (const muc of gioHang.muc) {
      const request = expected.get(muc.bienThe.id);

      if (!request) {
        throw new BadRequestException('Cart variant không khớp request.');
      }

      if (request.soLuong !== muc.soLuong) {
        throw new BadRequestException('Cart quantity đã thay đổi.');
      }

      if (!this.cungGia(request.donGiaDuKien, muc.bienThe.giaHienTai)) {
        throw new BadRequestException(`Giá sản phẩm ${muc.bienThe.sanPham.ten} đã thay đổi.`);
      }

      if (!muc.bienThe.coTheDatHang) {
        throw new BadRequestException(`Sản phẩm ${muc.bienThe.sanPham.ten} không đủ tồn khả dụng.`);
      }
    }
  }

  private validateCartLocked(cart: CartLocked, itemsDuKien: MucDonHangDuKienDto[]): void {
    if (cart.muc.length === 0) {
      throw new BadRequestException('Giỏ hàng đang trống.');
    }

    const expected = this.expectedMap(itemsDuKien);

    if (expected.size !== cart.muc.length) {
      throw new BadRequestException('Cart đã thay đổi trong lúc tạo đơn.');
    }

    for (const muc of cart.muc) {
      const variant = muc.bienTheSanPham;
      const product = variant.sanPham;
      const farm = product.trangTrai;
      const supplier = farm.nhaCungCap;
      const request = expected.get(variant.id);

      if (!request) {
        throw new BadRequestException('Cart variant đã thay đổi trong lúc tạo đơn.');
      }

      if (request.soLuong !== muc.soLuong) {
        throw new BadRequestException('Cart quantity đã thay đổi trong lúc tạo đơn.');
      }

      if (!this.cungGia(request.donGiaDuKien, Number(variant.gia))) {
        throw new BadRequestException(`Giá sản phẩm ${product.ten} đã thay đổi trong lúc tạo đơn.`);
      }

      if (
        product.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        product.danhMucSanPham.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        farm.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
        supplier.trangThai !== TrangThaiBanGhi.HOAT_DONG
      ) {
        throw new BadRequestException(`Sản phẩm ${product.ten} không còn hợp lệ để đặt hàng.`);
      }
    }
  }

  private expectedMap(items: MucDonHangDuKienDto[]): Map<string, MucDonHangDuKienDto> {
    const result = new Map<string, MucDonHangDuKienDto>();

    for (const item of items) {
      if (result.has(item.bienTheSanPhamId)) {
        throw new BadRequestException('Request Create Order không được trùng variant.');
      }
      result.set(item.bienTheSanPhamId, item);
    }

    return result;
  }

  private groupBySupplier(items: CartLockedItem[]): Map<string, CartLockedItem[]> {
    const groups = new Map<string, CartLockedItem[]>();

    const sorted = [...items].sort((a, b) => {
      const supplierA = a.bienTheSanPham.sanPham.trangTrai.nhaCungCap.id;
      const supplierB = b.bienTheSanPham.sanPham.trangTrai.nhaCungCap.id;

      const supplierCompare = supplierA.localeCompare(supplierB);
      if (supplierCompare !== 0) {
        return supplierCompare;
      }

      return a.bienTheSanPham.id.localeCompare(b.bienTheSanPham.id);
    });

    for (const item of sorted) {
      const supplierId = item.bienTheSanPham.sanPham.trangTrai.nhaCungCap.id;

      const current = groups.get(supplierId);
      if (current) {
        current.push(item);
      } else {
        groups.set(supplierId, [item]);
      }
    }

    return groups;
  }

  private async layPhanHoi(id: string, maReservation: string): Promise<DonHangPhanHoiDto> {
    const [order, reservation] = await Promise.all([
      this.prisma.donHang.findUniqueOrThrow({
        where: { id },
        include: {
          donNhaCungCap: {
            orderBy: { maDon: 'asc' },
            include: {
              nhaCungCap: true,
              muc: {
                orderBy: { createdAt: 'asc' },
                include: {
                  phanBo: {
                    orderBy: { createdAt: 'asc' },
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
              },
            },
          },
        },
      }),
      this.prisma.datChoTonKho.findUnique({
        where: {
          maThamChieu: maReservation,
        },
      }),
    ]);

    if (!reservation) {
      throw new BadRequestException(
        'Order đã tồn tại nhưng thiếu inventory reservation tương ứng.',
      );
    }

    return {
      id: order.id,
      maDonHang: order.maDonHang,
      khachHangId: order.khachHangId,
      trangThai: order.trangThai,
      tongTien: Number(order.tongTien),
      datCho: {
        id: reservation.id,
        maThamChieu: reservation.maThamChieu,
        trangThai: reservation.trangThai,
        hetHanLuc: reservation.hetHanLuc,
      },
      donNhaCungCap: order.donNhaCungCap.map((suborder) => ({
        id: suborder.id,
        maDon: suborder.maDon,
        nhaCungCapId: suborder.nhaCungCapId,
        tenNhaCungCap: suborder.nhaCungCap.ten,
        trangThai: suborder.trangThai,
        tamTinh: Number(suborder.tamTinh),
        muc: suborder.muc.map((item) => ({
          id: item.id,
          sanPhamId: item.sanPhamId,
          bienTheSanPhamId: item.bienTheSanPhamId,
          trangTraiId: item.trangTraiId,
          soLuong: item.soLuong,
          donGiaSnapshot: Number(item.donGiaSnapshot),
          tenSanPhamSnapshot: item.tenSanPhamSnapshot,
          skuBienTheSnapshot: item.skuBienTheSnapshot,
          khoiLuongBienTheSnapshot: Number(item.khoiLuongBienTheSnapshot),
          donViBienTheSnapshot: item.donViBienTheSnapshot,
          maTrangTraiSnapshot: item.maTrangTraiSnapshot,
          tenTrangTraiSnapshot: item.tenTrangTraiSnapshot,
          phanBo: item.phanBo.map((allocation) => ({
            id: allocation.id,
            tonKhoLoId: allocation.tonKhoLoId,
            maLo: allocation.tonKhoLo.loSanPham.maLo,
            maKho: allocation.tonKhoLo.kho.maKho,
            soLuong: Number(allocation.soLuong),
          })),
        })),
      })),
    };
  }

  private maDonHang(maYeuCau: string): string {
    return 'ORD-' + maYeuCau.replaceAll('-', '').toUpperCase();
  }

  private maReservation(maDonHang: string): string {
    return `ORDER:${maDonHang}`;
  }

  private maSuborder(maDonHang: string, index: number): string {
    return `${maDonHang}-${String(index).padStart(2, '0')}`;
  }

  private cungGia(expected: number, current: number): boolean {
    return Math.abs(expected - current) < 0.005;
  }

  private tien(value: number): number {
    return Number(value.toFixed(2));
  }

  private soLuong(value: number): number {
    return Number(value.toFixed(3));
  }
}
