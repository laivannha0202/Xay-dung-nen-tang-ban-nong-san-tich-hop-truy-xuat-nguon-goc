import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { KhachHangQuanTriController } from './khach-hang-quan-tri.controller';
import { KhachHangQuanTriService } from './khach-hang-quan-tri.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [KhachHangQuanTriController],
  providers: [KhachHangQuanTriService],
})
export class KhachHangQuanTriModule {}
