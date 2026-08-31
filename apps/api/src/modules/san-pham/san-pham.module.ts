import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { BienTheSanPhamController } from './bien-the-san-pham.controller';
import { BienTheSanPhamService } from './bien-the-san-pham.service';
import { SanPhamController } from './san-pham.controller';
import { SanPhamService } from './san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [SanPhamController, BienTheSanPhamController],
  providers: [SanPhamService, BienTheSanPhamService],
})
export class SanPhamModule {}
