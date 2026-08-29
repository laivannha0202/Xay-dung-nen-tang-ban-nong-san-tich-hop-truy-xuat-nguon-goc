import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { NhaCungCapController } from './nha-cung-cap.controller';
import { NhaCungCapService } from './nha-cung-cap.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [NhaCungCapController],
  providers: [NhaCungCapService],
  exports: [NhaCungCapService],
})
export class NhaCungCapModule {}
