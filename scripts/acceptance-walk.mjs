/**
 * End-to-end acceptance walk over the real API: supplier → farm → season → cultivation log →
 * harvest gate → batch → lab test → publish → QR → trace → stock receipt → sale → ship →
 * traceability of the delivered lot → recall blocking.
 *
 *   node scripts/acceptance-walk.mjs          (API :4000 + PostgreSQL must already run)
 *
 * Writes nothing outside the local acceptance database; every row it creates is prefixed
 * `ACC-` so demo data stays separable from hand-made data. Exit code 1 on any failed step.
 */
const API = process.env.API_URL ?? 'http://127.0.0.1:4000/api/v1'
const WARD = process.env.WARD_CODE ?? '12499'

let token = null
let adminToken = null
const steps = []
const ok = (name, note = '') => steps.push({ name, pass: true, note })
const bad = (name, note) => steps.push({ name, pass: false, note })

function assert(cond, name, note = '') {
  if (cond) ok(name, note)
  else bad(name, typeof note === 'string' ? note : String(JSON.stringify(note)).slice(0, 300))
  return cond
}

async function call(path, { method = 'GET', body, auth = true, headers = {}, raw = false } = {}) {
  const h = { ...headers }
  const bearer = auth === 'admin' ? adminToken : auth ? token : null
  if (bearer) h.authorization = `Bearer ${bearer}`
  if (auth) h['x-agri-csrf'] = '1'
  if (body !== undefined) h['content-type'] = 'application/json'
  const r = await fetch(API + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
  if (raw) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get('content-type') }
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON body */ }
  return { status: r.status, body: json, text }
}

const listOf = (b) => (Array.isArray(b) ? b : (b?.data ?? b?.items ?? []))
const day = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

// ---- logins -----------------------------------------------------------------
{
  const a = await call('/auth/login', { method: 'POST', auth: false, body: { email: 'admin@agrimarket.vn', password: 'Admin@123456' } })
  const c = await call('/auth/login', { method: 'POST', auth: false, body: { email: 'khach1@example.com', password: 'Khach@123456' } })
  if (!assert(a.status === 200 && c.status === 200, 'login admin + customer', `${a.status}/${c.status}`)) {
    console.log('cannot continue without sessions')
    process.exit(1)
  }
  adminToken = a.body.token
  token = c.body.token
}

const stamp = Date.now().toString(36).slice(-6).toUpperCase()

// ---- provenance chain -------------------------------------------------------
const supplier = await call('/admin/suppliers', { method: 'POST', auth: 'admin', body: {
  code: `ACC-${stamp}`, name: `HTX nghiệm thu ${stamp}`, business_type: 'Hợp tác xã',
  contact_name: 'Nguyễn Nghiệm Thu', contact_phone: '0901234567', contact_email: 'acc@example.com' } })
assert(supplier.status === 201, 'supplier created', supplier.body?.error?.message ?? '')
const supplierId = supplier.body?.id

const farm = await call('/admin/farms', { method: 'POST', auth: 'admin', body: {
  supplier_id: supplierId, name: `Nông trại nghiệm thu ${stamp}`, province: 'Tỉnh Hưng Yên',
  district: 'Thành phố Hưng Yên', commune: 'Xã A Sào', address_detail: 'Thôn nghiệm thu',
  latitude: 20.65, longitude: 106.05, area_ha: 2.5, crops: 'Rau ăn lá', manager_name: 'Trần Quản Lý', manager_phone: '0907654321' } })
assert(farm.status === 201, 'farm created', farm.body?.error?.message ?? '')
const farmId = farm.body?.id

const products = await call('/products?q=hanh&limit=5', { auth: false })
const product = products.body?.data?.[0]
assert(!!product, 'product picked from catalogue', product?.name ?? '')

const season = await call('/admin/seasons', { method: 'POST', auth: 'admin', body: {
  farm_id: farmId, product_id: product?.id, variety: 'Giống nghiệm thu', area_ha: 1.2,
  sown_at: day(-60), expected_harvest_at: day(-1) } })
assert(season.status === 201, 'season created', season.body?.error?.message ?? '')
const seasonId = season.body?.id

const log = await call(`/admin/seasons/${seasonId}/logs`, { method: 'POST', auth: 'admin', body: {
  activity: 'PESTICIDE', activity_at: day(-30), performer: 'Trần Quản Lý', materials: 'Thuốc BVTV A',
  pesticide_name: 'Thuốc BVTV A', isolation_days: 14, note: 'Phun nghiệm thu' } })
