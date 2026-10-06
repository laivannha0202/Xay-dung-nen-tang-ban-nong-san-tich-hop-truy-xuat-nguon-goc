'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { KHUYEN_MAI_DA_LUU_QUERY_KEY, layKhuyenMaiDaLuuKhach } from '@/lib/api-khuyen-mai-khach';
import { useXacThucKhachHang } from './phien-khach-hang-provider';
import { EmptyState } from './empty-state';

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

function ngay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function VoucherCuaToiContent() {
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';
  const [filter, setFilter] = useState<'KHA_DUNG' | 'HET_HAN'>('KHA_DUNG');

  const query = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 1,
  });

  const items = useMemo(() => {
    const now = Date.now();
    const hetHan = (ketThucLuc: string, soLuotConLai: number | null) =>
      new Date(ketThucLuc).getTime() < now || soLuotConLai === 0;
    return (query.data ?? []).filter((item) =>
      filter === 'HET_HAN'
        ? hetHan(item.ketThucLuc, item.soLuotConLai)
        : !hetHan(item.ketThucLuc, item.soLuotConLai),
    );
  }, [filter, query.data]);

  if (!daDangNhap && trangThai !== 'dang-tai') {
    return (
      <EmptyState
        tieuDe="Đăng nhập để xem kho voucher"
        moTa="Voucher đã lưu được gắn với tài khoản AgriMarket."
        hanhDong={
          <Button component={Link} href="/dang-nhap?next=/tai-khoan/voucher">
            Đăng nhập
          </Button>
        }
      />
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap={3}>
        <Title order={1} fz={26}>
          Kho voucher
        </Title>
        <Text size="sm" c="dimmed">
          Voucher bạn đã lưu từ trang Khuyến mãi. Voucher khả dụng sẽ xuất hiện tại Checkout.
        </Text>
      </Stack>

      <SegmentedControl
        value={filter}
        onChange={(value) => setFilter(value as typeof filter)}
        data={[
          { value: 'KHA_DUNG', label: 'Khả dụng' },
          { value: 'HET_HAN', label: 'Hết hạn' },
        ]}
      />

      {query.isPending ? (
        <Text c="dimmed">Đang tải kho voucher…</Text>
      ) : query.isError ? (
        <Paper withBorder p="md">
          <Text c="red.7">Không tải được kho voucher.</Text>
        </Paper>
      ) : items.length === 0 ? (
        <EmptyState
          tieuDe="Không có voucher ở mục này"
          moTa="Bạn có thể săn thêm voucher tại trang Khuyến mãi."
          bieuTuong={<IconTicket size={30} />}
          hanhDong={
            <Button component={Link} href="/khuyen-mai">
              Săn voucher
            </Button>
          }
        />
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {items.map((item) => (
            <Paper key={item.id} withBorder p="md" radius="md" style={{ borderStyle: 'dashed' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge color={filter === 'KHA_DUNG' ? 'agrimarket' : 'gray'} variant="light">
                    {item.loaiGiam === 'PHAN_TRAM'
                      ? `Giảm ${item.giaTriGiam}%${item.giamToiDa !== null ? ` (tối đa ${tien(item.giamToiDa)})` : ''}`
                      : `Giảm ${tien(item.giaTriGiam)}`}
                  </Badge>
                  <Text size="xs" fw={800} c="dimmed">
                    {item.ma}
                  </Text>
                </Group>
                <Text fw={900}>{item.ten}</Text>
                <Text size="sm">Đơn từ {tien(item.donHangToiThieu)}</Text>
                <Text size="xs" c="dimmed">
                  HSD {ngay(item.ketThucLuc)}
                </Text>
                {filter === 'KHA_DUNG' ? (
                  <Button component={Link} href="/gio-hang" color="agrimarket" variant="light">
                    Dùng ngay
                  </Button>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
