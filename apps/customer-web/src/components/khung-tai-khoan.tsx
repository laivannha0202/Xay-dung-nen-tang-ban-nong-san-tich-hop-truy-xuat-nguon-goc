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
  ThemeIcon,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCoins,
  IconHeart,
  IconHelpCircle,
  IconHome,
  IconLeaf,
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
  { key: 'tong-quan', label: 'Tổng quan', href: '/tai-khoan', icon: IconHome },
  { key: 'don-hang', label: 'Đơn hàng của tôi', href: '/don-hang', icon: IconShoppingBag },
  { key: 'ho-so', label: 'Hồ sơ cá nhân', href: '/tai-khoan/ho-so', icon: IconUser },
  { key: 'dia-chi', label: 'Địa chỉ giao hàng', href: '/tai-khoan/dia-chi', icon: IconMapPin },
  { key: 'diem-thuong', label: 'Điểm thưởng', href: '/diem-thuong', icon: IconCoins },
  { key: 'yeu-thich', label: 'Sản phẩm yêu thích', href: '/yeu-thich', icon: IconHeart },
  { key: 'theo-doi', label: 'Trang trại theo dõi', href: '/theo-doi', icon: IconBuildingStore },
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

  const avatar = daNap ? (
    <Avatar color="agrimarket" variant="light" radius="xl" size={52}>
      {layChuCaiDau(ten)}
    </Avatar>
  ) : (
    <Skeleton height={52} width={52} circle />
  );

  const dinhDanh = daNap ? (
    <>
      <Text fw={700} fz="md" lh={1.4} lineClamp={1}>
        {ten}
      </Text>
      {email ? (
        <Text size="sm" c="dimmed" lineClamp={1}>
          {email}
        </Text>
      ) : null}
    </>
  ) : (
    <>
      <Skeleton height={18} width={160} />
      <Skeleton height={14} width={200} />
    </>
  );

  return (
    <Box className="agri-page agri-account">
      <AgriContainer size="80rem" py={{ base: 'md', md: 'xl' }}>
        <Stack gap="md">
          {/* Mobile: compact profile + horizontally scrollable chips */}
          <Paper hiddenFrom="md" withBorder p="md" radius="md" className="agri-surface">
            <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
              {avatar}
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                {dinhDanh}
                <Text size="xs" c="dimmed">
                  Quản lý đơn hàng và thông tin tài khoản
                </Text>
              </Stack>
            </Group>
            <Button
              component={Link}
              href="/tai-khoan/ho-so"
              variant="light"
              color="agrimarket"
              leftSection={<IconUser size={16} />}
              fullWidth
              mt="md"
            >
              Chỉnh sửa hồ sơ
            </Button>
          </Paper>

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
            {/* Desktop left column 240-250px: profile + nav + brand */}
            <Stack visibleFrom="md" gap="md" style={{ width: 250, flex: '0 0 250px' }}>
              <Paper withBorder p="lg" radius="md" className="agri-surface">
                <Stack gap="md">
                  <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                    {avatar}
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      {dinhDanh}
                    </Stack>
                  </Group>
                  <Button
                    component={Link}
                    href="/tai-khoan/ho-so"
                    variant="light"
                    color="agrimarket"
                    leftSection={<IconUser size={16} />}
                    fullWidth
                  >
                    Chỉnh sửa hồ sơ
                  </Button>
                </Stack>
              </Paper>

              <Paper
                withBorder
                p="xs"
                radius="md"
                className="agri-surface"
                style={{ position: 'sticky', top: 132 }}
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

              <Paper withBorder p="md" radius="md" className="agri-surface">
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size={38} radius="md" variant="light" color="agrimarket">
                    <IconLeaf size={19} />
                  </ThemeIcon>
                  <Stack gap={1}>
                    <Text size="sm" fw={850}>
                      Cùng AgriMarket
                    </Text>
                    <Text size="xs" c="dimmed">
                      Vì nông sản sạch
                    </Text>
                    <Text size="xs" c="dimmed">
                      Vì cuộc sống xanh
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </Stack>

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
