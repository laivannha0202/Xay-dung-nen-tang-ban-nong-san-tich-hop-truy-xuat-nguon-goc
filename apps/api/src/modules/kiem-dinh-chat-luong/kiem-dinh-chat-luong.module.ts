import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TepTinModule } from '../tep-tin/tep-tin.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { KiemDinhChatLuongController } from './kiem-dinh-chat-luong.controller';
import { KiemDinhChatLuongService } from './kiem-dinh-chat-luong.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule, TepTinModule],
  controllers: [KiemDinhChatLuongController],
  providers: [KiemDinhChatLuongService],
  exports: [KiemDinhChatLuongService],
})
export class KiemDinhChatLuongModule {}
