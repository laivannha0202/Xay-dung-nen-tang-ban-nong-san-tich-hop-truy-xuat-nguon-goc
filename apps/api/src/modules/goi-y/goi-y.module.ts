import { Module } from '@nestjs/common';

import { SanPhamModule } from '../san-pham/san-pham.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { GoiYController } from './goi-y.controller';
import { GoiYService } from './goi-y.service';

@Module({
  imports: [XacThucModule, SanPhamModule],
  controllers: [GoiYController],
  providers: [GoiYService],
  exports: [GoiYService],
})
export class GoiYModule {}
