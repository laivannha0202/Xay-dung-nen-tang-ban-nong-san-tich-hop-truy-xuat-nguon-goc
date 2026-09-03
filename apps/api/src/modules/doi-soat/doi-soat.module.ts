import { Module } from '@nestjs/common';

import { SoDuNhaCungCapModule } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.module';

import { DoiSoatController } from './doi-soat.controller';
import { DoiSoatService } from './doi-soat.service';

@Module({
  imports: [SoDuNhaCungCapModule],
  controllers: [DoiSoatController],
  providers: [DoiSoatService],
  exports: [DoiSoatService],
})
export class DoiSoatModule {}
