import { Module } from '@nestjs/common';

import { DiaBanHungYenController } from './dia-ban-hung-yen.controller';
import { DiaBanHungYenService } from './dia-ban-hung-yen.service';

@Module({
  controllers: [DiaBanHungYenController],
  providers: [DiaBanHungYenService],
  exports: [DiaBanHungYenService],
})
export class DiaBanHungYenModule {}
