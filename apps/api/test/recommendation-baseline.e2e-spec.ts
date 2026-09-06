import type {
  RecommendationDataset,
  SanPhamRecommendationFeature,
  TuongTacRecommendation,
} from '../src/ai/recommendation/bo-du-lieu-recommendation';
import {
  TRONG_SO_HYBRID_AFFINITY_V1,
  xepHangHybridAffinityV1,
  xepHangMostPopular90d,
} from '../src/ai/recommendation/baseline-recommendation';
import { taoBaoCaoSoSanhRecommendation } from '../src/ai/recommendation/danh-gia-recommendation';

const t = (value: string) => new Date(value);

function product(index: number): SanPhamRecommendationFeature {
  const id = `p${String(index).padStart(2, '0')}`;

  if (index === 11) {
    return {
      sanPhamId: id,
      danhMucSanPhamId: 'cat-special',
      trangTraiId: 'farm-other',
      congKhai: true,
      khaDung: true,
      soLuongKhaDung: 10,
      giaMin: 30000,
      giaMax: 30000,
      createdAt: t('2026-01-01T00:00:00.000Z'),
    };
  }

  if (index === 12) {
    return {
      sanPhamId: id,
      danhMucSanPhamId: 'cat-special',
      trangTraiId: 'farm-target',
      congKhai: true,
      khaDung: true,
      soLuongKhaDung: 10,
      giaMin: 35000,
      giaMax: 35000,
      createdAt: t('2026-01-01T00:00:00.000Z'),
    };
  }

  return {
    sanPhamId: id,
    danhMucSanPhamId: 'cat-common',
    trangTraiId: `farm-common-${index}`,
    congKhai: true,
    khaDung: true,
    soLuongKhaDung: 10,
    giaMin: 20000 + index,
    giaMax: 20000 + index,
    createdAt: t('2026-01-01T00:00:00.000Z'),
  };
}

function purchase(
  source: string,
  customer: string,
  sanPhamId: string,
  time: string,
  category = 'cat-common',
  farm = 'farm-common',
): TuongTacRecommendation {
  return {
    nguonId: source,
    khachHangId: customer,
    sanPhamId,
    loai: 'PURCHASE',
    giaTri: 1,
    thoiGian: t(time),
    danhMucSanPhamId: category,
    trangTraiId: farm,
  };
}

function fixture(): RecommendationDataset {
  const sanPham = Array.from({ length: 12 }, (_, index) => product(index + 1));

  const train: TuongTacRecommendation[] = [];

  for (let i = 1; i <= 9; i += 1) {
    const id = `p${String(i).padStart(2, '0')}`;

    for (let j = 1; j <= 3; j += 1) {
      train.push(
        purchase(
          `popular-${i}-${j}`,
          `popular-user-${i}-${j}`,
          id,
          `2026-07-${String(i + j).padStart(2, '0')}T08:00:00.000Z`,
        ),
      );
    }
  }

  train.push(
    purchase(
      'target-pop-1',
      'other-target-user-1',
      'p12',
      '2026-07-20T08:00:00.000Z',
      'cat-special',
      'farm-target',
    ),
    purchase(
      'target-pop-2',
      'other-target-user-2',
      'p12',
      '2026-07-21T08:00:00.000Z',
      'cat-special',
      'farm-target',
    ),
    purchase(
      'eval-train',
      'eval-user',
      'p11',
      '2026-08-01T08:00:00.000Z',
      'cat-special',
      'farm-other',
    ),
  );

  const validation: TuongTacRecommendation[] = [
    {
      nguonId: 'eval-validation',
      khachHangId: 'eval-user',
      sanPhamId: 'p11',
      loai: 'WISHLIST',
      giaTri: 1,
      thoiGian: t('2026-08-15T08:00:00.000Z'),
      danhMucSanPhamId: 'cat-special',
      trangTraiId: 'farm-other',
    },
  ];

  const test: TuongTacRecommendation[] = [
    purchase(
      'eval-test',
      'eval-user',
      'p12',
      '2026-09-01T08:00:00.000Z',
      'cat-special',
      'farm-target',
    ),
  ];

  const auxiliary: TuongTacRecommendation[] = [
    {
      nguonId: 'eval-follow',
      khachHangId: 'eval-user',
      sanPhamId: null,
      loai: 'FOLLOW_FARM',
      giaTri: 1,
      thoiGian: t('2026-08-20T08:00:00.000Z'),
      danhMucSanPhamId: null,
      trangTraiId: 'farm-target',
    },
  ];

  const all = [...train, ...validation, ...test, ...auxiliary];

  return {
    phienBan: '1.0',
    thoiDiemChot: t('2026-09-02T00:00:00.000Z'),
    tuongTac: all,
    sanPham,
    phanChia: {
      train,
      validation,
      test,
      coldStart: [],
      auxiliary,
    },
    thongKe: {
      soKhachHang: new Set(all.map((item) => item.khachHangId)).size,
      soSanPham: sanPham.length,
      tongTuongTac: all.length,
      theoLoai: {
        PURCHASE: all.filter((item) => item.loai === 'PURCHASE').length,
        WISHLIST: 1,
        RATING: 0,
        FOLLOW_FARM: 1,
      },
      soCapKhachHangSanPham: 0,
      matDoTuongTac: 0,
      doThua: 0,
      soKhachHangDuDieuKienDanhGia: 1,
      soKhachHangColdStart: 0,
      phanChia: {
        train: train.length,
        validation: validation.length,
        test: test.length,
        coldStart: 0,
        auxiliary: auxiliary.length,
      },
    },
  };
}

