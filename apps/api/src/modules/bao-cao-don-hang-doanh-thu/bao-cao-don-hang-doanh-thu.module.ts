import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { BaoCaoDonHangDoanhThuController } from './bao-cao-don-hang-doanh-thu.controller';
import { BaoCaoDonHangDoanhThuService } from './bao-cao-don-hang-doanh-thu.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [BaoCaoDonHangDoanhThuController],
  providers: [BaoCaoDonHangDoanhThuService],
  exports: [BaoCaoDonHangDoanhThuService],
})
export class BaoCaoDonHangDoanhThuModule {}
