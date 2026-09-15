/**
 * Repair legacy orders:
 * Reservation đã HET_HAN nhưng Order vẫn CHO_THANH_TOAN.
 * Idempotent: chỉ cập nhật các trạng thái còn mở.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PrismaClient,
  TrangThaiDatChoTonKho,
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
  const reservations = await prisma.datChoTonKho.findMany({
    where: {
      trangThai: TrangThaiDatChoTonKho.HET_HAN,
      maThamChieu: {
        startsWith: 'ORDER:',
      },
    },
    select: {
      maThamChieu: true,
    },
  });

  let fixedOrders = 0;

  for (const reservation of reservations) {
    const maDonHang = reservation.maThamChieu.slice('ORDER:'.length).trim();
    if (!maDonHang) continue;

    const order = await prisma.donHang.findUnique({
      where: {
        maDonHang,
      },
      select: {
        id: true,
        maDonHang: true,
        trangThai: true,
      },
    });

    if (!order || order.trangThai !== TrangThaiDonHang.CHO_THANH_TOAN) {
      continue;
    }

    const payments = await prisma.thanhToan.findMany({
      where: {
        donHangId: order.id,
        trangThai: {
          in: [
            TrangThaiThanhToan.CREATED,
            TrangThaiThanhToan.PENDING,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    const paymentIds = payments.map((item) => item.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const orderUpdated = await tx.donHang.updateMany({
        where: {
          id: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_HUY,
        },
      });

      await tx.donHangNhaCungCap.updateMany({
        where: {
          donHangId: order.id,
          trangThai: TrangThaiDonHang.CHO_THANH_TOAN,
        },
        data: {
          trangThai: TrangThaiDonHang.DA_HUY,
        },
      });

      if (paymentIds.length > 0) {
        await tx.thanhToan.updateMany({
          where: {
            id: {
              in: paymentIds,
            },
            trangThai: {
              in: [
                TrangThaiThanhToan.CREATED,
                TrangThaiThanhToan.PENDING,
              ],
            },
          },
          data: {
            trangThai: TrangThaiThanhToan.CANCELLED,
          },
        });

        await tx.giaoDichThanhToan.updateMany({
          where: {
            thanhToanId: {
              in: paymentIds,
            },
            trangThai: {
              in: [
                TrangThaiThanhToan.CREATED,
                TrangThaiThanhToan.PENDING,
              ],
            },
          },
          data: {
            trangThai: TrangThaiThanhToan.CANCELLED,
            thoiGian: now,
          },
        });
      }

      return orderUpdated.count;
    });

    if (result > 0) {
      fixedOrders += 1;
      console.log(`[repair-expired-orders] ${order.maDonHang} -> DA_HUY`);
    }
  }

  console.log(
    `[repair-expired-orders] Hoàn tất. Đã sửa ${fixedOrders} đơn hết hạn.`,
  );
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
