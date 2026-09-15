/**
 * Seed địa bàn Hưng Yên (idempotent, an toàn chạy nhiều lần).
 *
 * Nguồn duy nhất cấp xã/phường:
 *   apps/api/prisma/seed-data/hung-yen-communes-2026.json
 *   (snapshot 14/09/2026: 104 xã/phường = 93 xã + 11 phường, Nghị quyết 1666/NQ-UBTVQH15).
 *
 * Nguồn thôn/tổ dân phố (tiến độ đã xác minh, KHÔNG phải toàn tỉnh):
 *   apps/api/prisma/seed-data/hung-yen-villages-2026.json
 *   (snapshot 15/09/2026: 127 bản ghi = 103 thôn + 24 tổ dân phố,
 *   đủ cho 12/104 xã/phường; 92 xã/phường còn PENDING_VERIFICATION).
 *   Đối chiếu phạm vi:
 *   apps/api/prisma/seed-data/hung-yen-villages-coverage-104-communes.json
 *
 * - Upsert theo mã nội bộ ổn định (HY-C001..HY-C104, HY-Cxxx-Vnnn là mã nội bộ
 *   AgriMarket, KHÔNG phải mã hành chính nhà nước) → chạy lại không duplicate.
 * - Không xóa địa chỉ khách hàng, không xóa xã/phường, không xóa thôn/TDP nằm
 *   ngoài file tiến độ (xã PENDING giữ cơ chế chuyển tiếp: API trả []).
 * - Thôn/TDP toàn tỉnh PARTIAL_VERIFIED / NOT_COMPLETE: script này KHÔNG sinh
 *   thôn giả, KHÔNG đổi trạng thái toàn tỉnh thành COMPLETE.
 * - FAIL khi COUNT khác 104/93/11 (xã/phường) hoặc 127/103/24 (thôn/TDP progress).
 * - FAIL khi một thôn/TDP trỏ tới xã/phường không tồn tại (không tự tạo xã mới).
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

type VillageRow = {
  id: string;
  commune_id: string;
  name: string;
  full_name: string;
  type: 'thon' | 'to_dan_pho';
  normalized_name: string;
  active: boolean;
};

type CoverageRow = {
  commune_id: string;
  status: 'VERIFIED_COMPLETE' | 'PENDING_VERIFICATION';
  verified_record_count: number;
};

function thatBaiSeed(thongBao: string): never {
  console.error(`Seed địa bàn Hưng Yên FAIL: ${thongBao}`);
  process.exit(1);
}

function kiemTraVillages(
  records: VillageRow[],
  communeIds: Set<string>,
  coverage: CoverageRow[],
): { verifiedCommunes: string[]; soThon: number; soToDanPho: number } {
  if (records.length !== 127) {
    thatBaiSeed(`tong village=${records.length}, ky vong 127.`);
  }
  const soThon = records.filter((item) => item.type === 'thon').length;
  const soToDanPho = records.filter((item) => item.type === 'to_dan_pho').length;
  if (soThon !== 103 || soToDanPho !== 24) {
    thatBaiSeed(`village thon=${soThon} tdp=${soToDanPho}, ky vong 103/24.`);
  }

  const ids = records.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    thatBaiSeed('dataset village co ma trung lap.');
  }
  for (const item of records) {
    if (
      !item.id.trim() ||
      !item.commune_id.trim() ||
      !item.name.trim() ||
      !item.full_name.trim() ||
      !item.normalized_name.trim()
    ) {
      thatBaiSeed(`dataset village co ban ghi rong ten: ${item.id}`);
    }
    if (item.type !== 'thon' && item.type !== 'to_dan_pho') {
      thatBaiSeed(`dataset village co type la: ${item.id}=${item.type}`);
    }
    if (item.active !== true) {
      thatBaiSeed(`dataset village active phai true: ${item.id}`);
    }
    if (!communeIds.has(item.commune_id)) {
      thatBaiSeed(`village ${item.id} tro toi xa/phuong khong ton tai: ${item.commune_id}.`);
    }
  }

  if (coverage.length !== 104) {
    thatBaiSeed(`coverage communes=${coverage.length}, ky vong 104.`);
  }
  const verified = coverage.filter((item) => item.status === 'VERIFIED_COMPLETE');
  const pending = coverage.filter((item) => item.status === 'PENDING_VERIFICATION');
  if (verified.length !== 12 || pending.length !== 92) {
    thatBaiSeed(`coverage verified=${verified.length} pending=${pending.length}, ky vong 12/92.`);
  }
  for (const item of verified) {
    const actual = records.filter((row) => row.commune_id === item.commune_id).length;
    if (actual !== item.verified_record_count) {
      thatBaiSeed(
        `village cua ${item.commune_id}: file=${actual}, coverage=${item.verified_record_count}.`,
      );
    }
  }
  for (const item of pending) {
    if (item.verified_record_count !== 0) {
      thatBaiSeed(`coverage pending ${item.commune_id} phai co verified_record_count=0.`);
    }
  }

  return {
    verifiedCommunes: verified.map((item) => item.commune_id).sort(),
    soThon,
    soToDanPho,
  };
}

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
    console.log(`✅ Địa bàn Hưng Yên: ${tongDb} xã/phường (${xaDb} xã + ${phuongDb} phường).`);

    // Hợp nhất thôn/TDP đã xác minh (progress, không phải toàn tỉnh).
    const villagesDuLieu = JSON.parse(
      readFileSync(resolve(scriptDir, '../prisma/seed-data/hung-yen-villages-2026.json'), 'utf-8'),
    ) as {
      metadata: { status: string; safe_for_full_production_required_dropdown: boolean };
      records: VillageRow[];
    };
    if (villagesDuLieu.metadata.status !== 'PARTIAL_VERIFIED') {
      thatBaiSeed(`village status=${villagesDuLieu.metadata.status}, ky vong PARTIAL_VERIFIED.`);
    }
    if (villagesDuLieu.metadata.safe_for_full_production_required_dropdown !== false) {
      thatBaiSeed('village chua an toan de bat buoc dropdown toan tinh.');
    }
    const coverageDuLieu = JSON.parse(
      readFileSync(
        resolve(scriptDir, '../prisma/seed-data/hung-yen-villages-coverage-104-communes.json'),
        'utf-8',
      ),
    ) as { coverage: CoverageRow[] };
    const { verifiedCommunes } = kiemTraVillages(
      villagesDuLieu.records,
      new Set(ids),
      coverageDuLieu.coverage,
    );

    const maVillages = villagesDuLieu.records.map((item) => item.id);
    const maCanonical = new Set(maVillages);
    // Chặn fixture legacy ghi đè/sai lệch dataset production: nếu trong DB đã tồn
    // tại thôn/TDP lạ (mã ngoài canonical) trùng (xã + tên đầy đủ) với bản ghi
    // canonical (ví dụ fixture e2e cũ HY-C079-V01 trùng tên với HY-C079-V001),
    // upsert sẽ vi phạm unique uk_thon_to_dan_pho_xa_ten → FAIL rõ ràng thay vì
    // crash P2002 khó hiểu. Seed KHÔNG tự xóa: hãy dọn fixture test thủ công
    // (xác minh không còn địa chỉ nào tham chiếu) rồi chạy lại.
    const canonicalKeys = new Set(
      villagesDuLieu.records.map((item) => `${item.commune_id}||${item.full_name}`),
    );
    const communeIdsTrongProgress = [...new Set(villagesDuLieu.records.map((item) => item.commune_id))];
    const hienCo = await prisma.thonToDanPho.findMany({
      where: { xaPhuongMa: { in: communeIdsTrongProgress } },
      select: { ma: true, xaPhuongMa: true, tenDayDu: true },
    });
    for (const row of hienCo) {
      if (!maCanonical.has(row.ma) && canonicalKeys.has(`${row.xaPhuongMa}||${row.tenDayDu}`)) {
        thatBaiSeed(
          `phat hien fixture cu ${row.ma} trung ten '${row.tenDayDu}' voi dataset canonical ` +
            `cua ${row.xaPhuongMa}. Hay xac minh khong con dia_chi tham chieu, xoa fixture cu thu cong, roi chay lai seed.`,
        );
      }
    }

    const communeTonTai = new Set(
      (
        await prisma.xaPhuongHungYen.findMany({
          where: { ma: { in: [...new Set(villagesDuLieu.records.map((item) => item.commune_id))] } },
          select: { ma: true },
        })
      ).map((item) => item.ma),
    );
    for (const item of villagesDuLieu.records) {
      if (!communeTonTai.has(item.commune_id)) {
        thatBaiSeed(`village ${item.id} tro toi xa/phuong chua seed: ${item.commune_id}.`);
      }
      await prisma.thonToDanPho.upsert({
        where: { ma: item.id },
        update: {
          xaPhuongMa: item.commune_id,
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'thon' ? 'THON' : 'TO_DAN_PHO',
          hoatDong: true,
        },
        create: {
          ma: item.id,
          xaPhuongMa: item.commune_id,
          ten: item.name,
          tenDayDu: item.full_name,
          tenChuanHoa: item.normalized_name,
          loai: item.type === 'thon' ? 'THON' : 'TO_DAN_PHO',
          hoatDong: true,
        },
      });
    }

    // Xác minh riêng phần canonical progress theo đúng ID trong dataset
    // (không count toàn bảng vì DB có thể còn fixture/test khác).
    const [progressDb, thonDb, tdpDb] = await Promise.all([
      prisma.thonToDanPho.count({ where: { ma: { in: maVillages }, hoatDong: true } }),
      prisma.thonToDanPho.count({
        where: { ma: { in: maVillages }, loai: 'THON', hoatDong: true },
      }),
      prisma.thonToDanPho.count({
        where: { ma: { in: maVillages }, loai: 'TO_DAN_PHO', hoatDong: true },
      }),
    ]);
    if (progressDb !== 127 || thonDb !== 103 || tdpDb !== 24) {
      console.error(
        `Seed village xong nhưng COUNT progress sai: tong=${progressDb} thon=${thonDb} tdp=${tdpDb} (ky vong 127/103/24).`,
      );
      process.exit(1);
    }
    for (const communeMa of verifiedCommunes) {
      const expected = villagesDuLieu.records.filter((item) => item.commune_id === communeMa).length;
      const actual = await prisma.thonToDanPho.count({
        where: { xaPhuongMa: communeMa, hoatDong: true },
      });
      if (actual < expected) {
        console.error(
          `Seed village xong nhưng ${communeMa} thieu du lieu: db=${actual} file=${expected}.`,
        );
        process.exit(1);
      }
    }
    console.log(
      `✅ Thôn/TDP đã xác minh: ${progressDb} bản ghi (${thonDb} thôn + ${tdpDb} TDP) cho 12/104 xã/phường. Toàn tỉnh: PARTIAL_VERIFIED / NOT_COMPLETE (92 xã/phường còn PENDING).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
