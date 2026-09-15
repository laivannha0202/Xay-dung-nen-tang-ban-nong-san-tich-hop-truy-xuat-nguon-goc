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
  Title,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconChevronRight,
  IconCircleCheck,
  IconCoins,
  IconHeart,
  IconLeaf,
  IconPackage,
  IconShoppingBag,
  IconShoppingCart,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  layDanhSachDonHangKhach,
  nhanTrangThaiDonHang,
  type TrangThaiDonHangLoc,
} from '@/lib/api-don-hang';
import { layHoSoKhachHangWeb, type HoSoKhachHang } from '@/lib/api-ho-so-khach-hang';
import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';
import { damBaoPhienKhachHang } from '@/lib/xac-thuc-khach-hang';

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

// Chỉ dùng enum backend thật. Mỗi thẻ đếm bằng một query nhẹ
// (gioiHan: 1) và lấy `tong` backend trả về — không hard-code số.
const TRANG_THAI_NHANH: Array<{ enum: TrangThaiDonHangLoc; icon: typeof IconPackage; mau: string }> = [
  { enum: 'CHO_THANH_TOAN', icon: IconPackage, mau: 'orange' },
  { enum: 'DA_XAC_NHAN', icon: IconCircleCheck, mau: 'blue' },
  { enum: 'DANG_GIAO', icon: IconTruckDelivery, mau: 'teal' },
  { enum: 'DA_GIAO', icon: IconShoppingBag, mau: 'agrimarket' },
];

const LOI_TAT_NHANH = [
  { title: 'Điểm thưởng', description: 'Số dư và lịch sử điểm', href: '/diem-thuong', icon: IconCoins, mau: 'grape' },
  { title: 'Yêu thích', description: 'Sản phẩm đã lưu', href: '/yeu-thich', icon: IconHeart, mau: 'red' },
  { title: 'Trang trại', description: 'Nguồn cung theo dõi', href: '/theo-doi', icon: IconBuildingStore, mau: 'agrimarket' },
] as const;

function hienThiDem(dem: number | null | undefined): string {
  if (typeof dem !== 'number' || Number.isNaN(dem)) return '–';
  return dem.toLocaleString('vi-VN');
}

async function taiDuLieuTongQuan() {
  const [profile, orders] = await Promise.all([
    layHoSoKhachHangWeb(),
    layDanhSachDonHangKhach({ trang: 1, gioiHan: 3 }),
  ]);

  const demKetQua = await Promise.allSettled(
    TRANG_THAI_NHANH.map((item) =>
      layDanhSachDonHangKhach({ trang: 1, gioiHan: 1, trangThai: item.enum }),
    ),
  );

  const dem: Record<string, number | null> = {};
  let loiDem = false;
  demKetQua.forEach((ketQua, index) => {
    const key = TRANG_THAI_NHANH[index]?.enum ?? String(index);
    if (ketQua.status === 'fulfilled') {
      const tong = ketQua.value.tong;
      dem[key] = typeof tong === 'number' ? tong : null;
      if (dem[key] === null) loiDem = true;
    } else {
      if (laLoiPhienHetHan(ketQua.reason)) throw ketQua.reason;
      dem[key] = null;
      loiDem = true;
    }
  });

  return { profile, orders, dem, loiDem };
}

