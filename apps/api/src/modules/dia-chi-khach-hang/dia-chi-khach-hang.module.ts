import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DiaChiKhachHangController } from './dia-chi-khach-hang.controller';
import { DiaChiKhachHangService } from './dia-chi-khach-hang.service';

@Module({
  imports: [XacThucModule],
  controllers: [DiaChiKhachHangController],
  providers: [DiaChiKhachHangService],
})
export class DiaChiKhachHangModule {}
