import { GiaHieuLucService } from './gia-hieu-luc.service';
import type { PrismaService } from '../../database/prisma.service';

/**
 * Unit test DB-free cho GiaHieuLucService (server-side effective price resolver).
 *
 * - Lọc thời gian/trạng thái (campaign HOAT_DONG, item HOAT_DONG,
 *   batDauLuc <= now <= ketThucLuc) được ủy quyền cho Prisma `where` — spec
 *   này assert cấu trúc `where` thực tế service gửi đi, và fake db áp đúng
 *   các ràng buộc đó như MySQL sẽ làm.
 * - Quy tắc giá/tồn (0 < giaFlash < giaGoc, tồn khả dụng > 0, chọn giá thấp
 *   nhất khi trùng) nằm trong code nên được kiểm tra hành vi trực tiếp.
 * - Luồng cart/checkout-preview/create-order dùng chung resolver được phủ bởi
 *   gia-hieu-luc.e2e-spec.ts (cần MySQL); ở đây chỉ chứng minh resolver.
 */

type FakeMuc = {
  id: string;
  chienDichId: string;
  bienTheSanPhamId: string;
  giaFlash: number;
  gioiHanTong?: number | null;
  soLuongDaBan?: number;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  chienDich: {
    trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
    batDauLuc: Date;
    ketThucLuc: Date;
  };
};

type FakeDbOptions = {
  giaGoc?: number;
  lots?: Array<{ onHand: number; reserved: number; blocked: number }>;
  muc?: FakeMuc[];
};

// Kiểu tham số `db` của resolveNhieu (GiaHieuLucDb) — dùng indexed access để
// fake db khớp chữ ký thật mà không cần export thêm type từ service.
type FakeDbParam = NonNullable<Parameters<GiaHieuLucService['resolveNhieu']>[2]>;

type WhereMucFlashSale = {
  bienTheSanPhamId?: { in?: string[] };
  trangThai?: string;
  chienDich?: {
    trangThai?: string;
    batDauLuc?: { lte?: Date };
    ketThucLuc?: { gte?: Date };
  };
};

type WhereBienThe = {
  id?: { in?: string[] };
};

const NOW = new Date('2026-09-01T12:00:00.000Z');
const VARIANT_ID = 'variant-001';
const GIA_GOC = 50000;
const GIA_FLASH = 40000;

function taoFakeDb(variantIds: string[], options: FakeDbOptions = {}) {
  const { giaGoc = GIA_GOC, lots = [{ onHand: 50, reserved: 0, blocked: 0 }], muc = [] } = options;
  const seenWhere: Array<{ model: string; where: unknown }> = [];

  const locMucTheoWhere = (where: WhereMucFlashSale | undefined): FakeMuc[] =>
    muc.filter((item) => {
      if (
        where?.bienTheSanPhamId?.in &&
        !where.bienTheSanPhamId.in.includes(item.bienTheSanPhamId)
      ) {
        return false;
      }
      if (where?.trangThai && item.trangThai !== where.trangThai) return false;
      const chSch = where?.chienDich;
      if (!chSch) return true;
      if (chSch.trangThai && item.chienDich.trangThai !== chSch.trangThai) return false;
      // Fake áp đúng ràng buộc thời gian như MySQL sẽ làm với where này.
      if (chSch.batDauLuc?.lte && !(item.chienDich.batDauLuc <= chSch.batDauLuc.lte)) return false;
      if (chSch.ketThucLuc?.gte && !(item.chienDich.ketThucLuc >= chSch.ketThucLuc.gte)) return false;
      return true;
    });

  const db = {
    bienTheSanPham: {
      findMany: jest.fn(async ({ where }: { where?: WhereBienThe }) =>
        variantIds
          .filter((id) => !where?.id?.in || where.id.in.includes(id))
          .map((id) => ({ id, gia: giaGoc })),
      ),
    },
    tonKhoLo: {
      findMany: jest.fn(async () =>
        variantIds.flatMap((bienTheSanPhamId) =>
          lots.map((lot) => ({ bienTheSanPhamId, ...lot })),
        ),
      ),
    },
    mucFlashSale: {
      findMany: jest.fn(async ({ where }: { where?: WhereMucFlashSale }) => {
        seenWhere.push({ model: 'mucFlashSale', where });
        // Fake mô phỏng đúng ORDER BY của service (giaFlash asc, id asc) như
        // MySQL sẽ làm, để quy tắc "trùng lịch => giá thấp nhất" được kiểm tra.
        return locMucTheoWhere(where)
          .map((m) => ({
            gioiHanTong: null,
            soLuongDaBan: 0,
            ...m,
          }))
          .sort(
            (a, b) => a.giaFlash - b.giaFlash || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
          );
      }),
    },
  };

  return { db: db as unknown as FakeDbParam, seenWhere };
}

function taoService() {
  return new GiaHieuLucService({} as PrismaService);
}

