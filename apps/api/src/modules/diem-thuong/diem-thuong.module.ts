import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { DiemThuongController } from './diem-thuong.controller';
import { DiemThuongService } from './diem-thuong.service';

@Module({
  imports: [XacThucModule],
  controllers: [DiemThuongController],
  providers: [DiemThuongService],
})
export class DiemThuongModule {}
