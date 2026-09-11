'use client';

import {
  metaTrangThaiDatCho,
  metaTrangThaiThanhToan,
  nhanPhuongThucThanhToan,
} from '@agrimarket/api-client';
import { Alert, Button, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck, IconClock, IconRefresh, IconShoppingBag, IconX } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import {
  layThanhToanDonHangKhach,
  thanhToanDonHangKhachQueryKey,
  taoThanhToanVnPayWebKhach,
} from '@/lib/api-thanh-toan';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';

export type TrangThaiKetQuaThanhToan = 'success' | 'failure' | 'pending';

const CAU_HINH = {
  success: {
    color: 'green',
    icon: IconCheck,
    tieuDe: 'Thanh toán đã được xác nhận',
    moTa: 'AgriMarket đã xác minh trạng thái thanh toán hiện tại từ hệ thống.',
  },
  failure: {
    color: 'red',
    icon: IconX,
    tieuDe: 'Thanh toán chưa thành công',
    moTa: 'Giao dịch không ở trạng thái thanh toán thành công. Nếu tồn kho vẫn đang được giữ, bạn có thể thử lại VNPay cho chính đơn hàng này.',
  },
  pending: {
    color: 'yellow',
    icon: IconClock,
    tieuDe: 'Thanh toán đang được xác nhận',
    moTa: 'Hệ thống chưa có trạng thái cuối cùng. Bạn có thể làm mới để kiểm tra lại.',
  },
} as const;

function trangThaiTuBackend(value: string): TrangThaiKetQuaThanhToan {
  if (value === 'PAID') return 'success';

  if (
    value === 'FAILED' ||
    value === 'CANCELLED' ||
    value === 'REFUNDED' ||
    value === 'PARTIALLY_REFUNDED'
  ) {
    return 'failure';
  }

  return 'pending';
}

