const ANH = {
  hero: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=86',
  rau: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=82',
  traiCay:
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=82',
  gao: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=82',
  huuCo:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=82',
  dacSan:
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=82',
  moiThuHoach:
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=82',
  tomato:
    'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=900&q=82',
  citrus:
    'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=900&q=82',
  avocado:
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=82',
  farm: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1300&q=84',
  farm2:
    'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?auto=format&fit=crop&w=1300&q=84',
  farm3:
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1300&q=84',
  trace:
    'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1400&q=84',
  story:
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1600&q=84',
} as const;

function chuanHoa(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function bam(value: string): number {
  return [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export const ANH_HERO_AGRIMARKET = ANH.hero;
export const ANH_TRUY_XUAT_AGRIMARKET = ANH.trace;
export const ANH_CAU_CHUYEN_TRANG_TRAI = ANH.story;

export function anhDuPhongSanPham(ten: string): string {
  const value = chuanHoa(ten);

  if (/(ca chua|tomato)/.test(value)) return ANH.tomato;
  if (/(cam|quyt|buoi|chanh|citrus)/.test(value)) return ANH.citrus;
  if (/(gao|lua|nep|rice)/.test(value)) return ANH.gao;
  if (/(bo|avocado)/.test(value)) return ANH.avocado;
  if (/(rau|cai|xa lach|spinach|leaf)/.test(value)) return ANH.rau;

  const values = [ANH.huuCo, ANH.rau, ANH.traiCay, ANH.dacSan] as const;
  return values[bam(ten) % values.length] ?? ANH.huuCo;
}

export function anhDuPhongDanhMuc(ten: string): string {
  const value = chuanHoa(ten);

  if (/(rau|cu)/.test(value)) return ANH.rau;
  if (/(trai|qua|fruit)/.test(value)) return ANH.traiCay;
  if (/(gao|ngu coc|lua|nep)/.test(value)) return ANH.gao;
  if (/(huu co|organic)/.test(value)) return ANH.huuCo;
  if (/(dac san|dia phuong)/.test(value)) return ANH.dacSan;
  if (/(thu hoach|moi)/.test(value)) return ANH.moiThuHoach;

  return anhDuPhongSanPham(ten);
}

export function anhDuPhongTrangTrai(ten: string): string {
  const values = [ANH.farm, ANH.farm2, ANH.farm3] as const;
  return values[bam(ten) % values.length] ?? ANH.farm;
}
