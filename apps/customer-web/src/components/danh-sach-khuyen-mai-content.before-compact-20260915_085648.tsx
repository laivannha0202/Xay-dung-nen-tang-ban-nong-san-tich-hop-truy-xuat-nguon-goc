'use client';

// AGRIMARKET_FLASH_SALE_MARKETPLACE_V2
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBolt,
  IconBuildingStore,
  IconClock,
  IconPackage,
  IconShoppingCart,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function demNguoc(value: string, nowMs: number): string {
  const end = new Date(value).getTime();
  if (!Number.isFinite(end)) return 'Đang diễn ra';

  const diff = Math.max(0, end - nowMs);
  if (diff <= 0) return 'Đã kết thúc';

  const tongGiay = Math.floor(diff / 1000);
  const ngay = Math.floor(tongGiay / 86_400);
  const gio = Math.floor((tongGiay % 86_400) / 3_600);
  const phut = Math.floor((tongGiay % 3_600) / 60);
  const giay = tongGiay % 60;
  const hh = String(gio).padStart(2, '0');
  const mm = String(phut).padStart(2, '0');
  const ss = String(giay).padStart(2, '0');

  return ngay > 0 ? `${ngay} ngày ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

function tenChienDichHienThi(ten: string): string {
  return /demo|flash-sale-demo/i.test(ten) ? 'Flash Sale nông sản tươi' : ten;
}

function moTaChienDichHienThi(moTa: string | null | undefined): string {
  if (!moTa || /demo|dữ liệu mẫu|dữ liệu demo/i.test(moTa)) {
    return 'Ưu đãi có thời hạn từ các trang trại trên AgriMarket. Giá và tồn khả dụng được chốt từ hệ thống.';
  }
  return moTa;
}

export function DanhSachKhuyenMaiContent() {
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
              ? `${tongMuc} sản phẩm đang có giá Flash Sale từ các trang trại.`
              : undefined
            : 'Sản phẩm Flash Sale từ các trang trại.'
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

      <AgriContainer py={{ base: 24, md: 38 }}>
        {flashSaleQuery.isPending ? (
          <AgriSkeleton soLuong={10} />
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
          <Stack gap={32}>
            {chienDich.map((cd) => {
              if (!cd.muc || cd.muc.length === 0) return null;

              return (
                <Box key={cd.id}>
                  <Box
                    p={{ base: 'md', md: 'lg' }}
                    mb="md"
                    style={{
                      border: '1px solid #f1caca',
                      borderRadius: 16,
                      background:
                        'linear-gradient(135deg, #fff8f7 0%, #fff 48%, #f5fbf7 100%)',
                      boxShadow: '0 8px 28px rgba(90, 35, 28, 0.06)',
                    }}
                  >
                    <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
                      <Stack gap={7}>
                        <Group gap="sm">
                          <ThemeIcon
                            size={36}
                            radius="xl"
                            color="red"
                            variant="light"
                          >
                            <IconBolt size={21} fill="currentColor" />
                          </ThemeIcon>
                          <Stack gap={0}>
                            <Text size="xs" fw={800} c="red.7" tt="uppercase">
                              Đang diễn ra
                            </Text>
                            <Title order={2} fz={{ base: 20, md: 24 }} c="#7f1d1d">
                              {tenChienDichHienThi(cd.ten)}
                            </Title>
                          </Stack>
                        </Group>

                        <Text size="sm" c="dimmed" maw={760} lh={1.55}>
                          {moTaChienDichHienThi(cd.moTa)}
                        </Text>

                        <Text size="xs" c="dimmed">
                          {`${dinhDangThoiGian(cd.batDauLuc)} – ${dinhDangThoiGian(cd.ketThucLuc)}`}
                        </Text>
                      </Stack>

                      <Stack gap={5} align="flex-end">
                        <Text size="xs" fw={700} c="dimmed">
                          Kết thúc sau
                        </Text>
                        <Badge
                          size="xl"
                          radius="md"
                          color="red"
                          variant="filled"
                          leftSection={<IconClock size={15} />}
                          styles={{
                            root: {
                              fontVariantNumeric: 'tabular-nums',
                              letterSpacing: '0.03em',
                            },
                          }}
                        >
                          {demNguoc(cd.ketThucLuc, nowMs)}
                        </Badge>
                      </Stack>
                    </Group>
                  </Box>

                  <SimpleGrid
                    cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
                    spacing={{ base: 'sm', md: 'md' }}
                    verticalSpacing={{ base: 'sm', md: 'md' }}
                  >
                    {cd.muc.map((muc) => {
                      const hetHang = muc.soLuongKhaDung <= 0;
                      const tietKiem = Math.max(0, muc.giaGoc - muc.giaFlash);
                      const conLai = Math.max(0, Math.floor(muc.soLuongKhaDung));

                      return (
                        <Card
                          key={muc.bienTheSanPhamId}
                          withBorder
                          padding={0}
                          radius="lg"
                          style={{
                            overflow: 'hidden',
                            borderColor: hetHang ? '#e2e8f0' : '#dbe8df',
                            boxShadow: '0 4px 16px rgba(20, 56, 35, 0.06)',
                            opacity: hetHang ? 0.82 : 1,
                          }}
                        >
                          <Box
                            pos="relative"
                            h={{ base: 190, sm: 180, md: 185 }}
                            style={{
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              background: '#f3f8f4',
                            }}
                          >
                            <Image
                              src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                              alt={muc.ten}
                              w="100%"
                              h="100%"
                              fit="cover"
                            />

                            <Badge
                              pos="absolute"
                              top={10}
                              left={10}
                              size="lg"
                              radius="md"
                              color="red"
                              fw={900}
                            >
                              {`-${muc.phanTramGiam}%`}
                            </Badge>

                            {hetHang ? (
                              <Badge
                                pos="absolute"
                                top={10}
                                right={10}
                                size="md"
                                radius="md"
                                color="gray"
                                variant="filled"
                              >
                                Đã hết suất
                              </Badge>
                            ) : null}
                          </Box>

                          <Stack gap={8} p="md" style={{ flex: 1 }}>
                            <Text
                              component={Link}
                              href={`/san-pham/${muc.sanPhamId}`}
                              fw={800}
                              fz={15}
                              c="#173126"
                              lineClamp={2}
                              mih={40}
                              style={{ textDecoration: 'none' }}
                            >
                              {muc.ten}
                            </Text>

                            <Group gap={6} wrap="nowrap">
                              <IconBuildingStore size={14} color="#087A4B" />
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {muc.trangTrai.ten}
                              </Text>
                            </Group>

                            <Group gap={6} wrap="nowrap">
                              <IconPackage size={14} color="#64748B" />
                              <Text size="xs" c="dimmed">
                                {`${muc.khoiLuong} ${muc.donVi}`}
                              </Text>
                            </Group>

                            {muc.chungNhan?.length ? (
                              <Group gap={5}>
                                {muc.chungNhan.slice(0, 2).map((cn) => (
                                  <Badge
                                    key={cn.loai}
                                    size="xs"
                                    color="green"
                                    variant="light"
                                    tt="none"
                                  >
                                    {cn.loai}
                                  </Badge>
                                ))}
                              </Group>
                            ) : null}

                            <Divider my={2} />

                            <Stack gap={2}>
                              <Group gap={7} align="baseline" wrap="wrap">
                                <Text fw={900} fz={20} c="#087A4B" lh={1.1}>
                                  {dinhDangTien(muc.giaFlash)}
                                </Text>
                                <Text size="xs" c="dimmed" td="line-through">
                                  {dinhDangTien(muc.giaGoc)}
                                </Text>
                              </Group>
                              {tietKiem > 0 ? (
                                <Text size="xs" c="red.7" fw={700}>
                                  {`Tiết kiệm ${dinhDangTien(tietKiem)}`}
                                </Text>
                              ) : null}
                            </Stack>

                            <Text
                              size="xs"
                              fw={700}
                              c={hetHang ? 'gray.6' : conLai <= 5 ? 'red.7' : 'green.7'}
                            >
                              {hetHang
                                ? 'Flash Sale đã hết suất'
                                : conLai <= 5
                                  ? `Chỉ còn ${conLai}`
                                  : `Còn ${conLai} sản phẩm`}
                            </Text>

                            {hetHang ? (
                              <Button
                                fullWidth
                                mt="auto"
                                variant="light"
                                color="gray"
                                disabled
                                leftSection={<IconShoppingCart size={16} />}
                              >
                                Đã hết suất
                              </Button>
                            ) : (
                              <Button
                                component={Link}
                                href={`/san-pham/${muc.sanPhamId}`}
                                fullWidth
                                mt="auto"
                                color="agrimarket"
                                leftSection={<IconShoppingCart size={16} />}
                              >
                                Xem ưu đãi
                              </Button>
                            )}
                          </Stack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              );
            })}
          </Stack>
        )}
      </AgriContainer>
    </Box>
  );
}
