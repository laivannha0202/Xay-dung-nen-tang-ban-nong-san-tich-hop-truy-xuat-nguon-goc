import { Module } from '@nestjs/common';

import { SucKhoeController } from './suc-khoe.controller';
import { SucKhoeService } from './suc-khoe.service';

@Module({
  controllers: [SucKhoeController],
  providers: [SucKhoeService],
})
export class SucKhoeModule {}
