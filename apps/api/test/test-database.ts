/**
 * Helper cho e2e/true-db test: dọn sạch fixture mà test tự tạo.
 *
 * Vì sao cần
 * ----------
 * Nhiều spec tạo danh mục / sản phẩm / trang trại / kho / lô / đơn trực tiếp
 * trong MySQL rồi chỉ `app.close()` trong afterAll. Fixture đó tồn tại với
 * `trang_thai = HOAT_DONG` và bị public API trả về cho khách hàng — đây chính là
 * nguồn gốc của "San Pham AL" / "Cat AL <timestamp>" trong catalog.
 *
 * Cách dùng
 * ---------
 * ```ts
 * const donDep = taoDonDepFixture(prisma);
 * // ... tạo fixture, giữ id vào `donDep.theoDanhMuc(catId)` ...
 * afterAll(async () => { await donDep.donDep(); await app.close(); });
 * ```
 *
 * Cơ chế
 * -------
 * Dọn theo ĐỒ THỊ KHÓA NGOẠI: thu thập id gốc rồi lan tới toàn bộ bản ghi phụ
 * thuộc, xóa theo thứ tự con → cha. `inventory_transaction` là ledger bất biến
 * (trigger `trg_inventory_transaction_no_delete`), nên chỉ tạm hạ trigger trong
 * thời gian xóa rồi khôi phục ngay.
 */

import { default as mariadb } from 'mariadb';

import type { PrismaClient } from '../src/generated/prisma/client';

type Prisma = PrismaClient;

const KICH_THUOC_LO = 500;

function chiaLot<T>(items: T[]): T[][] {
  const lot: T[][] = [];
  for (let i = 0; i < items.length; i += KICH_THUOC_LO) lot.push(items.slice(i, i + KICH_THUOC_LO));
  return lot;
}

/** Xóa theo tập id, chia lô. Trả về số bản ghi đã xóa. */
async function xoaTheoId(
  prisma: Prisma,
  tenModel: keyof Prisma & string,
  cot: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const model = prisma[tenModel] as unknown as {
    findMany: (w: unknown) => Promise<{ id: string }[]>;
    deleteMany: (w: unknown) => Promise<{ count: number }>;
  };
  const danhSach = (
    await Promise.all(chiaLot(ids).map((lot) => model.findMany({ where: { id: { in: lot } }, select: { id: true } })))
  ).flat();
  let so = 0;
  for (const lot of chiaLot(danhSach.map((r) => r.id))) {
    so += (await model.deleteMany({ where: { id: { in: lot } } })).count;
  }
  return so;
}

export type DonDepFixture = {
  /** Ghi nhớ id danh mục fixture để dọn. */
  theoDanhMuc: (id: string) => void;
  /** Ghi nhớ id sản phẩm fixture. */
  theoSanPham: (id: string) => void;
  /** Ghi nhớ id trang trại fixture. */
  theoTrangTrai: (id: string) => void;
  /** Ghi nhớ id nhà cung cấp fixture. */
  theoNhaCungCap: (id: string) => void;
  /** Ghi nhớ id kho fixture. */
  theoKho: (id: string) => void;
  /** Ghi nhớ id lô sản phẩm fixture. */
  theoLoSanPham: (id: string) => void;
  /** Ghi nhớ id biến thể fixture. */
  theoBienThe: (id: string) => void;
  /** Ghi nhớ id người dùng fixture (sẽ kéo theo khách hàng, giỏ hàng, địa chỉ). */
  theoNguoiDung: (id: string) => void;
  /** Ghi nhớ id khách hàng fixture. */
  theoKhachHang: (id: string) => void;
  /** Ghi nhớ id đơn hàng fixture. */
  theoDonHang: (id: string) => void;
  /** Ghi nhớ id voucher fixture. */
  theoKhuyenMai: (id: string) => void;
  /** Ghi nhớ id khoản thưởng khách hàng (loyalty account). */
  theoTaiKhoanLoyalty: (id: string) => void;
  /** Ghi nhớ id chứng nhận fixture. */
  theoChungNhan: (id: string) => void;
  /** Báo cáo số bản ghi đã xóa theo entity. */
  thongKe: () => Record<string, number>;
  /** Xóa toàn bộ fixture đã ghi nhớ. Idempotent. */
  donDep: () => Promise<void>;
};

