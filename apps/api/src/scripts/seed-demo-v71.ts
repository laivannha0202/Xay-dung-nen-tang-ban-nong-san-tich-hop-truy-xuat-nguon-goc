/**
 * Adds the V7.1 demo departments and catalogue on a database that must not be wiped
 * (dev/staging with real orders). Idempotent: every row is keyed by its natural code
 * (category slug / sku / batch code), so re-running changes nothing.
 *
 *   pnpm --filter @agrimarket/api exec tsx src/scripts/seed-demo-v71.ts
 *
 * Demo ratings are labelled as demo: reviews point at DEMO orders (products flagged
 * `is_demo`), never at a lab certificate or a traceability claim.
 */
import { one, pool, q } from '../db.js'

const day = 86_400_000
const iso = (offset: number) => new Date(Date.now() + offset * day).toISOString().slice(0, 10)

const CATEGORIES = [
  { slug: 'rau-cu', name: 'Rau củ', desc: 'Rau ăn lá, củ quả thu hoạch trong ngày', order: 1 },
  { slug: 'trai-cay', name: 'Trái cây', desc: 'Trái cây trong nước và nhập khẩu theo mùa', order: 2 },
  { slug: 'nam', name: 'Nấm', desc: 'Nấm tươi trồng trong nhà lạnh', order: 3 },
  { slug: 'gao-ngu-coc', name: 'Gạo', desc: 'Gạo, nếp đóng gói theo lô', order: 4 },
  { slug: 'ngu-coc', name: 'Ngũ cốc', desc: 'Yến mạch, ngũ cốc nguyên hạt', order: 5 },
  { slug: 'cac-loai-dau', name: 'Các loại đậu', desc: 'Đậu, hạt khô đóng gói', order: 6 },
  { slug: 'dac-san', name: 'Đặc sản Hưng Yên', desc: 'Mật ong, tương bần, bánh đậu xanh', order: 7 },
]

interface Demo {
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
  hy?: boolean
}