describe('Recommendation Baseline PHIEN-115', () => {
  it('khóa đúng HybridAffinity-v1 weights = 1', () => {
    expect(TRONG_SO_HYBRID_AFFINITY_V1).toEqual({
      phoBien: 0.35,
      danhMuc: 0.4,
      trangTrai: 0.25,
    });

    const total = Object.values(TRONG_SO_HYBRID_AFFINITY_V1).reduce((sum, value) => sum + value, 0);

    expect(total).toBeCloseTo(1, 10);
  });

  it('MostPopular-90d xếp target p12 ở rank 10 trên fixture', () => {
    const dataset = fixture();
    const target = dataset.phanChia.test[0]!;

    const ranking = xepHangMostPopular90d({
      khachHangId: target.khachHangId,
      thoiDiem: target.thoiGian,
      lichSu: [...dataset.phanChia.train, ...dataset.phanChia.validation],
      auxiliary: dataset.phanChia.auxiliary,
      sanPham: dataset.sanPham,
      topK: 10,
    });

    expect(ranking).toHaveLength(10);
    expect(ranking[9]?.sanPhamId).toBe('p12');
  });

  it('HybridAffinity-v1 đưa target p12 lên rank 1 nhờ category + follow-farm', () => {
    const dataset = fixture();
    const target = dataset.phanChia.test[0]!;

    const ranking = xepHangHybridAffinityV1({
      khachHangId: target.khachHangId,
      thoiDiem: target.thoiGian,
      lichSu: [...dataset.phanChia.train, ...dataset.phanChia.validation],
      auxiliary: dataset.phanChia.auxiliary,
      sanPham: dataset.sanPham,
      topK: 10,
    });

    expect(ranking[0]?.sanPhamId).toBe('p12');
    expect(ranking[0]?.thanhPhan.danhMuc).toBe(1);
    expect(ranking[0]?.thanhPhan.trangTrai).toBeGreaterThan(0);
  });

  it('offline evaluator tính đúng metrics và candidate vượt baseline trên contract fixture', () => {
    const report = taoBaoCaoSoSanhRecommendation(fixture(), 10);

    expect(report.baseline).toMatchObject({
      k: 10,
      soMau: 1,
      ndcg: 0.289065,
      recall: 1,
      hitRate: 1,
      catalogCoverage: 0.833333,
      duplicateRate: 0,
      invalidRate: 0,
    });

    expect(report.candidate).toMatchObject({
      k: 10,
      soMau: 1,
      ndcg: 1,
      recall: 1,
      hitRate: 1,
      catalogCoverage: 0.833333,
      duplicateRate: 0,
      invalidRate: 0,
    });

    expect(report.candidateVuotBaseline).toBe(true);
  });

  it('cold-start vẫn có deterministic popularity fallback', () => {
    const dataset = fixture();

    const ranking = xepHangMostPopular90d({
      khachHangId: 'new-user',
      thoiDiem: t('2026-09-01T08:00:00.000Z'),
      lichSu: dataset.phanChia.train,
      auxiliary: [],
      sanPham: dataset.sanPham,
      topK: 3,
    });

    expect(ranking.map((item) => item.sanPhamId)).toEqual(['p01', 'p02', 'p03']);
  });
});
