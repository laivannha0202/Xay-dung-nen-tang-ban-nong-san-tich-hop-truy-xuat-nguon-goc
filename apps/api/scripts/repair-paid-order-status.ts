/**
 * Sửa dữ liệu legacy: Payment đã được chấp nhận nhưng Order vẫn CHO_THANH_TOAN.
 * Idempotent: chỉ update Order/Suborder còn đúng trạng thái CHO_THANH_TOAN.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PrismaClient,
  TrangThaiDonHang,
  TrangThaiThanhToan,
} from '../src/generated/prisma/client';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

function tachDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  return {
    host: url.hostname,
    port: Number(url.port || '3306'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 5,
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(
      url.hostname,
    ),
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Thiếu DATABASE_URL');
  process.exit(1);
}

const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
const prisma = new PrismaClient({ adapter });

async function main() {
  const orders = await prisma.donHang.findMany({
    where: {
      trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
      thanhToan: {
        some: {
          OR: [
            { trangThai: TrangThaiThanhToan.PAID },
            {
              phuongThuc: 'COD',
              trangThai: TrangThaiThanhToan.PENDING,
            },
          ],
        },
      },
    },
    select: {
      id: true,
      maDonHang: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(
    `[repair-order-status] Tìm thấy ${orders.length} đơn cần đồng bộ.`,
  );

  for (const order of orders) {
    const [orderResult, suborderResult] = await prisma.$transaction([
      prisma.donHang.updateMany({
        where: {
          id: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        },
      }),
      prisma.donHangNhaCungCap.updateMany({
        where: {
          donHangId: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_XAC_NHAN,
        },
      }),
    ]);

    console.log(
      `[repair-order-status] ${order.maDonHang}: order=${orderResult.count}, suborders=${suborderResult.count}`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