export function taoDonDepFixture(prisma: Prisma): DonDepFixture {
  const danhMuc = new Set<string>();
  const sanPham = new Set<string>();
  const trangTrai = new Set<string>();
  const nhaCungCap = new Set<string>();
  const kho = new Set<string>();
  const loSanPham = new Set<string>();
  const bienThe = new Set<string>();
  const nguoiDung = new Set<string>();
  const khachHang = new Set<string>();
  const donHang = new Set<string>();
  const khuyenMai = new Set<string>();
  const taiKhoanLoyalty = new Set<string>();
  const chungNhan = new Set<string>();
  const thongKe: Record<string, number> = {};

  const ghi = (ten: string, so: number) => {
    if (so > 0) thongKe[ten] = (thongKe[ten] ?? 0) + so;
  };

  const donDep = async () => {
    // Mở rộng tập fixture: sản phẩm kéo theo biến thể + ảnh + wishlist,
    // biến thể kéo theo tồn kho + giỏ hàng, lô kéo theo tồn kho + thu hoạch.
    for (const id of sanPham) {
      for (const b of await prisma.bienTheSanPham.findMany({ where: { sanPhamId: id }, select: { id: true } })) {
        bienThe.add(b.id);
      }
    }
    for (const id of bienThe) {
      for (const t of await prisma.tonKhoLo.findMany({ where: { bienTheSanPhamId: id }, select: { id: true, loSanPhamId: true, khoId: true } })) {
        loSanPham.add(t.loSanPhamId);
        kho.add(t.khoId);
      }
    }
    for (const id of loSanPham) {
      const lo = await prisma.loSanPham.findUnique({ where: { id }, select: { thuHoachId: true } });
      if (!lo) continue;
      const thuHoach = await prisma.thuHoach.findUnique({
        where: { id: lo.thuHoachId },
        select: { muaVuId: true },
      });
      if (thuHoach) await xoaTheoId(prisma, 'nhatKyCanhTac', 'id', (
        await prisma.nhatKyCanhTac.findMany({ where: { muaVuId: thuHoach.muaVuId }, select: { id: true } })
      ).map((r) => r.id));
    }
    for (const id of nguoiDung) {
      for (const k of await prisma.khachHang.findMany({ where: { nguoiDungId: id }, select: { id: true } })) {
        khachHang.add(k.id);
      }
    }
    for (const id of khachHang) {
      for (const d of await prisma.donHang.findMany({ where: { khachHangId: id }, select: { id: true } })) {
        donHang.add(d.id);
      }
    }

    // --- Xóa theo thứ tự khóa ngoại (con trước, cha sau) ---
    for (const id of donHang) {
      const subIds = (await prisma.donHangNhaCungCap.findMany({ where: { donHangId: id }, select: { id: true } })).map((r) => r.id);
      const itemIds = (await prisma.mucDonHang.findMany({ where: { donHangNhaCungCapId: { in: subIds } }, select: { id: true } })).map((r) => r.id);
      const vanIds = (await prisma.vanChuyen.findMany({ where: { donHangNhaCungCapId: { in: subIds } }, select: { id: true } })).map((r) => r.id);
      const payIds = (await prisma.thanhToan.findMany({ where: { donHangId: id }, select: { id: true } })).map((r) => r.id);
      const hdIds = (await prisma.hoaDonBanHangNoiBo.findMany({ where: { donHangId: id }, select: { id: true } })).map((r) => r.id);

      ghi('suKienTheoDoiVanChuyen', await xoaTheoId(prisma, 'suKienTheoDoiVanChuyen', 'id', (await prisma.suKienTheoDoiVanChuyen.findMany({ where: { vanChuyenId: { in: vanIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('vanChuyen', await xoaTheoId(prisma, 'vanChuyen', 'id', vanIds));
      ghi('thongBaoThuHoi', await xoaTheoId(prisma, 'thongBaoThuHoi', 'id', (await prisma.thongBaoThuHoi.findMany({ where: { donHangId: id }, select: { id: true } })).map((r) => r.id)));
      ghi('khieuNaiBangChung', await xoaTheoId(prisma, 'khieuNaiBangChung', 'id', (await prisma.khieuNaiBangChung.findMany({ where: { khieuNai: { mucDonHangId: { in: itemIds } } }, select: { id: true } })).map((r) => r.id)));
      ghi('khieuNai', await xoaTheoId(prisma, 'khieuNai', 'id', (await prisma.khieuNai.findMany({ where: { mucDonHangId: { in: itemIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('danhGia', await xoaTheoId(prisma, 'danhGia', 'id', (await prisma.danhGia.findMany({ where: { mucDonHangId: { in: itemIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('phanBoHoanTien', await xoaTheoId(prisma, 'phanBoHoanTien', 'id', (await prisma.phanBoHoanTien.findMany({ where: { OR: [{ mucDonHangId: { in: itemIds } }, { donHangId: id }] }, select: { id: true } })).map((r) => r.id)));
      ghi('phanBoDonHang', await xoaTheoId(prisma, 'phanBoDonHang', 'id', (await prisma.phanBoDonHang.findMany({ where: { mucDonHangId: { in: itemIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('mucDonHang', await xoaTheoId(prisma, 'mucDonHang', 'id', itemIds));
      ghi('giaoDichThanhToan', await xoaTheoId(prisma, 'giaoDichThanhToan', 'id', (await prisma.giaoDichThanhToan.findMany({ where: { thanhToanId: { in: payIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('thanhToan', await xoaTheoId(prisma, 'thanhToan', 'id', payIds));
      ghi('hoaDonBanHangNoiBoDong', await xoaTheoId(prisma, 'hoaDonBanHangNoiBoDong', 'id', (await prisma.hoaDonBanHangNoiBoDong.findMany({ where: { hoaDonId: { in: hdIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('hoaDonBanHangNoiBo', await xoaTheoId(prisma, 'hoaDonBanHangNoiBo', 'id', hdIds));
      ghi('phieuKho', await xoaTheoId(prisma, 'phieuKho', 'id', (await prisma.phieuKho.findMany({ where: { donHangId: id }, select: { id: true } })).map((r) => r.id)));
      ghi('donHangNhaCungCap', await xoaTheoId(prisma, 'donHangNhaCungCap', 'id', subIds));
      ghi('donHang', await xoaTheoId(prisma, 'donHang', 'id', [id]));
    }

    // Ledger tồn kho là bất biến (trigger DB). Tạm hạ trigger, xóa, khôi phục.
    const lotIds = (
      await prisma.tonKhoLo.findMany({
        where: { OR: [{ bienTheSanPhamId: { in: [...bienThe] } }, { loSanPhamId: { in: [...loSanPham] } }, { khoId: { in: [...kho] } }] },
        select: { id: true },
      })
    ).map((r) => r.id);

    if (lotIds.length > 0) {
      const datChoIds = (await prisma.datChoTonKho.findMany({ where: { muc: { some: { tonKhoLoId: { in: lotIds } } } }, select: { id: true } })).map((r) => r.id);
      ghi('mucDatChoTonKho', await xoaTheoId(prisma, 'mucDatChoTonKho', 'id', (await prisma.mucDatChoTonKho.findMany({ where: { datChoTonKhoId: { in: datChoIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('datChoTonKho', await xoaTheoId(prisma, 'datChoTonKho', 'id', datChoIds));
      ghi('phanBoDonHang', await xoaTheoId(prisma, 'phanBoDonHang', 'id', (await prisma.phanBoDonHang.findMany({ where: { tonKhoLoId: { in: lotIds } }, select: { id: true } })).map((r) => r.id)));
      ghi('phieuKhoDong', await xoaTheoId(prisma, 'phieuKhoDong', 'id', (await prisma.phieuKhoDong.findMany({ where: { OR: [{ tonKhoLoId: { in: lotIds } }, { tonKhoLoDichId: { in: lotIds } }] }, select: { id: true } })).map((r) => r.id)));

      const TRIGGER = 'trg_inventory_transaction_no_delete';
      const rows = await prisma.$queryRawUnsafe<unknown[]>(
        'SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ?',
        TRIGGER,
      );
      if (rows.length > 0) {
        // CREATE/DROP TRIGGER không chạy được qua prepared statement của Prisma.
        const url = new URL(process.env.TEST_DATABASE_URL ?? '');
        const conn = await mariadb.createConnection({
          host: url.hostname,
          port: Number(url.port || '3306'),
          user: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          database: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
        });
        try {
          await conn.query(`DROP TRIGGER IF EXISTS \`${TRIGGER}\``);
          ghi('giaoDichTonKho', await xoaTheoId(prisma, 'giaoDichTonKho', 'id', (await prisma.giaoDichTonKho.findMany({ where: { tonKhoLoId: { in: lotIds } }, select: { id: true } })).map((r) => r.id)));
        } finally {
          await conn.query(`
            CREATE TRIGGER \`${TRIGGER}\`
            BEFORE DELETE ON \`inventory_transaction\`
            FOR EACH ROW
            BEGIN
              SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Inventory transaction ledger is immutable; append a new transaction';
            END`);
          await conn.end();
        }
      } else {
        ghi('giaoDichTonKho', await xoaTheoId(prisma, 'giaoDichTonKho', 'id', (await prisma.giaoDichTonKho.findMany({ where: { tonKhoLoId: { in: lotIds } }, select: { id: true } })).map((r) => r.id)));
      }
      ghi('tonKhoLo', await xoaTheoId(prisma, 'tonKhoLo', 'id', lotIds));
    }

    ghi('mucGioHang', await xoaTheoId(prisma, 'mucGioHang', 'id', (await prisma.mucGioHang.findMany({ where: { OR: [{ gioHang: { khachHangId: { in: [...khachHang] } } }, { bienTheSanPhamId: { in: [...bienThe] } }] }, select: { id: true } })).map((r) => r.id)));
    ghi('gioHang', await xoaTheoId(prisma, 'gioHang', 'id', (await prisma.gioHang.findMany({ where: { khachHangId: { in: [...khachHang] } }, select: { id: true } })).map((r) => r.id)));

    // MucDonHang của đơn KHÔNG nằm trong donHang (ví dụ đơn hợp lệ tham chiếu
    // sản phẩm fixture) vẫn phải được dọn để giải phóng bien_the_san_pham_id.
    ghi('phanBoDonHang', await xoaTheoId(prisma, 'phanBoDonHang', 'id', (await prisma.phanBoDonHang.findMany({ where: { mucDonHang: { bienTheSanPhamId: { in: [...bienThe] } } }, select: { id: true } })).map((r) => r.id)));
    ghi('danhGia', await xoaTheoId(prisma, 'danhGia', 'id', (await prisma.danhGia.findMany({ where: { mucDonHang: { bienTheSanPhamId: { in: [...bienThe] } } }, select: { id: true } })).map((r) => r.id)));

    ghi('mucFlashSale', await xoaTheoId(prisma, 'mucFlashSale', 'id', (await prisma.mucFlashSale.findMany({ where: { bienTheSanPhamId: { in: [...bienThe] } }, select: { id: true } })).map((r) => r.id)));
    ghi('chienDichFlashSale', await xoaTheoId(prisma, 'chienDichFlashSale', 'id', (await prisma.chienDichFlashSale.findMany({ where: { muc: { none: { bienTheSanPhamId: { in: [...bienThe] } } } }, select: { id: true } })).map((r) => r.id)));

    ghi('khachHangKhuyenMai', await xoaTheoId(prisma, 'khachHangKhuyenMai', 'id', (await prisma.khachHangKhuyenMai.findMany({ where: { OR: [{ khachHangId: { in: [...khachHang] } }, { khuyenMaiId: { in: [...khuyenMai] } }] }, select: { id: true } })).map((r) => r.id)));
    ghi('giaoDichLoyalty', await xoaTheoId(prisma, 'giaoDichLoyalty', 'id', (await prisma.giaoDichLoyalty.findMany({ where: { loyaltyAccountId: { in: [...taiKhoanLoyalty] } }, select: { id: true } })).map((r) => r.id)));
    ghi('taiKhoanLoyalty', await xoaTheoId(prisma, 'taiKhoanLoyalty', 'id', [...taiKhoanLoyalty]));
    ghi('khuyenMai', await xoaTheoId(prisma, 'khuyenMai', 'id', [...khuyenMai]));

    ghi('sanPhamYeuThich', await xoaTheoId(prisma, 'sanPhamYeuThich', 'id', (await prisma.sanPhamYeuThich.findMany({ where: { sanPhamId: { in: [...sanPham] } }, select: { id: true } })).map((r) => r.id)));
    ghi('theoDoiTrangTrai', await xoaTheoId(prisma, 'theoDoiTrangTrai', 'id', (await prisma.theoDoiTrangTrai.findMany({ where: { trangTraiId: { in: [...trangTrai] } }, select: { id: true } })).map((r) => r.id)));
    // ThongBaoThuHoach trỏ tới thuHoach, không trực tiếp tới lô.
    const thuHoachFixtureIds = (
      await prisma.thuHoach.findMany({
        where: { loSanPham: { some: { id: { in: [...loSanPham] } } } },
        select: { id: true },
      })
    ).map((r) => r.id);
    ghi('thongBaoThuHoach', await xoaTheoId(prisma, 'thongBaoThuHoach', 'id', (await prisma.thongBaoThuHoach.findMany({ where: { thuHoachId: { in: thuHoachFixtureIds } }, select: { id: true } })).map((r) => r.id)));
    ghi('thongBaoThuHoi', await xoaTheoId(prisma, 'thongBaoThuHoi', 'id', (await prisma.thongBaoThuHoi.findMany({ where: { loSanPhamId: { in: [...loSanPham] } }, select: { id: true } })).map((r) => r.id)));

    ghi('sanPhamAnh', await xoaTheoId(prisma, 'sanPhamAnh', 'id', (await prisma.sanPhamAnh.findMany({ where: { sanPhamId: { in: [...sanPham] } }, select: { id: true } })).map((r) => r.id)));
    ghi('khuyenMai', await xoaTheoId(prisma, 'khuyenMai', 'id', (await prisma.khuyenMai.findMany({ where: { OR: [{ sanPhamId: { in: [...sanPham] } }, { danhMucSanPhamId: { in: [...danhMuc] } }] }, select: { id: true } })).map((r) => r.id)));
    // BienTheSanPham giữ san_pham_id (Restrict) và mucDonHang/mucGioHang giữ
    // bien_the_san_pham_id — dọn biến thể TRƯỚC sản phẩm.
    ghi('bienTheSanPham', await xoaTheoId(prisma, 'bienTheSanPham', 'id', [...bienThe]));
    ghi('sanPham', await xoaTheoId(prisma, 'sanPham', 'id', [...sanPham]));
    ghi('danhMucSanPham', await xoaTheoId(prisma, 'danhMucSanPham', 'id', [...danhMuc]));

    ghi('chungNhan', await xoaTheoId(prisma, 'chungNhan', 'id', [...chungNhan]));
    ghi('trangTraiAnh', await xoaTheoId(prisma, 'trangTraiAnh', 'id', (await prisma.trangTraiAnh.findMany({ where: { trangTraiId: { in: [...trangTrai] } }, select: { id: true } })).map((r) => r.id)));
    ghi('suKienTruyXuat', await xoaTheoId(prisma, 'suKienTruyXuat', 'id', (await prisma.suKienTruyXuat.findMany({ where: { loSanPhamId: { in: [...loSanPham] } }, select: { id: true } })).map((r) => r.id)));
    const kdIds = (await prisma.kiemDinhChatLuong.findMany({ where: { loSanPhamId: { in: [...loSanPham] } }, select: { id: true } })).map((r) => r.id);
    ghi('kiemDinhChatLuongAnh', await xoaTheoId(prisma, 'kiemDinhChatLuongAnh', 'id', (await prisma.kiemDinhChatLuongAnh.findMany({ where: { kiemDinhChatLuongId: { in: kdIds } }, select: { id: true } })).map((r) => r.id)));
    ghi('kiemDinhChatLuong', await xoaTheoId(prisma, 'kiemDinhChatLuong', 'id', kdIds));
    ghi('thuHoiLoSanPham', await xoaTheoId(prisma, 'thuHoiLoSanPham', 'id', (await prisma.thuHoiLoSanPham.findMany({ where: { loSanPhamId: { in: [...loSanPham] } }, select: { id: true } })).map((r) => r.id)));
    ghi('loSanPham', await xoaTheoId(prisma, 'loSanPham', 'id', [...loSanPham]));
    ghi('thuHoach', await xoaTheoId(prisma, 'thuHoach', 'id', thuHoachFixtureIds));

    // MuaVu giữ trangTraiId (Restrict) — phải dọn trước trang trại.
    const muaVuFixtureIds = (
      await prisma.muaVu.findMany({
        where: { OR: [{ trangTraiId: { in: [...trangTrai] } }, { thuHoach: { some: { id: { in: thuHoachFixtureIds } } } }] },
        select: { id: true },
      })
    ).map((r) => r.id);
    ghi('nhatKyCanhTac', await xoaTheoId(prisma, 'nhatKyCanhTac', 'id', (await prisma.nhatKyCanhTac.findMany({ where: { muaVuId: { in: muaVuFixtureIds } }, select: { id: true } })).map((r) => r.id)));
    ghi('muaVu', await xoaTheoId(prisma, 'muaVu', 'id', muaVuFixtureIds));

    ghi('kho', await xoaTheoId(prisma, 'kho', 'id', [...kho]));
    ghi('trangTrai', await xoaTheoId(prisma, 'trangTrai', 'id', [...trangTrai]));
    ghi('nhaCungCap', await xoaTheoId(prisma, 'nhaCungCap', 'id', [...nhaCungCap]));

    ghi('diaChi', await xoaTheoId(prisma, 'diaChi', 'id', (await prisma.diaChi.findMany({ where: { nguoiDungId: { in: [...nguoiDung] } }, select: { id: true } })).map((r) => r.id)));
    ghi('khachHang', await xoaTheoId(prisma, 'khachHang', 'id', [...khachHang]));
    ghi('nguoiDung', await xoaTheoId(prisma, 'nguoiDung', 'id', [...nguoiDung]));

    // Chạy lại lần hai phải là 0 thay đổi → chỉ log khi thực sự dọn gì,
    // để log tự chứng minh tính idempotent.
    const tong = Object.values(thongKe).reduce((a, b) => a + b, 0);
    if (tong > 0) {
      console.log('[fixture-cleanup] Đã dọn:', JSON.stringify(thongKe));
    }
  };

  return {
    theoDanhMuc: (id) => danhMuc.add(id),
    theoSanPham: (id) => sanPham.add(id),
    theoTrangTrai: (id) => trangTrai.add(id),
    theoNhaCungCap: (id) => nhaCungCap.add(id),
    theoKho: (id) => kho.add(id),
    theoLoSanPham: (id) => loSanPham.add(id),
    theoBienThe: (id) => bienThe.add(id),
    theoNguoiDung: (id) => nguoiDung.add(id),
    theoKhachHang: (id) => khachHang.add(id),
    theoDonHang: (id) => donHang.add(id),
    theoKhuyenMai: (id) => khuyenMai.add(id),
    theoTaiKhoanLoyalty: (id) => taiKhoanLoyalty.add(id),
    theoChungNhan: (id) => chungNhan.add(id),
    thongKe: () => thongKe,
    donDep,
  };
}
