'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Customer Web, Admin Web and Mobile share the canonical AgriMarket brand', () => {
  const domainUi = read('packages/api-client/src/domain-ui.ts');
  const customerLayout = read('apps/customer-web/src/app/layout.tsx');
  const customerBrand = read('apps/customer-web/src/app/brand-sync.css');
  const adminLayout = read('apps/admin-web/src/app/layout.tsx');
  const adminBrand = read('apps/admin-web/src/app/admin-sync.css');
  const mobileTheme = read('apps/mobile/src/theme/theme.ts');

  for (const marker of ['#087A4B', '#F7FAF8', '#FFFFFF', '#17251C', '#DCE7DF']) {
    assert.equal(domainUi.includes(marker), true, `Shared brand missing ${marker}`);
    assert.equal(customerBrand.includes(marker), true, `Customer Web brand missing ${marker}`);
    assert.equal(adminBrand.includes(marker), true, `Admin Web brand missing ${marker}`);
  }

  assert.equal(customerLayout.includes("import './brand-sync.css';"), true);
  assert.equal(
    customerLayout.indexOf("import './globals.css';") < customerLayout.indexOf("import './brand-sync.css';"),
    true,
    'Customer canonical layer must load after legacy globals',
  );
  assert.equal(adminLayout.includes("import './admin-sync.css';"), true);
  assert.equal(mobileTheme.includes('THUONG_HIEU_AGRIMARKET'), true);
});

test('Shared shipment labels cover every canonical Backend state', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const domainUi = read('packages/api-client/src/domain-ui.ts');
  const states = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];

  assert.equal(schema.includes('enum TrangThaiVanChuyen'), true);
  for (const state of states) {
    assert.equal(schema.includes(`  ${state}`), true, `Backend shipment state missing ${state}`);
    assert.equal(domainUi.includes(`${state}: { label:`), true, `Shared UI shipment label missing ${state}`);
  }
});

test('Mobile image normalization maps local hosts to the configured device-reachable host', () => {
  const imageUrl = read('apps/mobile/src/lib/url-anh.ts');
  const productCard = read('apps/mobile/src/components/design-system/product-card.tsx');
  const farmCard = read('apps/mobile/src/components/design-system/farm-card.tsx');

  assert.equal(imageUrl.includes("new Set(['localhost', '127.0.0.1', '0.0.0.0'])"), true);
  assert.equal(imageUrl.includes('parsed.hostname = apiUrl.hostname'), true);
  assert.equal(imageUrl.includes('parsed.port ='), false, 'Image normalizer must preserve MinIO/service port');
  assert.equal(imageUrl.includes("replace(/\\/api\\/v1\\/?$/i, '')"), true);
  assert.equal(productCard.includes('chuanHoaUrlAnhMobile'), true);
  assert.equal(farmCard.includes('chuanHoaUrlAnhMobile'), true);
});
