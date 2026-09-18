'use client';

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  CopyButton,
  Divider,
  Group,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconPackage,
} from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  LUA_CHON_TRANG_THAI_DON_HANG,
  TRANG_THAI_DON_HANG_LOC,
  layDanhSachDonHangKhach,
  nhanTrangThaiDonHang,
  type TrangThaiDonHangLoc,
} from '@/lib/api-don-hang';
import { layThanhToanDonHangKhach, taoThanhToanVnPayWebKhach } from '@/lib/api-thanh-toan';

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const GIOI_HAN = 10;

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
  const { trangThai: trangThaiXacThuc } = useXacThucKhachHang();
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const [trang, setTrang] = useState(1);
  const [trangThai, setTrangThai] = useState<TrangThaiDonHangLoc | null>(null);

  const thanhToanNgayMutation = useMutation({
    mutationFn: async (donHangId: string) => {
      const payment = await layThanhToanDonHangKhach(donHangId);

      if (payment.trangThai === 'PAID') {
        window.location.assign(`/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`);
        return payment;
      }

      if (payment.phuongThuc === 'COD') {
        throw new Error('Đơn này thanh toán khi nhận hàng, không cần thanh toán trực tuyến.');
      }

      if (payment.phuongThuc !== 'VNPAY_SANDBOX') {
        throw new Error('Phương thức thanh toán của đơn này chưa hỗ trợ thanh toán lại trên web.');
      }

      if (payment.datCho.trangThai !== 'DANG_GIU') {
        throw new Error(
          'Phiên giữ hàng của đơn đã hết hiệu lực. Hãy mở chi tiết đơn để kiểm tra hoặc hủy/đặt lại.',
        );
      }

      const next = await taoThanhToanVnPayWebKhach(donHangId, crypto.randomUUID());

      if (next.trangThai === 'PAID') {
        window.location.assign(`/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`);
        return next;
      }

      if (!next.paymentUrl) {
        throw new Error('VNPay chưa trả đường dẫn thanh toán hợp lệ.');
      }

      window.location.assign(next.paymentUrl);
      return next;
    },
  });

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

  const demQuery = useQuery({
    queryKey: ['don-hang-khach', 'counts'],
    queryFn: async () => {
      const tatCa = await layDanhSachDonHangKhach({
        trang: 1,
        gioiHan: 1,
      });

      const theoTrangThai = await Promise.all(
        TRANG_THAI_DON_HANG_LOC.map((giaTri) =>
          layDanhSachDonHangKhach({
            trang: 1,
            gioiHan: 1,
            trangThai: giaTri,
          }).then((res) => ({
            giaTri,
            tong: res.tong,
          })),
        ),
      );

      const bangDem: Record<string, number> = {};
      theoTrangThai.forEach((item) => {
        bangDem[item.giaTri] = item.tong;
      });

      return {
        tatCa: tatCa.tong,
        theoTrangThai: bangDem,
      };
    },
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-tai') {
    return <AgriSkeleton soLuong={5} />;
  }

  if (!daDangNhap) {
    return (
      <EmptyState
        tieuDe="Cần đăng nhập"
        moTa="Đăng nhập để xem và theo dõi các đơn hàng của bạn."
        hanhDong={
          <Button component={Link} href="/dang-nhap?next=/don-hang">
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (query.isPending) {
    return <AgriSkeleton soLuong={5} />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        tieuDe="Không thể tải danh sách đơn hàng."
        moTa="Vui lòng kiểm tra kết nối và thử lại."
        onThuLai={() => void query.refetch()}
      />
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));
  const dem = demQuery.data;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Stack gap={3}>
          <Text fw={900} fz={{ base: 22, md: 28 }}>
            Đơn hàng của tôi
          </Text>
          <Text size="sm" c="dimmed">
            Theo dõi trạng thái, sản phẩm và thanh toán của các đơn đã đặt.
          </Text>
        </Stack>

        <Text size="sm" c="dimmed">
          {query.data.tong.toLocaleString('vi-VN')} đơn hàng
        </Text>
      </Group>

      {thanhToanNgayMutation.isError ? (
        <Alert color="orange" title="Chưa thể mở thanh toán">
          {thanhToanNgayMutation.error instanceof Error
            ? thanhToanNgayMutation.error.message
            : 'Không thể mở phiên thanh toán lúc này.'}
        </Alert>
      ) : null}

      <Paper withBorder p="sm" radius="lg" className="agri-surface">
        <Group gap="xs" wrap="wrap" aria-label="Lọc nhanh theo trạng thái">
          <Button
            size="xs"
            radius="md"
            variant={trangThai === null ? 'filled' : 'light'}
            color="agrimarket"
            onClick={() => {
              setTrangThai(null);
              setTrang(1);
            }}
          >
            {tieuDeChip(dem?.tatCa, 'Tất cả')}
          </Button>

          {LUA_CHON_TRANG_THAI_DON_HANG.map((luaChon) => (
            <Button
              key={luaChon.value}
              size="xs"
              radius="md"
              variant={trangThai === luaChon.value ? 'filled' : 'light'}
              color={luaChon.value === 'DA_HUY' ? 'red' : 'agrimarket'}
              onClick={() => {
                setTrangThai(luaChon.value as TrangThaiDonHangLoc);
                setTrang(1);
              }}
            >
              {tieuDeChip(dem?.theoTrangThai[luaChon.value], luaChon.label)}
            </Button>
          ))}
        </Group>

        {/* Mobile có select để chọn nhanh; desktop không hiển thị bộ lọc trùng lặp. */}
        <Box hiddenFrom="md" mt="sm">
          <Select
            placeholder="Tất cả trạng thái"
            clearable
            data={LUA_CHON_TRANG_THAI_DON_HANG}
            value={trangThai}
            onChange={(value) => {
              setTrangThai(value as TrangThaiDonHangLoc | null);
              setTrang(1);
            }}
          />
        </Box>
      </Paper>

      {query.data.duLieu.length === 0 ? (
        trangThai ? (
          <EmptyState
            tieuDe="Không có đơn hàng ở trạng thái này"
            moTa="Thử chọn trạng thái khác hoặc xem tất cả đơn hàng."
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
                <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                  Khám phá sản phẩm
                </Button>
              </Group>
            }
          />
        ) : (
          <EmptyState
            tieuDe="Bạn chưa có đơn hàng nào"
            moTa="Khám phá nông sản sạch và đặt đơn đầu tiên của bạn."
            hanhDong={
              <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                Khám phá sản phẩm
              </Button>
            }
          />
        )
      ) : (
        <SimpleGrid cols={{ base: 1 }} spacing="md">
          {query.data.duLieu.map((order) => {
            const muc = order.mucDaiDien;
            const soMucConLai = Math.max(0, order.soMuc - 1);
            const choThanhToan = order.trangThai === 'CHO_THANH_TOAN';

            return (
              <Paper
                key={order.id}
                withBorder
                className="agri-surface"
                p={0}
                radius="lg"
                style={{ overflow: 'hidden' }}
              >
                <Stack gap={0}>
                  <Group
                    justify="space-between"
                    align="center"
                    gap="sm"
                    wrap="wrap"
                    px={{ base: 'md', md: 'lg' }}
                    py="sm"
                  >
                    <Stack gap={3} style={{ minWidth: 0 }}>
                      <Group gap={6} wrap="nowrap">
                        <Text
                          size="sm"
                          fw={850}
                          title={order.maDonHang}
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          }}
                        >
                          {maDonHangHienThi(order.maDonHang)}
                        </Text>

                        <CopyButton value={order.maDonHang} timeout={1500}>
                          {({ copied, copy }) => (
                            <Tooltip
                              label={copied ? 'Đã sao chép' : 'Sao chép mã đơn đầy đủ'}
                              withArrow
                            >
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

                    <Badge color={mauTrangThai(order.trangThai)} variant="light" radius="sm">
                      {nhanTrangThaiDonHang(order.trangThai)}
                    </Badge>
                  </Group>

                  <Divider />

                  <Group
                    justify="space-between"
                    align="center"
                    gap="lg"
                    wrap="wrap"
                    px={{ base: 'md', md: 'lg' }}
                    py="md"
                  >
                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                      <ThemeIcon
                        size={58}
                        radius="md"
                        variant="light"
                        color="agrimarket"
                        style={{ flex: '0 0 auto' }}
                      >
                        <IconPackage size={27} />
                      </ThemeIcon>

                      <Stack gap={3} style={{ minWidth: 0 }}>
                        <Text fw={850} lineClamp={1}>
                          {muc?.tenSanPham ?? `${order.soMuc.toLocaleString('vi-VN')} sản phẩm`}
                        </Text>

                        {muc ? (
                          <>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              Trang trại {muc.tenTrangTrai}
                            </Text>
                            <Text size="sm" c="dimmed">
                              Số lượng {muc.soLuong.toLocaleString('vi-VN')} · Quy cách{' '}
                              {dinhDangSo(muc.khoiLuong)} {muc.donVi} · {dinhDangGia(muc.donGia)} ₫
                            </Text>
                          </>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {order.soNhaCungCap.toLocaleString('vi-VN')} nhà cung cấp ·{' '}
                            {order.soMuc.toLocaleString('vi-VN')} sản phẩm
                          </Text>
                        )}

                        {soMucConLai > 0 ? (
                          <Text size="xs" c="agrimarket.7" fw={700}>
                            +{soMucConLai.toLocaleString('vi-VN')} sản phẩm khác
                          </Text>
                        ) : null}
                      </Stack>
                    </Group>

                    <Stack gap={7} align="flex-end">
                      <Text size="xs" c="dimmed">
                        Tổng thanh toán
                      </Text>
                      <Text fw={900} fz={24} c="agrimarket.8">
                        {dinhDangGia(order.tongTien)} ₫
                      </Text>
                    </Stack>
                  </Group>

                  <Divider />

                  <Group justify="flex-end" gap="sm" px={{ base: 'md', md: 'lg' }} py="sm">
                    {choThanhToan ? (
                      <Button
                        size="sm"
                        color="agrimarket"
                        leftSection={<IconCreditCard size={16} />}
                        loading={
                          thanhToanNgayMutation.isPending &&
                          thanhToanNgayMutation.variables === order.id
                        }
                        disabled={
                          thanhToanNgayMutation.isPending &&
                          thanhToanNgayMutation.variables !== order.id
                        }
                        onClick={() => thanhToanNgayMutation.mutate(order.id)}
                      >
                        Thanh toán ngay
                      </Button>
                    ) : null}

                    <Button
                      component={Link}
                      href={`/don-hang/${order.id}`}
                      variant={choThanhToan ? 'default' : 'light'}
                      color={choThanhToan ? undefined : 'agrimarket'}
                      size="sm"
                      rightSection={<IconArrowRight size={16} />}
                    >
                      Xem chi tiết
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {query.data.tong > GIOI_HAN ? (
        <Group justify="center">
          <Pagination value={trang} onChange={setTrang} total={tongTrang} color="agrimarket" />
        </Group>
      ) : null}
    </Stack>
  );
}
