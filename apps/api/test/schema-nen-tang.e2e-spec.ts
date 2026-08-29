import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const THOI_GIAN_CHO_E2E_MS = 20_000;

const BANG_NEN_TANG = [
  'nguoi_dung',
  'khach_hang',
  'nhan_vien',
  'vai_tro',
  'quyen',
  'vai_tro_quyen',
  'nguoi_dung_vai_tro',
  'dia_chi',
] as const;

const UNIQUE_INDEXES = [
  'uk_nguoi_dung_email',
  'uk_nguoi_dung_so_dien_thoai',
  'uk_khach_hang_nguoi_dung',
  'uk_nhan_vien_nguoi_dung',
  'uk_nhan_vien_ma',
  'uk_vai_tro_ma',
  'uk_quyen_ma',
  'uk_vai_tro_quyen',
  'uk_nguoi_dung_vai_tro',
] as const;

const FOREIGN_KEYS = [
  'fk_khach_hang_nguoi_dung',
  'fk_nhan_vien_nguoi_dung',
  'fk_dia_chi_nguoi_dung',
  'fk_vai_tro_quyen_vai_tro',
  'fk_vai_tro_quyen_quyen',
  'fk_nguoi_dung_vai_tro_nguoi_dung',
  'fk_nguoi_dung_vai_tro_vai_tro',
] as const;

describe('Prisma schema nền tảng (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('có đủ 8 bảng nền tảng', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ tenBang: string }>>(
      `SELECT TABLE_NAME AS tenBang
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN (
           'nguoi_dung',
           'khach_hang',
           'nhan_vien',
           'vai_tro',
           'quyen',
           'vai_tro_quyen',
           'nguoi_dung_vai_tro',
           'dia_chi'
         )`,
    );

    expect(rows.map((row) => row.tenBang).sort()).toEqual([...BANG_NEN_TANG].sort());
  });

  it('mọi bảng có UUID CHAR(36), trạng thái và timestamps', async () => {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        tenBang: string;
        tenCot: string;
        loaiCot: string;
      }>
    >(
      `SELECT
         TABLE_NAME AS tenBang,
         COLUMN_NAME AS tenCot,
         COLUMN_TYPE AS loaiCot
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN (
           'nguoi_dung',
           'khach_hang',
           'nhan_vien',
           'vai_tro',
           'quyen',
           'vai_tro_quyen',
           'nguoi_dung_vai_tro',
           'dia_chi'
         )`,
    );

    for (const bang of BANG_NEN_TANG) {
      const cot = rows.filter((row) => row.tenBang === bang);
      const id = cot.find((row) => row.tenCot === 'id');

      expect(id?.loaiCot.toLowerCase()).toBe('char(36)');
      expect(cot.some((row) => row.tenCot === 'trang_thai')).toBe(true);
      expect(cot.some((row) => row.tenCot === 'created_at')).toBe(true);
      expect(cot.some((row) => row.tenCot === 'updated_at')).toBe(true);
    }
  });

  it('có đủ unique indexes nền tảng', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ tenIndex: string }>>(
      `SELECT DISTINCT INDEX_NAME AS tenIndex
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND NON_UNIQUE = 0
         AND INDEX_NAME <> 'PRIMARY'`,
    );

    const indexes = new Set(rows.map((row) => row.tenIndex));

    for (const ten of UNIQUE_INDEXES) {
      expect(indexes.has(ten)).toBe(true);
    }
  });

  it('có đủ foreign keys nền tảng', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ tenKhoa: string }>>(
      `SELECT DISTINCT CONSTRAINT_NAME AS tenKhoa
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );

    const khoa = new Set(rows.map((row) => row.tenKhoa));

    for (const ten of FOREIGN_KEYS) {
      expect(khoa.has(ten)).toBe(true);
    }
  });
});
