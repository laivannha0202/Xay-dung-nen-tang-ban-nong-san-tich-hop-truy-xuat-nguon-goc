import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import type {
  BaoCaoDonHangAnhHuongItemDto,
  BaoCaoLoTruyXuatItemDto,
  BaoCaoThuHoiTruyXuatItemDto,
  DanhSachBaoCaoDonHangAnhHuongDto,
  DanhSachBaoCaoLoTruyXuatDto,
  DanhSachBaoCaoThuHoiTruyXuatDto,
} from './dto/phan-hoi-bao-cao-truy-xuat.dto';
import type {
  TruyVanBaoCaoTruyXuatDto,
  TruyVanDonHangAnhHuongTruyXuatDto,
} from './dto/truy-van-bao-cao-truy-xuat.dto';

const INCLUDE_LO = {
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
    select: {
      thuHoiLuc: true,
    },
  },
} satisfies Prisma.LoSanPhamInclude;

type LoBaoCao = Prisma.LoSanPhamGetPayload<{ include: typeof INCLUDE_LO }>;

const INCLUDE_THU_HOI = {
  loSanPham: {
    include: {
      thuHoach: {
        include: {
          muaVu: {
            include: {
              trangTrai: true,
            },
          },
        },
      },
    },
  },
  nguoiThuHoi: {
    select: {
      id: true,
      email: true,
    },
  },
} satisfies Prisma.ThuHoiLoSanPhamInclude;

type ThuHoiBaoCao = Prisma.ThuHoiLoSanPhamGetPayload<{ include: typeof INCLUDE_THU_HOI }>;

const INCLUDE_PHAN_BO = {
  tonKhoLo: {
    include: {
      kho: true,
      loSanPham: {
        include: {
          thuHoi: true,
        },
      },
    },
  },
  mucDonHang: {
    include: {
      donHangNhaCungCap: {
        include: {
          donHang: true,
        },
      },
    },
  },
} satisfies Prisma.PhanBoDonHangInclude;

type PhanBoBaoCao = Prisma.PhanBoDonHangGetPayload<{ include: typeof INCLUDE_PHAN_BO }>;

type ThongKeAnhHuong = {
  donHangIds: Set<string>;
  soLuong: number;
};

