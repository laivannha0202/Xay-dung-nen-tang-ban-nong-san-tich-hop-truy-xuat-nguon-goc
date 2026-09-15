import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

import { PrismaClient, TrangThaiBanGhi } from '../src/generated/prisma/client';

const PREFIXES = [
  'FARM-A-P52-',
  'FARM-A37-',
  'FARM-B-P52-',
  'FARM-BATCH-',
  'FARM-CB56-',
  'FARM-CERT-',
  'FARM-CHANGED-',
  'FARM-CULT-',
  'FARM-E40-',
  'FARM-F74-',
  'FARM-F74-NCCX-',
  'FARM-F74-X-',
  'FARM-FEFO-',
  'FARM-FS-',
  'FARM-GHL-',
  'FARM-HARV-',
  'FARM-I32-',
  'FARM-L36-',
  'FARM-P107-',
  'FARM-P108-',
  'FARM-P110-',
  'FARM-P112-F-',
  'FARM-P112-N-',
  'FARM-P114-',
  'FARM-P30-',
  'FARM-P30-OFF-',
  'FARM-P33-A-',
  'FARM-P33-B-',
  'FARM-P33-X-',
  'FARM-P43-A-',
  'FARM-P43-B-',
  'FARM-P45-',
  'FARM-P47-',
  'FARM-P49-',
  'FARM-P50-',
  'FARM-P51-',
  'FARM-P54-',
  'FARM-PT-',
  'FARM-PUBLIC-',
  'FARM-QR-',
  'FARM-QUALITY-',
  'FARM-RECALL-',
  'FARM-SEASON-',
  'FARM-TK35-',
  'FARM-TRACE-',
  'FARM-V31-',
  'FARM-W73-',
] as const;

function tachDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

  return {
    host: url.hostname,
    port: Number(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 5,
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname),
  };
}

export default async function globalTeardown() {
  loadEnv({ path: resolve(process.cwd(), '.env') });
  loadEnv({ path: resolve(process.cwd(), 'apps/api/.env') });

  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return;
  }

  const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
  const prisma = new PrismaClient({ adapter });

  try {
    const dieuKien = PREFIXES.map((prefix) => ({ ma: { startsWith: prefix } }));

    await prisma.trangTrai.updateMany({
      where: {
        OR: dieuKien,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      data: {
        trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
        noiBatTrangChu: false,
        thuTuNoiBat: null,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
