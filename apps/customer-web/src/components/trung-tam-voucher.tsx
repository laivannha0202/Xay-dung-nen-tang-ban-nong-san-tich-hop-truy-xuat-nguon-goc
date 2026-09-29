'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconClock, IconTicket } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  VOUCHER_CONG_KHAI_QUERY_KEY,
  VOUCHER_CUA_TOI_QUERY_KEY,
  layVoucherCongKhai,
  layVoucherCuaToi,
  luuVoucherCuaToi,
} from '@/lib/api-voucher';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

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

export function TrungTamVoucher() {
  const queryClient = useQueryClient();
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';

  const congKhaiQuery = useQuery({
    queryKey: VOUCHER_CONG_KHAI_QUERY_KEY,
    queryFn: layVoucherCongKhai,
    staleTime: 30_000,
  });
  const cuaToiQuery = useQuery({
    queryKey: VOUCHER_CUA_TOI_QUERY_KEY,
    queryFn: layVoucherCuaToi,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

  const daLuuIds = useMemo(
    () => new Set((cuaToiQuery.data?.items ?? []).map((item) => item.khuyenMaiId)),
    [cuaToiQuery.data],
  );

  const luuMutation = useMutation({
    mutationFn: luuVoucherCuaToi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: VOUCHER_CUA_TOI_QUERY_KEY });
    },
  });

  const items = congKhaiQuery.data?.items ?? [];

  return (
    <Stack gap="md" mb="xl">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={3}>
          <Group gap="sm">
            <ThemeIcon color="agrimarket" variant="light" radius="xl">
              <IconTicket size={18} />
            </ThemeIcon>
            <Title order={2} fz={{ base: 20, md: 24 }}>
              Voucher AgriMarket
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Lưu voucher vào tài khoản rồi chọn trực tiếp khi thanh toán. Không cần ghi nhớ mã.
          </Text>
        </Stack>
        {daDangNhap ? (
          <Button component={Link} href="/tai-khoan/voucher" variant="subtle" color="agrimarket">
            Kho voucher của tôi
          </Button>
        ) : null}
      </Group>

      {congKhaiQuery.isPending ? (
        <Text size="sm" c="dimmed">
          Đang tải voucher…
        </Text>
      ) : congKhaiQuery.isError ? (
        <Paper withBorder p="md">
          <Text size="sm" c="red.7">
            Không tải được danh sách voucher. Hãy thử lại sau.
          </Text>
        </Paper>
      ) : items.length === 0 ? (
        <Paper withBorder p="lg">
          <Text fw={800}>Chưa có voucher đang phát hành</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Flash Sale vẫn hoạt động bình thường; voucher mới sẽ xuất hiện tại đây khi quản trị viên
            phát hành.
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {items.map((item) => {
            const daLuu = daLuuIds.has(item.khuyenMaiId);
            return (
              <Paper
                key={item.khuyenMaiId}
                withBorder
                p="md"
                radius="md"
                style={{ borderStyle: 'dashed' }}
              >
                <Stack gap="sm" h="100%">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Badge color="agrimarket" variant="light" size="lg">
                      Giảm {tien(item.giaTriGiam)}
                    </Badge>
                    <Text size="xs" c="dimmed" fw={700}>
                      {item.ma}
                    </Text>
                  </Group>
                  <Stack gap={2}>
                    <Text fw={900} lineClamp={2}>
                      {item.ten}
                    </Text>
                    {item.moTa ? (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {item.moTa}
                      </Text>
                    ) : null}
                  </Stack>
                  <Text size="sm">
                    Đơn tối thiểu{' '}
                    <Text span fw={850}>
                      {tien(item.donHangToiThieu)}
                    </Text>
                  </Text>
                  <Group gap={5}>
                    <IconClock size={14} />
                    <Text size="xs" c="dimmed">
                      HSD {ngay(item.ketThucLuc)}
                    </Text>
                  </Group>
                  {daLuu ? (
                    <Button
                      mt="auto"
                      color="agrimarket"
                      variant="light"
                      leftSection={<IconCheck size={16} />}
                      disabled
                    >
                      Đã lưu
                    </Button>
                  ) : daDangNhap ? (
                    <Button
                      mt="auto"
                      color="agrimarket"
                      leftSection={<IconTicket size={16} />}
                      loading={luuMutation.isPending}
                      onClick={() => luuMutation.mutate(item.khuyenMaiId)}
                    >
                      Lưu voucher
                    </Button>
                  ) : (
                    <Button
                      mt="auto"
                      component={Link}
                      href="/dang-nhap?next=/khuyen-mai"
                      color="agrimarket"
                      leftSection={<IconTicket size={16} />}
                    >
                      Đăng nhập để lưu
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
