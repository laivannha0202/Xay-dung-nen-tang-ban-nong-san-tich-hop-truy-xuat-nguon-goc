import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { pool, q, tx } from '../db.js'
import { hashPassword } from '../lib/password.js'
import { config } from '../config.js'

/**
 * Wipes and re-seeds this database. Refuses to run unless NODE_ENV is test/demo:
 * a stray `pnpm db:seed` against a real DB would otherwise TRUNCATE everything.
 */
function assertSeedable() {
  const env = process.env.NODE_ENV ?? 'development'
  if (process.env.ALLOW_DESTRUCTIVE_SEED === 'yes' || env === 'test' || env === 'demo') return
  throw new Error(
    `Refusing to seed: TRUNCATE would wipe "${process.env.DATABASE_URL ?? 'the default database'}". ` +
      'Use NODE_ENV=test|demo or ALLOW_DESTRUCTIVE_SEED=yes on a disposable database.',
  )
}

const day = 86400000
const today = new Date()
const iso = (offsetDays: number) => new Date(today.getTime() + offsetDays * day).toISOString().slice(0, 10)

async function truncate() {
  const tables = [
    'recall_contacts', 'recalls', 'complaint_messages', 'complaint_files', 'complaints',
    'reviews', 'shipments', 'refund_requests', 'payments', 'order_line_allocations',
    'order_lines', 'idempotency_records', 'orders', 'cart_items', 'carts',
    'stock_movements', 'inventory', 'warehouses', 'qr_scans', 'qr_codes',
    'batch_promotions', 'promotions', 'certificates', 'evidence_files',
    'lab_test_metrics', 'lab_tests', 'batch_events', 'batches', 'cultivation_logs',
    'crop_seasons', 'farms', 'suppliers', 'product_images', 'products', 'categories',
    // `wards` is listed explicitly: TRUNCATE … CASCADE would empty it via addresses.ward_code.
    'wards', 'audit_logs', 'login_attempts', 'addresses', 'customer_profiles', 'settings', 'users',
  ]
  await q(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`)
}

async function main() {
  assertSeedable()
  console.log('seeding…')
  await truncate()

  // Administrative units are dataset data, not fixtures: reload them after the wipe.
  const dataset = JSON.parse(
    await readFile(new URL('../../data/hung-yen-wards.json', import.meta.url), 'utf8'),
  ) as {
    meta: { dataset_version: string; source: string }
    wards: Array<{ code: string; name: string; type: string; province_code: string; search_text: string }>
  }
  await q(
    `INSERT INTO wards (code, province_code, name, type, search_text, dataset_version, source, source_checked_at)
     SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
                         $6::text[], $7::text[], $8::date[])`,
    [
      dataset.wards.map((w) => w.code),
      dataset.wards.map((w) => w.province_code),
      dataset.wards.map((w) => w.name),
      dataset.wards.map((w) => w.type),
      dataset.wards.map((w) => w.search_text),
      dataset.wards.map(() => dataset.meta.dataset_version),
      dataset.wards.map(() => dataset.meta.source),
      dataset.wards.map(() => '2026-11-17'),
    ],
  )

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@agrimarket.vn'
  const adminPass = process.env.ADMIN_PASSWORD ?? 'Admin@123456'
  const custPass = 'Khach@123456'

  const [admin] = await q<{ id: string }>(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'ADMIN') RETURNING id`,
    [adminEmail, await hashPassword(adminPass)],
  )
  const custHash = await hashPassword(custPass)
  const custs = await q<{ id: string }>(
    `INSERT INTO users (email, password_hash, role) VALUES
       ('khach1@example.com',$1,'CUSTOMER'), ('khach2@example.com',$1,'CUSTOMER') RETURNING id`,
    [custHash],
  )
  const [c1, c2] = custs
  await q(`INSERT INTO customer_profiles (user_id, name, phone) VALUES ($1,'Nguyễn Văn An','0901234567'),($2,'Trần Thị Bình','0912345678')`, [c1!.id, c2!.id])
  await q(
    // Hưng Yên wards only: these are the addresses used by the checkout tests.
    `INSERT INTO addresses (user_id, recipient_name, phone, province, province_code, ward_code, ward, street_detail, is_default) VALUES
       ($1,'Nguyễn Văn An','0901234567','Tỉnh Hưng Yên','33','11953','Phường Phố Hiến','12 Lý Thường Kiệt',true),
       ($2,'Trần Thị Bình','0912345678','Tỉnh Hưng Yên','33','11980','Phường Hồng Châu','45 Nguyễn Văn Linh',true)`,
    [c1!.id, c2!.id],
  )
  for (const c of [c1!, c2!]) await q(`INSERT INTO carts (customer_id) VALUES ($1)`, [c.id])

  const cats = await q<{ id: string; slug: string }>(
    `INSERT INTO categories (slug, name, description, sort_order, image_url) VALUES
      ('rau-cu','Rau củ','Rau củ tươi thu hoạch trong ngày',1,'/images/categories/rau-cu.jpg'),
      ('trai-cay','Trái cây','Trái cây đặc sản theo mùa',2,'/images/categories/trai-cay.jpg'),
      ('gao-ngu-coc','Gạo & Ngũ cốc','Gạo, nếp, ngũ cốc đóng gói',3,'/images/categories/gao-ngu-coc.jpg'),
      ('dac-san','Đặc sản','Mật ong, mắm, đặc sản vùng miền',4,'/images/categories/dac-san.jpg')
      RETURNING id, slug`,
  )

  const catIds = Object.fromEntries(cats.map((c) => [c.slug, c.id])) as Record<string, string>
  const catId = (slug: string) => catIds[slug]!

  const productDefs = [
    { slug: 'ca-chua-bien', sku: 'SP-CACHUA', name: 'Cà chua bi Đà Lạt', cat: 'rau-cu', price: 42000, unit: 'kg', shelf: 10,
      desc: 'Cà chua bi trồng trong nhà màng tại Đà Lạt, thu hoạch chín tự nhiên, vị ngọt đậm.',
      storage: 'Bảo quản ngăn mát 8–12°C, dùng trong 7–10 ngày.', origin: 'Nhà màng Đơn Dương, Lâm Đồng.' },
    { slug: 'rau-muong', sku: 'SP-RAUMUONG', name: 'Rau muống hữu cơ', cat: 'rau-cu', price: 18000, unit: 'kg', shelf: 5,
      desc: 'Rau muống nước trồng hữu cơ, không thuốc trừ sâu hóa học.', storage: 'Bảo quản 4°C.', origin: 'Củ Chi, TP. Hồ Chí Minh.' },
    { slug: 'xoai-cat-hoa-loc', sku: 'SP-XOAIHL', name: 'Xoài cát Hòa Lộc', cat: 'trai-cay', price: 89000, unit: 'kg', shelf: 14,
      desc: 'Xoài cát Hòa Lộc loại 1, thịt vàng, hạt lép, thơm mật.', storage: 'Bảo quản 12°C, chín sau 3–4 ngày.', origin: 'Cái Bè, Tiền Giang.' },
    { slug: 'buoi-da-xanh', sku: 'SP-BUOIDX', name: 'Bưởi da xanh Bến Tre', cat: 'trai-cay', price: 65000, unit: 'quả', shelf: 20,
      desc: 'Bưởi da xanh ruột hồng, vị ngọt thanh, mọng nước.', storage: 'Nơi khô mát 15–25°C.', origin: 'Mỏ Cày Nam, Bến Tre.' },
    { slug: 'gao-st25', sku: 'SP-GAOST25', name: 'Gạo ST25', cat: 'gao-ngu-coc', price: 150000, unit: 'kg', shelf: 180,
      desc: 'Gạo ST25 hạt dài, cơm dẻo thơm nhẹ mùi lá dứa.', storage: 'Nơi khô ráo, tránh ánh nắng.', origin: 'Sóc Trăng.' },
    { slug: 'mat-ong-rung', sku: 'SP-MATONG', name: 'Mật ong rừng nguyên chất', cat: 'dac-san', price: 380000, unit: 'lít', shelf: 365,
      desc: 'Mật ong rừng U Minh khai thác tự nhiên, không pha đường.', storage: 'Tránh ánh nắng trực tiếp.', origin: 'U Minh, Cà Mau.' },
    { slug: 'cam-sanh', sku: 'SP-CAMSANH', name: 'Cam sành Hưng Yên', cat: 'trai-cay', price: 35000, unit: 'kg', shelf: 14,
      desc: 'Cam sành trồng tại Khoái Châu, Hưng Yên. Vỏ mỏng, múi mọng nước, vị chua ngọt hài hoà — ép nước hay ăn trực tiếp đều hợp.',
      storage: 'Nơi khô mát 18–25°C, tránh xếp chồng.', origin: 'Khoái Châu, Hưng Yên.' },
    { slug: 'nhan-long-hung-yen', sku: 'SP-NHANLONG', name: 'Nhãn lồng Hưng Yên', cat: 'trai-cay', price: 55000, unit: 'kg', shelf: 10,
      desc: 'Nhãn lồng chính vụ, cùi dày, hạt nhỏ, thơm mùi mật. Thu hoạch và đóng gói trong ngày.',
      storage: 'Bảo quản 8–10°C, nên dùng trong 5 ngày.', origin: 'Phố Hiến, Hưng Yên.' },
    { slug: 'chuoi-gia-nam', sku: 'SP-CHUOIGIA', name: 'Chuối già Nam Mỹ', cat: 'trai-cay', price: 28000, unit: 'nải', shelf: 7,
      desc: 'Chuối chín tự nhiên, quả to đều, vị ngọt đậm — phù hợp ăn sáng và làm sinh tố.',
      storage: 'Nhiệt độ phòng, tách nải để chín đều.', origin: 'Văn Giang, Hưng Yên.' },
    { slug: 'dua-hau-kim-long', sku: 'SP-DUAHẠU', name: 'Dưa hấu Kim Long', cat: 'trai-cay', price: 22000, unit: 'kg', shelf: 12,
      desc: 'Dưa hấu ruột đỏ đậm, hạt ít, độ ngọt đo bằng khúc xạ kế trước khi xuất kho.',
      storage: 'Nơi thoáng mát, dùng trong 1 tuần sau khi bổ.', origin: 'Kim Động, Hưng Yên.' },
    { slug: 'du-du-ruot-do', sku: 'SP-DUDU', name: 'Đu đủ ruột đỏ', cat: 'trai-cay', price: 25000, unit: 'kg', shelf: 8,
      desc: 'Đu đủ chín cây, ruột đỏ cam, dùng ăn trực tiếp hoặc làm sinh tố.',
      storage: 'Bảo quản mát, tránh dập.', origin: 'Tiên Lữ, Hưng Yên.' },
    { slug: 'bi-do-hokkai', sku: 'SP-BIDO', name: 'Bí đỏ Hokkaido', cat: 'rau-cu', price: 32000, unit: 'kg', shelf: 30,
      desc: 'Bí đỏ vỏ xanh ruột vàng, bột và ngọt — nấu canh, hấp hay làm súp đều hợp.',
      storage: 'Nơi khô thoáng, để được 3–4 tuần.', origin: 'Ân Thi, Hưng Yên.' },
    { slug: 'xa-lach-romaine', sku: 'SP-XALACH', name: 'Xà lách Romaine', cat: 'rau-cu', price: 26000, unit: 'kg', shelf: 5,
      desc: 'Xà lách Romaine giòn, lá xanh đậm, trồng trong nhà màng, thu hoạch sáng sớm.',
      storage: 'Bảo quản 4°C, dùng trong 4 ngày.', origin: 'Nhà màng Khoái Châu, Hưng Yên.' },
    { slug: 'gao-nep-cai-hoa-vang', sku: 'SP-GAONEP', name: 'Gạo nếp cái hoa vàng', cat: 'gao-ngu-coc', price: 95000, unit: 'kg', shelf: 150,
      desc: 'Nếp cái hoa vàng hạt tròn, cơm nếp dẻo thơm, hợp nấu xôi và làm bánh truyền thống.',
      storage: 'Nơi khô ráo, đậy kín sau khi mở bao.', origin: 'Hưng Yên.' },
  ]

  const products: Record<string, string> = {}
  for (const p of productDefs) {
    const [row] = await q<{ id: string }>(
      `INSERT INTO products (category_id, sku, slug, name, description, storage, origin_note, unit, base_price_vnd, shelf_life_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [catId(p.cat), p.sku, p.slug, p.name, p.desc, p.storage, p.origin, p.unit, p.price, p.shelf],
    )
    products[p.slug] = row!.id
    await q(`INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1,$2,$3,0)`,
      [row!.id, `/images/products/${p.slug}.jpg`, p.name])
  }

  const [sup1] = await q<{ id: string }>(
    `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
     VALUES ('NCC-001','HTX Rau an toàn Đà Lạt','Hợp tác xã','Lê Minh','0938111222','minh@hcx-dalat.vn') RETURNING id`,
  )
  const [sup2] = await q<{ id: string }>(
    `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
     VALUES ('NCC-002','HTX Xoài Cao Lãnh','Hợp tác xã','Phạm Hoa','0977333444','hoa@xoai-caolanh.vn') RETURNING id`,
  )

  const [farm1] = await q<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
     VALUES ($1,'Vườn nhà màng Đơn Dương','Lâm Đồng','Đơn Dương','Lạc Xuân','Thôn Lạc Xuân 2',11.7519,108.5451,4.5,'Cà chua, rau ăn lá','Nguyễn Hữu Thắng','0938222333') RETURNING id`,
    [sup1!.id],
  )
  const [farm2] = await q<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
     VALUES ($1,'Vườn xoài Cái Bè','Tiền Giang','Cái Bè','Hòa Hưng','Ấp Hòa Hưng',10.3402,106.0486,8,'Xoài cát Hòa Lộc','Trần Quốc Dũng','0978444555') RETURNING id`,
    [sup2!.id],
  )

  const [farm3] = await q<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
     VALUES ($1,'Vườn cam Khoái Châu','Hưng Yên','Khoái Châu','Tân Dân','Đê sông Hồng, thôn Tân Dân',20.8333,106.0333,6.2,'Cam sành, nhãn lồng, rau ăn lá','Đỗ Văn Hợp','0912555777') RETURNING id`,
    [sup1!.id],
  )
  // Two lots below are grown far from Đà Lạt; their season must sit in the province the origin note
  // names, otherwise the passport pairs "Mỏ Cày Nam, Bến Tre" with a Lâm Đồng orchard.
  const [farmBenTre] = await q<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
     VALUES ($1,'Vườn bưởi Mỏ Cày Nam','Bến Tre','Mỏ Cày Nam','An Thới','Ấp An Hòa',10.1333,106.35,3,'Bưởi da xanh','Nguyễn Văn Tám','0977111222') RETURNING id`,
    [sup2!.id],
  )
  const [farmCuChi] = await q<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone)
     VALUES ($1,'Ruộng rau Củ Chi','TP. Hồ Chí Minh','Củ Chi','Tân Thạnh Đông','Ấp 2, xã Tân Thạnh Đông',11.0067,106.4931,2.4,'Rau muống nước','Lê Thị Hồng','0909333444') RETURNING id`,
    [sup1!.id],
  )
  const SLUG_FARM: Record<string, string> = { 'rau-muong': farmCuChi!.id, 'buoi-da-xanh': farmBenTre!.id }

  await q(
    `INSERT INTO certificates (farm_id, type, number, issuer, valid_from, valid_until, scope) VALUES
       ($1,'VietGAP','VG-2026-0142','Trung tâm Chứng nhận VietGAP',$2,$3,'Nhà màng rau ăn quả'),
       ($4,'GlobalG.A.P.','GG-2025-8891','Control Union',$5,$6,'Vườn xoài'),
       ($7,'VietGAP','VG-2026-0291','Trung tâm Chứng nhận VietGAP',$2,$3,'Vườn cam, nhãn')`,
    [farm1!.id, iso(-300), iso(65), farm2!.id, iso(-400), iso(120), farm3!.id],
  )

  // Season 1: cà chua — has a pesticide log, isolation 7 days already elapsed.
  const [season1] = await q<{ id: string }>(
    `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
     VALUES ($1,$2,'SS-2026-0001','Cà chua cherry Nova',1.2,$3,$4,'HARVESTED') RETURNING id`,
    [farm1!.id, products['ca-chua-bien'], iso(-120), iso(-20)],
  )
  await q(
    `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, pesticide_name, isolation_days, note) VALUES
       ($1,'TILLING',$2,'Nguyễn Hữu Thắng','Phân hữu cơ vi sinh',NULL,NULL,'Cày ải, bón lót'),
       ($1,'SOWING',$3,'Nguyễn Hữu Thắng','Hạt giống Nova',NULL,NULL,'Gieo trong bầu'),
       ($1,'FERTILIZING',$4,'Nguyễn Hữu Thắng','NPK 16-16-8',NULL,NULL,'Bón thúc đợt 1'),
       ($1,'PESTICIDE',$5,'Nguyễn Hữu Thắng','Chế phẩm sinh học BT','Bacillus thuringiensis',7,'Phun phòng sâu khoang'),
       ($1,'IRRIGATION',$6,'Hệ thống tưới','Nhỏ giọt',NULL,NULL,'Tưới 2 lần/ngày'),
       ($1,'HARVEST',$7,'Tổ thu hoạch','Thu hoạch tay',NULL,NULL,'Thu hoạch đợt 3')`,
    [season1!.id, iso(-118), iso(-115), iso(-80), iso(-40), iso(-35), iso(-22)],
  )

  // Season 2: xoài — no pesticide log.
  const [season2] = await q<{ id: string }>(
    `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
     VALUES ($1,$2,'SS-2026-0002','Xoài cát Hòa Lộc',3,$3,$4,'HARVESTED') RETURNING id`,
    [farm2!.id, products['xoai-cat-hoa-loc'], iso(-200), iso(-16)],
  )
  await q(
    `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, note) VALUES
       ($1,'PRUNING',$2,'Trần Quốc Dũng','Cắt tỉa cành','Tạo tán'),
       ($1,'FERTILIZING',$3,'Trần Quốc Dũng','Phân hữu cơ','Bón quanh gốc'),
       ($1,'HARVEST',$4,'Trần Quốc Dũng','Thu hoạch tay','Chọn quả chín 80%')`,
    [season2!.id, iso(-160), iso(-90), iso(-18)],
  )

  const mkBatch = async (
    seasonId: string, productId: string, code: string, harvest: string, expiry: string, qty: number,
    opts: { quality?: 'PENDING' | 'PASS' | 'FAIL'; publication?: 'DRAFT' | 'PUBLISHED'; safety?: 'NORMAL' | 'HOLD' | 'RECALLED' } = {},
  ) => {
    const [b] = await q<{ id: string }>(
      `INSERT INTO batches (season_id, product_id, code, harvest_date, pack_date, expiry_date, harvested_qty,
                            storage_condition, quality_status, publication_status, safety_status, published_at, published_by)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,
               CASE WHEN $9='PUBLISHED' THEN now() ELSE NULL END,
               CASE WHEN $9='PUBLISHED' THEN $11::uuid ELSE NULL END) RETURNING id`,
      [seasonId, productId, code, harvest, expiry, qty, 'Bảo quản mát 8–12°C',
       opts.quality ?? 'PASS', opts.publication ?? 'PUBLISHED', opts.safety ?? 'NORMAL', admin!.id],
    )
    return b!.id
  }

  const addTest = async (batchId: string, result: 'PASS' | 'FAIL', metrics: { metric: string; value: string; unit: string; limit: string; result: 'PASS' | 'FAIL' }[]) => {
    const [t] = await q<{ id: string }>(
      `INSERT INTO lab_tests (batch_id, laboratory, sampled_at, resulted_at, overall_result, is_effective, confirmed_by, confirmed_at)
       VALUES ($1,'Trung tâm Kỹ thuật 2 – Chi cục BVTV',$2,$3,$4,true,$5,now()) RETURNING id`,
      [batchId, iso(-15), iso(-12), result, admin!.id],
    )
    for (const m of metrics) {
      await q(
        `INSERT INTO lab_test_metrics (lab_test_id, metric, measured_value, unit, reference_limit, result)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [t!.id, m.metric, m.value, m.unit, m.limit, m.result],
      )
    }
    return t!.id
  }

  const defaultMetrics = (fail = false) => [
    { metric: 'Dư lượng thuốc BVTV', value: fail ? '0.15' : '0.01', unit: 'mg/kg', limit: '≤ 0.05', result: fail ? ('FAIL' as const) : ('PASS' as const) },
    { metric: 'Kim loại nặng (Pb)', value: '0.02', unit: 'mg/kg', limit: '≤ 0.1', result: 'PASS' as const },
    { metric: 'Vi sinh vật E.coli', value: 'Không phát hiện', unit: 'CFU/g', limit: '≤ 10', result: 'PASS' as const },
  ]

  // Batches for cà chua: A (500 kg, expires +8d), B (300 kg, expires +20d), C fail, D expired.
  const bA = await mkBatch(season1!.id, products['ca-chua-bien'], 'LO-2026-0001', iso(-8), iso(8), 500)
  await addTest(bA, 'PASS', defaultMetrics())
  const bB = await mkBatch(season1!.id, products['ca-chua-bien'], 'LO-2026-0002', iso(-2), iso(20), 300)
  await addTest(bB, 'PASS', defaultMetrics())
  const bFail = await mkBatch(season1!.id, products['ca-chua-bien'], 'LO-2026-0003', iso(-5), iso(15), 120,
    { quality: 'FAIL', publication: 'DRAFT', safety: 'HOLD' })
  await addTest(bFail, 'FAIL', defaultMetrics(true))
  const bExpired = await mkBatch(season1!.id, products['ca-chua-bien'], 'LO-2026-0004', iso(-40), iso(-3), 80,
    { publication: 'PUBLISHED', safety: 'NORMAL' })
  await addTest(bExpired, 'PASS', defaultMetrics())

  const bXoai = await mkBatch(season2!.id, products['xoai-cat-hoa-loc'], 'LO-2026-0005', iso(-18), iso(12), 400)
  await addTest(bXoai, 'PASS', defaultMetrics())

  // Single-season products: the catalog needs enough shelf density to look real, so each of
  // these gets a season, a short log trail, one published batch and one lab test.
  const HY_PRODUCTS: Record<string, true> = Object.fromEntries(
    ['cam-sanh', 'nhan-long-hung-yen', 'chuoi-gia-nam', 'dua-hau-kim-long',
      'du-du-ruot-do', 'bi-do-hokkai', 'xa-lach-romaine', 'gao-nep-cai-hoa-vang'].map((s) => [s, true]),
  )
  const otherBatches: Record<string, string> = {}
  for (const slug of ['rau-muong', 'buoi-da-xanh', 'gao-st25', 'mat-ong-rung', ...Object.keys(HY_PRODUCTS)]) {
    const def = productDefs.find((p) => p.slug === slug)!
    const n = Object.keys(otherBatches).length
    const [s] = await q<{ id: string }>(
      `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
       VALUES ($1,$2,$3,'',$4,$5,$6,'HARVESTED') RETURNING id`,
      [SLUG_FARM[slug] ?? (HY_PRODUCTS[slug] ? farm3!.id : farm1!.id), products[slug],
       `SS-2026-${String(3 + n).padStart(4, '0')}`, 1, iso(-90), iso(-10)],
    )
    await q(
      `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, note) VALUES
         ($1,'SOWING',$2,'Tổ kỹ thuật','Hạt/cây giống','Xuống giống theo lịch vụ'),
         ($1,'FERTILIZING',$3,'Tổ kỹ thuật','Phân hữu cơ vi sinh','Bón thúc'),
         ($1,'HARVEST',$4,'Tổ thu hoạch','Thu hoạch tay','Chọn lô đạt tiêu chuẩn bán')`,
      [s!.id, iso(-88), iso(-60), iso(-11)],
    )
    const bid = await mkBatch(
      s!.id, products[slug], `LO-2026-${String(6 + n).padStart(4, '0')}`,
      iso(-10), iso(Math.min(def.shelf, 300)), def.price > 100000 ? 200 : 150,
    )
    await addTest(bid, 'PASS', defaultMetrics())
    otherBatches[slug] = bid
  }

  const [wh] = await q<{ id: string }>(
    `INSERT INTO warehouses (code, name, address) VALUES ('KHO-HY','Kho trung tâm Hưng Yên','Thành phố Hưng Yên, tỉnh Hưng Yên') RETURNING id`,
  )

  const receive = async (batchId: string, qty: number, when: string) => {
    await q(
      `INSERT INTO inventory (warehouse_id, batch_id, on_hand_qty, reserved_qty, received_at)
       VALUES ($1,$2,$3,0,$4)`,
      [wh!.id, batchId, qty, when],
    )
    await q(
      `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, actor_id)
       VALUES ($1,$2,'IN',$3,$3,'Nhập kho ban đầu','RECEIPT',$4)`,
      [wh!.id, batchId, qty, admin!.id],
    )
  }
  // FIFO ordering matters: A received before B.
  await receive(bA, 500, iso(-8))
  await receive(bB, 300, iso(-2))
  await receive(bExpired, 80, iso(-40))
  await receive(bXoai, 400, iso(-18))
  for (const bid of Object.values(otherBatches)) await receive(bid, 150, iso(-10))

  // QR for every published batch.
  const tokens: Record<string, string> = {}
  for (const [batchId, token] of [
    [bA, 'demo-ca-chua-lo-0001'],
    [bB, 'demo-ca-chua-lo-0002'],
    [bExpired, 'demo-ca-chua-het-han'],
    [bXoai, 'demo-xoai-lo-0005'],
    ...Object.entries(otherBatches).map(([slug, id]) => [id, `demo-${slug}`] as const),
  ] as const) {
    const tok = token.length >= 10 ? token : randomBytes(24).toString('base64url')
    await q(`INSERT INTO qr_codes (batch_id, token) VALUES ($1,$2)`, [batchId, tok])
    tokens[batchId] = tok
  }

  await q(
    `INSERT INTO batch_events (batch_id, type, title, description, actor_id) VALUES
       ($1,'HARVEST','Thu hoạch','Thu hoạch 500kg cà chua bi',$2),
       ($1,'LAB_PASS','Kiểm nghiệm đạt','Phiếu kiểm nghiệm Trung tâm Kỹ thuật 2 đạt',$2),
       ($1,'PUBLISHED','Công khai hồ sơ lô','Đủ điều kiện công khai',$2)`,
    [bA, admin!.id],
  )

  await q(`INSERT INTO promotions (code, name, type, value, start_at, end_at, usage_limit, min_subtotal_vnd) VALUES
    ('RAUMAU2026','Giảm 10% đơn rau củ','PERCENT',10,now()-interval '5 days',now()+interval '25 days',100,100000),
    ('FREESHIP50','Giảm 50.000đ','AMOUNT',50000,now()-interval '2 days',now()+interval '30 days',NULL,300000)`)

  // P2: near-expiry discount on batch A (expires in 8 days).
  await q(
    `INSERT INTO batch_promotions (batch_id, discount_percent, starts_at, ends_at) VALUES ($1,20,now()-interval '1 day',now()+interval '9 days')`,
    [bA],
  )

  await q(`INSERT INTO settings (key, value) VALUES ('allocation_strategy','FIFO') ON CONFLICT (key) DO UPDATE SET value=excluded.value`)

  // ---- Orders ----
  const addr1 = (await q<{ id: string; recipient_name: string; phone: string; province: string; district: string; ward: string; street_detail: string }>(
    `SELECT id, recipient_name, phone, province, district, ward, street_detail FROM addresses WHERE user_id=$1`, [c1!.id],
  ))[0]!
  const addr2 = (await q<typeof addr1>(`SELECT id, recipient_name, phone, province, district, ward, street_detail FROM addresses WHERE user_id=$1`, [c2!.id]))[0]!

  const snapshot = (a: typeof addr1) => JSON.stringify({
    id: a.id, recipient_name: a.recipient_name, phone: a.phone, province: a.province,
    district: a.district, ward: a.ward, street_detail: a.street_detail,
  })

  type Line = { productSlug: string; batchId: string; qty: number; unitPrice: number; discount: number }

  const createOrder = async (
    customerId: string, addr: typeof addr1, code: string, lines: Line[],
    opts: { status: string; paymentStatus: string; paid?: boolean; shipped?: boolean; deliveryDone?: boolean },
  ) => {
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
    const discount = lines.reduce((s, l) => s + l.discount, 0)
    const ship = subtotal - discount >= 500000 ? 0 : 20000
    const total = subtotal - discount + ship
    const [order] = await q<{ id: string }>(
      `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                           subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at)
       VALUES ($1,$2,$3,'COD',$4,$5,$6,$7,$8,$9,now()-interval '3 days') RETURNING id`,
      [code, customerId, opts.status, opts.paymentStatus, snapshot(addr), subtotal, discount, ship, total],
    )
    for (const l of lines) {
      const p = productDefs.find((d) => d.slug === l.productSlug)!
      const [line] = await q<{ id: string }>(
        `INSERT INTO order_lines (order_id, product_id, product_name, sku, unit, unit_price_vnd, quantity, total_vnd)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [order!.id, products[l.productSlug], p.name, p.sku, p.unit, l.unitPrice, l.qty, l.unitPrice * l.qty],
      )
      await q(
        `INSERT INTO order_line_allocations (order_line_id, warehouse_id, batch_id, reserved_qty, shipped_qty, unit_price_vnd, discount_vnd, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')`,
        [line!.id, wh!.id, l.batchId, l.qty, opts.shipped ? l.qty : 0, l.unitPrice, l.discount],
      )
      // Inventory reflects either a live reservation or an already-shipped deduction.
      if (opts.shipped) {
        await q(`UPDATE inventory SET on_hand_qty = on_hand_qty - $3 WHERE warehouse_id=$1 AND batch_id=$2`, [wh!.id, l.batchId, l.qty])
        await q(
          `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, source_id, actor_id)
           SELECT $1,$2,'OUT',$3,on_hand_qty,$4,'ORDER',$5,$6 FROM inventory WHERE warehouse_id=$1 AND batch_id=$2`,
          [wh!.id, l.batchId, l.qty, `Xuất cho đơn ${code}`, order!.id, admin!.id],
        )
      } else if (!['CANCELLED', 'DELIVERY_FAILED'].includes(opts.status)) {
        await q(`UPDATE inventory SET reserved_qty = reserved_qty + $3 WHERE warehouse_id=$1 AND batch_id=$2`, [wh!.id, l.batchId, l.qty])
      }
    }
    if (opts.paid) {
      await q(
        `INSERT INTO payments (order_id, method, amount_vnd, status, paid_at, reference, recorded_by)
         VALUES ($1,'COD',$2,'PAID',now()-interval '2 days','PT-2026-0001',$3)`,
        [order!.id, total, admin!.id],
      )
    }
    return { id: order!.id, total }
  }

  const delivered = await createOrder(
    c1!.id, addr1, 'AGM-2026-0001',
    [{ productSlug: 'ca-chua-bien', batchId: bA, qty: 2, unitPrice: 42000, discount: 0 }],
    { status: 'DELIVERED', paymentStatus: 'PAID', paid: true, shipped: true, deliveryDone: true },
  )
  await q(`INSERT INTO shipments (order_id, carrier, tracking_code, status, shipped_at, delivered_at)
           VALUES ($1,'GHN','GHN-772831','DELIVERED',now()-interval '3 days',now()-interval '1 day')`, [delivered.id])
  const deliveredLine = (await q<{ id: string }>(`SELECT id FROM order_lines WHERE order_id=$1`, [delivered.id]))[0]!
  await q(
    `INSERT INTO reviews (customer_id, order_line_id, product_id, rating, comment)
     VALUES ($1,$2,$3,5,'Cà chua rất tươi, ngọt và đóng gói cẩn thận. Tem QR tra cứu ra đúng vườn.')`,
    [c1!.id, deliveredLine.id, products['ca-chua-bien']],
  )

  // In-transit order that will be hit by the recall demo.
  const shipping = await createOrder(
    c2!.id, addr2, 'AGM-2026-0002',
    [{ productSlug: 'ca-chua-bien', batchId: bB, qty: 3, unitPrice: 42000, discount: 0 }],
    { status: 'SHIPPING', paymentStatus: 'UNPAID', shipped: true },
  )
  await q(`INSERT INTO shipments (order_id, carrier, tracking_code, status, shipped_at)
           VALUES ($1,'GHN','GHN-773902','SHIPPING',now()-interval '1 day')`, [shipping.id])

  await createOrder(
    c2!.id, addr2, 'AGM-2026-0003',
    [{ productSlug: 'xoai-cat-hoa-loc', batchId: bXoai, qty: 1, unitPrice: 89000, discount: 0 }],
    { status: 'PENDING', paymentStatus: 'UNPAID' },
  )

  await q(
    `INSERT INTO complaints (code, customer_id, order_id, order_line_id, batch_id, type, description, status)
     VALUES ('KN-2026-0001',$1,$2,$3,$4,'QUALITY','Một số quả bị dập khi nhận hàng.','PROCESSING')`,
    [c1!.id, delivered.id, deliveredLine.id, bA],

  )

  // Seeds write fixed codes; without this the next Admin-created season/batch would collide.
  await q(
    `INSERT INTO code_sequences (kind, year, last_value)
     SELECT k.kind, k.year, MAX(k.val)
       FROM (
             SELECT 'season' AS kind, substring(code FROM 4 FOR 4)::int AS year, substring(code FROM 9)::int AS val
               FROM crop_seasons WHERE code ~ '^SS-[0-9]{4}-[0-9]+$'
             UNION ALL
             SELECT 'batch', substring(code FROM 4 FOR 4)::int, substring(code FROM 9)::int
               FROM batches WHERE code ~ '^LO-[0-9]{4}-[0-9]+$'
            ) k
      GROUP BY k.kind, k.year
     ON CONFLICT (kind, year) DO UPDATE SET last_value = GREATEST(code_sequences.last_value, EXCLUDED.last_value)`,
  )

  console.log('seed done')
  console.log(`  admin: ${adminEmail} / ${adminPass}`)
  console.log(`  customer: khach1@example.com / ${custPass}`)
  console.log(`  trace tokens: ${Object.values(tokens).join(', ')}`)
}

export { main as seedDatabase }

if (process.argv[1]?.endsWith('seed.ts')) {
  await main()
  await pool.end()
}
