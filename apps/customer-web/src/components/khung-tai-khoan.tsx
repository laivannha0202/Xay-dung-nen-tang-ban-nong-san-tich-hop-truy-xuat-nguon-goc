'use client';

import {
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconBell,
  IconBuildingStore,
  IconCoins,
  IconHeart,
  IconHelpCircle,
  IconLayoutDashboard,
  IconLogout,
  IconMapPin,
  IconShoppingBag,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { layPhienKhachHang, xoaPhienKhachHang, type PhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';

export const ACCOUNT_NAV = [
  { key: 'tong-quan', label: 'Tổng quan', href: '/tai-khoan', icon: IconLayoutDashboard },
  { key: 'don-hang', label: 'Đơn hàng của tôi', href: '/don-hang', icon: IconShoppingBag },
  { key: 'ho-so', label: 'Hồ sơ cá nhân', href: '/tai-khoan/ho-so', icon: IconUser },
  { key: 'dia-chi', label: 'Sổ địa chỉ', href: '/tai-khoan/dia-chi', icon: IconMapPin },
  { key: 'diem-thuong', label: 'Điểm thưởng', href: '/diem-thuong', icon: IconCoins },
  { key: 'yeu-thich', label: 'Sản phẩm yêu thích', href: '/yeu-thich', icon: IconHeart },
  { key: 'theo-doi', label: 'Trang trại theo dõi', href: '/theo-doi', icon: IconBuildingStore },
  { key: 'thong-bao', label: 'Thông báo', href: '/thong-bao', icon: IconBell },
  { key: 'ho-tro', label: 'Yêu cầu hỗ trợ', href: '/khieu-nai', icon: IconHelpCircle },
] as const;

function laActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/tai-khoan') return pathname === '/tai-khoan';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function layChuCaiDau(ten: string): string {
  const parts = ten.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  const dau = parts[0]?.slice(0, 1) ?? 'A';
  if (parts.length === 1) return dau.toUpperCase();
  const cuoi = parts[parts.length - 1]?.slice(0, 1) ?? '';
  return `${dau}${cuoi}`.toUpperCase();
}

type KhungTaiKhoanProps = {
  children: ReactNode;
};

export function KhungTaiKhoan({ children }: KhungTaiKhoanProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [phien, setPhien] = useState<PhienKhachHang | null>(null);
  const [daNap, setDaNap] = useState(false);

  useEffect(() => {
    setPhien(layPhienKhachHang());
    setDaNap(true);
  }, [pathname]);

  const dangXuat = () => {
    xoaPhienKhachHang();
    router.replace('/dang-nhap');
  };

  const ten = phien?.nguoiDung?.hoTen?.trim() || 'Khách hàng';
  const email = phien?.nguoiDung?.email?.trim() || '';

  return (
    <Box className="agri-page">
      <AgriContainer size="80rem" py={{ base: 'md', md: 'xl' }}>
        <Stack gap="md">
          {/* Compact account header: 100-150px, no marketing hero */}
          <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                {daNap ? (
                  <Avatar color="agrimarket" variant="light" radius="xl" size={52}>
                    {layChuCaiDau(ten)}
                  </Avatar>
                ) : (
                  <Skeleton height={52} width={52} circle />
                )}
                <Stack gap={2} style={{ minWidth: 0 }}>
                  {daNap ? (
                    <>
                      <Text fw={850} fz="lg" lineClamp={1}>
                        {ten}
                      </Text>
                      {email ? (
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {email}
                        </Text>
                      ) : null}
                      <Text size="xs" c="dimmed">
                        Quản lý đơn hàng và thông tin tài khoản
                      </Text>
                    </>
                  ) : (
                    <>
                      <Skeleton height={18} width={180} />
                      <Skeleton height={14} width={220} />
                    </>
                  )}
                </Stack>
              </Group>
              <Button
                component={Link}
                href="/tai-khoan/ho-so"
                variant="light"
                color="agrimarket"
                leftSection={<IconUser size={16} />}
              >
                Chỉnh sửa hồ sơ
              </Button>
            </Group>
          </Paper>

          {/* Mobile account navigation: horizontally scrollable chips */}
          <ScrollArea hiddenFrom="md" type="scroll" offsetScrollbars aria-label="Điều hướng tài khoản">
            <Group gap="xs" wrap="nowrap" py={2} style={{ minWidth: 'max-content' }}>
              {ACCOUNT_NAV.map((item) => {
                const Icon = item.icon;
                const active = laActive(pathname, item.href);
                return (
                  <Button
                    key={item.key}
                    component={Link}
                    href={item.href}
                    size="sm"
                    radius="xl"
                    variant={active ? 'filled' : 'light'}
                    color="agrimarket"
                    leftSection={<Icon size={16} />}
                    aria-current={active ? 'page' : undefined}
                    style={{ flex: '0 0 auto' }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Group>
          </ScrollArea>

          <Group align="flex-start" gap="lg" wrap="nowrap">
            {/* Desktop sidebar 220-250px */}
            <Paper
              withBorder
              p="xs"
              radius="lg"
              className="agri-surface"
              visibleFrom="md"
              style={{ width: 240, flex: '0 0 240px', position: 'sticky', top: 132 }}
              aria-label="Điều hướng tài khoản"
            >
              <Stack gap={2}>
                {ACCOUNT_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = laActive(pathname, item.href);
                  return (
                    <NavLink
                      key={item.key}
                      component={Link}
                      href={item.href}
                      label={item.label}
                      leftSection={<Icon size={18} />}
                      active={active}
                      aria-current={active ? 'page' : undefined}
                      color="agrimarket"
                      variant={active ? 'light' : undefined}
                      styles={{
                        root: active
                          ? { backgroundColor: 'var(--agri-primary-soft)', fontWeight: 800 }
                          : undefined,
                      }}
                    />
                  );
                })}
                <Divider my="xs" />
                <NavLink
                  label="Đăng xuất"
                  leftSection={<IconLogout size={18} />}
                  onClick={dangXuat}
                  aria-label="Đăng xuất khỏi AgriMarket"
                  style={{ cursor: 'pointer' }}
                />
              </Stack>
            </Paper>

            {/* Page content */}
            <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
          </Group>

          {/* Mobile logout */}
          <Group hiddenFrom="md" justify="flex-end">
            <Button variant="subtle" color="gray" size="sm" leftSection={<IconLogout size={16} />} onClick={dangXuat} aria-label="Đăng xuất khỏi AgriMarket">
              Đăng xuất
            </Button>
          </Group>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
