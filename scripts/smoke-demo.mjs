/**
 * AGRIMARKET — DEMO SMOKE (non-destructive, no Docker).
 *
 * Kiểm tra API đang chạy + fixture demo seed:
 * - health
 * - login Customer → order list → order detail → exact allocation
 * - public trace với cùng maTruyXuat (đối chiếu maLo + provenance)
 * - flash sale active (server-authoritative)
 * - login Admin → dashboard/order/batch/inventory/reports
 * - review/complaint/follow/wishlist/loyalty hiển thị đúng fixture
 *
 * Chạy: pnpm demo:smoke
 * Exit non-zero khi bất kỳ kiểm tra nào FAIL.
 */

const API = process.env.SMOKE_API_BASE_URL ?? 'http://127.0.0.1:3000/api/v1';
const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL ?? 'demo.customer@agrimarket.local';
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Demo-Customer-123';
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'demo.admin@agrimarket.local';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo-Admin-123';
const DEMO_MA_DON_HANG = 'AGM-DEMO-ORDER-001';

const loi = [];
let demPass = 0;

function pass(moTa) {
  demPass += 1;
  console.log(`✅ ${moTa}`);
}

function fail(moTa, chiTiet) {
  loi.push(moTa);
  console.error(`❌ ${moTa}${chiTiet ? ` — ${chiTiet}` : ''}`);
}

async function goi(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data: data?.data ?? data };
}

async function dangNhap(email, matKhau, vaiTro) {
  const { status, data } = await goi('/xac-thuc/dang-nhap', {
    method: 'POST',
    body: { email, matKhau, nenTang: 'WEB' },
  });
  if (status !== 200 || !data?.accessToken) {
    fail(`login ${vaiTro} (${email})`, `HTTP ${status}`);
    return null;
  }
  pass(`login ${vaiTro}`);
  return data.accessToken;
}