export function PaymentResultContent({
  trangThai,
  donHangId,
  maDonHang,
  maGiaoDich,
}: {
  trangThai: TrangThaiKetQuaThanhToan;
  donHangId?: string;
  maDonHang?: string;
  maGiaoDich?: string;
}) {
  const daDangNhap = layPhienKhachHang() !== null;
  const coTheXacMinh = daDangNhap && Boolean(donHangId);

  const paymentQuery = useQuery({
    queryKey: thanhToanDonHangKhachQueryKey(donHangId ?? ''),
    queryFn: () => layThanhToanDonHangKhach(donHangId ?? ''),
    enabled: coTheXacMinh,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const retryVnPayMutation = useMutation({
    mutationFn: async () => {
      if (!donHangId) throw new Error('Thiếu đơn hàng để thử lại VNPay.');
      const next = await taoThanhToanVnPayWebKhach(donHangId, crypto.randomUUID());
      if (next.donHangId !== donHangId) {
        throw new Error('Payment retry không thuộc đơn hàng hiện tại.');
      }
      if (next.trangThai === 'PAID') return next;
      if (
        next.phuongThuc !== 'VNPAY_SANDBOX' ||
        (next.trangThai !== 'PENDING' && next.trangThai !== 'CREATED') ||
        !next.paymentUrl
      ) {
        throw new Error('Backend chưa trả VNPay URL hợp lệ cho lần thử lại.');
      }
      window.location.assign(next.paymentUrl);
      return next;
    },
    onSuccess: (next) => {
      if (next.trangThai === 'PAID') {
        void paymentQuery.refetch();
      }
    },
  });

  const payment = paymentQuery.data;
  const trangThaiHienThi = payment
    ? trangThaiTuBackend(payment.trangThai)
    : donHangId
      ? 'pending'
      : trangThai;
  const cauHinh = CAU_HINH[trangThaiHienThi];
  const Icon = cauHinh.icon;
  const maDonHangHienThi = payment?.maDonHang ?? maDonHang;
  const maGiaoDichHienThi = payment?.giaoDich.maGiaoDich ?? maGiaoDich;
  const coTheThuLaiVnPay =
    Boolean(donHangId) &&
    payment?.phuongThuc === 'VNPAY_SANDBOX' &&
    (payment.trangThai === 'FAILED' || payment.trangThai === 'CANCELLED') &&
    payment.datCho.trangThai === 'DANG_GIU';

  const returnTo = donHangId
    ? `/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`
    : '/thanh-toan/ket-qua';

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

          {donHangId && !daDangNhap ? (
            <Alert color="yellow" title="Cần đăng nhập để xác minh" w="100%" ta="left">
              <Stack gap="sm">
                <Text size="sm">
                  Trạng thái trên liên kết không được dùng thay cho dữ liệu thanh toán của tài khoản.
                </Text>
                <Button
                  component={Link}
                  href={`/dang-nhap?next=${encodeURIComponent(returnTo)}`}
                  w="fit-content"
                >
                  Đăng nhập để kiểm tra
                </Button>
              </Stack>
            </Alert>
          ) : null}

          {coTheXacMinh && paymentQuery.isPending ? (
            <Alert color="blue" title="Đang đọc trạng thái thanh toán" w="100%" ta="left">
              AgriMarket đang xác minh giao dịch trực tiếp từ Backend.
            </Alert>
          ) : null}

          {coTheXacMinh && paymentQuery.isError ? (
            <Alert color="yellow" title="Chưa xác minh được giao dịch" w="100%" ta="left">
              <Stack gap="sm">
                <Text size="sm">
                  Không thể đọc trạng thái thanh toán mới nhất. Kết quả trên liên kết chưa được coi là xác nhận cuối cùng.
                </Text>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  loading={paymentQuery.isFetching}
                  onClick={() => void paymentQuery.refetch()}
                  w="fit-content"
                >
                  Kiểm tra lại
                </Button>
              </Stack>
            </Alert>
          ) : null}

          {retryVnPayMutation.isError ? (
            <Alert color="red" title="Không thể thử lại VNPay" w="100%" ta="left">
              {retryVnPayMutation.error instanceof Error
                ? retryVnPayMutation.error.message
                : 'Không tạo được Payment VNPay mới.'}
            </Alert>
          ) : null}

          {maDonHangHienThi || maGiaoDichHienThi || payment ? (
            <Paper withBorder radius="md" p="md" w="100%" bg="#fafaf7">
              <Stack gap="xs">
                {maDonHangHienThi ? (
                  <Group justify="space-between" gap="lg" wrap="nowrap">
                    <Text size="sm" c="dimmed">Mã đơn hàng</Text>
                    <Text size="sm" fw={800} ta="right">{maDonHangHienThi}</Text>
                  </Group>
                ) : null}
                {maGiaoDichHienThi ? (
                  <Group justify="space-between" gap="lg" wrap="nowrap">
                    <Text size="sm" c="dimmed">Mã giao dịch</Text>
                    <Text size="sm" fw={800} ta="right">{maGiaoDichHienThi}</Text>
                  </Group>
                ) : null}
                {payment ? (
                  <>
                    <Group justify="space-between" gap="lg" wrap="nowrap">
                      <Text size="sm" c="dimmed">Phương thức</Text>
                      <Text size="sm" fw={700} ta="right">
                        {nhanPhuongThucThanhToan(payment.phuongThuc)}
                      </Text>
                    </Group>
                    <Group justify="space-between" gap="lg" wrap="nowrap">
                      <Text size="sm" c="dimmed">Thanh toán</Text>
                      <Text size="sm" fw={700} ta="right">
                        {metaTrangThaiThanhToan(payment.trangThai).label}
                      </Text>
                    </Group>
                    <Group justify="space-between" gap="lg" wrap="nowrap">
                      <Text size="sm" c="dimmed">Hàng đã đặt</Text>
                      <Text size="sm" fw={700} ta="right">
                        {metaTrangThaiDatCho(payment.datCho.trangThai).label}
                      </Text>
                    </Group>
                  </>
                ) : null}
              </Stack>
            </Paper>
          ) : null}

          <Group justify="center">
            {coTheThuLaiVnPay ? (
              <Button
                color="agrimarket"
                leftSection={<IconRefresh size={16} />}
                loading={retryVnPayMutation.isPending}
                onClick={() => retryVnPayMutation.mutate()}
              >
                Thử lại VNPay
              </Button>
            ) : null}
            {coTheXacMinh && payment && trangThaiHienThi === 'pending' ? (
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                loading={paymentQuery.isFetching}
                onClick={() => void paymentQuery.refetch()}
              >
                Làm mới trạng thái
              </Button>
            ) : null}
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
