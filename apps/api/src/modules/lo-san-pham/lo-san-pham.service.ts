import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiLoSanPham } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { ThongBaoPushService } from '../thong-bao-push/thong-bao-push.service';

import type { CapNhatLoSanPhamDto } from './dto/cap-nhat-lo-san-pham.dto';
import type { DanhSachLoSanPhamDto, LoSanPhamDto } from './dto/phan-hoi-lo-san-pham.dto';
import type { TaoLoTuThuHoachDto } from './dto/tao-lo-tu-thu-hoach.dto';
import type { ThuHoiLoSanPhamDto } from './dto/thu-hoi-lo-san-pham.dto';
import type { TruyVanLoSanPhamDto } from './dto/truy-van-lo-san-pham.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type LoSanPhamRow = Prisma.LoSanPhamGetPayload<{
  include: {
    thuHoach: {
      include: {
        muaVu: {
          include: {
            trangTrai: true;
          };
        };
      };
    };
    thuHoi: {
      include: {
        nguoiThuHoi: true;
      };
    };
  };
}>;

type ThuHoachNguon = Prisma.ThuHoachGetPayload<{
  include: {
    muaVu: true;
  };
}>;

@Injectable()
export class LoSanPhamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly thongBaoPush: ThongBaoPushService,
  ) {}

  async layDanhSach(dto: TruyVanLoSanPhamDto): Promise<DanhSachLoSanPhamDto> {
    const where: Prisma.LoSanPhamWhereInput = {};

    if (dto.thuHoachId) {
      where.thuHoachId = dto.thuHoachId;
    }

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    const phanHang = dto.phanHangChatLuong?.trim();

    if (phanHang) {
      where.phanHangChatLuong = phanHang;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          maLo: {
            contains: timKiem,
          },
        },
        {
          phanHangChatLuong: {
            contains: timKiem,
          },
        },
        {
          thuHoach: {
            phanLoai: {
              contains: timKiem,
            },
          },
        },
        {
          thuHoach: {
            muaVu: {
              cayTrong: {
                contains: timKiem,
              },
            },
          },
        },
        {
          thuHoach: {
            muaVu: {
              giong: {
                contains: timKiem,
              },
            },
          },
        },
        {
          thuHoach: {
            muaVu: {
              trangTrai: {
                ten: {
                  contains: timKiem,
                },
              },
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.loSanPham.findMany({
        where,
        include: this.includeNguon(),
        orderBy: [
          {
            ngayHetHan: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.loSanPham.count({
        where,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<LoSanPhamDto> {
    const row = await this.prisma.loSanPham.findUnique({
      where: { id },
      include: this.includeNguon(),
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy lô sản phẩm.');
    }

    return this.toDto(row);
  }

  async taoTuThuHoach(
    tacNhanId: string,
    thuHoachId: string,
    dto: TaoLoTuThuHoachDto,
    metadata: MetadataAudit,
  ): Promise<LoSanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    const soLuong = dto.soLuong;

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        await this.khoaThuHoach(tx, thuHoachId);

        const thuHoach = await this.layThuHoachBatBuoc(tx, thuHoachId);

        const ngayHetHan = this.taoNgay(dto.ngayHetHan);
        const ngayDongGoi = dto.ngayDongGoi ? this.taoNgay(dto.ngayDongGoi) : null;

        this.kiemTraNgayHetHan(ngayHetHan, thuHoach.ngayThuHoach);
        this.kiemTraBaoQuan(dto.nhietDoMin, dto.nhietDoMax, dto.doAmMin, dto.doAmMax);

        if (ngayDongGoi && ngayDongGoi.getTime() < thuHoach.ngayThuHoach.getTime()) {
          throw new BadRequestException('Ngày đóng gói không được trước ngày Thu hoạch.');
        }
        if (ngayDongGoi && ngayDongGoi.getTime() > ngayHetHan.getTime()) {
          throw new BadRequestException('Ngày đóng gói không được sau ngày hết hạn.');
        }

        await this.kiemTraTongSoLuong(tx, thuHoach, soLuong);

        const moi = await tx.loSanPham.create({
          data: {
            maLo: dto.maLo.trim(),
            thuHoachId,
            soLuong,
            conLai: soLuong,
            phanHangChatLuong: null,
            ngayHetHan,
            ngayDongGoi,
            loaiBaoQuan: dto.loaiBaoQuan,
            nhietDoMin: dto.nhietDoMin,
            nhietDoMax: dto.nhietDoMax,
            doAmMin: dto.doAmMin,
            doAmMax: dto.doAmMax,
            huongDanBaoQuan: dto.huongDanBaoQuan?.trim() || null,
            trangThai: TrangThaiLoSanPham.MOI_TAO,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'LO_SAN_PHAM_TAO_TU_THU_HOACH',
            thucThe: 'lo_san_pham',
            thucTheId: moi.id,
            truoc: {
              tonTai: false,
            },
            sau: this.snapshot(moi),
            metadata: {
              ...metadata,
              thuHoachId,
            },
          },
        });

        return moi.id;
      });

      return this.layChiTiet(id);
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatLoSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<LoSanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.khoaLoSanPham(tx, id);

        const hienTai = await this.layRawBatBuoc(tx, id);

        if (hienTai.trangThai !== TrangThaiLoSanPham.MOI_TAO) {
          throw new BadRequestException('Chỉ được sửa lô ở trạng thái MOI_TAO.');
        }

        await this.khoaThuHoach(tx, hienTai.thuHoachId);

        const thuHoach = await this.layThuHoachBatBuoc(tx, hienTai.thuHoachId);

        const data: Prisma.LoSanPhamUncheckedUpdateInput = {};

        if (dto.maLo !== undefined) {
          data.maLo = dto.maLo.trim();
        }

        if (dto.soLuong !== undefined) {
          await this.kiemTraTongSoLuong(tx, thuHoach, dto.soLuong, id);

          data.soLuong = dto.soLuong;

          data.conLai = dto.soLuong;
        }

        if (dto.ngayHetHan !== undefined) {
          const ngayHetHan = this.taoNgay(dto.ngayHetHan);

          this.kiemTraNgayHetHan(ngayHetHan, thuHoach.ngayThuHoach);

          data.ngayHetHan = ngayHetHan;
        }

        if (dto.ngayDongGoi !== undefined) {
          const ngayDongGoi = this.taoNgay(dto.ngayDongGoi);
          if (ngayDongGoi.getTime() < thuHoach.ngayThuHoach.getTime()) {
            throw new BadRequestException('Ngày đóng gói không được trước ngày Thu hoạch.');
          }
          data.ngayDongGoi = ngayDongGoi;
        }

        this.kiemTraBaoQuan(dto.nhietDoMin, dto.nhietDoMax, dto.doAmMin, dto.doAmMax);

        if (dto.loaiBaoQuan !== undefined) data.loaiBaoQuan = dto.loaiBaoQuan;
        if (dto.nhietDoMin !== undefined) data.nhietDoMin = dto.nhietDoMin;
        if (dto.nhietDoMax !== undefined) data.nhietDoMax = dto.nhietDoMax;
        if (dto.doAmMin !== undefined) data.doAmMin = dto.doAmMin;
        if (dto.doAmMax !== undefined) data.doAmMax = dto.doAmMax;
        if (dto.huongDanBaoQuan !== undefined) {
          data.huongDanBaoQuan = dto.huongDanBaoQuan.trim() || null;
        }

        if (Object.keys(data).length === 0) {
          throw new BadRequestException('Không có dữ liệu cần cập nhật.');
        }

        const sau = await tx.loSanPham.update({
          where: { id },
          data,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'LO_SAN_PHAM_SUA',
            thucThe: 'lo_san_pham',
            thucTheId: id,
            truoc: this.snapshot(hienTai),
            sau: this.snapshot(sau),
            metadata,
          },
        });
      });

      return this.layChiTiet(id);
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async guiKiemDinh(tacNhanId: string, id: string, metadata: MetadataAudit): Promise<LoSanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    await this.prisma.$transaction(async (tx) => {
      await this.khoaLoSanPham(tx, id);

      const hienTai = await this.layRawBatBuoc(tx, id);

      if (hienTai.trangThai !== TrangThaiLoSanPham.MOI_TAO) {
        throw new BadRequestException('Chỉ Lô MOI_TAO mới được gửi kiểm định.');
      }

      const sau = await tx.loSanPham.update({
        where: { id },
        data: {
          trangThai: TrangThaiLoSanPham.CHO_KIEM_DINH,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'LO_SAN_PHAM_GUI_KIEM_DINH',
          thucThe: 'lo_san_pham',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTiet(id);
  }

  async thuHoi(
    tacNhanId: string,
    id: string,
    dto: ThuHoiLoSanPhamDto,
    metadata: MetadataAudit,
  ): Promise<LoSanPhamDto> {
    const actor = await this.layActor(tacNhanId);

    const lyDo = dto.lyDo.trim();
    const thongBaoKhachHang = dto.thongBaoKhachHang.trim();

    if (!lyDo) {
      throw new BadRequestException('Lý do thu hồi không được để trống.');
    }

    if (!thongBaoKhachHang) {
      throw new BadRequestException('Thông báo khách hàng không được để trống.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.khoaLoSanPham(tx, id);

      const hienTai = await this.layRawBatBuoc(tx, id);

      if (hienTai.trangThai === TrangThaiLoSanPham.THU_HOI) {
        throw new ConflictException('Lô sản phẩm đã được thu hồi.');
      }

      const daCo = await tx.thuHoiLoSanPham.findUnique({
        where: {
          loSanPhamId: id,
        },
        select: {
          id: true,
        },
      });

      if (daCo) {
        throw new ConflictException('Lô sản phẩm đã có hồ sơ thu hồi.');
      }

      const thuHoi = await tx.thuHoiLoSanPham.create({
        data: {
          loSanPhamId: id,
          lyDo,
          thongBaoKhachHang,
          nguoiThuHoiId: actor.id,
        },
      });

      const sau = await tx.loSanPham.update({
        where: {
          id,
        },
        data: {
          trangThai: TrangThaiLoSanPham.THU_HOI,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'LO_SAN_PHAM_THU_HOI',
          thucThe: 'lo_san_pham',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata: {
            ...metadata,
            thuHoiId: thuHoi.id,
            nganBan: true,
            nganPhanBo: true,
            modulePhanBo: 'CHUA_CO_PHIEN_050',
            moduleDonHang: 'CHUA_CO_PHIEN_051_052',
            thongBaoKhachHangQuaTrace: true,
          },
        },
      });

      // 1. Xác định impacted order allocations & impacted customers
      const allocations = await tx.phanBoDonHang.findMany({
        where: {
          tonKhoLo: {
            loSanPhamId: id,
          },
        },
        include: {
          mucDonHang: {
            include: {
              donHangNhaCungCap: {
                include: {
                  donHang: {
                    select: {
                      id: true,
                      maDonHang: true,
                      khachHangId: true,
                      khachHang: {
                        select: {
                          id: true,
                          nguoiDungId: true,
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

      // Distinct cặp (orderId, customerId)
      const impactedPairs = new Map<string, { orderId: string; customerId: string; nguoiDungId: string }>();
      for (const alloc of allocations) {
        const order = alloc.mucDonHang.donHangNhaCungCap.donHang;
        const customer = order.khachHang;
        if (customer) {
          const key = `${order.id}-${customer.id}`;
          if (!impactedPairs.has(key)) {
            impactedPairs.set(key, {
              orderId: order.id,
              customerId: customer.id,
              nguoiDungId: customer.nguoiDungId,
            });
          }
        }
      }

      // 2. Tạo ThongBaoThuHoi với deterministic idempotency key
      const createdNotifications: Array<{ nguoiDungId: string; orderId: string }> = [];
      for (const pair of impactedPairs.values()) {
        const idempotencyKey = `RECALL-${thuHoi.id}-${pair.orderId}-${pair.customerId}`;
        const existingNotif = await tx.thongBaoThuHoi.findUnique({
          where: { khoaIdempotent: idempotencyKey },
        });
        if (!existingNotif) {
          await tx.thongBaoThuHoi.create({
            data: {
              thuHoiId: thuHoi.id,
              loSanPhamId: id,
              donHangId: pair.orderId,
              khachHangId: pair.customerId,
              tieuDe: `Cảnh báo thu hồi lô hàng · Lô ${hienTai.maLo}`,
              noiDung: thongBaoKhachHang,
              khoaIdempotent: idempotencyKey,
            },
          });
          createdNotifications.push({ nguoiDungId: pair.nguoiDungId, orderId: pair.orderId });
        }
      }

      // 3. Enqueue push notification ngoài transaction (nếu có user)
      if (createdNotifications.length > 0) {
        setImmediate(async () => {
          try {
            for (const notif of createdNotifications) {
              await this.thongBaoPush.guiChoNguoiDung([notif.nguoiDungId], {
                title: `Cảnh báo thu hồi lô hàng · Lô ${hienTai.maLo}`,
                body: thongBaoKhachHang,
                data: {
                  type: 'RECALL',
                  entityId: thuHoi.id,
                  deepLink: `/don-hang/${notif.orderId}`,
                },
              });
            }
          } catch {
            // Push non-blocking
          }
        });
      }
    });

    return this.layChiTiet(id);
  }

  private async layActor(id: string): Promise<{
    id: string;
    email: string;
  }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }

    return actor;
  }

  private async khoaLoSanPham(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
      }>
    >`
        SELECT id
        FROM lo_san_pham
        WHERE id = ${id}
        FOR UPDATE
      `;

    if (rows.length !== 1) {
      throw new NotFoundException('Không tìm thấy lô sản phẩm.');
    }
  }

  private async khoaThuHoach(tx: Prisma.TransactionClient, thuHoachId: string): Promise<void> {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
      }>
    >`
        SELECT id
        FROM thu_hoach
        WHERE id = ${thuHoachId}
        FOR UPDATE
      `;

    if (rows.length !== 1) {
      throw new BadRequestException('Thu hoạch không tồn tại.');
    }
  }

  private async layThuHoachBatBuoc(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<ThuHoachNguon> {
    const item = await tx.thuHoach.findUnique({
      where: { id },
      include: {
        muaVu: true,
      },
    });

    if (!item) {
      throw new BadRequestException('Thu hoạch không tồn tại.');
    }

    return item;
  }

  private async layRawBatBuoc(tx: Prisma.TransactionClient, id: string) {
    const item = await tx.loSanPham.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy lô sản phẩm.');
    }

    return item;
  }

  private async kiemTraTongSoLuong(
    tx: Prisma.TransactionClient,
    thuHoach: ThuHoachNguon,
    soLuongMoi: number,
    boQuaLoId?: string,
  ): Promise<void> {
    const aggregate = await tx.loSanPham.aggregate({
      where: {
        thuHoachId: thuHoach.id,
        ...(boQuaLoId
          ? {
              id: {
                not: boQuaLoId,
              },
            }
          : {}),
      },
      _sum: {
        soLuong: true,
      },
    });

    const daTao = Number(aggregate._sum.soLuong ?? 0);

    const gioiHan = Number(thuHoach.soLuong);

    if (daTao + soLuongMoi > gioiHan + 0.0000001) {
      throw new BadRequestException('Tổng số lượng các Lô không được vượt số lượng Thu hoạch.');
    }
  }

  private taoNgay(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      throw new BadRequestException('Ngày hết hạn không hợp lệ.');
    }

    return date;
  }

  private kiemTraNgayHetHan(ngayHetHan: Date, ngayThuHoach: Date): void {
    if (ngayHetHan.getTime() < ngayThuHoach.getTime()) {
      throw new BadRequestException('Ngày hết hạn không được trước ngày Thu hoạch.');
    }
  }

  private kiemTraBaoQuan(
    nhietDoMin?: number,
    nhietDoMax?: number,
    doAmMin?: number,
    doAmMax?: number,
  ): void {
    if (nhietDoMin !== undefined && nhietDoMax !== undefined && nhietDoMin > nhietDoMax) {
      throw new BadRequestException('Nhiệt độ bảo quản tối thiểu không được lớn hơn tối đa.');
    }
    if (doAmMin !== undefined && doAmMax !== undefined && doAmMin > doAmMax) {
      throw new BadRequestException('Độ ẩm tối thiểu không được lớn hơn tối đa.');
    }
  }

  private includeNguon() {
    return {
      thuHoach: {
        include: {
          muaVu: {
            include: {
              trangTrai: true,
            },
          },
        },
      },
      thuHoi: {
        include: {
          nguoiThuHoi: true,
        },
      },
    } as const;
  }

  private toDto(row: LoSanPhamRow): LoSanPhamDto {
    return {
      id: row.id,
      maLo: row.maLo,
      maTruyXuat: row.maTruyXuat,
      thuHoach: {
        id: row.thuHoach.id,
        ngayThuHoach: this.dateOnly(row.thuHoach.ngayThuHoach),
        soLuong: Number(row.thuHoach.soLuong),
        donVi: row.thuHoach.donVi,
        phanLoai: row.thuHoach.phanLoai,
        muaVu: {
          id: row.thuHoach.muaVu.id,
          cayTrong: row.thuHoach.muaVu.cayTrong,
          giong: row.thuHoach.muaVu.giong,
          trangThai: row.thuHoach.muaVu.trangThai,
          trangTrai: {
            id: row.thuHoach.muaVu.trangTrai.id,
            ma: row.thuHoach.muaVu.trangTrai.ma,
            ten: row.thuHoach.muaVu.trangTrai.ten,
          },
        },
      },
      soLuong: Number(row.soLuong),
      conLai: Number(row.conLai),
      phanHangChatLuong: row.phanHangChatLuong,
      ngayHetHan: this.dateOnly(row.ngayHetHan),
      ngayDongGoi: row.ngayDongGoi ? this.dateOnly(row.ngayDongGoi) : null,
      loaiBaoQuan: row.loaiBaoQuan,
      nhietDoMin: row.nhietDoMin === null ? null : Number(row.nhietDoMin),
      nhietDoMax: row.nhietDoMax === null ? null : Number(row.nhietDoMax),
      doAmMin: row.doAmMin,
      doAmMax: row.doAmMax,
      huongDanBaoQuan: row.huongDanBaoQuan,
      trangThai: row.trangThai,
      thuHoi: row.thuHoi
        ? {
            id: row.thuHoi.id,
            lyDo: row.thuHoi.lyDo,
            thongBaoKhachHang: row.thuHoi.thongBaoKhachHang,
            thuHoiLuc: row.thuHoi.thuHoiLuc.toISOString(),
            nguoiThuHoi: row.thuHoi.nguoiThuHoi
              ? {
                  id: row.thuHoi.nguoiThuHoi.id,
                  email: row.thuHoi.nguoiThuHoi.email,
                  hoTen: row.thuHoi.nguoiThuHoi.hoTen,
                }
              : null,
          }
        : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(item: {
    maLo: string;
    thuHoachId: string;
    soLuong: Prisma.Decimal;
    conLai: Prisma.Decimal;
    phanHangChatLuong: string | null;
    ngayHetHan: Date;
    trangThai: TrangThaiLoSanPham;
  }) {
    return {
      maLo: item.maLo,
      thuHoachId: item.thuHoachId,
      soLuong: Number(item.soLuong),
      conLai: Number(item.conLai),
      phanHangChatLuong: item.phanHangChatLuong,
      ngayHetHan: this.dateOnly(item.ngayHetHan),
      trangThai: item.trangThai,
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã lô đã tồn tại.');
    }
  }
}
