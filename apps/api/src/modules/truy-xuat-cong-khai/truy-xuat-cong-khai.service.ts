import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiXacMinhChungNhan } from '../../generated/prisma/client';

import type { TruyXuatCongKhaiDto } from './dto/phan-hoi-truy-xuat-cong-khai.dto';

@Injectable()
export class TruyXuatCongKhaiService {
  constructor(private readonly prisma: PrismaService) {}

  async layTheoMa(ma: string): Promise<TruyXuatCongKhaiDto> {
    const maTruyXuat = this.chuanHoaMa(ma);

    const lo = await this.prisma.loSanPham.findUnique({
      where: {
        maTruyXuat,
      },
      select: {
        maLo: true,
        maTruyXuat: true,
        phanHangChatLuong: true,
        ngayHetHan: true,
        trangThai: true,
        thuHoach: {
          select: {
            ngayThuHoach: true,
            phanLoai: true,
            muaVu: {
              select: {
                cayTrong: true,
                giong: true,
                ngayTrong: true,
                nhatKyCanhTac: {
                  where: {
                    hienThiCongKhai: true,
                  },
                  orderBy: [
                    {
                      thoiGian: 'asc',
                    },
                    {
                      createdAt: 'asc',
                    },
                  ],
                  select: {
                    loaiSuKien: true,
                    thoiGian: true,
                    noiDung: true,
                  },
                },
                trangTrai: {
                  select: {
                    ten: true,
                    diaChi: true,
                    chungNhan: {
                      where: {
                        trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
                      },
                      orderBy: [
                        {
                          ngayCap: 'asc',
                        },
                        {
                          createdAt: 'asc',
                        },
                      ],
                      select: {
                        loai: true,
                        ma: true,
                        donViCap: true,
                        ngayCap: true,
                        ngayHetHan: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        kiemDinhChatLuong: {
          orderBy: [
            {
              ngayKiemDinh: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
          select: {
            ngayKiemDinh: true,
            ketQua: true,
            phanHang: true,
          },
        },
        suKienTruyXuat: {
          where: {
            congKhai: true,
          },
          orderBy: [
            {
              thoiGian: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
          select: {
            loai: true,
            thoiGian: true,
            diaDiem: true,
          },
        },
      },
    });

    if (!lo || !lo.maTruyXuat) {
      throw new NotFoundException('Không tìm thấy thông tin truy xuất.');
    }

    const muaVu = lo.thuHoach.muaVu;

    const trangTrai = muaVu.trangTrai;

    return {
      maTruyXuat: lo.maTruyXuat,
      lo: {
        maLo: lo.maLo,
        maTruyXuat: lo.maTruyXuat,
        phanHangChatLuong: lo.phanHangChatLuong,
        ngayHetHan: this.dateOnly(lo.ngayHetHan),
        trangThai: lo.trangThai,
      },
      trangTrai: {
        ten: trangTrai.ten,
        diaChi: trangTrai.diaChi,
      },
      muaVu: {
        cayTrong: muaVu.cayTrong,
        giong: muaVu.giong,
        ngayTrong: this.dateOnly(muaVu.ngayTrong),
      },
      thuHoach: {
        ngayThuHoach: this.dateOnly(lo.thuHoach.ngayThuHoach),
        phanLoai: lo.thuHoach.phanLoai,
      },
      chungNhan: trangTrai.chungNhan.map((item) => ({
        loai: item.loai,
        ma: item.ma,
        donViCap: item.donViCap,
        ngayCap: this.dateOnly(item.ngayCap),
        ngayHetHan: this.dateOnly(item.ngayHetHan),
      })),
      kiemDinh: lo.kiemDinhChatLuong.map((item) => ({
        ngayKiemDinh: this.dateOnly(item.ngayKiemDinh),
        ketQua: item.ketQua,
        phanHang: item.phanHang,
      })),
      nhatKyCanhTac: muaVu.nhatKyCanhTac.map((item) => ({
        loaiSuKien: item.loaiSuKien,
        thoiGian: item.thoiGian.toISOString(),
        noiDung: item.noiDung,
      })),
      suKien: lo.suKienTruyXuat.map((item) => ({
        loai: item.loai,
        thoiGian: item.thoiGian.toISOString(),
        diaDiem: item.diaDiem,
      })),
    };
  }

  private chuanHoaMa(value: string): string {
    const normalized = value.trim().toUpperCase();

    if (!/^AGM-[A-F0-9]{32}$/.test(normalized)) {
      throw new NotFoundException('Không tìm thấy thông tin truy xuất.');
    }

    return normalized;
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