assert(log.status === 201, 'cultivation log (pesticide + isolation 14d)', log.body?.error?.message ?? '')

// ADM-04-03: harvesting inside the isolation window must be refused.
const early = await call('/admin/batches', { method: 'POST', auth: 'admin', body: {
  season_id: seasonId, harvest_date: day(-20), pack_date: day(-20), expiry_date: day(10),
  harvested_qty: 20, storage_condition: 'Mát 8-12°C', notes: 'ACC' } })
assert(early.status === 422 && /cách ly/.test(early.body?.error?.message ?? ''), 'harvest inside isolation window rejected', `${early.status} ${early.body?.error?.message ?? ''}`)

const batch = await call('/admin/batches', { method: 'POST', auth: 'admin', body: {
  season_id: seasonId, harvest_date: day(-1), pack_date: day(-1), expiry_date: day(20),
  harvested_qty: 20, storage_condition: 'Mát 8-12°C', notes: `ACC-${stamp}` } })
assert(batch.status === 201, 'batch created', batch.body?.error?.message ?? '')
const batchId = batch.body?.id
const batchDetail = await call(`/admin/batches/${batchId}`, { auth: 'admin' })
const batchCode = batchDetail.body?.code ?? `ACC-${stamp}`

// ADM-04-06: publishing without an effective PASS test must fail.
const publishTooEarly = await call(`/admin/batches/${batchId}/publish`, { method: 'POST', auth: 'admin', body: { reason: 'thử' } })
assert(publishTooEarly.status === 422, 'publish blocked without lab test', `${publishTooEarly.status}`)

const lab = await call(`/admin/batches/${batchId}/lab-tests`, { method: 'POST', auth: 'admin', body: {
  laboratory: `Trung tâm kiểm nghiệm ACC ${stamp}`, sampled_at: day(-1), resulted_at: day(-1),
  notes: 'Phiếu nghiệm thu tự động', metrics: [
    { metric: 'Dư lượng thuốc BVTV', measured_value: '0.01', unit: 'mg/kg', reference_limit: '<= 0.05', result: 'PASS' },
    { metric: 'Vi sinh vật', measured_value: '10', unit: 'CFU/g', reference_limit: '<= 100', result: 'PASS' },
  ] } })
assert(lab.status === 201, 'lab test created (PASS)', lab.body?.error?.message ?? '')

const confirm = await call(`/admin/lab-tests/${lab.body?.id}/confirm`, { method: 'POST', auth: 'admin', body: { reason: 'Kiểm nghiệm đạt, xác nhận công bố' } })
assert(confirm.status === 200, 'lab test confirmed', confirm.body?.error?.message ?? '')

const published = await call(`/admin/batches/${batchId}/publish`, { method: 'POST', auth: 'admin', body: { reason: 'Đủ điều kiện nghiệm thu' } })
assert(published.status === 200 && !!published.body?.token, 'batch published, QR token minted', published.body?.error?.message ?? '')
const qrToken = published.body?.token

// ---- public trace page ------------------------------------------------------
const trace = await call(`/t/${qrToken}`, { auth: false })
const t = trace.body?.data ?? trace.body
assert(trace.status === 200, 'public trace reachable without login', `${trace.status}`)
assert(t?.batch?.code === batchCode || t?.batch_code === batchCode, 'trace links to the exact batch', JSON.stringify(t?.batch?.code ?? t?.batch_code))
assert(JSON.stringify(t).includes(`Nông trại nghiệm thu ${stamp}`), 'trace exposes the farm of this batch', '')
assert(JSON.stringify(t).includes('Dư lượng thuốc BVTV'), 'trace exposes lab metrics', '')
assert(!JSON.stringify(t).includes('0907654321') || !JSON.stringify(t).includes('manager_phone'), 'trace hides manager phone', '')

const scan1 = await call(`/public/trace/${qrToken}/scan`, { method: 'POST', auth: false, body: { source: 'WEB' } })
const qrList = await call('/admin/qr-codes?pageSize=200', { auth: 'admin' })
const qrRow = listOf(qrList.body).find((r) => r.token === qrToken)
assert(scan1.status === 200 && (qrRow?.scan_count ?? 0) >= 1, 'QR scan counted', `count=${qrRow?.scan_count}`)

// ---- stock receipt ----------------------------------------------------------
const warehouses = await call('/admin/warehouses', { auth: 'admin' })
const warehouseId = listOf(warehouses.body)[0]?.id
assert(!!warehouseId, 'main warehouse exists', warehouseId ?? '')

