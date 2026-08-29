import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { ChungNhanController } from './chung-nhan.controller';
import { ChungNhanService } from './chung-nhan.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [ChungNhanController],
  providers: [ChungNhanService],
  exports: [ChungNhanService],
})
export class ChungNhanModule {}
