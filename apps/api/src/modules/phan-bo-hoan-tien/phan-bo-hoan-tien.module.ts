import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PhanBoHoanTienService } from './phan-bo-hoan-tien.service';

@Module({
  imports: [PrismaModule],
  providers: [PhanBoHoanTienService],
  exports: [PhanBoHoanTienService],
})
export class PhanBoHoanTienModule {}
