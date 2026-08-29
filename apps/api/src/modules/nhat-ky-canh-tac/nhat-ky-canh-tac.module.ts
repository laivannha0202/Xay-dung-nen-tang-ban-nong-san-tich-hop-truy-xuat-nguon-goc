import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { NhatKyCanhTacController } from './nhat-ky-canh-tac.controller';
import { NhatKyCanhTacService } from './nhat-ky-canh-tac.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [NhatKyCanhTacController],
  providers: [NhatKyCanhTacService],
  exports: [NhatKyCanhTacService],
})
export class NhatKyCanhTacModule {}
