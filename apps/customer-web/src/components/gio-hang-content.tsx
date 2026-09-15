'use client';

import {
  dinhDangGiaVND,
  hienThiGoiQuyCach,
  hienThiTonKhaDung,
} from '@agrimarket/api-client';
import {
  ActionIcon,
  Alert,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Group,
  Image,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuildingStore,
  IconCheck,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconShoppingCart,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  capNhatMucGioHangKhach,
  type GioHangKhach,
  layGioHangKhach,
  xoaMucGioHangKhach,
} from '@/lib/api-gio-hang';
import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;
const ANH_SAN_PHAM_MAC_DINH = '/images/product-placeholder.svg';

type NhomNhaCungCap = {
  id: string;
  ten: string;
  muc: GioHangKhach['muc'];
};

type ThongBaoGioHang = {
  loai: 'success' | 'error';
  noiDung: string;
} | null;

function dinhDangGia(value: number): string {
  return `${dinhDangGiaVND(value)} ₫`;
}

function layThongDiepLoi(error: unknown, macDinh: string): string {
  if (typeof error === 'object' && error !== null) {
    const info = (error as { info?: unknown }).info;
    if (typeof info === 'object' && info !== null && 'message' in info) {
      const message = (info as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
      if (Array.isArray(message)) {
        const hopLe = message.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0,
        );
        if (hopLe.length > 0) return hopLe.join('; ');
      }
    }
    if (error instanceof Error && error.message.includes('đăng nhập')) return error.message;
  }
  return macDinh;
}

function laLoiVuotTon(noiDung: string): boolean {
  const chuanHoa = noiDung.toLocaleLowerCase('vi');
  return (
    chuanHoa.includes('vượt tồn') ||
    chuanHoa.includes('không còn đủ') ||
    chuanHoa.includes('kha dung')
  );
}

function laLoiKhongConBan(noiDung: string): boolean {
  const chuanHoa = noiDung.toLocaleLowerCase('vi');
  return chuanHoa.includes('không còn được bán') || chuanHoa.includes('không tìm thấy');
}

function KhungXuongGioHang() {
  return (
    <Box className="agrimarket-cart-layout" aria-label="Đang tải giỏ hàng">
      <Stack gap="md">
        {[0, 1].map((item) => (
          <Paper key={item} withBorder radius="md" p="lg">
            <Skeleton height={20} width="35%" radius="sm" />
            <Divider my="md" />
            <Group align="flex-start" wrap="nowrap">
              <Skeleton height={110} width={110} radius="md" />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Skeleton height={18} width="60%" />
                <Skeleton height={14} width="38%" />
                <Skeleton height={14} width="28%" />
                <Skeleton height={22} width="25%" />
              </Stack>
            </Group>
          </Paper>
        ))}
      </Stack>
      <Paper withBorder radius="md" p="xl" className="agrimarket-cart-summary">
        <Stack gap="md">
          <Skeleton height={18} width="45%" />
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton height={36} width="70%" />
          <Skeleton height={44} />
        </Stack>
      </Paper>
    </Box>
  );
}

function DieuChinhSoLuong({
  tenSanPham,
  soLuong,
  soLuongToiDa,
  dangXuLy,
  onDoi,
}: {
  tenSanPham: string;
  soLuong: number;
  soLuongToiDa: number;
  dangXuLy: boolean;
  onDoi: (soLuongMoi: number) => void;
}) {
  const toiDa = Math.max(1, Math.min(999, soLuongToiDa));
  const coTheGiam = soLuong > 1 && !dangXuLy;
  const coTheTang = soLuong < toiDa && !dangXuLy;

  return (
    <Group gap={0} align="center" wrap="nowrap" className="agrimarket-cart-quantity">
      <ActionIcon
        variant="default"
        size={34}
        radius={0}
        aria-label={`Giảm số lượng ${tenSanPham}`}
        disabled={!coTheGiam}
        loading={dangXuLy}
        onClick={() => {
          if (soLuong > 1) onDoi(soLuong - 1);
        }}
      >
        <IconMinus size={15} />
      </ActionIcon>

      <Text
        fw={700}
        fz="sm"
        ta="center"
        aria-live="polite"
        aria-label={`Số lượng ${tenSanPham}: ${soLuong}`}
        className="agrimarket-cart-quantity-value"
      >
        {soLuong}
      </Text>

      <ActionIcon
        variant="default"
        size={34}
        radius={0}
        aria-label={`Tăng số lượng ${tenSanPham}`}
        disabled={!coTheTang}
        loading={dangXuLy}
        onClick={() => {
          if (soLuong < toiDa) onDoi(soLuong + 1);
        }}
      >
        <IconPlus size={15} />
      </ActionIcon>
    </Group>
  );
}

