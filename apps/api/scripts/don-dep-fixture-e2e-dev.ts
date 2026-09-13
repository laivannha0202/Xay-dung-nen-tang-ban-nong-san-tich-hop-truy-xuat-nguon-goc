/**
 * DEV-ONLY: dọn fixture E2E `create-order.e2e-spec.ts` (PHIEN 052 / P52)
 * khỏi database DEV đang bị facets customer-web đọc nhầm thành danh mục thật.
 *
 * NGUYÊN TẮC AN TOÀN:
 * - Mặc định CHỈ AUDIT (dry-run): liệt kê fixture đang tồn tại, không xóa gì.
 * - Chỉ xóa khi chạy kèm cờ `--xac-nhan` VÀ biến môi trường
 *   `DEV_CLEANUP_CONFIRM=YES`, và KHÔNG BAO GIỜ chạy ở production
 *   (`NODE_ENV=production` hoặc `APP_ENV=production` sẽ từ chối ngay).
 * - Chỉ nhắm đúng marker fixture E2E: `%P52%` (mã), `%PHIEN 052%`,
 *   `%Create Order 052%` (tên), `order-p52-%` (email test). Seed demo
 *   (`TT-SEED-*`, `NCC-SEED-001`, `LO-HOME-*`, `KHO-SEED-001`, `HOME-*`)
 *   không khớp các marker này nên không bao giờ bị đụng.
 * - Nếu fixture đã phát sinh ĐƠN HÀNG thật tham chiếu tới (MucDonHang),
 *   script DỪNG và in hướng dẫn xử lý thủ công thay vì xóa cascade mù.
 * - KHÔNG đụng tới logic test: file `apps/api/test/*.e2e-spec.ts` giữ nguyên.
 *
 * Chạy audit:
 *   pnpm --filter @agrimarket/api-client exec tsx ../../apps/api/scripts/don-dep-fixture-e2e-dev.ts
 * Chạy xóa thật trên DEV disposable:
 *   DEV_CLEANUP_CONFIRM=YES pnpm --filter @agrimarket/api-client exec tsx ../../apps/api/scripts/don-dep-fixture-e2e-dev.ts --xac-nhan
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

const XAC_NHAN = process.argv.includes('--xac-nhan');
const DUOC_PHEP_XOA =
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
  console.error('Thiếu DATABASE_URL — không audit được fixture.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(tachDatabaseUrl(databaseUrl)) });

async function main() {
  console.log(`🔍 Audit fixture E2E PHIEN-052/P52 (chế độ: ${DUOC_PHEP_XOA ? 'XÓA THẬT (DEV)' : 'DRY-RUN — không xóa gì'})`);

  const sanPham = await prisma.sanPham.findMany({
    where: { OR: [{ ten: { contains: 'PHIEN 052' } }, { ten: { contains: 'Create Order' } }] },
    select: { id: true, ten: true },
  });
  const danhMuc = await prisma.danhMucSanPham.findMany({
    where: { OR: [{ ten: { contains: '052' } }, { slug: { contains: 'p52' } }] },
    select: { id: true, ten: true, slug: true },
  });
  const trangTrai = await prisma.trangTrai.findMany({
    where: { OR: [{ ten: { contains: 'PHIEN 052' } }, { ma: { contains: 'P52' } }] },
    select: { id: true, ten: true, ma: true },
  });
  const nhaCungCap = await prisma.nhaCungCap.findMany({
    where: { OR: [{ ten: { contains: 'PHIEN 052' } }, { ma: { contains: 'P52' } }] },
    select: { id: true, ten: true, ma: true },
  });
  const kho = await prisma.kho.findMany({
    where: { OR: [{ ten: { contains: '052' } }, { maKho: { contains: 'P52' } }] },
    select: { id: true, ten: true, maKho: true },
  });
  const loSanPham = await prisma.loSanPham.findMany({
    where: { maLo: { contains: 'P52' } },
    select: { id: true, maLo: true },
  });
  const nguoiDungTest = await prisma.nguoiDung.findMany({
    where: { email: { contains: 'order-p52-' } },
    select: { id: true, email: true },
  });

  console.log(`- Sản phẩm fixture: ${sanPham.length}`);
  for (const row of sanPham.slice(0, 20)) console.log(`    • ${row.ten}`);
  console.log(`- Danh mục fixture: ${danhMuc.length}`);
  for (const row of danhMuc) console.log(`    • ${row.ten} (${row.slug})`);
  console.log(`- Trang trại fixture: ${trangTrai.length}`);
  console.log(`- Nhà cung cấp fixture: ${nhaCungCap.length}`);
  console.log(`- Kho fixture: ${kho.length}`);
  console.log(`- Lô fixture: ${loSanPham.length}`);
  console.log(`- Tài khoản test fixture: ${nguoiDungTest.length}`);

  const tongFixture =
    sanPham.length + danhMuc.length + trangTrai.length + nhaCungCap.length + kho.length + loSanPham.length + nguoiDungTest.length;
  if (tongFixture === 0) {
    console.log('✅ Không còn fixture E2E trong DB — facets customer-facing sạch.');
    return;
  }

  if (!DUOC_PHEP_XOA) {
    console.log('ℹ️ DRY-RUN: chưa xóa gì. Muốn dọn trên DEV disposable, chạy lại kèm DEV_CLEANUP_CONFIRM=YES --xac-nhan.');
    return;
  }

  // Chặn xóa khi fixture đã bị đơn hàng tham chiếu.
  const bienTheIds = (
    await prisma.bienTheSanPham.findMany({
      where: { sanPhamId: { in: sanPham.map((row) => row.id) } },
      select: { id: true },
    })
  ).map((row) => row.id);
  const mucDonHangThamChieu = bienTheIds.length
    ? await prisma.mucDonHang.count({ where: { bienTheSanPhamId: { in: bienTheIds } } })
    : 0;
  if (mucDonHangThamChieu > 0) {
    console.error(
      `⛔ Có ${mucDonHangThamChieu} mục đơn hàng đang tham chiếu fixture — DỪNG để tránh mất dữ liệu đơn. ` +
        'Hãy xử lý đơn liên quan thủ công trước khi dọn.',
    );
    process.exit(2);
  }

  const tonKhoIds = (
    await prisma.tonKhoLo.findMany({
      where: { bienTheSanPhamId: { in: bienTheIds } },
      select: { id: true },
    })
  ).map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    if (tonKhoIds.length) {
      await tx.giaoDichTonKho.deleteMany({ where: { tonKhoLoId: { in: tonKhoIds } } });
      await tx.tonKhoLo.deleteMany({ where: { id: { in: tonKhoIds } } });
    }
    if (bienTheIds.length) {
      await tx.mucGioHang.deleteMany({ where: { bienTheSanPhamId: { in: bienTheIds } } });
      await tx.mucFlashSale.deleteMany({ where: { bienTheSanPhamId: { in: bienTheIds } } });
      await tx.bienTheSanPham.deleteMany({ where: { id: { in: bienTheIds } } });
    }
    if (sanPham.length) {
      await tx.sanPhamAnh.deleteMany({ where: { sanPhamId: { in: sanPham.map((row) => row.id) } } });
      await tx.sanPhamYeuThich.deleteMany({ where: { sanPhamId: { in: sanPham.map((row) => row.id) } } });
      await tx.sanPham.deleteMany({ where: { id: { in: sanPham.map((row) => row.id) } } });
    }
    if (danhMuc.length) {
      await tx.danhMucSanPham.deleteMany({ where: { id: { in: danhMuc.map((row) => row.id) } } });
    }
    if (trangTrai.length) {
      await tx.trangTrai.deleteMany({ where: { id: { in: trangTrai.map((row) => row.id) } } });
    }
    if (nhaCungCap.length) {
      await tx.nhaCungCap.deleteMany({ where: { id: { in: nhaCungCap.map((row) => row.id) } } });
    }
    if (kho.length) {
      await tx.kho.deleteMany({ where: { id: { in: kho.map((row) => row.id) } } });
    }
    if (nguoiDungTest.length) {
      await tx.nguoiDung.deleteMany({ where: { id: { in: nguoiDungTest.map((row) => row.id) } } });
    }
  });

  console.log('🧹 Đã dọn fixture E2E (lô/mùa vụ/thu hoạch fixture không hiển thị customer nên giữ nguyên).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
