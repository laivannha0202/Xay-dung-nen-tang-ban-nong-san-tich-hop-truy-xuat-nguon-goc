import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { QuyTacHoaHongController } from './quy-tac-hoa-hong.controller';
import { QuyTacHoaHongService } from './quy-tac-hoa-hong.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [QuyTacHoaHongController],
  providers: [QuyTacHoaHongService],
  exports: [QuyTacHoaHongService],
})
export class QuyTacHoaHongModule {}
