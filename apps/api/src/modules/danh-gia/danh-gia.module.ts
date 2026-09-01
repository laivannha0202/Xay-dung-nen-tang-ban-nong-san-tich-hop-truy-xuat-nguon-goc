import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DanhGiaController } from './danh-gia.controller';
import { DanhGiaService } from './danh-gia.service';

@Module({
  imports: [XacThucModule],
  controllers: [DanhGiaController],
  providers: [DanhGiaService],
  exports: [DanhGiaService],
})
export class DanhGiaModule {}
