import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { BaoCaoTonKhoController } from './bao-cao-ton-kho.controller';
import { BaoCaoTonKhoService } from './bao-cao-ton-kho.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [BaoCaoTonKhoController],
  providers: [BaoCaoTonKhoService],
  exports: [BaoCaoTonKhoService],
})
export class BaoCaoTonKhoModule {}
