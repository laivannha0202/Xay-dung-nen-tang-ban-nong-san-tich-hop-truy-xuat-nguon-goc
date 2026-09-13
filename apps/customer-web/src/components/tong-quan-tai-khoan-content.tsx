'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBell,
  IconBuildingStore,
  IconChevronRight,
  IconCircleCheck,
  IconCoins,
  IconHeart,
  IconPackage,
  IconShoppingBag,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { layDanhSachDonHangKhach, nhanTrangThaiDonHang } from '@/lib/api-don-hang';
import { layHoSoKhachHangWeb, type HoSoKhachHang } from '@/lib/api-ho-so-khach-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

type DonHangGanDay = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  createdAt: string;
};

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

function mauTrangThai(trangThai: string): string {
  if (trangThai === 'DA_HUY') return 'red';
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'green';
  if (trangThai === 'DANG_GIAO') return 'blue';
  if (trangThai === 'CHO_THANH_TOAN') return 'orange';
  return 'teal';
}

// Quick order statuses use only real backend enums.
const TRANG_THAI_NHANH = [
  { enum: 'CHO_THANH_TOAN', icon: IconPackage },
  { enum: 'DA_XAC_NHAN', icon: IconCircleCheck },
  { enum: 'DANG_GIAO', icon: IconTruckDelivery },
  { enum: 'DA_GIAO', icon: IconShoppingBag },
] as const;

const LOI_TAT_NHANH = [
  { title: 'Điểm thưởng', description: 'Số dư và lịch sử điểm', href: '/diem-thuong', icon: IconCoins },
  { title: 'Yêu thích', description: 'Sản phẩm đã lưu', href: '/yeu-thich', icon: IconHeart },
  { title: 'Thông báo', description: 'Thu hoạch mới', href: '/thong-bao', icon: IconBell },
  { title: 'Trang trại', description: 'Nguồn cung theo dõi', href: '/theo-doi', icon: IconBuildingStore },
] as const;

