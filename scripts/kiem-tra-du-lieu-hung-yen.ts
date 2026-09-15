/**
 * Kiểm tra dataset địa bàn Hưng Yên (chạy không cần database).
 *
 * Cấp xã/phường: tổng 104, xã 93, phường 11, không trùng mã, tên không rỗng,
 * type chỉ xa/phuong, normalized_name tồn tại.
 *
 * Tiến độ thôn/TDP (snapshot 15/09/2026, PARTIAL_VERIFIED — KHÔNG phải toàn tỉnh):
 * records 127 = 103 thôn + 24 TDP, 12 commune VERIFIED_COMPLETE, 92 PENDING,
 * không trùng id, không orphan FK, type chỉ thon/to_dan_pho.
 *
 * Chạy: pnpm --filter @agrimarket/api-client exec tsx ../../scripts/kiem-tra-du-lieu-hung-yen.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const duongDan = resolve(rootDir, 'apps/api/prisma/seed-data/hung-yen-communes-2026.json');
const duongDanVillages = resolve(rootDir, 'apps/api/prisma/seed-data/hung-yen-villages-2026.json');
const duongDanCoverage = resolve(
  rootDir,
  'apps/api/prisma/seed-data/hung-yen-villages-coverage-104-communes.json',
);

type CommuneRow = {
  id: string;
  name: string;
  full_name: string;
  type: string;
  normalized_name: string;
  active: boolean;
};

function thatBai(thongBao: string): never {
  console.error(`FAIL: ${thongBao}`);
  process.exit(1);
}

const duLieu = JSON.parse(readFileSync(duongDan, 'utf-8')) as { communes: CommuneRow[] };
const communes = duLieu.communes;

if (communes.length !== 104) thatBai(`tong=${communes.length}, ky vong 104`);
const soXa = communes.filter((item) => item.type === 'xa').length;
const soPhuong = communes.filter((item) => item.type === 'phuong').length;
if (soXa !== 93) thatBai(`xa=${soXa}, ky vong 93`);
if (soPhuong !== 11) thatBai(`phuong=${soPhuong}, ky vong 11`);

const ids = communes.map((item) => item.id);
if (new Set(ids).size !== ids.length) thatBai('trung ma xa/phuong');

const tenDayDu = communes.map((item) => item.full_name.trim().toLowerCase());
if (new Set(tenDayDu).size !== tenDayDu.length) thatBai('trung ten_day_du bat thuong');

for (const item of communes) {
  if (!item.id.trim() || !item.name.trim() || !item.full_name.trim() || !item.normalized_name.trim()) {
    thatBai(`ban ghi rong: ${item.id}`);
  }
  if (item.type !== 'xa' && item.type !== 'phuong') {
    thatBai(`type la: ${item.id}=${item.type}`);
  }
  if (item.active !== true) {
    thatBai(`active phai true: ${item.id}`);
  }
}

console.log('OK: 104 don vi cap xa = 93 xa + 11 phuong. Thon/TDP toan tinh: NOT_COMPLETE.');

type VillageRow = {
  id: string;
  commune_id: string;
  name: string;
  full_name: string;
  type: string;
  normalized_name: string;
  active: boolean;
};

type CoverageRow = {
  commune_id: string;
  status: string;
  verified_record_count: number;
};

const villagesDuLieu = JSON.parse(readFileSync(duongDanVillages, 'utf-8')) as {
  metadata: { status: string; safe_for_full_production_required_dropdown: boolean };
  records: VillageRow[];
};
if (villagesDuLieu.metadata.status !== 'PARTIAL_VERIFIED') {
  thatBai(`village status=${villagesDuLieu.metadata.status}, ky vong PARTIAL_VERIFIED`);
}
if (villagesDuLieu.metadata.safe_for_full_production_required_dropdown !== false) {
  thatBai('village chua an toan de bat buoc dropdown toan tinh');
}

const records = villagesDuLieu.records;
if (records.length !== 127) thatBai(`village tong=${records.length}, ky vong 127`);
const soThon = records.filter((item) => item.type === 'thon').length;
const soTdp = records.filter((item) => item.type === 'to_dan_pho').length;
if (soThon !== 103) thatBai(`village thon=${soThon}, ky vong 103`);
if (soTdp !== 24) thatBai(`village tdp=${soTdp}, ky vong 24`);

const villageIds = records.map((item) => item.id);
if (new Set(villageIds).size !== villageIds.length) thatBai('trung ma village');

const communeIds = new Set(communes.map((item) => item.id));
for (const item of records) {
  if (
    !item.id.trim() ||
    !item.commune_id.trim() ||
    !item.name.trim() ||
    !item.full_name.trim() ||
    !item.normalized_name.trim()
  ) {
    thatBai(`village ban ghi rong: ${item.id}`);
  }
  if (item.type !== 'thon' && item.type !== 'to_dan_pho') {
    thatBai(`village type la: ${item.id}=${item.type}`);
  }
  if (item.active !== true) {
    thatBai(`village active phai true: ${item.id}`);
  }
  if (!communeIds.has(item.commune_id)) {
    thatBai(`village orphan FK: ${item.id} -> ${item.commune_id}`);
  }
}

const coverageDuLieu = JSON.parse(readFileSync(duongDanCoverage, 'utf-8')) as {
  coverage: CoverageRow[];
};
const coverage = coverageDuLieu.coverage;
if (coverage.length !== 104) thatBai(`coverage tong=${coverage.length}, ky vong 104`);
const verified = coverage.filter((item) => item.status === 'VERIFIED_COMPLETE');
const pending = coverage.filter((item) => item.status === 'PENDING_VERIFICATION');
if (verified.length !== 12) thatBai(`coverage verified=${verified.length}, ky vong 12`);
if (pending.length !== 92) thatBai(`coverage pending=${pending.length}, ky vong 92`);
for (const item of verified) {
  const actual = records.filter((row) => row.commune_id === item.commune_id).length;
  if (actual !== item.verified_record_count) {
    thatBai(`coverage ${item.commune_id}: file=${actual}, coverage=${item.verified_record_count}`);
  }
}
for (const item of pending) {
  if (item.verified_record_count !== 0) {
    thatBai(`coverage pending ${item.commune_id} phai co verified_record_count=0`);
  }
}

console.log(
  'OK: village progress 127 = 103 thon + 24 TDP cho 12/104 xa-phuong VERIFIED_COMPLETE; 92 PENDING. Toan tinh: PARTIAL_VERIFIED / NOT_COMPLETE.',
);
