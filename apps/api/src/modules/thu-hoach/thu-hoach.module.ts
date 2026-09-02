import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TheoDoiTrangTraiModule } from '../theo-doi-trang-trai/theo-doi-trang-trai.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { ThuHoachController } from './thu-hoach.controller';
import { ThuHoachService } from './thu-hoach.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TheoDoiTrangTraiModule],
  controllers: [ThuHoachController],
  providers: [ThuHoachService],
  exports: [ThuHoachService],
})
export class ThuHoachModule {}
