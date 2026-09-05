import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaModule } from '../src/database/prisma.module';
import { PrismaService } from '../src/database/prisma.service';

const INDEX_NAME = 'idx_san_pham_trang_thai_ten_created_at';

type ShowIndexRow = {
  Key_name: string;
  Seq_in_index: number | bigint;
  Column_name: string;
};

type ExplainRow = {
  id: number;
  select_type: string;
  table: string;
  type: string;
  possible_keys: string | null;
  key: string | null;
  key_len: string | null;
  ref: string | null;
  rows: number | bigint;
  filtered: number;
  Extra: string | null;
};

describe('MySQL Search Optimization PHIEN-111 focused e2e', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: ['.env', '../../.env'],
        }),
        PrismaModule,
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('schema có composite index cho public product status + order', async () => {
    const rows = await prisma.$queryRawUnsafe<ShowIndexRow[]>(
      `SHOW INDEX FROM san_pham WHERE Key_name = '${INDEX_NAME}'`,
    );

    expect(rows).toHaveLength(3);

    const columns = [...rows]
      .sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index))
      .map((row) => row.Column_name);

    expect(columns).toEqual(['trang_thai', 'ten', 'created_at']);
  });

  it('EXPLAIN xác nhận MySQL có thể dùng index cho public search base order', async () => {
    const plan = await prisma.$queryRawUnsafe<ExplainRow[]>(`
      EXPLAIN
      SELECT id, ten, created_at
      FROM san_pham FORCE INDEX (${INDEX_NAME})
      WHERE trang_thai = 'HOAT_DONG'
      ORDER BY ten ASC, created_at ASC
      LIMIT 20
    `);

    expect(plan).toHaveLength(1);
    expect(plan[0]?.key).toBe(INDEX_NAME);
    expect(plan[0]?.type).not.toBe('ALL');
    expect(plan[0]?.Extra ?? '').not.toContain('Using filesort');
  });

  it('ghi nhận contains %keyword% chưa đổi sang FULLTEXT trước PHIEN-112 ranking', async () => {
    const plan = await prisma.$queryRawUnsafe<ExplainRow[]>(`
      EXPLAIN
      SELECT id, ten
      FROM san_pham
      WHERE trang_thai = 'HOAT_DONG'
        AND ten LIKE '%organic%'
      ORDER BY ten ASC, created_at ASC
      LIMIT 20
    `);

    expect(plan).toHaveLength(1);
    expect(plan[0]?.table).toBe('san_pham');
  });
});
