import type {
  SanPhamRecommendationFeature,
  TuongTacRecommendation,
} from './bo-du-lieu-recommendation';

export const TRONG_SO_HYBRID_AFFINITY_V1 = {
  phoBien: 0.35,
  danhMuc: 0.4,
  trangTrai: 0.25,
} as const;

export type GoiYRecommendation = {
  sanPhamId: string;
  diem: number;
  thanhPhan: {
    phoBien: number;
    danhMuc: number;
    trangTrai: number;
  };
};

export type NguCanhRecommendation = {
  khachHangId: string;
  thoiDiem: Date;
  lichSu: TuongTacRecommendation[];
  auxiliary: TuongTacRecommendation[];
  sanPham: SanPhamRecommendationFeature[];
  topK?: number;
};

const MOT_NGAY_MS = 24 * 60 * 60 * 1000;
const CUA_SO_PHO_BIEN_NGAY = 90;

function lamTron(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sanPhamHopLe(sanPham: SanPhamRecommendationFeature[]): SanPhamRecommendationFeature[] {
  return sanPham.filter((item) => item.congKhai && item.khaDung);
}

function lichSuTruocThoiDiem(
  items: TuongTacRecommendation[],
  thoiDiem: Date,
): TuongTacRecommendation[] {
  return items.filter((item) => item.thoiGian.getTime() < thoiDiem.getTime());
}

function demPurchase90d(lichSu: TuongTacRecommendation[], thoiDiem: Date): Map<string, number> {
  const tuNgay = new Date(thoiDiem.getTime() - CUA_SO_PHO_BIEN_NGAY * MOT_NGAY_MS);

  const result = new Map<string, number>();

  for (const item of lichSu) {
    if (
      item.loai !== 'PURCHASE' ||
      !item.sanPhamId ||
      item.thoiGian.getTime() < tuNgay.getTime() ||
      item.thoiGian.getTime() >= thoiDiem.getTime()
    ) {
      continue;
    }

    result.set(item.sanPhamId, (result.get(item.sanPhamId) ?? 0) + 1);
  }

  return result;
}

function ratingTrungBinh(lichSu: TuongTacRecommendation[], thoiDiem: Date): Map<string, number> {
  const tong = new Map<string, { tong: number; soLuong: number }>();

  for (const item of lichSu) {
    if (
      item.loai !== 'RATING' ||
      !item.sanPhamId ||
      item.thoiGian.getTime() >= thoiDiem.getTime()
    ) {
      continue;
    }

    const current = tong.get(item.sanPhamId) ?? {
      tong: 0,
      soLuong: 0,
    };

    current.tong += item.giaTri;
    current.soLuong += 1;
    tong.set(item.sanPhamId, current);
  }

  return new Map(
    Array.from(tong.entries()).map(([sanPhamId, value]) => [sanPhamId, value.tong / value.soLuong]),
  );
}

export function xepHangMostPopular90d(context: NguCanhRecommendation): GoiYRecommendation[] {
  const topK = context.topK ?? 10;
  const eligible = sanPhamHopLe(context.sanPham);
  const lichSu = lichSuTruocThoiDiem(context.lichSu, context.thoiDiem);
  const purchase = demPurchase90d(lichSu, context.thoiDiem);
  const rating = ratingTrungBinh(lichSu, context.thoiDiem);

  return eligible
    .map((item) => ({
      sanPhamId: item.sanPhamId,
      diem: purchase.get(item.sanPhamId) ?? 0,
      rating: rating.get(item.sanPhamId) ?? 0,
    }))
    .sort(
      (a, b) => b.diem - a.diem || b.rating - a.rating || a.sanPhamId.localeCompare(b.sanPhamId),
    )
    .slice(0, topK)
    .map((item) => ({
      sanPhamId: item.sanPhamId,
      diem: lamTron(item.diem),
      thanhPhan: {
        phoBien: lamTron(item.diem),
        danhMuc: 0,
        trangTrai: 0,
      },
    }));
}

function trongSoTuongTac(item: TuongTacRecommendation): number {
  if (item.loai === 'PURCHASE') {
    return 3;
  }

  if (item.loai === 'WISHLIST') {
    return 2;
  }

  if (item.loai === 'RATING') {
    return 2 * clamp01(item.giaTri / 5);
  }

  return 0;
}

function congDiem(map: Map<string, number>, key: string | null, value: number): void {
  if (!key || value <= 0) {
    return;
  }

  map.set(key, (map.get(key) ?? 0) + value);
}

function chuanHoaMap(map: Map<string, number>): Map<string, number> {
  const max = Math.max(0, ...map.values());

  if (max <= 0) {
    return new Map();
  }

  return new Map(Array.from(map.entries()).map(([key, value]) => [key, value / max]));
}

export function xepHangHybridAffinityV1(context: NguCanhRecommendation): GoiYRecommendation[] {
  const topK = context.topK ?? 10;
  const eligible = sanPhamHopLe(context.sanPham);

  const lichSu = lichSuTruocThoiDiem(context.lichSu, context.thoiDiem);
  const auxiliary = lichSuTruocThoiDiem(context.auxiliary, context.thoiDiem);

  const purchase = demPurchase90d(lichSu, context.thoiDiem);

  const maxPurchase = Math.max(0, ...purchase.values());

  const affinityDanhMuc = new Map<string, number>();
  const affinityTrangTrai = new Map<string, number>();

  for (const item of lichSu) {
    if (item.khachHangId !== context.khachHangId) {
      continue;
    }

    const weight = trongSoTuongTac(item);

    congDiem(affinityDanhMuc, item.danhMucSanPhamId, weight);
    congDiem(affinityTrangTrai, item.trangTraiId, weight);
  }

  for (const item of auxiliary) {
    if (item.khachHangId !== context.khachHangId || item.loai !== 'FOLLOW_FARM') {
      continue;
    }

    congDiem(affinityTrangTrai, item.trangTraiId, 3);
  }

  const categoryNormalized = chuanHoaMap(affinityDanhMuc);
  const farmNormalized = chuanHoaMap(affinityTrangTrai);

  return eligible
    .map((item) => {
      const phoBien = maxPurchase > 0 ? (purchase.get(item.sanPhamId) ?? 0) / maxPurchase : 0;

      const danhMuc = categoryNormalized.get(item.danhMucSanPhamId) ?? 0;

      const trangTrai = farmNormalized.get(item.trangTraiId) ?? 0;

      const diem =
        phoBien * TRONG_SO_HYBRID_AFFINITY_V1.phoBien +
        danhMuc * TRONG_SO_HYBRID_AFFINITY_V1.danhMuc +
        trangTrai * TRONG_SO_HYBRID_AFFINITY_V1.trangTrai;

      return {
        sanPhamId: item.sanPhamId,
        diem: lamTron(diem),
        thanhPhan: {
          phoBien: lamTron(phoBien),
          danhMuc: lamTron(danhMuc),
          trangTrai: lamTron(trangTrai),
        },
      };
    })
    .sort((a, b) => b.diem - a.diem || a.sanPhamId.localeCompare(b.sanPhamId))
    .slice(0, topK);
}
