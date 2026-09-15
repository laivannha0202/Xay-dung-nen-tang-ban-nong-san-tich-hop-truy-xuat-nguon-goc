/**
 * Kiểm tra dataset xã/phường Hưng Yên (chạy không cần database).
 *
 * Kiểm tra: tổng 104, xã 93, phường 11, không trùng mã, tên không rỗng,
 * type chỉ xa/phuong, normalized_name tồn tại.
 *
 * Chạy: pnpm --filter @agrimarket/api-client exec tsx ../../scripts/kiem-tra-du-lieu-hung-yen.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const duongDan = resolve(rootDir, 'apps/api/prisma/seed-data/hung-yen-communes-2026.json');

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
