'use client';

import { Badge, Group, Stack, Text } from '@mantine/core';
import { dinhDangGiaVND, hienThiKhoangGia } from '@agrimarket/api-client';

/**
 * Kiểu giá bán hiệu lực từ backend (SanPhamCongKhaiTomTatDto.giaBan).
 * Optional-chaining rộng để tương thích dữ liệu cache cũ chưa có giaBan.
 */
export type GiaBanHienThi = {
  tu?: number | null;
  den?: number | null;
  tienTe?: string;
  bienTheDaiDienId?: string;
  giaGocDaiDien?: number | null;
  giaHieuLucDaiDien?: number | null;
  loaiGia?: 'NORMAL' | 'FLASH_SALE' | string;
  dangGiam?: boolean | null;
  phanTramGiam?: number | null;
};

export type BienTheHieuLucHienThi = {
  gia?: number | null;
  giaGoc?: number | null;
  giaHieuLuc?: number | null;
  loaiGia?: 'NORMAL' | 'FLASH_SALE' | string;
  dangGiam?: boolean | null;
  phanTramGiam?: number | null;
};

function laSoDuong(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** true chỉ khi backend khẳng định đang giảm (không tự suy diễn ở frontend). */
export function coGiamGia(giaBan: GiaBanHienThi | null | undefined): boolean {
  if (!giaBan || giaBan.dangGiam !== true) return false;
  if (giaBan.loaiGia !== 'FLASH_SALE') return false;
  if (typeof giaBan.phanTramGiam !== 'number' || giaBan.phanTramGiam <= 0) return false;
  return laSoDuong(giaBan.giaGocDaiDien) && laSoDuong(giaBan.giaHieuLucDaiDien);
}

export function coGiamGiaBienThe(bienThe: BienTheHieuLucHienThi | null | undefined): boolean {
  if (!bienThe || bienThe.dangGiam !== true) return false;
  if (bienThe.loaiGia !== 'FLASH_SALE') return false;
  if (typeof bienThe.phanTramGiam !== 'number' || bienThe.phanTramGiam <= 0) return false;
  const giaGoc = bienThe.giaGoc ?? bienThe.gia ?? null;
  return laSoDuong(giaGoc) && laSoDuong(bienThe.giaHieuLuc);
}

export function dinhDangTienVND(so: number): string {
  return `${dinhDangGiaVND(so)}đ`;
}

/**
 * Badge giảm giá thống nhất toàn Customer Web.
 * Chỉ render khi có phần trăm giảm thật từ backend.
 */
export function BadgeGiamGia({ phanTram }: { phanTram: number | null | undefined }) {
  if (typeof phanTram !== 'number' || !Number.isFinite(phanTram) || phanTram <= 0) return null;
  return (
    <Badge bg="#E53935" c="white" radius={4} size="sm" fw={800} style={{ flexShrink: 0 }}>
      {`-${Math.round(phanTram)}%`}
    </Badge>
  );
}

type GiaSanPhamProps = {
  giaBan: GiaBanHienThi | null | undefined;
  /** Fallback giá catalog cũ khi cache chưa có giaBan. */
  giaTuFallback?: number | null;
  giaDenFallback?: number | null;
  /** Cỡ chữ giá hiện tại. */
  coChu?: number | string;
};

/**
 * Giá card dùng chung: NORMAL hiện 1 giá xanh; FLASH_SALE hiện giá hiệu lực
 * + giá gốc gạch + badge -%. Giá hiệu lực và giá gốc luôn cùng variant đại
 * diện do backend quyết định — frontend chỉ hiển thị.
 */
export function GiaSanPham({ giaBan, giaTuFallback, giaDenFallback, coChu = 16 }: GiaSanPhamProps) {
  const tu = laSoDuong(giaBan?.tu) ? (giaBan?.tu as number) : null;
  if (tu === null) {
    const fallback = hienThiKhoangGia(giaTuFallback ?? null, giaDenFallback ?? null);
    return (
      <Text fw={800} fz={coChu} c="#087A4B" style={{ letterSpacing: '-0.2px' }}>
        {fallback}
      </Text>
    );
  }
  const den = laSoDuong(giaBan?.den) ? (giaBan?.den as number) : tu;
  const dangGiam = coGiamGia(giaBan);
  const chuoiHieuLuc = hienThiKhoangGia(tu, den);

  if (!dangGiam) {
    return (
      <Text fw={800} fz={coChu} c="#087A4B" style={{ letterSpacing: '-0.2px' }}>
        {chuoiHieuLuc}
      </Text>
    );
  }

  return (
    <Group gap={6} align="center" wrap="wrap" style={{ minWidth: 0 }}>
      <Text fw={800} fz={coChu} c="#087A4B" style={{ letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
        {chuoiHieuLuc}
      </Text>
      <Text size="12px" c="dimmed" td="line-through" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
        {dinhDangTienVND(giaBan?.giaGocDaiDien as number)}
      </Text>
      <BadgeGiamGia phanTram={giaBan?.phanTramGiam} />
    </Group>
  );
}

type GiaBienTheProps = {
  bienThe: BienTheHieuLucHienThi | null | undefined;
  giaTuFallback?: number | null;
  coChu?: number | string;
};

/** Giá chi tiết theo variant đang chọn: giaHieuLuc + giaGoc gạch + badge. */
export function GiaBienThe({ bienThe, giaTuFallback, coChu = 28 }: GiaBienTheProps) {
  const giaHieuLuc = laSoDuong(bienThe?.giaHieuLuc) ? (bienThe?.giaHieuLuc as number) : null;
  if (giaHieuLuc === null) {
    const fallback = laSoDuong(giaTuFallback) ? dinhDangTienVND(giaTuFallback as number) : 'Liên hệ';
    return (
      <Text fw={900} fz={coChu} c="agrimarket.7" lh={1}>
        {fallback}
      </Text>
    );
  }
  if (!coGiamGiaBienThe(bienThe)) {
    return (
      <Text fw={900} fz={coChu} c="agrimarket.7" lh={1}>
        {dinhDangTienVND(giaHieuLuc)}
      </Text>
    );
  }
  return (
    <Stack gap={4}>
      <Group gap={10} align="baseline" wrap="wrap">
        <Text fw={900} fz={coChu} c="agrimarket.7" lh={1}>
          {dinhDangTienVND(giaHieuLuc)}
        </Text>
        <Text fz={14} c="dimmed" td="line-through" fw={600}>
          {dinhDangTienVND((bienThe?.giaGoc ?? bienThe?.gia) as number)}
        </Text>
        <BadgeGiamGia phanTram={bienThe?.phanTramGiam} />
      </Group>
    </Stack>
  );
}
