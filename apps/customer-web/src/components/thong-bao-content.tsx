'use client';

import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  layThongBaoKhachHangWeb,
  type ThongBaoThuHoachWeb,
} from '@/lib/api-thong-bao';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriSkeleton } from './agri-skeleton';
import { ErrorState } from './error-state';

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function dinhDangSoLuong(value: number, donVi: string): string {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)} ${donVi}`.trim();
}

export function ThongBaoContent() {
  const router = useRouter();
  const [items, setItems] = useState<ThongBaoThuHoachWeb[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [loiTai, setLoiTai] = useState<string | null>(null);
  const [loiLamMoi, setLoiLamMoi] = useState<string | null>(null);

  const taiDuLieu = useCallback(async (lamMoi = false) => {
    if (lamMoi) {
      setDangLamMoi(true);
      setLoiLamMoi(null);
    } else {
      setDangTai(true);
      setLoiTai(null);
    }

    try {
      const data = await layThongBaoKhachHangWeb();
      setItems(data.duLieu);
      setLoiTai(null);
      setLoiLamMoi(null);
    } catch {
      if (lamMoi) {
        setLoiLamMoi('Chưa thể lấy cập nhật mới. Danh sách hiện tại vẫn được giữ nguyên.');
      } else {
        setLoiTai('Không tải được thông báo của tài khoản.');
      }
    } finally {
      setDangTai(false);
      setDangLamMoi(false);
    }
  }, []);

  useEffect(() => {
    if (!layPhienKhachHang()) {
      router.replace('/dang-nhap?next=/thong-bao');
      return;
    }
    void taiDuLieu();
  }, [router, taiDuLieu]);

  if (dangTai) {
    return <AgriSkeleton soLuong={6} />;
  }

  if (loiTai) {
    return (
      <ErrorState
        tieuDe="Không tải được thông báo"
        moTa="AgriMarket chưa thể đồng bộ cập nhật thu hoạch của tài khoản này."
        onThuLai={() => void taiDuLieu()}
      />
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={5}>
          <Text size="xs" fw={800} c="agrimarket.7" tt="uppercase" lts={0.8}>
            Cập nhật từ trang trại
          </Text>
          <Title order={1}>Thông báo</Title>
          <Text c="dimmed" maw={680}>
            Những đợt thu hoạch mới từ các trang trại bạn đang theo dõi được đồng bộ với ứng dụng Mobile.
          </Text>
        </Stack>
        <Button
          variant="light"
          color="agrimarket"
          loading={dangLamMoi}
          onClick={() => void taiDuLieu(true)}
        >
          Làm mới
        </Button>
      </Group>

      {loiLamMoi ? (
        <Alert color="orange" title="Chưa thể làm mới">
          {loiLamMoi}
        </Alert>
      ) : null}

      {items.length === 0 ? (
        <Card withBorder radius="lg" padding="xl">
          <Stack gap="sm" align="flex-start">
            <Badge color="agrimarket" variant="light">Chưa có cập nhật mới</Badge>
            <Title order={3}>Theo dõi trang trại để nhận thông báo</Title>
            <Text c="dimmed" maw={620}>
              Khi trang trại bạn theo dõi ghi nhận đợt thu hoạch mới, thông tin sẽ xuất hiện tại đây.
            </Text>
            <Button component={Link} href="/trang-trai" color="agrimarket">
              Khám phá trang trại
            </Button>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {items.map((item) => (
            <Card key={item.id} withBorder radius="lg" padding="lg">
              <Stack gap="md" h="100%">
                <Group justify="space-between" align="flex-start" gap="sm">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Badge color="agrimarket" variant="light" w="fit-content">
                      Thu hoạch mới
                    </Badge>
                    <Title order={3} size="h4">{item.cayTrong}</Title>
                    <Text size="sm" fw={700}>{item.tenTrangTrai}</Text>
                  </Stack>
                  <Text size="xs" c="dimmed">{dinhDangNgay(item.createdAt)}</Text>
                </Group>

                <Stack gap={6}>
                  <Group gap="xs" wrap="wrap">
                    <Badge variant="outline" color="gray">Giống: {item.giong}</Badge>
                    <Badge variant="outline" color="gray">Loại: {item.phanLoai}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Ngày thu hoạch: <Text span fw={700} c="dark">{dinhDangNgay(item.ngayThuHoach)}</Text>
                  </Text>
                  <Text size="sm" c="dimmed">
                    Sản lượng: <Text span fw={700} c="dark">{dinhDangSoLuong(item.soLuong, item.donVi)}</Text>
                  </Text>
                </Stack>

                <Button
                  component={Link}
                  href={`/trang-trai/${item.trangTraiId}`}
                  variant="light"
                  color="agrimarket"
                  mt="auto"
                >
                  Xem trang trại
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
