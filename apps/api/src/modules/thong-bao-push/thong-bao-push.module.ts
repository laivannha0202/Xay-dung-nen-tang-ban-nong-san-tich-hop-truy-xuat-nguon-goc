import { Module } from '@nestjs/common';

import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { ThongBaoPushController } from './thong-bao-push.controller';
import { ThongBaoPushService } from './thong-bao-push.service';

@Module({
  imports: [XacThucModule],
  controllers: [ThongBaoPushController],
  providers: [ThongBaoPushService],
  exports: [ThongBaoPushService],
})
export class ThongBaoPushModule {}
