import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { cauHinhUngDung } from '../src/cau-hinh-ung-dung';
import { PrismaService } from '../src/database/prisma.service';
import { TrangThaiLoSanPham } from '../src/generated/prisma/client';

/**
 * RELEASE AUDIT FINAL — mã nghiệp vụ + parity Customer/Admin.
 * - KH: KhachHang.maKhachHang KH-YYYYMMDD-XXXXXX, server-generated, unique, Admin search được.
 * - KN: KhieuNai.maKhieuNai KN-YYYYMMDD-XXXXXX, Customer/Admin cùng thấy, search được.
 * - ORD: DonHang.maYeuCau (UUID idempotency UNIQUE) tách khỏi maDonHang (ORD-... UNIQUE giữ compat).
 *   Retry cùng maYeuCau idempotent, khác tài khoản bị 409.
 */
describe('Business codes final (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `bizcode-${suffix}@example.com`;
  const password = 'MatKhau-BizCode-123';
  let customerToken = '';
  let adminToken = '';
  let maKhachHang = '';
  let diaChiId = '';
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    cauHinhUngDung(app);
    await app.init();
    prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-ky')
      .send({
        email,
        matKhau: password,
        hoTen: 'Khách Business Code Final',
        soDienThoai: `07${Date.now().toString().slice(-8)}`,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/xac-thuc/dang-nhap')
      .send({ email, matKhau: password, nenTang: 'MOBILE' })
      .expect(200);
    customerToken = login.body.accessToken as string;

    // Admin token: lấy admin seed từ RBAC (tạo nếu thiếu).
    const adminEmail = `bizcode-admin-${suffix}@example.com`;
    const adminPass = 'Admin-BizCode-123';
    let admin = await prisma.nguoiDung.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      const { hash } = await import('node:crypto').catch(() => ({ hash: '' }));
      void hash;
      const argon2 = await import('argon2');
      admin = await prisma.nguoiDung.create({
        data: {
          email: adminEmail,
          matKhauHash: await argon2.hash(adminPass),
          hoTen: 'Admin BizCode',
          trangThai: 'HOAT_DONG',
        },
      });
      const vaiTro = await prisma.vaiTro.findFirst({ where: { ma: 'ADMIN' } });
      if (vaiTro) {
        await prisma.nguoiDungVaiTro.create({
          data: { nguoiDungId: admin.id, vaiTroId: vaiTro.id },
        });
      }
    }
    const jwt = app.get(JwtService);
    const secret = process.env.JWT_ACCESS_SECRET ?? 'agrimarket-local-access-secret-change-before-production-012';
    adminToken = await jwt.signAsync({ sub: admin.id, loai: 'access' }, { secret });

    const diaChi = await request(app.getHttpServer())
      .post('/api/v1/khach-hang/dia-chi')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tenNguoiNhan: 'Khách BizCode',
        soDienThoai: '0912345678',
        dongDiaChi: '12 Phố Hiến',
        phuongXa: 'Phường Phố Hiến',
        tinhThanh: 'Hưng Yên',
        macDinh: true,
      })
      .expect(201);
    diaChiId = diaChi.body.id as string;

    // Fixture 2 supplier/farm để chứng minh multi-supplier.
    const supplierA = await prisma.nhaCungCap.create({
      data: { ma: `NCC-BC-A-${suffix}`.slice(0, 50), ten: 'NCC BizCode A' },
    });
    const supplierB = await prisma.nhaCungCap.create({
      data: { ma: `NCC-BC-B-${suffix}`.slice(0, 50), ten: 'NCC BizCode B' },
    });
    const farmA = await prisma.trangTrai.create({
      data: { ma: `FARM-BC-A-${suffix}`.slice(0, 50), ten: 'Farm BizCode A', diaChi: 'Hưng Yên', nhaCungCapId: supplierA.id },
    });
    const farmB = await prisma.trangTrai.create({
      data: { ma: `FARM-BC-B-${suffix}`.slice(0, 50), ten: 'Farm BizCode B', diaChi: 'Hưng Yên', nhaCungCapId: supplierB.id },
    });
    const category = await prisma.danhMucSanPham.create({
      data: { ten: `Danh mục BizCode ${suffix}`, slug: `danh-muc-bizcode-${suffix}`.slice(0, 191) },
    });
    const productA = await prisma.sanPham.create({
      data: { ten: `SP BizCode A ${suffix}`, trangTraiId: farmA.id, danhMucSanPhamId: category.id },
    });
    const productB = await prisma.sanPham.create({
      data: { ten: `SP BizCode B ${suffix}`, trangTraiId: farmB.id, danhMucSanPhamId: category.id },
    });
    const variantA = await prisma.bienTheSanPham.create({
      data: { sanPhamId: productA.id, sku: `SKU-BC-A-${suffix}`.slice(0, 100), khoiLuong: 1, gia: 50000, donVi: 'kg' },
    });
    const variantB = await prisma.bienTheSanPham.create({
      data: { sanPhamId: productB.id, sku: `SKU-BC-B-${suffix}`.slice(0, 100), khoiLuong: 1, gia: 70000, donVi: 'kg' },
    });
    const warehouse = await prisma.kho.create({
      data: { maKho: `KHO-BC-${suffix}`.slice(0, 50), ten: 'Kho BizCode', diaChi: 'Hưng Yên' },
    });
    const now = new Date();
    const muaVuA = await prisma.muaVu.create({
      data: { trangTraiId: farmA.id, cayTrong: 'Rau', giong: 'G1', ngayTrong: new Date('2026-01-01'), ngayDuKienThuHoach: new Date('2026-02-01'), sanLuongDuKienKg: 100 },
    });
    const thuHoachA = await prisma.thuHoach.create({
      data: { muaVuId: muaVuA.id, ngayThuHoach: new Date('2026-02-01'), soLuong: 100, donVi: 'kg', phanLoai: 'A' },
    });
    const loA = await prisma.loSanPham.create({
      data: { maLo: `LO-BC-A-${suffix}`.slice(0, 100), thuHoachId: thuHoachA.id, soLuong: 100, conLai: 100, ngayHetHan: new Date('2027-01-01'), trangThai: TrangThaiLoSanPham.CO_THE_BAN },
    });
    const muaVuB = await prisma.muaVu.create({
      data: { trangTraiId: farmB.id, cayTrong: 'Rau', giong: 'G1', ngayTrong: new Date('2026-01-01'), ngayDuKienThuHoach: new Date('2026-02-01'), sanLuongDuKienKg: 100 },
    });
    const thuHoachB = await prisma.thuHoach.create({
      data: { muaVuId: muaVuB.id, ngayThuHoach: new Date('2026-02-01'), soLuong: 100, donVi: 'kg', phanLoai: 'A' },
    });
    const loB = await prisma.loSanPham.create({
      data: { maLo: `LO-BC-B-${suffix}`.slice(0, 100), thuHoachId: thuHoachB.id, soLuong: 100, conLai: 100, ngayHetHan: new Date('2027-01-01'), trangThai: TrangThaiLoSanPham.CO_THE_BAN },
    });
    const invA = await prisma.tonKhoLo.create({
      data: { khoId: warehouse.id, loSanPhamId: loA.id, bienTheSanPhamId: variantA.id, onHand: 50, reserved: 0, blocked: 0 },
    });
    const invB = await prisma.tonKhoLo.create({
      data: { khoId: warehouse.id, loSanPhamId: loB.id, bienTheSanPhamId: variantB.id, onHand: 50, reserved: 0, blocked: 0 },
    });
    Object.assign(ids, {
      supplierA: supplierA.id, supplierB: supplierB.id,
      variantA: variantA.id, variantB: variantB.id,
      invA: invA.id, invB: invB.id,
    });
    void now;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('3.1 KhachHang có maKhachHang KH-..., profile + admin cùng thấy, search được', async () => {
    const profile = await request(app.getHttpServer())
      .get('/api/v1/khach-hang/ho-so')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(profile.body.maKhachHang).toMatch(/^KH-\d{8}-[0-9A-Z]{6}$/);
    maKhachHang = profile.body.maKhachHang as string;

    const adminList = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khach-hang?timKiem=${encodeURIComponent(maKhachHang)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminList.body.items.some((i: { maKhachHang: string }) => i.maKhachHang === maKhachHang)).toBe(true);
  });

  it('3.3 Create Order tách maYeuCau/maDonHang, retry idempotent, multi-supplier', async () => {
    // Thêm giỏ 2 variant thuộc 2 supplier.
    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bienTheSanPhamId: ids.variantA, soLuong: 2 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/gio-hang/muc')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bienTheSanPhamId: ids.variantB, soLuong: 1 })
      .expect(201);

    const preview = await request(app.getHttpServer())
      .get(`/api/v1/gio-hang/checkout-preview?diaChiGiaoHangId=${diaChiId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    const giaA = 50000;
    const giaB = 70000;
    void preview;

    const maYeuCau = randomUUID();
    const maDonHang = `ORD-${maYeuCau.replaceAll('-', '').toUpperCase()}`;
    const tao = (key: string) =>
      request(app.getHttpServer())
        .post('/api/v1/don-hang')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          maYeuCau: key,
          diaChiGiaoHangId: diaChiId,
          items: [
            { bienTheSanPhamId: ids.variantA, soLuong: 2, donGiaDuKien: giaA },
            { bienTheSanPhamId: ids.variantB, soLuong: 1, donGiaDuKien: giaB },
          ],
        });

    const first = await tao(maYeuCau).expect(201);
    expect(first.body.maDonHang).toBe(maDonHang);
    expect(first.body.maYeuCau).toBe(maYeuCau);
    expect(first.body.donNhaCungCap).toHaveLength(2);
    const maDons = (first.body.donNhaCungCap as Array<{ maDon: string }>).map((s) => s.maDon);
    expect(new Set(maDons).size).toBe(2);
    for (const maDon of maDons) expect(maDon.startsWith(`${maDonHang}-`)).toBe(true);

    const retry = await tao(maYeuCau).expect(201);
    expect(retry.body.id).toBe(first.body.id);
    expect(retry.body.maDonHang).toBe(maDonHang);
    expect(retry.body.maYeuCau).toBe(maYeuCau);

    const count = await prisma.donHang.count({ where: { maYeuCau } });
    expect(count).toBe(1);

    // Admin thấy cùng order id/maDonHang/maYeuCau/items.
    const adminDetail = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/don-hang/${first.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminDetail.body.maDonHang).toBe(maDonHang);
    expect(adminDetail.body.maYeuCau).toBe(maYeuCau);

    const customerDetail = await request(app.getHttpServer())
      .get(`/api/v1/don-hang/${first.body.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(customerDetail.body.maDonHang).toBe(maDonHang);
    expect(customerDetail.body.maYeuCau).toBe(maYeuCau);

    // DB reservation/allocation integrity.
    const dbOrder = await prisma.donHang.findUniqueOrThrow({
      where: { id: first.body.id },
      include: { donNhaCungCap: { include: { muc: { include: { phanBo: true } } } } },
    });
    expect(dbOrder.donNhaCungCap).toHaveLength(2);
    for (const sub of dbOrder.donNhaCungCap) {
      for (const muc of sub.muc) {
        expect(muc.phanBo.length).toBeGreaterThan(0);
        const tong = muc.phanBo.reduce((t, p) => t + Number(p.soLuong), 0);
        expect(tong).toBe(muc.soLuong);
      }
    }
  });

  it('3.2 KhieuNai có maKhieuNai KN-..., customer/admin cùng thấy và search được', async () => {
    // Lấy 1 order item vừa tạo, đánh dấu đã giao để đủ điều kiện khiếu nại.
    const order = await prisma.donHang.findFirst({
      where: { maDonHang: { startsWith: 'ORD-' } },
      orderBy: { createdAt: 'desc' },
      include: { donNhaCungCap: { include: { muc: true, vanChuyen: true } } },
    });
    expect(order).toBeTruthy();
    const muc = order!.donNhaCungCap.flatMap((s) => s.muc)[0]!;
    const subId = order!.donNhaCungCap[0]!.id;

    // Tạo shipment DELIVERED để qua gate "chỉ item đã giao mới khiếu nại".
    const shipment = await prisma.vanChuyen.create({
      data: { donHangNhaCungCapId: subId, maVanDon: `MOCK-BC-${suffix}-S1`.slice(0, 191), trangThai: 'DELIVERED' },
    });
    await prisma.suKienTheoDoiVanChuyen.create({
      data: { vanChuyenId: shipment.id, trangThai: 'DELIVERED', moTa: 'Đã giao (bizcode test)' },
    });
    await prisma.donHangNhaCungCap.update({ where: { id: subId }, data: { trangThai: 'DA_GIAO' } });

    const tao = await request(app.getHttpServer())
      .post('/api/v1/khieu-nai')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ mucDonHangId: muc.id, lyDo: 'HONG', moTa: 'Hàng bị hỏng khi nhận (bizcode test).' })
      .expect(201);
    expect(tao.body.maKhieuNai).toMatch(/^KN-\d{8}-[0-9A-Z]{6}$/);
    const maKhieuNai = tao.body.maKhieuNai as string;

    const customerList = await request(app.getHttpServer())
      .get(`/api/v1/khieu-nai/cua-toi?tuKhoa=${encodeURIComponent(maKhieuNai)}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(customerList.body.items.some((i: { maKhieuNai: string }) => i.maKhieuNai === maKhieuNai)).toBe(true);

    const adminList = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khieu-nai?tuKhoa=${encodeURIComponent(maKhieuNai)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminList.body.items.some((i: { maKhieuNai: string }) => i.maKhieuNai === maKhieuNai)).toBe(true);

    const customerDetail = await request(app.getHttpServer())
      .get(`/api/v1/khieu-nai/cua-toi/${tao.body.id}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(customerDetail.body.maKhieuNai).toBe(maKhieuNai);

    const adminDetail = await request(app.getHttpServer())
      .get(`/api/v1/quan-tri/khieu-nai/${tao.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminDetail.body.maKhieuNai).toBe(maKhieuNai);
  });
});
