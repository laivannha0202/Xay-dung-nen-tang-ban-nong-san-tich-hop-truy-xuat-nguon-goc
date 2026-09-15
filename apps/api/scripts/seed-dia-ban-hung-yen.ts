/**
 * Seed địa bàn Hưng Yên (idempotent, an toàn chạy nhiều lần).
 *
 * Nguồn duy nhất: apps/api/prisma/seed-data/hung-yen-communes-2026.json
 * (snapshot 14/09/2026: 104 xã/phường = 93 xã + 11 phường, Nghị quyết 1666/NQ-UBTVQH15).
 *
 * - Upsert theo mã ổn định HY-C001..HY-C104 → chạy lại không duplicate.
 * - Không xóa địa chỉ khách hàng, không chạm thôn/tổ dân phố.
 * - Thôn/TDP toàn tỉnh NOT_COMPLETE: script này KHÔNG sinh thôn giả.
 * - FAIL khi COUNT khác 104/93/11.
 *
 * Chạy: pnpm --filter @agrimarket/api seed:dia-ban-hung-yen
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
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
    connectionLimit: 10,
    allowPublicKeyRetrieval: ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname),
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Thiếu DATABASE_URL');
  process.exit(1);
}

type CommuneRow = {
  id: string;
  name: string;
  full_name: string;
  type: 'xa' | 'phuong';
  normalized_name: string;
  active: boolean;
};

async function main() {
  const duongDan = resolve(scriptDir, '../prisma/seed-data/hung-yen-communes-2026.json');
  const duLieu = JSON.parse(readFileSync(duongDan, 'utf-8')) as {
    communes: CommuneRow[];
  };

  const communes = duLieu.communes;
  const tong = communes.length;
  const soXa = communes.filter((item) => item.type === 'xa').length;
  const soPhuong = communes.filter((item) => item.type === 'phuong').length;
  if (tong !== 104 || soXa !== 93 || soPhuong !== 11) {
    console.error(`Dataset không hợp lệ: tong=${tong} xa=${soXa} phuong=${soPhuong} (kỳ vọng 104/93/11).`);
    process.exit(1);
  }

  const ids = communes.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    console.error('Dataset có mã xã/phường trùng lặp.');
    process.exit(1);
  }
  for (const item of communes) {
    if (!item.name.trim() || !item.full_name.trim() || !item.normalized_name.trim()) {
      console.error(`Dataset có bản ghi rỗng tên: ${item.id}`);
      process.exit(1);
    }
    if (item.type !== 'xa' && item.type !== 'phuong') {
      console.error(`Dataset có type lạ: ${item.id}=${item.type}`);
      process.exit(1);
    }
  }

  const adapter = new PrismaMariaDb(tachDatabaseUrl(databaseUrl));
  const prisma = new PrismaClient({ adapter });
  try {
    for (const item of communes) {
      await prisma.xaPhuongHungYen.upsert({
        where: { ma: item.id },
        update: {
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'xa' ? 'XA' : 'PHUONG',
          hoatDong: true,
        },
        create: {
          ma: item.id,
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'xa' ? 'XA' : 'PHUONG',
          hoatDong: true,
        },
      });
    }

    const [tongDb, xaDb, phuongDb] = await Promise.all([
      prisma.xaPhuongHungYen.count({ where: { hoatDong: true } }),
      prisma.xaPhuongHungYen.count({ where: { loai: 'XA', hoatDong: true } }),
      prisma.xaPhuongHungYen.count({ where: { loai: 'PHUONG', hoatDong: true } }),
    ]);
    if (tongDb !== 104 || xaDb !== 93 || phuongDb !== 11) {
      console.error(`Seed xong nhưng COUNT sai: tong=${tongDb} xa=${xaDb} phuong=${phuongDb}.`);
      process.exit(1);
    }
    console.log(`✅ Địa bàn Hưng Yên: ${tongDb} xã/phường (${xaDb} xã + ${phuongDb} phường). Thôn/TDP toàn tỉnh: NOT_COMPLETE.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