const PRODUCTS: Demo[] = [
  // ---- Trái cây ----
  { slug: 'tao-do', sku: 'SP-TAODO', name: 'Táo đỏ New Zealand', cat: 'trai-cay', price: 78000, unit: 'kg', shelf: 21,
    desc: 'Táo đỏ nhập khẩu, trái đều, giòn và ngọt thanh — ăn trực tiếp hoặc làm salad.', storage: 'Ngăn mát 4–8°C.', origin: 'New Zealand.' },
  { slug: 'le-han-quoc', sku: 'SP-LEHQ', name: 'Lê Hàn Quốc', cat: 'trai-cay', price: 115000, unit: 'kg', shelf: 25,
    desc: 'Lê Hàn Quốc vỏ vàng, thịt giòn nhiều nước, vị ngọt mát — ăn tươi hoặc hầm.', storage: 'Nơi mát 0–5°C.', origin: 'Hàn Quốc.' },
  { slug: 'kiwi-vang', sku: 'SP-KIWIVANG', name: 'Kiwi vàng', cat: 'trai-cay', price: 128000, unit: 'kg', shelf: 14,
    desc: 'Kiwi vàng ruột vàng, vị ngọt dịu ít chua, nhiều vitamin C.', storage: 'Ngăn mát, dùng trong 2 tuần.', origin: 'New Zealand.' },
  { slug: 'mit-thai', sku: 'SP-MIT', name: 'Mít Thái múi vàng', cat: 'trai-cay', price: 42000, unit: 'kg', shelf: 5,
    desc: 'Mít Thái múi vàng dày cơm, ngọt đậm, ít xơ — bán cả múi đã tách.', storage: 'Ngăn mát, dùng trong 2 ngày sau khi tách.', origin: 'Hưng Yên.' },
  { slug: 'na-dai-loan', sku: 'SP-NA', name: 'Na Đài Loan', cat: 'trai-cay', price: 68000, unit: 'kg', shelf: 6,
    desc: 'Na Đài Loan quả mắt to, thịt trắng dẻo, ngọt và thơm; chín đều sau 1–2 ngày để nơi mát.', storage: 'Nhiệt độ phòng đến khi mềm, sau đó ngăn mát.', origin: 'Hưng Yên.' },
  { slug: 'dua-xiem', sku: 'SP-DUAXIEM', name: 'Dừa xiêm xanh', cat: 'trai-cay', price: 25000, unit: 'quả', shelf: 12,
    desc: 'Dừa xiêm nước ngọt tự nhiên, gọt sẵn phần cuống để uống ngay.', storage: 'Nơi thoáng mát, dùng trong 3 ngày.', origin: 'Bến Tre.' },

  // ---- Rau củ ----
  { slug: 'ot-chuong', sku: 'SP-OTCHUONG', name: 'Ớt chuông', cat: 'rau-cu', price: 45000, unit: 'kg', shelf: 10,
    desc: 'Ớt chuông đỏ vàng, giòn, vị ngọt dịu — xào hoặc ăn sống trong salad.', storage: 'Ngăn mát tủ lạnh.', origin: 'Lâm Đồng.' },
  { slug: 'ca-tim', sku: 'SP-CATIM', name: 'Cà tím', cat: 'rau-cu', price: 22000, unit: 'kg', shelf: 8,
    desc: 'Cà tím quả chắc, ruột trắng ít hạt — nướng, kho hay xào đều hợp.', storage: 'Nơi mát, dùng trong 4–5 ngày.', origin: 'Hưng Yên.' },
  { slug: 'sup-lo', sku: 'SP-SUPLO', name: 'Súp lơ', cat: 'rau-cu', price: 38000, unit: 'kg', shelf: 8,
    desc: 'Súp lơ hoa trắng đều, bông chắc — luộc, xào hoặc làm món nướng.', storage: 'Ngăn mát, dùng trong 5 ngày.', origin: 'Lâm Đồng.' },
  { slug: 'bap-cai', sku: 'SP-BAPCAI', name: 'Bắp cải', cat: 'rau-cu', price: 19000, unit: 'kg', shelf: 14,
    desc: 'Bắp cải cuộn chắc, lá giòn — luộc, xào hay muối chua.', storage: 'Nơi mát, tránh ánh nắng.', origin: 'Hải Dương.' },
  { slug: 'khoai-tay', sku: 'SP-KHOAIY', name: 'Khoai tây', cat: 'rau-cu', price: 26000, unit: 'kg', shelf: 30,
    desc: 'Khoai tây củ đều, ruột vàng — chiên, hầm hoặc nghiền.', storage: 'Nơi khô mát, không để cạnh hành tây.', origin: 'Đà Lạt.' },
  { slug: 'khoai-lang', sku: 'SP-KHOAIL', name: 'Khoai lang mật', cat: 'rau-cu', price: 24000, unit: 'kg', shelf: 21,
    desc: 'Khoai lang mật ruột vàng, luộc hay nướng đều dẻo ngọt tự nhiên.', storage: 'Nơi khô thoáng.', origin: 'Hưng Yên.' },
  { slug: 'hanh-la', sku: 'SP-HANHLA', name: 'Hành lá', cat: 'rau-cu', price: 15000, unit: 'bó', shelf: 5,
    desc: 'Hành lá bó chắc, thân trắng dài — phi thơm hay rắc canh.', storage: 'Ngăn mát, bọc giấy.', origin: 'Hưng Yên.' },
  { slug: 'mong-toi', sku: 'SP-MONGTOI', name: 'Rau muống', cat: 'rau-cu', price: 16000, unit: 'bó', shelf: 4,
    desc: 'Rau muống non, ngọn mập — xào tỏi hoặc luộc chấm kho quẹt.', storage: 'Ngăn mát, dùng trong 2 ngày.', origin: 'Hưng Yên.' },
  { slug: 'bi-xanh', sku: 'SP-BIXANH', name: 'Bí xanh', cat: 'rau-cu', price: 17000, unit: 'kg', shelf: 20,
    desc: 'Bí xanh non, ruột trắng mềm — nấu canh tôm hoặc xào.', storage: 'Nơi mát, tránh va đập.', origin: 'Hưng Yên.' },

  // ---- Nấm ----
  { slug: 'nam-kim-cham', sku: 'SP-NAMKIM', name: 'Nấm kim châm', cat: 'nam', price: 18000, unit: 'gói', shelf: 14,
    desc: 'Nấm kim châm trắng, sợi dài — lẩu, nướng giấy bạc hoặc xào bơ.', storage: 'Ngăn mát 2–4°C.', origin: 'Trang trại nấm Hưng Yên.' },
  { slug: 'nam-huong', sku: 'SP-NAMHUONG', name: 'Nấm hương', cat: 'nam', price: 52000, unit: 'kg', shelf: 10,
    desc: 'Nấm hương tươi mũ dày, thơm đậm — xào, kho hay nấu nước dùng.', storage: 'Ngăn mát, dùng trong 5 ngày.', origin: 'Trang trại nấm Hưng Yên.' },
  { slug: 'nam-dui-ga', sku: 'SP-NAMGIA', name: 'Nấm đùi gà', cat: 'nam', price: 48000, unit: 'kg', shelf: 12,
    desc: 'Nấm đùi gà thân trắng chắc, thịt giòn — nướng mỡ hành hoặc áp chảo.', storage: 'Ngăn mát, dùng trong 6 ngày.', origin: 'Trang trại nấm Hưng Yên.' },

  // ---- Gạo ----
  { slug: 'gao-lut', sku: 'SP-GAOLUT', name: 'Gạo lứt huyết rồng', cat: 'gao-ngu-coc', price: 72000, unit: 'kg', shelf: 180,
    desc: 'Gạo lứt huyết rồng còn cám, cơm dẻo chắc, giàu chất xơ — nấu trước khi vo kỹ.', storage: 'Nơi khô ráo, đậy kín.', origin: 'Hưng Yên.' },
  { slug: 'gao-jasmine', sku: 'SP-GAOJA', name: 'Gạo thơm Jasmine', cat: 'gao-ngu-coc', price: 58000, unit: 'kg', shelf: 180,
    desc: 'Gạo thơm Jasmine hạt dài, cơm mềm thơm nhẹ — dùng hằng ngày.', storage: 'Nơi khô ráo, tránh ẩm.', origin: 'An Giang.' },

  // ---- Ngũ cốc ----
  { slug: 'yen-mach', sku: 'SP-YENMACH', name: 'Yến mạch cán dẹt', cat: 'ngu-coc', price: 68000, unit: 'gói', shelf: 240,
    desc: 'Yến mạch cán dẹt nguyên hạt, nấu cháo hoặc ngâm sữa qua đêm.', storage: 'Nơi khô mát, đậy kín sau khi mở.', origin: 'Nhập khẩu.' },
  { slug: 'hat-dieu', sku: 'SP-HATDIEU', name: 'Hạt điều rang bơ', cat: 'ngu-coc', price: 210000, unit: 'hộp', shelf: 120,
    desc: 'Hạt điều rang bơ, hạt to đều — dùng làm quà hoặc ăn vặt.', storage: 'Hộp kín, tránh nắng.', origin: 'Bình Phước.' },

  // ---- Các loại đậu ----
  { slug: 'dau-xanh', sku: 'SP-DAUXANH', name: 'Đậu xanh nguyên vỏ', cat: 'cac-loai-dau', price: 42000, unit: 'kg', shelf: 240,
    desc: 'Đậu xanh hạt mẩy, vỏ xanh đều — nấu chè, làm giá hoặc nhân bánh.', storage: 'Nơi khô ráo, đậy kín.', origin: 'Hưng Yên.' },
  { slug: 'dau-den', sku: 'SP-DAUDEN', name: 'Đậu đen xanh lòng', cat: 'cac-loai-dau', price: 48000, unit: 'kg', shelf: 240,
    desc: 'Đậu đen xanh lòng, hạt nhỏ — nấu chè hoặc nấu nước uống.', storage: 'Nơi khô ráo.', origin: 'Hưng Yên.' },
  { slug: 'dau-do', sku: 'SP-DAUDO', name: 'Đậu đỏ', cat: 'cac-loai-dau', price: 56000, unit: 'kg', shelf: 240,
    desc: 'Đậu đỏ hạt lớn, chắc — nấu chè, hầm xương hoặc trộn mứt.', storage: 'Nơi khô ráo, đậy kín.', origin: 'Hưng Yên.' },
  { slug: 'dau-tuong', sku: 'SP-DAUTUONG', name: 'Đậu nành', cat: 'cac-loai-dau', price: 38000, unit: 'kg', shelf: 240,
    desc: 'Đậu nành hạt tròn, protein cao — làm sữa đậu hoặc nấu tương.', storage: 'Nơi khô ráo.', origin: 'Hưng Yên.' },
  { slug: 'dau-phong', sku: 'SP-DAUPHONG', name: 'Đậu phộng nhân đỏ', cat: 'cac-loai-dau', price: 65000, unit: 'kg', shelf: 180,
    desc: 'Đậu phộng nhân đỏ, hạt chắc — rang hoặc làm bơ đậu phộng.', storage: 'Nơi khô mát, hộp kín.', origin: 'Hưng Yên.' },

  // ---- Đặc sản Hưng Yên ----
  { slug: 'mat-ong-hoa-nhan', sku: 'SP-MATONGNHAN', name: 'Mật ong hoa nhãn', cat: 'dac-san', price: 265000, unit: 'lít', shelf: 365,
    desc: 'Mật ong hoa nhãn Hưng Yên, màu vàng sậm, thơm mùi hoa — dùng pha nước hoặc chế biến.', storage: 'Nơi thoáng, tránh nắng trực tiếp.', origin: 'Hưng Yên.', hy: true },
  { slug: 'tuong-ban', sku: 'SP-TUONGBAN', name: 'Tương bần', cat: 'dac-san', price: 85000, unit: 'lít', shelf: 180,
    desc: 'Tương bần ủ đậu nành và gạo nếp, vị đậm mặn ngọt — chấm rau hay kho cá.', storage: 'Nơi mát, đậy kín sau khi mở.', origin: 'Bần Yên Nhân, Hưng Yên.', hy: true },
  { slug: 'banh-dau-xanh', sku: 'SP-BANHDAUX', name: 'Bánh đậu xanh', cat: 'dac-san', price: 95000, unit: 'hộp', shelf: 45,
    desc: 'Bánh đậu xanh Hưng Yên, bột mịn, ngọt nhẹ — hộp 500g dùng làm quà.', storage: 'Nơi khô mát, tránh ẩm.', origin: 'Hưng Yên.', hy: true },
]

