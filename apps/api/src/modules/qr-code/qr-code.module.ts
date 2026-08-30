import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { QrCodeController } from './qr-code.controller';
import { QrCodeService } from './qr-code.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [QrCodeController],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
