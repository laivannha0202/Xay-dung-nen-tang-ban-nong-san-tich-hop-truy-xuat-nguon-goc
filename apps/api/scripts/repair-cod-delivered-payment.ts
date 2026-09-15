/**
 * Repair COD legacy:
 * - tất cả supplier-order của parent order đã có shipment DELIVERED
 * - nhưng Order chưa DA_GIAO và/or COD Payment còn CREATED/PENDING.
 *
 * Idempotent: chỉ update các trạng thái còn mở.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PrismaClient,
  TrangThaiDonHang,
  TrangThaiThanhToan,
  TrangThaiVanChuyen,
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
      thanhToan: {
        some: {
          phuongThuc: 'COD',
          trangThai: {
            in: [
              TrangThaiThanhToan.CREATED,
              TrangThaiThanhToan.PENDING,
            ],
          },
        },
      },
    },
    select: {
      id: true,
      maDonHang: true,
      trangThai: true,
      donNhaCungCap: {
        select: {
          id: true,
          trangThai: true,
          vanChuyen: {
            select: {
              trangThai: true,
            },
          },
        },
      },
      thanhToan: {
        where: {
          phuongThuc: 'COD',
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
      },
    },
  });

  let fixed = 0;

  for (const order of orders) {
    if (order.donNhaCungCap.length === 0) continue;

    const tatCaDaGiao = order.donNhaCungCap.every((suborder) =>
      suborder.vanChuyen.some(
        (shipment) => shipment.trangThai === TrangThaiVanChuyen.DELIVERED,
      ),
    );

    if (!tatCaDaGiao) continue;

    const paymentIds = order.thanhToan.map((payment) => payment.id);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.donHangNhaCungCap.updateMany({
        where: {
          donHangId: order.id,
          trangThai: {
            in: [
              TrangThaiDonHang.DA_XAC_NHAN,
              TrangThaiDonHang.DANG_CHUAN_BI,
              TrangThaiDonHang.DA_DONG_GOI,
              TrangThaiDonHang.DANG_GIAO,
            ],
          },
        },
        data: {
          trangThai: TrangThaiDonHang.DA_GIAO,
        },
      });

      await tx.donHang.updateMany({
        where: {
          id: order.id,
          trangThai: {
            in: [
              TrangThaiDonHang.DA_XAC_NHAN,
              TrangThaiDonHang.DANG_CHUAN_BI,
              TrangThaiDonHang.DA_DONG_GOI,
              TrangThaiDonHang.DANG_GIAO,
            ],
          },
        },
        data: {
          trangThai: TrangThaiDonHang.DA_GIAO,
        },
      });

      if (paymentIds.length > 0) {
        await tx.thanhToan.updateMany({
          where: {
            id: {
              in: paymentIds,
            },
            phuongThuc: 'COD',
            trangThai: {
              in: [
                TrangThaiThanhToan.CREATED,
                TrangThaiThanhToan.PENDING,
              ],
            },
          },
          data: {
            trangThai: TrangThaiThanhToan.PAID,
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
            trangThai: TrangThaiThanhToan.PAID,
            thoiGian: now,
          },
        });
      }
    });

    fixed += 1;
    console.log(`[repair-cod-delivered] ${order.maDonHang} -> DA_GIAO / COD PAID`);
  }

  console.log(`[repair-cod-delivered] Hoàn tất. Đã sửa ${fixed} đơn.`);
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
