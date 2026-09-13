import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { NoiDungTrangChuCongKhaiController } from './noi-dung-trang-chu-cong-khai.controller';
import { NoiDungTrangChuQuanTriController } from './noi-dung-trang-chu-quan-tri.controller';
import { NoiDungTrangChuService } from './noi-dung-trang-chu.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [NoiDungTrangChuCongKhaiController, NoiDungTrangChuQuanTriController],
  providers: [NoiDungTrangChuService],
  exports: [NoiDungTrangChuService],
})
export class NoiDungTrangChuModule {}
