'use client';

import { dinhDangQuyCachSanPham } from '@agrimarket/api-client';
import {
  Alert,
  Button,
  Card,
  Group,
  Image,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
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
    mutationFn: ({ id, soLuong }: { id: string; soLuong: number }) =>
      capNhatMucGioHangKhach(id, soLuong),
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
    () =>
      (query.data?.muc ?? []).reduce(
        (tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong,
        0,
      ),
    [query.data],
  );

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem giỏ hàng"
          moTa="Giỏ hàng được lưu theo tài khoản để bạn tiếp tục mua sắm thuận tiện."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/gio-hang" color="agrimarket">
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
        <AgriSkeleton soLuong={4} />
      </AgriContainer>
    );
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
    <AgriContainer py={{ base: 32, md: 52 }}>
      <Stack gap={28}>
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={6}>
            <AgriBadge>Giỏ hàng</AgriBadge>
            <Title order={1}>Giỏ hàng của bạn</Title>
            <Text c="dimmed">
              {tongSoLuong > 0 ? `${tongSoLuong} sản phẩm đang chờ xác nhận.` : 'Sẵn sàng cho lần mua sắm tiếp theo.'}
            </Text>
          </Stack>

          <Group>
            <Button variant="default" onClick={() => void query.refetch()} loading={query.isFetching}>
              Đồng bộ lại
            </Button>
            <Button
              variant="subtle"
              color="red"
              onClick={() => {
                xoaPhienKhachHang();
                queryClient.removeQueries({ queryKey: GIO_HANG_QUERY_KEY });
                window.location.assign('/dang-nhap');
              }}
            >
              Đăng xuất
            </Button>
          </Group>
        </Group>

        {capNhatMutation.isError || xoaMutation.isError ? (
          <Alert color="red" title="Không cập nhật được giỏ hàng">
            Không thể cập nhật thay đổi. Hãy tải lại giỏ hàng để lấy giá và tồn hiện tại.
          </Alert>
        ) : null}

        {query.data.muc.length === 0 ? (
          <EmptyState
            tieuDe="Giỏ hàng đang trống"
            moTa="Chọn một biến thể sản phẩm để thêm vào giỏ."
            hanhDong={
              <Button component={Link} href="/san-pham" color="agrimarket">
                Khám phá nông sản
              </Button>
            }
          />
        ) : (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Paper withBorder radius="lg" p="lg" bg="agrimarket.0">
                <Text size="sm" c="dimmed">Tổng số lượng</Text>
                <Text mt={4} fz={28} fw={900} c="agrimarket.8">{tongSoLuong}</Text>
              </Paper>
              <Paper withBorder radius="lg" p="lg" bg="agrimarket.0">
                <Text size="sm" c="dimmed">Tạm tính theo giá hiện tại</Text>
                <Text mt={4} fz={28} fw={900} c="agrimarket.8">{dinhDangGia(tamTinh)}</Text>
              </Paper>
            </SimpleGrid>

            {nhom.map((supplier) => (
              <Paper key={supplier.id} withBorder radius="lg" p={{ base: 'md', md: 'xl' }}>
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">Nhà cung cấp</Text>
                      <Title order={2} size="h3">{supplier.ten}</Title>
                    </Stack>
                    <AgriBadge>{supplier.muc.length} mục</AgriBadge>
                  </Group>

                  <SimpleGrid cols={{ base: 1 }} spacing="md">
                    {supplier.muc.map((muc) => {
                      const sanPham = muc.bienThe.sanPham;
                      const lineTotal = muc.bienThe.giaHienTai * muc.soLuong;
                      const quyCach = dinhDangQuyCachSanPham({
                        khoiLuong: muc.bienThe.khoiLuong,
                        donVi: muc.bienThe.donVi,
                      });

                      return (
                        <Card key={muc.id} withBorder radius="lg" padding="lg">
                          <Group justify="space-between" align="stretch" wrap="wrap" gap="lg">
                            <Group align="flex-start" wrap="nowrap" style={{ flex: '1 1 520px', minWidth: 0 }}>
                              <Link href={`/san-pham/${sanPham.id}`} aria-label={`Xem ${sanPham.ten}`}>
                                {sanPham.anhBiaUrl ? (
                                  <Image
                                    src={sanPham.anhBiaUrl}
                                    alt={sanPham.ten}
                                    w={112}
                                    h={112}
                                    radius="md"
                                    fit="cover"
                                    fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112'%3E%3Crect width='112' height='112' fill='%23EEF6F1'/%3E%3C/svg%3E"
                                  />
                                ) : (
                                  <Paper
                                    w={112}
                                    h={112}
                                    radius="md"
                                    bg="agrimarket.0"
                                    style={{ display: 'grid', placeItems: 'center' }}
                                  >
                                    <Text fw={900} c="agrimarket.7" size="xs">AgriMarket</Text>
                                  </Paper>
                                )}
                              </Link>

                              <Stack gap={5} style={{ minWidth: 0, flex: 1 }}>
                                <Text
                                  component={Link}
                                  href={`/san-pham/${sanPham.id}`}
                                  fw={850}
                                  fz="lg"
                                  c="dark"
                                  style={{ textDecoration: 'none' }}
                                >
                                  {sanPham.ten}
                                </Text>
                                <Text size="sm" c="dimmed">{sanPham.trangTrai.ten}</Text>
                                <Text size="sm">{quyCach} · SKU {muc.bienThe.sku}</Text>
                                <Group gap="xs" wrap="wrap">
                                  <Text fw={850} c="agrimarket.8">{dinhDangGia(muc.bienThe.giaHienTai)}</Text>
                                  <Text size="xs" c="dimmed">/ {quyCach}</Text>
                                </Group>
                                <Text size="sm" c={muc.bienThe.coTheDatHang ? 'green.8' : 'red.7'}>
                                  {muc.bienThe.coTheDatHang
                                    ? `Còn ${muc.bienThe.soLuongKhaDung} khả dụng`
                                    : 'Tạm không thể đặt với số lượng hiện tại'}
                                </Text>
                              </Stack>
                            </Group>

                            <Stack gap="sm" miw={200} justify="space-between">
                              <NumberInput
                                label="Số lượng"
                                min={1}
                                max={Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung))}
                                value={muc.soLuong}
                                disabled={capNhatMutation.isPending || xoaMutation.isPending}
                                onChange={(value) => {
                                  const soLuong = typeof value === 'number' ? value : Number(value);
                                  if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong === muc.soLuong) return;
                                  capNhatMutation.mutate({ id: muc.id, soLuong });
                                }}
                              />
                              <Stack gap={2}>
                                <Text size="xs" c="dimmed">Thành tiền</Text>
                                <Text fw={900} fz="lg" c="agrimarket.8">{dinhDangGia(lineTotal)}</Text>
                              </Stack>
                              <Button
                                variant="light"
                                color="red"
                                disabled={capNhatMutation.isPending || xoaMutation.isPending}
                                onClick={() => xoaMutation.mutate(muc.id)}
                              >
                                Xóa khỏi giỏ
                              </Button>
                            </Stack>
                          </Group>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {query.data.muc.length > 0 ? (
          <Paper withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" bg="agrimarket.0">
            <Group justify="space-between" align="center" wrap="wrap" gap="lg">
              <Stack gap={4}>
                <Text size="sm" c="dimmed">Tạm tính</Text>
                <Text fz={30} fw={900} c="agrimarket.8">{dinhDangGia(tamTinh)}</Text>
                <Text size="sm" c="dimmed">
                  Giá, tồn kho, phí giao hàng và ưu đãi sẽ được xác nhận lại ở bước thanh toán.
                </Text>
              </Stack>
              <Button component={Link} href="/thanh-toan" color="agrimarket" size="md">
                Tiến hành thanh toán
              </Button>
            </Group>
          </Paper>
        ) : null}
      </Stack>
    </AgriContainer>
  );
}
