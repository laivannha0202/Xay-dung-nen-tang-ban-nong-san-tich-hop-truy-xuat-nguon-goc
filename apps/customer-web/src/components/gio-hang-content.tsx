'use client';

// AUTO_FIX_GIO_HANG_MARKETPLACE_V1

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
  Card,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
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
import { anhDuPhongSanPham } from '@/lib/demo-images';
import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;

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
        const hopLe = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (hopLe.length > 0) return hopLe.join('; ');
      }
    }
    if (error instanceof Error && error.message.includes('đăng nhập')) return error.message;
  }
  return macDinh;
}

function laLoiVuotTon(noiDung: string): boolean {
  const chuanHoa = noiDung.toLocaleLowerCase('vi');
  return chuanHoa.includes('vượt tồn') || chuanHoa.includes('không còn đủ') || chuanHoa.includes('kha dung');
}

function laLoiKhongConBan(noiDung: string): boolean {
  const chuanHoa = noiDung.toLocaleLowerCase('vi');
  return chuanHoa.includes('không còn được bán') || chuanHoa.includes('không tìm thấy');
}

function KhungXuongGioHang() {
  return (
    <Stack gap="xl" aria-label="Đang tải giỏ hàng">
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing="md">
        {[0, 1, 2].map((item) => (
          <Paper key={item} withBorder p="lg" className="agri-surface">
            <Skeleton height={16} width="45%" radius="sm" />
            <Skeleton height={30} width="70%" radius="sm" mt="sm" />
            <Skeleton height={14} width="90%" radius="sm" mt="xs" />
          </Paper>
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl">
        <Stack gap="md" style={{ gridColumn: 'span 2' }}>
          {[0, 1].map((item) => (
            <Card key={item} withBorder padding="md" className="agri-surface">
              <Group align="flex-start" wrap="nowrap" gap="md">
                <Skeleton height={104} width={104} radius="md" style={{ flexShrink: 0 }} />
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Skeleton height={20} width="75%" radius="sm" />
                  <Skeleton height={14} width="45%" radius="sm" />
                  <Skeleton height={14} width="35%" radius="sm" />
                  <Skeleton height={22} width="30%" radius="sm" />
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
        <Paper withBorder p="xl" className="agri-surface">
          <Stack gap="md">
            <Skeleton height={16} width="55%" radius="sm" />
            <Skeleton height={34} width="80%" radius="sm" />
            <Skeleton height={14} width="100%" radius="sm" />
            <Skeleton height={44} radius="md" />
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
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
    <Group gap={8} align="center" wrap="nowrap">
      <ActionIcon
        variant="default"
        size={38}
        radius="md"
        aria-label={`Giảm số lượng ${tenSanPham}`}
        disabled={!coTheGiam}
        loading={dangXuLy}
        onClick={() => {
          if (soLuong > 1) onDoi(soLuong - 1);
        }}
      >
        <IconMinus size={16} />
      </ActionIcon>
      <Text
        fw={850}
        fz="md"
        ta="center"
        aria-live="polite"
        aria-label={`Số lượng ${tenSanPham}: ${soLuong}`}
        style={{ minWidth: 44 }}
      >
        {soLuong}
      </Text>
      <ActionIcon
        variant="default"
        size={38}
        radius="md"
        aria-label={`Tăng số lượng ${tenSanPham}`}
        disabled={!coTheTang}
        loading={dangXuLy}
        onClick={() => {
          if (soLuong < toiDa) onDoi(soLuong + 1);
        }}
      >
        <IconPlus size={16} />
      </ActionIcon>
    </Group>
  );
}

export function GioHangContent() {
  const queryClient = useQueryClient();
  // Trạng thái từ AuthProvider (đã restore im lặng khi F5/tab mới).
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
    mutationFn: ({ id, soLuong }: { id: string; soLuong: number }) => capNhatMucGioHangKhach(id, soLuong),
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
      const noiDung = layThongDiepLoi(error, 'Không thể xóa sản phẩm. Vui lòng thử lại.');
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
  const mucLoi = useMemo(() => danhSachMuc.filter((muc) => !muc.bienThe.coTheDatHang), [danhSachMuc]);
  const tongSoLuong = useMemo(
    () => danhSachMuc.reduce((tong, muc) => tong + muc.soLuong, 0),
    [danhSachMuc],
  );
  // Tạm tính trình bày = tổng giá hiệu lực server-side × số lượng.
  // Số tiền phải trả cuối cùng do bước thanh toán và khâu tạo đơn quyết định.
  const tamTinh = useMemo(
    () => danhSachMuc.reduce((tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong, 0),
    [danhSachMuc],
  );
  // Backend/Checkout semantics: BẤT KỲ item coTheDatHang=false → toàn checkout
  // chưa được phép tiếp tục. Không cho thanh toán phần còn lại của mixed cart.
  const choPhepThanhToan =
    danhSachMuc.length > 0 &&
    mucLoi.length === 0 &&
    !capNhatMutation.isPending &&
    !xoaMutation.isPending;

  // Đang xác định phiên (restore bằng refresh cookie): hiện skeleton thay
  // vì nháy màn "Đăng nhập" rồi đổi sang giỏ hàng.
  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <Box className="agri-page">
        <AgriContainer py={{ base: 36, md: 56 }} maw={880}>
          <AgriSkeleton soLuong={4} />
        </AgriContainer>
      </Box>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page">
        <AgriContainer py={{ base: 36, md: 56 }} maw={880}>
          <EmptyState
            tieuDe="Bạn chưa đăng nhập"
            moTa="Đăng nhập để đồng bộ giỏ hàng theo tài khoản của bạn trên mọi thiết bị."
            bieuTuong={<IconShoppingCart size={30} stroke={1.6} />}
            hanhDong={
              <Group gap="sm" justify="center" wrap="wrap">
                <Button component={Link} href="/dang-nhap?next=/gio-hang" color="agrimarket">
                  Đăng nhập
                </Button>
                <Button component={Link} href="/san-pham" variant="default">
                  Xem nông sản trước
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
      <Box className="agri-page market-cart-page">
        <AgriContainer py={{ base: 18, md: 28 }}>
          <Stack gap="md">
            <Skeleton height={74} radius="md" />
            <KhungXuongGioHang />
          </Stack>
        </AgriContainer>
      </Box>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Box className="agri-page">
        <AgriContainer py={{ base: 40, md: 64 }}>
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
    <Box className="agri-page market-cart-page">
      <AgriContainer py={{ base: 18, md: 28 }}>
        <Stack gap="lg">
          <Group
            className="market-cart-toolbar"
            justify="space-between"
            align="center"
            gap="md"
            wrap="wrap"
          >
            <Stack gap={5}>
              <Breadcrumbs fz="xs" aria-label="Điều hướng giỏ hàng">
                <Anchor component={Link} href="/" c="dimmed">
                  Trang chủ
                </Anchor>
                <Text c="dark.7" fw={650}>
                  Giỏ hàng
                </Text>
              </Breadcrumbs>
              <Group gap={8} align="baseline" wrap="wrap">
                <Title order={1} fz={{ base: 23, sm: 26 }} fw={850}>
                  Giỏ hàng
                </Title>
                {tongSoLuong > 0 ? (
                  <Text c="dimmed" fz="sm">
                    ({tongSoLuong} sản phẩm)
                  </Text>
                ) : null}
              </Group>
            </Stack>

            <Group gap="xs" wrap="wrap">
              <Button component={Link} href="/san-pham" variant="subtle" color="agrimarket">
                Tiếp tục mua sắm
              </Button>
              <ActionIcon
                variant="default"
                size={40}
                radius="md"
                aria-label="Tải lại giỏ hàng"
                onClick={() => void query.refetch()}
                loading={query.isFetching}
              >
                <IconRefresh size={17} />
              </ActionIcon>
            </Group>
          </Group>
          {thongBao ? (
            <Alert
              color={thongBao.loai === 'success' ? 'green' : 'red'}
              title={thongBao.loai === 'success' ? 'Đã cập nhật giỏ hàng' : 'Không cập nhật được giỏ hàng'}
              icon={thongBao.loai === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
              withCloseButton
              onClose={() => setThongBao(null)}
            >
              {thongBao.noiDung}
            </Alert>
          ) : null}

          {danhSachMuc.length === 0 ? (
            <EmptyState
              tieuDe="Giỏ hàng của bạn đang trống"
              moTa="Khám phá nông sản sạch và thêm sản phẩm bạn yêu thích."
              bieuTuong={<IconShoppingCart size={30} stroke={1.6} />}
              hanhDong={
                <Button component={Link} href="/san-pham" color="agrimarket">
                  Xem sản phẩm
                </Button>
              }
            />
          ) : (
            <>
              {mucLoi.length > 0 ? (
                <Alert color="orange" title="Một số sản phẩm cần kiểm tra lại" icon={<IconAlertTriangle size={18} />}>
                  {`Có ${mucLoi.length} sản phẩm cần xử lý trước khi thanh toán. Vui lòng điều chỉnh số lượng hoặc xóa sản phẩm không còn khả dụng.`}
                </Alert>
              ) : null}

              <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" verticalSpacing="md">
                <Stack gap="md" style={{ gridColumn: 'span 2' }}>
                  {nhom.map((supplier) => (
                    <Paper key={supplier.id} withBorder className="market-cart-store" p={0}>
                      <Stack gap={0}>
                        <Group
                          className="market-cart-store__head"
                          justify="space-between"
                          align="center"
                          gap="md"
                          wrap="wrap"
                        >
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon variant="light" color="agrimarket" size={34} radius="md">
                              <IconBuildingStore size={18} />
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={800} fz="sm" lineClamp={1}>
                                {supplier.ten}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {supplier.muc.length} sản phẩm
                              </Text>
                            </Stack>
                          </Group>
                        </Group>

                        <Divider />

                        <Stack gap={0}>
                          {supplier.muc.map((muc) => {
                            const sanPham = muc.bienThe.sanPham;
                            const lineTotal = muc.bienThe.giaHienTai * muc.soLuong;
                            const quyCach = hienThiGoiQuyCach({
                              khoiLuong: muc.bienThe.khoiLuong,
                              donVi: muc.bienThe.donVi,
                            });
                            const laFlashSale =
                              muc.bienThe.loaiGia === 'FLASH_SALE' && muc.bienThe.giaGoc > muc.bienThe.giaHienTai;
                            const khongKhaDung = !muc.bienThe.coTheDatHang;
                            const dangCapNhatMucNay = mucDangCapNhat === muc.id || capNhatMutation.isPending;
                            const dangXoaMucNay = mucDangXoa === muc.id || xoaMutation.isPending;
                            const toiDaDat = Math.max(
                              1,
                              Math.min(999, Math.floor(muc.bienThe.soLuongKhaDung)),
                            );

                            return (
                              <Card key={muc.id} className="market-cart-item" padding="md" radius={0}>
                                <Group align="flex-start" wrap="nowrap" gap="md" style={{ minWidth: 0 }}>
                                  <Link
                                    href={`/san-pham/${sanPham.id}`}
                                    aria-label={`Xem ${sanPham.ten}`}
                                    style={{ flexShrink: 0 }}
                                  >
                                    <Image
                                      src={sanPham.anhBiaUrl || anhDuPhongSanPham(sanPham.ten)}
                                      alt={sanPham.ten}
                                      w={{ base: 92, sm: 108 }}
                                      h={{ base: 92, sm: 108 }}
                                      radius="md"
                                      fit="cover"
                                      loading="lazy"
                                      fallbackSrc={anhDuPhongSanPham(sanPham.ten)}
                                      className="market-cart-item__image"
                                    />
                                  </Link>

                                  <Stack gap={5} style={{ minWidth: 0, flex: 1 }}>
                                    <Text
                                      component={Link}
                                      href={`/san-pham/${sanPham.id}`}
                                      fw={850}
                                      fz="md"
                                      c="dark.9"
                                      style={{ textDecoration: 'none' }}
                                      lineClamp={2}
                                    >
                                      {sanPham.ten}
                                    </Text>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                      {sanPham.trangTrai.ten}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {quyCach}
                                    </Text>
                                    <Group gap="xs" align="baseline" wrap="wrap">
                                      <Text fw={850} c="agrimarket.8" fz="md">
                                        {dinhDangGia(muc.bienThe.giaHienTai)}
                                      </Text>
                                      {laFlashSale ? (
                                        <>
                                          <Text size="sm" c="dimmed" td="line-through">
                                            {dinhDangGia(muc.bienThe.giaGoc)}
                                          </Text>
                                          <AgriBadge loai="canh-bao">Flash Sale</AgriBadge>
                                        </>
                                      ) : null}
                                    </Group>
                                    <Text
                                      size="xs"
                                      c={khongKhaDung ? 'red.7' : 'green.8'}
                                      fw={700}
                                    >
                                      {khongKhaDung
                                        ? muc.bienThe.soLuongKhaDung <= 0
                                          ? 'Tạm hết hàng'
                                          : 'Sản phẩm hiện không còn khả dụng với số lượng này.'
                                        : `Còn ${hienThiTonKhaDung(muc.bienThe.soLuongKhaDung)}`}
                                    </Text>
                                  </Stack>
                                </Group>

                                <Group justify="space-between" align="flex-end" gap="md" mt="md" wrap="wrap">
                                  <DieuChinhSoLuong
                                    tenSanPham={sanPham.ten}
                                    soLuong={muc.soLuong}
                                    soLuongToiDa={khongKhaDung ? muc.soLuong : toiDaDat}
                                    dangXuLy={dangCapNhatMucNay || dangXoaMucNay}
                                    onDoi={(soLuongMoi) => {
                                      if (soLuongMoi === muc.soLuong) return;
                                      capNhatMutation.mutate({ id: muc.id, soLuong: soLuongMoi });
                                    }}
                                  />
                                  <Stack gap={2} align="flex-end">
                                    <Text size="xs" c="dimmed">
                                      Thành tiền
                                    </Text>
                                    <Text fw={900} fz="lg" c="agrimarket.8">
                                      {dinhDangGia(lineTotal)}
                                    </Text>
                                  </Stack>
                                  <Button
                                    variant="subtle"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    disabled={dangXoaMucNay || dangCapNhatMucNay}
                                    loading={mucDangXoa === muc.id}
                                    aria-label={`Xóa ${sanPham.ten} khỏi giỏ hàng`}
                                    onClick={() => xoaMutation.mutate(muc.id)}
                                  >
                                    Xóa
                                  </Button>
                                </Group>
                              </Card>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>

                <Stack gap="md" className="agri-sticky-summary" style={{ alignSelf: 'start' }}>
                  <Paper withBorder p="lg" className="market-cart-summary">
                    <Stack gap="md">
                      <Title order={2} fz="lg">
                        Thanh toán
                      </Title>
                      <Group justify="space-between" gap="md" wrap="nowrap">
                        <Text c="dimmed" size="sm">
                          Tạm tính ({tongSoLuong} sản phẩm)
                        </Text>
                        <Text fw={850}>{dinhDangGia(tamTinh)}</Text>
                      </Group>
                      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                        <Text c="dimmed" size="sm">
                          Phí giao hàng
                        </Text>
                        <Text size="sm" ta="right">
                          Tính ở bước thanh toán
                        </Text>
                      </Group>
                      <Divider />
                      <Group justify="space-between" align="flex-end" gap="md" wrap="nowrap">
                        <Text fw={800}>Tổng tạm tính</Text>
                        <Text fz={26} fw={900} c="agrimarket.8">
                          {dinhDangGia(tamTinh)}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" lh={1.5}>
                        Phí vận chuyển và ưu đãi được tính ở bước thanh toán.
                      </Text>
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
                      {mucLoi.length > 0 && mucLoi.length < danhSachMuc.length ? (
                        <Text size="xs" c="orange.8" lh={1.6}>
                          Hãy xóa {mucLoi.length} mục lỗi khỏi giỏ để thanh toán thuận lợi.
                        </Text>
                      ) : null}
                    </Stack>
                  </Paper>

                </Stack>
              </SimpleGrid>

              {/* Thanh toán nhanh cho mobile: tôn trọng safe-area, không che nội dung desktop. */}
              <Box
                hiddenFrom="sm"
                style={{
                  position: 'sticky',
                  bottom: 'calc(12px + env(safe-area-inset-bottom))',
                  zIndex: 20,
                }}
              >
                <Paper withBorder p="md" radius="lg" shadow="md">
                  <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="xs" c="dimmed">
                        Tạm tính
                      </Text>
                      <Text fw={900} fz="lg" c="agrimarket.8" lineClamp={1}>
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
