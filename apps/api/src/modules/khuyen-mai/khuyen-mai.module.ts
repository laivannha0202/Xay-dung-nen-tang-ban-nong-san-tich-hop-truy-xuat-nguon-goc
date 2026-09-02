import { Module } from '@nestjs/common';

import { KhuyenMaiService } from './khuyen-mai.service';

@Module({
  providers: [KhuyenMaiService],
  exports: [KhuyenMaiService],
})
export class KhuyenMaiModule {}
