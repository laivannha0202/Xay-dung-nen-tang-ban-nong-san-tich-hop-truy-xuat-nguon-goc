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
  IconQrcode,
  IconShoppingCart,
  IconStarFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';

export interface ProductCardProps {
  id?: string;
  ten: string;
  tenTrangTrai?: string;
  giaTu?: number | null;
  donVi?: string;
  anh?: React.ReactNode;
  anhUrl?: string;
  href?: string;
  nhan?: string[];
  chungNhan?: 'Hữu cơ' | 'VietGAP' | 'OCOP' | string;
  danhGia?: number;
  soDanhGia?: number;
  xuatXu?: string;
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
  donVi = 'kg',
  anh,
  anhUrl,
  href = id ? `/san-pham/${id}` : '#',
  nhan = [],
  chungNhan,
  danhGia = 4.8,
  soDanhGia = 100,
  xuatXu = 'Đà Lạt',
  onQuetQR,
  onThemVaoGio,
}: ProductCardProps) {
  const [yeuThich, setYeuThich] = useState(false);
  const [daThem, setDaThem] = useState(false);

  // Xác định nhãn chứng nhận ưu tiên
  const badgeText =
    chungNhan ||
    nhan.find(
      (n) =>
        n.toLowerCase().includes('hữu cơ') ||
        n.toLowerCase().includes('vietgap') ||
        n.toLowerCase().includes('ocop') ||
        n.toLowerCase().includes('organic'),
    ) ||
    'VietGAP';

  const finalImgSrc = anhUrl || (typeof anh === 'string' ? anh : undefined);

  function xuLyThemVaoGio(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDaThem(true);
    if (onThemVaoGio) onThemVaoGio();
    setTimeout(() => setDaThem(false), 1500);
  }

  function xuLyYeuThich(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setYeuThich(!yeuThich);
  }

  function xuLyQuetQR(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onQuetQR) {
      onQuetQR();
    }
  }

  return (
    <Card
      padding={0}
      radius="md"
      className="mockup-product-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5eae6',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
    >
      {/* Khung ảnh sản phẩm */}
      <Box pos="relative" style={{ overflow: 'hidden', aspectRatio: '16 / 10', backgroundColor: '#f1f5f2' }}>
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

        {/* Badge chứng nhận góc trên bên trái */}
        {badgeText ? (
          <Badge
            pos="absolute"
            top={8}
            left={8}
            size="sm"
            style={{
              backgroundColor: '#186a3e',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 14,
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              letterSpacing: '0.2px',
              textTransform: 'none',
            }}
          >
            {badgeText}
          </Badge>
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
            aria-label="Yêu thích sản phẩm"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {yeuThich ? (
              <IconHeartFilled size={16} color="#e11d48" />
            ) : (
              <IconHeart size={16} color="#475569" stroke={1.7} />
            )}
          </ActionIcon>
        </Tooltip>
      </Box>

      {/* Thân thẻ thông tin */}
      <Stack gap={6} p={12} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tên sản phẩm */}
        <Text
          component={Link}
          href={href}
          fw={700}
          fz={15}
          lh={1.3}
          lineClamp={1}
          c="#1e293b"
          style={{ textDecoration: 'none' }}
        >
          {ten}
        </Text>

        {/* Đánh giá sao & lượt */}
        <Group gap={4} align="center">
          <Group gap={2} align="center">
            {[1, 2, 3, 4, 5].map((star) => (
              <IconStarFilled key={star} size={13} color="#f59e0b" />
            ))}
          </Group>
          <Text fz={12} fw={600} c="#64748b" ml={2}>
            {danhGia.toFixed(1)} ({soDanhGia})
          </Text>
        </Group>

        {/* Giá sản phẩm */}
        <Text fw={800} fz={16} c="#186a3e" mt={1}>
          {giaTu !== null && giaTu !== undefined
            ? `${dinhDangGia(giaTu)}đ/${donVi || 'kg'}`
            : 'Liên hệ'}
        </Text>

        {/* Xuất xứ & Nút Quét QR truy xuất */}
        <Group justify="space-between" align="center" mt={4} wrap="nowrap">
          <Group gap={4} wrap="nowrap" style={{ overflow: 'hidden' }}>
            <IconMapPin size={14} color="#186a3e" style={{ flexShrink: 0 }} />
            <Text fz={11.5} c="#64748b" lineClamp={1}>
              Xuất xứ: {xuatXu || tenTrangTrai || 'Đà Lạt'}
            </Text>
          </Group>

          <Button
            size="compact-xs"
            variant="light"
            onClick={xuLyQuetQR}
            leftSection={<IconQrcode size={13} color="#186a3e" />}
            style={{
              backgroundColor: '#eaf5ee',
              color: '#186a3e',
              fontSize: 10.5,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 6,
              border: '1px solid #cbe7d4',
              height: 24,
              flexShrink: 0,
            }}
          >
            Quét QR truy xuất
          </Button>
        </Group>

        {/* Nút full-width Thêm vào giỏ */}
        <Button
          fullWidth
          mt="auto"
          pt={0}
          pb={0}
          h={36}
          radius="sm"
          onClick={xuLyThemVaoGio}
          leftSection={<IconShoppingCart size={16} />}
          style={{
            backgroundColor: daThem ? '#145532' : '#186a3e',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 8,
            marginTop: 8,
            transition: 'background-color 150ms ease',
          }}
        >
          {daThem ? 'Đã thêm vào giỏ ✓' : 'Thêm vào giỏ'}
        </Button>
      </Stack>
    </Card>
  );
}