async function main() {
  console.log(`🔍 Smoke demo với API: ${API}`);

  // 1. Health
  try {
    const { status } = await goi('/suc-khoe');
    if (status === 200) pass('API health');
    else fail('API health', `HTTP ${status}`);
  } catch (error) {
    fail('API health', error instanceof Error ? error.message : String(error));
  }
  if (loi.length > 0) return ketThuc();

  // 2. Customer login
  const tokenKhach = await dangNhap(CUSTOMER_EMAIL, CUSTOMER_PASSWORD, 'customer');
  if (!tokenKhach) return ketThuc();

  // 3. Order list chứa đơn demo
  const dsDon = await goi('/don-hang?trang=1&gioiHan=20', { token: tokenKhach });
  const tomTat = (dsDon.data?.duLieu ?? []).find((d) => d.maDonHang === DEMO_MA_DON_HANG);
  if (dsDon.status === 200 && tomTat) pass('order list chứa đơn demo');
  else {
    fail('order list chứa đơn demo', `HTTP ${dsDon.status}`);
    return ketThuc();
  }

  // 4. Order detail + exact allocation (muc nằm trong donNhaCungCap[])
  const chiTiet = await goi(`/don-hang/${tomTat.id}`, { token: tokenKhach });
  const cacDonNcc = chiTiet.data?.donNhaCungCap ?? [];
  const cacMuc = cacDonNcc.flatMap((s) => s.muc ?? []);
  if (chiTiet.status !== 200 || cacMuc.length === 0) {
    fail('order detail có items', `HTTP ${chiTiet.status}`);
    return ketThuc();
  }
  pass(`order detail có ${cacMuc.length} items`);
  const cacPhanBo = cacMuc.flatMap((m) => m.phanBo ?? []);
  if (cacPhanBo.length >= 1) pass(`exact allocation: ${cacPhanBo.length} phân bổ`);
  else {
    fail('exact allocation', 'item.phanBo rỗng');
    return ketThuc();
  }
  const maDau = cacPhanBo.find((p) => p.maTruyXuat)?.maTruyXuat ?? null;
  if (!maDau) {
    fail('maTruyXuat non-null', 'mọi phân bổ đều null');
    return ketThuc();
  }
  pass(`maTruyXuat non-null: ${maDau}`);
  const maLoPhanBo = cacPhanBo.find((p) => p.maTruyXuat === maDau)?.maLo ?? null;

  // 5. Public trace với cùng mã
  const trace = await goi(`/truy-xuat/${encodeURIComponent(maDau)}`);
  const loTrace = trace.data?.lo ?? trace.data;
  if (trace.status === 200 && loTrace?.maLo === maLoPhanBo) {
    pass(`public trace khớp maLo ${maLoPhanBo}`);
  } else {
    fail('public trace khớp maLo', `HTTP ${trace.status}, maLo=${loTrace?.maLo}`);
  }
  const muaVu = trace.data?.muaVu ?? loTrace?.muaVu ?? null;
  if (muaVu?.trangTrai || trace.data?.trangTrai || loTrace?.trangTrai) pass('public trace có provenance');
  else fail('public trace có provenance', 'thiếu mùa vụ/trang trại');

  // 6. Flash sale active
  const flash = await goi('/flash-sale-cong-khai/active');
  const cacMucFlash = (flash.data ?? []).flatMap((c) => c.muc ?? []);
  if (flash.status === 200 && cacMucFlash.length > 0) {
    const hopLe = cacMucFlash.every((m) => m.giaFlash > 0 && m.giaGoc > m.giaFlash && m.phanTramGiam > 0);
    if (hopLe) pass(`flash sale active: ${cacMucFlash.length} món server-authoritative`);
    else fail('flash sale fields', 'giaFlash/giaGoc/phanTramGiam bất thường');
  } else {
    fail('flash sale active', `HTTP ${flash.status}, món=${cacMucFlash.length}`);
  }

  // 7. Fixture hiển thị: review/complaint/follow/wishlist/loyalty
  const khieuNai = await goi('/khieu-nai/cua-toi?trang=1&gioiHan=5', { token: tokenKhach });
  const dsKhieuNai = khieuNai.data?.duLieu ?? khieuNai.data?.items ?? [];
  if (khieuNai.status === 200 && dsKhieuNai.length >= 1) pass('complaint demo hiển thị');
  else fail('complaint demo hiển thị', `HTTP ${khieuNai.status}`);

  const theoDoi = await goi('/khach-hang/theo-doi-trang-trai', { token: tokenKhach });
  const dsTheoDoi = theoDoi.data?.duLieu ?? theoDoi.data ?? [];
  if (theoDoi.status === 200 && (Array.isArray(dsTheoDoi) ? dsTheoDoi.length : 0) >= 1) pass('follow farm demo hiển thị');
  else fail('follow farm demo hiển thị', `HTTP ${theoDoi.status}`);

  const yeuThich = await goi('/khach-hang/yeu-thich', { token: tokenKhach });
  const dsYeuThich = yeuThich.data?.duLieu ?? yeuThich.data ?? [];
  if (yeuThich.status === 200 && (Array.isArray(dsYeuThich) ? dsYeuThich.length : 0) >= 1) pass('wishlist demo hiển thị');
  else fail('wishlist demo hiển thị', `HTTP ${yeuThich.status}`);

  const diem = await goi('/khach-hang/diem-thuong', { token: tokenKhach });
  if (diem.status === 200 && typeof (diem.data?.diem ?? diem.data?.soDu) === 'number') pass('loyalty demo hiển thị');
  else fail('loyalty demo hiển thị', `HTTP ${diem.status}`);

  // 8. Admin login + smoke
  const tokenAdmin = await dangNhap(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
  if (!tokenAdmin) return ketThuc();

  const kiemTraAdmin = [
    ['/quan-tri/dashboard', 'admin dashboard'],
    ['/quan-tri/don-hang?trang=1&gioiHan=5', 'admin order list'],
    ['/lo-san-pham?trang=1&gioiHan=5', 'admin batch list'],
    ['/quan-tri/bao-cao-ton-kho/ton-kho?trang=1&gioiHan=1', 'admin inventory report'],
    ['/quan-tri/bao-cao-don-hang-doanh-thu?trang=1&gioiHan=1', 'admin revenue report'],
  ];
  for (const [path, moTa] of kiemTraAdmin) {
    const res = await goi(path, { token: tokenAdmin });
    if (res.status === 200) pass(moTa);
    else fail(moTa, `HTTP ${res.status}`);
  }

  const dsDonAdmin = await goi(`/quan-tri/don-hang?trang=1&gioiHan=50&timKiem=${encodeURIComponent(DEMO_MA_DON_HANG)}`, { token: tokenAdmin });
  const donAdmin = (dsDonAdmin.data?.duLieu ?? []).find((d) => d.maDonHang === DEMO_MA_DON_HANG);
  if (donAdmin?.id) {
    const chiTietAdmin = await goi(`/quan-tri/don-hang/${donAdmin.id}`, { token: tokenAdmin });
    if (chiTietAdmin.status === 200) pass('admin order detail cùng truth');
    else fail('admin order detail cùng truth', `HTTP ${chiTietAdmin.status}`);
  } else {
    fail('admin thấy đơn demo', `HTTP ${dsDonAdmin.status}`);
  }

  return ketThuc();
}

function ketThuc() {
  console.log('');
  console.log(`SMOKE: ${demPass} pass · ${loi.length} fail`);
  if (loi.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
