import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAccessGuard } from './jwt-access.guard';
import { ThuDienXacThucService } from './thu-dien-xac-thuc.service';
import { XacThucController } from './xac-thuc.controller';
import { XacThucService } from './xac-thuc.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [XacThucController],
  providers: [XacThucService, JwtAccessGuard, ThuDienXacThucService],
  exports: [XacThucService],
})
export class XacThucModule {}
