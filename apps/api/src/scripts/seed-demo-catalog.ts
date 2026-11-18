/**
 * Adds the presentation catalog that `seed.ts` ships with, but onto a database that must NOT be
 * wiped (dev/staging with real orders). Idempotent: every insert is keyed by its natural code
 * (sku / season code / batch code / qr token), so re-running changes nothing.
 *
 *   pnpm --filter @agrimarket/api exec tsx src/scripts/seed-demo-catalog.ts
 */
import { one, pool, q } from '../db.js'
import { ensureFarm, type FarmKey } from './demo-farms.js'

const day = 86_400_000
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10)

interface DemoProduct {
  slug: string
  sku: string
  name: string
  cat: string
  price: number
  unit: string
  shelf: number
  desc: string
  storage: string
  origin: string
  /** Demo farm that grows this product — must sit in the province the origin note names. */
  farm: FarmKey
}

const PRODUCTS: DemoProduct[] = [
  { slug: 'cam-sanh', sku: 'SP-CAMSANH', name: 'Cam sành Hưng Yên', cat: 'trai-cay', price: 35_000, unit: 'kg', shelf: 14,
    farm: 'hy', desc: 'Cam sành trồng tại Khoái Châu, Hưng Yên. Vỏ mỏng, múi mọng nước, vị chua ngọt hài hoà — ép nước hay ăn trực tiếp đều hợp.',
    storage: 'Nơi khô mát 18–25°C, tránh xếp chồng.', origin: 'Khoái Châu, Hưng Yên.' },
  { slug: 'nhan-long-hung-yen', sku: 'SP-NHANLONG', name: 'Nhãn lồng Hưng Yên', cat: 'trai-cay', price: 55_000, unit: 'kg', shelf: 10,
    farm: 'hy', desc: 'Nhãn lồng chính vụ, cùi dày, hạt nhỏ, thơm mùi mật. Thu hoạch và đóng gói trong ngày.',
    storage: 'Bảo quản 8–10°C, nên dùng trong 5 ngày.', origin: 'Phố Hiến, Hưng Yên.' },
  { slug: 'chuoi-gia-nam', sku: 'SP-CHUOIGIA', name: 'Chuối già Nam Mỹ', cat: 'trai-cay', price: 28_000, unit: 'nải', shelf: 7,
    farm: 'hy', desc: 'Chuối chín tự nhiên, quả to đều, vị ngọt đậm — phù hợp ăn sáng và làm sinh tố.',
    storage: 'Nhiệt độ phòng, tách nải để chín đều.', origin: 'Văn Giang, Hưng Yên.' },
  { slug: 'dua-hau-kim-long', sku: 'SP-DUAHẠU', name: 'Dưa hấu Kim Long', cat: 'trai-cay', price: 22_000, unit: 'kg', shelf: 12,
    farm: 'hy', desc: 'Dưa hấu ruột đỏ đậm, hạt ít, độ ngọt đo bằng khúc xạ kế trước khi xuất kho.',
    storage: 'Nơi thoáng mát, dùng trong 1 tuần sau khi bổ.', origin: 'Kim Động, Hưng Yên.' },
  { slug: 'du-du-ruot-do', sku: 'SP-DUDU', name: 'Đu đủ ruột đỏ', cat: 'trai-cay', price: 25_000, unit: 'kg', shelf: 8,
    farm: 'hy', desc: 'Đu đủ chín cây, ruột đỏ cam, dùng ăn trực tiếp hoặc làm sinh tố.',
    storage: 'Bảo quản mát, tránh dập.', origin: 'Tiên Lữ, Hưng Yên.' },
  { slug: 'bi-do-hokkai', sku: 'SP-BIDO', name: 'Bí đỏ Hokkaido', cat: 'rau-cu', price: 32_000, unit: 'kg', shelf: 30,
    farm: 'hy', desc: 'Bí đỏ vỏ xanh ruột vàng, bột và ngọt — nấu canh, hấp hay làm súp đều hợp.',
    storage: 'Nơi khô thoáng, để được 3–4 tuần.', origin: 'Ân Thi, Hưng Yên.' },
  { slug: 'xa-lach-romaine', sku: 'SP-XALACH', name: 'Xà lách Romaine', cat: 'rau-cu', price: 26_000, unit: 'kg', shelf: 5,
    farm: 'hy', desc: 'Xà lách Romaine giòn, lá xanh đậm, trồng trong nhà màng, thu hoạch sáng sớm.',
    storage: 'Bảo quản 4°C, dùng trong 4 ngày.', origin: 'Nhà màng Khoái Châu, Hưng Yên.' },
  { slug: 'gao-nep-cai-hoa-vang', sku: 'SP-GAONEP', name: 'Gạo nếp cái hoa vàng', cat: 'gao-ngu-coc', price: 95_000, unit: 'kg', shelf: 150,
    farm: 'hy', desc: 'Nếp cái hoa vàng hạt tròn, cơm nếp dẻo thơm, hợp nấu xôi và làm bánh truyền thống.',
    storage: 'Nơi khô ráo, đậy kín sau khi mở bao.', origin: 'Hưng Yên.' },
  { slug: 'thanh-long-ruot-do', sku: 'SP-THANHLONG', name: 'Thanh long ruột đỏ', cat: 'trai-cay', price: 38_000, unit: 'kg', shelf: 12,
    farm: 'bt2', desc: 'Thanh long ruột đỏ, vỏ hồng căng, thịt đỏ mọng và ít hạt — ăn mát, hợp làm sinh tố.',
    storage: 'Nhiệt độ phòng 2–3 ngày, ngăn mát 5–7 ngày.', origin: 'Bình Thuận.' },
  { slug: 'dua-mat-thom', sku: 'SP-DUAMAT', name: 'Dứa mật (thơm)', cat: 'trai-cay', price: 30_000, unit: 'quả', shelf: 10,
    farm: 'tg', desc: 'Dứa mật vỏ vàng, mắt nông, vị ngọt đậm ít chua — ăn tươi, ép nước hay nấu canh đều hợp.',
    storage: 'Nơi thoáng mát, tránh ánh nắng trực tiếp.', origin: 'Tiền Giang.' },
  { slug: 'oi-nu-hoang', sku: 'SP-OI', name: 'Ổi nữ hoàng', cat: 'trai-cay', price: 34_000, unit: 'kg', shelf: 7,
    farm: 'hd', desc: 'Ổi nữ hoàng ruột hồng, giòn và thơm, hạt mềm — ăn trực tiếp hoặc làm gỏi.',
    storage: 'Bảo quản mát, dùng trong 4–5 ngày.', origin: 'Hải Dương.' },
  { slug: 'ca-rot', sku: 'SP-CAROT', name: 'Cà rốt', cat: 'rau-cu', price: 24_000, unit: 'kg', shelf: 21,
    farm: 'ld', desc: 'Cà rốt củ đều, ruột cam đậm, giòn ngọt — hầm súp, xào hay làm nộm đều được.',
    storage: 'Ngăn mát tủ lạnh, bọc kín để giữ độ giòn.', origin: 'Đức Trọng, Lâm Đồng.' },
  { slug: 'dua-chuot', sku: 'SP-DUACHUOT', name: 'Dưa chuột', cat: 'rau-cu', price: 20_000, unit: 'kg', shelf: 7,
    farm: 'hy', desc: 'Dưa chuột quả thẳng, căng nước, vỏ xanh mướt — ăn sống, làm nộm hoặc muối chua.',
    storage: 'Ngăn mát tủ lạnh, không rửa trước khi cất.', origin: 'Hưng Yên.' },
  { slug: 'hanh-tay', sku: 'SP-HANHTAY', name: 'Hành tây', cat: 'rau-cu', price: 18_000, unit: 'kg', shelf: 40,
    farm: 'hy', desc: 'Hành tây củ chắc, vỏ khô vàng nâu, vị ngọt hậu khi nấu chín.',
    storage: 'Nơi khô ráo, thoáng gió, tránh ánh nắng.', origin: 'Hưng Yên.' },
]

