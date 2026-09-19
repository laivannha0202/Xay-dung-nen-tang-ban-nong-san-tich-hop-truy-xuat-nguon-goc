import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiDonHang, TrangThaiThanhToan } from '../../generated/prisma/client';
import { laLoiUniquePrisma, taoMaHoaDonNoiBo } from '../common/ma-nghiep-vu.util';
import type { TruyVanHoaDonNoiBoDto } from './dto/truy-van-hoa-don-noi-bo.dto';

@Injectable()
export class HoaDonNoiBoService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanHoaDonNoiBoDto) {
    const trang = dto.trang ?? 1;
    const gioiHan = dto.gioiHan ?? 20;
    const timKiem = dto.timKiem?.trim();
    const where: Prisma.HoaDonBanHangNoiBoWhereInput = timKiem
      ? {
          OR: [
            { maHoaDon: { contains: timKiem } },
            { maDonHangSnapshot: { contains: timKiem } },
            { tenNguoiMuaSnapshot: { contains: timKiem } },
            { soDienThoaiSnapshot: { contains: timKiem } },
          ],
        }
      : {};

    const [duLieu, tong] = await Promise.all([
      this.prisma.hoaDonBanHangNoiBo.findMany({
        where,
        orderBy: { phatHanhLuc: 'desc' },
        skip: (trang - 1) * gioiHan,
        take: gioiHan,
        include: { _count: { select: { dong: true } } },
      }),
      this.prisma.hoaDonBanHangNoiBo.count({ where }),
    ]);

