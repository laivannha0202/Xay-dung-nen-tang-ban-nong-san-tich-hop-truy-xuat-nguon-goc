import { Module } from '@nestjs/common';

import { BaoCaoTonKhoController } from './bao-cao-ton-kho.controller';
import { BaoCaoTonKhoService } from './bao-cao-ton-kho.service';

@Module({
  controllers: [BaoCaoTonKhoController],
  providers: [BaoCaoTonKhoService],
  exports: [BaoCaoTonKhoService],
})
export class BaoCaoTonKhoModule {}
