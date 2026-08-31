import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TonKhoController } from './ton-kho.controller';
import { TonKhoService } from './ton-kho.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [TonKhoController],
  providers: [TonKhoService],
})
export class TonKhoModule {}
