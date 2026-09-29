/**
 * Runtime verify product domain trên DB DEV (chỉ đọc, trừ kết nối).
 * Khởi tạo service thật (Prisma + TepTin + SanPhamCongKhai + TruyXuatCongKhai)
 * qua Nest testing module tối thiểu — không cần HTTP server/MinIO/Redis.
 *
 * Assert trên dữ liệu seed thật:
 * - detail rau/gạo/trứng trả harvest ĐÚNG loại của chính sản phẩm;
 * - related ưu tiên cùng danh mục, loại chính nó;
 * - trace AGM-* trả chuỗi lô thật;
 * - cá hồi ẩn (404), facets không organic.
 * Exit 1 khi có FAIL.
 */

import { ConfigService } from '@nestjs/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const scriptDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(scriptDir, '../.env') });
loadEnv({ path: resolve(scriptDir, '../../../.env') });

import { PrismaService } from '../src/database/prisma.service';
import { SanPhamCongKhaiService } from '../src/modules/san-pham/san-pham-cong-khai.service';
import { TepTinService } from '../src/modules/tep-tin/tep-tin.service';
import { TruyXuatCongKhaiService } from '../src/modules/truy-xuat-cong-khai/truy-xuat-cong-khai.service';

let fail = 0;
function pass(noiDung: string): void {
  console.log(`✅ PASS ${noiDung}`);
}
function loi(noiDung: string): void {
  fail += 1;
  console.log(`❌ FAIL ${noiDung}`);
}
function assert(dieuKien: boolean, noiDung: string): void {
  if (dieuKien) pass(noiDung);
  else loi(noiDung);
}

