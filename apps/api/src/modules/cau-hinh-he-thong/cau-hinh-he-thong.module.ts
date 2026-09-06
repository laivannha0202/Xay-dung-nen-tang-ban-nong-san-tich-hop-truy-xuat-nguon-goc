import { Global, Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { CauHinhHeThongController } from './cau-hinh-he-thong.controller';
import { CauHinhHeThongService } from './cau-hinh-he-thong.service';

@Global()
@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [CauHinhHeThongController],
  providers: [CauHinhHeThongService],
  exports: [CauHinhHeThongService],
})
export class CauHinhHeThongModule {}
