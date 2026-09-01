import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { PrismaService } from '../../../database/prisma.service';
import { TrangThaiXacMinhChungNhan } from '../../../generated/prisma/client';

import { CanhBaoHetHanTonKhoService } from '../canh-bao-het-han-ton-kho.service';
import { TEN_CONG_VIEC, TEN_HANG_DOI } from '../hang-doi.constants';
import type {
  DuLieuCanhBaoChungNhan,
  DuLieuCanhBaoHetHanTonKho,
  DuLieuHeThongThu,
} from '../hang-doi.service';

type KetQuaCanhBao = {
  canhBao30Ngay: number;
  canhBao7Ngay: number;
  hetHan: number;
  ngayThamChieu: string;
};

type KetQuaCanhBaoHetHanTonKhoJob = {
  tongSapHetHan: number;
  tongHetHan: number;
  ngayThamChieu: string;
  soNgayCanhBao: number;
};

@Processor(TEN_HANG_DOI.HE_THONG, {
  concurrency: 2,
})
export class HeThongWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canhBaoHetHanTonKho: CanhBaoHetHanTonKhoService,
  ) {
    super();
  }

  async process(
    job: Job<DuLieuHeThongThu | DuLieuCanhBaoChungNhan | DuLieuCanhBaoHetHanTonKho>,
  ): Promise<
    | {
        daXuLy: boolean;
        maKiemTra: string;
      }
    | KetQuaCanhBao
    | KetQuaCanhBaoHetHanTonKhoJob
  > {
    if (job.name === TEN_CONG_VIEC.KIEM_TRA_HE_THONG) {
      const data = job.data as DuLieuHeThongThu;

      return {
        daXuLy: true,
        maKiemTra: data.maKiemTra,
      };
    }

    if (job.name === TEN_CONG_VIEC.CANH_BAO_CHUNG_NHAN) {
      return this.xuLyCanhBao(job.data as DuLieuCanhBaoChungNhan);
    }

    if (job.name === TEN_CONG_VIEC.CANH_BAO_HET_HAN_TON_KHO) {
      const data = job.data as DuLieuCanhBaoHetHanTonKho;
      const result = await this.canhBaoHetHanTonKho.layCanhBao({
        ngayThamChieu: data.ngayThamChieu,
        soNgay: data.soNgay,
        gioiHan: data.gioiHan ?? 1,
      });

      return {
        tongSapHetHan: result.tongSapHetHan,
        tongHetHan: result.tongHetHan,
        ngayThamChieu: result.ngayThamChieu,
        soNgayCanhBao: result.soNgayCanhBao,
      };
    }

    throw new Error(`System job không hỗ trợ: ${job.name}`);
  }

  private async xuLyCanhBao(data: DuLieuCanhBaoChungNhan): Promise<KetQuaCanhBao> {
    const ngay = this.layNgayThamChieu(data.ngayThamChieu);

    const sau7 = this.congNgay(ngay, 7);
    const sau30 = this.congNgay(ngay, 30);
    const lucXuLy = new Date();

    const [moc30, moc7, hetHan] = await Promise.all([
      this.prisma.chungNhan.findMany({
        where: {
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
          canhBao30NgayLuc: null,
          ngayHetHan: {
            gt: sau7,
            lte: sau30,
          },
        },
        select: {
          id: true,
          ma: true,
          ngayHetHan: true,
        },
      }),
      this.prisma.chungNhan.findMany({
        where: {
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
          canhBao7NgayLuc: null,
          ngayHetHan: {
            gte: ngay,
            lte: sau7,
          },
        },
        select: {
          id: true,
          ma: true,
          ngayHetHan: true,
        },
      }),
      this.prisma.chungNhan.findMany({
        where: {
          trangThaiXacMinh: TrangThaiXacMinhChungNhan.DA_XAC_MINH,
          canhBaoHetHanLuc: null,
          ngayHetHan: {
            lt: ngay,
          },
        },
        select: {
          id: true,
          ma: true,
          ngayHetHan: true,
        },
      }),
    ]);

    return {
      canhBao30Ngay: await this.danhDau30Ngay(moc30, lucXuLy, ngay),
      canhBao7Ngay: await this.danhDau7Ngay(moc7, lucXuLy, ngay),
      hetHan: await this.danhDauHetHan(hetHan, lucXuLy, ngay),
      ngayThamChieu: ngay.toISOString().slice(0, 10),
    };
  }

  private async danhDau30Ngay(
    items: Array<{
      id: string;
      ma: string;
      ngayHetHan: Date;
    }>,
    lucXuLy: Date,
    ngayThamChieu: Date,
  ): Promise<number> {
    return this.danhDau(items, '30', lucXuLy, ngayThamChieu);
  }

  private async danhDau7Ngay(
    items: Array<{
      id: string;
      ma: string;
      ngayHetHan: Date;
    }>,
    lucXuLy: Date,
    ngayThamChieu: Date,
  ): Promise<number> {
    return this.danhDau(items, '7', lucXuLy, ngayThamChieu);
  }

  private async danhDauHetHan(
    items: Array<{
      id: string;
      ma: string;
      ngayHetHan: Date;
    }>,
    lucXuLy: Date,
    ngayThamChieu: Date,
  ): Promise<number> {
    return this.danhDau(items, 'het-han', lucXuLy, ngayThamChieu);
  }

  private async danhDau(
    items: Array<{
      id: string;
      ma: string;
      ngayHetHan: Date;
    }>,
    moc: '30' | '7' | 'het-han',
    lucXuLy: Date,
    ngayThamChieu: Date,
  ): Promise<number> {
    let count = 0;

    for (const item of items) {
      const ok = await this.prisma.$transaction(async (tx) => {
        const updated =
          moc === '30'
            ? await tx.chungNhan.updateMany({
                where: {
                  id: item.id,
                  canhBao30NgayLuc: null,
                },
                data: {
                  canhBao30NgayLuc: lucXuLy,
                },
              })
            : moc === '7'
              ? await tx.chungNhan.updateMany({
                  where: {
                    id: item.id,
                    canhBao7NgayLuc: null,
                  },
                  data: {
                    canhBao7NgayLuc: lucXuLy,
                  },
                })
              : await tx.chungNhan.updateMany({
                  where: {
                    id: item.id,
                    canhBaoHetHanLuc: null,
                  },
                  data: {
                    canhBaoHetHanLuc: lucXuLy,
                  },
                });

        if (updated.count !== 1) {
          return false;
        }

        const hanhDong =
          moc === '30'
            ? 'CHUNG_NHAN_CANH_BAO_30_NGAY'
            : moc === '7'
              ? 'CHUNG_NHAN_CANH_BAO_7_NGAY'
              : 'CHUNG_NHAN_CANH_BAO_HET_HAN';

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: null,
            tacNhan: 'HE_THONG',
            hanhDong,
            thucThe: 'chung_nhan',
            thucTheId: item.id,
            sau: {
              ma: item.ma,
              ngayHetHan: item.ngayHetHan.toISOString().slice(0, 10),
            },
            metadata: {
              ngayThamChieu: ngayThamChieu.toISOString().slice(0, 10),
              moc,
            },
          },
        });

        return true;
      });

      if (ok) {
        count += 1;
      }
    }

    return count;
  }

  private layNgayThamChieu(value?: string): Date {
    if (value !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('ngayThamChieu phải có dạng YYYY-MM-DD.');
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);

      if (Number.isNaN(parsed.getTime())) {
        throw new Error('ngayThamChieu không hợp lệ.');
      }

      return parsed;
    }

    const now = new Date();

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private congNgay(date: Date, soNgay: number): Date {
    return new Date(date.getTime() + soNgay * 86_400_000);
  }
}
