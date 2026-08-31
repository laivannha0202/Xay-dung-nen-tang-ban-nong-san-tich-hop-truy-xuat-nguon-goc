import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DanhMucSanPhamController } from './danh-muc-san-pham.controller';
import { DanhMucSanPhamService } from './danh-muc-san-pham.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [DanhMucSanPhamController],
  providers: [DanhMucSanPhamService],
})
export class DanhMucSanPhamModule {}
