import { Module } from '@nestjs/common';

import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { ThanhToanController } from './thanh-toan.controller';
import { ThanhToanService } from './thanh-toan.service';

@Module({
  imports: [XacThucModule, TonKhoModule],
  controllers: [ThanhToanController],
  providers: [ThanhToanService],
  exports: [ThanhToanService],
})
export class ThanhToanModule {}
