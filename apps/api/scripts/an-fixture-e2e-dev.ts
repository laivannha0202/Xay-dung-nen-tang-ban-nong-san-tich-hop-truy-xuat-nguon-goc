/**
 * DEV-ONLY: ẨN fixture E2E còn sót khỏi catalog công khai khi fixture đã bị
 * đơn hàng tham chiếu (script don-dep-fixture-e2e-dev.ts từ chối XÓA để giữ
 * lịch sử đơn — đúng). Ẩn = chuyển trangThai sang NGUNG_HOAT_DONG nên:
 * - whereCongKhai() loại khỏi /san-pham, facets, related, detail;
 * - đơn hàng cũ giữ nguyên (snapshot + FK không đụng);
 * - test E2E không ảnh hưởng (mỗi lượt chạy tự tạo fixture suffix riêng).
 *
 * Chỉ nhắm marker fixture E2E: %PHIEN%, %Create Order%, slug %p52%,
 * email order-p52-%. Không đụng seed demo (TT-SEED-*, NCC-SEED-001...).
 * Từ chối chạy ở production. Chỉ đọc/ghi DB DEV disposable.
 *
 * Chạy audit (dry-run): .../an-fixture-e2e-dev.ts
 * Chạy ẩn thật: DEV_CLEANUP_CONFIRM=YES .../an-fixture-e2e-dev.ts --xac-nhan
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient, TrangThaiBanGhi } from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

const XAC_NHAN = process.argv.includes('--xac-nhan');
const DUOC_PHEP =
  XAC_NHAN &&
  process.env.DEV_CLEANUP_CONFIRM === 'YES' &&
  process.env.NODE_ENV !== 'production' &&
  process.env.APP_ENV !== 'production';

function tachDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit: 5,
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname),
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Thiếu DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(tachDatabaseUrl(databaseUrl)) });

async function main(): Promise<void> {
  console.log(`🔍 Ẩn fixture E2E khỏi customer (chế độ: ${DUOC_PHEP ? 'ẨN THẬT (DEV)' : 'DRY-RUN'})`);

  const farms = await prisma.trangTrai.findMany({
    where: {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      OR: [{ ten: { contains: 'PHIEN' } }, { ma: { contains: 'P52' } }],
    },
    select: { id: true, ma: true, ten: true },
  });
  const danhMucs = await prisma.danhMucSanPham.findMany({
    where: {
      trangThai: TrangThaiBanGhi.HOAT_DONG,
      OR: [
        { ten: { contains: 'PHIEN' } },
        { ten: { contains: 'Create Order' } },
        { slug: { contains: 'p52' } },
      ],
    },
    select: { id: true, ten: true, slug: true },
  });

  console.log(`- Farm fixture đang active: ${farms.length}`);
  for (const row of farms) console.log(`    • ${row.ten} (${row.ma})`);
  console.log(`- Danh mục fixture đang active: ${danhMucs.length}`);
  for (const row of danhMucs) console.log(`    • ${row.ten} (${row.slug})`);

  if (farms.length + danhMucs.length === 0) {
    console.log('✅ Không còn fixture active trong catalog công khai.');
    return;
  }
  if (!DUOC_PHEP) {
    console.log('ℹ️ DRY-RUN: chưa ẩn gì.');
    return;
  }

  await prisma.$transaction([
    ...(farms.length
      ? [
          prisma.trangTrai.updateMany({
            where: { id: { in: farms.map((row) => row.id) } },
            data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
          }),
        ]
      : []),
    ...(danhMucs.length
      ? [
          prisma.danhMucSanPham.updateMany({
            where: { id: { in: danhMucs.map((row) => row.id) } },
            data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
          }),
        ]
      : []),
  ]);
  console.log('🧹 Đã ẩn fixture khỏi catalog (đơn hàng cũ giữ nguyên).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
