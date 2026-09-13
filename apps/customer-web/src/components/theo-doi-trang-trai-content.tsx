'use client';

import {
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Group,
  Image,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBell,
  IconDots,
  IconLeaf,
  IconMapPin,
  IconPlant2,
  IconSearch,
  IconShoppingBag,
  IconStarFilled,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  boTheoDoiTrangTraiWeb,
  layThongBaoThuHoachWeb,
  layTrangTraiTheoDoiWeb,
  type ThongBaoThuHoachWeb,
  type TrangTraiTheoDoiWeb,
} from '@/lib/api-theo-doi-trang-trai';
import { laLoiPhienHetHan, layPhienKhachHang, xoaPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { SectionHeading } from './web-page';

type SapXepTheoDoi = 'moi-nhat' | 'ten-az' | 'danh-gia' | 'nhieu-san-pham';

const LUA_CHON_SAP_XEP: Array<{ value: SapXepTheoDoi; label: string }> = [
  { value: 'moi-nhat', label: 'Mới nhất' },
  { value: 'ten-az', label: 'Tên A – Z' },
  { value: 'danh-gia', label: 'Đánh giá cao' },
  { value: 'nhieu-san-pham', label: 'Nhiều sản phẩm' },
];

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

function dinhDangGon(value: number): string {
  if (value >= 1000) {
    const gon = value / 1000;
    const lamTron = gon >= 100 ? Math.round(gon).toString() : gon.toFixed(1).replace(/\.0$/, '');
    return `${lamTron.replace('.', '.')}K`;
  }
  return value.toLocaleString('vi-VN');
}

function layTinhThanh(diaChi: string): string {
  const parts = diaChi
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return diaChi;
  return parts[parts.length - 1] ?? diaChi;
}

function layMoTaTrangTrai(item: TrangTraiTheoDoiWeb): string {
  const tinh = layTinhThanh(item.diaChi);
  const chungNhan = item.chungNhan?.[0]?.loai?.trim();
  if (chungNhan) {
    return `${tinh} · ${chungNhan} · ${item.soSanPham} sản phẩm.`;
  }
  return `${tinh} · ${item.soSanPham} sản phẩm.`;
}

function layIconTrangTrai() {
  return IconLeaf;
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export function TheoDoiTrangTraiContent() {
  const router = useRouter();
  const [farms, setFarms] = useState<TrangTraiTheoDoiWeb[]>([]);
  const [notifications, setNotifications] = useState<ThongBaoThuHoachWeb[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXoaId, setDangXoaId] = useState<string | null>(null);
  const [loiTai, setLoiTai] = useState<string | null>(null);
  const [loiThaoTac, setLoiThaoTac] = useState<string | null>(null);
  const [tuKhoa, setTuKhoa] = useState('');
  const [sapXep, setSapXep] = useState<SapXepTheoDoi>('moi-nhat');

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiTai(null);

    try {
      const [farmData, notificationData] = await Promise.all([
        layTrangTraiTheoDoiWeb(),
        layThongBaoThuHoachWeb(),
      ]);
      setFarms(farmData.duLieu);
      setNotifications(notificationData.duLieu);
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xoaPhienKhachHang();
        router.replace('/dang-nhap?next=/theo-doi');
        return;
      }
      setLoiTai('Không tải được trang trại theo dõi hoặc thông báo thu hoạch.');
    } finally {
      setDangTai(false);
    }
  }, [router]);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/theo-doi');
      return;
    }

    void taiDuLieu();
  }, [router, taiDuLieu]);

  const boTheoDoi = async (trangTraiId: string) => {
    setDangXoaId(trangTraiId);
    setLoiThaoTac(null);
    try {
      await boTheoDoiTrangTraiWeb(trangTraiId);
      setFarms((current) => current.filter((item) => item.trangTraiId !== trangTraiId));
      setNotifications((current) => current.filter((item) => item.trangTraiId !== trangTraiId));
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        xoaPhienKhachHang();
        router.replace('/dang-nhap?next=/theo-doi');
        return;
      }
      setLoiThaoTac('Không bỏ theo dõi được trang trại.');
    } finally {
      setDangXoaId(null);
    }
  };

  // Lọc + sắp xếp trên dữ liệu thật vừa tải về (không mock).
  const danhSachHienThi = useMemo(() => {
    const keyword = tuKhoa.trim().toLowerCase();
    const loc =
      keyword.length === 0
        ? farms
        : farms.filter(
            (item) =>
              item.ten.toLowerCase().includes(keyword) ||
              item.diaChi.toLowerCase().includes(keyword) ||
              item.ma.toLowerCase().includes(keyword),
          );
    const sapXepSao = [...loc];
    switch (sapXep) {
      case 'ten-az':
        sapXepSao.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
        break;
      case 'danh-gia':
        sapXepSao.sort((a, b) => (b.diemTrungBinh ?? -1) - (a.diemTrungBinh ?? -1));
        break;
      case 'nhieu-san-pham':
        sapXepSao.sort((a, b) => b.soSanPham - a.soSanPham);
        break;
      case 'moi-nhat':
      default:
        sapXepSao.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }
    return sapXepSao;
  }, [farms, tuKhoa, sapXep]);

  return (
    <Stack gap="lg">
      {/* Header: giữ nhẹ, tránh đậm đen kiểu AI */}
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Stack gap={4} style={{ minWidth: 0 }}>
          <Title order={2} fz={{ base: 20, md: 23 }} fw={700} lh={1.3} lts="-0.008em">
            Trang trại theo dõi
          </Title>
          <Text size="sm" c="dimmed" fw={400} lh={1.6}>
            Danh sách các trang trại bạn đang theo dõi. Tổng cộng {farms.length} trang trại.
          </Text>
        </Stack>
        <Group gap="sm" align="center" wrap="wrap">
          <TextInput
            placeholder="Tìm kiếm trang trại theo tên, địa điểm..."
            leftSection={<IconSearch size={16} />}
            value={tuKhoa}
            onChange={(event) => setTuKhoa(event.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
            aria-label="Tìm kiếm trang trại đang theo dõi"
          />
          <Group gap={8} align="center" wrap="nowrap">
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              Sắp xếp:
            </Text>
            <Select
              data={LUA_CHON_SAP_XEP}
              value={sapXep}
              onChange={(value) => setSapXep((value as SapXepTheoDoi | null) ?? 'moi-nhat')}
              w={150}
              aria-label="Sắp xếp trang trại đang theo dõi"
            />
          </Group>
        </Group>
      </Group>

      {dangTai ? (
        <AgriSkeleton soLuong={6} />
      ) : loiTai ? (
        <ErrorState
          tieuDe="Không tải được danh sách theo dõi"
          moTa="AgriMarket chưa thể đồng bộ các trang trại và cập nhật thu hoạch của tài khoản này."
          onThuLai={() => void taiDuLieu()}
        />
      ) : (
        <>
          {loiThaoTac ? (
            <Alert color="red" title="Không thể cập nhật danh sách theo dõi">
              {loiThaoTac}
            </Alert>
          ) : null}

          {farms.length === 0 ? (
            <EmptyState
              tieuDe="Chưa theo dõi trang trại nào"
              moTa="Mở chi tiết trang trại và chọn theo dõi để nhận cập nhật thu hoạch."
              hanhDong={
                <Button component={Link} href="/trang-trai" color="agrimarket" variant="light">
                  Khám phá trang trại
                </Button>
              }
            />
          ) : danhSachHienThi.length === 0 ? (
            <EmptyState
              tieuDe="Không tìm thấy trang trại phù hợp"
              moTa="Thử đổi từ khóa tìm kiếm khác."
              hanhDong={
                <Button variant="default" onClick={() => setTuKhoa('')}>
                  Xóa tìm kiếm
                </Button>
              }
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {danhSachHienThi.map((item) => {
                const chungNhanDau = item.chungNhan?.[0]?.loai?.trim() ?? null;
                const coDanhGia = item.diemTrungBinh !== null && item.soLuotDanhGia > 0;
                const IconAvatar = layIconTrangTrai();
                const anhBia = item.anhBiaUrl ?? null;
                return (
                  <Card
                    key={item.trangTraiId}
                    withBorder
                    className="agri-surface"
                    padding={0}
                    radius="md"
                    style={{ overflow: 'hidden' }}
                  >
                    <Box pos="relative">
                      {anhBia ? (
                        <Image src={anhBia} alt={item.ten} h={165} fit="cover" />
                      ) : (
                        <Box
                          h={165}
                          bg="gray.1"
                          style={{ display: 'grid', placeItems: 'center' }}
                          aria-label="Trang trại chưa có ảnh công khai"
                        >
                          <ThemeIcon size={48} radius="xl" variant="light" color="agrimarket">
                            <IconLeaf size={24} />
                          </ThemeIcon>
                        </Box>
                      )}
                      {chungNhanDau ? (
                        <Box
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            background: '#0E7A4D',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 6,
                          }}
                        >
                          {chungNhanDau}
                        </Box>
                      ) : null}
                      <ActionIcon
                        variant="filled"
                        color="white"
                        radius="xl"
                        size="sm"
                        aria-label="Tùy chọn trang trại"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
                        }}
                      >
                        <IconDots size={16} color="#333" />
                      </ActionIcon>
                    </Box>

                    <Stack gap="sm" p="md">
                      <Group gap="sm" wrap="nowrap" align="flex-start">
                        <Avatar
                          size={56}
                          radius="50%"
                          style={{
                            flex: '0 0 auto',
                            marginTop: -32,
                            background: '#E6F4EA',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          }}
                        >
                          <IconAvatar size={28} color="#0E7A4D" stroke={1.7} />
                        </Avatar>
                        <Stack gap={2} style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                          <Text fw={600} fz="15px" lineClamp={1} lh={1.4}>
                            {item.ten}
                          </Text>
                          <Group gap={4} wrap="nowrap" align="center">
                            <IconMapPin
                              size={14}
                              color="#6d7972"
                              style={{ flex: '0 0 auto' }}
                            />
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {layTinhThanh(item.diaChi)}
                            </Text>
                          </Group>
                        </Stack>
                      </Group>

                      <Text size="sm" c="dimmed" fw={400} lineClamp={2} lh={1.6} mih={44}>
                        {layMoTaTrangTrai(item)}
                      </Text>

                      <Group gap="md" wrap="wrap">
                        <Group gap={5} wrap="nowrap" align="center">
                          <IconShoppingBag size={14} color="#6d7972" />
                          <Text size="xs" c="dimmed" fw={600}>
                            {item.soSanPham} sản phẩm
                          </Text>
                        </Group>
                        <Group gap={4} wrap="nowrap" align="center">
                          <IconStarFilled size={14} color="#f59e0b" />
                          <Text size="xs" c="dimmed" fw={600}>
                            {coDanhGia
                              ? `${item.diemTrungBinh?.toFixed(1)} (${item.soLuotDanhGia})`
                              : 'Chưa có đánh giá'}
                          </Text>
                        </Group>
                        <Group gap={5} wrap="nowrap" align="center">
                          <IconUsers size={14} color="#6d7972" />
                          <Text size="xs" c="dimmed" fw={600}>
                            {dinhDangGon(item.soLuotTheoDoi)} theo dõi
                          </Text>
                        </Group>
                      </Group>

                      <Group gap="xs" grow>
                        <Button
                          component={Link}
                          href={`/trang-trai/${item.trangTraiId}`}
                          variant="outline"
                          color="agrimarket"
                          size="sm"
                          fw={600}
                        >
                          Xem trang trại
                        </Button>
                        <Button
                          aria-label={`Bỏ theo dõi ${item.ten}`}
                          title={`Bỏ theo dõi ${item.ten}`}
                          color="agrimarket"
                          variant="light"
                          size="sm"
                          fw={600}
                          leftSection={<IconBell size={16} />}
                          loading={dangXoaId === item.trangTraiId}
                          onClick={() => void boTheoDoi(item.trangTraiId)}
                        >
                          Đang theo dõi
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}

          <Stack gap="md" mt="md">
            <SectionHeading
              eyebrow="Thu hoạch mới"
              title="Cập nhật từ trang trại"
              description="Những đợt thu hoạch mới nhất từ các nguồn cung bạn đang theo dõi."
            />

            {notifications.length === 0 ? (
              <Card withBorder className="agri-surface" padding="lg">
                <Group gap="sm">
                  <ThemeIcon radius="xl" color="agrimarket" variant="light">
                    <IconLeaf size={18} />
                  </ThemeIcon>
                  <Text c="dimmed" size="sm">
                    Chưa có thông báo thu hoạch mới từ các trang trại đã theo dõi.
                  </Text>
                </Group>
              </Card>
            ) : (
              <Stack gap="sm">
                {notifications.map((item) => (
                  <Card key={item.id} withBorder className="agri-surface" padding="lg">
                    <Group justify="space-between" align="center" wrap="wrap" gap="md">
                      <Group gap="md" align="flex-start" wrap="nowrap">
                        <ThemeIcon size={44} radius="xl" color="agrimarket" variant="light">
                          <IconPlant2 size={22} />
                        </ThemeIcon>
                        <Stack gap={3}>
                          <Text fw={600} lh={1.5}>{item.tenTrangTrai} vừa có thu hoạch mới</Text>
                          <Text size="sm">
                            {item.cayTrong} · giống {item.giong} · {item.phanLoai}
                          </Text>
                          <Text size="sm" c="dimmed">
                            Ngày {dinhDangNgay(item.ngayThuHoach)} · {dinhDangSo(item.soLuong)}{' '}
                            {item.donVi}
                          </Text>
                        </Stack>
                      </Group>
                      <Button
                        component={Link}
                        href={`/trang-trai/${item.trangTraiId}`}
                        variant="subtle"
                        color="agrimarket"
                      >
                        Xem trang trại
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}
