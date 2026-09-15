'use client';

import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  LUA_CHON_TRANG_THAI_DON_HANG,
  TRANG_THAI_DON_HANG_LOC,
  layDanhSachDonHangKhach,
  nhanTrangThaiDonHang,
  type TrangThaiDonHangLoc,
} from '@/lib/api-don-hang';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';
import { PageHeader } from './web-page';

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

function tieuDeChip(coDem: number | undefined, nhan: string): string {
  if (typeof coDem !== 'number') return nhan;
  return `${nhan} (${coDem.toLocaleString('vi-VN')})`;
}

export function DanhSachDonHangContent() {
  // Trạng thái từ AuthProvider (đã restore im lặng khi F5/tab mới).
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const [trang, setTrang] = useState(1);
  const [trangThai, setTrangThai] = useState<TrangThaiDonHangLoc | null>(null);

  const query = useQuery({
    queryKey: ['don-hang-khach', 'list', trang, trangThai],
    queryFn: () => layDanhSachDonHangKhach({ trang, gioiHan: GIOI_HAN, ...(trangThai ? { trangThai } : {}) }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  // Số đếm thật cho từng chip trạng thái: mỗi enum một query nhẹ
  // (gioiHan: 1) và lấy `tong` backend trả về. Không hard-code số.
  const demQuery = useQuery({
    queryKey: ['don-hang-khach', 'counts'],
    queryFn: async () => {
      const tatCa = await layDanhSachDonHangKhach({ trang: 1, gioiHan: 1 });
      const theoTrangThai = await Promise.all(
        TRANG_THAI_DON_HANG_LOC.map((giaTri) =>
          layDanhSachDonHangKhach({ trang: 1, gioiHan: 1, trangThai: giaTri }).then((res) => ({
            giaTri,
            tong: res.tong,
          })),
        ),
      );
      const bangDem: Record<string, number> = {};
      theoTrangThai.forEach((item) => {
        bangDem[item.giaTri] = item.tong;
      });
      return { tatCa: tatCa.tong, theoTrangThai: bangDem };
    },
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  // Đang xác định phiên (restore bằng refresh cookie): hiện skeleton thay
  // vì nháy màn "Đăng nhập" rồi đổi sang nội dung.
  if (trangThaiXacThuc === 'dang-tai') {
    return (
      <Box className="agri-page">
        <AgriContainer>
          <AgriSkeleton soLuong={5} />
        </AgriContainer>
      </Box>
    );
  }

  if (!daDangNhap) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Đơn hàng"
          title="Đăng nhập để xem đơn hàng"
          description="Lịch sử đơn, tiến trình giao hàng và các thao tác sau mua chỉ hiển thị cho đúng chủ tài khoản."
          meta={
            <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng đơn hàng">
              <Anchor component={Link} href="/" c="dimmed">
                Trang chủ
              </Anchor>
              <Text c="dark.8" fw={700}>
                Đơn hàng của tôi
              </Text>
            </Breadcrumbs>
          }
        />
        <AgriContainer py={{ base: 36, md: 56 }}>
          <EmptyState tieuDe="Cần đăng nhập" moTa="Đăng nhập để theo dõi đơn hàng của bạn." hanhDong={<Button component={Link} href="/dang-nhap?next=/don-hang">Đăng nhập</Button>} />
        </AgriContainer>
      </Box>
    );
  }

  if (query.isPending) return <AgriContainer py={{ base: 40, md: 64 }}><AgriSkeleton soLuong={5} /></AgriContainer>;

  if (query.isError || !query.data) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Đơn hàng"
          title="Đơn hàng của tôi"
          description="Theo dõi tiến trình, mở chi tiết, hủy khi còn đủ điều kiện và truy cập các thao tác đánh giá/khiếu nại sau mua."
          meta={
            <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng đơn hàng">
              <Anchor component={Link} href="/" c="dimmed">
                Trang chủ
              </Anchor>
              <Text c="dark.8" fw={700}>
                Đơn hàng của tôi
              </Text>
            </Breadcrumbs>
          }
        />
        <AgriContainer py={{ base: 40, md: 64 }}>
          <ErrorState
            tieuDe="Không thể tải danh sách đơn hàng."
            moTa="Không thể tải danh sách đơn hàng. Vui lòng kiểm tra kết nối và thử lại."
            onThuLai={() => void query.refetch()}
          />
        </AgriContainer>
      </Box>
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));
  const dem = demQuery.data;

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text fw={900} fz={{ base: 20, md: 24 }}>
          Đơn hàng của tôi
        </Text>
        <Text size="sm" c="dimmed">
          Theo dõi và quản lý tất cả đơn hàng của bạn tại AgriMarket.
        </Text>
      </Stack>

      {/* Filter chips dùng đúng enum backend (CHO_THANH_TOAN..DA_HUY). Backend phân trang + lọc thật, đổi filter reset về trang 1. */}
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <ScrollArea type="scroll" offsetScrollbars aria-label="Lọc nhanh theo trạng thái" style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap" py={2} style={{ minWidth: 'max-content' }}>
            <Button
              size="xs"
              radius="xl"
              variant={trangThai === null ? 'filled' : 'light'}
              color="agrimarket"
              onClick={() => {
                setTrangThai(null);
                setTrang(1);
              }}
              style={{ flex: '0 0 auto' }}
            >
              {tieuDeChip(dem?.tatCa, 'Tất cả')}
            </Button>
            {LUA_CHON_TRANG_THAI_DON_HANG.map((luaChon) => (
              <Button
                key={luaChon.value}
                size="xs"
                radius="xl"
                variant={trangThai === luaChon.value ? 'filled' : 'light'}
                color="agrimarket"
                onClick={() => {
                  setTrangThai(luaChon.value as TrangThaiDonHangLoc);
                  setTrang(1);
                }}
                style={{ flex: '0 0 auto' }}
              >
                {tieuDeChip(dem?.theoTrangThai[luaChon.value], luaChon.label)}
              </Button>
            ))}
          </Group>
        </ScrollArea>
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
      </Group>

      {query.data.duLieu.length === 0 ? (
        trangThai ? (
          <EmptyState
            tieuDe="Không có đơn hàng ở trạng thái này"
            moTa="Không có đơn hàng ở trạng thái đã chọn. Thử chọn trạng thái khác hoặc xem tất cả đơn."
            hanhDong={
              <Group gap="sm" justify="center">
                <Button
                  variant="default"
                  onClick={() => {
                    setTrangThai(null);
                    setTrang(1);
                  }}
                >
                  Xem tất cả
                </Button>
                <Button component={Link} href="/san-pham" variant="light">
                  Khám phá sản phẩm
                </Button>
              </Group>
            }
          />
        ) : (
          <EmptyState
            tieuDe="Bạn chưa có đơn hàng nào"
            moTa="Bạn chưa có đơn hàng nào. Khám phá nông sản sạch và đặt đơn đầu tiên của bạn."
            hanhDong={<Button component={Link} href="/san-pham" variant="light">Khám phá sản phẩm</Button>}
          />
        )
      ) : (
        // Mỗi card dùng persisted snapshot từ DanhSachDonHangCuaToiDto (maDonHang/tongTien/createdAt).
        // Không gọi Product API để tính lại giá, không fetch payment/shipment theo từng đơn (tránh N+1).
        // Chi tiết mặt hàng, phí vận chuyển và thao tác thanh toán lại nằm ở trang chi tiết đơn.
        <SimpleGrid cols={{ base: 1 }} spacing="md">
          {query.data.duLieu.map((order) => (
            <Paper key={order.id} withBorder className="agri-surface" p={{ base: 'md', md: 'lg' }} radius="md">
              <Stack gap="md">
                <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                  <Group gap="lg" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      Mã đơn hàng{' '}
                      <Text span fw={850} c="agrimarket.8">
                        {order.maDonHang}
                      </Text>
                    </Text>
                    <Text size="sm" c="dimmed">
                      Đặt ngày {dinhDangNgay(order.createdAt)}
                    </Text>
                  </Group>
                  <Badge color={mauTrangThai(order.trangThai)} variant="light" size="lg">
                    {nhanTrangThaiDonHang(order.trangThai)}
                  </Badge>
                </Group>

                <Divider />

                <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">
                      Quy mô đơn
                    </Text>
                    <Text size="sm" fw={700}>
                      {order.soNhaCungCap} NCC · {order.soMuc} mặt hàng
                    </Text>
                    <Text size="xs" c={order.coTheHuy ? 'green.8' : 'dimmed'}>
                      {order.coTheHuy ? 'Có thể hủy ở trạng thái hiện tại' : 'Không thể hủy trực tiếp'}
                    </Text>
                  </Stack>
                  <Stack gap={6} align="flex-end">
                    <Group gap="xs" align="baseline">
                      <Text size="sm" c="dimmed">
                        Tổng thanh toán
                      </Text>
                      <Text fw={900} fz={22} c="agrimarket.8">
                        {dinhDangGia(order.tongTien)} ₫
                      </Text>
                    </Group>
                    <Button
                      component={Link}
                      href={`/don-hang/${order.id}`}
                      color="agrimarket"
                      variant="light"
                      size="sm"
                      rightSection={<IconArrowRight size={16} />}
                    >
                      Xem chi tiết
                    </Button>
                  </Stack>
                </Group>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {query.data.tong > GIOI_HAN ? (
        <Group justify="center"><Pagination value={trang} onChange={setTrang} total={tongTrang} color="agrimarket" /></Group>
      ) : null}
    </Stack>
  );
}
