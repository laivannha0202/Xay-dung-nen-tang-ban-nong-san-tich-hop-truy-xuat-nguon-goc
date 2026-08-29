import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MuaVuController } from './mua-vu.controller';
import { MuaVuService } from './mua-vu.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [MuaVuController],
  providers: [MuaVuService],
  exports: [MuaVuService],
})
export class MuaVuModule {}
