import { Global, Module } from '@nestjs/common';

import { CauHinhHeThongController } from './cau-hinh-he-thong.controller';
import { CauHinhHeThongService } from './cau-hinh-he-thong.service';

@Global()
@Module({
  controllers: [CauHinhHeThongController],
  providers: [CauHinhHeThongService],
  exports: [CauHinhHeThongService],
})
export class CauHinhHeThongModule {}
