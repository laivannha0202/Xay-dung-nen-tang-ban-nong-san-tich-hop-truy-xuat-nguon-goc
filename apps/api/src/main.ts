import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { cauHinhUngDung } from './cau-hinh-ung-dung';

const logger = new Logger('KhoiDong');

async function khoiDong(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  cauHinhUngDung(app);

  const configService = app.get(ConfigService);
  const cong = Number(configService.get<string>('PORT') ?? '3000');

  await app.listen(cong, '0.0.0.0');
  logger.log(`AgriMarket API đang chạy tại cổng ${cong}`);
}

void khoiDong();
