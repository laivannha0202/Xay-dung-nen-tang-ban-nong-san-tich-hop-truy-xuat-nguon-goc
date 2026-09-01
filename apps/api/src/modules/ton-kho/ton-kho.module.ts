import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { HangDoiModule } from '../hang-doi/hang-doi.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TEN_HANG_DOI_DAT_CHO_TON_KHO } from './dat-cho-ton-kho.constants';
import { DatChoTonKhoService } from './dat-cho-ton-kho.service';
import { DatChoTonKhoWorker } from './dat-cho-ton-kho.worker';
import { FefoService } from './fefo.service';
import { GiaoDichTonKhoController } from './giao-dich-ton-kho.controller';
import { GiaoDichTonKhoService } from './giao-dich-ton-kho.service';
import { TonKhoController } from './ton-kho.controller';
import { TonKhoService } from './ton-kho.service';

@Module({
  imports: [
    XacThucModule,
    PhanQuyenModule,
    HangDoiModule,
    BullModule.registerQueue({
      name: TEN_HANG_DOI_DAT_CHO_TON_KHO,
    }),
  ],
  controllers: [TonKhoController, GiaoDichTonKhoController],
  providers: [
    TonKhoService,
    GiaoDichTonKhoService,
    FefoService,
    DatChoTonKhoService,
    DatChoTonKhoWorker,
  ],
  exports: [FefoService, DatChoTonKhoService],
})
export class TonKhoModule {}
