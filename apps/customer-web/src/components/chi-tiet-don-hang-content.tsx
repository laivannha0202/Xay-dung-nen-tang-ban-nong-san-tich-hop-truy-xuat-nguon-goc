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
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconLeaf,
  IconMapPin,
  IconRefresh,
  IconShoppingBag,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { huyDonHangKhach, layChiTietDonHangKhach, nhanTrangThaiDonHang } from '@/lib/api-don-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { DanhGiaMucDonHang } from './danh-gia-muc-don-hang';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader, SectionHeading, StatGrid } from './web-page';

const PRIMARY = '#087A4B';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangNgay(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function mauTrangThai(trangThai: string): string {
  if (trangThai === 'DA_HUY') return 'red';
  if (trangThai === 'HOAN_TIEN_MOT_PHAN' || trangThai === 'HOAN_TIEN_TOAN_BO') return 'orange';
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
      <Box className="agri-page">
        <PageHeader eyebrow="Chi tiết đơn hàng" title="Đăng nhập để xem đơn hàng" description="Chi tiết đơn hàng chỉ hiển thị cho đúng chủ tài khoản." />
        <AgriContainer py={{ base: 36, md: 56 }}>
          <EmptyState tieuDe="Cần đăng nhập" moTa="Đăng nhập để xem trạng thái và thông tin đơn." hanhDong={<Button component={Link} href={`/dang-nhap?next=/don-hang/${donHangId}`}>Đăng nhập</Button>} />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) return <AgriContainer py={{ base: 40, md: 64 }}><AgriSkeleton soLuong={6} /></AgriContainer>;

  if (query.isError || !query.data) {
    return <AgriContainer py={{ base: 40, md: 64 }}><ErrorState tieuDe="Không tải được chi tiết đơn hàng" moTa="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc hệ thống đang tạm thời không phản hồi." onThuLai={() => void query.refetch()} /></AgriContainer>;
  }

  const order = query.data;

  const xacNhanHuy = () => {
    if (!order.coTheHuy || huyMutation.isPending) return;
    if (!window.confirm(`Hủy đơn ${order.maDonHang}? Thao tác này không thể hoàn tác.`)) return;
    huyMutation.mutate();
  };

  const tongMuc = order.donNhaCungCap.reduce((tong, don) => tong + don.muc.length, 0);

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Chi tiết đơn hàng"
        title={`#${order.maDonHang}`}
        description={`Đặt lúc ${dinhDangNgay(order.createdAt)} · Cập nhật gần nhất ${dinhDangNgay(order.updatedAt)}`}
        meta={<Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">{nhanTrangThaiDonHang(order.trangThai)}</Badge>}
        actions={
          <>
            <Button component={Link} href="/don-hang" variant="default" leftSection={<IconArrowLeft size={16} />}>Danh sách đơn</Button>
            <Button variant="default" leftSection={<IconRefresh size={16} />} loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button>
          </>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
          {huyMutation.isError ? (
            <Alert color="red" title="Không thể hủy đơn">
              {huyMutation.error instanceof Error ? huyMutation.error.message : 'Hệ thống chưa thể hủy đơn ở trạng thái hiện tại.'}
            </Alert>
          ) : null}

          <StatGrid
            items={[
              { label: 'Trạng thái', value: nhanTrangThaiDonHang(order.trangThai), icon: <IconShoppingBag size={20} /> },
              { label: 'Nhà cung cấp', value: order.donNhaCungCap.length, description: `${tongMuc} mặt hàng` },
              { label: 'Tổng thanh toán', value: `${dinhDangGia(order.tongTien)} ₫`, description: 'Snapshot giá đã lưu trên đơn' },
            ]}
          />

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            <Paper withBorder className="agri-surface agri-price-summary" p="xl">
              <Stack gap="md">
                <Group gap="sm"><ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconLeaf size={20} /></ThemeIcon><Title order={2} fz="lg">Tóm tắt thanh toán</Title></Group>
                <Group justify="space-between"><Text c="dimmed">Tạm tính hàng hóa</Text><Text fw={750}>{dinhDangGia(order.tamTinhHangHoa)} ₫</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Phí vận chuyển</Text><Text fw={750}>{order.phiVanChuyen === 0 ? 'Miễn phí' : `${dinhDangGia(order.phiVanChuyen)} ₫`}</Text></Group>
                {order.giamKhuyenMai > 0 ? (
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={1}><Text c="dimmed">Khuyến mãi</Text>{order.maKhuyenMai ? <Text size="xs" fw={750} c="agrimarket.7">{order.maKhuyenMai}</Text> : null}</Stack>
                    <Text fw={800} c="green.8">-{dinhDangGia(order.giamKhuyenMai)} ₫</Text>
                  </Group>
                ) : null}
                {order.giaTriDiemDaDung > 0 ? (
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={1}><Text c="dimmed">Điểm thưởng</Text><Text size="xs" c="dimmed">{order.diemDaDung} điểm</Text></Stack>
                    <Text fw={800} c="green.8">-{dinhDangGia(order.giaTriDiemDaDung)} ₫</Text>
                  </Group>
                ) : null}
                <Divider />
                <Group justify="space-between" align="flex-end" gap="lg" wrap="nowrap"><Text fw={900}>Tổng thanh toán</Text><Text fw={900} fz={26} c="agrimarket.8">{dinhDangGia(order.tongTien)} ₫</Text></Group>
                {order.coTheHuy ? (
                  <Button color="red" variant="light" loading={huyMutation.isPending} onClick={xacNhanHuy}>Hủy đơn hàng</Button>
                ) : order.lyDoKhongTheHuy ? (
                  <Text size="sm" c="dimmed">{order.lyDoKhongTheHuy}</Text>
                ) : null}
              </Stack>
            </Paper>

            <Paper withBorder className="agri-surface" p="xl">
              <Stack gap="md">
                <Group gap="sm"><ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconTruckDelivery size={20} /></ThemeIcon><Title order={2} fz="lg">Tiến trình đơn hàng</Title></Group>
                <Text size="sm" c="dimmed">Các mốc phản ánh trạng thái hiện tại của đơn hàng trên AgriMarket.</Text>
                <Stack gap="sm">
                  {order.tienTrinh.map((moc, index) => (
                    <Group key={`${moc.trangThai}-${index}`} justify="space-between" wrap="nowrap" gap="md">
                      <Group gap="sm" wrap="nowrap">
                        <Box
                          w={30}
                          h={30}
                          bg={moc.hienTai ? PRIMARY : moc.daDat ? '#E7F5EC' : '#F3F5F4'}
                          c={moc.hienTai ? 'white' : moc.daDat ? 'agrimarket.7' : 'gray.6'}
                          style={{ borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0 }}
                        >
                          {moc.daDat || moc.hienTai ? <IconCheck size={15} /> : <Text size="xs">{index + 1}</Text>}
                        </Box>
                        <Text fw={moc.hienTai ? 850 : 650}>{nhanTrangThaiDonHang(moc.trangThai)}</Text>
                      </Group>
                      <Text size="xs" c={moc.hienTai ? 'agrimarket.7' : moc.daDat ? 'green.8' : 'dimmed'} fw={moc.hienTai ? 800 : 500}>{moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã đạt' : 'Chưa tới'}</Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </SimpleGrid>

          {order.diaChiGiaoHang ? (
            <Paper withBorder className="agri-surface" p="xl">
              <Group align="flex-start" gap="md" wrap="nowrap">
                <ThemeIcon size={46} radius="lg" variant="light" color="agrimarket"><IconMapPin size={22} /></ThemeIcon>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={700}>ĐỊA CHỈ GIAO HÀNG</Text>
                  <Text fw={850}>{order.diaChiGiaoHang.tenNguoiNhan}</Text>
                  <Text size="sm">{order.diaChiGiaoHang.soDienThoai}</Text>
                  <Text size="sm" c="dimmed" lh={1.55}>{order.diaChiGiaoHang.diaChi}</Text>
                </Stack>
              </Group>
            </Paper>
          ) : null}

          <Box>
            <SectionHeading eyebrow="Chi tiết hàng hóa" title="Sản phẩm trong đơn" description="Mặt hàng được nhóm theo nhà cung cấp để phản ánh cấu trúc fulfillment của đơn." />
            <Stack gap="lg" mt="xl">
              {order.donNhaCungCap.map((suborder) => (
                <Card key={suborder.id} withBorder className="agri-surface" padding="xl">
                  <Stack gap="lg">
                    <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                      <Stack gap={3}><Text size="xs" c="dimmed" fw={700}>NHÀ CUNG CẤP</Text><Text fw={900} fz="lg">{suborder.tenNhaCungCap}</Text><Text size="sm" c="dimmed">{suborder.maDon}</Text></Stack>
                      <Stack gap={4} align="flex-end"><Badge variant="light" color={mauTrangThai(suborder.trangThai)}>{nhanTrangThaiDonHang(suborder.trangThai)}</Badge><Text fw={900} c="agrimarket.8">{dinhDangGia(suborder.tamTinh)} ₫</Text></Stack>
                    </Group>
                    <Divider />
                    <Stack gap="md">
                      {suborder.muc.map((item) => (
                        <Paper key={item.id} withBorder className="agri-surface" p="md">
                          <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
                            <Stack gap={5} style={{ flex: 1, minWidth: 230 }}>
                              <Text component={Link} href={`/san-pham/${item.sanPhamId}`} fw={850} c="dark.9" style={{ textDecoration: 'none' }}>{item.tenSanPham}</Text>
                              <Text size="sm" c="dimmed">{item.khoiLuong} {item.donVi} · SL {item.soLuong} · SKU {item.sku}</Text>
                              <Text size="xs" c="dimmed">{item.tenTrangTrai}</Text>
                              <Group gap="xs" mt={4}>
                                <Button component={Link} href={`/san-pham/${item.sanPhamId}`} variant="light" color="agrimarket" size="xs">Xem sản phẩm</Button>
                                <Button component={Link} href={`/khieu-nai/tao?mucDonHangId=${encodeURIComponent(item.id)}`} variant="light" color="orange" size="xs">Yêu cầu hỗ trợ</Button>
                              </Group>
                              <DanhGiaMucDonHang mucDonHangId={item.id} />
                            </Stack>
                            <Stack gap={2} align="flex-end"><Text size="sm" c="dimmed">{dinhDangGia(item.donGia)} ₫ × {item.soLuong}</Text><Text fw={900} fz="lg">{dinhDangGia(item.thanhTien)} ₫</Text></Stack>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>

          <BusinessNote>
            Pricing trên màn này là snapshot đã lưu cùng Order. Vì vậy lịch sử đơn không bị thay đổi khi giá sản phẩm, phí ship, voucher hoặc tỷ lệ quy đổi điểm thay đổi về sau.
          </BusinessNote>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
