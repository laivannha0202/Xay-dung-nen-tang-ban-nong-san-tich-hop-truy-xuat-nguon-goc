/**
 * Sanity check dữ liệu demo Customer (chỉ đọc, không sửa DB).
 *
 * Kiểm:
 * 1. Không còn category "Organic" active (Hữu cơ là chứng nhận, không phải danh mục).
 * 2. Mọi product active đều có danh mục + farm active, ≥1 biến thể, ảnh bìa
 *    với TepTin active và file tồn tại trên đĩa (seed/ → public/products).
 * 3. Không còn fixture/test lọt ra UI công khai (PHIEN/Create Order/e2e-/P52).
 * 4. Cá/thịt demo ngoài domain cây trồng đã ẩn khỏi catalog công khai.
 * 5. Marketplace không tự cấp chứng nhận (donViCap không chứa AgriMarket
 *    với cert active của farm seed; mã seed phải DEMO-*).
 * 6. Farm/product plausibility theo metadata seed (farm rau không bán cá...).
 * 7. Variant còn tồn phải resolvable tới lô đang bán còn hạn (để detail có
 *    harvest đúng); lô có tồn phải có mã truy xuất AGM-* hợp lệ.
 *
 * Chạy từ root bằng:
 * pnpm --filter @agrimarket/api-client exec tsx ../../apps/api/scripts/kiem-tra-du-lieu-demo.ts
 * Exit code 1 khi có bất kỳ FAIL nào.
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Thiếu DATABASE_URL');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(tachDatabaseUrl(databaseUrl)) });

const DANH_MUC_CHO_PHEP_THEO_FARM: Record<string, string[]> = {
  'TT-SEED-001': ['Rau củ'],
  'TT-SEED-AN-PHU': ['Rau củ', 'Trái cây', 'Đặc sản'],
  'TT-SEED-PHU-NONG': ['Gạo', 'Trái cây'],
  'TT-SEED-SONG-HONG': ['Trứng'],
};

const MARKER_RAC = ['PHIEN', 'Create Order', 'e2e-', 'P52'];

let fail = 0;
function pass(noiDung: string): void {
  console.log(`✅ PASS ${noiDung}`);
}
function loi(noiDung: string): void {
  fail += 1;
  console.log(`❌ FAIL ${noiDung}`);
}

async function main(): Promise<void> {
  // 1. Không category Organic active.
  const organic = await prisma.danhMucSanPham.findMany({
    where: {
      trangThai: 'HOAT_DONG',
      OR: [{ slug: 'organic' }, { ten: { contains: 'Organic' } }],
    },
  });
  if (organic.length === 0) pass('không category Organic active');
  else loi(`còn category Organic active: ${organic.map((item) => item.ten).join(', ')}`);

  // 2. Product active đầy đủ quan hệ + ảnh thật trên đĩa.
  const products = await prisma.sanPham.findMany({
    where: { trangThai: 'HOAT_DONG' },
    include: {
      danhMucSanPham: true,
      trangTrai: true,
      bienThe: true,
      anh: { include: { tepTin: true }, orderBy: [{ laAnhBia: 'desc' }, { thuTu: 'asc' }] },
    },
  });
  let sanPhamLoi = 0;
  for (const sp of products) {
    const vanDe: string[] = [];
    if (sp.danhMucSanPham.trangThai !== 'HOAT_DONG') vanDe.push('danh mục khóa');
    if (sp.trangTrai.trangThai !== 'HOAT_DONG') vanDe.push('farm khóa');
    if (sp.bienThe.length === 0) vanDe.push('không biến thể');
    const bia = sp.anh.find((item) => item.laAnhBia) ?? sp.anh[0];
    if (!bia) vanDe.push('không ảnh');
    else {
      if (bia.tepTin.trangThai !== 'HOAT_DONG') vanDe.push('TepTin ảnh khóa');
      if (bia.tepTin.objectKey.startsWith('seed/')) {
        const filename = bia.tepTin.objectKey.replace(/^seed\//, '');
        const duongDan = resolve(scriptDir, '../public/products', filename);
        if (!existsSync(duongDan)) vanDe.push(`thiếu file ảnh ${filename}`);
      }
    }
    if (vanDe.length > 0) {
      sanPhamLoi += 1;
      loi(`product "${sp.ten}": ${vanDe.join('; ')}`);
    }
  }
  if (sanPhamLoi === 0) pass(`"${products.length} product active đủ danh mục/farm/biến thể/ảnh đĩa"`);
  console.log(`ℹ️ Tổng product active: ${products.length}`);

  // 3. Không fixture/test trong dữ liệu nhìn thấy.
  const rac: string[] = [];
  for (const marker of MARKER_RAC) {
    const [sp, dm, farm] = await Promise.all([
      prisma.sanPham.count({ where: { trangThai: 'HOAT_DONG', ten: { contains: marker } } }),
      prisma.danhMucSanPham.count({ where: { trangThai: 'HOAT_DONG', OR: [{ ten: { contains: marker } }, { slug: { contains: marker } }] } }),
      prisma.trangTrai.count({ where: { trangThai: 'HOAT_DONG', OR: [{ ten: { contains: marker } }, { ma: { contains: marker } }] } }),
    ]);
    if (sp + dm + farm > 0) rac.push(`${marker}(sp:${sp},dm:${dm},farm:${farm})`);
  }
  if (rac.length === 0) pass('không fixture/test trong catalog công khai');
  else loi(`còn rác fixture: ${rac.join('; ')}`);

  // 4. Cá/thịt demo đã ẩn.
  const caThit = await prisma.sanPham.findMany({
    where: { ten: { in: ['Cá hồi Na Uy', 'Thịt heo hữu cơ'] } },
    select: { ten: true, trangThai: true },
  });
  const conHien = caThit.filter((item) => item.trangThai === 'HOAT_DONG');
  if (conHien.length === 0) pass('cá/thịt demo đã ẩn khỏi catalog');
  else loi(`cá/thịt còn active: ${conHien.map((item) => item.ten).join(', ')}`);

  // 5. Chứng nhận seed đúng ngữ nghĩa.
  const certSeed = await prisma.chungNhan.findMany({
    where: { trangTrai: { ma: { startsWith: 'TT-SEED-' } } },
  });
  const certSai = certSeed.filter(
    (item) => item.donViCap.includes('AgriMarket') || !item.ma.startsWith('DEMO-'),
  );
  if (certSai.length === 0) pass(`${certSeed.length} chứng nhận seed đúng issuer/mã DEMO`);
  else loi(`chứng nhận sai ngữ nghĩa: ${certSai.map((item) => item.ma).join(', ')}`);

  // 6. Farm/product plausibility.
  let khongHopLe = 0;
  for (const sp of products) {
    const choPhep = DANH_MUC_CHO_PHEP_THEO_FARM[sp.trangTrai.ma];
    if (choPhep && !choPhep.includes(sp.danhMucSanPham.ten)) {
      khongHopLe += 1;
      loi(`"${sp.ten}" (${sp.danhMucSanPham.ten}) không hợp với ${sp.trangTrai.ten}`);
    }
  }
  if (khongHopLe === 0) pass('farm/product plausibility đúng metadata seed');

  // 7. Tồn phải resolve tới lô đang bán + mã truy xuất hợp lệ.
  const homNay = new Date();
  let tonLoi = 0;
  for (const sp of products) {
    for (const bienThe of sp.bienThe) {
      const tons = await prisma.tonKhoLo.findMany({
        where: {
          bienTheSanPhamId: bienThe.id,
          kho: { trangThai: 'HOAT_DONG' },
          loSanPham: { trangThai: 'CO_THE_BAN', ngayHetHan: { gte: homNay } },
        },
        include: { loSanPham: { include: { thuHoach: true } } },
      });
      const ton = tons.reduce(
        (tong, item) => tong + Number(item.onHand) - Number(item.reserved) - Number(item.blocked),
        0,
      );
      if (ton > 0) {
        if (tons.length === 0) {
          tonLoi += 1;
          loi(`"${sp.ten}" còn tồn nhưng không resolve lô đang bán`);
          continue;
        }
        for (const item of tons) {
          if (!item.loSanPham.maTruyXuat || !/^AGM-[A-F0-9]{32}$/.test(item.loSanPham.maTruyXuat)) {
            tonLoi += 1;
            loi(`lô ${item.loSanPham.maLo} của "${sp.ten}" thiếu mã truy xuất AGM-*`);
          }
        }
      }
    }
  }
  if (tonLoi === 0) pass('tồn → lô đang bán → mã truy xuất hợp lệ');

  if (fail > 0) {
    console.log(`\n⛔ ${fail} kiểm tra FAIL`);
    process.exitCode = 1;
  } else {
    console.log('\n🎉 Dữ liệu demo đạt tất cả kiểm tra.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
