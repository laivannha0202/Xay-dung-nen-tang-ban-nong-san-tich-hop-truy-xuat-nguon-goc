import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { GioHangController } from './gio-hang.controller';
import { GioHangService } from './gio-hang.service';

@Module({
  imports: [XacThucModule],
  controllers: [GioHangController],
  providers: [GioHangService],
  exports: [GioHangService],
})
export class GioHangModule {}
