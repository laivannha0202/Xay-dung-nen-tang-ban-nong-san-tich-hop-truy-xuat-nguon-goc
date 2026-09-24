import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  LyDoKhieuNai,
  TrangThaiBanGhi,
  TrangThaiKhieuNai,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
  type Prisma,
} from '../../generated/prisma/client';
import { laLoiUniquePrisma, taoMaKhieuNai } from '../common/ma-nghiep-vu.util';
import { CauHinhHeThongService } from '../cau-hinh-he-thong/cau-hinh-he-thong.service';
import { TepTinService } from '../tep-tin/tep-tin.service';
import { ThanhToanHoanTienService } from '../thanh-toan/thanh-toan-hoan-tien.service';
import { DoiSoatService } from '../doi-soat/doi-soat.service';
import { ThanhToanHoanTienHauXuLyService } from '../thanh-toan/thanh-toan-hoan-tien-hau-xu-ly.service';

import type {
  DanhSachKhieuNaiDto,
  DieuKienKhieuNaiMucDonHangDto,
  KhieuNaiDto,
  ThongKeKhieuNaiDto,
} from './dto/phan-hoi-khieu-nai.dto';
import type { TaoKhieuNaiDto } from './dto/tao-khieu-nai.dto';
import type { CapNhatXuLyKhieuNaiDto, HoanTienKhieuNaiDto } from './dto/xu-ly-khieu-nai.dto';
import type { TruyVanKhieuNaiDto } from './dto/truy-van-khieu-nai.dto';

const MIME_BANG_CHUNG_HOP_LE = new Set(['image/jpeg', 'image/png', 'image/webp']);

