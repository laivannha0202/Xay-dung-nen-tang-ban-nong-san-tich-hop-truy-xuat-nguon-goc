'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(
  __dirname,
  '../../..',
);

function read(relativePath) {
  return fs.readFileSync(
    path.join(
      repoRoot,
      relativePath,
    ),
    'utf8',
  );
}

function collectOperationIds(
  spec,
) {
  const ids = new Set();

  for (
    const pathItem
    of Object.values(
      spec.paths ?? {},
    )
  ) {
    if (
      !pathItem
      || typeof pathItem
        !== 'object'
    ) {
      continue;
    }

    for (
      const method
      of [
        'get',
        'post',
        'put',
        'patch',
        'delete',
      ]
    ) {
      const operation =
        pathItem[method];

      if (
        operation
        && typeof operation
          === 'object'
        && typeof operation.operationId
          === 'string'
      ) {
        ids.add(
          operation.operationId,
        );
      }
    }
  }

  return ids;
}

function walkTextFiles(
  root,
) {
  const content = [];

  for (
    const entry
    of fs.readdirSync(
      root,
      {
        withFileTypes: true,
      },
    )
  ) {
    const fullPath =
      path.join(
        root,
        entry.name,
      );

    if (entry.isDirectory()) {
      content.push(
        ...walkTextFiles(
          fullPath,
        ),
      );
      continue;
    }

    if (
      entry.isFile()
      && /\.(?:ts|tsx)$/.test(
        entry.name,
      )
    ) {
      content.push(
        fs.readFileSync(
          fullPath,
          'utf8',
        ),
      );
    }
  }

  return content;
}

const openapi = JSON.parse(
  read(
    'packages/api-client/openapi/agrimarket.json',
  ),
);

const operationIds =
  collectOperationIds(
    openapi,
  );

test(
  'OpenAPI keeps critical Mobile operations',
  () => {
    const required = [
      'layFacetsSanPhamCongKhai',
      'layThanhToanDonHangCuaToi',
      'layGiaoHangDonHangCuaToi',
      'dangKyThietBiPush',
      'huyDangKyThietBiPush',
      'guiThuPushCuaToi',
    ];

    for (
      const operationId
      of required
    ) {
      assert.equal(
        operationIds.has(
          operationId,
        ),
        true,
        `Missing operationId: ${operationId}`,
      );
    }
  },
);

test(
  'Generated API client contains critical operations and facet hook',
  () => {
    const generatedRoot =
      path.join(
        repoRoot,
        'packages/api-client/generated',
      );

    const generatedText =
      walkTextFiles(
        generatedRoot,
      ).join('\n');

    const required = [
      'layFacetsSanPhamCongKhai',
      'useLayFacetsSanPhamCongKhai',
      'layThanhToanDonHangCuaToi',
      'layGiaoHangDonHangCuaToi',
      'dangKyThietBiPush',
      'huyDangKyThietBiPush',
      'guiThuPushCuaToi',
    ];

    for (
      const marker
      of required
    ) {
      assert.equal(
        generatedText.includes(
          marker,
        ),
        true,
        `Generated client missing: ${marker}`,
      );
    }
  },
);

test(
  'Register DTO validation remains aligned with Mobile 015',
  () => {
    const dto = read(
      'apps/api/src/modules/xac-thuc/dto/dang-ky.dto.ts',
    );

    for (
      const marker
      of [
        '@IsEmail()',
        '@MaxLength(191)',
        '@Length(10, 128)',
        '@Length(2, 150)',
        '/^[0-9+]{9,20}$/',
      ]
    ) {
      assert.equal(
        dto.includes(marker),
        true,
        `Register DTO missing: ${marker}`,
      );
    }
  },
);

