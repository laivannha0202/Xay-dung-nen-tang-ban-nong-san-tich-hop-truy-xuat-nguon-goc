'use client';

import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  NavLink,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconHeart,
  IconLeaf,
  IconQrcode,
  IconSearch,
  IconShoppingCart,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useGiaoDienStore } from '@/stores/giao-dien.store';

import { AgriContainer } from './agri-container';

const dieuHuong = [
  { nhan: 'Trang chủ', href: '/' },
  { nhan: 'Nông sản', href: '/san-pham' },
  { nhan: 'Rau củ', href: '/san-pham?q=rau' },
  { nhan: 'Trái cây', href: '/san-pham?q=trái cây' },
  { nhan: 'Gạo & ngũ cốc', href: '/san-pham?q=gạo' },
  { nhan: 'Truy xuất', href: '/truy-xuat' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
] as const;

export function AgriHeader() {
  const pathname = usePathname();
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);

  return (
    <>
      <AppShell.Header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e8e8e2',
          boxShadow: '0 1px 0 rgba(23, 50, 31, 0.02)',
        }}
      >
        <Box h={{ base: 68, md: 64 }} style={{ display: 'flex', alignItems: 'center' }}>
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap" gap="lg">
              <Group gap="sm" wrap="nowrap">
                <Burger
                  opened={moMenuDiDong}
                  onClick={batTatMenuDiDong}
                  hiddenFrom="md"
                  size="sm"
                  aria-label="Mở điều hướng"
                />

                <Link
                  href="/"
                  aria-label="AgriMarket - Trang chủ"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    textDecoration: 'none',
                    color: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box
                    w={36}
                    h={36}
                    bg="agrimarket.0"
                    c="agrimarket.8"
                    style={{
                      border: '1px solid #cddccc',
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <IconLeaf size={21} stroke={1.8} />
                  </Box>
                  <Stack gap={0}>
                    <Text fw={900} fz="lg" c="agrimarket.9" lh={1}>
                      AgriMarket
                    </Text>
                    <Text size="10px" c="dimmed" visibleFrom="sm">
                      Nông sản minh bạch
                    </Text>
                  </Stack>
                </Link>
              </Group>

              <form action="/san-pham" method="get" style={{ width: '100%', maxWidth: 650 }}>
                <TextInput
                  name="q"
                  aria-label="Tìm kiếm nông sản"
                  placeholder="Tìm rau củ, trái cây, gạo, trang trại..."
                  leftSection={<IconSearch size={18} stroke={1.8} />}
                  styles={{
                    input: {
                      height: 42,
                      borderRadius: 8,
                      background: '#fafaf7',
                      borderColor: '#ddddD6',
                    },
                  }}
                />
              </form>

              <Group gap={7} wrap="nowrap">
                <Tooltip label="Yêu thích">
                  <ActionIcon
                    component={Link}
                    href="/yeu-thich"
                    variant="default"
                    size={40}
                    radius="md"
                    aria-label="Yêu thích"
                    visibleFrom="sm"
                  >
                    <IconHeart size={19} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Giỏ hàng">
                  <ActionIcon
                    component={Link}
                    href="/gio-hang"
                    variant="default"
                    size={40}
                    radius="md"
                    aria-label="Giỏ hàng"
                  >
                    <IconShoppingCart size={20} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Tài khoản">
                  <ActionIcon
                    component={Link}
                    href="/tai-khoan"
                    variant="default"
                    size={40}
                    radius="md"
                    aria-label="Tài khoản"
                  >
                    <IconUser size={19} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box
          visibleFrom="md"
          h={40}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid #f0f0eb',
            background: '#ffffff',
          }}
        >
          <AgriContainer w="100%">
            <Group h={40} justify="space-between" wrap="nowrap">
              <Group h="100%" gap={0}>
                {dieuHuong.map((item) => {
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : item.href.startsWith('/san-pham?')
                        ? false
                        : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        height: 40,
                        padding: '0 13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 750,
                        color: active ? '#245a35' : '#3d4840',
                        borderBottom: active ? '2px solid #2f7d4d' : '2px solid transparent',
                      }}
                    >
                      {item.nhan}
                    </Link>
                  );
                })}
              </Group>

              <Link
                href="/san-pham?sort=MOI_NHAT"
                style={{
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  color: '#245a35',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                <IconLeaf size={15} />
                Mới thu hoạch
              </Link>
            </Group>
          </AgriContainer>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap={4}>
            <NavLink
              component={Link}
              href="/san-pham"
              label="Tìm nông sản"
              leftSection={<IconSearch size={18} />}
              onClick={dongMenuDiDong}
            />

            {dieuHuong.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.nhan}
                active={
                  item.href === '/'
                    ? pathname === '/'
                    : !item.href.includes('?') && pathname.startsWith(item.href)
                }
                onClick={dongMenuDiDong}
              />
            ))}

            <NavLink
              component={Link}
              href="/truy-xuat"
              label="Kiểm tra mã truy xuất"
              leftSection={<IconQrcode size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href="/yeu-thich"
              label="Sản phẩm yêu thích"
              leftSection={<IconHeart size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href="/gio-hang"
              label="Giỏ hàng"
              leftSection={<IconShoppingCart size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href="/tai-khoan"
              label="Tài khoản"
              leftSection={<IconUser size={18} />}
              onClick={dongMenuDiDong}
            />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}
