'use client';

import {
  metaTrangThaiThanhToan,
  metaTrangThaiVanChuyen,
  nhanPhuongThucThanhToan,
} from '@agrimarket/api-client';
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconCreditCard,
  IconLeaf,
  IconMapPin,
  IconRefresh,
  IconShoppingBag,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { huyDonHangKhach, layChiTietDonHangKhach, nhanTrangThaiDonHang } from '@/lib/api-don-hang';
import { giaoHangDonHangKhachQueryKey, layGiaoHangDonHangKhach } from '@/lib/api-giao-hang';
import {
  layThanhToanDonHangKhach,
  thanhToanDonHangKhachQueryKey,
  taoThanhToanVnPayWebKhach,
} from '@/lib/api-thanh-toan';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

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

// Số lượng cấp phát theo ngữ nghĩa tồn kho backend — không gắn đơn vị suy đoán.
function dinhDangSoLuongCap(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
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
  // Trạng thái từ AuthProvider (đã restore im lặng khi F5/tab mới).
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const queryClient = useQueryClient();
  const queryKey = ['don-hang-khach', 'detail', donHangId] as const;
  const [xacNhanHuy, setXacNhanHuy] = useState(false);

  const query = useQuery({
    queryKey,
    queryFn: () => layChiTietDonHangKhach(donHangId),
    enabled: daDangNhap,
    staleTime: 10_000,
  });

  // Payment + shipment là lifecycle riêng, đọc từ endpoint customer-authenticated riêng.
  // Không suy payment từ order status và ngược lại.
  const paymentQuery = useQuery({
    queryKey: thanhToanDonHangKhachQueryKey(donHangId),
    queryFn: () => layThanhToanDonHangKhach(donHangId),
    enabled: daDangNhap,
    staleTime: 10_000,
    retry: 1,
  });

  const giaoHangQuery = useQuery({
    queryKey: giaoHangDonHangKhachQueryKey(donHangId),
    queryFn: () => layGiaoHangDonHangKhach(donHangId),
    enabled: daDangNhap,
    staleTime: 10_000,
    retry: 1,
  });

  const huyMutation = useMutation({
    mutationFn: () => huyDonHangKhach(donHangId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      void queryClient.invalidateQueries({ queryKey: ['don-hang-khach', 'list'] });
      void queryClient.invalidateQueries({ queryKey });
      setXacNhanHuy(false);
    },
  });

  const thuLaiVnPayMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: thanhToanDonHangKhachQueryKey(donHangId) });
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  // Đang xác định phiên (restore bằng refresh cookie): hiện skeleton thay
  // vì nháy màn "Đăng nhập" rồi đổi sang nội dung.
  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <Box className="agri-page">
        <AgriContainer py={{ base: 36, md: 56 }}>
          <AgriSkeleton soLuong={6} />
        </AgriContainer>
      </Box>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Chi tiết đơn hàng"
          title="Đăng nhập để xem đơn hàng"
          description="Chi tiết đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
          meta={
            <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng chi tiết đơn hàng">
              <Anchor component={Link} href="/" c="dimmed">
                Trang chủ
              </Anchor>
              <Anchor component={Link} href="/don-hang" c="dimmed">
                Đơn hàng của tôi
              </Anchor>
              <Text c="dark.8" fw={700}>
                Chi tiết
              </Text>
            </Breadcrumbs>
          }
        />
        <AgriContainer py={{ base: 36, md: 56 }}>
          <EmptyState tieuDe="Cần đăng nhập" moTa="Đăng nhập để xem trạng thái và thông tin đơn." hanhDong={<Button component={Link} href={`/dang-nhap?next=/don-hang/${donHangId}`}>Đăng nhập</Button>} />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) return <AgriContainer py={{ base: 40, md: 64 }}><AgriSkeleton soLuong={6} /></AgriContainer>;

  if (query.isError || !query.data) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Chi tiết đơn hàng"
          title="Đơn hàng"
          description="Chi tiết, tiến trình và thao tác hủy đơn hàng AgriMarket."
          meta={
            <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng chi tiết đơn hàng">
              <Anchor component={Link} href="/" c="dimmed">
                Trang chủ
              </Anchor>
              <Anchor component={Link} href="/don-hang" c="dimmed">
                Đơn hàng của tôi
              </Anchor>
              <Text c="dark.8" fw={700}>
                Chi tiết
              </Text>
            </Breadcrumbs>
          }
        />
        <AgriContainer py={{ base: 40, md: 64 }}>
          <ErrorState
            tieuDe="Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này."
            moTa="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc hệ thống đang tạm thời không phản hồi."
            onThuLai={() => void query.refetch()}
          />
        </AgriContainer>
      </Box>
    );
  }

  const order = query.data;
  const payment = paymentQuery.data;
  const giaoHang = giaoHangQuery.data;

  // VNPay retry chỉ khi backend support + đúng lifecycle: VNPAY_SANDBOX, payment chưa thành công, reservation còn giữ hàng.
  const coTheThuLaiVnPay =
    payment != null &&
    payment.phuongThuc === 'VNPAY_SANDBOX' &&
    (payment.trangThai === 'PENDING' ||
      payment.trangThai === 'CREATED' ||
      payment.trangThai === 'FAILED' ||
      payment.trangThai === 'CANCELLED') &&
    payment.datCho.trangThai === 'DANG_GIU';

  const batDauHuy = () => {
    if (!order.coTheHuy || huyMutation.isPending) return;
    setXacNhanHuy(true);
  };

  const tongMuc = order.donNhaCungCap.reduce((tong, don) => tong + don.muc.length, 0);

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Chi tiết đơn hàng"
        title={`Đơn hàng ${order.maDonHang}`}
        description={`Đặt lúc ${dinhDangNgay(order.createdAt)} · Cập nhật gần nhất ${dinhDangNgay(order.updatedAt)}`}
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng chi tiết đơn hàng">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Anchor component={Link} href="/don-hang" c="dimmed">
              Đơn hàng của tôi
            </Anchor>
            <Text c="dark.8" fw={700}>
              {order.maDonHang}
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
          <Group gap="sm" wrap="wrap">
            <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">
              {nhanTrangThaiDonHang(order.trangThai)}
            </Badge>
            <Button component={Link} href="/don-hang" variant="default" size="xs" leftSection={<IconArrowLeft size={16} />}>
              Danh sách đơn
            </Button>
            <Button variant="default" size="xs" leftSection={<IconRefresh size={16} />} loading={query.isFetching} onClick={() => void query.refetch()}>
              Làm mới
            </Button>
            <Button component="a" href="#giao-hang" variant="light" size="xs" color="agrimarket" leftSection={<IconTruckDelivery size={16} />}>
              Theo dõi đơn hàng
            </Button>
          </Group>

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
                {/* Pricing snapshot persisted trên Order — không tính lại từ giá Product hiện tại. */}
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
                {order.coTheHuy && !xacNhanHuy ? (
                  <Button color="red" variant="light" loading={huyMutation.isPending} onClick={batDauHuy}>Hủy đơn hàng</Button>
                ) : null}
                {xacNhanHuy && order.coTheHuy ? (
                  <Alert color="red" title="Bạn có chắc muốn hủy đơn này?">
                    <Stack gap="sm">
                      <Text size="sm">
                        Nếu đơn đã sang giai đoạn xử lý hoặc giao hàng thì có thể không hủy được. Backend sẽ kiểm tra lại trạng thái,
                        thanh toán và tồn kho trước khi xác nhận.
                      </Text>
                      <Group gap="sm" wrap="wrap">
                        <Button variant="default" size="xs" disabled={huyMutation.isPending} onClick={() => setXacNhanHuy(false)}>
                          Giữ đơn
                        </Button>
                        <Button color="red" size="xs" loading={huyMutation.isPending} onClick={() => huyMutation.mutate()}>
                          Xác nhận hủy
                        </Button>
                      </Group>
                    </Stack>
                  </Alert>
                ) : null}
                {!order.coTheHuy && order.lyDoKhongTheHuy ? (
                  <Text size="sm" c="dimmed">{order.lyDoKhongTheHuy}</Text>
                ) : null}
              </Stack>
            </Paper>

            <Paper withBorder className="agri-surface" p="xl">
              <Stack gap="md">
                <Group gap="sm"><ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconTruckDelivery size={20} /></ThemeIcon><Title order={2} fz="lg">Tiến trình đơn hàng</Title></Group>
                <Text size="sm" c="dimmed">Các mốc phản ánh trạng thái hiện tại của đơn hàng trên AgriMarket.</Text>
                {/* Timeline render từ tienTrinh thật (daDat/hienTai). Không gắn thời gian giả cho các bước. */}
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

          {/* Payment lifecycle riêng — không suy từ order status. */}
          <Paper withBorder className="agri-surface" p="xl">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconCreditCard size={20} /></ThemeIcon>
                <Title order={2} fz="lg">Thanh toán</Title>
              </Group>
              {paymentQuery.isPending ? (
                <Stack gap="xs"><Skeleton height={16} width="60%" /><Skeleton height={16} width="45%" /><Skeleton height={16} width="55%" /></Stack>
              ) : paymentQuery.isError || !payment ? (
                <Alert color="yellow" title="Chưa đọc được trạng thái thanh toán">
                  <Stack gap="sm">
                    <Text size="sm">Không thể tải thông tin thanh toán của đơn này. Trạng thái đơn hàng không thay thế trạng thái thanh toán.</Text>
                    <Button variant="light" size="xs" w="fit-content" leftSection={<IconRefresh size={14} />} loading={paymentQuery.isFetching} onClick={() => void paymentQuery.refetch()}>
                      Thử lại
                    </Button>
                  </Stack>
                </Alert>
              ) : (
                <Stack gap="sm">
                  <Group justify="space-between" wrap="wrap" gap="md">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Phương thức</Text>
                      <Text fw={800}>{nhanPhuongThucThanhToan(payment.phuongThuc)}</Text>
                    </Stack>
                    <Badge color={metaTrangThaiThanhToan(payment.trangThai).tone === 'success' ? 'green' : metaTrangThaiThanhToan(payment.trangThai).tone === 'danger' ? 'red' : metaTrangThaiThanhToan(payment.trangThai).tone === 'warning' ? 'orange' : 'gray'} variant="light" size="lg">
                      {metaTrangThaiThanhToan(payment.trangThai).label}
                    </Badge>
                  </Group>
                  <Divider />
                  <Group justify="space-between"><Text size="sm" c="dimmed">Số tiền</Text><Text size="sm" fw={800}>{dinhDangGia(payment.soTien)} ₫</Text></Group>
                  <Group justify="space-between" wrap="wrap" gap="sm"><Text size="sm" c="dimmed">Mã giao dịch</Text><Text size="sm" fw={700}>{payment.giaoDich.maGiaoDich}</Text></Group>
                  <Group justify="space-between"><Text size="sm" c="dimmed">Thời gian</Text><Text size="sm" fw={700}>{dinhDangNgay(payment.giaoDich.thoiGian)}</Text></Group>
                  {thuLaiVnPayMutation.isError ? (
                    <Alert color="red" title="Không thể thanh toán lại">
                      {thuLaiVnPayMutation.error instanceof Error ? thuLaiVnPayMutation.error.message : 'Không tạo được Payment VNPay mới.'}
                    </Alert>
                  ) : null}
                  {coTheThuLaiVnPay ? (
                    <Group gap="sm" wrap="wrap">
                      <Button color="agrimarket" size="xs" loading={thuLaiVnPayMutation.isPending} leftSection={<IconRefresh size={14} />} onClick={() => thuLaiVnPayMutation.mutate()}>
                        Thanh toán lại
                      </Button>
                      <Button component={Link} href={`/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`} variant="light" size="xs">
                        Xem kết quả thanh toán
                      </Button>
                    </Group>
                  ) : (
                    <Button component={Link} href={`/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`} variant="light" size="xs" w="fit-content">
                      Xem kết quả thanh toán
                    </Button>
                  )}
                  <Text size="xs" c="dimmed">
                    Thanh toán lại dùng đúng đơn hiện tại, không tạo đơn mới. Backend tạo hoặc tái sử dụng Payment một cách an toàn theo idempotency.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Shipment lifecycle riêng — tracking thật từ giao-hang API, không fake GPS. */}
          <Paper withBorder className="agri-surface" p="xl" id="giao-hang">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconTruckDelivery size={20} /></ThemeIcon>
                <Title order={2} fz="lg">Giao hàng</Title>
              </Group>
              {giaoHangQuery.isPending ? (
                <Stack gap="xs"><Skeleton height={16} width="65%" /><Skeleton height={16} width="40%" /><Skeleton height={16} width="55%" /></Stack>
              ) : giaoHangQuery.isError || !giaoHang ? (
                <Alert color="yellow" title="Chưa đọc được vận chuyển">
                  <Stack gap="sm">
                    <Text size="sm">Không thể tải trạng thái giao hàng của đơn này.</Text>
                    <Button variant="light" size="xs" w="fit-content" leftSection={<IconRefresh size={14} />} loading={giaoHangQuery.isFetching} onClick={() => void giaoHangQuery.refetch()}>
                      Thử lại
                    </Button>
                  </Stack>
                </Alert>
              ) : giaoHang.vanChuyen.length === 0 ? (
                <Text size="sm" c="dimmed">Đơn hàng chưa được bàn giao cho đơn vị vận chuyển.</Text>
              ) : (
                <Stack gap="lg">
                  {giaoHang.vanChuyen.map((vanDon) => (
                    <Paper key={vanDon.id} withBorder className="agri-surface" p="md">
                      <Stack gap="sm">
                        <Group justify="space-between" wrap="wrap" gap="md">
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700}>MÃ VẬN ĐƠN</Text>
                            <Text fw={900}>{vanDon.maVanDon}</Text>
                            <Text size="sm" c="dimmed">{vanDon.tenNhaCungCap} · {vanDon.maDonNhaCungCap}</Text>
                          </Stack>
                          <Badge variant="light" color={metaTrangThaiVanChuyen(vanDon.trangThai).tone === 'success' ? 'green' : metaTrangThaiVanChuyen(vanDon.trangThai).tone === 'danger' ? 'red' : 'blue'}>
                            {metaTrangThaiVanChuyen(vanDon.trangThai).label}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">Tạo lúc {dinhDangNgay(vanDon.createdAt)} · Cập nhật {dinhDangNgay(vanDon.updatedAt)}</Text>
                        {vanDon.suKien.length > 0 ? (
                          <Stack gap="xs">
                            <Divider />
                            {vanDon.suKien.map((suKien) => (
                              <Group key={suKien.id} justify="space-between" wrap="wrap" gap="sm">
                                <Stack gap={1}>
                                  <Text size="sm" fw={700}>{metaTrangThaiVanChuyen(suKien.trangThai).label}</Text>
                                  {suKien.moTa ? <Text size="xs" c="dimmed">{suKien.moTa}</Text> : null}
                                  {suKien.viTri ? <Text size="xs" c="dimmed">{suKien.viTri}</Text> : null}
                                </Stack>
                                <Text size="xs" c="dimmed">{dinhDangNgay(suKien.thoiGian)}</Text>
                              </Group>
                            ))}
                          </Stack>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          {order.diaChiGiaoHang ? (
            <Paper withBorder className="agri-surface" p="xl">
              <Group align="flex-start" gap="md" wrap="nowrap">
                <ThemeIcon size={46} radius="lg" variant="light" color="agrimarket"><IconMapPin size={22} /></ThemeIcon>
                <Stack gap={4}>
                  {/* Địa chỉ snapshot lúc đặt — không thay bằng Address Book hiện tại. */}
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
                              {/* Giá/line-total snapshot từ MucDonHang — không fetch Product Detail, không tính lại. */}
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
                          {/* Exact batch allocation persisted trên OrderItem — hiển thị TẤT CẢ lô, không gộp, không suy latest batch. */}
                          {item.phanBo.length > 0 ? (
                            <Stack gap={6} mt="md">
                              <Divider />
                              <Text size="xs" c="dimmed" fw={700}>NGUỒN GỐC LÔ ĐÃ CẤP</Text>
                              {item.phanBo.map((allocation, index) => (
                                <Group key={`${allocation.maLo}-${index}`} justify="space-between" align="center" wrap="wrap" gap="sm">
                                  <Stack gap={1}>
                                    <Text size="sm" fw={700}>Lô {allocation.maLo}</Text>
                                    <Text size="xs" c="dimmed">Số lượng cấp: {dinhDangSoLuongCap(allocation.soLuong)}</Text>
                                  </Stack>
                                  {allocation.maTruyXuat ? (
                                    <Button component={Link} href={`/truy-xuat?ma=${encodeURIComponent(allocation.maTruyXuat)}`} variant="light" color="agrimarket" size="xs">
                                      Truy xuất nguồn gốc
                                    </Button>
                                  ) : (
                                    <Text size="xs" c="dimmed">Chưa có mã truy xuất công khai</Text>
                                  )}
                                </Group>
                              ))}
                            </Stack>
                          ) : null}
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
