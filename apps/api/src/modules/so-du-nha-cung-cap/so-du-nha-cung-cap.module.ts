import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { SoDuNhaCungCapController } from './so-du-nha-cung-cap.controller';
import { SoDuNhaCungCapService } from './so-du-nha-cung-cap.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [SoDuNhaCungCapController],
  providers: [SoDuNhaCungCapService],
  exports: [SoDuNhaCungCapService],
})
export class SoDuNhaCungCapModule {}
