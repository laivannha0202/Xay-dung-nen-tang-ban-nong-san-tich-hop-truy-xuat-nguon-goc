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
  { nhan: 'Rau củ & nông sản', href: '/san-pham' },
  { nhan: 'Truy xuất nguồn gốc', href: '/truy-xuat' },
  { nhan: 'Trang trại theo dõi', href: '/theo-doi' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
] as const;

export function AgriHeader() {
  const pathname = usePathname();
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);

  return (
    <>
      <AppShell.Header className="farm-header">
        <Box className="farm-announcement">
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" c="inherit" fw={700}>
                Nông sản từ trang trại · Thông tin nguồn gốc minh bạch
              </Text>
              <Group gap="xl">
                <Group gap={6}>
                  <IconQrcode size={14} stroke={1.8} />
                  <Text size="xs" c="inherit">
                    Kiểm tra mã truy xuất
                  </Text>
                </Group>
                <Text size="xs" c="inherit">
                  Mua sắm trên web & mobile
                </Text>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box className="farm-header-main">
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

                <Link href="/" className="farm-logo" aria-label="AgriMarket - Trang chủ">
                  <span className="farm-logo-mark">
                    <IconLeaf size={22} stroke={1.8} />
                  </span>
                  <Stack gap={0}>
                    <span className="farm-logo-name">AgriMarket</span>
                    <Text size="10px" c="dimmed" fw={700}>
                      Từ trang trại đến bữa ăn
                    </Text>
                  </Stack>
                </Link>
              </Group>

              <form action="/san-pham" method="get" className="farm-search">
                <TextInput
                  name="q"
                  aria-label="Tìm kiếm nông sản"
                  placeholder="Tìm rau củ, trái cây, gạo, trang trại..."
                  leftSection={<IconSearch size={18} stroke={1.8} />}
                />
              </form>

              <Group gap={7} wrap="nowrap">
                <Tooltip label="Yêu thích">
                  <ActionIcon
                    component={Link}
                    href="/yeu-thich"
                    variant="default"
                    size={42}
                    className="farm-icon-action"
                    aria-label="Yêu thích"
                    visibleFrom="sm"
                  >
                    <IconHeart size={20} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Giỏ hàng">
                  <ActionIcon
                    component={Link}
                    href="/gio-hang"
                    variant="default"
                    size={42}
                    className="farm-icon-action"
                    aria-label="Giỏ hàng"
                  >
                    <IconShoppingCart size={21} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Tài khoản">
                  <ActionIcon
                    component={Link}
                    href="/tai-khoan"
                    variant="default"
                    size={42}
                    className="farm-icon-action"
                    aria-label="Tài khoản"
                  >
                    <IconUser size={20} stroke={1.7} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box className="farm-header-nav">
          <AgriContainer w="100%">
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Group h="100%" gap={0}>
                {dieuHuong.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="farm-nav-link"
                      data-active={active ? 'true' : 'false'}
                    >
                      {item.nhan}
                    </Link>
                  );
                })}
              </Group>

              <Link href="/san-pham?sort=MOI_NHAT" className="farm-nav-link">
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
              label="Tìm kiếm nông sản"
              leftSection={<IconSearch size={18} />}
              onClick={dongMenuDiDong}
            />
            {dieuHuong.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.nhan}
                active={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
                onClick={dongMenuDiDong}
              />
            ))}
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

        <AppShell.Section>
          <Text size="xs" c="dimmed">
            AgriMarket · Nông sản minh bạch
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}