const receipt = await call('/admin/stock/receipts', { method: 'POST', auth: 'admin', body: {
  warehouse_id: warehouseId, batch_id: batchId, quantity: 10, reason: `Nhập nghiệm thu ${stamp}` } })
assert(receipt.status === 201 || receipt.status === 200, 'stock receipt accepted', `${receipt.status} ${receipt.body?.error?.message ?? ''}`)

const invAfterReceipt = async () => listOf((await call(`/admin/inventory?batch_id=${batchId}&include_zero=true`, { auth: 'admin' })).body)
const inv1 = await invAfterReceipt()
const invRow = inv1.find((r) => r.batch_id === batchId) ?? inv1[0]
assert(Number(invRow?.on_hand_qty ?? invRow?.on_hand) === 10, 'inventory on_hand = 10', JSON.stringify(invRow)?.slice(0, 200))

// ---- customer purchase ------------------------------------------------------
const oldAddresses = (await call('/me/addresses')).body ?? []
const oldIds = new Set(listOf(oldAddresses).map((a) => a.id))
const addr = await call('/me/addresses', { method: 'POST', body: {
  recipient_name: 'Khách Nghiệm Thu', phone: '0912345678', ward_code: WARD,
  street_detail: `Số 1 nghiệm thu ${stamp}`, is_default: false } })
assert(addr.status === 201, 'delivery address created', addr.body?.error?.message ?? '')
const addressId = addr.body?.id

const preview = await call('/checkout/preview', { method: 'POST', body: { address_id: addressId, items: [{ product_id: product?.id, quantity: 2 }] } })
const quote = preview.body ?? {}
assert(preview.status === 200, 'checkout preview quoted', preview.body?.error?.message ?? '')
const allocationOf = (q) => (q?.lines ?? []).flatMap((l) => l.allocations ?? []).find((a) => a.batch_id === batchId)
const allocationsOf = (q) => (q?.lines ?? []).flatMap((l) => l.allocations ?? [])
const invOfBatch = async (id) => listOf((await call(`/admin/inventory?batch_id=${id}&include_zero=true`, { auth: 'admin' })).body).find((r) => r.batch_id === id)
const ownInventory = await invOfBatch(batchId)
assert(Number(ownInventory?.available_qty) === 10, 'published batch is sellable after receipt (available 10)', JSON.stringify(ownInventory)?.slice(0, 200))
// The quote must follow the configured allocation strategy across every sellable batch.
const strategy = (await call('/admin/settings', { auth: 'admin' })).body?.allocation_strategy === 'FEFO' ? 'FEFO' : 'FIFO'
const candidates = listOf((await call('/admin/inventory?include_zero=false', { auth: 'admin' })).body)
  .filter((r) => r.product_name === product?.name && r.quality_status === 'PASS' && r.publication_status === 'PUBLISHED' && r.safety_status === 'NORMAL' && !r.is_expired)
const expectedFirst = strategy === 'FEFO'
  ? candidates.slice().sort((a, b) => String(a.expiry_date).localeCompare(String(b.expiry_date)) || a.batch_code.localeCompare(b.batch_code))[0]
  : candidates.slice().sort((a, b) => String(a.received_at).localeCompare(String(b.received_at)) || a.batch_code.localeCompare(b.batch_code))[0]
const picked = allocationsOf(quote).find((a) => a.qty > 0)
assert(picked?.batch_code === expectedFirst?.batch_code, `allocation follows ${strategy}`, `${picked?.batch_code} vs ${expectedFirst?.batch_code}`)
const pickedId = picked?.batch_id
const beforeOrder = pickedId ? await invOfBatch(pickedId) : null

const placeOrder = (key) => call('/orders', { method: 'POST', headers: { 'idempotency-key': key }, body: {
  address_id: addressId, payment_method: 'COD', quote_version: quote.version,
  items: [{ product_id: product?.id, quantity: 2 }] } })
const idemKey = `acc-${stamp}`
const order1 = await placeOrder(idemKey)
const order2 = await placeOrder(idemKey)
assert(order1.status === 201 || order1.status === 200, 'order placed', `${order1.status} ${order1.body?.error?.message ?? ''}`)
const orderId = order1.body?.order_id
assert(order2.status >= 200 && order2.status < 300 && order2.body?.order_id === orderId, 'same idempotency key replays the same order', `${order2.status} ${order2.body?.error?.message ?? ''}`)

