import { Module } from '@nestjs/common';

import { TruyXuatCongKhaiController } from './truy-xuat-cong-khai.controller';
import { TruyXuatCongKhaiService } from './truy-xuat-cong-khai.service';

@Module({
  controllers: [TruyXuatCongKhaiController],
  providers: [TruyXuatCongKhaiService],
})
export class TruyXuatCongKhaiModule {}
