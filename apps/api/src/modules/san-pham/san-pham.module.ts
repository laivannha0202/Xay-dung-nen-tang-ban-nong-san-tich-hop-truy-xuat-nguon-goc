import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { AnhSanPhamController } from './anh-san-pham.controller';
import { AnhSanPhamService } from './anh-san-pham.service';
import { BienTheSanPhamController } from './bien-the-san-pham.controller';
import { BienTheSanPhamService } from './bien-the-san-pham.service';
import { SanPhamCongKhaiController } from './san-pham-cong-khai.controller';
import { SanPhamCongKhaiService } from './san-pham-cong-khai.service';
import { SanPhamController } from './san-pham.controller';
import { SanPhamService } from './san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [
    SanPhamController,
    SanPhamCongKhaiController,
    BienTheSanPhamController,
    AnhSanPhamController,
  ],
  providers: [SanPhamService, SanPhamCongKhaiService, BienTheSanPhamService, AnhSanPhamService],
})
export class SanPhamModule {}
