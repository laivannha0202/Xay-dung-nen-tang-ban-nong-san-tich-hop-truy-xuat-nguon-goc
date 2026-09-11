'use client';

import {
  metaTrangThaiDatCho,
  metaTrangThaiThanhToan,
  nhanPhuongThucThanhToan,
} from '@agrimarket/api-client';
import { Alert, Badge, Box, Button, Divider, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
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
import { BusinessNote } from './web-page';

export type TrangThaiKetQuaThanhToan = 'success' | 'failure' | 'pending';

const CAU_HINH = {
  success: {
    color: 'green',
    icon: IconCheck,
    tieuDe: 'Thanh toán đã được xác nhận',
    moTa: 'AgriMarket đã xác minh trạng thái thanh toán hiện tại từ Backend.',
  },
  failure: {
    color: 'red',
    icon: IconX,
    tieuDe: 'Thanh toán chưa thành công',
    moTa: 'Giao dịch chưa ở trạng thái thành công. Nếu reservation vẫn còn hiệu lực, bạn có thể thử lại VNPay cho chính đơn hàng này.',
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
  if (value === 'FAILED' || value === 'CANCELLED' || value === 'REFUNDED' || value === 'PARTIALLY_REFUNDED') return 'failure';
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
      if (next.donHangId !== donHangId) throw new Error('Payment retry không thuộc đơn hàng hiện tại.');
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
      if (next.trangThai === 'PAID') void paymentQuery.refetch();
    },
  });

  const payment = paymentQuery.data;
  const trangThaiHienThi = payment ? trangThaiTuBackend(payment.trangThai) : donHangId ? 'pending' : trangThai;
  const cauHinh = CAU_HINH[trangThaiHienThi];
  const Icon = cauHinh.icon;
  const maDonHangHienThi = payment?.maDonHang ?? maDonHang;
  const maGiaoDichHienThi = payment?.giaoDich.maGiaoDich ?? maGiaoDich;
  const coTheThuLaiVnPay =
    Boolean(donHangId) &&
    payment?.phuongThuc === 'VNPAY_SANDBOX' &&
    (payment.trangThai === 'FAILED' || payment.trangThai === 'CANCELLED') &&
    payment.datCho.trangThai === 'DANG_GIU';

  const returnTo = donHangId ? `/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}` : '/thanh-toan/ket-qua';

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 34, md: 64 }}>
        <Paper withBorder className="agri-surface" p={{ base: 'xl', md: 46 }} maw={780} mx="auto">
          <Stack gap="xl" align="center" ta="center">
            <ThemeIcon size={74} radius="xl" color={cauHinh.color} variant="light">
              <Icon size={36} stroke={1.8} />
            </ThemeIcon>

            <Stack gap={8} align="center">
              <Badge color={cauHinh.color} variant="light" size="lg">
                {trangThaiHienThi === 'success' ? 'Đã xác nhận' : trangThaiHienThi === 'failure' ? 'Chưa thành công' : 'Đang xử lý'}
              </Badge>
              <Title order={1} fz={{ base: 29, md: 38 }} fw={900} lh={1.08}>{cauHinh.tieuDe}</Title>
              <Text c="dimmed" maw={600} lh={1.7}>{cauHinh.moTa}</Text>
            </Stack>

            {donHangId && !daDangNhap ? (
              <Alert color="yellow" title="Cần đăng nhập để xác minh" w="100%" ta="left">
                <Stack gap="sm">
                  <Text size="sm">Trạng thái trên URL không được dùng thay cho dữ liệu thanh toán của tài khoản.</Text>
                  <Button component={Link} href={`/dang-nhap?next=${encodeURIComponent(returnTo)}`} w="fit-content">Đăng nhập để kiểm tra</Button>
                </Stack>
              </Alert>
            ) : null}

            {coTheXacMinh && paymentQuery.isPending ? (
              <Alert color="blue" title="Đang đọc trạng thái thanh toán" w="100%" ta="left">AgriMarket đang xác minh giao dịch trực tiếp từ Backend.</Alert>
            ) : null}

            {coTheXacMinh && paymentQuery.isError ? (
              <Alert color="yellow" title="Chưa xác minh được giao dịch" w="100%" ta="left">
                <Stack gap="sm">
                  <Text size="sm">Không thể đọc trạng thái thanh toán mới nhất. Kết quả trên liên kết chưa được coi là xác nhận cuối cùng.</Text>
                  <Button variant="light" leftSection={<IconRefresh size={16} />} loading={paymentQuery.isFetching} onClick={() => void paymentQuery.refetch()} w="fit-content">Kiểm tra lại</Button>
                </Stack>
              </Alert>
            ) : null}

            {retryVnPayMutation.isError ? (
              <Alert color="red" title="Không thể thử lại VNPay" w="100%" ta="left">
                {retryVnPayMutation.error instanceof Error ? retryVnPayMutation.error.message : 'Không tạo được Payment VNPay mới.'}
              </Alert>
            ) : null}

            {maDonHangHienThi || maGiaoDichHienThi || payment ? (
              <Paper withBorder className="agri-surface agri-price-summary" p={{ base: 'md', md: 'lg' }} w="100%">
                <Stack gap="sm">
                  <Text size="xs" fw={800} c="dimmed" ta="left">THÔNG TIN GIAO DỊCH</Text>
                  <Divider />
                  {maDonHangHienThi ? <Group justify="space-between" gap="lg" wrap="nowrap"><Text size="sm" c="dimmed">Mã đơn hàng</Text><Text size="sm" fw={850} ta="right">{maDonHangHienThi}</Text></Group> : null}
                  {maGiaoDichHienThi ? <Group justify="space-between" gap="lg" wrap="nowrap"><Text size="sm" c="dimmed">Mã giao dịch</Text><Text size="sm" fw={850} ta="right">{maGiaoDichHienThi}</Text></Group> : null}
                  {payment ? (
                    <>
                      <Group justify="space-between" gap="lg" wrap="nowrap"><Text size="sm" c="dimmed">Phương thức</Text><Text size="sm" fw={750} ta="right">{nhanPhuongThucThanhToan(payment.phuongThuc)}</Text></Group>
                      <Group justify="space-between" gap="lg" wrap="nowrap"><Text size="sm" c="dimmed">Thanh toán</Text><Text size="sm" fw={750} ta="right">{metaTrangThaiThanhToan(payment.trangThai).label}</Text></Group>
                      <Group justify="space-between" gap="lg" wrap="nowrap"><Text size="sm" c="dimmed">Reservation</Text><Text size="sm" fw={750} ta="right">{metaTrangThaiDatCho(payment.datCho.trangThai).label}</Text></Group>
                    </>
                  ) : null}
                </Stack>
              </Paper>
            ) : null}

            <BusinessNote>
              VNPay trong phạm vi đồ án đang chạy Sandbox. Nếu thanh toán thất bại nhưng reservation vẫn đang giữ, thao tác “Thử lại VNPay” tạo Payment mới cho cùng Order, không tạo thêm đơn hàng.
            </BusinessNote>

            <Group justify="center" gap="sm">
              {coTheThuLaiVnPay ? (
                <Button color="agrimarket" leftSection={<IconRefresh size={16} />} loading={retryVnPayMutation.isPending} onClick={() => retryVnPayMutation.mutate()}>Thử lại VNPay</Button>
              ) : null}
              {coTheXacMinh && payment && trangThaiHienThi === 'pending' ? (
                <Button variant="light" leftSection={<IconRefresh size={16} />} loading={paymentQuery.isFetching} onClick={() => void paymentQuery.refetch()}>Làm mới trạng thái</Button>
              ) : null}
              <Button component={Link} href="/don-hang" leftSection={<IconShoppingBag size={17} />} color="agrimarket">Xem đơn hàng</Button>
              <Button component={Link} href="/san-pham" variant="default">Tiếp tục mua sắm</Button>
            </Group>
          </Stack>
        </Paper>
      </AgriContainer>
    </Box>
  );
}
