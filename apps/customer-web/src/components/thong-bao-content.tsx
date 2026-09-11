'use client';

import { Alert, Badge, Box, Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconBellRinging, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  layThongBaoKhachHangWeb,
  type ThongBaoThuHoachWeb,
} from '@/lib/api-thong-bao';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader } from './web-page';

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

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Cập nhật từ trang trại"
        title="Thông báo"
        description="Theo dõi các đợt thu hoạch mới từ những trang trại bạn đang quan tâm trên AgriMarket."
        actions={
          <Button
            variant="light"
            color="agrimarket"
            loading={dangLamMoi}
            leftSection={<IconRefresh size={17} />}
            onClick={() => void taiDuLieu(true)}
          >
            Làm mới
          </Button>
        }
        meta={
          <Badge color="agrimarket" variant="light">
            {items.length} cập nhật
          </Badge>
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <BusinessNote icon={<IconBellRinging size={18} color="#087A4B" />}>
            Nếu thao tác làm mới thất bại, danh sách đã tải trước đó vẫn được giữ nguyên để tránh hiển thị nhầm trạng thái rỗng.
          </BusinessNote>

          {dangTai ? (
            <AgriSkeleton soLuong={6} />
          ) : loiTai ? (
            <ErrorState
              tieuDe="Không tải được thông báo"
              moTa="AgriMarket chưa thể đồng bộ cập nhật thu hoạch của tài khoản này."
              onThuLai={() => void taiDuLieu()}
            />
          ) : (
            <>
              {loiLamMoi ? (
                <Alert color="orange" title="Chưa thể làm mới">
                  {loiLamMoi}
                </Alert>
              ) : null}

              {items.length === 0 ? (
                <EmptyState
                  tieuDe="Chưa có cập nhật mới"
                  moTa="Khi trang trại bạn theo dõi ghi nhận đợt thu hoạch mới, thông tin sẽ xuất hiện tại đây."
                  hanhDong={
                    <Button component={Link} href="/trang-trai" color="agrimarket">
                      Khám phá trang trại
                    </Button>
                  }
                />
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {items.map((item) => (
                    <Card key={item.id} withBorder className="agri-surface" padding="lg">
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
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
