import { Module } from '@nestjs/common';

import { BaoCaoTruyXuatController } from './bao-cao-truy-xuat.controller';
import { BaoCaoTruyXuatService } from './bao-cao-truy-xuat.service';

@Module({
  controllers: [BaoCaoTruyXuatController],
  providers: [BaoCaoTruyXuatService],
  exports: [BaoCaoTruyXuatService],
})
export class BaoCaoTruyXuatModule {}
