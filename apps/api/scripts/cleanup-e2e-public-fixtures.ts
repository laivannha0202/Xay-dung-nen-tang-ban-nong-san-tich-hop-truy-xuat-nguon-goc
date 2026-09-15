import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient, TrangThaiBanGhi } from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

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

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Từ chối cleanup fixture E2E trên NODE_ENV=production.');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Thiếu DATABASE_URL.');
  }

  if (PREFIXES.length === 0) {
    console.log('[farm-cleanup] Không tìm thấy prefix fixture farm E2E trong source test.');
    return;
  }

  const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
  const prisma = new PrismaClient({ adapter });

  try {
    const dieuKien = PREFIXES.map((prefix) => ({ ma: { startsWith: prefix } }));

    const truoc = await prisma.trangTrai.count({
      where: {
        OR: dieuKien,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    if (truoc === 0) {
      console.log('[farm-cleanup] Không có farm fixture E2E đang công khai.');
      return;
    }

    const ketQua = await prisma.trangTrai.updateMany({
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

    console.log(`[farm-cleanup] Đã ẩn ${ketQua.count} farm fixture E2E khỏi API công khai.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[farm-cleanup] Lỗi:', error);
  process.exitCode = 1;
});
