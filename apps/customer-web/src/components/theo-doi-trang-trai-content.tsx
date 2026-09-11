'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Image,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBellRinging,
  IconBuilding,
  IconLeaf,
  IconMapPin,
  IconPlant2,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  boTheoDoiTrangTraiWeb,
  layThongBaoThuHoachWeb,
  layTrangTraiTheoDoiWeb,
  type ThongBaoThuHoachWeb,
  type TrangTraiTheoDoiWeb,
} from '@/lib/api-theo-doi-trang-trai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

export function TheoDoiTrangTraiContent() {
  const router = useRouter();
  const [farms, setFarms] = useState<TrangTraiTheoDoiWeb[]>([]);
  const [notifications, setNotifications] = useState<ThongBaoThuHoachWeb[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXoaId, setDangXoaId] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/theo-doi');
      return;
    }

    void Promise.all([layTrangTraiTheoDoiWeb(), layThongBaoThuHoachWeb()])
      .then(([farmData, notificationData]) => {
        setFarms(farmData.duLieu);
        setNotifications(notificationData.duLieu);
      })
      .catch(() => setLoi('Không tải được trang trại theo dõi hoặc thông báo thu hoạch.'))
      .finally(() => setDangTai(false));
  }, [router]);

  const boTheoDoi = async (trangTraiId: string) => {
    setDangXoaId(trangTraiId);
    setLoi(null);
    try {
      await boTheoDoiTrangTraiWeb(trangTraiId);
      setFarms((current) => current.filter((item) => item.trangTraiId !== trangTraiId));
    } catch {
      setLoi('Không bỏ theo dõi được trang trại.');
    } finally {
      setDangXoaId(null);
    }
  };

  if (dangTai) {
    return (
      <Group justify="center" py={72}>
        <Loader color="agrimarket" />
      </Group>
    );
  }

  return (
    <Stack gap="xl">
      <Paper
        radius="xl"
        p={{ base: 'lg', md: 'xl' }}
        bg="agrimarket.0"
        style={{ border: '1px solid var(--mantine-color-agrimarket-1)' }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size={54} radius="xl" color="agrimarket" variant="light">
              <IconBuilding size={28} />
            </ThemeIcon>
            <Box>
              <Title order={2}>Trang trại bạn đang theo dõi</Title>
              <Text c="dimmed" mt={4}>
                Theo dõi nguồn cung yêu thích và nhận cập nhật thu hoạch mới từ hệ thống.
              </Text>
            </Box>
          </Group>
          <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
            Khám phá thêm
          </Button>
        </Group>
      </Paper>

      {loi ? (
        <Alert color="red" title="Không thể hoàn tất">
          {loi}
        </Alert>
      ) : null}

      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3}>Đang theo dõi</Title>
            <Text size="sm" c="dimmed" mt={3}>
              {farms.length} trang trại trong danh sách của bạn
            </Text>
          </Box>
        </Group>

        {farms.length === 0 ? (
          <Card withBorder radius="lg" padding="xl">
            <Stack align="center" ta="center" gap="sm" py="md">
              <ThemeIcon size={52} radius="xl" color="agrimarket" variant="light">
                <IconLeaf size={26} />
              </ThemeIcon>
              <Text fw={800} fz="lg">
                Chưa theo dõi trang trại nào
              </Text>
              <Text c="dimmed" maw={460}>
                Mở chi tiết trang trại từ sản phẩm và chọn theo dõi để nhận cập nhật thu hoạch.
              </Text>
              <Button component={Link} href="/san-pham" color="agrimarket" variant="light">
                Khám phá nông sản
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {farms.map((item) => (
              <Card key={item.trangTraiId} withBorder radius="lg" padding={0} style={{ overflow: 'hidden' }}>
                {item.anhBiaUrl ? (
                  <Image src={item.anhBiaUrl} alt={item.ten} h={180} fit="cover" />
                ) : (
                  <Box h={180} bg="agrimarket.0" style={{ display: 'grid', placeItems: 'center' }}>
                    <ThemeIcon size={58} radius="xl" color="agrimarket" variant="light">
                      <IconPlant2 size={30} />
                    </ThemeIcon>
                  </Box>
                )}

                <Stack gap="md" p="lg">
                  <Stack gap={5}>
                    <Title order={4} lineClamp={1}>
                      {item.ten}
                    </Title>
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <IconMapPin size={16} color="#6d7972" style={{ marginTop: 2, flex: '0 0 auto' }} />
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {item.diaChi}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Mã trang trại: {item.ma}
                    </Text>
                  </Stack>

                  <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Button
                      component={Link}
                      href={`/trang-trai/${item.trangTraiId}`}
                      variant="light"
                      color="agrimarket"
                      fullWidth
                    >
                      Xem trang trại
                    </Button>
                    <Button
                      aria-label={`Bỏ theo dõi ${item.ten}`}
                      color="red"
                      variant="light"
                      px="sm"
                      loading={dangXoaId === item.trangTraiId}
                      onClick={() => void boTheoDoi(item.trangTraiId)}
                    >
                      <IconX size={18} />
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon radius="xl" color="agrimarket" variant="light">
            <IconBellRinging size={19} />
          </ThemeIcon>
          <Box>
            <Title order={3}>Thu hoạch mới</Title>
            <Text size="sm" c="dimmed">
              Cập nhật từ các trang trại bạn đang theo dõi
            </Text>
          </Box>
        </Group>

        {notifications.length === 0 ? (
          <Card withBorder radius="lg" padding="lg">
            <Text c="dimmed">Chưa có thông báo thu hoạch mới từ các trang trại đã theo dõi.</Text>
          </Card>
        ) : (
          <Stack gap="sm">
            {notifications.map((item) => (
              <Card key={item.id} withBorder radius="lg" padding="lg">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                  <Group gap="md" align="flex-start" wrap="nowrap">
                    <ThemeIcon size={44} radius="xl" color="agrimarket" variant="light">
                      <IconPlant2 size={22} />
                    </ThemeIcon>
                    <Stack gap={3}>
                      <Text fw={800}>{item.tenTrangTrai} vừa có thu hoạch mới</Text>
                      <Text size="sm">
                        {item.cayTrong} · giống {item.giong} · {item.phanLoai}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Ngày {item.ngayThuHoach} · {dinhDangSo(item.soLuong)} {item.donVi}
                      </Text>
                    </Stack>
                  </Group>
                  <Button component={Link} href={`/trang-trai/${item.trangTraiId}`} variant="subtle" color="agrimarket">
                    Xem trang trại
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