/** Demo ratings: a handful of DEMO orders get a DEMO review, so the star average is real data. */
const REVIEWS: Record<string, { rating: number; comment: string }> = {
  'tao-do': { rating: 5, comment: 'Táo giòn, ngọt vừa, đóng hộp cẩn thận.' },
  'nho-mau-don': { rating: 5, comment: 'Nho quả to, ngọt, không dập. Mua lại lần hai.' },
  'ot-chuong': { rating: 4, comment: 'Ớt tươi, màu đẹp, giao nhanh.' },
  'nam-kim-cham': { rating: 5, comment: 'Nấm trắng tươi, nấu lẩu rất ngọt.' },
  'mat-ong-hoa-nhan': { rating: 5, comment: 'Mật sánh, thơm mùi hoa nhãn, đóng chai kỹ.' },
  'tuong-ban': { rating: 4, comment: 'Đúng vị tương bần, mặn vừa.' },
  'dau-xanh': { rating: 4, comment: 'Đậu mẩy, nấu chè nhanh mềm.' },
  'yen-mach': { rating: 5, comment: 'Yến mạch thơm, ngâm qua đêm rất tiện.' },
  'mit-thai': { rating: 4, comment: 'Mít ngọt, múi dày, giao đúng hẹn.' },
  'le-han-quoc': { rating: 5, comment: 'Lê giòn mọng nước, quả đều.' },
}