const METRICS = [
  { metric: 'Dư lượng thuốc BVTV', value: '0.01', unit: 'mg/kg', limit: '≤ 0.05', result: 'PASS' },
  { metric: 'Kim loại nặng (Pb)', value: '0.02', unit: 'mg/kg', limit: '≤ 0.1', result: 'PASS' },
  { metric: 'Vi sinh vật E.coli', value: 'Không phát hiện', unit: 'CFU/g', limit: '≤ 10', result: 'PASS' },
]

async function main() {
  const admin = await one<{ id: string }>(`SELECT id FROM users WHERE role='ADMIN' ORDER BY created_at LIMIT 1`)
  if (!admin) throw new Error('No ADMIN user: run the normal seed first.')

  const warehouse = await one<{ id: string }>(`SELECT id FROM warehouses ORDER BY code LIMIT 1`)
  if (!warehouse) throw new Error('No warehouse: run the normal seed first.')

  // Own supplier code: reusing NCC-001 would attach a Hưng Yên orchard to the Đà Lạt co-op
  // created by the base seed, which reads as a provenance error on the public passport.
  let supplier = await one<{ id: string }>(`SELECT id FROM suppliers WHERE code='NCC-HY-001'`)
  if (!supplier) {
    supplier = await one<{ id: string }>(
      `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
       VALUES ('NCC-HY-001','HTX Rau an toàn Hưng Yên','Hợp tác xã','Đỗ Văn Hợp','0912555777','hop@htx-hungyen.vn')
       RETURNING id`,
    )
  }

  // One farm per origin region — the passport must not show a Hưng Yên orchard for a Bến Tre lot.
  const farmIds = new Map<FarmKey, string>()
  for (const key of new Set(PRODUCTS.map((p) => p.farm))) farmIds.set(key, await ensureFarm(key, supplier!.id))
  const hyFarm = farmIds.get('hy')!
  const hyCert = await one<{ id: string }>(`SELECT id FROM certificates WHERE farm_id=$1`, [hyFarm])
  if (!hyCert) {
    await q(
      `INSERT INTO certificates (farm_id, type, number, issuer, valid_from, valid_until, scope)
       VALUES ($1,'VietGAP','VG-2026-0291','Trung tâm Chứng nhận VietGAP',$2,$3,'Vườn cam, nhãn')`,
      [hyFarm, iso(-300), iso(65)],
    )
  }
  // Rows this seeder owns by natural key are demo data; flag them so Admin can label them.
  await q(`UPDATE farms SET is_demo=true, supplier_id=$2 WHERE id=$1`, [hyFarm, supplier!.id])

  // Category tiles: picture comes from the category itself, not from a random product.
  for (const [slug, url] of [
    ['rau-cu', '/images/categories/rau-cu.jpg'],
    ['trai-cay', '/images/categories/trai-cay.jpg'],
    ['gao-ngu-coc', '/images/categories/gao-ngu-coc.jpg'],
    ['dac-san', '/images/categories/dac-san.jpg'],
  ]) {
    await q(`UPDATE categories SET image_url=$2 WHERE slug=$1 AND image_url IS NULL`, [slug, url])
  }

  let added = 0
  for (const p of PRODUCTS) {
    const category = await one<{ id: string }>(`SELECT id FROM categories WHERE slug=$1`, [p.cat])
    if (!category) throw new Error(`Missing category ${p.cat}`)

    let product = await one<{ id: string }>(`SELECT id FROM products WHERE slug=$1 OR sku=$2`, [p.slug, p.sku])
    if (!product) {
      product = await one<{ id: string }>(
        `INSERT INTO products (category_id, sku, slug, name, description, storage, origin_note, unit, base_price_vnd, shelf_life_days, is_demo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING id`,
        [category.id, p.sku, p.slug, p.name, p.desc, p.storage, p.origin, p.unit, p.price, p.shelf],
      )
      await q(
        `INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1,$2,$3,0)`,
        [product!.id, `/images/products/${p.slug}.jpg`, p.name],
      )
      added++
    }
    // Only rows keyed by this seeder's own slugs are demo data — never blanket-flag a catalogue.
    await q(`UPDATE products SET is_demo=true WHERE id=$1`, [product!.id])

    const seasonCode = `SS-DEMO-${p.sku.replace('SP-', '')}`
    let season = await one<{ id: string }>(`SELECT id FROM crop_seasons WHERE code=$1`, [seasonCode])
    if (!season) {
      season = await one<{ id: string }>(
        `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
         VALUES ($1,$2,$3,$6,1,$4,$5,'HARVESTED') RETURNING id`,
        [farmIds.get(p.farm)!, product!.id, seasonCode, iso(-88), iso(-11), p.name],
      )
      await q(
        `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, note) VALUES
           ($1,'SOWING',$2,'Tổ kỹ thuật','Hạt/cây giống','Xuống giống theo lịch vụ'),
           ($1,'FERTILIZING',$3,'Tổ kỹ thuật','Phân hữu cơ vi sinh','Bón thúc'),
           ($1,'HARVEST',$4,'Tổ thu hoạch','Thu hoạch tay','Chọn lô đạt tiêu chuẩn bán')`,
        [season!.id, iso(-86), iso(-58), iso(-11)],
      )
    }

    // Early demo rows were seeded with an empty variety; the passport shows it as "—".
    await q(`UPDATE crop_seasons SET variety=$2 WHERE id=$1 AND variety=''`, [season!.id, p.name])

    const batchCode = `LO-DEMO-${p.sku.replace('SP-', '')}`
    let batch = await one<{ id: string }>(`SELECT id FROM batches WHERE code=$1`, [batchCode])
    if (!batch) {
      batch = await one<{ id: string }>(
        `INSERT INTO batches (season_id, product_id, code, harvest_date, pack_date, expiry_date, harvested_qty,
                              storage_condition, quality_status, publication_status, safety_status, published_at, published_by, is_demo)
         VALUES ($1,$2,$3,$4,$4,$5,$6,'Bảo quản mát 8–12°C','PASS','PUBLISHED','NORMAL',now(),$7,true) RETURNING id`,
        [season!.id, product!.id, batchCode, iso(-10), iso(Math.min(p.shelf, 300)), 150, admin!.id],
      )
      const test = await one<{ id: string }>(
        `INSERT INTO lab_tests (batch_id, laboratory, sampled_at, resulted_at, overall_result, is_effective, confirmed_by, confirmed_at, is_demo)
         VALUES ($1,'Phiếu minh hoạ DEMO — không phải phòng kiểm nghiệm',$2,$3,'PASS',true,$4,now(),true) RETURNING id`,
        [batch!.id, iso(-15), iso(-12), admin!.id],
      )
      for (const m of METRICS) {
        await q(
          `INSERT INTO lab_test_metrics (lab_test_id, metric, measured_value, unit, reference_limit, result)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [test!.id, m.metric, m.value, m.unit, m.limit, m.result],
        )
      }
    }
    // The presentation rows live in their own block: a lot created by an earlier run already has its
    // lab test, but the old seeder aborted on the qr token clash before writing these. Gate on the QR.
    const hasQr = await one<{ id: string }>(`SELECT id FROM qr_codes WHERE batch_id=$1`, [batch!.id])
    if (!hasQr) {
      // `seed.ts` owns the `demo-<slug>` token for its own lot of the same product, so these get a prefix.
      await q(`INSERT INTO qr_codes (batch_id, token) VALUES ($1,$2)`, [batch!.id, `demo-lo-${p.slug}`])
      await q(
        `INSERT INTO inventory (warehouse_id, batch_id, on_hand_qty, reserved_qty, received_at) VALUES ($1,$2,$3,0,$4)`,
        [warehouse!.id, batch!.id, 150, iso(-10)],
      )
      await q(
        `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, actor_id)
         VALUES ($1,$2,'IN',150,150,'Nhập kho ban đầu','RECEIPT',$3)`,
        [warehouse!.id, batch!.id, admin!.id],
      )
      await q(
        `INSERT INTO batch_events (batch_id, type, title, description, actor_id) VALUES
           ($1,'HARVEST','Thu hoạch','Thu hoạch và phân loại tại vườn',$2),
           ($1,'LAB_PASS','Kiểm nghiệm đạt','Phiếu kiểm nghiệm đạt dư lượng thuốc BVTV',$2),
           ($1,'PUBLISHED','Công khai hồ sơ lô','Đủ điều kiện công khai',$2)`,
        [batch!.id, admin!.id],
      )
    }
    // Batches written before 007 existed carry no flag; key them by this seeder's own code.
    await q(`UPDATE batches SET is_demo=true WHERE id=$1`, [batch!.id])
  }

  console.log(`demo catalog: ${added} sản phẩm mới, ${PRODUCTS.length} sản phẩm demo có lô công khai`)
}

if (process.argv[1]?.endsWith('seed-demo-catalog.ts')) {
  await main()
  await pool.end()
}
