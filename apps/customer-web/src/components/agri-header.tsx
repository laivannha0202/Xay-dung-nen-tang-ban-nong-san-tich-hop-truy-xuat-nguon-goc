'use client';

import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconBell,
  IconHeart,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconSearch,
  IconShoppingCart,
  IconUser,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { layGioHangKhach } from '@/lib/api-gio-hang';
import { layThongBaoKhachHangWeb } from '@/lib/api-thong-bao';
import { layPhienKhachHang, type PhienKhachHang } from '@/lib/phien-khach-hang';
import { useGiaoDienStore } from '@/stores/giao-dien.store';

import { AgriContainer } from './agri-container';

const PRIMARY = '#087A4B';
const GIO_HANG_HEADER_QUERY_KEY = ['gio-hang-khach'] as const;
const THONG_BAO_HEADER_QUERY_KEY = ['thong-bao-khach', 'header'] as const;

const dieuHuong = [
  { nhan: 'Trang chủ', href: '/' },
  { nhan: 'Nông sản', href: '/san-pham' },
  { nhan: 'Truy xuất nguồn gốc', href: '/truy-xuat' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
] as const;

function laDangHoatDong(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AgriHeader() {
  const pathname = usePathname();
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);
  const [phien, setPhien] = useState<PhienKhachHang | null>(null);

  useEffect(() => {
    setPhien(layPhienKhachHang());
  }, [pathname]);

  const gioHangQuery = useQuery({
    queryKey: GIO_HANG_HEADER_QUERY_KEY,
    queryFn: layGioHangKhach,
    enabled: Boolean(phien),
    staleTime: 15_000,
    retry: 0,
  });

  const thongBaoQuery = useQuery({
    queryKey: THONG_BAO_HEADER_QUERY_KEY,
    queryFn: layThongBaoKhachHangWeb,
    enabled: Boolean(phien),
    staleTime: 30_000,
    retry: 0,
  });

  const soLuongTrongGio = useMemo(
    () => (gioHangQuery.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [gioHangQuery.data],
  );
  const soThongBao = phien ? (thongBaoQuery.data?.tong ?? 0) : 0;

  return (
    <>
      <AppShell.Header className="farm-header">
        <Box
          visibleFrom="md"
          h={30}
          className="farm-announcement"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <AgriContainer w="100%">
            <Group justify="space-between" gap="lg" wrap="nowrap">
              <Text size="xs" fw={750}>
                Nông sản minh bạch từ trang trại 🌱
              </Text>
              <Group gap="xl" wrap="nowrap">
                <Group gap={5}>
                  <IconMapPin size={13} />
                  <Text size="xs">Giao hàng trong phạm vi Hưng Yên</Text>
                </Group>
                <Group gap={5}>
                  <IconQrcode size={13} />
                  <Text size="xs">Kiểm tra lô hàng bằng mã truy xuất</Text>
                </Group>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box
          h={{ base: 68, md: 70 }}
          className="farm-header-main"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <AgriContainer w="100%">
            <Group
              justify="space-between"
              wrap="nowrap"
              style={{ gap: 'clamp(10px, 2vw, 28px)' }}
            >
              <Group gap="sm" wrap="nowrap">
                <Burger
                  opened={moMenuDiDong}
                  onClick={batTatMenuDiDong}
                  hiddenFrom="md"
                  size="sm"
                  aria-label={moMenuDiDong ? 'Đóng điều hướng' : 'Mở điều hướng'}
                />

                <Link
                  href="/"
                  aria-label="AgriMarket - Trang chủ"
                  className="farm-logo"
                >
                  <Box
                    w={{ base: 38, md: 44 }}
                    h={{ base: 38, md: 44 }}
                    className="farm-logo-mark"
                    style={{ display: 'grid', placeItems: 'center', borderRadius: 12 }}
                  >
                    <IconLeaf size={25} stroke={1.9} />
                  </Box>
                  <Stack gap={1}>
                    <Text fw={900} fz={{ base: 'lg', md: 22 }} c="agrimarket.7" lh={1}>
                      AgriMarket
                    </Text>
                    <Text size="10px" c="dimmed" visibleFrom="sm">
                      Nông sản sạch, nguồn gốc rõ ràng
                    </Text>
                  </Stack>
                </Link>
              </Group>

              <Box visibleFrom="sm" style={{ flex: 1, maxWidth: 650 }}>
                <form action="/san-pham" method="get" role="search">
                  <TextInput
                    className="farm-search"
                    name="q"
                    aria-label="Tìm kiếm nông sản"
                    placeholder="Tìm nông sản, trang trại, khu vực..."
                    leftSection={<IconSearch size={18} stroke={1.8} />}
                    rightSection={
                      <ActionIcon type="submit" size={34} radius="md" color="agrimarket" aria-label="Tìm kiếm">
                        <IconSearch size={17} />
                      </ActionIcon>
                    }
                    rightSectionWidth={42}
                  />
                </form>
              </Box>

              <Group gap={6} wrap="nowrap">
                {phien ? (
                  <Tooltip label="Thông báo">
                    <Box pos="relative" visibleFrom="lg">
                      <ActionIcon
                        component={Link}
                        href="/thong-bao"
                        variant="subtle"
                        color="agrimarket"
                        size={40}
                        radius="md"
                        aria-label={`Thông báo${soThongBao > 0 ? `, ${soThongBao} cập nhật` : ''}`}
                      >
                        <IconBell size={20} stroke={1.8} />
                      </ActionIcon>
                      {soThongBao > 0 ? (
                        <Badge color="red" variant="filled" circle size="xs" pos="absolute" top={-3} right={-3} style={{ pointerEvents: 'none' }}>
                          {soThongBao > 99 ? '99+' : soThongBao}
                        </Badge>
                      ) : null}
                    </Box>
                  </Tooltip>
                ) : null}

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
                  <Box pos="relative">
                    <ActionIcon
                      component={Link}
                      href="/gio-hang"
                      variant="subtle"
                      color="agrimarket"
                      size={40}
                      radius="md"
                      aria-label={`Giỏ hàng${soLuongTrongGio > 0 ? `, ${soLuongTrongGio} sản phẩm` : ''}`}
                    >
                      <IconShoppingCart size={21} stroke={1.8} />
                    </ActionIcon>
                    {phien && soLuongTrongGio > 0 ? (
                      <Badge color="agrimarket" variant="filled" circle size="xs" pos="absolute" top={-3} right={-3} style={{ pointerEvents: 'none' }}>
                        {soLuongTrongGio > 99 ? '99+' : soLuongTrongGio}
                      </Badge>
                    ) : null}
                  </Box>
                </Tooltip>

                {phien ? (
                  <Tooltip label={phien.nguoiDung.hoTen || 'Tài khoản'}>
                    <ActionIcon
                      component={Link}
                      href="/tai-khoan"
                      variant="light"
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
                    <Button component={Link} href="/dang-nhap" variant="subtle" color="dark" size="sm">
                      Đăng nhập
                    </Button>
                    <Button component={Link} href="/dang-ky" color="agrimarket" size="sm">
                      Đăng ký
                    </Button>
                  </Group>
                )}
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box
          visibleFrom="md"
          h={42}
          className="farm-header-nav"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <AgriContainer w="100%">
            <Group h={42} justify="space-between" wrap="nowrap">
              <Group h="100%" gap={0}>
                {dieuHuong.map((item) => {
                  const active = laDangHoatDong(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="farm-nav-link"
                      data-active={active ? 'true' : undefined}
                    >
                      {item.nhan}
                    </Link>
                  );
                })}
              </Group>

              <Group gap={18} wrap="nowrap">
                <Link
                  href="/goi-y"
                  style={{ textDecoration: 'none', color: PRIMARY, fontSize: 13, fontWeight: 800 }}
                >
                  Gợi ý cho bạn
                </Link>
                <Link
                  href="/san-pham?sort=MOI_NHAT"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: PRIMARY, fontSize: 13, fontWeight: 800 }}
                >
                  <IconLeaf size={15} />
                  Mới thu hoạch
                </Link>
              </Group>
            </Group>
          </AgriContainer>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="white">
        <AppShell.Section>
          <form action="/san-pham" method="get" role="search">
            <TextInput
              name="q"
              placeholder="Tìm nông sản..."
              leftSection={<IconSearch size={17} />}
              rightSection={
                <ActionIcon type="submit" color="agrimarket" variant="light" aria-label="Tìm kiếm">
                  <IconSearch size={16} />
                </ActionIcon>
              }
            />
          </form>
          <Divider my="md" />
        </AppShell.Section>

        <AppShell.Section grow>
          <Stack gap={4}>
            {dieuHuong.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.nhan}
                active={laDangHoatDong(pathname, item.href)}
                onClick={dongMenuDiDong}
              />
            ))}
            <NavLink component={Link} href="/goi-y" label="Gợi ý cho bạn" leftSection={<IconLeaf size={18} />} onClick={dongMenuDiDong} />
            <NavLink component={Link} href="/yeu-thich" label="Yêu thích" leftSection={<IconHeart size={18} />} onClick={dongMenuDiDong} />
            <NavLink
              component={Link}
              href="/gio-hang"
              label={soLuongTrongGio > 0 ? `Giỏ hàng (${soLuongTrongGio})` : 'Giỏ hàng'}
              leftSection={<IconShoppingCart size={18} />}
              onClick={dongMenuDiDong}
            />
            {phien ? (
              <>
                <NavLink
                  component={Link}
                  href="/thong-bao"
                  label={soThongBao > 0 ? `Thông báo (${soThongBao})` : 'Thông báo'}
                  leftSection={<IconBell size={18} />}
                  onClick={dongMenuDiDong}
                />
                <NavLink component={Link} href="/tai-khoan" label="Tài khoản" leftSection={<IconUser size={18} />} onClick={dongMenuDiDong} />
              </>
            ) : null}
          </Stack>
        </AppShell.Section>

        {!phien ? (
          <AppShell.Section mt="md">
            <Divider mb="md" />
            <Stack gap="sm">
              <Button component={Link} href="/dang-nhap" variant="default" fullWidth onClick={dongMenuDiDong}>
                Đăng nhập
              </Button>
              <Button component={Link} href="/dang-ky" color="agrimarket" fullWidth onClick={dongMenuDiDong}>
                Đăng ký tài khoản
              </Button>
            </Stack>
          </AppShell.Section>
        ) : null}
      </AppShell.Navbar>
    </>
  );
}
