'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconArrowRight, IconBox, IconCalendar, IconShoppingBag } from '@tabler/icons-react';
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
import { PageHeader, StatGrid } from './web-page';

const GIOI_HAN = 10;

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangNgay(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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
    queryFn: () => layDanhSachDonHangKhach({ trang, gioiHan: GIOI_HAN, ...(trangThai ? { trangThai } : {}) }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <Box className="agri-page">
        <PageHeader eyebrow="Đơn hàng" title="Đăng nhập để xem đơn hàng" description="Lịch sử đơn, tiến trình giao hàng và các thao tác sau mua chỉ hiển thị cho đúng chủ tài khoản." />
        <AgriContainer py={{ base: 36, md: 56 }}>
          <EmptyState tieuDe="Cần đăng nhập" moTa="Đăng nhập để theo dõi đơn hàng của bạn." hanhDong={<Button component={Link} href="/dang-nhap?next=/don-hang">Đăng nhập</Button>} />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) return <AgriContainer py={{ base: 40, md: 64 }}><AgriSkeleton soLuong={5} /></AgriContainer>;

  if (query.isError || !query.data) {
    return <AgriContainer py={{ base: 40, md: 64 }}><ErrorState tieuDe="Không tải được đơn hàng" moTa="Không thể đọc danh sách đơn hàng của tài khoản hiện tại." onThuLai={() => void query.refetch()} /></AgriContainer>;
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));
  const tongTienTrang = query.data.duLieu.reduce((tong, item) => tong + item.tongTien, 0);

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Đơn hàng"
        title="Đơn hàng của tôi"
        description="Theo dõi tiến trình, mở chi tiết, hủy khi còn đủ điều kiện và truy cập các thao tác đánh giá/khiếu nại sau mua."
        actions={
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
            w={{ base: '100%', sm: 250 }}
          />
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
          <StatGrid
            items={[
              { label: 'Tổng đơn phù hợp', value: query.data.tong, description: trangThai ? 'Theo trạng thái đang lọc' : 'Toàn bộ lịch sử hiện có', icon: <IconShoppingBag size={20} /> },
              { label: 'Đang hiển thị', value: query.data.duLieu.length, description: `Trang ${trang}/${tongTrang}`, icon: <IconBox size={20} /> },
              { label: 'Giá trị các đơn trên trang', value: `${dinhDangGia(tongTienTrang)} ₫`, description: 'Không phải tổng chi tiêu toàn lịch sử' },
            ]}
          />

          {query.data.duLieu.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có đơn hàng phù hợp"
              moTa={trangThai ? 'Không có đơn hàng ở trạng thái đã chọn.' : 'Bạn chưa có đơn hàng nào.'}
              hanhDong={<Button component={Link} href="/san-pham" variant="light">Khám phá nông sản</Button>}
            />
          ) : (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              {query.data.duLieu.map((order) => (
                <Card key={order.id} withBorder className="agri-surface" padding="xl">
                  <Stack gap="md" h="100%">
                    <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><IconShoppingBag size={20} /></ThemeIcon>
                        <Stack gap={3}>
                          <Text size="xs" c="dimmed" fw={700}>MÃ ĐƠN HÀNG</Text>
                          <Text fw={900} fz="lg">{order.maDonHang}</Text>
                        </Stack>
                      </Group>
                      <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">
                        {nhanTrangThaiDonHang(order.trangThai)}
                      </Badge>
                    </Group>

                    <Divider />

                    <SimpleGrid cols={2} spacing="md">
                      <Stack gap={3}>
                        <Text size="xs" c="dimmed">Ngày tạo</Text>
                        <Group gap={5} wrap="nowrap"><IconCalendar size={14} color="#68766D" /><Text size="sm" fw={700}>{dinhDangNgay(order.createdAt)}</Text></Group>
                      </Stack>
                      <Stack gap={3}>
                        <Text size="xs" c="dimmed">Quy mô đơn</Text>
                        <Text size="sm" fw={700}>{order.soNhaCungCap} NCC · {order.soMuc} mặt hàng</Text>
                      </Stack>
                    </SimpleGrid>

                    <Group justify="space-between" align="flex-end" mt="auto" gap="lg" wrap="wrap">
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Tổng thanh toán</Text>
                        <Text fw={900} fz={24} c="agrimarket.8">{dinhDangGia(order.tongTien)} ₫</Text>
                        <Text size="xs" c={order.coTheHuy ? 'green.8' : 'dimmed'}>{order.coTheHuy ? 'Có thể hủy ở trạng thái hiện tại' : 'Không thể hủy trực tiếp'}</Text>
                      </Stack>
                      <Button component={Link} href={`/don-hang/${order.id}`} color="agrimarket" variant="light" rightSection={<IconArrowRight size={16} />}>
                        Xem chi tiết
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {query.data.tong > GIOI_HAN ? (
            <Group justify="center"><Pagination value={trang} onChange={setTrang} total={tongTrang} color="agrimarket" /></Group>
          ) : null}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
