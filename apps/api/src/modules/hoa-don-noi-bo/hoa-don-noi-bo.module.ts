import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { HoaDonNoiBoController } from './hoa-don-noi-bo.controller';
import { HoaDonNoiBoService } from './hoa-don-noi-bo.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [HoaDonNoiBoController],
  providers: [HoaDonNoiBoService],
})
export class HoaDonNoiBoModule {}
