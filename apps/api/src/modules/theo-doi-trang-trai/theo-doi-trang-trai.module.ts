import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TheoDoiTrangTraiController } from './theo-doi-trang-trai.controller';
import { TheoDoiTrangTraiService } from './theo-doi-trang-trai.service';

@Module({
  imports: [XacThucModule],
  controllers: [TheoDoiTrangTraiController],
  providers: [TheoDoiTrangTraiService],
  exports: [TheoDoiTrangTraiService],
})
export class TheoDoiTrangTraiModule {}
