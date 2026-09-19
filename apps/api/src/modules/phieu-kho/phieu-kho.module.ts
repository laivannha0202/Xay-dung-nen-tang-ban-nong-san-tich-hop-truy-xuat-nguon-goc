import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { PhieuKhoController } from './phieu-kho.controller';
import { PhieuKhoService } from './phieu-kho.service';
import { PhieuKhoWriterService } from './phieu-kho-writer.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [PhieuKhoController],
  providers: [PhieuKhoService, PhieuKhoWriterService],
  exports: [PhieuKhoWriterService],
})
export class PhieuKhoModule {}
