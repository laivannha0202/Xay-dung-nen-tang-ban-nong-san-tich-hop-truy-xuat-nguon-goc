import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DanhGiaController } from './danh-gia.controller';
import { DanhGiaQuanTriController } from './danh-gia-quan-tri.controller';
import { DanhGiaQuanTriService } from './danh-gia-quan-tri.service';
import { DanhGiaService } from './danh-gia.service';

@Module({
  imports: [XacThucModule],
  controllers: [DanhGiaController, DanhGiaQuanTriController],
  providers: [DanhGiaService, DanhGiaQuanTriService],
  exports: [DanhGiaService],
})
export class DanhGiaModule {}
