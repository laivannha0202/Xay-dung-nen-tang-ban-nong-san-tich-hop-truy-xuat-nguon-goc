/**
 * Báo cáo (read-only) các inventory_lot đang vi phạm invariant truy xuất nguồn gốc:
 *   inventory_lot.variant.product.farm  !==  inventory_lot.batch.harvest.season.farm
 *
 * Dùng để đánh giá rủi ro dữ liệu lịch sử. KHÔNG sửa, KHÔNG xóa.
 * Chạy:  node tools/scripts-1lan/kiem-tra-ton-kho-lai-trang-trai.mjs
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

import mariadb from 'mariadb';

loadEnv({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.argv[2] ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Thiếu DATABASE_URL (hoặc truyền URL làm tham số đầu tiên).');
}

const url = new URL(databaseUrl);
const connection = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || '3306'),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
});

try {
  const rows = await connection.query(`
    SELECT
      il.id,
      il.on_hand AS onHand,
      sp.ten AS tenSanPham,
      ft_a.ten AS trangTraiSanPham,
      lsp.ma_lo AS maLo,
      ft_b.ten AS trangTraiLo
    FROM inventory_lot il
    INNER JOIN bien_the_san_pham btsp ON btsp.id = il.bien_the_san_pham_id
    INNER JOIN san_pham sp ON sp.id = btsp.san_pham_id
    INNER JOIN trang_trai ft_a ON ft_a.id = sp.trang_trai_id
    INNER JOIN lo_san_pham lsp ON lsp.id = il.lo_san_pham_id
    INNER JOIN thu_hoach th ON th.id = lsp.thu_hoach_id
    INNER JOIN mua_vu mv ON mv.id = th.mua_vu_id
    INNER JOIN trang_trai ft_b ON ft_b.id = mv.trang_trai_id
    WHERE sp.trang_trai_id <> mv.trang_trai_id
    LIMIT 50
  `);

  console.log(`[cross-farm] DB = ${decodeURIComponent(url.pathname.replace(/^\/+/, ''))}`);
  console.log(`[cross-farm] Số dòng vi phạm (giới hạn 50): ${rows.length}`);
  for (const row of rows) {
    console.log(
      `  - ${row.id} | ${row.maLo} (${row.trangTraiLo}) + ${row.tenSanPham} (${row.trangTraiSanPham}) | onHand=${row.onHand}`,
    );
  }
} finally {
  await connection.end();
}
