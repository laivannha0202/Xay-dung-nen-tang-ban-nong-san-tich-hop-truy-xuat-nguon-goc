import { Alert, Button, Card, Group, Paper, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

import { AgriBadge, type LoaiAgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';

export type TrangThaiKetQuaThanhToan = 'success' | 'failure' | 'pending';

type CauHinhTrangThai = {
  nhan: string;
  tieuDe: string;
  moTa: string;
  loai: LoaiAgriBadge;
  hanhDongChinh: {
    href: string;
    label: string;
  };
};

const CAU_HINH_TRANG_THAI: Record<TrangThaiKetQuaThanhToan, CauHinhTrangThai> = {
  success: {
    nhan: 'success',
    tieuDe: 'Thanh toán thành công',
    moTa: 'Luồng thanh toán đã chuyển sang trạng thái thành công.',
    loai: 'tuoi-moi',
    hanhDongChinh: {
      href: '/',
      label: 'Tiếp tục mua sắm',
    },
  },
  failure: {
    nhan: 'failure',
    tieuDe: 'Thanh toán chưa thành công',
    moTa: 'Giao dịch được chuyển sang trạng thái thất bại. Bạn có thể quay lại checkout để kiểm tra.',
    loai: 'canh-bao',
    hanhDongChinh: {
      href: '/thanh-toan',
      label: 'Quay lại checkout',
    },
  },
  pending: {
    nhan: 'pending',
    tieuDe: 'Đang chờ xác nhận thanh toán',
    moTa: 'Kết quả cuối cùng chưa được luồng thanh toán cung cấp hoặc trạng thái đầu vào chưa hợp lệ.',
    loai: 'chung-nhan',
    hanhDongChinh: {
      href: '/thanh-toan',
      label: 'Quay lại checkout',
    },
  },
};

export function PaymentResultContent({
  trangThai,
  maDonHang,
  maGiaoDich,
}: {
  trangThai: TrangThaiKetQuaThanhToan;
  maDonHang?: string;
  maGiaoDich?: string;
}) {
  const cauHinh = CAU_HINH_TRANG_THAI[trangThai];
  const coThamChieu = Boolean(maDonHang || maGiaoDich);

  return (
    <AgriContainer py={{ base: 40, md: 72 }}>
      <Paper withBorder radius="xl" p={{ base: 'lg', md: 'xl' }}>
        <Stack gap="lg" align="stretch">
          <Stack gap="sm" align="center">
            <AgriBadge loai={cauHinh.loai}>{cauHinh.nhan}</AgriBadge>
            <Title order={1} ta="center">
              {cauHinh.tieuDe}
            </Title>
            <Text c="dimmed" ta="center" maw={640}>
              {cauHinh.moTa}
            </Text>
          </Stack>

          <Alert color="blue" title="Nguồn trạng thái PHIEN-058">
            Màn hình này chỉ render trạng thái do luồng thanh toán chuyển tới qua tham số
            <Text component="span" fw={700} mx={4}>
              trangThai
            </Text>
            . Repository hiện chưa có API GET Payment Status, nên Customer Web không tự xác minh
            hoặc thay đổi Payment/Order/Inventory tại đây.
          </Alert>

          {coThamChieu ? (
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="xs">
                <Text fw={700}>Thông tin tham chiếu</Text>
                {maDonHang ? (
                  <Group justify="space-between" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Mã đơn hàng
                    </Text>
                    <Text size="sm" fw={700}>
                      {maDonHang}
                    </Text>
                  </Group>
                ) : null}
                {maGiaoDich ? (
                  <Group justify="space-between" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Mã giao dịch
                    </Text>
                    <Text size="sm" fw={700}>
                      {maGiaoDich}
                    </Text>
                  </Group>
                ) : null}
              </Stack>
            </Card>
          ) : null}

          <Group justify="center" wrap="wrap">
            <Button component={Link} href={cauHinh.hanhDongChinh.href}>
              {cauHinh.hanhDongChinh.label}
            </Button>
            <Button component={Link} href="/" variant="default">
              Về trang chủ
            </Button>
          </Group>
        </Stack>
      </Paper>
    </AgriContainer>
  );
}
