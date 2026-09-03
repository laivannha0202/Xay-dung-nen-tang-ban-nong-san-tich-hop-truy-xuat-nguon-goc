import { Module } from '@nestjs/common';

import { SoDuNhaCungCapController } from './so-du-nha-cung-cap.controller';
import { SoDuNhaCungCapService } from './so-du-nha-cung-cap.service';

@Module({
  controllers: [SoDuNhaCungCapController],
  providers: [SoDuNhaCungCapService],
  exports: [SoDuNhaCungCapService],
})
export class SoDuNhaCungCapModule {}
