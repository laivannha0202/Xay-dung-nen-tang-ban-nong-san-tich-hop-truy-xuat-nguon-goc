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
  { nhan: 'Sản phẩm', href: '/san-pham' },
  { nhan: 'Truy xuất nguồn gốc', href: '/truy-xuat' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
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
      <AppShell.Header className="market-header">
        <Box visibleFrom="md" h={30} bg="#06663F" c="white" style={{ display: 'flex', alignItems: 'center' }}>
          <AgriContainer w="100%">
            <Group justify="space-between" gap="lg" wrap="nowrap">
              <Text size="xs" fw={700}>Nông sản sạch, cuộc sống xanh 🌱</Text>
              <Group gap="lg" wrap="nowrap">
                <Link href="/truy-xuat" className="market-top-link">Truy xuất nguồn gốc</Link>
                <Text size="xs">Hỗ trợ khách hàng</Text>
                <Text size="xs">1900 1234</Text>
                <Text size="xs">cskh@agrimarket.vn</Text>
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box h={{ base: 68, md: 70 }} style={{ display: 'flex', alignItems: 'center' }}>
          <AgriContainer w="100%">
            <Group justify="space-between" wrap="nowrap" style={{ gap: 'clamp(10px, 2vw, 28px)' }}>
              <Group gap="sm" wrap="nowrap">
                <Burger opened={moMenuDiDong} onClick={batTatMenuDiDong} hiddenFrom="md" size="sm" aria-label="Mở điều hướng" />
                <Link href="/" aria-label="AgriMarket - Trang chủ" className="market-logo">
                  <Box className="market-logo-mark"><IconLeaf size={25} stroke={1.9} /></Box>
                  <Stack gap={1}>
                    <Text fw={900} fz={{ base: 'lg', md: 23 }} c="agrimarket.7" lh={1}>AgriMarket</Text>
                    <Text size="10px" c="dimmed" visibleFrom="sm">Nông sản sạch, cuộc sống xanh</Text>
                  </Stack>
                </Link>
              </Group>

              <Box visibleFrom="sm" style={{ flex: 1, maxWidth: 720 }}>
                <form action="/san-pham" method="get">
                  <TextInput
                    name="q"
                    aria-label="Tìm kiếm nông sản"
                    placeholder="Tìm rau củ, trái cây, thịt, trứng, trang trại..."
                    leftSection={<IconSearch size={18} stroke={1.8} />}
                    rightSection={<ActionIcon type="submit" size={34} radius="md" color="agrimarket"><IconSearch size={17} /></ActionIcon>}
                    rightSectionWidth={42}
                    styles={{ input: { height: 44, background: '#F8FAF9', borderColor: '#DCE7DF' } }}
                  />
                </form>
              </Box>

              <Group gap={5} wrap="nowrap">
                <Tooltip label="Quét / nhập mã truy xuất">
                  <ActionIcon component={Link} href="/truy-xuat" variant="subtle" color="agrimarket" size={40} radius="md" aria-label="Truy xuất QR">
                    <IconQrcode size={21} />
                  </ActionIcon>
                </Tooltip>
                {phien ? (
                  <Tooltip label="Thông báo"><Box pos="relative" visibleFrom="lg">
                    <ActionIcon component={Link} href="/thong-bao" variant="subtle" color="agrimarket" size={40} radius="md" aria-label="Thông báo"><IconBell size={20} /></ActionIcon>
                    {soThongBao > 0 ? <Badge color="agrimarket" circle size="xs" pos="absolute" top={-3} right={-3}>{soThongBao > 99 ? '99+' : soThongBao}</Badge> : null}
                  </Box></Tooltip>
                ) : null}
                <ActionIcon component={Link} href="/yeu-thich" variant="subtle" color="agrimarket" size={40} radius="md" aria-label="Yêu thích" visibleFrom="lg"><IconHeart size={20} /></ActionIcon>
                <Box pos="relative">
                  <ActionIcon component={Link} href="/gio-hang" variant="subtle" color="agrimarket" size={40} radius="md" aria-label="Giỏ hàng"><IconShoppingCart size={21} /></ActionIcon>
                  {phien && soLuongTrongGio > 0 ? <Badge color="red" circle size="xs" pos="absolute" top={-3} right={-3}>{soLuongTrongGio > 99 ? '99+' : soLuongTrongGio}</Badge> : null}
                </Box>
                {phien ? (
                  <ActionIcon component={Link} href="/tai-khoan" variant="subtle" color="agrimarket" size={40} radius="md" aria-label="Tài khoản"><IconUser size={20} /></ActionIcon>
                ) : (
                  <Group gap={8} visibleFrom="md">
                    <Link href="/dang-nhap" className="market-login">Đăng nhập</Link>
                    <Badge component={Link} href="/dang-ky" color="agrimarket" variant="filled" size="lg" style={{ textDecoration: 'none', cursor: 'pointer' }}>Đăng ký</Badge>
                  </Group>
                )}
              </Group>
            </Group>
          </AgriContainer>
        </Box>

        <Box visibleFrom="md" h={42} className="market-nav-row">
          <AgriContainer w="100%">
            <Group h={42} justify="space-between" wrap="nowrap">
              <Group h="100%" gap={0}>
                {dieuHuong.map((item) => {
                  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return <Link key={item.href} href={item.href} className="market-nav-link" data-active={active}>{item.nhan}</Link>;
                })}
                <Link href="/san-pham?sort=MOI_NHAT" className="market-nav-link">Mới thu hoạch</Link>
              </Group>
              <Group gap={5} c="agrimarket.7"><IconMapPin size={15} /><Text size="xs" fw={700}>Giao đến Hà Nội</Text></Group>
            </Group>
          </AgriContainer>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap={4}>
            <NavLink component={Link} href="/san-pham" label="Tìm nông sản" leftSection={<IconSearch size={18} />} onClick={dongMenuDiDong} />
            {dieuHuong.map((item) => <NavLink key={item.href} component={Link} href={item.href} label={item.nhan} active={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)} onClick={dongMenuDiDong} />)}
            <NavLink component={Link} href="/truy-xuat" label="Quét / nhập mã QR" leftSection={<IconQrcode size={18} />} onClick={dongMenuDiDong} />
            <NavLink component={Link} href="/yeu-thich" label="Yêu thích" leftSection={<IconHeart size={18} />} onClick={dongMenuDiDong} />
            <NavLink component={Link} href="/gio-hang" label={soLuongTrongGio > 0 ? `Giỏ hàng (${soLuongTrongGio})` : 'Giỏ hàng'} leftSection={<IconShoppingCart size={18} />} onClick={dongMenuDiDong} />
            <NavLink component={Link} href={phien ? '/tai-khoan' : '/dang-nhap'} label={phien ? 'Tài khoản' : 'Đăng nhập'} leftSection={<IconUser size={18} />} onClick={dongMenuDiDong} />
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}
