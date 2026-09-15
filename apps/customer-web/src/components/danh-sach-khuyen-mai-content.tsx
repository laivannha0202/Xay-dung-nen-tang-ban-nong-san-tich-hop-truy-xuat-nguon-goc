'use client';

import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Image,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { PageHeader } from './web-page';

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

export function DanhSachKhuyenMaiContent() {
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();

  const chienDich = useMemo(
    () => flashSaleQuery.data?.data ?? [],
    [flashSaleQuery.data],
  );
  const tongMuc = useMemo(
    () => chienDich.reduce((tong, cd) => tong + (cd.muc?.length ?? 0), 0),
    [chienDich],
  );

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Ưu đãi AgriMarket"
        title="Khuyến mãi"
        description={
          flashSaleQuery.isSuccess
            ? tongMuc > 0
              ? `${tongMuc} sản phẩm đang giảm giá Flash Sale từ các trang trại.`
              : undefined
            : 'Sản phẩm giảm giá Flash Sale từ các trang trại.'
        }
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng trang khuyến mãi">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              Khuyến mãi
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        {flashSaleQuery.isPending ? (
          <AgriSkeleton soLuong={6} />
        ) : flashSaleQuery.isError ? (
          <ErrorState
            tieuDe="Không tải được khuyến mãi"
            moTa="Chương trình giảm giá đang tạm thời không khả dụng."
            onThuLai={() => void flashSaleQuery.refetch()}
          />
        ) : chienDich.length === 0 || tongMuc === 0 ? (
          <EmptyState
            tieuDe="Chưa có khuyến mãi đang diễn ra"
            moTa="Hiện chưa có chiến dịch Flash Sale nào. Hãy quay lại sau hoặc xem toàn bộ nông sản."
            hanhDong={
              <Button component={Link} href="/san-pham" variant="light" color="agrimarket">
                Xem nông sản
              </Button>
            }
          />
        ) : (
          <Stack gap="xl">
            {chienDich.map((cd) => {
              if (!cd.muc || cd.muc.length === 0) return null;
              return (
                <Stack key={cd.id} gap="md">
                  <Stack gap={2}>
                    <Group gap="sm" align="center">
                      <IconBolt size={20} color="#E53935" fill="#E53935" />
                      <Text fw={900} fz={18} c="#E53935">
                        {cd.ten}
                      </Text>
                    </Group>
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
                          style={{
                            borderColor: '#DDE8DF',
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
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

                            <Group
                              justify="space-between"
                              align="flex-end"
                              mt="auto"
                              pt={4}
                              wrap="nowrap"
                              style={{ minWidth: 0 }}
                            >
                              <Stack gap={0} style={{ minWidth: 0 }}>
                                <Text fw={900} fz={13.5} c="#0B7A48" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                                  {dinhDangTien(muc.giaFlash)}
                                </Text>
                                <Text size="10px" c="dimmed" td="line-through" lh={1.1}>
                                  {dinhDangTien(muc.giaGoc)}
                                </Text>
                              </Stack>

                              {hetHang ? (
                                <Badge size="xs" radius={4} bg="#F1F5F2" c="#64748B" style={{ flexShrink: 0 }}>
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
      </AgriContainer>
    </Box>
  );
}
