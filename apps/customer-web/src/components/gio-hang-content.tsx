'use client';

import { dinhDangQuyCachSanPham } from '@agrimarket/api-client';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Image,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingStore,
  IconRefresh,
  IconShoppingCart,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  capNhatMucGioHangKhach,
  type GioHangKhach,
  layGioHangKhach,
  xoaMucGioHangKhach,
} from '@/lib/api-gio-hang';
import { layPhienKhachHang, xoaPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader, StatGrid } from './web-page';

const GIO_HANG_QUERY_KEY = ['gio-hang-khach'] as const;

type NhomNhaCungCap = {
  id: string;
  ten: string;
  muc: GioHangKhach['muc'];
};

function dinhDangGia(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} ₫`;
}

export function GioHangContent() {
  const queryClient = useQueryClient();
  const phien = layPhienKhachHang();
  const daDangNhap = phien !== null;

  const query = useQuery({
    queryKey: GIO_HANG_QUERY_KEY,
    queryFn: layGioHangKhach,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const capNhatMutation = useMutation({
    mutationFn: ({ id, soLuong }: { id: string; soLuong: number }) => capNhatMucGioHangKhach(id, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_QUERY_KEY, gioHang);
    },
  });

  const xoaMutation = useMutation({
    mutationFn: (id: string) => xoaMucGioHangKhach(id),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_QUERY_KEY, gioHang);
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

  const tongSoLuong = useMemo(
    () => (query.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [query.data],
  );
  const tamTinh = useMemo(
    () => (query.data?.muc ?? []).reduce((tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong, 0),
    [query.data],
  );
  const soMuc = query.data?.muc.length ?? 0;
  const dangXuLy = capNhatMutation.isPending || xoaMutation.isPending;

  if (!daDangNhap) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Giỏ hàng"
          title="Đăng nhập để xem giỏ hàng"
          description="Giỏ hàng được lưu theo tài khoản để bạn có thể tiếp tục mua sắm và checkout an toàn."
        />
        <AgriContainer py={{ base: 36, md: 56 }}>
          <EmptyState
            tieuDe="Bạn chưa đăng nhập"
            moTa="Đăng nhập để đồng bộ giỏ hàng, địa chỉ giao nhận, điểm thưởng và lịch sử đơn hàng."
            hanhDong={<Button component={Link} href="/dang-nhap?next=/gio-hang" color="agrimarket">Đăng nhập</Button>}
          />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) {
    return <AgriContainer py={{ base: 40, md: 64 }}><AgriSkeleton soLuong={5} /></AgriContainer>;
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không đồng bộ được giỏ hàng"
          moTa="Phiên đăng nhập có thể đã hết hạn hoặc hệ thống đang tạm thời không phản hồi."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Giỏ hàng"
        title="Giỏ hàng của bạn"
        description={tongSoLuong > 0 ? `${tongSoLuong} sản phẩm đang chờ xác nhận. Giá và tồn sẽ được kiểm tra lại ở checkout.` : 'Sẵn sàng cho lần mua sắm tiếp theo.'}
        actions={
          <>
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => void query.refetch()} loading={query.isFetching}>Đồng bộ lại</Button>
            <Button component={Link} href="/san-pham" color="agrimarket">Tiếp tục mua sắm</Button>
          </>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
          {capNhatMutation.isError || xoaMutation.isError ? (
            <Alert color="red" title="Không cập nhật được giỏ hàng">
              Không thể lưu thay đổi. Hãy đồng bộ lại để lấy giá và tồn hiện tại trước khi tiếp tục.
            </Alert>
          ) : null}

          {query.data.muc.length === 0 ? (
            <EmptyState
              tieuDe="Giỏ hàng đang trống"
              moTa="Khám phá nông sản, chọn đúng quy cách rồi thêm vào giỏ hàng."
              bieuTuong={<IconShoppingCart size={30} />}
              hanhDong={<Button component={Link} href="/san-pham" color="agrimarket">Khám phá nông sản</Button>}
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

              <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="xl" verticalSpacing="xl">
                <Stack gap="lg" style={{ gridColumn: 'span 2' }}>
                  {nhom.map((supplier) => (
                    <Paper key={supplier.id} withBorder className="agri-surface" p="xl">
                      <Stack gap="lg">
                        <Group justify="space-between" align="center" gap="md" wrap="wrap">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon variant="light" color="agrimarket" size={42} radius="lg"><IconBuildingStore size={20} /></ThemeIcon>
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" fw={700}>NHÀ CUNG CẤP</Text>
                              <Title order={2} fz="lg">{supplier.ten}</Title>
                            </Stack>
                          </Group>
                          <AgriBadge>{supplier.muc.length} mục</AgriBadge>
                        </Group>

                        <Divider />

                        <Stack gap="md">
                          {supplier.muc.map((muc) => {
                            const sanPham = muc.bienThe.sanPham;
                            const lineTotal = muc.bienThe.giaHienTai * muc.soLuong;
                            const quyCach = dinhDangQuyCachSanPham({ khoiLuong: muc.bienThe.khoiLuong, donVi: muc.bienThe.donVi });

                            return (
                              <Card key={muc.id} withBorder className="agri-surface" padding="md">
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                  <Group align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <Link href={`/san-pham/${sanPham.id}`} aria-label={`Xem ${sanPham.ten}`} style={{ flexShrink: 0 }}>
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
                                        <Paper w={{ base: 92, sm: 112 }} h={{ base: 92, sm: 112 }} radius="md" bg="agrimarket.0" style={{ display: 'grid', placeItems: 'center' }}>
                                          <IconShoppingCart size={24} color="#087A4B" />
                                        </Paper>
                                      )}
                                    </Link>

                                    <Stack gap={5} style={{ minWidth: 0, flex: 1 }}>
                                      <Text component={Link} href={`/san-pham/${sanPham.id}`} fw={850} fz="md" c="dark.9" style={{ textDecoration: 'none' }} lineClamp={2}>{sanPham.ten}</Text>
                                      <Text size="xs" c="dimmed" lineClamp={1}>{sanPham.trangTrai.ten}</Text>
                                      <Text size="xs" c="dimmed">{quyCach} · SKU {muc.bienThe.sku}</Text>
                                      <Text fw={850} c="agrimarket.8">{dinhDangGia(muc.bienThe.giaHienTai)}</Text>
                                      <Text size="xs" c={muc.bienThe.coTheDatHang ? 'green.8' : 'red.7'} fw={700}>
                                        {muc.bienThe.coTheDatHang ? `Còn ${muc.bienThe.soLuongKhaDung} khả dụng` : 'Không đủ tồn cho số lượng hiện tại'}
                                      </Text>
                                    </Stack>
                                  </Group>

                                  <Stack gap="sm" justify="space-between" style={{ minWidth: 0 }}>
                                    <NumberInput
                                      label="Số lượng"
                                      min={1}
                                      max={Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung))}
                                      value={muc.soLuong}
                                      disabled={dangXuLy}
                                      onChange={(value) => {
                                        const soLuong = typeof value === 'number' ? value : Number(value);
                                        if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong === muc.soLuong) return;
                                        capNhatMutation.mutate({ id: muc.id, soLuong });
                                      }}
                                    />
                                    <Group justify="space-between" align="flex-end">
                                      <Stack gap={2}>
                                        <Text size="xs" c="dimmed">Thành tiền</Text>
                                        <Text fw={900} fz="lg" c="agrimarket.8">{dinhDangGia(lineTotal)}</Text>
                                      </Stack>
                                      <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} disabled={dangXuLy} onClick={() => xoaMutation.mutate(muc.id)}>Xóa</Button>
                                    </Group>
                                  </Stack>
                                </SimpleGrid>
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
                        <Text size="xs" c="dimmed" fw={700}>TÓM TẮT GIỎ HÀNG</Text>
                        <Title order={2} fz="xl">Tạm tính</Title>
                      </Stack>
                      <Group justify="space-between"><Text c="dimmed" size="sm">Số lượng</Text><Text fw={800}>{tongSoLuong}</Text></Group>
                      <Group justify="space-between"><Text c="dimmed" size="sm">Tiền hàng</Text><Text fw={850}>{dinhDangGia(tamTinh)}</Text></Group>
                      <Divider />
                      <Text fz={30} fw={900} c="agrimarket.8">{dinhDangGia(tamTinh)}</Text>
                      <Text size="xs" c="dimmed" lh={1.6}>Phí vận chuyển, voucher, điểm thưởng và tổng thanh toán cuối cùng sẽ được tính ở checkout.</Text>
                      <Button component={Link} href="/thanh-toan" color="agrimarket" size="md" fullWidth rightSection={<IconArrowRight size={17} />}>
                        Tiến hành thanh toán
                      </Button>
                    </Stack>
                  </Paper>

                  <BusinessNote>
                    Checkout sẽ kiểm tra lại từng biến thể, tồn kho hiện tại, phạm vi giao Hưng Yên và giá hiện hành trước khi cho phép tạo đơn.
                  </BusinessNote>

                  <Button
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      xoaPhienKhachHang();
                      queryClient.removeQueries({ queryKey: GIO_HANG_QUERY_KEY });
                      window.location.assign('/dang-nhap');
                    }}
                  >
                    Đăng xuất khỏi tài khoản
                  </Button>
                </Stack>
              </SimpleGrid>
            </>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