async function main() {
  const admin = await one<{ id: string }>(`SELECT id FROM users WHERE role='ADMIN' ORDER BY created_at LIMIT 1`)
  if (!admin) throw new Error('No ADMIN user: run the normal seed first.')
  const warehouse = await one<{ id: string }>(`SELECT id FROM warehouses ORDER BY code LIMIT 1`)
  if (!warehouse) throw new Error('No warehouse: run the normal seed first.')
  const customers = await q<{ id: string }>(
    `SELECT id FROM users WHERE role='CUSTOMER' ORDER BY created_at LIMIT 2`,
  )
  if (!customers.length) throw new Error('No CUSTOMER users: run the normal seed first.')

  // Departments: `seed.ts` owns four of them, the two new groups are added here.
  for (const c of CATEGORIES) {
    await q(
      `INSERT INTO categories (slug, name, description, sort_order) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, sort_order=EXCLUDED.sort_order`,
      [c.slug, c.name, c.desc, c.order],
    )
  }
  // Department tiles: a photo per slug, so every tile on the home page has artwork.
  for (const c of CATEGORIES) {
    await q(`UPDATE categories SET image_url=$2 WHERE slug=$1`, [c.slug, `/images/categories/${c.slug}.jpg`])
  }

  let supplier = await one<{ id: string }>(`SELECT id FROM suppliers WHERE code='NCC-HY-001'`)
  if (!supplier) {
    supplier = await one<{ id: string }>(
      `INSERT INTO suppliers (code, name, business_type, contact_name, contact_phone, contact_email)
       VALUES ('NCC-HY-001','HTX Rau an toàn Hưng Yên','Hợp tác xã','Đỗ Văn Hợp','0912555777','hop@htx-hungyen.vn')
       ON CONFLICT (code) DO NOTHING RETURNING id`,
    )
    supplier = supplier ?? (await one<{ id: string }>(`SELECT id FROM suppliers WHERE code='NCC-HY-001'`))!
  }
  let farm = await one<{ id: string }>(`SELECT id FROM farms WHERE name='Vườn cam Khoái Châu'`)
  if (!farm) {
    farm = await one<{ id: string }>(
      `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone, is_demo)
       VALUES ($1,'Vườn cam Khoái Châu','Hưng Yên','Khoái Châu','Tân Dân','Đê sông Hồng, thôn Tân Dân',20.8333,106.0333,6.2,'Cam sành, nhãn lồng, rau ăn lá','Đỗ Văn Hợp','0912555777',true)
       RETURNING id`,
      [supplier.id],
    )
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
      added++
    }
    const productId = product!.id
    await q(`UPDATE products SET is_demo=true, category_id=$2 WHERE id=$1`, [productId, category.id])
    await q(
      `INSERT INTO product_images (product_id, url, alt, sort_order)
       SELECT $1,$2,$3,0 WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=$1 AND sort_order=0)`,
      [productId, `/images/products/${p.slug}.jpg`, p.name],
    )

    const code = p.sku.replace('SP-', '')
    const seasonCode = `SS-DEMO-${code}`
    let season = await one<{ id: string }>(`SELECT id FROM crop_seasons WHERE code=$1`, [seasonCode])
    if (!season) {
      season = await one<{ id: string }>(
        `INSERT INTO crop_seasons (farm_id, product_id, code, variety, area_ha, sown_at, expected_harvest_at, status)
         VALUES ($1,$2,$3,$6,1,$4,$5,'HARVESTED') RETURNING id`,
        [farm!.id, productId, seasonCode, iso(-88), iso(-11), p.name],
      )
      await q(
        `INSERT INTO cultivation_logs (season_id, activity, activity_at, performer, materials, note) VALUES
           ($1,'SOWING',$2,'Tổ kỹ thuật','Hạt/cây giống','Xuống giống theo lịch vụ'),
           ($1,'FERTILIZING',$3,'Tổ kỹ thuật','Phân hữu cơ vi sinh','Bón thúc'),
           ($1,'HARVEST',$4,'Tổ thu hoạch','Thu hoạch tay','Chọn lô đạt tiêu chuẩn bán')`,
        [season!.id, iso(-86), iso(-58), iso(-11)],
      )
    }

    const batchCode = `LO-DEMO-${code}`
    let batch = await one<{ id: string }>(`SELECT id FROM batches WHERE code=$1`, [batchCode])
    if (!batch) {
      batch = await one<{ id: string }>(
        `INSERT INTO batches (season_id, product_id, code, harvest_date, pack_date, expiry_date, harvested_qty,
                              storage_condition, quality_status, publication_status, safety_status, published_at, published_by, is_demo)
         VALUES ($1,$2,$3,$4,$4,$5,$6,'Bảo quản mát 8–12°C','PASS','PUBLISHED','NORMAL',now(),$7,true) RETURNING id`,
        [season!.id, productId, batchCode, iso(-10), iso(Math.min(p.shelf, 300)), 120, admin.id],
      )
      await q(
        `INSERT INTO qr_codes (batch_id, token) VALUES ($1,$2)`,
        [batch!.id, `demo-${p.slug}`],
      )
      await q(
        `INSERT INTO inventory (warehouse_id, batch_id, on_hand_qty, reserved_qty, received_at) VALUES ($1,$2,$3,0,$4)`,
        [warehouse.id, batch!.id, 120, iso(-10)],
      )
      await q(
        `INSERT INTO stock_movements (warehouse_id, batch_id, type, quantity, on_hand_after, reason, source_type, actor_id)
         VALUES ($1,$2,'IN',120,120,'Nhập kho ban đầu','RECEIPT',$3)`,
        [warehouse.id, batch!.id, admin.id],
      )
      await q(
        `INSERT INTO batch_events (batch_id, type, title, description, actor_id) VALUES
           ($1,'HARVEST','Thu hoạch','Thu hoạch và phân loại tại vườn',$2),
           ($1,'PUBLISHED','Công khai hồ sơ lô','Đủ điều kiện công khai',$2)`,
        [batch!.id, admin.id],
      )
    }
    // No lab certificate is fabricated here: a demo lot carries its own harvest events only.

    const review = REVIEWS[p.slug]
    if (review) {
      const existing = await one<{ id: string }>(`SELECT id FROM reviews WHERE product_id=$1 AND is_demo`, [productId])
      if (!existing) {
        const customer = customers[added % customers.length]!
        const orderCode = `AGM-DEMO-${code}`
        let order = await one<{ id: string }>(`SELECT id FROM orders WHERE code=$1`, [orderCode])
        if (!order) {
          order = await one<{ id: string }>(
            `INSERT INTO orders (code, customer_id, status, payment_method, payment_status, address_snapshot,
                                 subtotal_vnd, discount_vnd, ship_fee_vnd, total_vnd, placed_at, is_demo)
             VALUES ($1,$2,'COMPLETED','COD','PAID',$3,$4,0,0,$4,now()-interval '6 days',true) RETURNING id`,
            [orderCode, customer.id, JSON.stringify({ province: 'Tỉnh Hưng Yên', ward: 'Phường Phố Hiến', street: '12 Lý Thường Kiệt' }), p.price],
          )
        }
        const line = await one<{ id: string }>(
          `INSERT INTO order_lines (order_id, product_id, product_name, sku, unit, unit_price_vnd, quantity, total_vnd)
           VALUES ($1,$2,$3,$4,$5,$6,1,$6) RETURNING id`,
          [order!.id, productId, p.name, p.sku, p.unit, p.price],
        )
        await q(
          `INSERT INTO reviews (customer_id, order_line_id, product_id, rating, comment, created_at, is_demo)
           VALUES ($1,$2,$3,$4,$5,now()-interval '4 days',true)`,
          [customer.id, line!.id, productId, review.rating, review.comment],
        )
      }
    }
  }

  console.log(`demo v7.1: ${added} sản phẩm mới, ${PRODUCTS.length} sản phẩm demo, ${Object.keys(REVIEWS).length} đánh giá demo`)
}

if (process.argv[1]?.endsWith('seed-demo-v71.ts')) {
  await main()
  await pool.end()
}