const afterOrder = pickedId ? await invOfBatch(pickedId) : null
assert(!!pickedId && Number(afterOrder?.reserved_qty) > Number(beforeOrder?.reserved_qty), 'checkout reserved stock on the allocated batch', `${picked?.batch_code}: ${beforeOrder?.reserved_qty} -> ${afterOrder?.reserved_qty}`)
assert(Number(afterOrder?.on_hand_qty) === Number(beforeOrder?.on_hand_qty), 'checkout did not touch on_hand', `${beforeOrder?.on_hand_qty} -> ${afterOrder?.on_hand_qty}`)

// forged money fields are ignored: the server recomputes from the quote version
const forged = await call('/orders', { method: 'POST', headers: { 'idempotency-key': `acc-forged-${stamp}` }, body: {
  address_id: addressId, payment_method: 'COD', quote_version: quote.version,
  items: [{ product_id: product?.id, quantity: 1 }], shipping_fee: 0, total_vnd: 1 } })
const forgedOrder = forged.body?.order_id ? await call(`/me/orders/${forged.body.order_id}`) : null
assert(!forgedOrder || Number(forgedOrder.body?.total_vnd) === quote.total_vnd, 'client-sent money fields are ignored', JSON.stringify({ total: forgedOrder?.body?.total_vnd, quote: quote.total_vnd }))

// ---- fulfilment -------------------------------------------------------------
const ship = await call(`/admin/orders/${orderId}/ship`, { method: 'POST', auth: 'admin', body: { carrier: 'GHN', tracking_code: `ACC${stamp}`, courier_name: 'GHN' } })
assert(ship.status === 200 || ship.status === 201, 'order shipped', `${ship.status} ${ship.body?.error?.message ?? ''}`)

const afterShip = pickedId ? await invOfBatch(pickedId) : null
assert(
  Number(afterShip?.on_hand_qty) === Number(afterOrder?.on_hand_qty) - 2 && Number(afterShip?.reserved_qty) === Number(afterOrder?.reserved_qty) - 2,
  'shipment moved on_hand and reserved by the shipped quantity',
  `${JSON.stringify({ before: [afterOrder?.on_hand_qty, afterOrder?.reserved_qty], after: [afterShip?.on_hand_qty, afterShip?.reserved_qty] })}`,
)

// ---- traceability of what the shopper received -------------------------------
const myOrder = await call(`/me/orders/${orderId}`)
const shippedLines = allocationsOf({ lines: myOrder.body?.lines })
assert(myOrder.status === 200 && shippedLines.some((a) => a.batch_code === picked?.batch_code), 'customer order exposes the batch it received', JSON.stringify(shippedLines.map((a) => a.batch_code)).slice(0, 200))

const pdf = await call(`/t/${qrToken}/pdf`, { auth: false, raw: true })
assert(pdf.status === 200 && pdf.buf.subarray(0, 4).toString() === '%PDF', 'trace PDF renders', `${pdf.status} ${pdf.type ?? ''}`)

// ---- recall -----------------------------------------------------------------
const recall = await call(`/admin/batches/${batchId}/recalls`, { method: 'POST', auth: 'admin', body: {
  reason: `Thu hồi nghiệm thu ${stamp}`, severity: 'HIGH', started_at: day(0) } })
assert(recall.status === 201 || recall.status === 200, 'recall created', `${recall.status} ${recall.body?.error?.message ?? ''}`)

const traceAfter = await call(`/t/${qrToken}`, { auth: false })
const after = traceAfter.body?.data ?? traceAfter.body
assert(/thu hồi/i.test(JSON.stringify(after?.recall ?? after?.batch?.recall ?? traceAfter.text)), 'trace page shows the recall warning', '')

const sellAfterRecall = await call('/checkout/preview', { method: 'POST', body: { address_id: addressId, items: [{ product_id: product?.id, quantity: 1 }] } })
assert(!allocationOf(sellAfterRecall.body), 'recalled batch is no longer offered', JSON.stringify((sellAfterRecall.body?.lines ?? []).flatMap((l) => l.allocations ?? []).map((a) => a.batch_code)).slice(0, 200))

// ---- cleanup of the throwaway address ---------------------------------------
if (addressId && !oldIds.has(addressId)) {
  const del = await call(`/me/addresses/${addressId}`, { method: 'DELETE' })
  assert(del.status === 200 || del.status === 204, 'acceptance address removed', `${del.status}`)
}

// ---- report -----------------------------------------------------------------
let failed = 0
for (const s of steps) {
  if (!s.pass) failed++
  console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.name}${s.note ? ` :: ${s.note}` : ''}`)
}
console.log(`\n${steps.length - failed}/${steps.length} steps passed`)
process.exit(failed === 0 ? 0 : 1)
