'use client';

import {
  metaTrangThaiThanhToan,
  metaTrangThaiVanChuyen,
  nhanPhuongThucThanhToan,
} from '@agrimarket/api-client';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  CopyButton,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconMapPin,
  IconPackage,
  IconRefresh,
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

import { AgriSkeleton } from './agri-skeleton';
import { DanhGiaMucDonHang } from './danh-gia-muc-don-hang';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const PRIMARY = '#087A4B';
const GIAI_THICH_THANH_TOAN_LAI =
  'Thanh toán lại chỉ tạo phiên thanh toán mới cho đơn hiện tại, không tạo đơn mới.';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(value);
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function maDonHangHienThi(value: string): string {
  const ma = value.trim().toUpperCase();
  if (ma.length <= 24) return ma;

  const viTriGach = ma.indexOf('-');
  const tienTo = viTriGach >= 0 ? ma.slice(0, viTriGach + 1) : '';
  const thanMa = viTriGach >= 0 ? ma.slice(viTriGach + 1) : ma;

  return `${tienTo}${thanMa.slice(0, 8)}…${thanMa.slice(-6)}`;
}

function mauTrangThai(trangThai: string): string {
  if (trangThai === 'DA_HUY') return 'red';
  if (trangThai === 'HOAN_TIEN_MOT_PHAN' || trangThai === 'HOAN_TIEN_TOAN_BO') {
    return 'orange';
  }
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'green';
  if (trangThai === 'DANG_GIAO') return 'blue';
  if (trangThai === 'CHO_THANH_TOAN') return 'orange';
  return 'teal';
}

function mauTuTone(tone: string): string {
  if (tone === 'success') return 'green';
  if (tone === 'danger') return 'red';
  if (tone === 'warning') return 'orange';
  if (tone === 'info') return 'blue';
  return 'gray';
}

function nhanPhuongThucThanhToanKhach(value: string): string {
  if (value === 'MOCK' || value === 'LOCAL_DEMO') {
    return 'Thanh toán thử nghiệm';
  }
  if (value === 'VNPAY_SANDBOX') {
    return 'VNPay (môi trường thử nghiệm)';
  }
  return nhanPhuongThucThanhToan(value);
}

function lyDoKhongTheHuyThanThien(value: string | null): string | null {
  if (!value) return null;

  if (/payment|refund|inventory|reservation/i.test(value)) {
    return 'Đơn hàng hiện không thể hủy trực tiếp. Nếu cần thay đổi đơn, vui lòng gửi yêu cầu hỗ trợ.';
  }

  return value;
}

