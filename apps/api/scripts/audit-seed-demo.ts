/**
 * Read-only audit: đếm record SEED/DEMO còn sót trong DB runtime.
 * Chạy: pnpm --filter @agrimarket/api-client exec tsx ../../apps/api/scripts/audit-seed-demo.ts
 */
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

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

const databaseUrl = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(tachDatabaseUrl(databaseUrl)) });

async function dem(nhan: string, fn: () => Promise<unknown[]>) {
  const rows = await fn();
  console.log(`${nhan}: ${rows.length}`);
  for (const r of rows.slice(0, 20)) console.log('   ', JSON.stringify(r));
}

async function main() {
  const url = new URL(databaseUrl);
  console.log(`DB: ${url.hostname}:${url.port}${url.pathname}`);
  console.log('=========');

  await dem('NhaCungCap ma ~ SEED/^NCC-SEED/DEMO', () =>
    prisma.nhaCungCap.findMany({
      where: { OR: [{ ma: { contains: 'SEED' } }, { ma: { contains: 'DEMO' } }] },
      select: { ma: true, ten: true, trangThai: true },
    }),
  );

  await dem('TrangTrai ma ~ SEED/DEMO/TT-SEED', () =>
    prisma.trangTrai.findMany({
      where: { OR: [{ ma: { contains: 'SEED' } }, { ma: { contains: 'DEMO' } }] },
      select: { ma: true, ten: true, trangThai: true },
    }),
  );

  await dem('LoSanPham maLo ~ SEED/DEMO/LO-', () =>
    prisma.loSanPham.findMany({
      where: {
        OR: [
          { maLo: { contains: 'SEED' } },
          { maLo: { contains: 'DEMO' } },
          { maLo: { contains: 'LO-' } },
        ],
      },
      select: { maLo: true, trangThai: true },
    }),
  );

  await dem('ChungNhan ma ~ SEED/DEMO', () =>
    prisma.chungNhan.findMany({
      where: { OR: [{ ma: { contains: 'SEED' } }, { ma: { contains: 'DEMO' } }] },
      select: { ma: true, loai: true, trangThaiXacMinh: true },
    }),
  );

  await dem('ChienDichFlashSale ten/ma ~ DEMO', () =>
    prisma.chienDichFlashSale.findMany({
      where: { ten: { contains: 'DEMO' } },
      select: { ten: true, trangThai: true },
    }),
  );

  await dem('DonHang maDonHang ~ DEMO/SEED', () =>
    prisma.donHang.findMany({
      where: { OR: [{ maDonHang: { contains: 'DEMO' } }, { maDonHang: { contains: 'SEED' } }] },
      select: { maDonHang: true, trangThai: true },
    }),
  );

  await dem('DanhMucSanPham ten/slug ~ test/e2e/SEED/DEMO', () =>
    prisma.danhMucSanPham.findMany({
      where: {
        OR: [
          { ten: { contains: 'DEMO' } },
          { slug: { contains: 'demo' } },
          { slug: { contains: 'e2e' } },
          { ten: { contains: 'e2e' } },
        ],
      },
      select: { ten: true, slug: true, trangThai: true },
    }),
  );

  await dem('SanPham ten ~ e2e/SEED/DEMO', () =>
    prisma.sanPham.findMany({
      where: {
        OR: [{ ten: { contains: 'DEMO' } }, { ten: { contains: 'e2e' } }],
      },
      select: { ten: true, trangThai: true },
    }),
  );

  // counts tổng
  const [ncc, tt, lo, cn, fs, dh, dm, sp] = await Promise.all([
    prisma.nhaCungCap.count(),
    prisma.trangTrai.count(),
    prisma.loSanPham.count(),
    prisma.chungNhan.count(),
    prisma.chienDichFlashSale.count(),
    prisma.donHang.count(),
    prisma.danhMucSanPham.count(),
    prisma.sanPham.count(),
  ]);
  console.log('========= TỔNG =========');
  console.log(
    JSON.stringify({ nhaCungCap: ncc, trangTrai: tt, loSanPham: lo, chungNhan: cn, chienDichFlashSale: fs, donHang: dh, danhMuc: dm, sanPham: sp }, null, 2),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
