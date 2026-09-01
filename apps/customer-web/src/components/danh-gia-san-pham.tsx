'use client';

import { Alert, Group, Pagination, Paper, Rating, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { layDanhSachDanhGiaSanPhamKhach } from '@/lib/api-danh-gia';

function dinhDangNgay(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
}

export function DanhGiaSanPham({ sanPhamId }: { sanPhamId: string }) {
  const [trang, setTrang] = useState(1);
  const gioiHan = 5;
  const queryKey = ['danh-gia-khach', 'san-pham', sanPhamId, trang] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => layDanhSachDanhGiaSanPhamKhach(sanPhamId, { trang, gioiHan }),
    staleTime: 30_000,
  });

  if (query.isPending) {
    return (
      <Paper component="section" withBorder radius="lg" p="lg">
        <Text c="dimmed">Đang tải đánh giá sản phẩm…</Text>
      </Paper>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Alert color="red" title="Không tải được đánh giá">
        Danh sách đánh giá công khai đang tạm thời không khả dụng.
      </Alert>
    );
  }

  const data = query.data;
  const tongTrang = Math.max(1, Math.ceil(data.tong / data.gioiHan));

  return (
    <Paper component="section" withBorder radius="xl" p={{ base: 'lg', md: 'xl' }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Title order={2}>Đánh giá từ khách hàng</Title>
            <Text c="dimmed">Review chỉ được Backend chấp nhận cho order item đã giao.</Text>
          </Stack>
          <Stack gap={4} align="flex-end">
            <Group gap="xs">
              <Rating value={data.diemTrungBinh ?? 0} readOnly />
              <Text fw={800}>{data.diemTrungBinh?.toFixed(1) ?? '—'}/5</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {data.tong} lượt đánh giá
            </Text>
          </Stack>
        </Group>

        {data.items.length === 0 ? (
          <Text c="dimmed">Sản phẩm chưa có đánh giá.</Text>
        ) : (
          <Stack gap="sm">
            {data.items.map((item) => (
              <Paper key={item.id} withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={2}>
                      <Text fw={700}>{item.nguoiDanhGia}</Text>
                      <Text size="xs" c="dimmed">
                        {dinhDangNgay(item.createdAt)}
                      </Text>
                    </Stack>
                    <Rating value={item.diem} readOnly />
                  </Group>
                  <Text size="sm" c={item.binhLuan ? undefined : 'dimmed'}>
                    {item.binhLuan ?? 'Không có bình luận.'}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {data.tong > data.gioiHan ? (
          <Pagination value={data.trang} total={tongTrang} onChange={setTrang} />
        ) : null}
      </Stack>
    </Paper>
  );
}