const KHIEU_NAI_INCLUDE = {
  mucDonHang: {
    include: {
      donHangNhaCungCap: {
        include: {
          donHang: true,
          nhaCungCap: true,
          vanChuyen: {
            orderBy: { createdAt: 'asc' as const },
          },
        },
      },
      phanBo: {
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
  bangChung: {
    include: {
      tepTin: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.KhieuNaiInclude;

type KhieuNaiDayDu = Prisma.KhieuNaiGetPayload<{ include: typeof KHIEU_NAI_INCLUDE }>;

@Injectable()
export class KhieuNaiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cauHinhHeThong: CauHinhHeThongService,
    private readonly tepTinService: TepTinService,
    private readonly hoanTienService: ThanhToanHoanTienService,
    private readonly hoanTienHauXuLyService: ThanhToanHoanTienHauXuLyService,
    private readonly doiSoatService: DoiSoatService,
  ) {}

  async tao(nguoiDungId: string, dto: TaoKhieuNaiDto): Promise<KhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, dto.mucDonHangId);

    const daGiaoLuc = this.layThoiGianDaGiao(muc);
    if (!daGiaoLuc) {
      throw new BadRequestException('Chỉ sản phẩm trong đơn đã giao mới được gửi yêu cầu hỗ trợ.');
    }

    const thoiHanKhieuNaiNgay = await this.cauHinhHeThong.layThoiHanKhieuNaiNgay();
    if (!this.conTrongHanKhieuNai(muc, thoiHanKhieuNaiNgay)) {
      throw new BadRequestException(
        `Đã quá thời hạn gửi yêu cầu ${thoiHanKhieuNaiNgay} ngày kể từ lúc giao hàng.`,
      );
    }

    const tepTinIds = this.chuanHoaTepTinIds(dto.tepTinIds);
    if (tepTinIds.length > 0) {
      await this.kiemTraBangChung(nguoiDungId, tepTinIds);
    }

    // maKhieuNai: server-generated KN-YYYYMMDD-XXXXXX, retry khi collision.
    let created: { id: string } | null = null;
    for (let lan = 0; lan < 5; lan += 1) {
      try {
        created = await this.prisma.khieuNai.create({
          data: {
            maKhieuNai: taoMaKhieuNai(),
            mucDonHangId: muc.id,
            lyDo: dto.lyDo,
            moTa: dto.moTa.trim(),
            ...(tepTinIds.length > 0
              ? {
                  bangChung: {
                    create: tepTinIds.map((tepTinId) => ({ tepTinId })),
                  },
                }
              : {}),
          },
          select: { id: true },
        });
        break;
      } catch (error) {
        if (!laLoiUniquePrisma(error) || lan === 4) throw error;
      }
    }
    if (!created) throw new BadRequestException('Không thể tạo mã khiếu nại, vui lòng thử lại.');

    return this.layChiTietTheoId(created.id);
  }

  async layDieuKienMuc(
    nguoiDungId: string,
    mucDonHangId: string,
  ): Promise<DieuKienKhieuNaiMucDonHangDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const muc = await this.layMucCuaKhach(khachHangId, mucDonHangId);
    const daGiao = this.layThoiGianDaGiao(muc) !== null;
    const thoiHanKhieuNaiNgay = await this.cauHinhHeThong.layThoiHanKhieuNaiNgay();
    const trongHan = daGiao && this.conTrongHanKhieuNai(muc, thoiHanKhieuNaiNgay);
    return {
      mucDonHangId: muc.id,
      sanPhamId: muc.sanPhamId,
      tenSanPham: muc.tenSanPhamSnapshot,
      sku: muc.skuBienTheSnapshot,
      daGiao,
      coTheKhieuNai: trongHan,
      lyDo: !daGiao
        ? 'Chỉ sản phẩm trong đơn đã giao mới được gửi yêu cầu hỗ trợ.'
        : trongHan
          ? null
          : `Đã quá thời hạn gửi yêu cầu ${thoiHanKhieuNaiNgay} ngày kể từ lúc giao hàng.`,
    };
  }

  async layDanhSachCuaToi(
    nguoiDungId: string,
    query: TruyVanKhieuNaiDto,
  ): Promise<DanhSachKhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    return this.layDanhSach(query, {
      mucDonHang: {
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
    });
  }

  async layThongKeCuaToi(nguoiDungId: string): Promise<ThongKeKhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    return this.layThongKe({
      mucDonHang: {
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
    });
  }

  async layChiTietCuaToi(nguoiDungId: string, id: string): Promise<KhieuNaiDto> {
    const khachHangId = await this.layKhachHangId(nguoiDungId);
    const complaint = await this.prisma.khieuNai.findFirst({
      where: {
        id,
        mucDonHang: {
          donHangNhaCungCap: {
            donHang: { khachHangId },
          },
        },
      },
      include: KHIEU_NAI_INCLUDE,
    });
    if (!complaint) {
      throw new NotFoundException('Không tìm thấy yêu cầu hỗ trợ của khách hiện tại.');
    }
    return this.mapKhieuNai(complaint);
  }

  async layDanhSachQuanTri(query: TruyVanKhieuNaiDto): Promise<DanhSachKhieuNaiDto> {
    return this.layDanhSach(query, {});
  }

  async layThongKeQuanTri(): Promise<ThongKeKhieuNaiDto> {
    return this.layThongKe({});
  }

  async layChiTietQuanTri(id: string): Promise<KhieuNaiDto> {
    return this.layChiTietTheoId(id);
  }

  async capNhatXuLyQuanTri(
    nguoiXuLyId: string,
    id: string,
    dto: CapNhatXuLyKhieuNaiDto,
  ): Promise<KhieuNaiDto> {
    const hienTai = await this.prisma.khieuNai.findUnique({
      where: { id },
      select: { id: true, trangThai: true },
    });
    if (!hienTai) throw new NotFoundException('Không tìm thấy yêu cầu hỗ trợ.');

    const allowed = new Map<TrangThaiKhieuNai, TrangThaiKhieuNai[]>([
      [TrangThaiKhieuNai.MOI, [TrangThaiKhieuNai.DANG_XU_LY, TrangThaiKhieuNai.CHAP_NHAN, TrangThaiKhieuNai.TU_CHOI]],
      [TrangThaiKhieuNai.DANG_XU_LY, [TrangThaiKhieuNai.CHAP_NHAN, TrangThaiKhieuNai.TU_CHOI]],
      [TrangThaiKhieuNai.CHAP_NHAN, [TrangThaiKhieuNai.DONG]],
      [TrangThaiKhieuNai.TU_CHOI, [TrangThaiKhieuNai.DONG]],
      [TrangThaiKhieuNai.DA_HOAN_TIEN, [TrangThaiKhieuNai.DONG]],
      [TrangThaiKhieuNai.DONG, []],
    ]);
    if (
      dto.trangThai !== hienTai.trangThai &&
      !(allowed.get(hienTai.trangThai) ?? []).includes(dto.trangThai)
    ) {
      throw new BadRequestException(
        `Không thể chuyển khiếu nại từ ${hienTai.trangThai} sang ${dto.trangThai}.`,
      );
    }

    if (dto.trangThai === TrangThaiKhieuNai.CHAP_NHAN) {
      const soTien = dto.soTienDieuChinh ?? null;
      if (
        soTien === null ||
        !Number.isFinite(soTien) ||
        Math.abs(soTien) < 0.01
      ) {
        throw new BadRequestException(
          'Chấp nhận khiếu nại phải có financial disposition: refund hoặc adjustment.',
        );
      }
      if (soTien < 0) {
        throw new BadRequestException(
          'Adjustment âm chưa được hỗ trợ trong chuyển trạng thái này; hãy dùng refund dương hoặc cập nhật settlement.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.khieuNai.update({
        where: { id },
        data: {
          trangThai: dto.trangThai,
          phanHoiKhachHang:
            dto.phanHoiKhachHang === undefined
              ? undefined
              : dto.phanHoiKhachHang?.trim() || null,
          nguoiXuLyId,
          xuLyLuc: new Date(),
        },
        include: {
          mucDonHang: {
            include: {
              donHangNhaCungCap: {
                include: {
                  donHang: {
                    select: {
                      thanhToan: {
                        where: {
                          trangThai: {
                            in: [
                              TrangThaiThanhToan.PAID,
                              TrangThaiThanhToan.PARTIALLY_REFUNDED,
                            ],
                          },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { id: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (dto.trangThai === TrangThaiKhieuNai.CHAP_NHAN && dto.soTienDieuChinh) {
        const soTien = Number(dto.soTienDieuChinh);
        const payment = updated.mucDonHang.donHangNhaCungCap.donHang.thanhToan[0];
        if (!payment) {
          throw new BadRequestException(
            'Đơn hàng chưa có Payment PAID/PARTIALLY_REFUNDED để hoàn tiền.',
          );
        }

        const maYeuCau = `COMPLAINT-REFUND-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await this.hoanTienService.hoanTien(
          nguoiXuLyId,
          payment.id,
          {
            maYeuCau,
            soTien,
            lyDo: dto.lyDoDieuChinh?.trim() || 'Hoàn tiền theo khiếu nại',
          },
          '127.0.0.1',
        );
        await this.hoanTienHauXuLyService.dongBo(payment.id);

        await tx.khieuNai.update({
          where: { id },
          data: {
            trangThai: TrangThaiKhieuNai.DA_HOAN_TIEN,
            phanHoiKhachHang:
              dto.phanHoiKhachHang?.trim() ||
              `Yêu cầu đã được chấp nhận và hoàn ${soTien.toLocaleString('vi-VN')} đồng.`,
          },
        });
      }

      // V11 - Complaint financial freeze tracking
      if (
        dto.trangThai === TrangThaiKhieuNai.MOI ||
        dto.trangThai === TrangThaiKhieuNai.DANG_XU_LY ||
        dto.trangThai === TrangThaiKhieuNai.CHAP_NHAN
      ) {
        const subOrder = updated.mucDonHang.donHangNhaCungCap;
        if (subOrder.doiSoatId) {
          const daDongBang = Number(updated.soTienDongBang ?? 0) > 0;
          if (!daDongBang) {
            await this.doiSoatService.dongBangTienKhiNhapNhay(
              subOrder.doiSoatId,
              Number(subOrder.tamTinh),
              updated.id,
            );
          }
        }
      }
      if (
        dto.trangThai === TrangThaiKhieuNai.TU_CHOI ||
        dto.trangThai === TrangThaiKhieuNai.DONG
      ) {
        const subOrder = updated.mucDonHang.donHangNhaCungCap;
        if (subOrder.doiSoatId) {
          await this.doiSoatService.moDongBangTienKhiNhapNhay(subOrder.doiSoatId, updated.id);
        }
      }
    });

    return this.layChiTietTheoId(id);
  }

  async hoanTienQuanTri(
    nguoiXuLyId: string,
    id: string,
    dto: HoanTienKhieuNaiDto,
    ipAddress: string,
  ): Promise<KhieuNaiDto> {
    const complaint = await this.prisma.khieuNai.findUnique({
      where: { id },
      select: {
        id: true,
        trangThai: true,
        mucDonHang: {
          select: {
            donHangNhaCungCap: {
              select: {
                donHang: {
                  select: {
                    id: true,
                    thanhToan: {
                      where: {
                        trangThai: {
                          in: [TrangThaiThanhToan.PAID, TrangThaiThanhToan.PARTIALLY_REFUNDED],
                        },
                      },
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!complaint) throw new NotFoundException('Không tìm thấy yêu cầu hỗ trợ.');
    if (
      complaint.trangThai !== TrangThaiKhieuNai.CHAP_NHAN &&
      complaint.trangThai !== TrangThaiKhieuNai.DANG_XU_LY
    ) {
      throw new BadRequestException(
        'Chỉ khiếu nại đang xử lý hoặc đã chấp nhận mới được hoàn tiền.',
      );
    }

    const payment = complaint.mucDonHang.donHangNhaCungCap.donHang.thanhToan[0];
    if (!payment) {
      throw new BadRequestException(
        'Đơn hàng chưa có Payment PAID/PARTIALLY_REFUNDED để hoàn tiền.',
      );
    }

    await this.hoanTienService.hoanTien(
      nguoiXuLyId,
      payment.id,
      {
        maYeuCau: dto.maYeuCau,
        soTien: dto.soTien,
        lyDo: dto.lyDo,
      },
      ipAddress,
    );
    await this.hoanTienHauXuLyService.dongBo(payment.id);

    await this.prisma.khieuNai.update({
      where: { id },
      data: {
        trangThai: TrangThaiKhieuNai.DA_HOAN_TIEN,
        phanHoiKhachHang:
          dto.phanHoiKhachHang?.trim() ||
          `Yêu cầu đã được chấp nhận và hoàn ${dto.soTien.toLocaleString('vi-VN')} đồng.`,
        nguoiXuLyId,
        xuLyLuc: new Date(),
      },
    });
    return this.layChiTietTheoId(id);
  }

  private async layThongKe(
    baseWhere: Prisma.KhieuNaiWhereInput,
  ): Promise<ThongKeKhieuNaiDto> {
    const [tong, coBangChung, chatLuongHoacHetHan, theoLyDo, theoTrangThai] =
      await Promise.all([
        this.prisma.khieuNai.count({ where: baseWhere }),
        this.prisma.khieuNai.count({
          where: { ...baseWhere, bangChung: { some: {} } },
        }),
        this.prisma.khieuNai.count({
          where: {
            ...baseWhere,
            lyDo: { in: [LyDoKhieuNai.CHAT_LUONG, LyDoKhieuNai.HET_HAN] },
          },
        }),
        this.prisma.khieuNai.groupBy({
          by: ['lyDo'],
          where: baseWhere,
          _count: { _all: true },
        }),
        this.prisma.khieuNai.groupBy({
          by: ['trangThai'],
          where: baseWhere,
          _count: { _all: true },
        }),
      ]);

    return {
      tong,
      coBangChung,
      chuaCoBangChung: Math.max(0, tong - coBangChung),
      chatLuongHoacHetHan,
      theoLyDo: theoLyDo.map((item) => ({
        lyDo: item.lyDo,
        tong: item._count._all,
      })),
      theoTrangThai: theoTrangThai.map((item) => ({
        trangThai: item.trangThai,
        tong: item._count._all,
      })),
    };
  }

  private async layKhachHangId(nguoiDungId: string): Promise<string> {
    const khach = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!khach) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return khach.id;
  }

  private async layMucCuaKhach(khachHangId: string, mucDonHangId: string) {
    const muc = await this.prisma.mucDonHang.findFirst({
      where: {
        id: mucDonHangId,
        donHangNhaCungCap: {
          donHang: { khachHangId },
        },
      },
      select: {
        id: true,
        sanPhamId: true,
        tenSanPhamSnapshot: true,
        skuBienTheSnapshot: true,
        donHangNhaCungCap: {
          select: {
            vanChuyen: {
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                trangThai: true,
                updatedAt: true,
                suKien: {
                  where: { trangThai: TrangThaiVanChuyen.DELIVERED },
                  orderBy: { thoiGian: 'desc' },
                  select: { thoiGian: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!muc) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong đơn hàng của khách hiện tại.');
    }
    return muc;
  }

  /**
   * Thời điểm đã giao thực tế trên TẤT CẢ shipments: với mỗi shipment lấy
   * sự kiện DELIVERED mới nhất (A), nếu không có thì dùng shipment.updatedAt
   * NHƯNG CHỈ khi shipment đã DELIVERED (B, tương thích legacy); sau đó lấy
   * timestamp lớn nhất. Shipment chưa giao (CREATED/PICKED_UP/IN_TRANSIT/...)
   * không mở cửa sổ khiếu nại và không xóa bằng chứng của shipment đã giao
   * cũ hơn.
   */
  private layThoiGianDaGiao(muc: {
    donHangNhaCungCap: {
      vanChuyen: Array<{
        trangThai: TrangThaiVanChuyen;
        updatedAt: Date;
        suKien: Array<{ thoiGian: Date }>;
      }>;
    },
  }): Date | null {
    let moiNhat: Date | null = null;
    for (const vanChuyen of muc.donHangNhaCungCap.vanChuyen) {
      let ungVien: Date | null = null;
      for (const suKien of vanChuyen.suKien) {
        if (!ungVien || suKien.thoiGian > ungVien) {
          ungVien = suKien.thoiGian;
        }
      }
      if (!ungVien && vanChuyen.trangThai === TrangThaiVanChuyen.DELIVERED) {
        ungVien = vanChuyen.updatedAt;
      }
      if (ungVien && (!moiNhat || ungVien > moiNhat)) {
        moiNhat = ungVien;
      }
    }
    return moiNhat;
  }

  private conTrongHanKhieuNai(
    muc: {
      donHangNhaCungCap: {
        vanChuyen: Array<{
          trangThai: TrangThaiVanChuyen;
          updatedAt: Date;
          suKien: Array<{ thoiGian: Date }>;
        }>;
      };
    },
    soNgay: number,
  ): boolean {
    const daGiaoLuc = this.layThoiGianDaGiao(muc);
    if (!daGiaoLuc) return false;

    return Date.now() <= daGiaoLuc.getTime() + soNgay * 86_400_000;
  }

  private chuanHoaTepTinIds(ids: string[] | undefined): string[] {
    if (!ids || ids.length === 0) return [];
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new BadRequestException('Danh sách bằng chứng không được chứa tệp trùng.');
    }
    return unique;
  }

  private async kiemTraBangChung(nguoiDungId: string, tepTinIds: string[]): Promise<void> {
    const files = await this.prisma.tepTin.findMany({
      where: {
        id: { in: tepTinIds },
        nguoiTaiLenId: nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        xoaLuc: null,
      },
      select: {
        id: true,
        mimeType: true,
      },
    });

    if (files.length !== tepTinIds.length) {
      throw new BadRequestException(
        'Bằng chứng phải là tệp đang hoạt động do chính khách hàng hiện tại tải lên.',
      );
    }

    const invalid = files.find((file) => !MIME_BANG_CHUNG_HOP_LE.has(file.mimeType));
    if (invalid) {
      throw new BadRequestException('Bằng chứng chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.');
    }
  }

  private async layDanhSach(
    query: TruyVanKhieuNaiDto,
    baseWhere: Prisma.KhieuNaiWhereInput,
  ): Promise<DanhSachKhieuNaiDto> {
    const tuKhoa = query.tuKhoa?.trim();
    const where: Prisma.KhieuNaiWhereInput = {
      ...baseWhere,
      ...(query.lyDo ? { lyDo: query.lyDo } : {}),
      ...(query.trangThai ? { trangThai: query.trangThai } : {}),
      ...(tuKhoa
        ? {
            OR: [
              { maKhieuNai: { contains: tuKhoa } },
              { id: { contains: tuKhoa } },
              { mucDonHang: { tenSanPhamSnapshot: { contains: tuKhoa } } },
              {
                mucDonHang: {
                  donHangNhaCungCap: {
                    donHang: { maDonHang: { contains: tuKhoa } },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const skip = (query.trang - 1) * query.gioiHan;
    const [tong, items] = await this.prisma.$transaction([
      this.prisma.khieuNai.count({ where }),
      this.prisma.khieuNai.findMany({
        where,
        orderBy:
        query.sapXep === 'CU_NHAT'
          ? [{ createdAt: 'asc' }, { id: 'asc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: query.gioiHan,
        select: {
          id: true,
          maKhieuNai: true,
          lyDo: true,
          trangThai: true,
          createdAt: true,
          _count: { select: { bangChung: true } },
          mucDonHang: {
            select: {
              tenSanPhamSnapshot: true,
              donHangNhaCungCap: {
                select: {
                  donHang: {
                    select: { maDonHang: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        maKhieuNai: item.maKhieuNai,
        lyDo: item.lyDo,
        trangThai: item.trangThai,
        maDonHang: item.mucDonHang.donHangNhaCungCap.donHang.maDonHang,
        tenSanPham: item.mucDonHang.tenSanPhamSnapshot,
        soBangChung: item._count.bangChung,
        createdAt: item.createdAt,
      })),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  private async layChiTietTheoId(id: string): Promise<KhieuNaiDto> {
    const complaint = await this.prisma.khieuNai.findUnique({
      where: { id },
      include: KHIEU_NAI_INCLUDE,
    });
    if (!complaint) {
      throw new NotFoundException('Không tìm thấy yêu cầu hỗ trợ.');
    }
    return this.mapKhieuNai(complaint);
  }

  private async taoUrlXemBangChung(tepTinId: string): Promise<string | null> {
    try {
      return await this.tepTinService.taoSignedUrlNoiBo(tepTinId);
    } catch {
      return null;
    }
  }

  private async mapKhieuNai(item: KhieuNaiDayDu): Promise<KhieuNaiDto> {
    const muc = item.mucDonHang;
    const suborder = muc.donHangNhaCungCap;
    const order = suborder.donHang;
    return {
      id: item.id,
      maKhieuNai: item.maKhieuNai,
      lyDo: item.lyDo,
      moTa: item.moTa,
      trangThai: item.trangThai,
      phanHoiKhachHang: item.phanHoiKhachHang,
      xuLyLuc: item.xuLyLuc,
      donHang: {
        id: order.id,
        maDonHang: order.maDonHang,
      },
      donNhaCungCap: {
        id: suborder.id,
        maDon: suborder.maDon,
        tenNhaCungCap: suborder.nhaCungCap.ten,
      },
      mucDonHang: {
        id: muc.id,
        sanPhamId: muc.sanPhamId,
        bienTheSanPhamId: muc.bienTheSanPhamId,
        tenSanPham: muc.tenSanPhamSnapshot,
        sku: muc.skuBienTheSnapshot,
        soLuong: muc.soLuong,
        donGia: Number(muc.donGiaSnapshot),
        thanhTien: Number((Number(muc.donGiaSnapshot) * muc.soLuong).toFixed(2)),
        maTrangTrai: muc.maTrangTraiSnapshot,
        tenTrangTrai: muc.tenTrangTraiSnapshot,
      },
      phanBo: muc.phanBo.map((allocation) => ({
        tonKhoLoId: allocation.tonKhoLoId,
        maKho: allocation.tonKhoLo.kho.maKho,
        maLo: allocation.tonKhoLo.loSanPham.maLo,
        maTruyXuat: allocation.tonKhoLo.loSanPham.maTruyXuat,
        soLuong: Number(allocation.soLuong),
      })),
      vanChuyen: suborder.vanChuyen.map((shipment) => ({
        id: shipment.id,
        maVanDon: shipment.maVanDon,
        trangThai: shipment.trangThai,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      })),
      bangChung: await Promise.all(
        item.bangChung.map(async (evidence) => ({
          id: evidence.id,
          tepTinId: evidence.tepTinId,
          tenGoc: evidence.tepTin.tenGoc,
          mimeType: evidence.tepTin.mimeType,
          urlXem: await this.taoUrlXemBangChung(evidence.tepTinId),
          createdAt: evidence.createdAt,
        })),
      ),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
