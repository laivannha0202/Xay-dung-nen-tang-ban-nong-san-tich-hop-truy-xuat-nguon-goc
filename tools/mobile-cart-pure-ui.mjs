/**
 * MOBILE CART THUẦN UI — không dùng API/DB để chuẩn bị số lượng.
 *
 * Luồng: đăng ký tài khoản mới trên UI -> product detail (qty 1 -> + -> qty 2)
 * -> Thêm vào giỏ -> cart (qty 2, tổng 30.000đ) -> nút - (qty 1, KHÔNG được
 * navigate sang product detail) -> nút + (qty 2, tổng 30.000đ) -> checkout COD
 * -> Đặt hàng -> order detail -> tab Đã xác nhận (tìm bằng MÃ ĐƠN).
 *
 * Chạy: `node tools/mobile-cart-pure-ui.mjs`
 * Yêu cầu dev stack: API :3000, Expo Web :8081.
 * Kết quả: screenshot canonical + `pure-ui-cart-log.json` trong
 * `docs/evidence/manual-ui-acceptance/`. Exit != 0 khi bất kỳ assertion nào đỏ.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

// Resolve playwright: không nằm trong deps repo. Dùng npx cache đã có sẵn
// (phiên chạy manual trước + `npx playwright --version`), override qua
// PLAYWRIGHT_DIR khi cache bị dọn.
const require = createRequire(import.meta.url);
function taiPlaywright() {
  try {
    return require('playwright');
  } catch {
    // Bỏ qua: thử resolve từ npx cache bên dưới.
  }
  const cacheGoc = 'C:/Users/Admin/AppData/Local/npm-cache/_npx';
  const ungVien = [
    process.env.PLAYWRIGHT_DIR,
    `${cacheGoc}/e41f203b7505f1fb/node_modules/playwright`,
    `${cacheGoc}/9833c18b2d85bc59/node_modules/playwright`,
  ].filter(Boolean);
  for (const dir of ungVien) {
    try {
      return require(`${dir}/index.js`);
    } catch {
      // Bỏ qua candidate cache không dùng được, thử candidate tiếp theo.
    }
  }
  throw new Error('Không resolve được playwright. Chạy `npx playwright --version` trước.');
}
const { chromium } = taiPlaywright();

const EXPO_WEB = process.env.EXPO_WEB_URL ?? 'http://127.0.0.1:8081';
const SAN_PHAM_ID = process.env.PURE_UI_SAN_PHAM_ID ?? '01a10a41-4b88-7310-8138-5373445a2647';
const OUT_DIR = resolve('docs/evidence/manual-ui-acceptance');

const log = [];
function buoc(noiDung) {
  const dong = `${new Date().toISOString()} ${noiDung}`;
  log.push(dong);
  console.log(dong);
}

function fail(lyDo) {
  buoc(`FAIL: ${lyDo}`);
  try {
    void pageRef.page?.screenshot({ path: join(OUT_DIR, 'pure-ui-FAIL.png') });
  } catch {
    // Bỏ qua lỗi screenshot khi fail: log JSON + exit code mới là bằng chứng chính.
  }
  writeFileSync(join(OUT_DIR, 'pure-ui-cart-log.json'), JSON.stringify(log, null, 2));
  console.error(`\n❌ MOBILE CART PURE UI FAIL: ${lyDo}`);
  process.exit(1);
}

const suffix = Date.now().toString(36);
const EMAIL = `pureui-${suffix}@example.com`;
const MAT_KHAU = 'PureUI-Test-123';

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const pageRef = { page };
page.setDefaultTimeout(30_000);

async function diToi(url, { cho = 3 } = {}) {
  let loiCuoi = null;
  for (let lan = 1; lan <= cho; lan += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(4000);
      return;
    } catch (error) {
      loiCuoi = error;
      buoc(`RETRY goto ${url} lan ${lan} fail`);
      await page.waitForTimeout(5000);
    }
  }
  fail(`không mở được ${url}: ${String(loiCuoi).slice(0, 200)}`);
}

try {
  // 1. Đăng ký tài khoản mới hoàn toàn bằng UI.
  buoc('STEP 1: dang-ky UI');
  await diToi(`${EXPO_WEB}/dang-nhap`);
  await page.waitForTimeout(4000);
  // Form đăng ký nằm ở /dang-ky.
  await diToi(`${EXPO_WEB}/dang-ky`);
  await page.waitForTimeout(3000);
  await page.getByPlaceholder('Nguyễn Văn A').fill('Pure UI');
  await page.getByPlaceholder('ban@example.com').fill(EMAIL);
  await page.getByPlaceholder('10–128 ký tự').fill(MAT_KHAU);
  await page.getByPlaceholder('Nhập lại mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Đăng ký' }).click();
  await page.waitForTimeout(5000);
  buoc(`STEP 1: da dang-ky ${EMAIL} url=${page.url()}`);

  // Đăng ký xong KHÔNG tự đăng nhập (thiết kế: về /dang-nhap) -> đăng nhập bằng UI.
  buoc('STEP 1b: dang-nhap UI');
  if (!page.url().includes('/dang-nhap')) {
    await diToi(`${EXPO_WEB}/dang-nhap`);
    await page.waitForTimeout(3000);
  }
  await page.getByPlaceholder('Nhập email').fill(EMAIL);
  await page.getByPlaceholder('Nhập mật khẩu').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForTimeout(6000);
  buoc(`STEP 1b: sau dang-nhap url=${page.url()}`);
  if (page.url().includes('/dang-nhap')) {
    fail(`đăng nhập UI thất bại, vẫn ở ${page.url()}`);
  }

  // 2. Product detail: qty 1 -> + -> qty 2.
  buoc('STEP 2: product detail qty1 -> qty2');
  await diToi(`${EXPO_WEB}/san-pham/${SAN_PHAM_ID}`);
  await page.waitForTimeout(4000);
  await page.getByText('Cà rốt Manual UI 0510-1056', { exact: false }).first().waitFor();
  // Tổng đã chọn ban đầu phải là 15.000đ (qty 1).
  if (!(await page.getByText('15.000đ').first().isVisible().catch(() => false))) {
    fail('product detail không hiện 15.000đ ở qty 1');
  }
  await page.getByRole('button', { name: 'Tăng số lượng' }).click();
  await page.waitForTimeout(1500);
  // Sau + phải hiện 30.000đ (15000 x 2).
  if ((await page.getByText('30.000đ').count()) === 0) {
    fail('product detail sau + không hiện 30.000đ');
  }
  await page.screenshot({ path: join(OUT_DIR, 'mobile-product-detail-qty2-pure.png') });
  buoc('STEP 2: qty2 tong 30.000đ OK');

  // 3. Thêm vào giỏ.
  buoc('STEP 3: them vao gio');
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await page.waitForTimeout(4000);
  buoc(`STEP 3: sau them url=${page.url()}`);

  // 4. Cart qty 2.
  buoc('STEP 4: cart qty2');
  await diToi(`${EXPO_WEB}/gio-hang`);
  await page.waitForTimeout(4000);
  await page.getByText('Giỏ hàng').first().waitFor();
  if ((await page.getByText('30.000đ').count()) === 0) {
    fail('cart không hiện tổng 30.000đ ở qty 2');
  }
  await page.screenshot({ path: join(OUT_DIR, 'mobile-cart-qty2.png') });
  buoc('STEP 4: cart qty2 tong 30.000đ OK');

  // 5. Nút - : qty 2 -> 1, KHÔNG được navigate sang product detail.
  buoc('STEP 5: nut - trong cart');
  const urlTruocMinus = page.url();
  await page.getByRole('button', { name: /Giảm số lượng/ }).click();
  await page.waitForTimeout(4000);
  const urlSauMinus = page.url();
  if (!urlSauMinus.includes('/gio-hang')) {
    fail(`bấm nút - bị điều hướng khỏi cart: ${urlTruocMinus} -> ${urlSauMinus} (UI BUG)`);
  }
  if ((await page.getByText('15.000đ').count()) === 0) {
    fail('cart sau - không hiện tổng 15.000đ');
  }
  await page.screenshot({ path: join(OUT_DIR, 'mobile-cart-qty1-after-minus.png') });
  buoc(`STEP 5: minus OK, url giữ nguyên ${urlSauMinus}`);

  // 6. Nút + : qty 1 -> 2, tổng lại 30.000đ.
  buoc('STEP 6: nut + trong cart');
  await page.getByRole('button', { name: /Tăng số lượng/ }).click();
  await page.waitForTimeout(4000);
  if (!page.url().includes('/gio-hang')) {
    fail(`bấm nút + bị điều hướng khỏi cart: ${page.url()}`);
  }
  if ((await page.getByText('30.000đ').count()) === 0) {
    fail('cart sau + không hiện tổng 30.000đ');
  }
  await page.screenshot({ path: join(OUT_DIR, 'mobile-cart-qty2-after-plus.png') });
  buoc('STEP 6: plus OK, tong 30.000đ');

  // 7. Checkout.
  buoc('STEP 7: checkout');
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await page.waitForTimeout(5000);
  buoc(`STEP 7: url=${page.url()}`);

  // 8. Tài khoản mới chưa có địa chỉ -> thêm địa chỉ bằng UI.
  // Chờ checkout render xong: hoặc badge thiếu địa chỉ, hoặc nút Đặt hàng.
  buoc('STEP 8: doi checkout render');
  let thieuDiaChi = false;
  let coDatHang = false;
  for (let i = 0; i < 10; i += 1) {
    await page.waitForTimeout(3000);
    if ((await page.getByText('Chưa có địa chỉ giao hàng').count()) > 0) {
      thieuDiaChi = true;
      break;
    }
    if ((await page.getByRole('button', { name: 'Đặt hàng' }).count()) > 0) {
      coDatHang = true;
      break;
    }
  }
  await page.screenshot({ path: join(OUT_DIR, 'pure-ui-checkout-state.png') });
  buoc(`STEP 8: thieuDiaChi=${thieuDiaChi} coDatHang=${coDatHang} url=${page.url()}`);
  if (!thieuDiaChi && !coDatHang) {
    fail(`checkout kẹt ở trạng thái lạ (url=${page.url()})`);
  }
  if (thieuDiaChi) {
    buoc('STEP 8b: them dia chi UI');
    await page.getByRole('button', { name: 'Thêm địa chỉ' }).click();
    await page.waitForTimeout(4000);
    buoc(`STEP 8b: url=${page.url()}`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUT_DIR, 'pure-ui-diachi-state.png') });
    try {
      await page.getByRole('button', { name: 'Thêm địa chỉ' }).first().click({ timeout: 15000 });
    } catch {
      fail(`không bấm được nút Thêm địa chỉ ở ${page.url()}`);
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUT_DIR, 'pure-ui-diachi-form.png') });
    try {
      await page.getByPlaceholder('Nguyễn Văn A').fill('Pure UI', { timeout: 15000 });
    } catch {
      fail('form địa chỉ không mở (thiếu ô họ tên)');
    }
    await page.getByPlaceholder('0912345678').fill('0912345678');
    // Thử tối đa 8 xã/phường cho tới khi gặp xã có thôn/tổ (radio option).
    // Một số xã "chưa công bố" thôn -> picker thôn rỗng -> quay lại thử xã khác.
    let tenXaDaChon = '';
    let tenThonDaChon = '';
    for (let thuXa = 0; thuXa < 8; thuXa += 1) {
      try {
        await page.getByRole('button', { name: 'Chọn xã hoặc phường' }).click({ timeout: 15000 });
      } catch {
        fail('không mở được picker xã/phường');
      }
      await page.waitForTimeout(4000);
      const luaChonXa = page.getByRole('radio', { name: /^(Xã|Phường|Thị trấn) / });
      try {
        await luaChonXa.first().waitFor({ timeout: 15000 });
      } catch {
        fail('picker xã/phường không render option');
      }
      const tongXa = await luaChonXa.count();
      if (thuXa >= tongXa) fail('hết xã để thử mà chưa có thôn');
      tenXaDaChon = ((await luaChonXa.nth(thuXa).innerText().catch(() => '')) ?? '').trim();
      buoc(`STEP 8b: thu xa[${thuXa}/${tongXa}] "${tenXaDaChon}"`);
      await luaChonXa.nth(thuXa).click();
      await page.waitForTimeout(4000);
      // Mở picker thôn/tổ.
      try {
        await page.getByRole('button', { name: 'Chọn thôn hoặc tổ dân phố' }).click({ timeout: 15000 });
      } catch {
        fail('không mở được picker thôn/tổ sau khi chọn xã');
      }
      await page.waitForTimeout(4000);
      if ((await page.getByText('Không tìm thấy dữ liệu phù hợp.').count()) > 0) {
        buoc(`STEP 8b: "${tenXaDaChon}" chưa công bố thôn -> thử xã khác`);
        await page.getByRole('button', { name: /Quay lại, đóng/ }).click();
        await page.waitForTimeout(3000);
        continue;
      }
      const luaChonThon = page.getByRole('radio').filter({ hasNotText: /^$/ });
      const tenThon = ((await luaChonThon.first().innerText().catch(() => '')) ?? '').trim();
      if (!tenThon) {
        await page.getByRole('button', { name: /Quay lại, đóng/ }).click();
        await page.waitForTimeout(3000);
        continue;
      }
      tenThonDaChon = tenThon;
      buoc(`STEP 8b: chon thon "${tenThonDaChon}"`);
      await luaChonThon.first().click();
      await page.waitForTimeout(3000);
      break;
    }
    if (!tenThonDaChon) {
      fail('thử 8 xã vẫn không gặp xã có thôn');
    }
    buoc(`STEP 8b: xa="${tenXaDaChon}" thon="${tenThonDaChon}"`);
    try {
      await page.getByPlaceholder('Số nhà, ngõ/xóm...').fill('Số 1 ngõ Pure UI', { timeout: 15000 });
    } catch {
      fail('không điền được địa chỉ chi tiết sau khi chọn thôn');
    }
    try {
      await page.getByRole('button', { name: 'Lưu địa chỉ' }).click({ timeout: 15000 });
    } catch {
      fail('không bấm được nút Lưu địa chỉ');
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: join(OUT_DIR, 'pure-ui-after-save.png') });
    buoc(`STEP 8: sau luu dia chi url=${page.url()}`);
    // Quay lại checkout.
    await diToi(`${EXPO_WEB}/thanh-toan`);
  }

  // 9. COD + Đặt hàng.
  buoc('STEP 9: COD dat hang');
  try {
    await page.getByText('Thanh toán khi nhận hàng').first().waitFor({ timeout: 30_000 });
  } catch {
    fail(`checkout không hiện COD (url=${page.url()})`);
  }
  await page.screenshot({ path: join(OUT_DIR, 'mobile-checkout-cod.png') });
  // COD là mặc định; bấm chọn lại cho chắc rồi Đặt hàng.
  await page.getByText('Thanh toán khi nhận hàng').first().click().catch(() => {});
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Đặt hàng' }).click();
  await page.waitForTimeout(8000);
  const urlSauDat = page.url();
  buoc(`STEP 9: sau dat hang url=${urlSauDat}`);
  const matchDon = urlSauDat.match(/\/don-hang\/([0-9a-f-]{36})/i);
  if (!matchDon) {
    fail(`đặt hàng COD không về trang chi tiết đơn: ${urlSauDat}`);
  }
  const donHangId = matchDon[1];
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(OUT_DIR, 'mobile-order-created.png') });
  // Đọc mã đơn hiển thị trên UI (không dùng UUID để tìm).
  const bodyText = (await page.content()).replace(/<[^>]+>/g, ' ');
  const matchMa = bodyText.match(/ORD-[A-Z0-9]+/);
  const maDon = matchMa ? matchMa[0] : null;
  buoc(`STEP 9: donHangId=${donHangId} maDon=${maDon}`);
  if (!maDon) {
    fail('trang chi tiết đơn không hiển thị mã đơn ORD-*');
  }

  // 10. Tab Đã xác nhận: lọc + tìm bằng mã đơn.
  buoc('STEP 10: tab Da xac nhan');
  await diToi(`${EXPO_WEB}/don-hang`);
  await page.waitForTimeout(5000);
  await page.getByRole('button', { name: 'Đã xác nhận', exact: true }).first().click();
  await page.waitForTimeout(4000);
  await page.getByPlaceholder('Tìm theo mã đơn hàng...').fill(maDon);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(OUT_DIR, 'mobile-orders-da-xac-nhan.png') });
  if ((await page.getByText(maDon).count()) === 0) {
    fail(`tab Đã xác nhận không thấy mã đơn ${maDon}`);
  }
  buoc(`STEP 10: thay ${maDon} trong tab Da xac nhan`);

  // 11. Mở chi tiết từ tab.
  await page.getByText(maDon).first().click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: join(OUT_DIR, 'mobile-order-detail.png') });
  buoc(`STEP 11: order detail url=${page.url()}`);

  buoc(`DONE: API PATCH used=NO, maDon=${maDon}`);
  writeFileSync(join(OUT_DIR, 'pure-ui-cart-log.json'), JSON.stringify(log, null, 2));
  console.log(`\n✅ MOBILE CART PURE UI PASS — maDon=${maDon}`);
} finally {
  await browser.close();
}
