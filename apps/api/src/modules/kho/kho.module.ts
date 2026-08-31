import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { KhoController } from './kho.controller';
import { KhoService } from './kho.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [KhoController],
  providers: [KhoService],
})
export class KhoModule {}