    return {
      duLieu: duLieu.map((item) => ({
        id: item.id,
        maHoaDon: item.maHoaDon,
        donHangId: item.donHangId,
        maDonHang: item.maDonHangSnapshot,
        trangThai: item.trangThai,
        tenNguoiMua: item.tenNguoiMuaSnapshot,
        tongThanhToan: Number(item.tongThanhToan),
        phuongThucThanhToan: item.phuongThucThanhToanSnapshot,
        trangThaiThanhToan: item.trangThaiThanhToanSnapshot,
        nguoiLap: item.nguoiLap,
        phatHanhLuc: item.phatHanhLuc,
        soDong: item._count.dong,
      })),
      tong,
      trang,
      gioiHan,
    };
  }

  async layChiTiet(id: string) {
    const item = await this.prisma.hoaDonBanHangNoiBo.findUnique({
      where: { id },
      include: {
        donHang: { select: { id: true, maDonHang: true, trangThai: true } },
        dong: { orderBy: { thuTu: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('Không tìm thấy hóa đơn bán hàng nội bộ.');

    return {
      id: item.id,
      maHoaDon: item.maHoaDon,
      donHangId: item.donHangId,
      donHang: item.donHang,
      trangThai: item.trangThai,
      maDonHang: item.maDonHangSnapshot,
      tenNguoiMua: item.tenNguoiMuaSnapshot,
      soDienThoai: item.soDienThoaiSnapshot,
      diaChi: item.diaChiSnapshot,
      tamTinhHangHoa: Number(item.tamTinhHangHoa),
      phiVanChuyen: Number(item.phiVanChuyen),
      giamKhuyenMai: Number(item.giamKhuyenMai),
      diemDaDung: item.diemDaDung,
      giaTriDiemDaDung: Number(item.giaTriDiemDaDung),
      tongThanhToan: Number(item.tongThanhToan),
      phuongThucThanhToan: item.phuongThucThanhToanSnapshot,
      trangThaiThanhToan: item.trangThaiThanhToanSnapshot,
      nguoiLapId: item.nguoiLapId,
      nguoiLap: item.nguoiLap,
      phatHanhLuc: item.phatHanhLuc,
      dong: item.dong.map((dong) => ({
        id: dong.id,
        thuTu: dong.thuTu,
        mucDonHangId: dong.mucDonHangId,
        tenSanPham: dong.tenSanPhamSnapshot,
        sku: dong.skuSnapshot,
        soLuong: dong.soLuong,
        donVi: dong.donViSnapshot,
        donGia: Number(dong.donGia),
        thanhTien: Number(dong.thanhTien),
        tenTrangTrai: dong.tenTrangTraiSnapshot,
      })),
      canhBaoPhapLy:
        'Đây là hóa đơn bán hàng nội bộ của AgriMarket, không phải hóa đơn điện tử/VAT hợp pháp.',
    };
  }

  async phatHanh(donHangId: string, nguoiLapId: string) {
    const daCo = await this.prisma.hoaDonBanHangNoiBo.findUnique({
      where: { donHangId },
      select: { id: true },
    });
    if (daCo) return this.layChiTiet(daCo.id);

    try {
      const hoaDonId = await this.prisma.$transaction(async (tx) => {
        const [order, actor] = await Promise.all([
          tx.donHang.findUnique({
            where: { id: donHangId },
            include: {
              khachHang: { include: { nguoiDung: true } },
              thanhToan: { orderBy: { createdAt: 'desc' } },
              donNhaCungCap: {
                orderBy: { createdAt: 'asc' },
                include: { muc: { orderBy: { createdAt: 'asc' } } },
              },
            },
          }),
          tx.nguoiDung.findUnique({
            where: { id: nguoiLapId },
            select: { id: true, email: true },
          }),
        ]);

        if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
        if (!actor) throw new NotFoundException('Không tìm thấy người phát hành hóa đơn.');
        if (order.trangThai === TrangThaiDonHang.CHO_THANH_TOAN) {
          throw new BadRequestException(
            'Đơn còn CHO_THANH_TOAN; chưa được phát hành hóa đơn nội bộ.',
          );
        }
        if (order.trangThai === TrangThaiDonHang.DA_HUY) {
          throw new BadRequestException('Đơn đã hủy; không phát hành hóa đơn nội bộ.');
        }

        const payment =
          order.thanhToan.find((item) => item.trangThai === TrangThaiThanhToan.PAID) ??
          order.thanhToan[0] ??
          null;
        const rows = order.donNhaCungCap.flatMap((suborder) => suborder.muc);
        if (rows.length === 0) throw new BadRequestException('Đơn hàng không có dòng hàng.');

        const hoaDon = await tx.hoaDonBanHangNoiBo.create({
          data: {
            maHoaDon: taoMaHoaDonNoiBo(),
            donHangId: order.id,
            maDonHangSnapshot: order.maDonHang,
            tenNguoiMuaSnapshot: order.tenNguoiNhanSnapshot ?? order.khachHang.nguoiDung.hoTen,
            soDienThoaiSnapshot: order.soDienThoaiSnapshot ?? order.khachHang.nguoiDung.soDienThoai,
            diaChiSnapshot: order.diaChiGiaoHangSnapshot,
            tamTinhHangHoa: order.tamTinhHangHoa,
            phiVanChuyen: order.phiVanChuyen,
            giamKhuyenMai: order.giamKhuyenMai,
            diemDaDung: order.diemDaDung,
            giaTriDiemDaDung: order.giaTriDiemDaDung,
            tongThanhToan: order.tongTien,
            phuongThucThanhToanSnapshot: payment?.phuongThuc ?? null,
            trangThaiThanhToanSnapshot: payment?.trangThai ?? null,
            nguoiLapId: actor.id,
            nguoiLap: actor.email,
          },
        });

        await tx.hoaDonBanHangNoiBoDong.createMany({
          data: rows.map((row, index) => ({
            hoaDonId: hoaDon.id,
            thuTu: index + 1,
            mucDonHangId: row.id,
            tenSanPhamSnapshot: row.tenSanPhamSnapshot,
            skuSnapshot: row.skuBienTheSnapshot,
            soLuong: row.soLuong,
            donViSnapshot: row.donViBienTheSnapshot,
            donGia: row.donGiaSnapshot,
            thanhTien: Number(row.donGiaSnapshot) * row.soLuong,
            tenTrangTraiSnapshot: row.tenTrangTraiSnapshot,
          })),
        });
        return hoaDon.id;
      });
      return this.layChiTiet(hoaDonId);
    } catch (error) {
      if (laLoiUniquePrisma(error)) {
        const raced = await this.prisma.hoaDonBanHangNoiBo.findUnique({
          where: { donHangId },
          select: { id: true },
        });
        if (raced) return this.layChiTiet(raced.id);
      }
      throw error;
    }
  }
}
