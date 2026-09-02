'use client';

import { Alert, Button, Card, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
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
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Trang trại theo dõi</Title>
        <Text c="dimmed">Theo dõi trang trại để nhận thông báo in-app khi có thu hoạch mới.</Text>
      </div>

      {loi ? (
        <Alert color="red" title="Không thể hoàn tất">
          {loi}
        </Alert>
      ) : null}

      <Stack gap="md">
        <Title order={3}>Đang theo dõi</Title>
        {farms.length === 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Stack gap="sm">
              <Text fw={700}>Chưa theo dõi trang trại nào</Text>
              <Text c="dimmed">Mở chi tiết trang trại và chọn “Theo dõi trang trại”.</Text>
              <Button component={Link} href="/san-pham" variant="light" w="fit-content">
                Khám phá nông sản
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {farms.map((item) => (
              <Card key={item.trangTraiId} withBorder radius="md" padding="lg">
                <Stack gap="sm">
                  <div>
                    <Title order={4}>{item.ten}</Title>
                    <Text size="sm" c="dimmed">
                      {item.ma} · {item.diaChi}
                    </Text>
                  </div>
                  <Group>
                    <Button
                      component={Link}
                      href={`/trang-trai/${item.trangTraiId}`}
                      variant="light"
                    >
                      Xem trang trại
                    </Button>
                    <Button
                      color="red"
                      variant="subtle"
                      loading={dangXoaId === item.trangTraiId}
                      onClick={() => {
                        void boTheoDoi(item.trangTraiId);
                      }}
                    >
                      Bỏ theo dõi
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      <Stack gap="md">
        <Title order={3}>Thu hoạch mới</Title>
        {notifications.length === 0 ? (
          <Card withBorder radius="md" padding="lg">
            <Text c="dimmed">Chưa có thông báo thu hoạch mới từ các trang trại đã theo dõi.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {notifications.map((item) => (
              <Card key={item.id} withBorder radius="md" padding="lg">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Stack gap={4}>
                    <Title order={4}>{item.tenTrangTrai} vừa có thu hoạch mới</Title>
                    <Text>
                      {item.cayTrong} · giống {item.giong} · {item.phanLoai}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Ngày {item.ngayThuHoach} · {dinhDangSo(item.soLuong)} {item.donVi}
                    </Text>
                  </Stack>
                  <Button component={Link} href={`/trang-trai/${item.trangTraiId}`} variant="light">
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