describe('GiaHieuLucService (unit, không cần DB)', () => {
  it('không có flash => NORMAL với giaHieuLuc = giaGoc', async () => {
    const { db } = taoFakeDb([VARIANT_ID]);
    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);

    expect(ketQua).toMatchObject({
      bienTheSanPhamId: VARIANT_ID,
      giaGoc: GIA_GOC,
      giaHieuLuc: GIA_GOC,
      loaiGia: 'NORMAL',
      chienDichId: null,
      mucFlashSaleId: null,
    });
  });

  it('flash active hợp lệ => FLASH_SALE kèm campaignId/itemId', async () => {
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-1',
          chienDichId: 'camp-1',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() - 60_000),
            ketThucLuc: new Date(NOW.getTime() + 86_400_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);

    expect(ketQua).toMatchObject({
      giaGoc: GIA_GOC,
      giaHieuLuc: GIA_FLASH,
      loaiGia: 'FLASH_SALE',
      chienDichId: 'camp-1',
      mucFlashSaleId: 'muc-1',
    });
  });

  it('gửi đúng ràng buộc thời gian + trạng thái xuống DB (before/after/inactive do DB loại)', async () => {
    const { db, seenWhere } = taoFakeDb([VARIANT_ID]);
    await taoService().resolve(VARIANT_ID, NOW, db);

    const where = seenWhere[0]?.where as unknown as WhereMucFlashSale;
    expect(where?.trangThai).toBe('HOAT_DONG');
    expect(where?.chienDich?.trangThai).toBe('HOAT_DONG');
    expect(where?.chienDich?.batDauLuc?.lte).toEqual(NOW);
    expect(where?.chienDich?.ketThucLuc?.gte).toEqual(NOW);
  });

  it('flash chưa bắt đầu (before start) => NORMAL', async () => {
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-future',
          chienDichId: 'camp-future',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() + 3_600_000),
            ketThucLuc: new Date(NOW.getTime() + 7_200_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.giaHieuLuc).toBe(GIA_GOC);
  });

  it('flash đã kết thúc (after end) => NORMAL', async () => {
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-past',
          chienDichId: 'camp-past',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() - 7_200_000),
            ketThucLuc: new Date(NOW.getTime() - 3_600_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.giaHieuLuc).toBe(GIA_GOC);
  });

  it('item NGUNG_HOAT_DONG hoặc campaign NGUNG_HOAT_DONG => NORMAL', async () => {
    const window = {
      batDauLuc: new Date(NOW.getTime() - 60_000),
      ketThucLuc: new Date(NOW.getTime() + 86_400_000),
    };
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-inactive',
          chienDichId: 'camp-1',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'NGUNG_HOAT_DONG',
          chienDich: { trangThai: 'HOAT_DONG', ...window },
        },
        {
          id: 'muc-camp-off',
          chienDichId: 'camp-2',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'HOAT_DONG',
          chienDich: { trangThai: 'NGUNG_HOAT_DONG', ...window },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.giaHieuLuc).toBe(GIA_GOC);
  });

  it.each([
    ['giaFlash = 0', 0],
    ['giaFlash âm', -1000],
    ['giaFlash bằng giá gốc', GIA_GOC],
    ['giaFlash cao hơn giá gốc', GIA_GOC + 1000],
  ])('%s => NORMAL (không áp flash)', async (_ten, giaFlash) => {
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-x',
          chienDichId: 'camp-1',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() - 60_000),
            ketThucLuc: new Date(NOW.getTime() + 86_400_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.giaHieuLuc).toBe(GIA_GOC);
  });

  it('hết tồn khả dụng (onHand - reserved - blocked <= 0) => NORMAL', async () => {
    const { db } = taoFakeDb([VARIANT_ID], {
      lots: [{ onHand: 10, reserved: 6, blocked: 4 }],
      muc: [
        {
          id: 'muc-1',
          chienDichId: 'camp-1',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() - 60_000),
            ketThucLuc: new Date(NOW.getTime() + 86_400_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.soLuongKhaDung).toBe(0);
  });

  it('biến thể không tồn tại/không còn được bán => null', async () => {
    const { db } = taoFakeDb([]);
    const ketQua = await taoService().resolve('variant-khong-ton-tai', NOW, db);
    expect(ketQua).toBeNull();
  });

  it('nhiều campaign trùng thời gian => chọn giaFlash thấp nhất (thống nhất hành vi)', async () => {
    const window = {
      trangThai: 'HOAT_DONG' as const,
      batDauLuc: new Date(NOW.getTime() - 60_000),
      ketThucLuc: new Date(NOW.getTime() + 86_400_000),
    };
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-cao',
          chienDichId: 'camp-cao',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: 45000,
          trangThai: 'HOAT_DONG',
          chienDich: { ...window },
        },
        {
          id: 'muc-thap',
          chienDichId: 'camp-thap',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: 35000,
          trangThai: 'HOAT_DONG',
          chienDich: { ...window },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua).toMatchObject({
      loaiGia: 'FLASH_SALE',
      giaHieuLuc: 35000,
      mucFlashSaleId: 'muc-thap',
    });
  });

  it('resolveNhieu trả cùng giá cho batch và bỏ qua input rỗng', async () => {
    const { db } = taoFakeDb([VARIANT_ID]);
    const service = taoService();

    expect(await service.resolveNhieu([], NOW, db)).toEqual(new Map());
    const map = await service.resolveNhieu([VARIANT_ID, VARIANT_ID], NOW, db);
    expect(map.get(VARIANT_ID)?.loaiGia).toBe('NORMAL');
  });
});
