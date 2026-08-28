import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';

type CauHinhMariaDb = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
};

function tachDatabaseUrl(databaseUrl: string): CauHinhMariaDb {
  const url = new URL(databaseUrl);

  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL phải dùng giao thức mysql://');
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) {
    throw new Error('DATABASE_URL chưa có tên database.');
  }

  return {
    host: url.hostname,
    port: Number(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 10,
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
    const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async kiemTraKetNoi(): Promise<boolean> {
    const ketQua = await this.$queryRawUnsafe<Array<{ ketQua: number }>>('SELECT 1 AS ketQua');

    return Number(ketQua[0]?.ketQua) === 1;
  }
}
