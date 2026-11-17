/**
 * Adds the presentation catalog that `seed.ts` ships with, but onto a database that must NOT be
 * wiped (dev/staging with real orders). Idempotent: every insert is keyed by its natural code
 * (sku / season code / batch code / qr token), so re-running changes nothing.
 *
 *   pnpm --filter @agrimarket/api exec tsx src/scripts/seed-demo-catalog.ts
 */
import { one, pool, q } from '../db.js'

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
  hyFarm: boolean
}

const PRODUCTS: DemoProduct[] = [
  { slug: 'cam-sanh', sku: 'SP-CAMSANH', name: 'Cam sành Hưng Yên', cat: 'trai-cay', price: 35_000, unit: 'kg', shelf: 14,
    hyFarm: true, desc: 'Cam sành trồng tại Khoái Châu, Hưng Yên. Vỏ mỏng, múi mọng nước, vị chua ngọt hài hoà — ép nước hay ăn trực tiếp đều hợp.',
    storage: 'Nơi khô mát 18–25°C, tránh xếp chồng.', origin: 'Khoái Châu, Hưng Yên.' },
  { slug: 'nhan-long-hung-yen', sku: 'SP-NHANLONG', name: 'Nhãn lồng Hưng Yên', cat: 'trai-cay', price: 55_000, unit: 'kg', shelf: 10,
    hyFarm: true, desc: 'Nhãn lồng chính vụ, cùi dày, hạt nhỏ, thơm mùi mật. Thu hoạch và đóng gói trong ngày.',
    storage: 'Bảo quản 8–10°C, nên dùng trong 5 ngày.', origin: 'Phố Hiến, Hưng Yên.' },
  { slug: 'chuoi-gia-nam', sku: 'SP-CHUOIGIA', name: 'Chuối già Nam Mỹ', cat: 'trai-cay', price: 28_000, unit: 'nải', shelf: 7,
    hyFarm: true, desc: 'Chuối chín tự nhiên, quả to đều, vị ngọt đậm — phù hợp ăn sáng và làm sinh tố.',
    storage: 'Nhiệt độ phòng, tách nải để chín đều.', origin: 'Văn Giang, Hưng Yên.' },
  { slug: 'dua-hau-kim-long', sku: 'SP-DUAHẠU', name: 'Dưa hấu Kim Long', cat: 'trai-cay', price: 22_000, unit: 'kg', shelf: 12,
    hyFarm: true, desc: 'Dưa hấu ruột đỏ đậm, hạt ít, độ ngọt đo bằng khúc xạ kế trước khi xuất kho.',
    storage: 'Nơi thoáng mát, dùng trong 1 tuần sau khi bổ.', origin: 'Kim Động, Hưng Yên.' },
  { slug: 'du-du-ruot-do', sku: 'SP-DUDU', name: 'Đu đủ ruột đỏ', cat: 'trai-cay', price: 25_000, unit: 'kg', shelf: 8,
    hyFarm: true, desc: 'Đu đủ chín cây, ruột đỏ cam, dùng ăn trực tiếp hoặc làm sinh tố.',
    storage: 'Bảo quản mát, tránh dập.', origin: 'Tiên Lữ, Hưng Yên.' },
  { slug: 'bi-do-hokkai', sku: 'SP-BIDO', name: 'Bí đỏ Hokkaido', cat: 'rau-cu', price: 32_000, unit: 'kg', shelf: 30,
    hyFarm: true, desc: 'Bí đỏ vỏ xanh ruột vàng, bột và ngọt — nấu canh, hấp hay làm súp đều hợp.',
    storage: 'Nơi khô thoáng, để được 3–4 tuần.', origin: 'Ân Thi, Hưng Yên.' },
  { slug: 'xa-lach-romaine', sku: 'SP-XALACH', name: 'Xà lách Romaine', cat: 'rau-cu', price: 26_000, unit: 'kg', shelf: 5,
    hyFarm: true, desc: 'Xà lách Romaine giòn, lá xanh đậm, trồng trong nhà màng, thu hoạch sáng sớm.',
    storage: 'Bảo quản 4°C, dùng trong 4 ngày.', origin: 'Nhà màng Khoái Châu, Hưng Yên.' },
  { slug: 'gao-nep-cai-hoa-vang', sku: 'SP-GAONEP', name: 'Gạo nếp cái hoa vàng', cat: 'gao-ngu-coc', price: 95_000, unit: 'kg', shelf: 150,
    hyFarm: true, desc: 'Nếp cái hoa vàng hạt tròn, cơm nếp dẻo thơm, hợp nấu xôi và làm bánh truyền thống.',
    storage: 'Nơi khô ráo, đậy kín sau khi mở bao.', origin: 'Hưng Yên.' },
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

  let supplier = await one<{ id: string }>(`SELECT id FROM suppliers WHERE code='NCC-001'`)
  if (!supplier) {
    supplier = await one<{ id: string }>(
      `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
       VALUES ('NCC-001','HTX Rau an toàn Hưng Yên','Hợp tác xã','Đỗ Văn Hợp','0912555777','hop@htx-hungyen.vn')
       RETURNING id`,
    )
  }

  let farm = await one<{ id: string }>(`SELECT id FROM farms WHERE name='Vườn cam Khoái Châu'`)
  if (!farm) {
    farm = await one<{ id: string }>(
      `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
       VALUES ($1,'Vườn cam Khoái Châu','Hưng Yên','Khoái Châu','Tân Dân','Đê sông Hồng, thôn Tân Dân',20.8333,106.0333,6.2,'Cam sành, nhãn lồng, rau ăn lá','Đỗ Văn Hợp','0912555777')
       RETURNING id`,
      [supplier!.id],
    )
    await q(
      `INSERT INTO certificates (farm_id, type, number, issuer, valid_from, valid_until, scope)
       VALUES ($1,'VietGAP','VG-2026-0291','Trung tâm Chứng nhận VietGAP',$2,$3,'Vườn cam, nhãn')`,
      [farm!.id, iso(-300), iso(65)],
    )
  }

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
        `INSERT INTO products (category_id, sku, slug, name, description, storage, origin_note, unit, base_price_vnd, shelf_life_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [category.id, p.sku, p.slug, p.name, p.desc, p.storage, p.origin, p.unit, p.price, p.shelf],
      )
      await q(
        `INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1,$2,$3,0)`,
        [product!.id, `/images/products/${p.slug}.jpg`, p.name],
      )
      added++
    }

    const seasonCode = `SS-DEMO-${p.sku.replace('SP-', '')}`
    let season = await one<{ id: string }>(`SELECT id FROM crop_seasons WHERE code=$1`, [seasonCode])
    if (!season) {
      season = await one<{ id: string }>(
        `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
         VALUES ($1,$2,$3,'',1,$4,$5,'HARVESTED') RETURNING id`,
        [farm!.id, product!.id, seasonCode, iso(-88), iso(-11)],
      )
      await q(
        `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, note) VALUES
           ($1,'SOWING',$2,'Tổ kỹ thuật','Hạt/cây giống','Xuống giống theo lịch vụ'),
           ($1,'FERTILIZING',$3,'Tổ kỹ thuật','Phân hữu cơ vi sinh','Bón thúc'),
           ($1,'HARVEST',$4,'Tổ thu hoạch','Thu hoạch tay','Chọn lô đạt tiêu chuẩn bán')`,
        [season!.id, iso(-86), iso(-58), iso(-11)],
      )
    }

    const batchCode = `LO-DEMO-${p.sku.replace('SP-', '')}`
    let batch = await one<{ id: string }>(`SELECT id FROM batches WHERE code=$1`, [batchCode])
    if (!batch) {
      batch = await one<{ id: string }>(
        `INSERT INTO batches (season_id, product_id, code, harvest_date, pack_date, expiry_date, harvested_qty,
                              storage_condition, quality_status, publication_status, safety_status, published_at, published_by)
         VALUES ($1,$2,$3,$4,$4,$5,$6,'Bảo quản mát 8–12°C','PASS','PUBLISHED','NORMAL',now(),$7) RETURNING id`,
        [season!.id, product!.id, batchCode, iso(-10), iso(Math.min(p.shelf, 300)), 150, admin!.id],
      )
      const test = await one<{ id: string }>(
        `INSERT INTO lab_tests (batch_id, laboratory, sampled_at, resulted_at, overall_result, is_effective, confirmed_by, confirmed_at)
         VALUES ($1,'Trung tâm Kỹ thuật 2 – Chi cục BVTV',$2,$3,'PASS',true,$4,now()) RETURNING id`,
        [batch!.id, iso(-15), iso(-12), admin!.id],
      )
      for (const m of METRICS) {
        await q(
          `INSERT INTO lab_test_metrics (lab_test_id, metric, measured_value, unit, reference_limit, result)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [test!.id, m.metric, m.value, m.unit, m.limit, m.result],
        )
      }
      await q(`INSERT INTO qr_codes (batch_id, token) VALUES ($1,$2)`, [batch!.id, `demo-${p.slug}`])
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
  }

  console.log(`demo catalog: ${added} sản phẩm mới, ${PRODUCTS.length} sản phẩm demo có lô công khai`)
}

if (process.argv[1]?.endsWith('seed-demo-catalog.ts')) {
  await main()
  await pool.end()
}
