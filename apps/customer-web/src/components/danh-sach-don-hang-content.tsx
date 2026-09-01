'use client';

import {
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  LUA_CHON_TRANG_THAI_DON_HANG,
  layDanhSachDonHangKhach,
  nhanTrangThaiDonHang,
  type TrangThaiDonHangLoc,
} from '@/lib/api-don-hang';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const GIOI_HAN = 10;

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

export function DanhSachDonHangContent() {
  const daDangNhap = layPhienKhachHang() !== null;
  const [trang, setTrang] = useState(1);
  const [trangThai, setTrangThai] = useState<TrangThaiDonHangLoc | null>(null);

  const query = useQuery({
    queryKey: ['don-hang-khach', 'list', trang, trangThai],
    queryFn: () =>
      layDanhSachDonHangKhach({
        trang,
        gioiHan: GIOI_HAN,
        ...(trangThai ? { trangThai } : {}),
      }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem đơn hàng"
          moTa="Danh sách đơn hàng chỉ hiển thị cho tài khoản khách hàng đã xác thực."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/don-hang">
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
        <AgriSkeleton soLuong={5} />
      </AgriContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không tải được đơn hàng"
          moTa="Không thể đọc danh sách đơn hàng của tài khoản hiện tại."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));

  return (
    <AgriContainer py={{ base: 32, md: 56 }}>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={4}>
            <Title order={1}>Đơn hàng của tôi</Title>
            <Text c="dimmed">Theo dõi đơn hàng, tiến trình và mở chi tiết từng đơn.</Text>
          </Stack>

          <Select
            label="Lọc trạng thái"
            placeholder="Tất cả trạng thái"
            clearable
            data={LUA_CHON_TRANG_THAI_DON_HANG}
            value={trangThai}
            onChange={(value) => {
              setTrangThai(value as TrangThaiDonHangLoc | null);
              setTrang(1);
            }}
            w={{ base: '100%', sm: 240 }}
          />
        </Group>

        {query.data.duLieu.length === 0 ? (
          <EmptyState
            tieuDe="Chưa có đơn hàng phù hợp"
            moTa={
              trangThai ? 'Không có đơn hàng ở trạng thái đã chọn.' : 'Bạn chưa có đơn hàng nào.'
            }
            hanhDong={
              <Button component={Link} href="/san-pham" variant="light">
                Khám phá nông sản
              </Button>
            }
          />
        ) : (
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            {query.data.duLieu.map((order) => (
              <Card key={order.id} withBorder radius="lg" padding="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Stack gap={3}>
                      <Text fw={800}>{order.maDonHang}</Text>
                      <Text size="sm" c="dimmed">
                        Tạo lúc {dinhDangNgay(order.createdAt)}
                      </Text>
                    </Stack>
                    <Badge color={mauTrangThai(order.trangThai)} variant="light">
                      {nhanTrangThaiDonHang(order.trangThai)}
                    </Badge>
                  </Group>

                  <Group justify="space-between" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      {order.soNhaCungCap} nhà cung cấp · {order.soMuc} mặt hàng
                    </Text>
                    <Text fw={800} c="agrimarket.8">
                      {dinhDangGia(order.tongTien)} ₫
                    </Text>
                  </Group>

                  <Group justify="space-between" wrap="wrap">
                    <Text size="xs" c={order.coTheHuy ? 'green.8' : 'dimmed'}>
                      {order.coTheHuy
                        ? 'Có thể hủy ở trạng thái hiện tại'
                        : 'Không thể hủy trực tiếp'}
                    </Text>
                    <Button component={Link} href={`/don-hang/${order.id}`} variant="light">
                      Xem chi tiết
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {query.data.tong > GIOI_HAN ? (
          <Group justify="center">
            <Pagination value={trang} onChange={setTrang} total={tongTrang} />
          </Group>
        ) : null}
      </Stack>
    </AgriContainer>
  );
}
