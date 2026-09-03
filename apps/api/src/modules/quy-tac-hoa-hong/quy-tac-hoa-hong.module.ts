import { Module } from '@nestjs/common';

import { QuyTacHoaHongController } from './quy-tac-hoa-hong.controller';
import { QuyTacHoaHongService } from './quy-tac-hoa-hong.service';

@Module({
  controllers: [QuyTacHoaHongController],
  providers: [QuyTacHoaHongService],
  exports: [QuyTacHoaHongService],
})
export class QuyTacHoaHongModule {}