export function ChiTietDonHangContent({ donHangId }: { donHangId: string }) {
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
      void queryClient.invalidateQueries({
        queryKey: ['don-hang-khach', 'list'],
      });
      void queryClient.invalidateQueries({ queryKey });
      setXacNhanHuy(false);
    },
  });

  const thuLaiVnPayMutation = useMutation({
    mutationFn: async () => {
      const next = await taoThanhToanVnPayWebKhach(donHangId, crypto.randomUUID());

      if (next.donHangId !== donHangId) {
        throw new Error('Thanh toán không thuộc đơn hàng hiện tại.');
      }

      if (next.trangThai === 'PAID') return next;

      if (
        next.phuongThuc !== 'VNPAY_SANDBOX' ||
        (next.trangThai !== 'PENDING' && next.trangThai !== 'CREATED') ||
        !next.paymentUrl
      ) {
        throw new Error('Chưa nhận được đường dẫn VNPay hợp lệ. Vui lòng thử lại.');
      }

      window.location.assign(next.paymentUrl);
      return next;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: thanhToanDonHangKhachQueryKey(donHangId),
      });
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ['don-hang-khach', 'list'],
      });
    },
  });

  if (trangThaiXacThuc === 'dang-tai') {
    return <AgriSkeleton soLuong={6} />;
  }

  if (!daDangNhap) {
    return (
      <EmptyState
        tieuDe="Cần đăng nhập"
        moTa="Đăng nhập để xem trạng thái và thông tin đơn hàng."
        hanhDong={
          <Button component={Link} href={`/dang-nhap?next=/don-hang/${donHangId}`}>
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (query.isPending) {
    return <AgriSkeleton soLuong={6} />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        tieuDe="Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này."
        moTa="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc hệ thống đang tạm thời không phản hồi."
        onThuLai={() => void query.refetch()}
      />
    );
  }

  const order = query.data;
  const payment = paymentQuery.data;
  const giaoHang = giaoHangQuery.data;

  const coTheThanhToanVnPay =
    order.trangThai === 'CHO_THANH_TOAN' &&
    payment != null &&
    payment.phuongThuc === 'VNPAY_SANDBOX' &&
    (payment.trangThai === 'PENDING' ||
      payment.trangThai === 'CREATED' ||
      payment.trangThai === 'FAILED' ||
      payment.trangThai === 'CANCELLED') &&
    payment.datCho.trangThai === 'DANG_GIU';

  const nhanNutThanhToan =
    payment?.trangThai === 'FAILED' || payment?.trangThai === 'CANCELLED'
      ? 'Thanh toán lại'
      : 'Thanh toán ngay';

  const lyDoKhongTheThanhToanVnPay =
    order.trangThai === 'CHO_THANH_TOAN' &&
    payment?.phuongThuc === 'VNPAY_SANDBOX' &&
    payment.trangThai !== 'PAID' &&
    payment.datCho.trangThai !== 'DANG_GIU'
      ? payment.datCho.trangThai === 'HET_HAN'
        ? 'Phiên giữ hàng đã hết hạn nên đơn này không thể tiếp tục thanh toán. Bạn có thể hủy đơn và đặt lại để hệ thống giữ hàng mới.'
        : 'Hàng của đơn hiện không còn ở trạng thái giữ chỗ để thanh toán. Vui lòng kiểm tra lại đơn hoặc liên hệ hỗ trợ.'
      : null;

  const batDauHuy = () => {
    if (!order.coTheHuy || huyMutation.isPending) return;
    setXacNhanHuy(true);
  };

  const tongMuc = order.donNhaCungCap.reduce((tong, don) => tong + don.muc.length, 0);

  const lyDoKhongTheHuy = lyDoKhongTheHuyThanThien(order.lyDoKhongTheHuy);

  return (
    <Stack gap="lg">
      <Breadcrumbs fz="xs" aria-label="Điều hướng chi tiết đơn hàng">
        <Anchor component={Link} href="/" c="dimmed">
          Trang chủ
        </Anchor>
        <Anchor component={Link} href="/don-hang" c="dimmed">
          Đơn hàng của tôi
        </Anchor>
        <Text c="dark.8" fw={700}>
          Chi tiết đơn
        </Text>
      </Breadcrumbs>

      {/* Header compact: trang đã nằm trong KhungTaiKhoan nên không lồng PageHeader/Container lần nữa. */}
      <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Stack gap={5} style={{ minWidth: 0 }}>
              <Title order={2} fz={{ base: 22, md: 28 }} fw={900}>
                Chi tiết đơn hàng
              </Title>

              <Group gap={6} wrap="nowrap">
                <Text
                  size="sm"
                  fw={850}
                  title={`Đơn hàng ${order.maDonHang}`}
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {maDonHangHienThi(order.maDonHang)}
                </Text>

                <CopyButton value={order.maDonHang} timeout={1500}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép mã đơn đầy đủ'} withArrow>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                        aria-label="Sao chép mã đơn hàng"
                      >
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>

              <Text size="xs" c="dimmed">
                Đặt lúc {dinhDangNgay(order.createdAt)}
              </Text>
            </Stack>

            <Stack gap={6} align="flex-end">
              <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg" radius="sm">
                {nhanTrangThaiDonHang(order.trangThai)}
              </Badge>

              <Text fw={900} fz={26} c="agrimarket.8">
                {dinhDangGia(order.tongTien)} ₫
              </Text>
            </Stack>
          </Group>

          <Divider />

          <Group justify="space-between" gap="md" wrap="wrap">
            <Group gap="lg" wrap="wrap">
              <Text size="sm">
                <Text span c="dimmed">
                  Sản phẩm:{' '}
                </Text>
                <Text span fw={800}>
                  {tongMuc.toLocaleString('vi-VN')}
                </Text>
              </Text>

              <Text size="sm">
                <Text span c="dimmed">
                  Nhà cung cấp:{' '}
                </Text>
                <Text span fw={800}>
                  {order.donNhaCungCap.length.toLocaleString('vi-VN')}
                </Text>
              </Text>
            </Group>

            <Group gap="xs">
              {coTheThanhToanVnPay ? (
                <Button
                  size="xs"
                  color="agrimarket"
                  leftSection={<IconCreditCard size={15} />}
                  loading={thuLaiVnPayMutation.isPending}
                  onClick={() => thuLaiVnPayMutation.mutate()}
                >
                  {nhanNutThanhToan}
                </Button>
              ) : null}

              <Button
                component={Link}
                href="/don-hang"
                variant="default"
                size="xs"
                leftSection={<IconArrowLeft size={15} />}
              >
                Quay lại
              </Button>

              <Button
                variant="subtle"
                size="xs"
                color="agrimarket"
                leftSection={<IconRefresh size={15} />}
                loading={query.isFetching}
                onClick={() => {
                  void query.refetch();
                  void paymentQuery.refetch();
                  void giaoHangQuery.refetch();
                }}
              >
                Làm mới
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>

      {huyMutation.isError ? (
        <Alert color="red" title="Không thể hủy đơn">
          {huyMutation.error instanceof Error
            ? huyMutation.error.message
            : 'Hệ thống chưa thể hủy đơn ở trạng thái hiện tại.'}
        </Alert>
      ) : null}

      {/* Nếu dữ liệu cũ từng bị lệch Order=CHO_THANH_TOAN nhưng Payment=PAID,
          backend v4 sẽ tự đồng bộ. Alert này chỉ là hàng rào UI khi cache chưa refresh. */}
      {payment?.trangThai === 'PAID' && order.trangThai === 'CHO_THANH_TOAN' ? (
        <Alert color="blue" title="Đang đồng bộ trạng thái đơn hàng">
          Thanh toán đã thành công. Hãy bấm Làm mới nếu trạng thái đơn chưa cập nhật sang “Đã xác
          nhận”.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* Cột trái: thứ khách quan tâm nhất - hàng đã mua + vận chuyển. */}
        <Stack gap="lg">
          <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="agrimarket">
                  <IconPackage size={20} />
                </ThemeIcon>
                <Stack gap={1}>
                  <Text fw={900} fz="lg">
                    Sản phẩm trong đơn
                  </Text>
                  <Text size="xs" c="dimmed">
                    Thông tin được lưu tại thời điểm bạn đặt hàng.
                  </Text>
                </Stack>
              </Group>

              <Stack gap="md">
                {order.donNhaCungCap.map((suborder) => (
                  <Paper key={suborder.id} withBorder radius="md" p="md" bg="gray.0">
                    <Stack gap="md">
                      <Group justify="space-between" align="center" gap="md" wrap="wrap">
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed">
                            Đơn từ
                          </Text>
                          <Text fw={850}>{suborder.tenNhaCungCap}</Text>
                          <Text
                            size="xs"
                            c="dimmed"
                            ff="monospace"
                            title={`Mã đơn nhà cung cấp ${suborder.maDon}`}
                          >
                            {suborder.maDon}
                          </Text>
                        </Stack>

                        <Badge variant="light" color={mauTrangThai(suborder.trangThai)} radius="sm">
                          {nhanTrangThaiDonHang(suborder.trangThai)}
                        </Badge>
                      </Group>

                      <Divider />

                      {suborder.muc.map((item) => (
                        <Paper key={item.id} withBorder radius="md" p="md" bg="white">
                          <Stack gap="sm">
                            <Group
                              justify="space-between"
                              align="flex-start"
                              gap="md"
                              wrap="nowrap"
                            >
                              <ThemeIcon
                                size={50}
                                radius="md"
                                variant="light"
                                color="agrimarket"
                                style={{ flex: '0 0 auto' }}
                              >
                                <IconPackage size={24} />
                              </ThemeIcon>

                              <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                  component={Link}
                                  href={`/san-pham/${item.sanPhamId}`}
                                  fw={850}
                                  c="dark.9"
                                  lineClamp={2}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {item.tenSanPham}
                                </Text>

                                <Text size="xs" c="dimmed">
                                  Trang trại {item.tenTrangTrai}
                                </Text>

                                <Text size="sm" c="dimmed">
                                  Quy cách {dinhDangSo(item.khoiLuong)} {item.donVi} · Số lượng{' '}
                                  {item.soLuong.toLocaleString('vi-VN')}
                                </Text>
                              </Stack>

                              <Stack gap={2} align="flex-end" style={{ flex: '0 0 auto' }}>
                                <Text size="xs" c="dimmed">
                                  {dinhDangGia(item.donGia)} ₫ ×{' '}
                                  {item.soLuong.toLocaleString('vi-VN')}
                                </Text>
                                <Text fw={900} fz="lg">
                                  {dinhDangGia(item.thanhTien)} ₫
                                </Text>
                              </Stack>
                            </Group>

                            <Group gap="xs" wrap="wrap">
                              <Button
                                component={Link}
                                href={`/san-pham/${item.sanPhamId}`}
                                variant="light"
                                color="agrimarket"
                                size="xs"
                              >
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

                            {item.phanBo.length > 0 ? (
                              <Stack gap="xs">
                                <Divider />
                                <Text size="xs" fw={800} c="dimmed">
                                  Nguồn gốc lô hàng
                                </Text>

                                {item.phanBo.map((allocation, index) => (
                                  <Group
                                    key={`${allocation.maLo}-${index}`}
                                    justify="space-between"
                                    align="center"
                                    gap="sm"
                                    wrap="wrap"
                                  >
                                    <Stack gap={1}>
                                      <Text size="sm" fw={700}>
                                        Lô {allocation.maLo}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        Số lượng từ lô: {dinhDangSo(allocation.soLuong)}
                                      </Text>
                                    </Stack>

                                    {allocation.maTruyXuat ? (
                                      <Button
                                        component={Link}
                                        href={`/truy-xuat?ma=${encodeURIComponent(allocation.maTruyXuat)}`}
                                        variant="light"
                                        color="agrimarket"
                                        size="xs"
                                      >
                                        Truy xuất nguồn gốc
                                      </Button>
                                    ) : (
                                      <Text size="xs" c="dimmed">
                                        Chưa có mã truy xuất công khai
                                      </Text>
                                    )}
                                  </Group>
                                ))}
                              </Stack>
                            ) : null}
                          </Stack>
                        </Paper>
                      ))}

                      <Group justify="flex-end">
                        <Text size="sm" c="dimmed">
                          Tạm tính nhóm:{' '}
                          <Text span fw={850} c="dark">
                            {dinhDangGia(suborder.tamTinh)} ₫
                          </Text>
                        </Text>
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Paper
            withBorder
            p={{ base: 'md', md: 'lg' }}
            radius="lg"
            className="agri-surface"
            id="giao-hang"
          >
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="agrimarket">
                  <IconTruckDelivery size={20} />
                </ThemeIcon>
                <Text fw={900} fz="lg">
                  Giao hàng
                </Text>
              </Group>

              {giaoHangQuery.isPending ? (
                <Stack gap="xs">
                  <Skeleton height={15} width="70%" />
                  <Skeleton height={15} width="48%" />
                </Stack>
              ) : giaoHangQuery.isError || !giaoHang ? (
                <Alert color="yellow" title="Chưa tải được thông tin giao hàng">
                  <Group justify="space-between" gap="sm" wrap="wrap">
                    <Text size="sm">Vui lòng thử lại sau ít phút.</Text>
                    <Button
                      variant="light"
                      size="xs"
                      loading={giaoHangQuery.isFetching}
                      onClick={() => void giaoHangQuery.refetch()}
                    >
                      Thử lại
                    </Button>
                  </Group>
                </Alert>
              ) : giaoHang.vanChuyen.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Đơn hàng đang được xử lý và chưa bàn giao cho đơn vị vận chuyển.
                </Text>
              ) : (
                <Stack gap="md">
                  {giaoHang.vanChuyen.map((vanDon) => (
                    <Paper key={vanDon.id} withBorder radius="md" p="md" bg="gray.0">
                      <Stack gap="sm">
                        <Group justify="space-between" gap="md" wrap="wrap">
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed">
                              Mã vận đơn
                            </Text>
                            <Text fw={850}>{vanDon.maVanDon}</Text>
                            <Text size="xs" c="dimmed">
                              {vanDon.tenNhaCungCap}
                            </Text>
                          </Stack>

                          <Badge
                            variant="light"
                            color={mauTuTone(metaTrangThaiVanChuyen(vanDon.trangThai).tone)}
                          >
                            {metaTrangThaiVanChuyen(vanDon.trangThai).label}
                          </Badge>
                        </Group>

                        {vanDon.suKien.length > 0 ? (
                          <>
                            <Divider />
                            <Stack gap="sm">
                              {vanDon.suKien.map((suKien) => (
                                <Group
                                  key={suKien.id}
                                  justify="space-between"
                                  align="flex-start"
                                  gap="sm"
                                  wrap="wrap"
                                >
                                  <Stack gap={1}>
                                    <Text size="sm" fw={750}>
                                      {metaTrangThaiVanChuyen(suKien.trangThai).label}
                                    </Text>
                                    {suKien.moTa ? (
                                      <Text size="xs" c="dimmed">
                                        {suKien.moTa}
                                      </Text>
                                    ) : null}
                                    {suKien.viTri ? (
                                      <Text size="xs" c="dimmed">
                                        {suKien.viTri}
                                      </Text>
                                    ) : null}
                                  </Stack>

                                  <Text size="xs" c="dimmed">
                                    {dinhDangNgay(suKien.thoiGian)}
                                  </Text>
                                </Group>
                              ))}
                            </Stack>
                          </>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>

        {/* Cột phải: tiền, địa chỉ, payment và tiến trình. */}
        <Stack gap="lg">
          <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
            <Stack gap="sm">
              <Text fw={900} fz="lg">
                Tóm tắt thanh toán
              </Text>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Tạm tính hàng hóa
                </Text>
                <Text size="sm" fw={750}>
                  {dinhDangGia(order.tamTinhHangHoa)} ₫
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Phí vận chuyển
                </Text>
                <Text size="sm" fw={750}>
                  {order.phiVanChuyen === 0 ? 'Miễn phí' : `${dinhDangGia(order.phiVanChuyen)} ₫`}
                </Text>
              </Group>

              {order.giamKhuyenMai > 0 ? (
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={1}>
                    <Text size="sm" c="dimmed">
                      Khuyến mãi
                    </Text>
                    {order.maKhuyenMai ? (
                      <Text size="xs" c="agrimarket.7" fw={750}>
                        {order.maKhuyenMai}
                      </Text>
                    ) : null}
                  </Stack>
                  <Text size="sm" fw={800} c="green.8">
                    -{dinhDangGia(order.giamKhuyenMai)} ₫
                  </Text>
                </Group>
              ) : null}

              {order.giaTriDiemDaDung > 0 ? (
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={1}>
                    <Text size="sm" c="dimmed">
                      Điểm thưởng
                    </Text>
                    <Text size="xs" c="dimmed">
                      {order.diemDaDung.toLocaleString('vi-VN')} điểm
                    </Text>
                  </Stack>
                  <Text size="sm" fw={800} c="green.8">
                    -{dinhDangGia(order.giaTriDiemDaDung)} ₫
                  </Text>
                </Group>
              ) : null}

              <Divider />

              <Group justify="space-between" align="flex-end" gap="md">
                <Text fw={900}>Tổng thanh toán</Text>
                <Text fw={900} fz={26} c="agrimarket.8">
                  {dinhDangGia(order.tongTien)} ₫
                </Text>
              </Group>

              {order.coTheHuy && !xacNhanHuy ? (
                <Button
                  color="red"
                  variant="light"
                  loading={huyMutation.isPending}
                  onClick={batDauHuy}
                >
                  Hủy đơn hàng
                </Button>
              ) : null}

              {xacNhanHuy && order.coTheHuy ? (
                <Alert color="red" title="Bạn có chắc muốn hủy đơn này?">
                  <Stack gap="sm">
                    <Text size="sm">Hệ thống sẽ kiểm tra lại trạng thái đơn trước khi hủy.</Text>
                    <Group gap="sm">
                      <Button
                        variant="default"
                        size="xs"
                        disabled={huyMutation.isPending}
                        onClick={() => setXacNhanHuy(false)}
                      >
                        Giữ đơn
                      </Button>
                      <Button
                        color="red"
                        size="xs"
                        loading={huyMutation.isPending}
                        onClick={() => huyMutation.mutate()}
                      >
                        Xác nhận hủy
                      </Button>
                    </Group>
                  </Stack>
                </Alert>
              ) : null}

              {!order.coTheHuy && lyDoKhongTheHuy ? (
                <Text size="xs" c="dimmed">
                  {lyDoKhongTheHuy}
                </Text>
              ) : null}
            </Stack>
          </Paper>

          <Paper
            id="thanh-toan"
            withBorder
            p={{ base: 'md', md: 'lg' }}
            radius="lg"
            className="agri-surface"
          >
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="agrimarket">
                  <IconCreditCard size={20} />
                </ThemeIcon>
                <Text fw={900} fz="lg">
                  Thanh toán
                </Text>
              </Group>

              {paymentQuery.isPending ? (
                <Stack gap="xs">
                  <Skeleton height={15} width="65%" />
                  <Skeleton height={15} width="45%" />
                  <Skeleton height={15} width="55%" />
                </Stack>
              ) : paymentQuery.isError || !payment ? (
                <Alert color="yellow" title="Chưa tải được thông tin thanh toán">
                  <Group justify="space-between" gap="sm" wrap="wrap">
                    <Text size="sm">Vui lòng thử lại sau ít phút.</Text>
                    <Button
                      variant="light"
                      size="xs"
                      loading={paymentQuery.isFetching}
                      onClick={() => void paymentQuery.refetch()}
                    >
                      Thử lại
                    </Button>
                  </Group>
                </Alert>
              ) : (
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">
                        Phương thức
                      </Text>
                      <Text fw={800}>{nhanPhuongThucThanhToanKhach(payment.phuongThuc)}</Text>
                    </Stack>

                    <Badge
                      variant="light"
                      color={mauTuTone(metaTrangThaiThanhToan(payment.trangThai).tone)}
                      radius="sm"
                    >
                      {metaTrangThaiThanhToan(payment.trangThai).label}
                    </Badge>
                  </Group>

                  <Divider />

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Số tiền
                    </Text>
                    <Text size="sm" fw={850}>
                      {dinhDangGia(payment.soTien)} ₫
                    </Text>
                  </Group>

                  <Group justify="space-between" gap="sm" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Mã giao dịch
                    </Text>
                    <Text
                      size="xs"
                      fw={700}
                      style={{
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      }}
                    >
                      {payment.giaoDich.maGiaoDich}
                    </Text>
                  </Group>

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Thời gian
                    </Text>
                    <Text size="sm" fw={700}>
                      {dinhDangNgay(payment.giaoDich.thoiGian)}
                    </Text>
                  </Group>

                  {thuLaiVnPayMutation.isError ? (
                    <Alert color="red" title="Không thể mở thanh toán">
                      {thuLaiVnPayMutation.error instanceof Error
                        ? thuLaiVnPayMutation.error.message
                        : 'Không tạo được phiên thanh toán VNPay mới.'}
                    </Alert>
                  ) : null}

                  {lyDoKhongTheThanhToanVnPay ? (
                    <Alert color="orange" title="Phiên thanh toán không còn hiệu lực">
                      {lyDoKhongTheThanhToanVnPay}
                    </Alert>
                  ) : null}

                  {coTheThanhToanVnPay ? (
                    <Text size="xs" c="dimmed">
                      Thử lại thanh toán chỉ tạo phiên thanh toán mới cho đơn hiện tại, không tạo
                      đơn mới.
                    </Text>
                  ) : null}

                  {coTheThanhToanVnPay ? (
                    <Text size="xs" c="dimmed">
                      Thanh toán lại chỉ tạo phiên thanh toán mới cho đơn hiện tại, không tạo đơn
                      mới.
                    </Text>
                  ) : null}

                  {coTheThanhToanVnPay ? (
                    <Text size="xs" c="dimmed">
                      {GIAI_THICH_THANH_TOAN_LAI}
                    </Text>
                  ) : null}

                  <Group gap="sm" wrap="wrap">
                    {coTheThanhToanVnPay ? (
                      <Button
                        color="agrimarket"
                        size="sm"
                        loading={thuLaiVnPayMutation.isPending}
                        leftSection={<IconCreditCard size={16} />}
                        onClick={() => thuLaiVnPayMutation.mutate()}
                      >
                        {nhanNutThanhToan}
                      </Button>
                    ) : null}

                    <Button
                      component={Link}
                      href={`/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`}
                      variant="light"
                      color="agrimarket"
                      size="sm"
                    >
                      Xem kết quả thanh toán
                    </Button>
                  </Group>
                </Stack>
              )}
            </Stack>
          </Paper>

          {order.diaChiGiaoHang ? (
            <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
              <Group align="flex-start" gap="md" wrap="nowrap">
                <ThemeIcon size={42} radius="md" variant="light" color="agrimarket">
                  <IconMapPin size={20} />
                </ThemeIcon>

                <Stack gap={4}>
                  <Text fw={900} fz="lg">
                    Địa chỉ nhận hàng
                  </Text>
                  <Text fw={800}>{order.diaChiGiaoHang.tenNguoiNhan}</Text>
                  <Text size="sm">{order.diaChiGiaoHang.soDienThoai}</Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    {order.diaChiGiaoHang.diaChi}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ) : null}

          <Paper withBorder p={{ base: 'md', md: 'lg' }} radius="lg" className="agri-surface">
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="agrimarket">
                  <IconTruckDelivery size={20} />
                </ThemeIcon>
                <Text fw={900} fz="lg">
                  Tiến trình đơn hàng
                </Text>
              </Group>

              <Stack gap="sm">
                {order.tienTrinh.map((moc, index) => (
                  <Group
                    key={`${moc.trangThai}-${index}`}
                    justify="space-between"
                    gap="md"
                    wrap="nowrap"
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        w={30}
                        h={30}
                        bg={moc.hienTai ? PRIMARY : moc.daDat ? '#E7F5EC' : '#F3F5F4'}
                        c={moc.hienTai ? 'white' : moc.daDat ? 'agrimarket.7' : 'gray.6'}
                        style={{
                          borderRadius: 999,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {moc.daDat || moc.hienTai ? (
                          <IconCheck size={15} />
                        ) : (
                          <Text size="xs">{index + 1}</Text>
                        )}
                      </Box>

                      <Text fw={moc.hienTai ? 850 : 650}>
                        {nhanTrangThaiDonHang(moc.trangThai)}
                      </Text>
                    </Group>

                    <Text
                      size="xs"
                      c={moc.hienTai ? 'agrimarket.7' : moc.daDat ? 'green.8' : 'dimmed'}
                      fw={moc.hienTai ? 800 : 500}
                    >
                      {moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã qua' : 'Chưa tới'}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
