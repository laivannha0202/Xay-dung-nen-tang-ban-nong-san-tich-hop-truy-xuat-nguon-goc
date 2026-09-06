import type { RecommendationDataset, TuongTacRecommendation } from './bo-du-lieu-recommendation';
import {
  xepHangHybridAffinityV1,
  xepHangMostPopular90d,
  type GoiYRecommendation,
  type NguCanhRecommendation,
} from './baseline-recommendation';

export type MetricRecommendation = {
  k: number;
  soMau: number;
  ndcg: number;
  recall: number;
  hitRate: number;
  catalogCoverage: number;
  duplicateRate: number;
  invalidRate: number;
};

export type BaoCaoSoSanhRecommendation = {
  baseline: MetricRecommendation;
  candidate: MetricRecommendation;
  candidateVuotBaseline: boolean;
};

type HamGoiY = (context: NguCanhRecommendation) => GoiYRecommendation[];

function lamTron(value: number): number {
  return Number(value.toFixed(6));
}

function lichSuChoTest(
  dataset: RecommendationDataset,
  target: TuongTacRecommendation,
): TuongTacRecommendation[] {
  return [...dataset.phanChia.train, ...dataset.phanChia.validation].filter(
    (item) => item.thoiGian.getTime() < target.thoiGian.getTime(),
  );
}

function auxiliaryChoTest(
  dataset: RecommendationDataset,
  target: TuongTacRecommendation,
): TuongTacRecommendation[] {
  return dataset.phanChia.auxiliary.filter(
    (item) => item.thoiGian.getTime() < target.thoiGian.getTime(),
  );
}

function dcgMotTarget(rank: number | null): number {
  if (rank === null) {
    return 0;
  }

  return 1 / Math.log2(rank + 1);
}

function danhGia(dataset: RecommendationDataset, hamGoiY: HamGoiY, k = 10): MetricRecommendation {
  const targets = dataset.phanChia.test.filter(
    (
      item,
    ): item is TuongTacRecommendation & {
      sanPhamId: string;
    } => item.sanPhamId !== null,
  );

  if (targets.length === 0) {
    return {
      k,
      soMau: 0,
      ndcg: 0,
      recall: 0,
      hitRate: 0,
      catalogCoverage: 0,
      duplicateRate: 0,
      invalidRate: 0,
    };
  }

  const eligibleIds = new Set(
    dataset.sanPham.filter((item) => item.congKhai && item.khaDung).map((item) => item.sanPhamId),
  );

  const uniqueRecommended = new Set<string>();
  let tongNdcg = 0;
  let hit = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  let recommendationCount = 0;

  for (const target of targets) {
    const goiY = hamGoiY({
      khachHangId: target.khachHangId,
      thoiDiem: target.thoiGian,
      lichSu: lichSuChoTest(dataset, target),
      auxiliary: auxiliaryChoTest(dataset, target),
      sanPham: dataset.sanPham,
      topK: k,
    });

    const seen = new Set<string>();

    for (const item of goiY) {
      recommendationCount += 1;

      if (seen.has(item.sanPhamId)) {
        duplicateCount += 1;
      }
      seen.add(item.sanPhamId);

      if (!eligibleIds.has(item.sanPhamId)) {
        invalidCount += 1;
      }

      uniqueRecommended.add(item.sanPhamId);
    }

    const index = goiY.findIndex((item) => item.sanPhamId === target.sanPhamId);

    const rank = index >= 0 ? index + 1 : null;

    if (rank !== null && rank <= k) {
      hit += 1;
      tongNdcg += dcgMotTarget(rank);
    }
  }

  const soMau = targets.length;
  const denominator = recommendationCount > 0 ? recommendationCount : 1;

  return {
    k,
    soMau,
    ndcg: lamTron(tongNdcg / soMau),
    recall: lamTron(hit / soMau),
    hitRate: lamTron(hit / soMau),
    catalogCoverage: lamTron(eligibleIds.size > 0 ? uniqueRecommended.size / eligibleIds.size : 0),
    duplicateRate: lamTron(duplicateCount / denominator),
    invalidRate: lamTron(invalidCount / denominator),
  };
}

export function danhGiaMostPopular90d(
  dataset: RecommendationDataset,
  k = 10,
): MetricRecommendation {
  return danhGia(dataset, xepHangMostPopular90d, k);
}

export function danhGiaHybridAffinityV1(
  dataset: RecommendationDataset,
  k = 10,
): MetricRecommendation {
  return danhGia(dataset, xepHangHybridAffinityV1, k);
}

export function taoBaoCaoSoSanhRecommendation(
  dataset: RecommendationDataset,
  k = 10,
): BaoCaoSoSanhRecommendation {
  const baseline = danhGiaMostPopular90d(dataset, k);

  const candidate = danhGiaHybridAffinityV1(dataset, k);

  return {
    baseline,
    candidate,
    candidateVuotBaseline:
      candidate.ndcg > baseline.ndcg &&
      candidate.recall >= baseline.recall &&
      candidate.duplicateRate === 0 &&
      candidate.invalidRate === 0,
  };
}
