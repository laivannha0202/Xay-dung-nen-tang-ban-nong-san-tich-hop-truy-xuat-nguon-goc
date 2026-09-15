'use client';

// AGRIMARKET_FLASH_SALE_COMPACT_V3
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import {
  Badge,
  Box,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBolt, IconClock } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
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

function tenChienDich(ten: string): string {
  return /demo|flash-sale-demo/i.test(ten) ? 'Flash Sale Nông Sản Tươi' : ten;
}

function quyCach(khoiLuong: number, donVi: string): string {
  return `${khoiLuong} ${donVi}`;
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

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 24, md: 36 }}>
        {flashSaleQuery.isPending ? (
          <AgriSkeleton soLuong={8} />
        ) : flashSaleQuery.isError ? (
          <ErrorState
            tieuDe="Không tải được khuyến mãi"
            moTa="Chương trình giảm giá đang tạm thời không khả dụng."
            onThuLai={() => void flashSaleQuery.refetch()}
          />
        ) : chienDich.length === 0 ? (
          <EmptyState
            tieuDe="Chưa có Flash Sale"
            moTa="Hiện chưa có chương trình giảm giá đang diễn ra."
          />
        ) : (
          <Stack gap={30}>
            {chienDich.map((cd) => {
              if (!cd.muc?.length) return null;

              return (
                <Stack key={cd.id} gap="md">
                  {/* Chỉ 1 header gọn cho campaign, không lặp breadcrumb/mô tả/thời gian */}
                  <Group
                    justify="space-between"
                    align="center"
                    gap="md"
                    wrap="wrap"
                    pb="sm"
                    style={{ borderBottom: '1px solid #e3ebe6' }}
                  >
                    <Group gap="sm">
                      <ThemeIcon
                        size={34}
                        radius="xl"
                        color="red"
                        variant="light"
                      >
                        <IconBolt size={19} fill="currentColor" />
                      </ThemeIcon>

                      <Title
                        order={1}
                        fz={{ base: 22, md: 28 }}
                        c="#173126"
                        fw={800}
                      >
                        {tenChienDich(cd.ten)}
                      </Title>
                    </Group>

                    <Group gap={7}>
                      <IconClock size={16} color="#64748b" />
                      <Text size="sm" c="dimmed">
                        Kết thúc sau
                      </Text>
                      <Badge
                        color="red"
                        radius="md"
                        size="lg"
                        styles={{
                          root: {
                            fontVariantNumeric: 'tabular-nums',
                          },
                        }}
                      >
                        {demNguoc(cd.ketThucLuc, nowMs)}
                      </Badge>
                    </Group>
                  </Group>

                  {/* 4 sản phẩm => đúng 4 cột desktop, không chừa cột trống thứ 5 */}
                  <SimpleGrid
                    cols={{ base: 1, xs: 2, sm: 2, md: 4 }}
                    spacing={{ base: 'sm', md: 'md' }}
                  >
                    {cd.muc.map((muc) => {
                      const hetHang = muc.soLuongKhaDung <= 0;
                      const conLai = Math.max(0, Math.floor(muc.soLuongKhaDung));

                      return (
                        <Card
                          key={muc.bienTheSanPhamId}
                          component={Link}
                          href={`/san-pham/${muc.sanPhamId}`}
                          padding={0}
                          radius="lg"
                          withBorder
                          style={{
                            overflow: 'hidden',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderColor: '#dfe7e2',
                            boxShadow: '0 4px 14px rgba(18, 53, 32, 0.05)',
                            opacity: hetHang ? 0.72 : 1,
                            transition:
                              'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                          }}
                        >
                          <Box
                            pos="relative"
                            h={{ base: 210, sm: 190, md: 205 }}
                            style={{
                              overflow: 'hidden',
                              background: '#f3f7f4',
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
                              color="red"
                              size="lg"
                              radius="md"
                              fw={900}
                            >
                              {`-${muc.phanTramGiam}%`}
                            </Badge>

                            {hetHang ? (
                              <Badge
                                pos="absolute"
                                top={10}
                                right={10}
                                color="gray"
                                variant="filled"
                              >
                                Hết suất
                              </Badge>
                            ) : null}
                          </Box>

                          <Stack gap={7} p="md">
                            <Text
                              fw={800}
                              fz={15}
                              c="#17251c"
                              lineClamp={2}
                              mih={40}
                            >
                              {muc.ten}
                            </Text>

                            {/* Gộp farm + quy cách vào 1 dòng thay vì 3-4 dòng lặp */}
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {`${muc.trangTrai.ten} · ${quyCach(
                                muc.khoiLuong,
                                muc.donVi,
                              )}`}
                            </Text>

                            <Group gap={8} align="baseline" wrap="wrap" mt={2}>
                              <Text fw={900} fz={20} c="#087A4B">
                                {dinhDangTien(muc.giaFlash)}
                              </Text>
                              <Text size="xs" c="dimmed" td="line-through">
                                {dinhDangTien(muc.giaGoc)}
                              </Text>
                            </Group>

                            {/* Chỉ báo stock khi thực sự đáng chú ý, không lặp "Còn 100" */}
                            {!hetHang && conLai <= 5 ? (
                              <Text size="xs" fw={700} c="red.7">
                                {`Chỉ còn ${conLai}`}
                              </Text>
                            ) : null}
                          </Stack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Stack>
              );
            })}
          </Stack>
        )}
      </AgriContainer>
    </Box>
  );
}
