import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { TEN_CONG_VIEC, TEN_HANG_DOI } from '../hang-doi.constants';
import type { DuLieuThongBaoThu } from '../hang-doi.service';

@Processor(TEN_HANG_DOI.THONG_BAO, {
  concurrency: 5,
})
export class ThongBaoWorker extends WorkerHost {
  async process(job: Job<DuLieuThongBaoThu>): Promise<{
    daXuLy: boolean;
    maKiemTra: string;
  }> {
    if (job.name !== TEN_CONG_VIEC.KIEM_TRA_THONG_BAO) {
      throw new Error(`Notification job không hỗ trợ: ${job.name}`);
    }

    return {
      daXuLy: true,
      maKiemTra: job.data.maKiemTra,
    };
  }
}
