import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { HoSoKhachHangController } from './ho-so-khach-hang.controller';
import { HoSoKhachHangService } from './ho-so-khach-hang.service';

@Module({
  imports: [XacThucModule],
  controllers: [HoSoKhachHangController],
  providers: [HoSoKhachHangService],
  exports: [HoSoKhachHangService],
})
export class HoSoKhachHangModule {}