export function TongQuanTaiKhoanContent() {
  const router = useRouter();
  const [hoSo, setHoSo] = useState<HoSoKhachHang | null>(null);
  const [donGanDay, setDonGanDay] = useState<DonHangGanDay[]>([]);
  const [tongDon, setTongDon] = useState<number | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/tai-khoan');
      return;
    }

    let huy = false;
    void (async () => {
      try {
        const [profile, orders] = await Promise.all([
          layHoSoKhachHangWeb(),
          layDanhSachDonHangKhach({ trang: 1, gioiHan: 3 }),
        ]);
        if (huy) return;
        setHoSo(profile);
        setDonGanDay(
          (orders.duLieu ?? []).map((item) => ({
            id: item.id,
            maDonHang: item.maDonHang,
            trangThai: item.trangThai,
            tongTien: item.tongTien,
            createdAt: item.createdAt,
          })),
        );
        setTongDon(typeof orders.tong === 'number' ? orders.tong : null);
      } catch {
        if (!huy) setLoi('Không tải được tổng quan tài khoản. Vui lòng thử lại.');
      } finally {
        if (!huy) setDangTai(false);
      }
    })();
    return () => {
      huy = true;
    };
  }, [router]);

  const taiLai = () => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/tai-khoan');
      return;
    }
    setDangTai(true);
    setLoi(null);
    void (async () => {
      try {
        const [profile, orders] = await Promise.all([
          layHoSoKhachHangWeb(),
          layDanhSachDonHangKhach({ trang: 1, gioiHan: 3 }),
        ]);
        setHoSo(profile);
        setDonGanDay(
          (orders.duLieu ?? []).map((item) => ({
            id: item.id,
            maDonHang: item.maDonHang,
            trangThai: item.trangThai,
            tongTien: item.tongTien,
            createdAt: item.createdAt,
          })),
        );
        setTongDon(typeof orders.tong === 'number' ? orders.tong : null);
      } catch {
        setLoi('Không tải được tổng quan tài khoản. Vui lòng thử lại.');
      } finally {
        setDangTai(false);
      }
    })();
  };

  if (dangTai) {
    return (
      <Stack gap="md">
        <Skeleton height={22} width="42%" />
        <AgriSkeleton soLuong={3} />
      </Stack>
    );
  }

  if (loi && !hoSo && donGanDay.length === 0) {
    return <ErrorState tieuDe="Không tải được tổng quan" moTa={loi} onThuLai={taiLai} />;
  }

  const tenHienThi = hoSo?.hoTen?.trim() || 'bạn';

  return (
    <Stack gap="lg">
      {loi ? (
        <Alert color="orange" title="Tải một phần thất bại">
          {loi}
        </Alert>
      ) : null}

      {/* A. Greeting */}
      <Paper withBorder p="lg" radius="lg" className="agri-surface">
        <Group justify="space-between" align="center" gap="md" wrap="wrap">
          <Stack gap={2}>
            <Text fw={900} fz={{ base: 20, md: 24 }}>
              Xin chào, {tenHienThi}
            </Text>
            <Text size="sm" c="dimmed">
              {tongDon !== null && tongDon > 0
                ? `Bạn có ${tongDon.toLocaleString('vi-VN')} đơn hàng. Theo dõi trạng thái mới nhất bên dưới.`
                : 'Theo dõi đơn hàng mới nhất và quản lý thông tin tài khoản tại đây.'}
            </Text>
          </Stack>
          <Button component={Link} href="/don-hang" variant="light" color="agrimarket" rightSection={<IconArrowRight size={16} />}>
            Xem tất cả đơn hàng
          </Button>
        </Group>
      </Paper>

      {/* B. My Orders quick status: real backend enums only, no fake counts */}
      <Stack gap="sm">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Text fw={850} fz="lg">
            Đơn hàng của tôi
          </Text>
          <Button component={Link} href="/don-hang" variant="subtle" size="xs" color="agrimarket" rightSection={<IconChevronRight size={14} />}>
            Tất cả{tongDon !== null ? ` (${tongDon.toLocaleString('vi-VN')})` : ''}
          </Button>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {TRANG_THAI_NHANH.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.enum}
                component={Link}
                href="/don-hang"
                withBorder
                padding="md"
                radius="lg"
                className="agri-surface"
                style={{ textDecoration: 'none' }}
                aria-label={`Xem đơn ${nhanTrangThaiDonHang(item.enum)}`}
              >
                <Stack gap="xs" align="flex-start">
                  <ThemeIcon size={36} radius="lg" variant="light" color="agrimarket">
                    <Icon size={18} />
                  </ThemeIcon>
                  <Text size="sm" fw={800} lh={1.3}>
                    {nhanTrangThaiDonHang(item.enum)}
                  </Text>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>

      {/* C. Recent orders: real API snapshot only */}
      <Stack gap="sm">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Text fw={850} fz="lg">
            Đơn gần đây
          </Text>
          <Button component={Link} href="/don-hang" variant="subtle" size="xs" color="agrimarket" rightSection={<IconChevronRight size={14} />}>
            Xem chi tiết
          </Button>
        </Group>

        {donGanDay.length === 0 ? (
          <EmptyState
            tieuDe="Bạn chưa có đơn hàng nào"
            moTa="Khám phá nông sản sạch và đặt đơn đầu tiên của bạn."
            hanhDong={
              <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                Khám phá sản phẩm
              </Button>
            }
          />
        ) : (
          <Stack gap="sm">
            {donGanDay.map((order) => (
              <Paper key={order.id} withBorder p="md" radius="lg" className="agri-surface">
                <Group justify="space-between" align="center" gap="md" wrap="wrap">
                  <Stack gap={3} style={{ minWidth: 0 }}>
                    <Text fw={850} lineClamp={1}>
                      {order.maDonHang}
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      <Text size="xs" c="dimmed">
                        {dinhDangNgay(order.createdAt)}
                      </Text>
                      <Divider orientation="vertical" />
                      <Text size="xs" fw={800}>
                        {dinhDangGia(order.tongTien)} ₫
                      </Text>
                    </Group>
                  </Stack>
                  <Group gap="sm" wrap="nowrap">
                    <Badge color={mauTrangThai(order.trangThai)} variant="light">
                      {nhanTrangThaiDonHang(order.trangThai)}
                    </Badge>
                    <Button component={Link} href={`/don-hang/${order.id}`} size="xs" variant="light" color="agrimarket">
                      Xem chi tiết
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {/* D. Useful shortcuts: max 4 compact cards */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {LOI_TAT_NHANH.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.href}
              component={Link}
              href={item.href}
              withBorder
              padding="md"
              radius="lg"
              className="agri-surface"
              style={{ textDecoration: 'none' }}
            >
              <Stack gap="xs">
                <ThemeIcon size={34} radius="lg" variant="light" color="agrimarket">
                  <Icon size={17} />
                </ThemeIcon>
                <Stack gap={1}>
                  <Text size="sm" fw={850}>
                    {item.title}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {item.description}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
