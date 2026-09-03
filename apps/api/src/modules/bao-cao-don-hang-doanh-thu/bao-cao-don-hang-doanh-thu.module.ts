import { Module } from '@nestjs/common';

import { BaoCaoDonHangDoanhThuController } from './bao-cao-don-hang-doanh-thu.controller';
import { BaoCaoDonHangDoanhThuService } from './bao-cao-don-hang-doanh-thu.service';

@Module({
  controllers: [BaoCaoDonHangDoanhThuController],
  providers: [BaoCaoDonHangDoanhThuService],
  exports: [BaoCaoDonHangDoanhThuService],
})
export class BaoCaoDonHangDoanhThuModule {}
