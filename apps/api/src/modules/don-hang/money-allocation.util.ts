/**
 * Item money allocation algorithm (proportional remainder distribution)
 * Canonical deterministic integer cent math.
 */
export type ItemCanPhanBo = {
  id: string;
  tienHangGocCents: number;
};

export type KetQuaPhanBoItem = {
  id: string;
  tienHangGocCents: number;
  tienKhuyenMaiPhanBoCents: number;
  tienDiemPhanBoCents: number;
  tienVanChuyenPhanBoCents: number;
  tienThucTraCents: number;
};

/**
 * Phân bổ một khoản tiền (cents) cho danh sách item theo tỷ lệ tienHangGocCents.
 * Phần dư (remainder cents) được chia lần lượt từng 1 cent cho các item theo thứ tự items.
 * Đảm bảo: SUM(allocated) === totalToAllocateCents chính xác 100%, không lệch 1 VND/cent.
 */
export function phanBoTienDeterministic(
  items: Array<{ id: string; tienHangGocCents: number }>,
  totalToAllocateCents: number,
): Map<string, number> {
  const result = new Map<string, number>();
  if (items.length === 0 || totalToAllocateCents <= 0) {
    for (const item of items) {
      result.set(item.id, 0);
    }
    return result;
  }

  const tongGocCents = items.reduce((sum, item) => sum + item.tienHangGocCents, 0);
  if (tongGocCents <= 0) {
    for (const item of items) {
      result.set(item.id, 0);
    }
    return result;
  }

  let daPhanBo = 0;
  const allocations: Array<{ id: string; cents: number }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    // Floor proportional share
    const share = Math.floor((totalToAllocateCents * item.tienHangGocCents) / tongGocCents);
    allocations.push({ id: item.id, cents: share });
    daPhanBo += share;
  }

  // Remainder cents phân bổ lần lượt từng 1 cent theo deterministic order
  let remainder = totalToAllocateCents - daPhanBo;
  let idx = 0;
  while (remainder > 0 && items.length > 0) {
    allocations[idx % items.length]!.cents += 1;
    remainder -= 1;
    idx += 1;
  }

  for (const a of allocations) {
    result.set(a.id, a.cents);
  }

  return result;
}

export function phanBoTaiChinhDonHang(
  items: ItemCanPhanBo[],
  giamKhuyenMaiCents: number,
  giaTriDiemDaDungCents: number,
  phiVanChuyenCents: number,
): Map<string, KetQuaPhanBoItem> {
  const kmMap = phanBoTienDeterministic(items, giamKhuyenMaiCents);
  const diemMap = phanBoTienDeterministic(items, giaTriDiemDaDungCents);
  const shipMap = phanBoTienDeterministic(items, phiVanChuyenCents);

  const resultMap = new Map<string, KetQuaPhanBoItem>();

  for (const item of items) {
    const kmCents = kmMap.get(item.id) ?? 0;
    const diemCents = diemMap.get(item.id) ?? 0;
    const shipCents = shipMap.get(item.id) ?? 0;
    // tienThucTra = tienHangGoc - km - diem + ship
    const thucTraCents = item.tienHangGocCents - kmCents - diemCents + shipCents;

    resultMap.set(item.id, {
      id: item.id,
      tienHangGocCents: item.tienHangGocCents,
      tienKhuyenMaiPhanBoCents: kmCents,
      tienDiemPhanBoCents: diemCents,
      tienVanChuyenPhanBoCents: shipCents,
      tienThucTraCents: thucTraCents,
    });
  }

  return resultMap;
}