test(
  'Navigation and performance architecture remains wired',
  () => {
    const tabs = read(
      'apps/mobile/src/app/(tabs)/_layout.tsx',
    );

    const provider = read(
      'apps/mobile/src/providers/app-providers.tsx',
    );

    const productCard = read(
      'apps/mobile/src/components/design-system/product-card.tsx',
    );

    const farmCard = read(
      'apps/mobile/src/components/design-system/farm-card.tsx',
    );

    const wishlist = read(
      'apps/mobile/src/app/tai-khoan/wishlist.tsx',
    );

    const farms = read(
      'apps/mobile/src/app/tai-khoan/trang-trai-theo-doi.tsx',
    );

    assert.equal(
      tabs.includes(
        'backBehavior="history"',
      ),
      true,
    );

    assert.equal(
      provider.includes(
        'focusManager.setFocused(',
      ),
      true,
    );

    assert.equal(
      productCard.includes(
        'cachePolicy="memory-disk"',
      ),
      true,
    );

    assert.equal(
      farmCard.includes(
        'cachePolicy="memory-disk"',
      ),
      true,
    );

    assert.equal(
      wishlist.includes(
        '<FlatList',
      ),
      true,
    );

    assert.equal(
      farms.includes(
        '<FlatList',
      ),
      true,
    );
  },
);

test(
  'Public product facets keep the global /api/v1 prefix',
  () => {
    assert.equal(
      Boolean(openapi.paths?.['/api/v1/san-pham-cong-khai/facets']),
      true,
      'OpenAPI facet path must include /api/v1',
    );

    const generated = read(
      'packages/api-client/generated/index.ts',
    );

    assert.equal(
      generated.includes(
        '${layApiBaseUrl()}/api/v1/san-pham-cong-khai/facets',
      ),
      true,
      'Generated facet client must include /api/v1',
    );
  },
);


test(
  'Mobile Home uses public facet categories and real package units',
  () => {
    const categoryGrid = read(
      'apps/mobile/src/components/home/category-grid.tsx',
    );
    const home = read(
      'apps/mobile/src/app/(tabs)/index.tsx',
    );
    const lower = read(
      'apps/mobile/src/components/home/home-lower-sections.tsx',
    );
    const dto = read(
      'apps/api/src/modules/san-pham/dto/phan-hoi-san-pham-cong-khai.dto.ts',
    );

    assert.equal(categoryGrid.includes('FALLBACK_CATEGORIES'), false);
    assert.equal(categoryGrid.includes('const items = categories.slice(0, 8);'), true);
    assert.equal(home.includes('useLayFacetsSanPhamCongKhai()'), true);
    assert.equal(home.includes('dinhDangQuyCach(item.quyCach)'), true);
    assert.equal(lower.includes('formatUnit(item.quyCach)'), true);
    assert.equal(home.includes('/ đơn vị'), false);
    assert.equal(lower.includes('/ đơn vị'), false);
    assert.equal(dto.includes('QuyCachSanPhamCongKhaiDto'), true);
  },
);

test(
  'Recommendation runtime stays behind the shared API client boundary',
  () => {
    const shared = read('packages/api-client/src/goi-y.ts');
    const mobileAdapter = read('apps/mobile/src/lib/api-goi-y.ts');
    const mobileScreen = read('apps/mobile/src/app/goi-y.tsx');
    const account = read('apps/mobile/src/app/(tabs)/tai-khoan.tsx');
    const webAdapter = read('apps/customer-web/src/lib/api-goi-y.ts');
    const webHome = read('apps/customer-web/src/components/goi-y-home.tsx');

    assert.equal(shared.includes('/api/v1/khach-hang/goi-y'), true);
    assert.equal(shared.includes('layGoiYSanPhamCuaToi'), true);
    assert.equal(mobileAdapter.includes('layTuyChonBearer'), true);
    assert.equal(mobileScreen.includes("from '@/lib/api-goi-y'"), true);
    assert.equal(/\bfetch\s*\(/.test(mobileScreen), false);
    assert.equal(account.includes("router.push('/goi-y')"), true);
    assert.equal(webAdapter.includes('bearerOptionsKhachHang'), true);
    assert.equal(webHome.includes('layGoiYSanPhamKhachHang'), true);
    assert.equal(/\bfetch\s*\(/.test(webHome), false);
  },
);
