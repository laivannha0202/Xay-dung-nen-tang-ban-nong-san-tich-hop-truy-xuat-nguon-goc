'use client';

import {
  Alert,
  Button,
  Card,
  Group,
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
  return new Intl.NumberFormat('vi-VN').format(value);
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

      if (current) {
        current.muc.push(muc);
      } else {
        values.set(supplier.id, {
          id: supplier.id,
          ten: supplier.ten,
          muc: [muc],
        });
      }
    }

    return [...values.values()];
  }, [query.data]);

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem giỏ hàng"
          moTa="Giỏ hàng của tài khoản được lưu và đồng bộ từ Backend."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/gio-hang">
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
          moTa="Phiên đăng nhập có thể đã hết hoặc Backend đang tạm thời không khả dụng."
          onThuLai={() => {
            void query.refetch();
          }}
        />
      </AgriContainer>
    );
  }

  return (
    <AgriContainer py={{ base: 40, md: 64 }}>
      <Stack gap={40}>
        <Group justify="space-between" align="flex-end">
          <Stack gap={6}>
            <AgriBadge>Giỏ hàng</AgriBadge>
            <Title order={1}>Giỏ hàng của bạn</Title>
            <Text c="dimmed">Đã đồng bộ với Backend cho {phien.nguoiDung.email}.</Text>
          </Stack>

          <Group>
            <Button
              variant="default"
              onClick={() => {
                void query.refetch();
              }}
              loading={query.isFetching}
            >
              Đồng bộ lại
            </Button>
            <Button
              variant="subtle"
              color="red"
              onClick={() => {
                xoaPhienKhachHang();
                queryClient.removeQueries({
                  queryKey: GIO_HANG_QUERY_KEY,
                });
                window.location.assign('/dang-nhap');
              }}
            >
              Đăng xuất
            </Button>
          </Group>
        </Group>

        {capNhatMutation.isError || xoaMutation.isError ? (
          <Alert color="red" title="Không cập nhật được giỏ hàng">
            Backend đã từ chối thay đổi. Hãy đồng bộ lại để lấy giá và tồn hiện tại.
          </Alert>
        ) : null}

        {query.data.muc.length === 0 ? (
          <EmptyState
            tieuDe="Giỏ hàng đang trống"
            moTa="Chọn một biến thể sản phẩm để thêm vào giỏ."
            hanhDong={
              <Button component={Link} href="/san-pham">
                Khám phá nông sản
              </Button>
            }
          />
        ) : (
          <Stack gap="xl">
            {nhom.map((supplier) => (
              <Paper key={supplier.id} withBorder radius="xl" p={{ base: 'md', md: 'xl' }}>
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text size="sm" c="dimmed">
                        Nhà cung cấp
                      </Text>
                      <Title order={2}>{supplier.ten}</Title>
                    </Stack>
                    <AgriBadge>{supplier.muc.length} mục</AgriBadge>
                  </Group>

                  <SimpleGrid cols={{ base: 1 }} spacing="md">
                    {supplier.muc.map((muc) => (
                      <Card key={muc.id} withBorder radius="lg" padding="lg">
                        <Group justify="space-between" align="flex-start" wrap="wrap">
                          <Stack gap={6}>
                            <Text fw={700}>{muc.bienThe.sanPham.ten}</Text>
                            <Text size="sm" c="dimmed">
                              {muc.bienThe.sanPham.trangTrai.ten}
                            </Text>
                            <Text size="sm">
                              {muc.bienThe.khoiLuong} {muc.bienThe.donVi} · SKU {muc.bienThe.sku}
                            </Text>
                            <Text fw={700} c="agrimarket.8">
                              {dinhDangGia(muc.bienThe.giaHienTai)} ₫ / đơn vị
                            </Text>
                            <Text size="sm" c={muc.bienThe.coTheDatHang ? 'green.8' : 'red.7'}>
                              Tồn khả dụng hiện tại: {muc.bienThe.soLuongKhaDung}
                            </Text>
                          </Stack>

                          <Stack gap="sm" miw={180}>
                            <NumberInput
                              label="Số lượng"
                              min={1}
                              max={Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung))}
                              value={muc.soLuong}
                              disabled={capNhatMutation.isPending || xoaMutation.isPending}
                              onChange={(value) => {
                                const soLuong = typeof value === 'number' ? value : Number(value);

                                if (
                                  !Number.isInteger(soLuong) ||
                                  soLuong < 1 ||
                                  soLuong === muc.soLuong
                                ) {
                                  return;
                                }

                                capNhatMutation.mutate({
                                  id: muc.id,
                                  soLuong,
                                });
                              }}
                            />

                            <Button
                              variant="default"
                              color="red"
                              disabled={capNhatMutation.isPending || xoaMutation.isPending}
                              onClick={() => xoaMutation.mutate(muc.id)}
                            >
                              Xóa khỏi giỏ
                            </Button>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        <Alert color="blue" title="Checkout chưa thuộc phiên này">
          PHIEN-048 chỉ quản lý và đồng bộ giỏ hàng. Phí vận chuyển, mã giảm giá, tổng thanh toán và
          chia đơn theo nhà cung cấp sẽ do Checkout Preview PHIEN-049 tính từ Backend.
        </Alert>
      </Stack>
    </AgriContainer>
  );
}