@Injectable()
export class BaoCaoTruyXuatService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSachLo(query: TruyVanBaoCaoTruyXuatDto): Promise<DanhSachBaoCaoLoTruyXuatDto> {
    const where = this.taoWhereLo(query.timKiem);
    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await Promise.all([
      this.prisma.loSanPham.findMany({
        where,
        include: INCLUDE_LO,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.loSanPham.count({ where }),
    ]);
    const thongKe = await this.layThongKeAnhHuong(rows.map((item) => item.id));
    return {
      duLieu: rows.map((item) => this.toLoItem(item, thongKe.get(item.id))),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layDanhSachThuHoi(
    query: TruyVanBaoCaoTruyXuatDto,
  ): Promise<DanhSachBaoCaoThuHoiTruyXuatDto> {
    const where = this.taoWhereThuHoi(query.timKiem);
    const skip = (query.trang - 1) * query.gioiHan;
    const [rows, tong] = await Promise.all([
      this.prisma.thuHoiLoSanPham.findMany({
        where,
        include: INCLUDE_THU_HOI,
        orderBy: [{ thuHoiLuc: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
      this.prisma.thuHoiLoSanPham.count({ where }),
    ]);
    const thongKe = await this.layThongKeAnhHuong(rows.map((item) => item.loSanPhamId));
    return {
      duLieu: rows.map((item) => this.toThuHoiItem(item, thongKe.get(item.loSanPhamId))),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layDonHangAnhHuong(
    query: TruyVanDonHangAnhHuongTruyXuatDto,
  ): Promise<DanhSachBaoCaoDonHangAnhHuongDto> {
    const where = this.taoWhereDonHangAnhHuong(query);
    const skip = (query.trang - 1) * query.gioiHan;
    const [summary, rows] = await Promise.all([
      this.prisma.phanBoDonHang.findMany({
        where,
        select: {
          soLuong: true,
          mucDonHang: {
            select: {
              donHangNhaCungCap: {
                select: {
                  donHangId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.phanBoDonHang.findMany({
        where,
        include: INCLUDE_PHAN_BO,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);
    return {
      duLieu: rows.map((item) => this.toDonHangAnhHuongItem(item)),
      tongDonHang: new Set(summary.map((item) => item.mucDonHang.donHangNhaCungCap.donHangId)).size,
      tongPhanBo: summary.length,
      tongSoLuongPhanBo: this.soLuong(
        summary.reduce((tong, item) => tong + Number(item.soLuong), 0),
      ),
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private taoWhereLo(timKiemRaw: string | undefined): Prisma.LoSanPhamWhereInput {
    const timKiem = timKiemRaw?.trim();
    if (!timKiem) return {};
    return {
      OR: [
        { maLo: { contains: timKiem } },
        { maTruyXuat: { contains: timKiem } },
        { thuHoach: { muaVu: { cayTrong: { contains: timKiem } } } },
        { thuHoach: { muaVu: { giong: { contains: timKiem } } } },
        { thuHoach: { muaVu: { trangTrai: { ma: { contains: timKiem } } } } },
        { thuHoach: { muaVu: { trangTrai: { ten: { contains: timKiem } } } } },
      ],
    };
  }

  private taoWhereThuHoi(timKiemRaw: string | undefined): Prisma.ThuHoiLoSanPhamWhereInput {
    const timKiem = timKiemRaw?.trim();
    if (!timKiem) return {};
    return {
      OR: [
        { lyDo: { contains: timKiem } },
        { thongBaoKhachHang: { contains: timKiem } },
        { loSanPham: { maLo: { contains: timKiem } } },
        { loSanPham: { maTruyXuat: { contains: timKiem } } },
        { loSanPham: { thuHoach: { muaVu: { trangTrai: { ten: { contains: timKiem } } } } } },
      ],
    };
  }

  private taoWhereDonHangAnhHuong(
    query: TruyVanDonHangAnhHuongTruyXuatDto,
  ): Prisma.PhanBoDonHangWhereInput {
    const and: Prisma.PhanBoDonHangWhereInput[] = [
      {
        tonKhoLo: {
          loSanPham: {
            thuHoi: {
              isNot: null,
            },
          },
        },
      },
    ];
    if (query.loSanPhamId) {
      and.push({
        tonKhoLo: {
          loSanPhamId: query.loSanPhamId,
        },
      });
    }
    const timKiem = query.timKiem?.trim();
    if (timKiem) {
      and.push({
        OR: [
          { tonKhoLo: { loSanPham: { maLo: { contains: timKiem } } } },
          { tonKhoLo: { loSanPham: { maTruyXuat: { contains: timKiem } } } },
          { mucDonHang: { tenSanPhamSnapshot: { contains: timKiem } } },
          { mucDonHang: { skuBienTheSnapshot: { contains: timKiem } } },
          { mucDonHang: { maTrangTraiSnapshot: { contains: timKiem } } },
          { mucDonHang: { tenTrangTraiSnapshot: { contains: timKiem } } },
          {
            mucDonHang: {
              donHangNhaCungCap: {
                maDon: {
                  contains: timKiem,
                },
              },
            },
          },
          {
            mucDonHang: {
              donHangNhaCungCap: {
                donHang: {
                  maDonHang: {
                    contains: timKiem,
                  },
                },
              },
            },
          },
        ],
      });
    }
    return { AND: and };
  }

  private async layThongKeAnhHuong(loSanPhamIds: string[]): Promise<Map<string, ThongKeAnhHuong>> {
    const result = new Map<string, ThongKeAnhHuong>();
    if (loSanPhamIds.length === 0) return result;
    const rows = await this.prisma.phanBoDonHang.findMany({
      where: {
        tonKhoLo: {
          loSanPhamId: {
            in: loSanPhamIds,
          },
        },
      },
      select: {
        soLuong: true,
        tonKhoLo: {
          select: {
            loSanPhamId: true,
          },
        },
        mucDonHang: {
          select: {
            donHangNhaCungCap: {
              select: {
                donHangId: true,
              },
            },
          },
        },
      },
    });
    for (const row of rows) {
      const loId = row.tonKhoLo.loSanPhamId;
      const current = result.get(loId) ?? { donHangIds: new Set<string>(), soLuong: 0 };
      current.donHangIds.add(row.mucDonHang.donHangNhaCungCap.donHangId);
      current.soLuong = this.soLuong(current.soLuong + Number(row.soLuong));
      result.set(loId, current);
    }
    return result;
  }

  private toLoItem(item: LoBaoCao, thongKe?: ThongKeAnhHuong): BaoCaoLoTruyXuatItemDto {
    const muaVu = item.thuHoach.muaVu;
    const farm = muaVu.trangTrai;
    return {
      id: item.id,
      maLo: item.maLo,
      maTruyXuat: item.maTruyXuat,
      trangThai: item.trangThai,
      soLuong: Number(item.soLuong),
      conLai: Number(item.conLai),
      phanHangChatLuong: item.phanHangChatLuong,
      ngayHetHan: this.dateOnly(item.ngayHetHan),
      ngayThuHoach: this.dateOnly(item.thuHoach.ngayThuHoach),
      cayTrong: muaVu.cayTrong,
      giong: muaVu.giong,
      trangTrai: { id: farm.id, ma: farm.ma, ten: farm.ten },
      daThuHoi: Boolean(item.thuHoi),
      thuHoiLuc: item.thuHoi?.thuHoiLuc.toISOString() ?? null,
      soDonHangAnhHuong: thongKe?.donHangIds.size ?? 0,
      soLuongDaPhanBo: thongKe?.soLuong ?? 0,
    };
  }

  private toThuHoiItem(item: ThuHoiBaoCao, thongKe?: ThongKeAnhHuong): BaoCaoThuHoiTruyXuatItemDto {
    const farm = item.loSanPham.thuHoach.muaVu.trangTrai;
    return {
      id: item.id,
      loSanPhamId: item.loSanPhamId,
      maLo: item.loSanPham.maLo,
      maTruyXuat: item.loSanPham.maTruyXuat,
      trangThaiLo: item.loSanPham.trangThai,
      lyDo: item.lyDo,
      thongBaoKhachHang: item.thongBaoKhachHang,
      thuHoiLuc: item.thuHoiLuc.toISOString(),
      nguoiThuHoi: item.nguoiThuHoi
        ? { id: item.nguoiThuHoi.id, email: item.nguoiThuHoi.email }
        : null,
      trangTrai: { id: farm.id, ma: farm.ma, ten: farm.ten },
      soDonHangAnhHuong: thongKe?.donHangIds.size ?? 0,
      soLuongDaPhanBo: thongKe?.soLuong ?? 0,
    };
  }

  private toDonHangAnhHuongItem(item: PhanBoBaoCao): BaoCaoDonHangAnhHuongItemDto {
    const batch = item.tonKhoLo.loSanPham;
    const recall = batch.thuHoi;
    const orderItem = item.mucDonHang;
    const suborder = orderItem.donHangNhaCungCap;
    const order = suborder.donHang;
    if (!recall) {
      throw new Error('Invariant Traceability Report: affected order phải thuộc recalled batch.');
    }
    return {
      id: item.id,
      loSanPhamId: batch.id,
      maLo: batch.maLo,
      maTruyXuat: batch.maTruyXuat,
      thuHoiLuc: recall.thuHoiLuc.toISOString(),
      donHangId: order.id,
      maDonHang: order.maDonHang,
      trangThaiDonHang: order.trangThai,
      ngayDatHang: order.createdAt.toISOString(),
      donHangNhaCungCapId: suborder.id,
      maDonNhaCungCap: suborder.maDon,
      trangThaiDonNhaCungCap: suborder.trangThai,
      mucDonHangId: orderItem.id,
      sanPhamId: orderItem.sanPhamId,
      tenSanPham: orderItem.tenSanPhamSnapshot,
      sku: orderItem.skuBienTheSnapshot,
      trangTraiId: orderItem.trangTraiId,
      maTrangTrai: orderItem.maTrangTraiSnapshot,
      tenTrangTrai: orderItem.tenTrangTraiSnapshot,
      maKho: item.tonKhoLo.kho.maKho,
      soLuongPhanBo: Number(item.soLuong),
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private soLuong(value: number): number {
    return Number(value.toFixed(3));
  }
}
