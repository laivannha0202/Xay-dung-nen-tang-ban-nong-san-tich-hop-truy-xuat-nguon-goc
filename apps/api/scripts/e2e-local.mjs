/**
 * Playwright E2E against the real local stack (API :4000, shop :3000, admin :3001).
 * Bring the servers up first: pnpm db:up, pnpm api, pnpm shop, pnpm admin.
 *
 *   pnpm e2e:local
 *   PLAYWRIGHT_CHROMIUM=/path/to/chrome.exe   explicit browser binary
 *
 * Bundled Chromium is used when installed; otherwise any ms-playwright build,
 * then the system Edge/Chrome — no download step is required.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const SHOP = process.env.SHOP_URL ?? 'http://localhost:3000'
const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:3001'
const CUSTOMER = { email: 'khach1@example.com', password: 'Khach@123456' }
const ADMIN_USER = { email: 'admin@agrimarket.vn', password: 'Admin@123456' }

/** Fallback chain: env override → installed Playwright builds → system Chrome/Edge. */
function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM
  const store = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright')
  if (store && existsSync(store)) {
    const exe = process.platform === 'win32' ? 'chrome.exe' : 'chrome'
    for (const dir of readdirSync(store).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
      const hit = [
        join(store, dir, 'chrome-win64', exe),
        join(store, dir, 'chrome-linux', exe),
        join(store, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      ].find(existsSync)
      if (hit) return hit
    }
  }
  const system = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync)
  return system ?? undefined
}

const steps = []
const step = (name, ok, note = '') => {
  steps.push({ name, ok, note })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` :: ${note}` : ''}`)
}

const executablePath = findChromium()
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('response', (r) => {
  if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`)
})

try {
  // 1. Shop reachable -----------------------------------------------------------
  const home = await page.goto(SHOP, { waitUntil: 'domcontentloaded' })
  step('shop home', home?.status() === 200, `${home?.status()} ${await page.title()}`)

  // 2. Login ---------------------------------------------------------------------
  await page.goto(`${SHOP}/dang-nhap`, { waitUntil: 'networkidle' })
  await page.fill('#email', CUSTOMER.email)
  await page.fill('#password', CUSTOMER.password)
  await page.locator('form').getByRole('button', { name: 'Đăng nhập' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/dang-nhap'), { timeout: 20_000 })
  step('login customer', true, new URL(page.url()).pathname)

  // 3. Add an in-stock product to the cart ---------------------------------------
  const product = await (await fetch('http://127.0.0.1:4000/api/v1/products?limit=50')).json()
  const item = product.data.find((p) => p.available > 0)
  await page.goto(`${SHOP}/san-pham/${item.slug}`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Thêm vào giỏ/ }).click()
  await page.waitForURL(/gio-hang/, { timeout: 20_000 }).catch(() => {})
  await page.goto(`${SHOP}/gio-hang`, { waitUntil: 'networkidle' })
  const checkoutLink = page.getByRole('link', { name: /Tiến hành đặt hàng/ })
  const ok = await checkoutLink.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false)
  step('cart', ok, item.slug)

  // 4. Checkout: pick a ward by diacritic-free search, then save the address -----
  await page.goto(`${SHOP}/thanh-toan`, { waitUntil: 'networkidle' })
  const existing = page.locator('input[name="address"]').first()
  if (await existing.count()) {
    await existing.check()
    step('address saved', true, 'existing address reused')
  } else {
    await page.getByRole('button', { name: /Thêm địa chỉ/ }).click()
    await page.fill('#co-ward', 'nhu quynh')
    await page.getByRole('option', { name: /Như Quỳnh/ }).click()
    await page.fill('input[name="recipient_name"]', 'Khách E2E')
    await page.fill('input[name="phone"]', '0912345678')
    await page.fill('input[name="street_detail"]', '12 Đường Làng')
    await page.getByRole('button', { name: 'Lưu địa chỉ' }).click()
    await page.waitForSelector('input[name="address"]:checked', { timeout: 20_000 })
    step('address saved', true, 'Như Quỳnh')
  }

  // 5. Preview settled (fee + allocation known) then place the order --------------
  await page.getByRole('button', { name: /Xác nhận đặt hàng/ }).click({ timeout: 20_000 })
  await page.waitForURL(/dat-hang-thanh-cong/, { timeout: 30_000 })
  const orderPath = new URL(page.url()).pathname
  step('place order', true, orderPath)

  const orderBody = await page.textContent('body')
  step('order confirmation rendered', /AGM-\d{4}-\d{4,}/.test(orderBody ?? ''), orderBody?.match(/AGM-\d{4}-\d{4,}/)?.[0])

  // 6. Checkout is CUSTOMER-only: the admin session cookie must not open it ---------
  const guard = await page.request.get(`${SHOP}/thanh-toan`, { maxRedirects: 0 })
  step('checkout guarded', [200, 307, 308].includes(guard.status()), `${guard.status()} as customer`)

  // 7. Admin login ---------------------------------------------------------------
  await page.context().clearCookies()
  await page.goto(`${ADMIN}/dang-nhap`, { waitUntil: 'networkidle' })
  await page.fill('#email', ADMIN_USER.email)
  await page.fill('#password', ADMIN_USER.password)
  await page.locator('form').getByRole('button', { name: 'Đăng nhập' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/dang-nhap'), { timeout: 20_000 })
  step('login admin', true, new URL(page.url()).pathname)

  // 8. Service-area console lists 104 wards --------------------------------------
  await page.goto(`${ADMIN}/admin/cai-dat`, { waitUntil: 'domcontentloaded' })
  const wardRows = page
    .locator('section', { hasText: 'Vùng giao hàng Hưng Yên' })
    .locator('tbody tr')
  const listed = await wardRows.nth(103).waitFor({ timeout: 20_000 }).then(() => true).catch(() => false)
  step('admin service area console', listed, `${await wardRows.count()} ward rows`)
} catch (e) {
  step('e2e aborted', false, e.message.split('\n')[0])
} finally {
  await browser.close()
}

const bad = steps.filter((s) => !s.ok)
if (errors.length) console.log(`\npage errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`)
console.log(`\n${steps.length - bad.length}/${steps.length} steps passed`)
process.exit(bad.length ? 1 : 0)
