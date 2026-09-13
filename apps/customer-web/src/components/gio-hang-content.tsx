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
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader, StatGrid } from './web-page';

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
  const phien = layPhienKhachHang();
  const daDangNhap = phien !== null;
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
  const mucHopLe = useMemo(() => danhSachMuc.filter((muc) => muc.bienThe.coTheDatHang), [danhSachMuc]);
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
  const soMuc = danhSachMuc.length;
  const choPhepThanhToan = mucHopLe.length > 0 && !capNhatMutation.isPending && !xoaMutation.isPending;

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
      <Box className="agri-page">
        <PageHeader
          eyebrow="Giỏ hàng"
          title="Giỏ hàng của bạn"
          description="Đang đồng bộ giỏ hàng từ tài khoản của bạn."
        />
        <AgriContainer py={{ base: 28, md: 42 }}>
          <KhungXuongGioHang />
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
    <Box className="agri-page">
      <PageHeader
        eyebrow="Giỏ hàng"
        title="Giỏ hàng của bạn"
        description={
          tongSoLuong > 0
            ? `${tongSoLuong} sản phẩm đang chờ xác nhận. Giá và tồn kho được kiểm tra lại ở bước thanh toán.`
            : 'Sẵn sàng cho lần mua sắm tiếp theo.'
        }
        actions={
          <>
            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              onClick={() => void query.refetch()}
              loading={query.isFetching}
            >
              Đồng bộ lại
            </Button>
            <Button component={Link} href="/san-pham" color="agrimarket">
              Tiếp tục mua sắm
            </Button>
          </>
        }
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng giỏ hàng">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              Giỏ hàng
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
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
              <StatGrid
                items={[
                  { label: 'Sản phẩm trong giỏ', value: tongSoLuong, description: `${soMuc} dòng sản phẩm`, icon: <IconShoppingCart size={20} /> },
                  { label: 'Nhà cung cấp', value: nhom.length, description: 'Đơn sẽ được tách theo nguồn cung khi cần', icon: <IconBuildingStore size={20} /> },
                  { label: 'Tạm tính hiện tại', value: dinhDangGia(tamTinh), description: 'Chưa gồm phí giao hàng và ưu đãi' },
                ]}
              />

              {mucLoi.length > 0 ? (
                <Alert color="orange" title="Một số sản phẩm cần kiểm tra lại" icon={<IconAlertTriangle size={18} />}>
                  {mucLoi.length === danhSachMuc.length
                    ? 'Tất cả sản phẩm trong giỏ hiện không đủ tồn kho hoặc không còn khả dụng. Vui lòng xóa khỏi giỏ hoặc quay lại sau.'
                    : `Có ${mucLoi.length} sản phẩm tạm hết hàng hoặc không còn khả dụng. Bạn vẫn có thể thanh toán ${mucHopLe.length} sản phẩm còn lại sau khi xóa các mục lỗi khỏi giỏ.`}
                </Alert>
              ) : null}

              <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl" verticalSpacing="xl">
                <Stack gap="lg" style={{ gridColumn: 'span 2' }}>
                  {nhom.map((supplier) => (
                    <Paper key={supplier.id} withBorder className="agri-surface" p="xl">
                      <Stack gap="lg">
                        <Group justify="space-between" align="center" gap="md" wrap="wrap">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon variant="light" color="agrimarket" size={42} radius="lg">
                              <IconBuildingStore size={20} />
                            </ThemeIcon>
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" fw={700}>
                                NHÀ CUNG CẤP
                              </Text>
                              <Title order={2} fz="lg">
                                {supplier.ten}
                              </Title>
                            </Stack>
                          </Group>
                          <AgriBadge>{supplier.muc.length} mục</AgriBadge>
                        </Group>

                        <Divider />

                        <Stack gap="md">
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
                              <Card key={muc.id} withBorder className="agri-surface" padding="md">
                                <Group align="flex-start" wrap="nowrap" gap="md" style={{ minWidth: 0 }}>
                                  <Link
                                    href={`/san-pham/${sanPham.id}`}
                                    aria-label={`Xem ${sanPham.ten}`}
                                    style={{ flexShrink: 0 }}
                                  >
                                    {sanPham.anhBiaUrl ? (
                                      <Image
                                        src={sanPham.anhBiaUrl}
                                        alt={sanPham.ten}
                                        w={{ base: 92, sm: 112 }}
                                        h={{ base: 92, sm: 112 }}
                                        radius="md"
                                        fit="cover"
                                        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Crect width='112' height='112' fill='%23EEF6F1'/%3E%3C/svg%3E"
                                      />
                                    ) : (
                                      <Paper
                                        w={{ base: 92, sm: 112 }}
                                        h={{ base: 92, sm: 112 }}
                                        radius="md"
                                        bg="agrimarket.0"
                                        style={{ display: 'grid', placeItems: 'center' }}
                                      >
                                        <IconShoppingCart size={24} color="#087A4B" />
                                      </Paper>
                                    )}
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
                  <Paper withBorder p="xl" className="agri-surface agri-price-summary">
                    <Stack gap="md">
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed" fw={700}>
                          TÓM TẮT ĐƠN HÀNG
                        </Text>
                        <Title order={2} fz="xl">
                          Tạm tính
                        </Title>
                      </Stack>
                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">
                          Số lượng
                        </Text>
                        <Text fw={800}>{tongSoLuong}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">
                          Tiền hàng
                        </Text>
                        <Text fw={850}>{dinhDangGia(tamTinh)}</Text>
                      </Group>
                      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                        <Text c="dimmed" size="sm">
                          Phí giao hàng
                        </Text>
                        <Text size="sm" ta="right" lh={1.5}>
                          Tính ở bước thanh toán
                        </Text>
                      </Group>
                      <Divider />
                      <Text fz={30} fw={900} c="agrimarket.8">
                        {dinhDangGia(tamTinh)}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.6}>
                        Phí giao hàng được tính ở bước thanh toán. Số tiền phải trả cuối cùng do hệ thống tính
                        lại từ giá hiệu lực, khuyến mãi và điểm thưởng.
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
                      {mucLoi.length > 0 && mucHopLe.length > 0 ? (
                        <Text size="xs" c="orange.8" lh={1.6}>
                          Hãy xóa {mucLoi.length} mục lỗi khỏi giỏ để thanh toán thuận lợi.
                        </Text>
                      ) : null}
                    </Stack>
                  </Paper>

                  <BusinessNote>
                    Thanh toán sẽ kiểm tra lại từng sản phẩm, tồn kho hiện tại, phạm vi giao Hưng Yên và
                    giá hiện hành trước khi cho phép tạo đơn.
                  </BusinessNote>
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
