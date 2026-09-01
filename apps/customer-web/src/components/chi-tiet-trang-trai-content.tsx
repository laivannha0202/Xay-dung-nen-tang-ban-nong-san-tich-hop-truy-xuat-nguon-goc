'use client';

import {
  useLayChiTietTrangTraiCongKhai,
  useLaySanPhamTheoTrangTraiCongKhai,
} from '@agrimarket/api-client';
import {
  Box,
  Card,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useParams } from 'next/navigation';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(value);
}

function anhCard(url: string | null, ten: string) {
  if (!url) return undefined;

  return <Image src={url} alt={ten} h="100%" fit="cover" loading="lazy" />;
}

export function ChiTietTrangTraiContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isPending, isError, refetch } = useLayChiTietTrangTraiCongKhai(id);

  const { data: productData, isPending: productPending } = useLaySanPhamTheoTrangTraiCongKhai(id, {
    trang: 1,
    gioiHan: 12,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  const farm = data?.data;
  const products = productData?.data.duLieu ?? [];

  if (isPending) {
    return (
      <AgriContainer py={{ base: 36, md: 56 }}>
        <AgriSkeleton soLuong={4} />
      </AgriContainer>
    );
  }

  if (isError || !farm) {
    return (
      <AgriContainer py={{ base: 36, md: 56 }}>
        <ErrorState
          tieuDe="Không tải được trang trại"
          moTa="Trang trại có thể không còn công khai hoặc API đang tạm thời không khả dụng."
          onThuLai={() => {
            void refetch();
          }}
        />
      </AgriContainer>
    );
  }

  return (
    <>
      <Box
        py={{ base: 36, md: 56 }}
        bg="agrimarket.0"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="lg" justify="center">
              <Group gap="xs">
                <AgriBadge>Trang trại</AgriBadge>
                {farm.chungNhan.length > 0 ? (
                  <AgriBadge loai="chung-nhan">Có chứng nhận xác minh</AgriBadge>
                ) : null}
              </Group>

              <Title order={1}>{farm.ten}</Title>
              <Text size="lg" c="dimmed">
                {farm.diaChi}
              </Text>

              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Stack gap={2}>
                  <Text fw={700}>
                    {farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : '—'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Diện tích
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={700}>{products.length}</Text>
                  <Text size="sm" c="dimmed">
                    Sản phẩm đang tải
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={700}>{farm.chungNhan.length}</Text>
                  <Text size="sm" c="dimmed">
                    Chứng nhận hợp lệ
                  </Text>
                </Stack>
              </SimpleGrid>
            </Stack>

            <Paper withBorder radius="xl" bg="gray.0" style={{ overflow: 'hidden' }}>
              <Box
                h={{ base: 280, sm: 380 }}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {farm.anh[0] ? (
                  <Image src={farm.anh[0].url} alt={farm.ten} h="100%" w="100%" fit="cover" />
                ) : (
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={64} radius="xl" variant="light" color="agrimarket">
                      FARM
                    </ThemeIcon>
                    <Text c="dimmed">Chưa có ảnh trang trại</Text>
                  </Stack>
                )}
              </Box>
            </Paper>
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 36, md: 56 }}>
        <Tabs defaultValue="gioi-thieu" keepMounted={false}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="gioi-thieu">Giới thiệu</Tabs.Tab>
            <Tabs.Tab value="san-pham">Sản phẩm</Tabs.Tab>
            <Tabs.Tab value="chung-nhan">Chứng nhận</Tabs.Tab>
            <Tabs.Tab value="mua-vu">Mùa vụ</Tabs.Tab>
            <Tabs.Tab value="danh-gia">Đánh giá</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="gioi-thieu">
            <Stack gap="xl">
              <Title order={2}>Giới thiệu trang trại</Title>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Card withBorder radius="lg" padding="lg">
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed">
                      Thông tin
                    </Text>
                    <Text>
                      <strong>Mã:</strong> {farm.ma}
                    </Text>
                    <Text>
                      <strong>Địa chỉ:</strong> {farm.diaChi}
                    </Text>
                    <Text>
                      <strong>Nhà cung cấp:</strong> {farm.nhaCungCap.ten}
                    </Text>
                    <Text>
                      <strong>Diện tích:</strong>{' '}
                      {farm.dienTichHa !== null
                        ? `${dinhDangSo(farm.dienTichHa)} ha`
                        : 'Chưa cập nhật'}
                    </Text>
                  </Stack>
                </Card>

                <Card withBorder radius="lg" padding="lg">
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed">
                      Vị trí GPS
                    </Text>
                    {farm.viDo !== null && farm.kinhDo !== null ? (
                      <>
                        <Text>
                          <strong>Vĩ độ:</strong> {farm.viDo}
                        </Text>
                        <Text>
                          <strong>Kinh độ:</strong> {farm.kinhDo}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Dữ liệu vị trí do Backend cung cấp.
                        </Text>
                      </>
                    ) : (
                      <Text c="dimmed">Trang trại chưa cập nhật GPS.</Text>
                    )}
                  </Stack>
                </Card>
              </SimpleGrid>

              {farm.anh.length > 1 ? (
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                  {farm.anh.map((anh) => (
                    <Image
                      key={anh.tepTinId}
                      src={anh.url}
                      alt={farm.ten}
                      h={180}
                      fit="cover"
                      radius="md"
                    />
                  ))}
                </SimpleGrid>
              ) : null}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="san-pham">
            <Stack gap="xl">
              <Title order={2}>Sản phẩm từ trang trại</Title>

              {productPending ? (
                <AgriSkeleton soLuong={6} />
              ) : products.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      ten={item.ten}
                      tenTrangTrai={item.trangTrai.ten}
                      giaTu={item.gia.tu}
                      donVi="đơn vị"
                      href={`/san-pham/${item.id}`}
                      anh={anhCard(item.anhBiaUrl, item.ten)}
                      nhan={[
                        item.danhMuc.ten,
                        item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                      ]}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  tieuDe="Chưa có sản phẩm công khai"
                  moTa="Trang trại chưa có sản phẩm phù hợp để hiển thị."
                />
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="chung-nhan">
            <Stack gap="xl">
              <Title order={2}>Chứng nhận</Title>

              {farm.chungNhan.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {farm.chungNhan.map((item) => (
                    <Card key={item.id} withBorder radius="lg" padding="lg">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={700}>{item.loai}</Text>
                          <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge>
                        </Group>
                        <Text>Mã: {item.ma}</Text>
                        <Text c="dimmed">Đơn vị cấp: {item.donViCap}</Text>
                        <Text size="sm" c="dimmed">
                          Hiệu lực: {item.ngayCap} → {item.ngayHetHan}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  tieuDe="Chưa có chứng nhận công khai"
                  moTa="Chỉ chứng nhận đã xác minh và còn hiệu lực được hiển thị."
                />
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="mua-vu">
            <Stack gap="xl">
              <Title order={2}>Mùa vụ</Title>

              {farm.muaVu.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {farm.muaVu.map((item) => (
                    <Card key={item.id} withBorder radius="lg" padding="lg">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={700}>{item.cayTrong}</Text>
                          <AgriBadge>{item.trangThai}</AgriBadge>
                        </Group>
                        <Text>
                          Giống: <strong>{item.giong}</strong>
                        </Text>
                        <Text size="sm" c="dimmed">
                          Trồng {item.ngayTrong} · dự kiến thu hoạch {item.ngayDuKienThuHoach}
                        </Text>
                        <Text size="sm">
                          Sản lượng dự kiến: {dinhDangSo(item.sanLuongDuKienKg)} kg
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  tieuDe="Chưa có mùa vụ"
                  moTa="Backend chưa có dữ liệu mùa vụ cho trang trại này."
                />
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="danh-gia">
            <Stack gap="xl">
              <Title order={2}>Đánh giá</Title>
              <EmptyState
                tieuDe="Chưa có đánh giá"
                moTa="Review Backend được triển khai ở PHIEN-065 nên Farm Detail không tạo điểm sao hoặc nhận xét giả."
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </AgriContainer>
    </>
  );
}
