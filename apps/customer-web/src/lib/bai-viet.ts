import type { NoiDungTrangChuDto } from '@agrimarket/api-client';

import { FALLBACK_KNOWLEDGE_ARTICLES } from './homepage-fallback';

/** Bài viết thống nhất cho trang Kiến thức / Tin tức (API + editorial tĩnh). */
export type BaiVietCard = {
  id: string;
  tag: string;
  title: string;
  moTa: string;
  date: string;
  anh: string;
  /** Liên kết ngoài (http) hoặc route nội bộ. Rỗng = không có liên kết. */
  href: string;
};

function chuanHoaKhongDau(value: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function dinhDangNgay(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function laLienKetNgoai(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function laBaiTinTuc(item: Pick<BaiVietCard, 'tag' | 'title'>): boolean {
  const text = chuanHoaKhongDau(`${item.tag} ${item.title}`);
  return text.includes('tin tuc');
}

function tuApi(item: NoiDungTrangChuDto, macDinhTag: string): BaiVietCard {
  return {
    id: item.id,
    tag: item.nhan?.trim() || macDinhTag,
    title: item.tieuDe,
    moTa: item.moTa?.trim() || '',
    date: dinhDangNgay(item.createdAt),
    anh: item.anhUrl?.trim() || '/images/articles/article-nong-san-theo-mua.webp',
    href: item.duongDan?.trim() || '',
  };
}

export function gopBaiVietKienThuc(apiKienThuc: NoiDungTrangChuDto[]): BaiVietCard[] {
  const tuApiList = (apiKienThuc ?? []).map((item) => tuApi(item, 'Kiến thức'));
  const fallback = FALLBACK_KNOWLEDGE_ARTICLES.map((a, i) => ({
    id: `fallback-${i}`,
    tag: a.tag,
    title: a.title,
    moTa: a.moTa,
    date: a.date,
    anh: a.anh,
    href: 'href' in a && a.href ? a.href : '',
  }));
  const daThay = new Set(tuApiList.map((a) => chuanHoaKhongDau(a.title)));
  return [...tuApiList, ...fallback.filter((a) => !daThay.has(chuanHoaKhongDau(a.title)))];
}

export function gopBaiVietTinTuc(
  apiKienThuc: NoiDungTrangChuDto[],
  apiCauChuyen: NoiDungTrangChuDto[],
): BaiVietCard[] {
  const tin = (apiKienThuc ?? []).filter((item) =>
    laBaiTinTuc({ tag: item.nhan ?? '', title: item.tieuDe }),
  );
  const chuyen = (apiCauChuyen ?? []).map((item) => ({
    ...tuApi(item, 'Câu chuyện trang trại'),
    id: `cau-chuyen-${item.id}`,
  }));
  const tinMapped = tin.map((item) => tuApi(item, 'Tin tức'));
  const daThay = new Set(tinMapped.map((a) => chuanHoaKhongDau(a.title)));
  return [...tinMapped, ...chuyen.filter((a) => !daThay.has(chuanHoaKhongDau(a.title)))];
}

/** Lọc theo tab (cùng từ khóa với section Kiến thức ở trang chủ). */
export function locBaiVietTheoTab(items: BaiVietCard[], tab: string): BaiVietCard[] {
  if (tab === 'tat-ca') return items;
  if (tab === 'tin-tuc') return items.filter((a) => laBaiTinTuc(a));
  if (tab === 'cau-chuyen') {
    return items.filter((a) => {
      const text = chuanHoaKhongDau(`${a.tag} ${a.title}`);
      return (
        text.includes('cau chuyen') ||
        text.includes('nong dan') ||
        text.includes('trang trai') ||
        a.id.startsWith('cau-chuyen-')
      );
    });
  }
  const tuKhoa: Record<string, string[]> = {
    'ky-thuat': ['ky thuat', 'trong trot', 'chan nuoi', 'canh tac', 'san xuat'],
    'dinh-duong': ['dinh duong', 'suc khoe', 'vitamin', 'bo duong'],
    'meo-chon': ['meo', 'chon', 'bao quan', 'mua', 'tieu dung'],
  };
  const keys = tuKhoa[tab] ?? [];
  return items.filter((a) => {
    const text = chuanHoaKhongDau(`${a.tag} ${a.title} ${a.moTa}`);
    return keys.some((k) => text.includes(k));
  });
}

export function laLienKetNgoaiBaiViet(href: string): boolean {
  return laLienKetNgoai(href);
}