async function main(): Promise<void> {
  const config = new ConfigService();
  const prisma = new PrismaService(config);
  await prisma.$connect();
  const tepTin = new TepTinService(prisma, config);
  const sanPham = new SanPhamCongKhaiService(prisma, tepTin);
  const truyXuat = new TruyXuatCongKhaiService(prisma);

  const timId = async (ten: string): Promise<string | null> => {
    const row = await prisma.sanPham.findFirst({
      where: { ten, trangThai: 'HOAT_DONG' },
      select: { id: true },
    });
    return row?.id ?? null;
  };

  // 1. Detail rau củ: harvest phải là Cà rốt, không phải crop chung chung.
  const caRotId = await timId('Cà rốt');
  assert(!!caRotId, 'tìm thấy Cà rốt active');
  if (caRotId) {
    const ct = await sanPham.layChiTiet(caRotId);
    assert(ct.thuHoachGanNhatTaiTrangTrai?.cayTrong === 'Cà rốt', `harvest Cà rốt đúng loại (nhận: ${ct.thuHoachGanNhatTaiTrangTrai?.cayTrong})`);
    assert(ct.danhMuc.ten === 'Rau củ', 'Cà rốt ở danh mục Rau củ');
    assert(ct.trangTrai.ten === 'Trang trại Minh Bạch', 'Cà rốt của Minh Bạch');
    assert(ct.anhBiaUrl?.includes('ca-ro-t.jpg'), 'ảnh bìa Cà rốt đúng file');
  }

  // 2. Detail gạo: Lúa/ST25.
  const gaoId = await timId('Gạo ST25');
  assert(!!gaoId, 'tìm thấy Gạo ST25 active');
  if (gaoId) {
    const ct = await sanPham.layChiTiet(gaoId);
    assert(ct.thuHoachGanNhatTaiTrangTrai?.cayTrong === 'Lúa', `harvest gạo là Lúa (nhận: ${ct.thuHoachGanNhatTaiTrangTrai?.cayTrong})`);
    assert(ct.thuHoachGanNhatTaiTrangTrai?.giong === 'ST25', 'giống ST25');
    assert(ct.danhMuc.ten === 'Gạo', 'Gạo ST25 ở danh mục Gạo');
  }

  // 3. Detail trứng: không dính harvest cây trồng.
  const trungId = await timId('Trứng gà ta');
  assert(!!trungId, 'tìm thấy Trứng gà ta active');
  if (trungId) {
    const ct = await sanPham.layChiTiet(trungId);
    const cay = ct.thuHoachGanNhatTaiTrangTrai?.cayTrong ?? '';
    assert(!['Rau thủy canh', 'Cà chua', 'Lúa', 'Cam', 'Chuối'].includes(cay), `trứng không dính harvest cây trồng (nhận: ${cay || 'null'})`);
  }

  // 4. Related gạo: ưu tiên cùng danh mục Gạo, loại chính nó.
  if (gaoId) {
    const lq = await sanPham.layLienQuan(gaoId);
    const tens = lq.duLieu.map((item) => item.ten);
    assert(!tens.includes('Gạo ST25'), 'related loại chính nó');
    assert(tens.slice(0, 2).every((ten) => ten.startsWith('Gạo')), `2 related đầu là gạo (nhận: ${tens.slice(0, 3).join(', ')})`);
  }

  // 5. Related rau: cùng danh mục trước, không lọt gạo/trái cây lên đầu khi đủ rau.
  if (caRotId) {
    const lq = await sanPham.layLienQuan(caRotId);
    assert(lq.duLieu.length >= 4, `đủ related rau củ (nhận: ${lq.duLieu.length})`);
    assert(lq.duLieu[0]!.danhMuc.ten === 'Rau củ', `related đầu là rau củ (nhận: ${lq.duLieu[0]!.danhMuc.ten})`);
  }

  // 6. Trace AGM-* đầu tiên: chuỗi lô thật (mùa vụ + thu hoạch + sự kiện).
  const trace = await truyXuat.layTheoMa('AGM-00000000000000000000000000000001');
  assert(trace.muaVu.cayTrong === 'Xà lách', 'trace lô 001 là Xà lách');
  assert(trace.suKien.length >= 3, `lô 001 có sự kiện công khai (nhận: ${trace.suKien.length})`);
  assert(trace.nhatKyCanhTac.length >= 1, 'lô 001 có nhật ký canh tác công khai');

  // 7. Cá hồi ẩn khỏi detail công khai.
  const caHoi = await prisma.sanPham.findFirst({ where: { ten: 'Cá hồi Na Uy' }, select: { id: true } });
  if (caHoi) {
    try {
      await sanPham.layChiTiet(caHoi.id);
      loi('Cá hồi còn xem được detail công khai');
    } catch {
      pass('Cá hồi ẩn khỏi detail công khai');
    }
  } else {
    pass('không còn Cá hồi Na Uy trong DB demo');
  }

  // 8. Facets không có organic.
  const facets = await sanPham.layFacets();
  assert(!facets.danhMuc.some((item) => item.value === 'organic'), 'facets không có organic');
  assert(facets.danhMuc.some((item) => item.value === 'rau-cu'), 'facets có Rau củ');

  // 9. Mật ong hết hàng thật.
  const matOngId = await timId('Mật ong rừng');
  if (matOngId) {
    const ct = await sanPham.layChiTiet(matOngId);
    assert(ct.khaDung.coTheDatHang === false, 'Mật ong tạm hết hàng');
  }

  // 10. Filter ngày thu hoạch đi qua lô thật của product.
  const homNay = new Date();
  const iso = (d: Date): string => d.toISOString().slice(0, 10);
  const cachDay = (n: number): string => {
    const d = new Date(homNay);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const locRong = await sanPham.layDanhSach({
    trang: 1,
    gioiHan: 50,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
    thuHoachTu: cachDay(15),
    thuHoachDen: iso(homNay),
  } as never);
  assert(locRong.tong >= 15, `filter harvest 15 ngày qua trả đủ hàng (nhận: ${locRong.tong})`);
  const locTuongLai = await sanPham.layDanhSach({
    trang: 1,
    gioiHan: 50,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
    thuHoachTu: '2030-01-01',
    thuHoachDen: '2030-12-31',
  } as never);
  assert(locTuongLai.tong === 0, 'filter harvest tương lai trả rỗng, không crash');

  // 11. PHU_HOP chạy bằng freshness theo lô, không crash, có kết quả.
  const phuHop = await sanPham.layDanhSach({
    trang: 1,
    gioiHan: 50,
    khaDung: 'TAT_CA',
    sapXep: 'PHU_HOP',
  } as never);
  assert(phuHop.tong >= 15, `PHU_HOP trả đủ hàng (nhận: ${phuHop.tong})`);

  await prisma.$disconnect();
  if (fail > 0) {
    console.log(`\n⛔ ${fail} kiểm tra FAIL`);
    process.exit(1);
  }
  console.log('\n🎉 Runtime verify product domain đạt tất cả kiểm tra.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
