import { Button, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck, IconClock, IconShoppingBag, IconX } from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

export type TrangThaiKetQuaThanhToan = 'success' | 'failure' | 'pending';

const CAU_HINH = {
  success: {
    color: 'green',
    icon: IconCheck,
    tieuDe: 'Đặt hàng thành công',
    moTa: 'Đơn hàng của bạn đã được tạo và phương thức COD đã được ghi nhận.',
  },
  failure: {
    color: 'red',
    icon: IconX,
    tieuDe: 'Chưa thể hoàn tất đơn hàng',
    moTa: 'Giao dịch chưa hoàn tất. Bạn có thể quay lại giỏ hàng hoặc thử lại.',
  },
  pending: {
    color: 'yellow',
    icon: IconClock,
    tieuDe: 'Đơn hàng đang chờ xác nhận',
    moTa: 'Hệ thống chưa nhận được kết quả cuối cùng của giao dịch.',
  },
} as const;

export function PaymentResultContent({
  trangThai,
  maDonHang,
  maGiaoDich,
}: {
  trangThai: TrangThaiKetQuaThanhToan;
  maDonHang?: string;
  maGiaoDich?: string;
}) {
  const cauHinh = CAU_HINH[trangThai];
  const Icon = cauHinh.icon;

  return (
    <AgriContainer py={{ base: 36, md: 64 }}>
      <Paper withBorder radius="md" p={{ base: 'xl', md: 42 }} maw={720} mx="auto" bg="white">
        <Stack gap="lg" align="center" ta="center">
          <ThemeIcon size={60} radius="xl" color={cauHinh.color} variant="light">
            <Icon size={31} stroke={1.8} />
          </ThemeIcon>

          <Stack gap={6}>
            <Title order={1} fz={{ base: 28, md: 34 }}>
              {cauHinh.tieuDe}
            </Title>
            <Text c="dimmed" maw={560}>
              {cauHinh.moTa}
            </Text>
          </Stack>

          {maDonHang || maGiaoDich ? (
            <Paper withBorder radius="md" p="md" w="100%" bg="#fafaf7">
              <Stack gap="xs">
                {maDonHang ? (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Mã đơn hàng
                    </Text>
                    <Text size="sm" fw={800}>
                      {maDonHang}
                    </Text>
                  </Group>
                ) : null}
                {maGiaoDich ? (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Mã giao dịch
                    </Text>
                    <Text size="sm" fw={800}>
                      {maGiaoDich}
                    </Text>
                  </Group>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          <Group justify="center">
            <Button component={Link} href="/don-hang" leftSection={<IconShoppingBag size={17} />}>
              Xem đơn hàng
            </Button>
            <Button component={Link} href="/san-pham" variant="default">
              Tiếp tục mua sắm
            </Button>
          </Group>
        </Stack>
      </Paper>
    </AgriContainer>
  );
}
