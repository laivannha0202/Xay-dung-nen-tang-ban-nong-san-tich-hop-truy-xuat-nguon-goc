import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { PhanQuyenController } from './phan-quyen.controller';
import { PhanQuyenService } from './phan-quyen.service';
import { QuyenGuard } from './quyen.guard';

@Module({
  imports: [XacThucModule],
  controllers: [PhanQuyenController],
  providers: [PhanQuyenService, QuyenGuard],
  exports: [PhanQuyenService, QuyenGuard],
})
export class PhanQuyenModule {}
