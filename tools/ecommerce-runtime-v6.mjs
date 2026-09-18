/**
 * AgriMarket Commerce Runtime Smoke v6
 * Non-destructive: chỉ GET + login, không update/refund/order.
 */

const API = (process.env.SMOKE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(/\/+$/, '');
const OPENAPI = process.env.SMOKE_OPENAPI_URL ?? 'http://localhost:3000/openapi-json';

const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? 'demo.customer@agrimarket.local';
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Demo-Customer-123';
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@agrimarket.local';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo-Admin-123';

let pass = 0;
const fail = [];

function ok(label) {
  pass += 1;
  console.log(`✅ ${label}`);
}

function bad(label, detail = '') {
  fail.push(label);
  console.error(`❌ ${label}${detail ? ` — ${detail}` : ''}`);
}

function unwrap(payload) {
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  let data;
  try {
    data = unwrap(await response.json());
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

async function login(email, matKhau, role) {
  const response = await request('/xac-thuc/dang-nhap', {
    method: 'POST',
    body: { email, matKhau, nenTang: 'WEB', ghiNho: false },
  });
  if (response.status !== 200 || !response.data?.accessToken) {
    bad(`login ${role}`, `HTTP ${response.status}`);
    return null;
  }
  ok(`login ${role}`);
  return response.data.accessToken;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

console.log('AgriMarket — COMMERCE RUNTIME SMOKE v6');
console.log('======================================');
console.log(`API: ${API}`);

try {
  const health = await request('/suc-khoe');
  if (health.status === 200) ok('API health');
  else bad('API health', `HTTP ${health.status}`);

  const openapiRes = await fetch(OPENAPI, { signal: AbortSignal.timeout(8000) });
  const openapi = await openapiRes.json();
  const operations = [
    ['/api/v1/khieu-nai/cua-toi/thong-ke', 'get', 'layThongKeKhieuNaiCuaToi'],
    ['/api/v1/quan-tri/khieu-nai/thong-ke', 'get', 'layThongKeKhieuNaiQuanTri'],
    ['/api/v1/quan-tri/khieu-nai/{id}/xu-ly', 'patch', 'capNhatXuLyKhieuNaiQuanTri'],
    ['/api/v1/quan-tri/khieu-nai/{id}/hoan-tien', 'post', 'hoanTienTheoKhieuNaiQuanTri'],
  ];
  for (const [path, method, operationId] of operations) {
    const actual = openapi?.paths?.[path]?.[method]?.operationId;
    if (actual === operationId) ok(`OpenAPI ${operationId}`);
    else bad(`OpenAPI ${operationId}`, `actual=${String(actual)}`);
  }

  const farmOp = openapi?.paths?.['/api/v1/cong-khai/trang-trai']?.get;
  const farmParams = new Map(
    (farmOp?.parameters ?? [])
      .filter((p) => p?.in === 'query')
      .map((p) => [p.name, p.schema]),
  );
  if (farmParams.get('trang')?.type === 'number' || farmParams.get('trang')?.type === 'integer') {
    ok('OpenAPI farm.trang là number');
  } else {
    bad('OpenAPI farm.trang là number', JSON.stringify(farmParams.get('trang') ?? null));
  }
  if (farmParams.get('gioiHan')?.type === 'number' || farmParams.get('gioiHan')?.type === 'integer') {
    ok('OpenAPI farm.gioiHan là number');
  } else {
    bad('OpenAPI farm.gioiHan là number', JSON.stringify(farmParams.get('gioiHan') ?? null));
  }
  if (farmParams.get('noiBat')?.type === 'boolean') ok('OpenAPI farm.noiBat là boolean');
  else bad('OpenAPI farm.noiBat là boolean', JSON.stringify(farmParams.get('noiBat') ?? null));

  const farm = await request('/cong-khai/trang-trai?trang=1&gioiHan=1&noiBat=true');
  if (farm.status === 200) ok('public farm typed query runtime');
  else bad('public farm typed query runtime', `HTTP ${farm.status}`);

  const customerToken = await login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD, 'customer');
  let customerComplaint = null;

  if (customerToken) {
    const list = await request(
      '/khieu-nai/cua-toi?trang=1&gioiHan=20&sapXep=MOI_NHAT',
      { token: customerToken },
    );
    const items = list.data?.items ?? list.data?.duLieu ?? [];
    if (list.status === 200 && Array.isArray(items)) {
      ok('customer complaint list');
      customerComplaint = items[0] ?? null;
    } else {
      bad('customer complaint list', `HTTP ${list.status}`);
    }

    const stats = await request('/khieu-nai/cua-toi/thong-ke', { token: customerToken });
    if (
      stats.status === 200 &&
      typeof stats.data?.tong === 'number' &&
      Array.isArray(stats.data?.theoLyDo) &&
      Array.isArray(stats.data?.theoTrangThai)
    ) {
      ok('customer complaint stats aggregate');
      if (stats.data.tong >= items.length) ok('customer complaint stats >= current page');
      else bad('customer complaint stats >= current page');
    } else {
      bad('customer complaint stats aggregate', `HTTP ${stats.status}`);
    }

    if (customerComplaint?.maDonHang) {
      const search = await request(
        `/khieu-nai/cua-toi?trang=1&gioiHan=20&tuKhoa=${encodeURIComponent(customerComplaint.maDonHang)}&sapXep=MOI_NHAT`,
        { token: customerToken },
      );
      const found = (search.data?.items ?? []).some((item) => item.id === customerComplaint.id);
      if (search.status === 200 && found) ok('customer complaint server search');
      else bad('customer complaint server search', `HTTP ${search.status}`);
    }

    const oldFirst = await request(
      '/khieu-nai/cua-toi?trang=1&gioiHan=2&sapXep=CU_NHAT',
      { token: customerToken },
    );
    if (oldFirst.status === 200) ok('customer complaint server sort CU_NHAT');
    else bad('customer complaint server sort CU_NHAT', `HTTP ${oldFirst.status}`);
  }

  const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  if (adminToken) {
    const stats = await request('/quan-tri/khieu-nai/thong-ke', { token: adminToken });
    if (stats.status === 200 && typeof stats.data?.tong === 'number') {
      ok('admin complaint stats aggregate');
    } else {
      bad('admin complaint stats aggregate', `HTTP ${stats.status}`);
    }

    const list = await request(
      '/quan-tri/khieu-nai?trang=1&gioiHan=20&sapXep=MOI_NHAT',
      { token: adminToken },
    );
    if (list.status === 200 && Array.isArray(list.data?.items ?? [])) {
      ok('admin complaint list');
    } else {
      bad('admin complaint list', `HTTP ${list.status}`);
    }

    if (customerComplaint?.id) {
      const search = await request(
        `/quan-tri/khieu-nai?trang=1&gioiHan=20&tuKhoa=${encodeURIComponent(customerComplaint.id)}&sapXep=MOI_NHAT`,
        { token: adminToken },
      );
      const found = (search.data?.items ?? []).some((item) => item.id === customerComplaint.id);
      if (search.status === 200 && found) ok('Customer ↔ Admin complaint cùng source-of-truth');
      else bad('Customer ↔ Admin complaint cùng source-of-truth', `HTTP ${search.status}`);
    }

    const dashboard = await request('/quan-tri/dashboard', { token: adminToken });
    if (dashboard.status === 200) ok('admin dashboard');
    else bad('admin dashboard', `HTTP ${dashboard.status}`);

    const today = new Date();
    const from = new Date(today.getTime() - 6 * 86400000);
    const daily = await request(
      `/quan-tri/bao-cao-don-hang-doanh-thu/theo-ngay?tuNgay=${isoDate(from)}&denNgay=${isoDate(today)}`,
      { token: adminToken },
    );
    if (daily.status === 200 && Array.isArray(daily.data)) {
      ok('admin revenue daily aggregate 1 endpoint');
    } else {
      bad('admin revenue daily aggregate 1 endpoint', `HTTP ${daily.status}`);
    }
  }
} catch (error) {
  bad('runtime smoke exception', error instanceof Error ? error.message : String(error));
}

console.log('');
console.log(`RESULT: ${pass} PASS · ${fail.length} FAIL`);
if (fail.length) {
  console.error(`FAIL: ${fail.join(', ')}`);
  process.exit(1);
}
console.log('✅ COMMERCE RUNTIME SMOKE v6 PASS');
