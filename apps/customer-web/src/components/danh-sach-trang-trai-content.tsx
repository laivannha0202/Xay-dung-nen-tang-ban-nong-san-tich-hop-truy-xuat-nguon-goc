'use client';

import { useLayFacetsSanPhamCongKhai } from '@agrimarket/api-client';
import { Badge, Box, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight, IconBuildingStore, IconLeaf, IconShoppingBag } from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BusinessNote, PageHeader } from './web-page';

export function DanhSachTrangTraiContent() {
  const query = useLayFacetsSanPhamCongKhai();
  const farms = query.data?.data?.trangTrai ?? [];

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Nguồn cung AgriMarket"
        title="Khám phá trang trại"
        description="Danh sách được tạo từ các trang trại đang có nông sản công khai trên AgriMarket. Mở trang trại để xem thông tin nguồn cung hoặc lọc ngay sản phẩm của trang trại đó."
        actions={
          <Button component={Link} href="/san-pham" color="agrimarket" leftSection={<IconShoppingBag size={17} />}>
            Xem tất cả nông sản
          </Button>
        }
        meta={
          <Badge color="agrimarket" variant="light">
            {farms.length} trang trại có sản phẩm công khai
          </Badge>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="xl">
          <BusinessNote icon={<IconLeaf size={18} color="#087A4B" />}>
            Số sản phẩm trên từng thẻ phản ánh dữ liệu sản phẩm công khai hiện tại. Trang trại không có sản phẩm công khai sẽ không xuất hiện ở danh sách này.
          </BusinessNote>

          {query.isPending ? (
            <AgriSkeleton soLuong={6} />
          ) : query.isError ? (
            <ErrorState
              tieuDe="Chưa thể tải danh sách trang trại"
              moTa="Hệ thống chưa trả về dữ liệu nguồn cung công khai. Hãy thử đồng bộ lại."
              onThuLai={() => void query.refetch()}
            />
          ) : farms.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có trang trại công khai"
              moTa="Trang trại sẽ xuất hiện tại đây khi có sản phẩm được công khai trên AgriMarket."
              hanhDong={<Button component={Link} href="/san-pham" variant="light" color="agrimarket">Xem nông sản</Button>}
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {farms.map((farm) => (
                <Card key={farm.value} withBorder className="agri-surface" padding="xl">
                  <Stack gap="lg" h="100%">
                    <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
                      <ThemeIcon size={48} radius="lg" color="agrimarket" variant="light">
                        <IconBuildingStore size={24} />
                      </ThemeIcon>
                      <Badge color="agrimarket" variant="light">
                        {farm.soSanPham} sản phẩm
                      </Badge>
                    </Group>

                    <Stack gap={6} style={{ flex: 1 }}>
                      <Text fw={900} fz="xl" lineClamp={2}>{farm.label}</Text>
                      <Text size="sm" c="dimmed" lh={1.65}>
                        Trang trại đang có {farm.soSanPham.toLocaleString('vi-VN')} sản phẩm xuất hiện trong danh mục công khai.
                      </Text>
                    </Stack>

                    <Group grow gap="sm">
                      <Button
                        component={Link}
                        href={`/trang-trai/${encodeURIComponent(farm.value)}`}
                        color="agrimarket"
                        rightSection={<IconArrowRight size={16} />}
                      >
                        Xem trang trại
                      </Button>
                      <Button
                        component={Link}
                        href={`/san-pham?farm=${encodeURIComponent(farm.value)}`}
                        variant="light"
                        color="agrimarket"
                      >
                        Xem sản phẩm
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
