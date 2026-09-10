'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadTsModule(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: filename,
    reportDiagnostics: true,
  }).outputText;

  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);
  return loaded.exports;
}

const domainUi = loadTsModule('packages/api-client/src/domain-ui.ts');

test('checkout component semantics distinguish not-applied from real zero value', () => {
  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'KHONG_AP_DUNG', giaTri: 0 }), {
    label: 'Chưa áp dụng',
    tone: 'neutral',
    hienThiGiaTri: false,
  });

  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'DA_TINH', giaTri: 0 }), {
    label: 'Đã tính',
    tone: 'success',
    hienThiGiaTri: true,
  });

  assert.deepEqual(domainUi.metaThanhPhanCheckout({ trangThai: 'DA_TINH', giaTri: null }), {
    label: 'Đang cập nhật',
    tone: 'warning',
    hienThiGiaTri: false,
  });
});

test('Mobile and Customer Web consume the same checkout component semantics', () => {
  const mobile = read('apps/mobile/src/app/thanh-toan.tsx');
  const web = read('apps/customer-web/src/components/checkout-content.tsx');
  const backend = read('apps/api/src/modules/gio-hang/checkout-preview.service.ts');

  assert.equal(mobile.includes("import { metaThanhPhanCheckout } from '@agrimarket/api-client';"), true);
  assert.equal(web.includes("import { metaThanhPhanCheckout } from '@agrimarket/api-client';"), true);
  assert.equal(web.includes('preview.total.coTheXacNhan'), true);
  assert.equal(web.includes('thanhPhan={preview.promotion}'), true);
  assert.equal(web.includes('thanhPhan={preview.points}'), true);
  assert.equal(backend.includes("trangThai: 'KHONG_AP_DUNG'"), true);
});
