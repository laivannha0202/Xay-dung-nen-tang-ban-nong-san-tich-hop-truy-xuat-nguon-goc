'use client';

import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconChevronDown,
  IconLeaf,
  IconMapPin,
  IconMenu2,
  IconQrcode,
  IconSearch,
  IconShoppingCart,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { layGioHangKhach } from '@/lib/api-gio-hang';
import { layPhienKhachHang, type PhienKhachHang } from '@/lib/phien-khach-hang';
import { useGiaoDienStore } from '@/stores/giao-dien.store';
import { AgriContainer } from './agri-container';

const GIO_HANG_HEADER_QUERY_KEY = ['gio-hang-khach'] as const;

const dieuHuong = [
  { nhan: 'Trang chủ', href: '/' },
  { nhan: 'Sản phẩm', href: '/san-pham' },
  { nhan: 'Trang trại', href: '/#trang-trai' },
  { nhan: 'Khuyến mãi', href: '/#flash-sale' },
  { nhan: 'Kiến thức', href: '/#kien-thuc' },
  { nhan: 'Liên hệ', href: '/#footer' },
] as const;

export function AgriHeader() {
  const pathname = usePathname();
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);
  const [phien, setPhien] = useState<PhienKhachHang | null>(null);

  useEffect(() => setPhien(layPhienKhachHang()), [pathname]);

  const gioHangQuery = useQuery({
    queryKey: GIO_HANG_HEADER_QUERY_KEY,
    queryFn: layGioHangKhach,
    enabled: Boolean(phien),
    staleTime: 15_000,
    retry: 0,
  });

  const soLuongTrongGio = useMemo(
    () => (gioHangQuery.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [gioHangQuery.data],
  );

  const tongTienGioHang = useMemo(() => {
    const tong = (gioHangQuery.data?.muc ?? []).reduce(
      (acc, item) => acc + item.soLuong * (item.bienThe?.giaHienTai ?? 0),
      0,
    );
    return `${new Intl.NumberFormat('vi-VN').format(tong)}đ`;
  }, [gioHangQuery.data]);

  return (
    <>
      <AppShell.Header className="market-header" style={{ borderBottom: '1px solid #E2EAE4' }}>
        {/* Main header row */}
        <Box h={{ base: 68, md: 70 }} bg="white" style={{ display: 'flex', alignItems: 'center' }}>
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap" style={{ gap: 'clamp(10px, 2vw, 24px)' }}>
              <Group gap="sm" wrap="nowrap">
                <Burger
                  opened={moMenuDiDong}
                  onClick={batTatMenuDiDong}
                  hiddenFrom="md"
                  size="sm"
                  aria-label="Mở điều hướng"
                />
                <Link href="/" aria-label="AgriMarket - Trang chủ" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Box
                    w={38}
                    h={38}
                    bg="#0B7A48"
                    style={{
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                    }}
                  >
                    <IconLeaf size={24} stroke={2.2} />
                  </Box>
                  <Stack gap={0}>
                    <Text fw={900} fz={{ base: 20, md: 24 }} c="#0B7A48" lh={1.1} style={{ letterSpacing: '-0.02em' }}>
                      AgriMarket
                    </Text>
                    <Text size="10px" c="#68766D" fw={500} visibleFrom="sm">
                      Nông sản sạch, cuộc sống xanh
                    </Text>
                  </Stack>
                </Link>
              </Group>

              {/* Search bar */}
              <Box visibleFrom="sm" style={{ flex: 1, maxWidth: 620, margin: '0 16px' }}>
                <form action="/san-pham" method="get">
                  <TextInput
                    name="q"
                    aria-label="Tìm kiếm nông sản"
                    placeholder="Tìm kiếm rau củ, trái cây, thịt, trứng, trang trại..."
                    size="md"
                    styles={{
                      input: {
                        height: 44,
                        borderRadius: 8,
                        backgroundColor: '#F7FAF8',
                        borderColor: '#D8E5DC',
                        fontSize: 14,
                        paddingRight: 50,
                      },
                    }}
                    rightSection={
                      <ActionIcon
                        type="submit"
                        size={36}
                        radius={6}
                        bg="#0B7A48"
                        color="white"
                        variant="filled"
                        aria-label="Tìm kiếm"
                        style={{ marginRight: 4 }}
                      >
                        <IconSearch size={18} stroke={2.2} />
                      </ActionIcon>
                    }
                    rightSectionWidth={46}
                  />
                </form>
              </Box>

              {/* Account and Cart */}
              <Group gap={16} wrap="nowrap" align="center">
                {phien ? (
                  <Link href="/tai-khoan" style={{ textDecoration: 'none', color: '#173126' }}>
                    <Group gap={8} wrap="nowrap">
                      <IconUser size={20} color="#0B7A48" />
                      <Stack gap={0} visibleFrom="sm">
                        <Text size="xs" fw={700} lineClamp={1}>
                          {phien.nguoiDung?.hoTen || 'Tài khoản'}
                        </Text>
                      </Stack>
                    </Group>
                  </Link>
                ) : (
                  <Group gap={12} wrap="nowrap" visibleFrom="sm">
                    <Link
                      href="/dang-nhap"
                      style={{
                        textDecoration: 'none',
                        color: '#173126',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <IconUser size={18} color="#0B7A48" />
                      <span>Đăng nhập</span>
                    </Link>
                    <Link
                      href="/dang-ky"
                      style={{
                        textDecoration: 'none',
                        color: '#173126',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <IconUserPlus size={18} color="#0B7A48" />
                      <span>Đăng ký</span>
                    </Link>
                  </Group>
                )}

                {/* Cart with price */}
                <Link
                  href="/gio-hang"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#173126',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: '#F5F9F6',
                  }}
                >
                  <Box pos="relative" style={{ display: 'flex', alignItems: 'center' }}>
                    <IconShoppingCart size={22} color="#0B7A48" />
                    {soLuongTrongGio > 0 ? (
                      <Badge
                        color="red"
                        circle
                        size="xs"
                        pos="absolute"
                        top={-6}
                        right={-8}
                        styles={{ root: { fontSize: 10, width: 17, height: 17, minWidth: 17 } }}
                      >
                        {soLuongTrongGio}
                      </Badge>
                    ) : null}
                  </Box>
                  <Stack gap={0} visibleFrom="sm">
                    <Text size="11px" c="dimmed" lh={1.1}>
                      Giỏ hàng
                    </Text>
                    <Text size="xs" fw={800} c="#0B7A48" lh={1.2}>
                      {tongTienGioHang}
                    </Text>
                  </Stack>
                </Link>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        {/* Nav row with category rail header */}
        <Box
          visibleFrom="md"
          h={42}
          bg="white"
          style={{ borderTop: '1px solid #EEF3F0', display: 'flex', alignItems: 'center' }}
        >
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="lg" wrap="nowrap">
                {/* Danh mục sản phẩm button - 234px to align with category rail */}
                <Button
                  component={Link}
                  href="/san-pham"
                  bg="#06633C"
                  c="white"
                  radius="sm"
                  h={42}
                  w={234}
                  leftSection={<IconMenu2 size={18} />}
                  styles={{
                    root: {
                      borderRadius: '4px 4px 0 0',
                      fontWeight: 750,
                      fontSize: 14,
                      justifyContent: 'flex-start',
                      paddingLeft: 16,
                    },
                  }}
                >
                  Danh mục sản phẩm
                </Button>

                {/* Nav links */}
                <Group gap={6} wrap="nowrap">
                  {dieuHuong.map((item) => {
                    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`${item.href}-${item.nhan}`}
                        href={item.href}
                        style={{
                          textDecoration: 'none',
                          fontSize: 13.5,
                          fontWeight: active ? 750 : 600,
                          color: active ? '#0B7A48' : '#334D3F',
                          padding: '6px 14px',
                          borderRadius: 20,
                          backgroundColor: active ? '#EBF5EE' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {item.nhan}
                      </Link>
                    );
                  })}
                </Group>
              </Group>

              {/* Location */}
              <Group gap={4} c="#0B7A48" wrap="nowrap" style={{ cursor: 'pointer' }}>
                <IconMapPin size={15} />
                <Stack gap={0}>
                  <Text size="10px" c="dimmed" lh={1}>
                    Giao đến
                  </Text>
                  <Group gap={2} wrap="nowrap">
                    <Text size="xs" fw={750} c="#0B7A48">
                      Hà Nội
                    </Text>
                    <IconChevronDown size={12} />
                  </Group>
                </Stack>
              </Group>
            </Group>
          </AgriContainer>
        </Box>
      </AppShell.Header>

      {/* Mobile drawer */}
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap={4}>
            {dieuHuong.map((item) => (
              <NavLink
                key={`${item.href}-${item.nhan}`}
                component={Link}
                href={item.href}
                label={item.nhan}
                active={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
                onClick={dongMenuDiDong}
              />
            ))}
            <NavLink
              component={Link}
              href="/san-pham"
              label="Danh mục sản phẩm"
              leftSection={<IconMenu2 size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href="/truy-xuat"
              label="Quét / nhập mã QR"
              leftSection={<IconQrcode size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href="/gio-hang"
              label={soLuongTrongGio > 0 ? `Giỏ hàng (${soLuongTrongGio})` : 'Giỏ hàng'}
              leftSection={<IconShoppingCart size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href={phien ? '/tai-khoan' : '/dang-nhap'}
              label={phien ? 'Tài khoản' : 'Đăng nhập / Đăng ký'}
              leftSection={<IconUser size={18} />}
              onClick={dongMenuDiDong}
            />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}