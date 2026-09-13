import * as SecureStore from 'expo-secure-store';

const RECENT_PRODUCTS_KEY = 'agrimarket.recent-products.v1';
const MAX_RECENT_PRODUCTS = 8;

function chuanHoaIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, MAX_RECENT_PRODUCTS);
}

export async function laySanPhamDaXemGanDay(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENT_PRODUCTS_KEY);
    if (!raw) return [];
    return chuanHoaIds(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export async function ghiNhanSanPhamDaXem(id: string): Promise<void> {
  const normalized = id.trim();
  if (!normalized) return;

  const current = await laySanPhamDaXemGanDay();
  const next = [normalized, ...current.filter((item) => item !== normalized)].slice(
    0,
    MAX_RECENT_PRODUCTS,
  );

  try {
    await SecureStore.setItemAsync(RECENT_PRODUCTS_KEY, JSON.stringify(next));
  } catch {
    // Recent view là tính năng hỗ trợ UI; lỗi lưu local không được làm hỏng chi tiết sản phẩm.
  }
}
