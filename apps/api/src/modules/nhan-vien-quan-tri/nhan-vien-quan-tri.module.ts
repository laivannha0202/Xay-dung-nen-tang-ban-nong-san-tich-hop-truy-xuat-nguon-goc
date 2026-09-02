import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';
import { NhanVienQuanTriController } from './nhan-vien-quan-tri.controller';
import { NhanVienQuanTriService } from './nhan-vien-quan-tri.service';

@Module({
  imports: [PrismaModule, XacThucModule, PhanQuyenModule],
  controllers: [NhanVienQuanTriController],
  providers: [NhanVienQuanTriService],
})
export class NhanVienQuanTriModule {}
