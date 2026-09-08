import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { TepTinController } from './tep-tin.controller';
import { TepTinServeController } from './tep-tin-serve.controller';
import { TepTinService } from './tep-tin.service';

@Module({
  imports: [XacThucModule],
  controllers: [TepTinController, TepTinServeController],
  providers: [TepTinService],
  exports: [TepTinService],
})
export class TepTinModule {}
