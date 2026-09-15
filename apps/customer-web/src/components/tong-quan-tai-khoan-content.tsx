'use client';

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  CopyButton,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingStore,
  IconCheck,
  IconChevronRight,
  IconCircleCheck,
  IconCoins,
  IconCopy,
  IconHeart,
  IconPackage,
  IconShoppingBag,
  IconShoppingCart,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  layChiTietDonHangKhach,
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

type SanPhamDaiDien = {
  tenSanPham: string;
  tenTrangTrai: string;
  soLuong: number;
  donGia: number;
  donVi: string;
};

type DonHangGanDay = {
  id: string;
  maDonHang: string;
  trangThai: string;
  tongTien: number;
  soMuc: number;
  createdAt: string;
  sanPhamDaiDien: SanPhamDaiDien | null;
};

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangSoLuong(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(value);
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function maDonHangHienThi(value: string): string {
  const ma = value.trim().toUpperCase();

  // Chỉ rút gọn phần nhìn thấy trên card. Mã thật vẫn được giữ nguyên,
  // vẫn dùng cho API/DB và nút copy bên cạnh.
  if (ma.length <= 24) return ma;

  const viTriGach = ma.indexOf('-');
  const tienTo = viTriGach >= 0 ? ma.slice(0, viTriGach + 1) : '';
  const thanMa = viTriGach >= 0 ? ma.slice(viTriGach + 1) : ma;

  if (thanMa.length <= 18) return ma;
  return `${tienTo}${thanMa.slice(0, 8)}…${thanMa.slice(-6)}`;
}

function mauTrangThai(trangThai: string): string {
  if (trangThai === 'DA_HUY') return 'red';
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'green';
  if (trangThai === 'DANG_GIAO') return 'blue';
  if (trangThai === 'CHO_THANH_TOAN') return 'orange';
  return 'teal';
}

const TRANG_THAI_NHANH: Array<{
  enum: TrangThaiDonHangLoc;
  icon: typeof IconPackage;
  mau: string;
}> = [
  { enum: 'CHO_THANH_TOAN', icon: IconPackage, mau: 'orange' },
  { enum: 'DA_XAC_NHAN', icon: IconCircleCheck, mau: 'blue' },
  { enum: 'DANG_GIAO', icon: IconTruckDelivery, mau: 'teal' },
  { enum: 'DA_GIAO', icon: IconShoppingBag, mau: 'green' },
];

const LOI_TAT_NHANH = [
  {
    title: 'Điểm thưởng',
    description: 'Xem số dư và lịch sử tích điểm',
    href: '/diem-thuong',
    icon: IconCoins,
    mau: 'grape',
  },
  {
    title: 'Sản phẩm yêu thích',
    description: 'Quay lại những sản phẩm đã lưu',
    href: '/yeu-thich',
    icon: IconHeart,
    mau: 'red',
  },
  {
    title: 'Trang trại theo dõi',
    description: 'Theo dõi nguồn cung bạn quan tâm',
    href: '/theo-doi',
    icon: IconBuildingStore,
    mau: 'agrimarket',
  },
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

  // Overview chỉ lấy tối đa 3 đơn gần nhất nên việc lấy thêm chi tiết ở đây
  // có giới hạn rõ ràng: tối đa 3 request, không phải N request không kiểm soát.
  const [demKetQua, chiTietKetQua] = await Promise.all([
    Promise.allSettled(
      TRANG_THAI_NHANH.map((item) =>
        layDanhSachDonHangKhach({
          trang: 1,
          gioiHan: 1,
          trangThai: item.enum,
        }),
      ),
    ),
    Promise.allSettled(
      (orders.duLieu ?? []).map((item) => layChiTietDonHangKhach(item.id)),
    ),
  ]);

  const dem: Record<string, number | null> = {};
  let loiDem = false;

  demKetQua.forEach((ketQua, index) => {
    const key = TRANG_THAI_NHANH[index]?.enum ?? String(index);

    if (ketQua.status === 'fulfilled') {
      const tong = ketQua.value.tong;
      dem[key] = typeof tong === 'number' ? tong : null;
      if (dem[key] === null) loiDem = true;
      return;
    }

    if (laLoiPhienHetHan(ketQua.reason)) throw ketQua.reason;
    dem[key] = null;
    loiDem = true;
  });

  chiTietKetQua.forEach((ketQua) => {
    if (ketQua.status === 'rejected' && laLoiPhienHetHan(ketQua.reason)) {
      throw ketQua.reason;
    }
  });

  const donGanDay: DonHangGanDay[] = (orders.duLieu ?? []).map((item, index) => {
    const ketQuaChiTiet = chiTietKetQua[index];
    let sanPhamDaiDien: SanPhamDaiDien | null = null;

    if (ketQuaChiTiet?.status === 'fulfilled') {
      const danhSachMuc = ketQuaChiTiet.value.donNhaCungCap.flatMap(
        (donNhaCungCap) => donNhaCungCap.muc,
      );
      const mucDau = danhSachMuc[0];

      if (mucDau) {
        sanPhamDaiDien = {
          tenSanPham: mucDau.tenSanPham,
          tenTrangTrai: mucDau.tenTrangTrai,
          soLuong: mucDau.soLuong,
          donGia: mucDau.donGia,
          donVi: mucDau.donVi,
        };
      }
    }

    return {
      id: item.id,
      maDonHang: item.maDonHang,
      trangThai: item.trangThai,
      tongTien: item.tongTien,
      soMuc: item.soMuc,
      createdAt: item.createdAt,
      sanPhamDaiDien,
    };
  });

  return {
    profile,
    orders,
    donGanDay,
    dem,
    loiDem,
  };
}

export function TongQuanTaiKhoanContent() {
  const router = useRouter();
  const [hoSo, setHoSo] = useState<HoSoKhachHang | null>(null);
  const [donGanDay, setDonGanDay] = useState<DonHangGanDay[]>([]);
  const [tongDon, setTongDon] = useState<number | null>(null);
  const [demTheoTrangThai, setDemTheoTrangThai] = useState<
    Record<string, number | null>
  >({});
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const apDung = (duLieu: Awaited<ReturnType<typeof taiDuLieuTongQuan>>) => {
    setHoSo(duLieu.profile);
    setDonGanDay(duLieu.donGanDay);
    setTongDon(
      typeof duLieu.orders.tong === 'number' ? duLieu.orders.tong : null,
    );
    setDemTheoTrangThai(duLieu.dem);

    if (duLieu.loiDem) {
      setLoi(
        'Không tải được đầy đủ số lượng đơn theo trạng thái. Danh sách đơn gần đây vẫn sử dụng dữ liệu thật.',
      );
    }
  };

  useEffect(() => {
    let huy = false;
    let hetHan = false;

    void (async () => {
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
      <Stack gap="lg">
        <Stack gap={6}>
          <Skeleton height={28} width="34%" />
          <Skeleton height={16} width="58%" />
        </Stack>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={92} radius="md" />
          ))}
        </SimpleGrid>

        <AgriSkeleton soLuong={3} />
      </Stack>
    );
  }

  if (loi && !hoSo && donGanDay.length === 0) {
    return (
      <ErrorState
        tieuDe="Không tải được tổng quan"
        moTa={loi}
        onThuLai={taiLai}
      />
    );
  }

  const tenHienThi = hoSo?.hoTen?.trim() || 'bạn';

  return (
    <Stack gap="lg">
      {loi ? (
        <Alert color="orange" title="Một phần dữ liệu chưa tải được">
          {loi}
        </Alert>
      ) : null}

      {/* Header phẳng kiểu ecommerce, không dùng banner gradient/quote. */}
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} fz={{ base: 24, md: 30 }} fw={850}>
            Tổng quan tài khoản
          </Title>
          <Text c="dimmed" size="sm">
            Xin chào{' '}
            <Text span fw={750} c="dark">
              {tenHienThi}
            </Text>
            , quản lý đơn hàng và các tiện ích của bạn tại đây.
          </Text>
        </Stack>

        <Button
          component={Link}
          href="/san-pham"
          variant="light"
          color="agrimarket"
          rightSection={<IconArrowRight size={16} />}
        >
          Tiếp tục mua sắm
        </Button>
      </Group>

      {/* Một khối trạng thái thống nhất, giống trung tâm đơn hàng của sàn TMĐT. */}
      <Paper withBorder radius="lg" className="agri-surface" style={{ overflow: 'hidden' }}>
        <Box p={{ base: 'md', md: 'lg' }}>
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Stack gap={1}>
              <Text fw={850} fz="lg">
                Đơn hàng của tôi
              </Text>
              <Text size="xs" c="dimmed">
                Theo dõi nhanh trạng thái các đơn đã đặt
              </Text>
            </Stack>

            <Button
              component={Link}
              href="/don-hang"
              variant="subtle"
              size="xs"
              color="agrimarket"
              rightSection={<IconChevronRight size={14} />}
            >
              Xem tất cả đơn hàng
              {tongDon !== null ? ` (${tongDon.toLocaleString('vi-VN')})` : ''}
            </Button>
          </Group>
        </Box>

        <Divider />

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={0}>
          {TRANG_THAI_NHANH.map((item, index) => {
            const Icon = item.icon;

            return (
              <UnstyledButton
                key={item.enum}
                component={Link}
                href="/don-hang"
                p={{ base: 'md', md: 'lg' }}
                aria-label={`Xem đơn ${nhanTrangThaiDonHang(item.enum)}`}
                style={{
                  textDecoration: 'none',
                  borderRight:
                    index < TRANG_THAI_NHANH.length - 1
                      ? '1px solid var(--mantine-color-gray-2)'
                      : undefined,
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon
                    size={42}
                    radius="xl"
                    variant="light"
                    color={item.mau}
                    style={{ flex: '0 0 auto' }}
                  >
                    <Icon size={21} />
                  </ThemeIcon>

                  <Stack gap={1} style={{ minWidth: 0 }}>
                    <Text fw={900} fz={22} lh={1.1}>
                      {hienThiDem(demTheoTrangThai[item.enum])}
                    </Text>
                    <Text size="xs" fw={700} lineClamp={1}>
                      {nhanTrangThaiDonHang(item.enum)}
                    </Text>
                  </Stack>
                </Group>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Paper>

      {/* Đơn gần đây hiển thị nội dung mua gì, từ trang trại nào, bao nhiêu tiền. */}
      <Stack gap="sm">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Stack gap={1}>
            <Text fw={850} fz="lg">
              Đơn gần đây
            </Text>
            <Text size="xs" c="dimmed">
              Hiển thị tối đa 3 đơn mới nhất
            </Text>
          </Stack>

          <Button
            component={Link}
            href="/don-hang"
            variant="subtle"
            size="xs"
            color="agrimarket"
            rightSection={<IconChevronRight size={14} />}
          >
            Quản lý đơn hàng
          </Button>
        </Group>

        {donGanDay.length === 0 ? (
          <EmptyState
            tieuDe="Bạn chưa có đơn hàng nào"
            moTa="Khám phá nông sản sạch và đặt đơn đầu tiên của bạn."
            hanhDong={
              <Button
                component={Link}
                href="/san-pham"
                color="agrimarket"
                leftSection={<IconShoppingCart size={16} />}
              >
                Khám phá sản phẩm
              </Button>
            }
          />
        ) : (
          <Stack gap="sm">
            {donGanDay.map((order) => {
              const sanPham = order.sanPhamDaiDien;
              const soSanPhamConLai = Math.max(0, order.soMuc - 1);
              const choThanhToan = order.trangThai === 'CHO_THANH_TOAN';

              return (
                <Paper
                  key={order.id}
                  withBorder
                  p={{ base: 'md', md: 'lg' }}
                  radius="lg"
                  className="agri-surface"
                >
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                      <Stack gap={4} style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <Text
                            fw={850}
                            fz="sm"
                            title={order.maDonHang}
                            style={{
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            }}
                          >
                            {maDonHangHienThi(order.maDonHang)}
                          </Text>

                          <CopyButton value={order.maDonHang} timeout={1600}>
                            {({ copied, copy }) => (
                              <Tooltip
                                label={copied ? 'Đã sao chép mã đơn' : 'Sao chép mã đơn đầy đủ'}
                                withArrow
                              >
                                <ActionIcon
                                  variant="subtle"
                                  color={copied ? 'teal' : 'gray'}
                                  size="sm"
                                  onClick={copy}
                                  aria-label="Sao chép mã đơn hàng"
                                >
                                  {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>

                        <Text size="xs" c="dimmed">
                          Đặt lúc {dinhDangNgay(order.createdAt)}
                        </Text>
                      </Stack>

                      <Badge
                        color={mauTrangThai(order.trangThai)}
                        variant="light"
                        radius="sm"
                        size="sm"
                      >
                        {nhanTrangThaiDonHang(order.trangThai)}
                      </Badge>
                    </Group>

                    <Divider />

                    <Group align="center" gap="md" wrap="nowrap">
                      <ThemeIcon
                        size={58}
                        radius="md"
                        variant="light"
                        color="agrimarket"
                        style={{ flex: '0 0 auto' }}
                      >
                        <IconPackage size={28} />
                      </ThemeIcon>

                      <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                        <Text fw={800} lineClamp={1}>
                          {sanPham?.tenSanPham ??
                            `${order.soMuc.toLocaleString('vi-VN')} sản phẩm trong đơn`}
                        </Text>

                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {sanPham?.tenTrangTrai
                            ? `Trang trại: ${sanPham.tenTrangTrai}`
                            : 'Xem chi tiết để kiểm tra đầy đủ sản phẩm'}
                        </Text>

                        {sanPham ? (
                          <Text size="sm" c="dimmed">
                            {dinhDangSoLuong(sanPham.soLuong)} {sanPham.donVi} ×{' '}
                            {dinhDangGia(sanPham.donGia)} ₫
                          </Text>
                        ) : null}
                      </Stack>

                      {soSanPhamConLai > 0 ? (
                        <Badge variant="outline" color="gray" radius="sm">
                          +{soSanPhamConLai} sản phẩm
                        </Badge>
                      ) : null}
                    </Group>

                    <Divider />

                    <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
                      <Stack gap={1}>
                        <Text size="xs" c="dimmed">
                          Tổng thanh toán
                        </Text>
                        <Text fw={900} fz={24} c="agrimarket.8">
                          {dinhDangGia(order.tongTien)} ₫
                        </Text>
                      </Stack>

                      <Group gap="sm">
                        {choThanhToan ? (
                          <Button
                            component={Link}
                            href={`/don-hang/${order.id}`}
                            color="agrimarket"
                            size="sm"
                          >
                            Thanh toán
                          </Button>
                        ) : null}

                        <Button
                          component={Link}
                          href={`/don-hang/${order.id}`}
                          variant={choThanhToan ? 'default' : 'light'}
                          color={choThanhToan ? undefined : 'agrimarket'}
                          size="sm"
                        >
                          Xem chi tiết
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Stack gap="sm">
        <Stack gap={1}>
          <Text fw={850} fz="lg">
            Tiện ích của bạn
          </Text>
          <Text size="xs" c="dimmed">
            Truy cập nhanh các mục thường dùng
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          {LOI_TAT_NHANH.map((item) => {
            const Icon = item.icon;

            return (
              <UnstyledButton
                key={item.href}
                component={Link}
                href={item.href}
                p="md"
                style={{
                  display: 'block',
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: 'var(--mantine-radius-md)',
                  textDecoration: 'none',
                  background: 'var(--mantine-color-body)',
                }}
              >
                <Group justify="space-between" gap="md" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ThemeIcon size={38} radius="xl" variant="light" color={item.mau}>
                      <Icon size={19} />
                    </ThemeIcon>

                    <Stack gap={1} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={800} lineClamp={1}>
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {item.description}
                      </Text>
                    </Stack>
                  </Group>

                  <IconChevronRight
                    size={16}
                    color="var(--mantine-color-gray-5)"
                    style={{ flex: '0 0 auto' }}
                  />
                </Group>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
