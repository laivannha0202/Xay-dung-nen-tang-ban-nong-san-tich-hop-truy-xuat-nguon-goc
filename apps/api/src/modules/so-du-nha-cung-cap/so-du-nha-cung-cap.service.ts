import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import type {
  DanhSachSoDuNhaCungCapDto,
  SoDuNhaCungCapDto,
} from './dto/phan-hoi-so-du-nha-cung-cap.dto';
import type { TruyVanSoDuNhaCungCapDto } from './dto/truy-van-so-du-nha-cung-cap.dto';

const NHA_CUNG_CAP_SO_DU_SELECT = {
  id: true,
  ma: true,
  ten: true,
  soDu: {
    select: {
      dangCho: true,
      khaDung: true,
      tamGiu: true,
      daThanhToan: true,
    },
  },
} satisfies Prisma.NhaCungCapSelect;

type NhaCungCapVoiSoDu = Prisma.NhaCungCapGetPayload<{
  select: typeof NHA_CUNG_CAP_SO_DU_SELECT;
}>;

@Injectable()
export class SoDuNhaCungCapService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: TruyVanSoDuNhaCungCapDto): Promise<DanhSachSoDuNhaCungCapDto> {
    const where: Prisma.NhaCungCapWhereInput = query.nhaCungCapId ? { id: query.nhaCungCapId } : {};
    const skip = (query.trang - 1) * query.gioiHan;

    const [tong, rows] = await this.prisma.$transaction([
      this.prisma.nhaCungCap.count({ where }),
      this.prisma.nhaCungCap.findMany({
        where,
        select: NHA_CUNG_CAP_SO_DU_SELECT,
        orderBy: [{ ten: 'asc' }, { id: 'asc' }],
        skip,
        take: query.gioiHan,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.mapSoDu(row)),
      tong,
      trang: query.trang,
      gioiHan: query.gioiHan,
    };
  }

  async layTheoNhaCungCap(nhaCungCapId: string): Promise<SoDuNhaCungCapDto> {
    const row = await this.prisma.nhaCungCap.findUnique({
      where: { id: nhaCungCapId },
      select: NHA_CUNG_CAP_SO_DU_SELECT,
    });
    if (!row) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp.');
    }
    return this.mapSoDu(row);
  }

  private mapSoDu(row: NhaCungCapVoiSoDu): SoDuNhaCungCapDto {
    return {
      nhaCungCapId: row.id,
      maNhaCungCap: row.ma,
      tenNhaCungCap: row.ten,
      dangCho: Number(row.soDu?.dangCho ?? 0),
      khaDung: Number(row.soDu?.khaDung ?? 0),
      tamGiu: Number(row.soDu?.tamGiu ?? 0),
      daThanhToan: Number(row.soDu?.daThanhToan ?? 0),
    };
  }
}
