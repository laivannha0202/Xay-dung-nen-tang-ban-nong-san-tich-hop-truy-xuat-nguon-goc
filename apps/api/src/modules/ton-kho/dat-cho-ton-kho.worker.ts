import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import {
  TEN_CONG_VIEC_HET_HAN_DAT_CHO_TON_KHO,
  TEN_HANG_DOI_DAT_CHO_TON_KHO,
} from './dat-cho-ton-kho.constants';
import { DatChoTonKhoService } from './dat-cho-ton-kho.service';

type DuLieuHetHanDatChoTonKho = {
  datChoTonKhoId: string;
};

@Processor(TEN_HANG_DOI_DAT_CHO_TON_KHO, {
  concurrency: 4,
})
export class DatChoTonKhoWorker extends WorkerHost {
  constructor(private readonly service: DatChoTonKhoService) {
    super();
  }

  async process(job: Job<DuLieuHetHanDatChoTonKho>): Promise<{
    reservationId: string;
    trangThai: string;
  }> {
    if (job.name !== TEN_CONG_VIEC_HET_HAN_DAT_CHO_TON_KHO) {
      throw new Error(`Inventory reservation job không hỗ trợ: ${job.name}`);
    }

    const result = await this.service.hetHan(job.data.datChoTonKhoId);

    return {
      reservationId: result.id,
      trangThai: result.trangThai,
    };
  }
}
