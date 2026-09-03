import { Module } from '@nestjs/common';

import { SoDuNhaCungCapModule } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.module';

import { ChiTraNhaCungCapController } from './chi-tra-nha-cung-cap.controller';
import { ChiTraNhaCungCapService } from './chi-tra-nha-cung-cap.service';

@Module({
  imports: [SoDuNhaCungCapModule],
  controllers: [ChiTraNhaCungCapController],
  providers: [ChiTraNhaCungCapService],
  exports: [ChiTraNhaCungCapService],
})
export class ChiTraNhaCungCapModule {}
