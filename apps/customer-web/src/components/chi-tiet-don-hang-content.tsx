'use client';

import {
  Alert,
  Badge,
  Box,
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
import {
  IconArrowLeft,
  IconCheck,
  IconLeaf,
  IconMapPin,
  IconRefresh,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { huyDonHangKhach, layChiTietDonHangKhach, nhanTrangThaiDonHang } from '@/lib/api-don-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { DanhGiaMucDonHang } from './danh-gia-muc-don-hang';
import { ErrorState } from './error-state';

const PRIMARY = '#087A4B';

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
          moTa="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc hệ thống đang tạm thời không phản hồi."
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
    <Box bg="#F7FAF8" mih="100%">
      <AgriContainer py={{ base: 28, md: 44 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={5}>
              <Button
                component={Link}
                href="/don-hang"
                variant="subtle"
                color="agrimarket"
                px={0}
                w="fit-content"
                leftSection={<IconArrowLeft size={16} />}
              >
                Quay lại đơn hàng
              </Button>
              <Group gap="sm" align="center">
                <Title order={1}>#{order.maDonHang}</Title>
                <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">
                  {nhanTrangThaiDonHang(order.trangThai)}
                </Badge>
              </Group>
              <Text c="dimmed">Đặt lúc {dinhDangNgay(order.createdAt)}</Text>
            </Stack>

            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Làm mới
            </Button>
          </Group>

          {huyMutation.isError ? (
            <Alert color="red" title="Không thể hủy đơn">
              {huyMutation.error instanceof Error
                ? huyMutation.error.message
                : 'Hệ thống chưa thể hủy đơn ở trạng thái hiện tại.'}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <Box w={38} h={38} bg="#E7F5EC" c="agrimarket.7" style={{ borderRadius: 12, display: 'grid', placeItems: 'center' }}>
                    <IconLeaf size={20} />
                  </Box>
                  <Text fw={850} fz="lg">Tóm tắt đơn hàng</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Trạng thái</Text>
                  <Text fw={700}>{nhanTrangThaiDonHang(order.trangThai)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Tổng tiền</Text>
                  <Text fw={900} fz="xl" c="agrimarket.8">{dinhDangGia(order.tongTien)} ₫</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="dimmed">Cập nhật gần nhất</Text>
                  <Text>{dinhDangNgay(order.updatedAt)}</Text>
                </Group>
                <Divider />
                {order.coTheHuy ? (
                  <Button
                    color="red"
                    variant="light"
                    loading={huyMutation.isPending}
                    onClick={xacNhanHuy}
                  >
                    Hủy đơn hàng
                  </Button>
                ) : order.lyDoKhongTheHuy ? (
                  <Text size="sm" c="dimmed">{order.lyDoKhongTheHuy}</Text>
                ) : null}
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <Box w={38} h={38} bg="#E7F5EC" c="agrimarket.7" style={{ borderRadius: 12, display: 'grid', placeItems: 'center' }}>
                    <IconTruckDelivery size={20} />
                  </Box>
                  <Text fw={850} fz="lg">Tiến trình đơn hàng</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Các mốc bên dưới phản ánh trạng thái hiện tại của đơn hàng trên AgriMarket.
                </Text>
                <Stack gap="sm">
                  {order.tienTrinh.map((moc, index) => (
                    <Group key={`${moc.trangThai}-${index}`} justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Box
                          w={28}
                          h={28}
                          bg={moc.hienTai ? PRIMARY : moc.daDat ? '#E7F5EC' : '#F3F5F4'}
                          c={moc.hienTai ? 'white' : moc.daDat ? 'agrimarket.7' : 'gray.6'}
                          style={{ borderRadius: 999, display: 'grid', placeItems: 'center' }}
                        >
                          {moc.daDat || moc.hienTai ? <IconCheck size={15} /> : <Text size="xs">{index + 1}</Text>}
                        </Box>
                        <Text fw={moc.hienTai ? 850 : 600}>{nhanTrangThaiDonHang(moc.trangThai)}</Text>
                      </Group>
                      <Text size="xs" c={moc.hienTai ? 'agrimarket.7' : moc.daDat ? 'green.8' : 'dimmed'} fw={moc.hienTai ? 800 : 500}>
                        {moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã đạt' : 'Chưa tới'}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </SimpleGrid>

          {order.diaChiGiaoHang ? (
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Group align="flex-start" gap="md" wrap="nowrap">
                <Box w={42} h={42} bg="#E7F5EC" c="agrimarket.7" style={{ borderRadius: 13, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <IconMapPin size={21} />
                </Box>
                <Stack gap={3}>
                  <Text fw={850}>Địa chỉ giao hàng</Text>
                  <Text fw={700}>{order.diaChiGiaoHang.tenNguoiNhan}</Text>
                  <Text size="sm">{order.diaChiGiaoHang.soDienThoai}</Text>
                  <Text size="sm" c="dimmed">{order.diaChiGiaoHang.diaChi}</Text>
                </Stack>
              </Group>
            </Paper>
          ) : null}

          <Stack gap="lg">
            <Title order={2}>Sản phẩm trong đơn</Title>
            {order.donNhaCungCap.map((suborder) => (
              <Card key={suborder.id} withBorder radius="lg" padding="lg" bg="white">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={3}>
                      <Text fw={850} fz="lg">{suborder.tenNhaCungCap}</Text>
                      <Text size="sm" c="dimmed">{suborder.maDon}</Text>
                    </Stack>
                    <Stack gap={4} align="flex-end">
                      <Badge variant="light" color={mauTrangThai(suborder.trangThai)}>
                        {nhanTrangThaiDonHang(suborder.trangThai)}
                      </Badge>
                      <Text fw={850} c="agrimarket.8">{dinhDangGia(suborder.tamTinh)} ₫</Text>
                    </Stack>
                  </Group>

                  <Divider />

                  <Stack gap="md">
                    {suborder.muc.map((item) => (
                      <Paper key={item.id} withBorder radius="md" p="md" bg="#FCFDFC">
                        <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
                          <Stack gap={4} style={{ flex: 1, minWidth: 230 }}>
                            <Text
                              component={Link}
                              href={`/san-pham/${item.sanPhamId}`}
                              fw={800}
                              c="dark.9"
                              style={{ textDecoration: 'none' }}
                            >
                              {item.tenSanPham}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {item.khoiLuong} {item.donVi} · SL {item.soLuong} · SKU {item.sku}
                            </Text>
                            <Text size="xs" c="dimmed">{item.tenTrangTrai}</Text>
                            <Group gap="xs" mt={4}>
                              <Button component={Link} href={`/san-pham/${item.sanPhamId}`} variant="light" color="agrimarket" size="xs">
                                Xem sản phẩm
                              </Button>
                              <Button
                                component={Link}
                                href={`/khieu-nai/tao?mucDonHangId=${encodeURIComponent(item.id)}`}
                                variant="light"
                                color="orange"
                                size="xs"
                              >
                                Yêu cầu hỗ trợ
                              </Button>
                            </Group>
                            <DanhGiaMucDonHang mucDonHangId={item.id} />
                          </Stack>
                          <Stack gap={2} align="flex-end">
                            <Text size="sm" c="dimmed">{dinhDangGia(item.donGia)} ₫ × {item.soLuong}</Text>
                            <Text fw={900} fz="lg">{dinhDangGia(item.thanhTien)} ₫</Text>
                          </Stack>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
