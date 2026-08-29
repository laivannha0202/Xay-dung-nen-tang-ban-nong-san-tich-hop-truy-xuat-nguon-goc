import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { TEN_CONG_VIEC, TEN_HANG_DOI } from '../hang-doi.constants';
import type { DuLieuHeThongThu } from '../hang-doi.service';

@Processor(TEN_HANG_DOI.HE_THONG, {
  concurrency: 2,
})
export class HeThongWorker extends WorkerHost {
  async process(job: Job<DuLieuHeThongThu>): Promise<{
    daXuLy: boolean;
    maKiemTra: string;
  }> {
    if (job.name !== TEN_CONG_VIEC.KIEM_TRA_HE_THONG) {
      throw new Error(`System job không hỗ trợ: ${job.name}`);
    }

    return {
      daXuLy: true,
      maKiemTra: job.data.maKiemTra,
    };
  }
}
