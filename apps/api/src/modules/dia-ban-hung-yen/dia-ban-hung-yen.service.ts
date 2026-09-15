import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import type {
  ThonToDanPhoPhanHoiDto,
  XaPhuongHungYenPhanHoiDto,
} from './dto/phan-hoi-dia-ban-hung-yen.dto';

// Chuẩn hóa không dấu dùng cho tìm kiếm (ví dụ "thai binh" -> "Thái Bình").
export function chuanHoaTenDiaBanHungYen(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class DiaBanHungYenService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSachXaPhuong(tuKhoa?: string): Promise<XaPhuongHungYenPhanHoiDto[]> {
    const danhSach = await this.prisma.xaPhuongHungYen.findMany({
      where: { hoatDong: true },
      select: { ma: true, ten: true, tenDayDu: true, loai: true, tenChuanHoa: true },
      orderBy: [{ tenChuanHoa: 'asc' }, { ma: 'asc' }],
    });

    const tuKhoaChuanHoa = tuKhoa?.trim() ? chuanHoaTenDiaBanHungYen(tuKhoa) : '';
    if (!tuKhoaChuanHoa) return danhSach;

    return danhSach.filter((item) => {
      const tenChuanHoa = chuanHoaTenDiaBanHungYen(item.ten);
      const tenDayDuChuanHoa = chuanHoaTenDiaBanHungYen(item.tenDayDu);
      return (
        item.tenChuanHoa.includes(tuKhoaChuanHoa) ||
        tenChuanHoa.includes(tuKhoaChuanHoa) ||
        tenDayDuChuanHoa.includes(tuKhoaChuanHoa) ||
        item.ma.toLowerCase().includes(tuKhoaChuanHoa)
      );
    });
  }

  async layDanhSachThonToDanPhoTheoXaPhuong(
    xaPhuongMa: string,
  ): Promise<ThonToDanPhoPhanHoiDto[]> {
    const xaPhuong = await this.prisma.xaPhuongHungYen.findUnique({
      where: { ma: xaPhuongMa.trim() },
      select: { ma: true, hoatDong: true },
    });
    if (!xaPhuong || !xaPhuong.hoatDong) {
      throw new NotFoundException('Không tìm thấy xã/phường thuộc tỉnh Hưng Yên.');
    }

    return this.prisma.thonToDanPho.findMany({
      where: { xaPhuongMa: xaPhuong.ma, hoatDong: true },
      select: { ma: true, ten: true, tenDayDu: true, loai: true },
      orderBy: [{ tenChuanHoa: 'asc' }, { ma: 'asc' }],
    });
  }
}
