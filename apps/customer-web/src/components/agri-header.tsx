'use client';

import {
  ActionIcon,
  AppShell,
  Badge,
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
  IconMapPin,
  IconQrcode,
  IconSearch,
  IconShoppingCart,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { layPhienKhachHang, type PhienKhachHang } from '@/lib/phien-khach-hang';
import { useGiaoDienStore } from '@/stores/giao-dien.store';

import { AgriContainer } from './agri-container';

const PRIMARY = '#087A4B';

const dieuHuong = [
  { nhan: 'Trang chủ', href: '/' },
  { nhan: 'Sản phẩm', href: '/san-pham' },
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
  const [phien, setPhien] = useState<PhienKhachHang | null>(null);

  useEffect(() => {
    setPhien(layPhienKhachHang());
  }, [pathname]);

  return (
    <>
      <AppShell.Header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E7ECE9',
          boxShadow: '0 1px 0 rgba(23, 50, 31, 0.03)',
        }}
      >
        <Box
          visibleFrom="md"
          h={30}
          bg="#06663F"
          c="white"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <AgriContainer w="100%">
            <Group justify="space-between" gap="lg" wrap="nowrap">
              <Text size="xs" fw={700}>
                Nông sản sạch, cuộc sống xanh 🌱
              </Text>
              <Group gap="lg" wrap="nowrap">
                <Text size="xs">Truy xuất nguồn gốc</Text>
                <Text size="xs">Hỗ trợ khách hàng</Text>
                <Text size="xs">Giao hàng tận nơi</Text>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box h={{ base: 68, md: 70 }} style={{ display: 'flex', alignItems: 'center' }}>
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap" gap={{ base: 'sm', md: 'xl' }}>
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
                    w={{ base: 38, md: 44 }}
                    h={{ base: 38, md: 44 }}
                    bg="agrimarket.0"
                    c="agrimarket.6"
                    style={{
                      border: '1px solid #BDE9CF',
                      borderRadius: 12,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <IconLeaf size={25} stroke={1.9} />
                  </Box>
                  <Stack gap={1}>
                    <Text fw={900} fz={{ base: 'lg', md: 22 }} c="agrimarket.7" lh={1}>
                      AgriMarket
                    </Text>
                    <Text size="10px" c="dimmed" visibleFrom="sm">
                      Nông sản sạch, cuộc sống xanh
                    </Text>
                  </Stack>
                </Link>
              </Group>

              <Box visibleFrom="sm" style={{ flex: 1, maxWidth: 650 }}>
                <form action="/san-pham" method="get">
                  <TextInput
                    name="q"
                    aria-label="Tìm kiếm nông sản"
                    placeholder="Tìm rau củ, trái cây, gạo, trang trại..."
                    leftSection={<IconSearch size={18} stroke={1.8} />}
                    rightSection={
                      <ActionIcon type="submit" size={34} radius="md" color="agrimarket">
                        <IconSearch size={17} />
                      </ActionIcon>
                    }
                    rightSectionWidth={42}
                    styles={{
                      input: {
                        height: 44,
                        background: '#F8FAF9',
                        borderColor: '#DCE7DF',
                      },
                    }}
                  />
                </form>
              </Box>

              <Group gap={8} wrap="nowrap">
                <Tooltip label="Yêu thích">
                  <ActionIcon
                    component={Link}
                    href="/yeu-thich"
                    variant="subtle"
                    color="agrimarket"
                    size={40}
                    radius="md"
                    aria-label="Yêu thích"
                    visibleFrom="lg"
                  >
                    <IconHeart size={20} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Giỏ hàng">
                  <ActionIcon
                    component={Link}
                    href="/gio-hang"
                    variant="subtle"
                    color="agrimarket"
                    size={40}
                    radius="md"
                    aria-label="Giỏ hàng"
                  >
                    <IconShoppingCart size={21} stroke={1.8} />
                  </ActionIcon>
                </Tooltip>

                {phien ? (
                  <Tooltip label={phien.nguoiDung.hoTen || 'Tài khoản'}>
                    <ActionIcon
                      component={Link}
                      href="/tai-khoan"
                      variant="subtle"
                      color="agrimarket"
                      size={40}
                      radius="md"
                      aria-label="Tài khoản"
                    >
                      <IconUser size={20} stroke={1.8} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Group gap={6} visibleFrom="md">
                    <Link
                      href="/dang-nhap"
                      style={{
                        color: '#17251C',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 750,
                      }}
                    >
                      Đăng nhập
                    </Link>
                    <Badge
                      component={Link}
                      href="/dang-ky"
                      color="agrimarket"
                      variant="filled"
                      size="lg"
                      style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                      Đăng ký
                    </Badge>
                  </Group>
                )}
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box
          visibleFrom="md"
          h={42}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderTop: '1px solid #F0F3F1',
            background: '#FFFFFF',
          }}
        >
          <AgriContainer w="100%">
            <Group h={42} justify="space-between" wrap="nowrap">
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
                        height: 42,
                        padding: '0 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 750,
                        color: active ? PRIMARY : '#3D4840',
                        borderBottom: active ? `2px solid ${PRIMARY}` : '2px solid transparent',
                      }}
                    >
                      {item.nhan}
                    </Link>
                  );
                })}
              </Group>

              <Group gap={16} wrap="nowrap">
                <Group gap={5} c="agrimarket.7">
                  <IconMapPin size={15} />
                  <Text size="xs" fw={700}>
                    Giao hàng toàn quốc
                  </Text>
                </Group>
                <Link
                  href="/san-pham?sort=MOI_NHAT"
                  style={{
                    height: 42,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    color: PRIMARY,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <IconLeaf size={15} />
                  Mới thu hoạch
                </Link>
              </Group>
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
              href="/gio-hang"
              label="Giỏ hàng"
              leftSection={<IconShoppingCart size={18} />}
              onClick={dongMenuDiDong}
            />
            <NavLink
              component={Link}
              href={phien ? '/tai-khoan' : '/dang-nhap'}
              label={phien ? 'Tài khoản' : 'Đăng nhập'}
              leftSection={<IconUser size={18} />}
              onClick={dongMenuDiDong}
            />
            {!phien ? (
              <NavLink
                component={Link}
                href="/dang-ky"
                label="Đăng ký tài khoản"
                leftSection={<IconLeaf size={18} />}
                onClick={dongMenuDiDong}
              />
            ) : null}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}
