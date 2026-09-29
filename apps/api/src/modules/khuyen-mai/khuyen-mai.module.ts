import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import {
  KhuyenMaiVoucherCongKhaiController,
  VoucherKhachHangController,
} from './khuyen-mai-khach-hang.controller';
import { KhuyenMaiQuanTriController } from './khuyen-mai-quan-tri.controller';
import { KhuyenMaiService } from './khuyen-mai.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [
    KhuyenMaiQuanTriController,
    KhuyenMaiVoucherCongKhaiController,
    VoucherKhachHangController,
  ],
  providers: [KhuyenMaiService],
  exports: [KhuyenMaiService],
})
export class KhuyenMaiModule {}
