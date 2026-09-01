import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { FefoService } from './fefo.service';
import { GiaoDichTonKhoController } from './giao-dich-ton-kho.controller';
import { GiaoDichTonKhoService } from './giao-dich-ton-kho.service';
import { TonKhoController } from './ton-kho.controller';
import { TonKhoService } from './ton-kho.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [TonKhoController, GiaoDichTonKhoController],
  providers: [TonKhoService, GiaoDichTonKhoService, FefoService],
  exports: [FefoService],
})
export class TonKhoModule {}