function AnhSanPham({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  return (
    <Image
      src={src || ANH_SAN_PHAM_MAC_DINH}
      fallbackSrc={ANH_SAN_PHAM_MAC_DINH}
      alt={alt}
      className="agrimarket-cart-product-image"
      fit="cover"
      loading="lazy"
    />
  );
}

export function GioHangContent() {
  const queryClient = useQueryClient();
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [thongBao, setThongBao] = useState<ThongBaoGioHang>(null);
  const [mucDangCapNhat, setMucDangCapNhat] = useState<string | null>(null);
  const [mucDangXoa, setMucDangXoa] = useState<string | null>(null);

  const query = useQuery({
    queryKey: GIO_HANG_QUERY_KEY,
    queryFn: layGioHangKhach,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const capNhatMutation = useMutation({
    mutationFn: ({ id, soLuong }: { id: string; soLuong: number }) =>
      capNhatMucGioHangKhach(id, soLuong),
    onMutate: ({ id }) => {
      setMucDangCapNhat(id);
      setThongBao(null);
    },
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_QUERY_KEY, gioHang);
    },
    onError: (error) => {
      const goc = layThongDiepLoi(error, 'Không thể lưu thay đổi số lượng.');
      const noiDung = laLoiVuotTon(goc)
        ? 'Số lượng sản phẩm hiện không còn đủ. Giỏ hàng đã được cập nhật theo tồn kho hiện tại.'
        : laLoiKhongConBan(goc)
          ? 'Sản phẩm hiện không còn khả dụng. Giỏ hàng đã được cập nhật.'
          : goc;

      setThongBao({ loai: 'error', noiDung });
      void queryClient.invalidateQueries({ queryKey: GIO_HANG_QUERY_KEY });
    },
    onSettled: () => {
      setMucDangCapNhat(null);
    },
  });

  const xoaMutation = useMutation({
    mutationFn: (id: string) => xoaMucGioHangKhach(id),
    onMutate: (id) => {
      setMucDangXoa(id);
      setThongBao(null);
    },
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_QUERY_KEY, gioHang);
      setThongBao({ loai: 'success', noiDung: 'Đã xóa sản phẩm khỏi giỏ hàng.' });
    },
    onError: (error) => {
      const noiDung = layThongDiepLoi(
        error,
        'Không thể xóa sản phẩm. Vui lòng thử lại.',
      );
      setThongBao({ loai: 'error', noiDung });
      void queryClient.invalidateQueries({ queryKey: GIO_HANG_QUERY_KEY });
    },
    onSettled: () => {
      setMucDangXoa(null);
    },
  });

  const nhom = useMemo<NhomNhaCungCap[]>(() => {
    const values = new Map<string, NhomNhaCungCap>();

    for (const muc of query.data?.muc ?? []) {
      const supplier = muc.bienThe.sanPham.trangTrai.nhaCungCap;
      const current = values.get(supplier.id);

      if (current) current.muc.push(muc);
      else values.set(supplier.id, { id: supplier.id, ten: supplier.ten, muc: [muc] });
    }

    return [...values.values()];
  }, [query.data]);

  const danhSachMuc = query.data?.muc ?? [];

  const mucLoi = useMemo(
    () => danhSachMuc.filter((muc) => !muc.bienThe.coTheDatHang),
    [danhSachMuc],
  );

  const tongSoLuong = useMemo(
    () => danhSachMuc.reduce((tong, muc) => tong + muc.soLuong, 0),
    [danhSachMuc],
  );

  // Tạm tính trình bày = tổng giá hiệu lực server-side × số lượng.
  // Số tiền phải trả cuối cùng do bước thanh toán và khâu tạo đơn quyết định.
  const tamTinh = useMemo(
    () =>
      danhSachMuc.reduce(
        (tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong,
        0,
      ),
    [danhSachMuc],
  );

  // BẤT KỲ item coTheDatHang=false => toàn checkout chưa được phép tiếp tục.
  const choPhepThanhToan =
    danhSachMuc.length > 0 &&
    mucLoi.length === 0 &&
    !capNhatMutation.isPending &&
    !xoaMutation.isPending;

  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <Box className="agri-page agrimarket-cart-page">
        <AgriContainer py={{ base: 32, md: 48 }} maw={1320}>
          <AgriSkeleton soLuong={4} />
        </AgriContainer>
      </Box>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page agrimarket-cart-page">
        <AgriContainer py={{ base: 40, md: 64 }} maw={980}>
          <EmptyState
            tieuDe="Bạn chưa đăng nhập"
            moTa="Đăng nhập để đồng bộ giỏ hàng theo tài khoản của bạn trên mọi thiết bị."
            bieuTuong={<IconShoppingCart size={30} stroke={1.6} />}
            hanhDong={
              <Group gap="sm" justify="center" wrap="wrap">
                <Button
                  component={Link}
                  href="/dang-nhap?next=/gio-hang"
                  color="agrimarket"
                >
                  Đăng nhập
                </Button>
                <Button component={Link} href="/san-pham" variant="default">
                  Xem nông sản
                </Button>
              </Group>
            }
          />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) {
    return (
      <Box className="agri-page agrimarket-cart-page">
        <AgriContainer py={{ base: 28, md: 38 }} maw={1320}>
          <Stack gap="lg">
            <Skeleton height={32} width={220} />
            <KhungXuongGioHang />
          </Stack>
        </AgriContainer>
      </Box>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Box className="agri-page agrimarket-cart-page">
        <AgriContainer py={{ base: 40, md: 64 }} maw={980}>
          <ErrorState
            tieuDe="Không thể tải giỏ hàng."
            moTa="Phiên đăng nhập có thể đã hết hạn hoặc hệ thống đang tạm thời không phản hồi."
            onThuLai={() => void query.refetch()}
          />
        </AgriContainer>
      </Box>
    );
  }

  return (
    <Box className="agri-page agrimarket-cart-page">
      <AgriContainer py={{ base: 22, md: 30 }} maw={1320}>
        <Stack gap="lg">
          <Breadcrumbs fz="sm" aria-label="Điều hướng giỏ hàng">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              Giỏ hàng
            </Text>
          </Breadcrumbs>

          <Box
            className="agrimarket-cart-titlebar"
            style={{ justifyContent: 'flex-end' }}
          >
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconRefresh size={16} />}
                onClick={() => void query.refetch()}
                loading={query.isFetching}
              >
                Làm mới
              </Button>
              <Button component={Link} href="/san-pham" variant="default">
                Tiếp tục mua sắm
              </Button>
            </Group>
          </Box>

          {thongBao ? (
            <Alert
              color={thongBao.loai === 'success' ? 'green' : 'red'}
              title={
                thongBao.loai === 'success'
                  ? 'Đã cập nhật giỏ hàng'
                  : 'Không cập nhật được giỏ hàng'
              }
              icon={
                thongBao.loai === 'success' ? (
                  <IconCheck size={18} />
                ) : (
                  <IconAlertTriangle size={18} />
                )
              }
              withCloseButton
              onClose={() => setThongBao(null)}
            >
              {thongBao.noiDung}
            </Alert>
          ) : null}

          {danhSachMuc.length === 0 ? (
            <Paper withBorder radius="md" p={{ base: 'xl', md: 48 }}>
              <EmptyState
                tieuDe="Giỏ hàng của bạn đang trống"
                moTa="Khám phá nông sản sạch và thêm sản phẩm bạn yêu thích."
                bieuTuong={<IconShoppingCart size={30} stroke={1.6} />}
                hanhDong={
                  <Button component={Link} href="/san-pham" color="agrimarket">
                    Khám phá nông sản sạch
                  </Button>
                }
              />
            </Paper>
          ) : (
            <>
              {mucLoi.length > 0 ? (
                <Alert
                  color="orange"
                  title="Một số sản phẩm cần kiểm tra lại"
                  icon={<IconAlertTriangle size={18} />}
                >
                  {`Có ${mucLoi.length} sản phẩm cần xử lý trước khi thanh toán. Vui lòng điều chỉnh số lượng hoặc xóa sản phẩm không còn khả dụng.`}
                </Alert>
              ) : null}

              <Box className="agrimarket-cart-layout">
                <Stack gap="md" style={{ minWidth: 0 }}>
                  <Box className="agrimarket-cart-column-head" visibleFrom="md">
                    <Text size="xs" fw={700} c="dimmed">
                      SẢN PHẨM
                    </Text>
                    <Text size="xs" fw={700} c="dimmed" ta="center">
                      ĐƠN GIÁ
                    </Text>
                    <Text size="xs" fw={700} c="dimmed" ta="center">
                      SỐ LƯỢNG
                    </Text>
                    <Text size="xs" fw={700} c="dimmed" ta="right">
                      THÀNH TIỀN
                    </Text>
                    <Text size="xs" fw={700} c="dimmed" ta="center">
                      THAO TÁC
                    </Text>
                  </Box>

                  {nhom.map((supplier) => (
                    <Paper
                      key={supplier.id}
                      withBorder
                      radius="md"
                      className="agrimarket-cart-shop"
                    >
                      <Box className="agrimarket-cart-shop-head">
                        <Group gap="sm" wrap="nowrap">
                          <ThemeIcon
                            variant="light"
                            color="agrimarket"
                            size={34}
                            radius="xl"
                          >
                            <IconBuildingStore size={17} />
                          </ThemeIcon>

                          <Box style={{ minWidth: 0 }}>
                            <Text size="xs" c="dimmed">
                              Nhà cung cấp
                            </Text>
                            <Text fw={800} size="sm" lineClamp={1}>
                              {supplier.ten}
                            </Text>
                          </Box>
                        </Group>

                        <AgriBadge>{supplier.muc.length} mục</AgriBadge>
                      </Box>

                      {supplier.muc.map((muc, index) => {
                        const sanPham = muc.bienThe.sanPham;
                        const lineTotal =
                          muc.bienThe.giaHienTai * muc.soLuong;

                        const quyCach = hienThiGoiQuyCach({
                          khoiLuong: muc.bienThe.khoiLuong,
                          donVi: muc.bienThe.donVi,
                        });

                        const laFlashSale =
                          muc.bienThe.loaiGia === 'FLASH_SALE' &&
                          muc.bienThe.giaGoc > muc.bienThe.giaHienTai;

                        const khongKhaDung = !muc.bienThe.coTheDatHang;
                        const dangCapNhatMucNay =
                          mucDangCapNhat === muc.id || capNhatMutation.isPending;
                        const dangXoaMucNay =
                          mucDangXoa === muc.id || xoaMutation.isPending;

                        const toiDaDat = Math.max(
                          1,
                          Math.min(
                            999,
                            Math.floor(muc.bienThe.soLuongKhaDung),
                          ),
                        );

                        return (
                          <Box key={muc.id}>
                            {index > 0 ? <Divider /> : null}

                            <Box className="agrimarket-cart-item">
                              <Box className="agrimarket-cart-product-cell">
                                <Link
                                  href={`/san-pham/${sanPham.id}`}
                                  aria-label={`Xem ${sanPham.ten}`}
                                  className="agrimarket-cart-product-link"
                                >
                                  <AnhSanPham
                                    src={sanPham.anhBiaUrl}
                                    alt={sanPham.ten}
                                  />
                                </Link>

                                <Stack
                                  gap={5}
                                  className="agrimarket-cart-product-info"
                                >
                                  <Text
                                    component={Link}
                                    href={`/san-pham/${sanPham.id}`}
                                    fw={750}
                                    c="dark.9"
                                    className="agrimarket-cart-product-name"
                                    lineClamp={2}
                                  >
                                    {sanPham.ten}
                                  </Text>

                                  <Text size="xs" c="dimmed" lineClamp={1}>
                                    {sanPham.trangTrai.ten}
                                  </Text>

                                  <Text size="xs" c="dimmed">
                                    Phân loại: {quyCach}
                                  </Text>

                                  <Text
                                    size="xs"
                                    c={khongKhaDung ? 'red.7' : 'green.8'}
                                    fw={700}
                                  >
                                    {khongKhaDung
                                      ? muc.bienThe.soLuongKhaDung <= 0
                                        ? 'Tạm hết hàng'
                                        : 'Sản phẩm hiện không còn khả dụng với số lượng này.'
                                      : `Còn ${hienThiTonKhaDung(
                                          muc.bienThe.soLuongKhaDung,
                                        )}`}
                                  </Text>
                                </Stack>
                              </Box>

                              <Box className="agrimarket-cart-price-cell">
                                <Text
                                  className="agrimarket-cart-mobile-label"
                                  size="xs"
                                  c="dimmed"
                                >
                                  Đơn giá
                                </Text>

                                <Stack gap={3} align="center">
                                  <Text fw={800} size="sm">
                                    {dinhDangGia(muc.bienThe.giaHienTai)}
                                  </Text>

                                  {laFlashSale ? (
                                    <>
                                      <Text
                                        size="xs"
                                        c="dimmed"
                                        td="line-through"
                                      >
                                        {dinhDangGia(muc.bienThe.giaGoc)}
                                      </Text>
                                      <AgriBadge loai="canh-bao">
                                        Flash Sale
                                      </AgriBadge>
                                    </>
                                  ) : null}
                                </Stack>
                              </Box>

                              <Box className="agrimarket-cart-qty-cell">
                                <Text
                                  className="agrimarket-cart-mobile-label"
                                  size="xs"
                                  c="dimmed"
                                >
                                  Số lượng
                                </Text>

                                <DieuChinhSoLuong
                                  tenSanPham={sanPham.ten}
                                  soLuong={muc.soLuong}
                                  soLuongToiDa={
                                    khongKhaDung ? muc.soLuong : toiDaDat
                                  }
                                  dangXuLy={
                                    dangCapNhatMucNay || dangXoaMucNay
                                  }
                                  onDoi={(soLuongMoi) => {
                                    if (soLuongMoi === muc.soLuong) return;
                                    capNhatMutation.mutate({
                                      id: muc.id,
                                      soLuong: soLuongMoi,
                                    });
                                  }}
                                />
                              </Box>

                              <Box className="agrimarket-cart-total-cell">
                                <Text
                                  className="agrimarket-cart-mobile-label"
                                  size="xs"
                                  c="dimmed"
                                >
                                  Thành tiền
                                </Text>

                                <Text
                                  fw={900}
                                  c="agrimarket.8"
                                  className="agrimarket-cart-line-total"
                                >
                                  {dinhDangGia(lineTotal)}
                                </Text>
                              </Box>

                              <Box className="agrimarket-cart-action-cell">
                                <Button
                                  variant="subtle"
                                  color="red"
                                  size="compact-sm"
                                  leftSection={<IconTrash size={15} />}
                                  disabled={
                                    dangXoaMucNay || dangCapNhatMucNay
                                  }
                                  loading={mucDangXoa === muc.id}
                                  aria-label={`Xóa ${sanPham.ten} khỏi giỏ hàng`}
                                  onClick={() =>
                                    xoaMutation.mutate(muc.id)
                                  }
                                >
                                  Xóa
                                </Button>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Paper>
                  ))}
                </Stack>

                <Stack
                  gap="md"
                  className="agrimarket-cart-summary-wrap"
                  style={{ alignSelf: 'start' }}
                >
                  <Paper
                    withBorder
                    radius="md"
                    p={{ base: 'lg', md: 'xl' }}
                    className="agrimarket-cart-summary"
                  >
                    <Stack gap="md">
                      <Title order={2} fz="lg">
                        Tóm tắt đơn hàng
                      </Title>

                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">
                          Số lượng
                        </Text>
                        <Text fw={700}>{tongSoLuong}</Text>
                      </Group>

                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">
                          Tạm tính
                        </Text>
                        <Text fw={800}>
                          {dinhDangGia(tamTinh)}
                        </Text>
                      </Group>

                      <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="nowrap"
                        gap="md"
                      >
                        <Text c="dimmed" size="sm">
                          Phí giao hàng
                        </Text>
                        <Text size="sm" ta="right">
                          Tính ở bước thanh toán
                        </Text>
                      </Group>

                      <Divider />

                      <Group justify="space-between" align="flex-end">
                        <Text fw={700}>Tổng dự kiến</Text>
                        <Text
                          fw={900}
                          c="agrimarket.8"
                          className="agrimarket-cart-grand-total"
                        >
                          {dinhDangGia(tamTinh)}
                        </Text>
                      </Group>

                      <Button
                        component={Link}
                        href="/thanh-toan"
                        color="agrimarket"
                        size="md"
                        fullWidth
                        rightSection={<IconArrowRight size={17} />}
                        disabled={!choPhepThanhToan}
                      >
                        Tiến hành thanh toán
                      </Button>

                      {mucLoi.length > 0 ? (
                        <Text size="xs" c="orange.8" lh={1.6}>
                          Có {mucLoi.length} mục cần xử lý trước khi thanh toán.
                        </Text>
                      ) : null}
                    </Stack>
                  </Paper>
                </Stack>
              </Box>

              <Box hiddenFrom="md" className="agrimarket-cart-mobile-checkout">
                <Paper withBorder p="md" radius="md">
                  <Group
                    justify="space-between"
                    align="center"
                    wrap="nowrap"
                    gap="md"
                  >
                    <Stack gap={1} style={{ minWidth: 0 }}>
                      <Text size="xs" c="dimmed">
                        Tạm tính
                      </Text>
                      <Text
                        fw={900}
                        c="agrimarket.8"
                        lineClamp={1}
                      >
                        {dinhDangGia(tamTinh)}
                      </Text>
                    </Stack>

                    <Button
                      component={Link}
                      href="/thanh-toan"
                      color="agrimarket"
                      rightSection={<IconArrowRight size={16} />}
                      disabled={!choPhepThanhToan}
                      style={{ flexShrink: 0 }}
                    >
                      Thanh toán
                    </Button>
                  </Group>
                </Paper>
              </Box>
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
