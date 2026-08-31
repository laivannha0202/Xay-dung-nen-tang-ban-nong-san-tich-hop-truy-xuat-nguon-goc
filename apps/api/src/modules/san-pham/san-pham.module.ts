import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { SanPhamController } from './san-pham.controller';
import { SanPhamService } from './san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [SanPhamController],
  providers: [SanPhamService],
})
export class SanPhamModule {}
