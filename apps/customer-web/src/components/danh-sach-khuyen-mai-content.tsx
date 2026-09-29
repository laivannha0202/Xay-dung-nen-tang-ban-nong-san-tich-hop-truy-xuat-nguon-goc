'use client';

// AGRIMARKET_FLASH_SALE_CARD_WITH_CTA_V2
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { TrungTamVoucher } from './trung-tam-voucher';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

function tenChienDich(ten: string): string {
  return /demo|flash-sale-demo/i.test(ten) ? 'Flash Sale Nông Sản Tươi' : ten;
}

export function DanhSachKhuyenMaiContent() {
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();

  const chienDich = useMemo(() => flashSaleQuery.data?.data ?? [], [flashSaleQuery.data]);

  const chienDichCoSanPham = useMemo(() => chienDich.filter((cd) => cd.muc?.length), [chienDich]);

  return (
    <Box className="agri-page">
      <AgriContainer py={{ base: 24, md: 34 }}>
        <TrungTamVoucher />
        {flashSaleQuery.isPending ? (
          <AgriSkeleton soLuong={4} />
        ) : flashSaleQuery.isError ? (
          <ErrorState
            tieuDe="Không tải được Flash Sale"
            moTa="Vui lòng thử lại sau."
            onThuLai={() => void flashSaleQuery.refetch()}
          />
        ) : chienDichCoSanPham.length === 0 ? (
          <EmptyState tieuDe="Chưa có Flash Sale" moTa="Hiện chưa có sản phẩm giảm giá." />
        ) : (
          <Stack gap={30}>
            {chienDichCoSanPham.map((cd) => (
              <Stack key={cd.id} gap="md">
                <Group gap={8} align="center">
                  <IconBolt size={20} color="#dc2626" fill="#dc2626" />
                  <Title order={2} fz={{ base: 20, md: 24 }} fw={800} c="#173126">
                    {tenChienDich(cd.ten)}
                  </Title>
                </Group>

                <Box h={1} bg="#d9e2dc" maw={420} />

                <SimpleGrid
                  cols={{ base: 1, xs: 2, sm: 2, md: 4 }}
                  spacing={{ base: 'sm', md: 'md' }}
                >
                  {cd.muc.map((muc) => (
                    <Card
                      key={muc.bienTheSanPhamId}
                      padding={0}
                      radius="md"
                      withBorder
                      style={{
                        overflow: 'hidden',
                        borderColor: '#dfe7e2',
                        boxShadow: '0 3px 12px rgba(18, 53, 32, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box
                        pos="relative"
                        h={{ base: 210, sm: 190, md: 200 }}
                        style={{
                          overflow: 'hidden',
                          background: '#f3f7f4',
                        }}
                      >
                        <Link
                          href={`/san-pham/${muc.sanPhamId}`}
                          style={{ display: 'block', width: '100%', height: '100%' }}
                        >
                          <Image
                            src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                            alt={muc.ten}
                            w="100%"
                            h="100%"
                            fit="cover"
                          />
                        </Link>

                        <Badge
                          pos="absolute"
                          top={10}
                          left={10}
                          color="red"
                          size="md"
                          radius="sm"
                          fw={800}
                        >
                          {`-${muc.phanTramGiam}%`}
                        </Badge>
                      </Box>

                      <Stack gap={8} p="sm" style={{ flex: 1 }}>
                        <Text
                          component={Link}
                          href={`/san-pham/${muc.sanPhamId}`}
                          fw={800}
                          fz={15}
                          c="#17251c"
                          lineClamp={2}
                          style={{ textDecoration: 'none' }}
                        >
                          {muc.ten}
                        </Text>

                        <Group gap={7} align="baseline" wrap="wrap">
                          <Text fw={900} fz={18} c="#087A4B">
                            {dinhDangTien(muc.giaFlash)}
                          </Text>
                          <Text size="xs" c="dimmed" td="line-through">
                            {dinhDangTien(muc.giaGoc)}
                          </Text>
                        </Group>

                        <Button
                          component={Link}
                          href={`/san-pham/${muc.sanPhamId}`}
                          fullWidth
                          mt="auto"
                          color="agrimarket"
                          radius="sm"
                        >
                          Xem sản phẩm
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            ))}
          </Stack>
        )}
      </AgriContainer>
    </Box>
  );
}
