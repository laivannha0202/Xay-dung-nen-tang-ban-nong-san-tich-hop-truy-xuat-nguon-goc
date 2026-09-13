'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconMapPin,
  IconStarFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import { layTrangThaiWishlistWeb, themWishlistWeb, xoaWishlistWeb } from '@/lib/api-wishlist';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

export interface ProductCardProps {
  id?: string;
  ten: string;
  tenTrangTrai?: string;
  giaTu?: number | null;
  giaDen?: number | null;
  donVi?: string;
  anh?: React.ReactNode;
  anhUrl?: string;
  href?: string;
  nhan?: string[];
  chungNhan?: string;
  badges?: Array<{ loai: string; ma?: string }>;
  danhGia?: number | null;
  soDanhGia?: number | null;
  xuatXu?: string;
  conHang?: boolean;
  onQuetQR?: () => void;
  onThemVaoGio?: () => void;
}

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

export function ProductCard({
  id,
  ten,
  tenTrangTrai,
  giaTu,
  giaDen,
  donVi = 'kg',
  anh,
  anhUrl,
  href = id ? `/san-pham/${id}` : '#',
  nhan = [],
  chungNhan,
  badges,
  danhGia,
  soDanhGia,
  xuatXu,
  conHang = true,
  onThemVaoGio,
}: ProductCardProps) {
  const router = useRouter();
  const [yeuThich, setYeuThich] = useState(false);
  const [dangLuuWishlist, setDangLuuWishlist] = useState(false);

  useEffect(() => {
    if (!id || !coPhienKhachHang()) return;
    let active = true;
    void layTrangThaiWishlistWeb(id)
      .then((data) => {
        if (active) setYeuThich(data.daYeuThich);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  // Gom danh sách badges thực tế (không hardcode fallback VietGAP)
  const danhSachBadge: string[] = useMemo(() => {
    if (badges && badges.length > 0) {
      return badges.map((b) => b.loai).filter(Boolean);
    }
    const list: string[] = [];
    if (chungNhan) list.push(chungNhan);
    if (nhan && nhan.length > 0) {
      for (const n of nhan) {
        if (n && !list.includes(n)) list.push(n);
      }
    }
    return list;
  }, [badges, chungNhan, nhan]);

  const finalImgSrc = anhUrl || (typeof anh === 'string' ? anh : undefined);

  async function xuLyYeuThich(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!id) {
      setYeuThich((prev) => !prev);
      return;
    }

    if (!coPhienKhachHang()) {
      router.push(`/dang-nhap?next=${encodeURIComponent(href)}`);
      return;
    }

    setDangLuuWishlist(true);
    try {
      const data = yeuThich ? await xoaWishlistWeb(id) : await themWishlistWeb(id);
      setYeuThich(data.daYeuThich);
    } catch {
      // Giữ trạng thái hiện tại nếu API lỗi
    } finally {
      setDangLuuWishlist(false);
    }
  }

  // Định dạng giá: khoảng giá hoặc giá đơn
  const coGiaTu = typeof giaTu === 'number' && giaTu > 0;
  const coKhoangGia = coGiaTu && typeof giaDen === 'number' && giaDen > giaTu;
  const chuoiGia = coKhoangGia
    ? `${dinhDangGia(giaTu)}đ – ${dinhDangGia(giaDen)}đ`
    : coGiaTu
      ? `${dinhDangGia(giaTu)}đ`
      : 'Liên hệ';

  const diaDiemHienThi = xuatXu || tenTrangTrai;
  const coDanhGia = typeof soDanhGia === 'number' && soDanhGia > 0 && typeof danhGia === 'number';

  return (
    <Card
      padding={0}
      radius="md"
      className="agri-product-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5eae6',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
    >
      {/* Khung ảnh sản phẩm */}
      <Box pos="relative" style={{ overflow: 'hidden', aspectRatio: '16 / 11', backgroundColor: '#f1f5f2' }}>
        <Link href={href} style={{ display: 'block', width: '100%', height: '100%' }}>
          {anh ? (
            anh
          ) : (
            <Image
              src={finalImgSrc || anhDuPhongSanPham(ten)}
              alt={ten}
              w="100%"
              h="100%"
              fit="cover"
              loading="lazy"
              fallbackSrc="/images/products/carot.jpg"
              style={{ transition: 'transform 240ms ease' }}
            />
          )}
        </Link>

        {/* Badge chứng nhận thực tế góc trên bên trái */}
        {danhSachBadge.length > 0 ? (
          <Group gap={4} pos="absolute" top={8} left={8} style={{ zIndex: 2, maxWidth: 'calc(100% - 48px)' }}>
            {danhSachBadge.slice(0, 2).map((badgeText, idx) => (
              <Badge
                key={`${badgeText}-${idx}`}
                size="sm"
                style={{
                  backgroundColor: '#186a3e',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                  textTransform: 'none',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {badgeText}
              </Badge>
            ))}
            {danhSachBadge.length > 2 ? (
              <Badge
                size="sm"
                style={{
                  backgroundColor: '#145532',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 10,
                  padding: '4px 6px',
                  borderRadius: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                }}
              >
                +{danhSachBadge.length - 2}
              </Badge>
            ) : null}
          </Group>
        ) : null}

        {/* Nút yêu thích góc trên bên phải */}
        <Tooltip label={yeuThich ? 'Đã yêu thích' : 'Yêu thích'}>
          <ActionIcon
            pos="absolute"
            top={8}
            right={8}
            size={28}
            radius="xl"
            variant="filled"
            onClick={xuLyYeuThich}
            loading={dangLuuWishlist}
            aria-label="Yêu thích sản phẩm"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.06)',
              zIndex: 3,
            }}
          >
            {yeuThich ? (
              <IconHeartFilled size={16} color="#e11d48" />
            ) : (
              <IconHeart size={16} color="#475569" stroke={1.7} />
            )}
          </ActionIcon>
        </Tooltip>

        {/* Nhãn trạng thái hết hàng mờ nhẹ */}
        {!conHang ? (
          <Box
            pos="absolute"
            bottom={8}
            left={8}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.92)',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2px',
            }}
          >
            Tạm hết hàng
          </Box>
        ) : null}
      </Box>

      {/* Thân thẻ thông tin */}
      <Stack gap={6} p={14} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tên sản phẩm tối đa 2 dòng */}
        <Text
          component={Link}
          href={href}
          fw={700}
          fz={15}
          lh={1.35}
          lineClamp={2}
          c="#1e293b"
          style={{
            textDecoration: 'none',
            minHeight: 40,
          }}
        >
          {ten}
        </Text>

        {/* Đánh giá sao từ API thật hoặc Chưa có đánh giá */}
        {coDanhGia ? (
          <Group gap={4} align="center">
            <IconStarFilled size={13} color="#f59e0b" />
            <Text fz={12} fw={700} c="#1e293b">
              {danhGia.toFixed(1)}
            </Text>
            <Text fz={12} c="#64748b">
              ({soDanhGia})
            </Text>
          </Group>
        ) : (
          <Text fz={11.5} c="#94a3b8" fw={500}>
            Chưa có đánh giá
          </Text>
        )}

        {/* Giá sản phẩm */}
        <Group gap={4} align="baseline" mt={2}>
          <Text fw={800} fz={16} c="#186a3e" style={{ letterSpacing: '-0.2px' }}>
            {chuoiGia}
          </Text>
          {coGiaTu && donVi && !coKhoangGia ? (
            <Text fz={12} c="#64748b" fw={500}>
              /{donVi}
            </Text>
          ) : null}
        </Group>

        {/* Trang trại / Xuất xứ nếu có */}
        {diaDiemHienThi ? (
          <Group gap={4} wrap="nowrap" mt={2} style={{ overflow: 'hidden' }}>
            <IconMapPin size={14} color="#186a3e" style={{ flexShrink: 0 }} />
            <Text fz={11.5} c="#64748b" lineClamp={1}>
              {diaDiemHienThi}
            </Text>
          </Group>
        ) : null}

        {/* Nút Xem sản phẩm dẫn tới trang chi tiết */}
        <Button
          component={Link}
          href={href}
          fullWidth
          mt="auto"
          h={36}
          radius="md"
          variant={conHang ? 'filled' : 'light'}
          color={conHang ? 'agrimarket' : 'gray'}
          onClick={(e) => {
            if (onThemVaoGio) {
              e.preventDefault();
              e.stopPropagation();
              onThemVaoGio();
            }
          }}
          style={{
            backgroundColor: conHang ? '#186a3e' : '#f1f5f2',
            color: conHang ? '#ffffff' : '#64748b',
            fontWeight: 600,
            fontSize: 13,
            marginTop: 10,
            transition: 'background-color 150ms ease',
          }}
        >
          {conHang ? 'Xem sản phẩm' : 'Xem chi tiết (Hết)'}
        </Button>
      </Stack>
    </Card>
  );
}