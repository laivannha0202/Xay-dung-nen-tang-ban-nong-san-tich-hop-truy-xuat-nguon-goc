import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CanhBaoHetHanTonKhoService } from './canh-bao-het-han-ton-kho.service';
import { TEN_HANG_DOI } from './hang-doi.constants';
import { taoCauHinhBullMq } from './hang-doi.config';
import { HangDoiService } from './hang-doi.service';
import { EmailWorker } from './workers/email.worker';
import { HeThongWorker } from './workers/he-thong.worker';
import { ThongBaoWorker } from './workers/thong-bao.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: taoCauHinhBullMq,
    }),
    BullModule.registerQueue(
      {
        name: TEN_HANG_DOI.EMAIL,
      },
      {
        name: TEN_HANG_DOI.THONG_BAO,
      },
      {
        name: TEN_HANG_DOI.HE_THONG,
      },
    ),
  ],
  providers: [
    HangDoiService,
    CanhBaoHetHanTonKhoService,
    EmailWorker,
    ThongBaoWorker,
    HeThongWorker,
  ],
  exports: [HangDoiService, CanhBaoHetHanTonKhoService, BullModule],
})
export class HangDoiModule {}
