'use client';

// AUTO_VOUCHER_PROMO_CENTER_V1
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBolt, IconCheck, IconClock, IconTicket } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import {
  KHUYEN_MAI_CONG_KHAI_QUERY_KEY,
  KHUYEN_MAI_DA_LUU_QUERY_KEY,
  layKhuyenMaiCongKhaiKhach,
  layKhuyenMaiDaLuuKhach,
  luuKhuyenMaiKhach,
  type KhuyenMaiKhachHang,
} from '@/lib/api-khuyen-mai-khach';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

function dinhDangThoiGian(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function nhanPhamVi(value: KhuyenMaiKhachHang['phamVi']): string {
  if (value === 'PLATFORM') return 'Toàn sàn';
  if (value === 'DANH_MUC') return 'Theo danh mục';
  return 'Theo sản phẩm';
}

export function DanhSachKhuyenMaiContent() {
  const queryClient = useQueryClient();
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';

  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  const voucherQuery = useQuery({
    queryKey: KHUYEN_MAI_CONG_KHAI_QUERY_KEY,
    queryFn: layKhuyenMaiCongKhaiKhach,
    staleTime: 30_000,
  });
  const daLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  const luuMutation = useMutation({
    mutationFn: luuKhuyenMaiKhach,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_CONG_KHAI_QUERY_KEY }),
      ]);
    },
  });

  const idsDaLuu = useMemo(
    () => new Set((daLuuQuery.data ?? []).map((item) => item.id)),
    [daLuuQuery.data],
  );

  const chienDich = useMemo(
    () => flashSaleQuery.data?.data ?? [],
    [flashSaleQuery.data],
  );
  const tongMuc = useMemo(
    () => chienDich.reduce((tong, cd) => tong + (cd.muc?.length ?? 0), 0),
    [chienDich],
  );

  return (
    <Box className="agri-page market-promo-page">
      <AgriContainer py={{ base: 18, md: 28 }}>
        <Stack gap="xl">
          <Group
            className="market-promo-toolbar"
            justify="space-between"
            align="center"
            gap="md"
            wrap="wrap"
          >
            <Stack gap={5}>
              <Breadcrumbs fz="xs" aria-label="Điều hướng trang khuyến mãi">
                <Anchor component={Link} href="/" c="dimmed">
                  Trang chủ
                </Anchor>
                <Text c="dark.7" fw={650}>
                  Khuyến mãi
                </Text>
              </Breadcrumbs>
              <Title order={1} fz={{ base: 23, sm: 27 }} fw={850}>
                Khuyến mãi
              </Title>
            </Stack>
            <Button component={Link} href="/gio-hang" variant="subtle" color="agrimarket">
              Xem giỏ hàng
            </Button>
          </Group>

          <Stack gap="md">
            <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Group gap="xs">
                  <ThemeIcon variant="light" color="agrimarket" size={34} radius="md">
                    <IconTicket size={18} />
                  </ThemeIcon>
                  <Title order={2} fz="lg">
                    Mã giảm giá
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Lưu voucher vào tài khoản, sau đó chọn trực tiếp khi thanh toán.
                </Text>
              </Stack>
              {daDangNhap ? (
                <Text size="xs" c="dimmed">
                  {idsDaLuu.size} mã đang có trong ví
                </Text>
              ) : null}
            </Group>

            {voucherQuery.isPending ? (
              <AgriSkeleton soLuong={3} />
            ) : voucherQuery.isError ? (
              <ErrorState
                tieuDe="Không tải được voucher"
                moTa="Hãy thử lại sau ít phút."
                onThuLai={() => void voucherQuery.refetch()}
              />
            ) : (voucherQuery.data?.length ?? 0) === 0 ? (
              <EmptyState
                tieuDe="Chưa có voucher đang phát hành"
                moTa="Voucher mới sẽ xuất hiện tại đây khi chương trình bắt đầu."
              />
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {voucherQuery.data?.map((voucher) => {
                  const daLuu = idsDaLuu.has(voucher.id);
                  const dangLuu = luuMutation.isPending && luuMutation.variables === voucher.id;
                  return (
                    <Paper key={voucher.id} withBorder className="market-voucher-card" p={0}>
                      <Group wrap="nowrap" align="stretch" gap={0} h="100%">
                        <Box className="market-voucher-card__mark">
                          <IconTicket size={28} />
                          <Text fw={900} size="xs">
                            AGRI
                          </Text>
                        </Box>
                        <Stack gap={7} p="md" style={{ flex: 1, minWidth: 0 }}>
                          <Group justify="space-between" gap="sm" wrap="nowrap">
                            <Text fw={900} fz="lg" c="agrimarket.8">
                              Giảm {dinhDangTien(voucher.giaTriGiam)}
                            </Text>
                            <Badge variant="light" color="green" radius="sm">
                              {nhanPhamVi(voucher.phamVi)}
                            </Badge>
                          </Group>

                          <Text fw={800} lineClamp={1}>
                            {voucher.ten}
                          </Text>
                          {voucher.moTa ? (
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {voucher.moTa}
                            </Text>
                          ) : null}

                          <Group gap="xs" wrap="wrap">
                            <Badge variant="outline" color="gray" radius="sm">
                              {voucher.ma}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {voucher.donHangToiThieu > 0
                                ? `Đơn tối thiểu ${dinhDangTien(voucher.donHangToiThieu)}`
                                : 'Không yêu cầu đơn tối thiểu'}
                            </Text>
                          </Group>

                          <Group justify="space-between" align="center" mt="auto" gap="sm" wrap="wrap">
                            <Group gap={5}>
                              <IconClock size={14} color="#64748B" />
                              <Text size="xs" c="dimmed">
                                HSD {dinhDangThoiGian(voucher.ketThucLuc)}
                              </Text>
                            </Group>

                            {!daDangNhap ? (
                              <Button
                                component={Link}
                                href="/dang-nhap?next=/khuyen-mai"
                                size="xs"
                                variant="light"
                                color="agrimarket"
                              >
                                Đăng nhập để lưu
                              </Button>
                            ) : daLuu ? (
                              <Button
                                size="xs"
                                variant="light"
                                color="green"
                                leftSection={<IconCheck size={15} />}
                                disabled
                              >
                                Đã lưu
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="agrimarket"
                                loading={dangLuu}
                                disabled={luuMutation.isPending && !dangLuu}
                                onClick={() => luuMutation.mutate(voucher.id)}
                              >
                                Lưu mã
                              </Button>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>

          <Stack gap="md">
            <Group gap="xs">
              <IconBolt size={22} color="#E53935" fill="#E53935" />
              <Title order={2} fz="lg" c="#C62828">
                Flash Sale
              </Title>
            </Group>

            {flashSaleQuery.isPending ? (
              <AgriSkeleton soLuong={6} />
            ) : flashSaleQuery.isError ? (
              <ErrorState
                tieuDe="Không tải được Flash Sale"
                moTa="Chương trình giảm giá đang tạm thời không khả dụng."
                onThuLai={() => void flashSaleQuery.refetch()}
              />
            ) : chienDich.length === 0 || tongMuc === 0 ? (
              <Paper withBorder p="lg" className="market-promo-empty">
                <Text size="sm" c="dimmed">
                  Hiện chưa có sản phẩm Flash Sale.
                </Text>
              </Paper>
            ) : (
              <Stack gap="xl">
                {chienDich.map((cd) => {
                  if (!cd.muc || cd.muc.length === 0) return null;
                  return (
                    <Stack key={cd.id} gap="md">
                      <Stack gap={2}>
                        <Text fw={900} fz={17} c="#C62828">
                          {cd.ten}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          {cd.moTa ? (
                            <Text size="sm" c="dimmed">
                              {cd.moTa}
                            </Text>
                          ) : null}
                          <Text size="sm" c="dimmed">
                            {`${dinhDangThoiGian(cd.batDauLuc)} – ${dinhDangThoiGian(cd.ketThucLuc)}`}
                          </Text>
                        </Group>
                      </Stack>

                      <Box
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                          gap: 10,
                          alignItems: 'stretch',
                        }}
                      >
                        {cd.muc.map((muc) => {
                          const hetHang = muc.soLuongKhaDung <= 0;
                          return (
                            <Paper
                              key={muc.bienTheSanPhamId}
                              component={Link}
                              href={`/san-pham/${muc.sanPhamId}`}
                              bg="white"
                              withBorder
                              p={8}
                              radius="sm"
                              pos="relative"
                              h="100%"
                              className="market-flash-card"
                              style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 0,
                              }}
                            >
                              <Badge
                                pos="absolute"
                                top={8}
                                left={8}
                                bg="#E53935"
                                c="white"
                                radius={4}
                                size="sm"
                                fw={800}
                                styles={{ root: { zIndex: 2 } }}
                              >
                                {`-${muc.phanTramGiam}%`}
                              </Badge>

                              <Box
                                h={115}
                                style={{
                                  display: 'grid',
                                  placeItems: 'center',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                                  fallbackSrc={anhDuPhongSanPham(muc.ten)}
                                  alt={muc.ten}
                                  h={105}
                                  w="100%"
                                  fit="contain"
                                />
                              </Box>

                              <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                                <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.35}>
                                  {muc.ten}
                                </Text>
                                <Text size="11px" c="dimmed" lineClamp={1}>
                                  {`${muc.trangTrai.ten} · ${muc.khoiLuong} ${muc.donVi}`}
                                </Text>

                                <Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap">
                                  <Stack gap={0}>
                                    <Text fw={900} fz={13.5} c="#0B7A48">
                                      {dinhDangTien(muc.giaFlash)}
                                    </Text>
                                    <Text size="10px" c="dimmed" td="line-through">
                                      {dinhDangTien(muc.giaGoc)}
                                    </Text>
                                  </Stack>
                                  {hetHang ? (
                                    <Badge size="xs" radius={4} bg="#F1F5F2" c="#64748B">
                                      Hết hàng
                                    </Badge>
                                  ) : null}
                                </Group>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
