import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { NhatKyKiemToanController } from './nhat-ky-kiem-toan.controller';
import { NhatKyKiemToanService } from './nhat-ky-kiem-toan.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [NhatKyKiemToanController],
  providers: [NhatKyKiemToanService],
  exports: [NhatKyKiemToanService],
})
export class NhatKyKiemToanModule {}
