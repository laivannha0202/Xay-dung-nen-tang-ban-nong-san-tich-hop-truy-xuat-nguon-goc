import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { KhieuNaiQuanTriController } from './khieu-nai-quan-tri.controller';
import { KhieuNaiController } from './khieu-nai.controller';
import { KhieuNaiService } from './khieu-nai.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [KhieuNaiController, KhieuNaiQuanTriController],
  providers: [KhieuNaiService],
  exports: [KhieuNaiService],
})
export class KhieuNaiModule {}
