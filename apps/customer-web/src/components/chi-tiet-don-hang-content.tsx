'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { huyDonHangKhach, layChiTietDonHangKhach, nhanTrangThaiDonHang } from '@/lib/api-don-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function dinhDangNgay(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function mauTrangThai(trangThai: string): string {
  if (trangThai === 'DA_HUY') return 'red';
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'green';
  if (trangThai === 'DANG_GIAO') return 'blue';
  if (trangThai === 'CHO_THANH_TOAN') return 'orange';
  return 'teal';
}

export function ChiTietDonHangContent({ donHangId }: { donHangId: string }) {
  const daDangNhap = layPhienKhachHang() !== null;
  const queryClient = useQueryClient();
  const queryKey = ['don-hang-khach', 'detail', donHangId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => layChiTietDonHangKhach(donHangId),
    enabled: daDangNhap,
    staleTime: 10_000,
  });

  const huyMutation = useMutation({
    mutationFn: () => huyDonHangKhach(donHangId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      void queryClient.invalidateQueries({ queryKey: ['don-hang-khach', 'list'] });
    },
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem đơn hàng"
          moTa="Chi tiết đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
          hanhDong={
            <Button component={Link} href={`/dang-nhap?next=/don-hang/${donHangId}`}>
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (query.isPending) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không tải được chi tiết đơn hàng"
          moTa="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc API đang tạm lỗi."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  const order = query.data;

  const xacNhanHuy = () => {
    if (!order.coTheHuy || huyMutation.isPending) return;
    if (!window.confirm(`Hủy đơn ${order.maDonHang}? Thao tác này không thể hoàn tác.`)) return;
    huyMutation.mutate();
  };

  return (
    <AgriContainer py={{ base: 32, md: 56 }}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={4}>
            <Button component={Link} href="/don-hang" variant="subtle" px={0} w="fit-content">
              ← Quay lại đơn hàng
            </Button>
            <Title order={1}>{order.maDonHang}</Title>
            <Text c="dimmed">Tạo lúc {dinhDangNgay(order.createdAt)}</Text>
          </Stack>
          <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">
            {nhanTrangThaiDonHang(order.trangThai)}
          </Badge>
        </Group>

        {huyMutation.isError ? (
          <Alert color="red" title="Không thể hủy đơn">
            {huyMutation.error instanceof Error
              ? huyMutation.error.message
              : 'Backend từ chối cancel action ở trạng thái hiện tại.'}
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder radius="lg" p="lg">
            <Stack gap="sm">
              <Text fw={800}>Tóm tắt</Text>
              <Group justify="space-between">
                <Text c="dimmed">Trạng thái</Text>
                <Text fw={700}>{nhanTrangThaiDonHang(order.trangThai)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Tổng tiền</Text>
                <Text fw={800} c="agrimarket.8">
                  {dinhDangGia(order.tongTien)} ₫
                </Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Cập nhật</Text>
                <Text>{dinhDangNgay(order.updatedAt)}</Text>
              </Group>
              <Divider />
              <Button
                color="red"
                variant={order.coTheHuy ? 'light' : 'default'}
                disabled={!order.coTheHuy || huyMutation.isPending}
                loading={huyMutation.isPending}
                onClick={xacNhanHuy}
              >
                Hủy đơn hàng
              </Button>
              {!order.coTheHuy && order.lyDoKhongTheHuy ? (
                <Text size="xs" c="dimmed">
                  {order.lyDoKhongTheHuy}
                </Text>
              ) : null}
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p="lg">
            <Stack gap="sm">
              <Text fw={800}>Tiến trình đơn hàng</Text>
              <Text size="xs" c="dimmed">
                Tiến trình được suy ra từ trạng thái hiện tại. Hệ thống chưa lưu lịch sử timestamp
                cho từng mốc nên không hiển thị thời gian giả.
              </Text>
              <Stack gap="xs">
                {order.tienTrinh.map((moc, index) => (
                  <Group key={`${moc.trangThai}-${index}`} justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Badge
                        radius="xl"
                        variant={moc.hienTai ? 'filled' : 'light'}
                        color={moc.daDat ? 'agrimarket' : 'gray'}
                      >
                        {index + 1}
                      </Badge>
                      <Text fw={moc.hienTai ? 800 : 500}>
                        {nhanTrangThaiDonHang(moc.trangThai)}
                      </Text>
                    </Group>
                    <Text size="xs" c={moc.daDat ? 'green.8' : 'dimmed'}>
                      {moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã đạt' : 'Chưa tới'}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Stack gap="lg">
          <Title order={2}>Sản phẩm theo nhà cung cấp</Title>
          {order.donNhaCungCap.map((suborder) => (
            <Card key={suborder.id} withBorder radius="lg" padding="lg">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                  <Stack gap={3}>
                    <Text fw={800}>{suborder.tenNhaCungCap}</Text>
                    <Text size="sm" c="dimmed">
                      {suborder.maDon}
                    </Text>
                  </Stack>
                  <Stack gap={3} align="flex-end">
                    <Badge variant="light" color={mauTrangThai(suborder.trangThai)}>
                      {nhanTrangThaiDonHang(suborder.trangThai)}
                    </Badge>
                    <Text fw={800}>{dinhDangGia(suborder.tamTinh)} ₫</Text>
                  </Stack>
                </Group>

                <Divider />

                <Stack gap="sm">
                  {suborder.muc.map((item) => (
                    <Group key={item.id} justify="space-between" align="flex-start" wrap="wrap">
                      <Stack gap={2}>
                        <Text fw={700}>{item.tenSanPham}</Text>
                        <Text size="sm" c="dimmed">
                          SKU {item.sku} · {item.khoiLuong} {item.donVi} · SL {item.soLuong}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {item.tenTrangTrai} ({item.maTrangTrai})
                        </Text>
                      </Stack>
                      <Stack gap={2} align="flex-end">
                        <Text size="sm">
                          {dinhDangGia(item.donGia)} ₫ × {item.soLuong}
                        </Text>
                        <Text fw={800}>{dinhDangGia(item.thanhTien)} ₫</Text>
                      </Stack>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </AgriContainer>
  );
}