export function TongQuanTaiKhoanContent() {
  const router = useRouter();
  const [hoSo, setHoSo] = useState<HoSoKhachHang | null>(null);
  const [donGanDay, setDonGanDay] = useState<DonHangGanDay[]>([]);
  const [tongDon, setTongDon] = useState<number | null>(null);
  const [demTheoTrangThai, setDemTheoTrangThai] = useState<Record<string, number | null>>({});
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const apDung = (duLieu: Awaited<ReturnType<typeof taiDuLieuTongQuan>>) => {
    setHoSo(duLieu.profile);
    setDonGanDay(
      (duLieu.orders.duLieu ?? []).map((item) => ({
        id: item.id,
        maDonHang: item.maDonHang,
        trangThai: item.trangThai,
        tongTien: item.tongTien,
        createdAt: item.createdAt,
      })),
    );
    setTongDon(typeof duLieu.orders.tong === 'number' ? duLieu.orders.tong : null);
    setDemTheoTrangThai(duLieu.dem);
    if (duLieu.loiDem) {
      setLoi('Không tải được số lượng đơn theo trạng thái. Danh sách đơn gần đây vẫn hiển thị bên dưới.');
    }
  };

  useEffect(() => {
    let huy = false;
    let hetHan = false;
    void (async () => {
      // Restore im lặng khi tab mới/F5; API tự refresh + retry nên 401 ở
      // đây nghĩa là phiên đã bị xóa tập trung, chỉ cần redirect.
      const phien = await damBaoPhienKhachHang().catch(() => null);
      if (huy) return;
      if (!phien) {
        router.replace('/dang-nhap?next=/tai-khoan');
        return;
      }
      try {
        const duLieu = await taiDuLieuTongQuan();
        if (huy) return;
        apDung(duLieu);
      } catch (error) {
        if (huy) return;
        if (laLoiPhienHetHan(error)) {
          hetHan = true;
          router.replace('/dang-nhap?next=/tai-khoan');
          return;
        }
        setLoi('Không tải được tổng quan tài khoản. Vui lòng thử lại.');
      } finally {
        if (!huy && !hetHan) setDangTai(false);
      }
    })();
    return () => {
      huy = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const taiLai = () => {
    setDangTai(true);
    setLoi(null);
    void (async () => {
      const phien = await damBaoPhienKhachHang().catch(() => null);
      if (!phien) {
        router.replace('/dang-nhap?next=/tai-khoan');
        return;
      }
      try {
        apDung(await taiDuLieuTongQuan());
      } catch (error) {
        if (laLoiPhienHetHan(error)) {
          router.replace('/dang-nhap?next=/tai-khoan');
          return;
        }
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

      {/* Banner chào: phẳng, không khung */}
      <Paper
        radius="md"
        p={{ base: 'lg', md: 'xl' }}
        className="agri-surface"
        style={{
          background: 'linear-gradient(115deg, #EDF6F0 0%, #F8FCF9 55%, #E7F3EB 100%)',
          overflow: 'hidden',
        }}
      >
        <Group justify="space-between" align="center" gap="xl" wrap="nowrap">
          <Stack gap={4} style={{ minWidth: 0 }}>
            <Text size="xs" fw={850} c="agrimarket.8" style={{ letterSpacing: '0.08em' }}>
              XIN CHÀO,
            </Text>
            <Title order={2} fz={{ base: 26, md: 32 }} fw={900} lineClamp={1}>
              {tenHienThi}!
            </Title>
          </Stack>
          <Stack gap={6} align="flex-end" maw={280} visibleFrom="sm" style={{ flex: '0 0 auto' }}>
            <ThemeIcon size={44} radius="xl" variant="light" color="agrimarket" aria-hidden>
              <IconLeaf size={24} />
            </ThemeIcon>
            <Text size="sm" fw={650} fs="italic" c="agrimarket.8" ta="right" lh={1.5}>
              “Nông sản sạch cho cuộc sống xanh hơn mỗi ngày”
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Đơn hàng của tôi: số đếm thật theo từng trạng thái backend */}
      <Stack gap="sm">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Text fw={850} fz="lg">
            Đơn hàng của tôi
          </Text>
          <Button component={Link} href="/don-hang" variant="subtle" size="xs" color="agrimarket" rightSection={<IconChevronRight size={14} />}>
            Xem tất cả đơn hàng{tongDon !== null ? ` (${tongDon.toLocaleString('vi-VN')})` : ''}
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
                radius="md"
                className="agri-surface"
                style={{ textDecoration: 'none' }}
                aria-label={`Xem đơn ${nhanTrangThaiDonHang(item.enum)}`}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size={40} radius="xl" variant="light" color={item.mau}>
                      <Icon size={20} />
                    </ThemeIcon>
                    <Stack gap={1} style={{ minWidth: 0 }}>
                      <Text fw={900} fz={22} lh={1.1}>
                        {hienThiDem(demTheoTrangThai[item.enum])}
                      </Text>
                      <Text size="xs" fw={700} lh={1.35}>
                        {nhanTrangThaiDonHang(item.enum)}
                      </Text>
                    </Stack>
                  </Group>
                  <IconChevronRight size={16} color="#98A6A0" style={{ flex: '0 0 auto', marginTop: 4 }} />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>

      {/* Đơn gần đây: snapshot thật từ API */}
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
              <Button component={Link} href="/san-pham" color="agrimarket" leftSection={<IconShoppingCart size={16} />}>
                Khám phá sản phẩm
              </Button>
            }
          />
        ) : (
          <Stack gap="sm">
            {donGanDay.map((order) => (
              <Paper key={order.id} withBorder p="md" radius="md" className="agri-surface">
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

      {/* Tính năng nhanh: tối đa 4 thẻ gọn */}
      <Stack gap="sm">
        <Text fw={850} fz="lg">
          Tính năng nhanh
        </Text>
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
                radius="md"
                className="agri-surface"
                style={{ textDecoration: 'none' }}
              >
                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size={38} radius="xl" variant="light" color={item.mau}>
                      <Icon size={19} />
                    </ThemeIcon>
                    <Stack gap={1} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={850} lineClamp={1}>
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {item.description}
                      </Text>
                    </Stack>
                  </Group>
                  <IconChevronRight size={16} color="#98A6A0" style={{ flex: '0 0 auto' }} />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
