import { Module } from '@nestjs/common';

import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TheoDoiTrangTraiController } from './theo-doi-trang-trai.controller';
import { TheoDoiTrangTraiService } from './theo-doi-trang-trai.service';

@Module({
  imports: [XacThucModule, TepTinModule],
  controllers: [TheoDoiTrangTraiController],
  providers: [TheoDoiTrangTraiService],
  exports: [TheoDoiTrangTraiService],
})
export class TheoDoiTrangTraiModule {}
