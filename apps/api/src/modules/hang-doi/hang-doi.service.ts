import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';

import { TEN_CONG_VIEC, TEN_HANG_DOI } from './hang-doi.constants';

export type DuLieuEmailThu = {
  den: string;
  tieuDe: string;
  noiDung: string;
  maKiemTra: string;
};

export type DuLieuThongBaoThu = {
  maKiemTra: string;
  nguoiDungId?: string;
};

export type DuLieuHeThongThu = {
  maKiemTra: string;
};

export type DuLieuCanhBaoChungNhan = {
  ngayThamChieu?: string;
};

export type DuLieuCanhBaoHetHanTonKho = {
  ngayThamChieu?: string;
  soNgay?: number;
  gioiHan?: number;
};

@Injectable()
export class HangDoiService implements OnModuleInit {
  constructor(
    @InjectQueue(TEN_HANG_DOI.EMAIL)
    private readonly emailQueue: Queue,
    @InjectQueue(TEN_HANG_DOI.THONG_BAO)
    private readonly thongBaoQueue: Queue,
    @InjectQueue(TEN_HANG_DOI.HE_THONG)
    private readonly heThongQueue: Queue,
  ) {}

  async themEmailThu(data: DuLieuEmailThu, options?: JobsOptions): Promise<string> {
    const job = await this.emailQueue.add(TEN_CONG_VIEC.GUI_EMAIL_THU, data, options);

    return String(job.id);
  }

  async themThongBaoThu(data: DuLieuThongBaoThu, options?: JobsOptions): Promise<string> {
    const job = await this.thongBaoQueue.add(TEN_CONG_VIEC.KIEM_TRA_THONG_BAO, data, options);

    return String(job.id);
  }

  async themCongViecHeThongThu(data: DuLieuHeThongThu, options?: JobsOptions): Promise<string> {
    const job = await this.heThongQueue.add(TEN_CONG_VIEC.KIEM_TRA_HE_THONG, data, options);

    return String(job.id);
  }

  async onModuleInit(): Promise<void> {
    await this.damBaoLichCanhBaoChungNhan();
    await this.damBaoLichCanhBaoHetHanTonKho();
  }

  async damBaoLichCanhBaoChungNhan(): Promise<void> {
    await this.heThongQueue.upsertJobScheduler(
      'chung-nhan-hang-ngay',
      {
        pattern: '0 0 1 * * *',
      },
      {
        name: TEN_CONG_VIEC.CANH_BAO_CHUNG_NHAN,
        data: {},
      },
    );
  }

  async themCanhBaoChungNhan(
    data: DuLieuCanhBaoChungNhan = {},
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.heThongQueue.add(TEN_CONG_VIEC.CANH_BAO_CHUNG_NHAN, data, options);

    return String(job.id);
  }

  async damBaoLichCanhBaoHetHanTonKho(): Promise<void> {
    await this.heThongQueue.upsertJobScheduler(
      'ton-kho-het-han-hang-ngay',
      {
        pattern: '0 10 1 * * *',
      },
      {
        name: TEN_CONG_VIEC.CANH_BAO_HET_HAN_TON_KHO,
        data: {},
      },
    );
  }

  async themCanhBaoHetHanTonKho(
    data: DuLieuCanhBaoHetHanTonKho = {},
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.heThongQueue.add(TEN_CONG_VIEC.CANH_BAO_HET_HAN_TON_KHO, data, options);

    return String(job.id);
  }
}
