'use client';

import {
  dinhDangQuyCachSanPham,
  useLayChiTietTrangTraiCongKhai,
  useLaySanPhamTheoTrangTraiCongKhai,
} from '@agrimarket/api-client';
import {
  Anchor,
  Box,
  Breadcrumbs,
  Card,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBuildingStore, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FollowFarmButton } from './follow-farm-button';
import { ProductCard } from './product-card';
import { PageHeader } from './web-page';

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

  const {
    data: productData,
    isPending: productPending,
    isError: productError,
    refetch: refetchProducts,
  } = useLaySanPhamTheoTrangTraiCongKhai(id, {
    trang: 1,
    gioiHan: 12,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  const farm = data?.data;
  const products = productData?.data.duLieu ?? [];
  const tongSanPham = productData?.data.tong ?? 0;

  if (isPending) {
    return (
      <AgriContainer py="xl">
        <AgriSkeleton soLuong={4} />
      </AgriContainer>
    );
  }

  if (isError || !farm) {
    return (
      <Box className="agri-page">
        <PageHeader
          eyebrow="Trang trại"
          title="Không tải được trang trại"
          meta={
            <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng chi tiết trang trại">
              <Anchor component={Link} href="/" c="dimmed">
                Trang chủ
              </Anchor>
              <Anchor component={Link} href="/trang-trai" c="dimmed">
                Trang trại
              </Anchor>
              <Text c="dark.8" fw={700}>
                Chi tiết
              </Text>
            </Breadcrumbs>
          }
        />
        <AgriContainer py="xl">
          <ErrorState
            tieuDe="Không tải được trang trại"
            moTa="Trang trại có thể không còn công khai hoặc hệ thống đang tạm thời không phản hồi."
            onThuLai={() => {
              void refetch();
            }}
          />
        </AgriContainer>
      </Box>
    );
  }

  const anhBia = farm.anh[0]?.url ?? null;

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Trang trại"
        title={farm.ten}
        description={farm.diaChi}
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng chi tiết trang trại">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Anchor component={Link} href="/trang-trai" c="dimmed">
              Trang trại
            </Anchor>
            <Text c="dark.8" fw={700}>
              {farm.ten}
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Stack gap="md" justify="center">
              <Group gap="xs">
                <AgriBadge>Trang trại</AgriBadge>
                {farm.chungNhan.length > 0 ? (
                  <AgriBadge loai="chung-nhan">
                    {farm.chungNhan.length} chứng nhận đã xác minh
                  </AgriBadge>
                ) : null}
              </Group>

              <FollowFarmButton trangTraiId={farm.id} />

              <Group gap={6} wrap="nowrap" align="flex-start">
                <IconMapPin size={16} stroke={1.7} color="#687268" style={{ marginTop: 2 }} />
                <Text c="dimmed">{farm.diaChi}</Text>
              </Group>

              <Group gap="xl" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={700}>
                    {farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : 'Chưa cập nhật'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Diện tích
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={700}>{tongSanPham}</Text>
                  <Text size="sm" c="dimmed">
                    Sản phẩm
                  </Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={700}>{farm.chungNhan.length}</Text>
                  <Text size="sm" c="dimmed">
                    Chứng nhận đã xác minh
                  </Text>
                </Stack>
              </Group>
            </Stack>

            {anhBia ? (
              <Image
                src={anhBia}
                alt={farm.ten}
                h={{ base: 280, sm: 360 }}
                w="100%"
                fit="cover"
                radius="md"
              />
            ) : (
              <Box
                h={{ base: 280, sm: 360 }}
                bg="gray.1"
                style={{ display: 'grid', placeItems: 'center', borderRadius: 'var(--mantine-radius-md)' }}
                aria-label="Trang trại chưa có ảnh công khai"
              >
                <ThemeIcon size={64} radius="xl" variant="light" color="agrimarket">
                  <IconBuildingStore size={32} />
                </ThemeIcon>
              </Box>
            )}
          </SimpleGrid>

          <Tabs defaultValue="gioi-thieu" keepMounted={false}>
            <Tabs.List mb="xl">
              <Tabs.Tab value="gioi-thieu">Giới thiệu</Tabs.Tab>
              <Tabs.Tab value="san-pham">Sản phẩm ({tongSanPham})</Tabs.Tab>
              <Tabs.Tab value="chung-nhan">Chứng nhận ({farm.chungNhan.length})</Tabs.Tab>
              <Tabs.Tab value="mua-vu">Mùa vụ ({farm.muaVu.length})</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="gioi-thieu">
              <Stack gap="xl">
                <Title order={2}>Giới thiệu trang trại</Title>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <Card withBorder radius="md" padding="lg">
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

                  <Card withBorder radius="md" padding="lg">
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
                            Tọa độ được công khai từ hồ sơ trang trại.
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
                <Title order={2}>Sản phẩm của trang trại</Title>

                {productPending ? (
                  <AgriSkeleton soLuong={6} />
                ) : productError ? (
                  <ErrorState
                    tieuDe="Không tải được sản phẩm của trang trại"
                    moTa="Thông tin trang trại đã tải thành công nhưng danh sách sản phẩm hiện chưa thể đồng bộ."
                    onThuLai={() => void refetchProducts()}
                  />
                ) : products.length > 0 ? (
                  <>
                    <Text size="sm" c="dimmed">
                      {tongSanPham} sản phẩm thuộc trang trại này.
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                      {products.map((item) => (
                        <ProductCard
                          key={item.id}
                          ten={item.ten}
                          tenTrangTrai={item.trangTrai.ten}
                          giaTu={item.gia.tu}
                          donVi={dinhDangQuyCachSanPham(item.quyCach)}
                          href={`/san-pham/${item.id}`}
                          anh={anhCard(item.anhBiaUrl, item.ten)}
                          nhan={[
                            item.danhMuc.ten,
                            item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                          ]}
                        />
                      ))}
                    </SimpleGrid>
                  </>
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
                      <Card key={item.id} withBorder radius="md" padding="lg">
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
                  <>
                    <Text size="sm" c="dimmed">
                      Mùa vụ cấp trang trại do hệ thống công khai. Nguồn gốc chính xác của từng
                      đơn hàng được xác định theo lô sản phẩm, không suy từ mùa vụ gần nhất.
                    </Text>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      {farm.muaVu.map((item) => (
                        <Card key={item.id} withBorder radius="md" padding="lg">
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Text fw={700}>{item.cayTrong}</Text>
                              <AgriBadge>{item.trangThai}</AgriBadge>
                            </Group>
                            <Text>
                              Giống: <strong>{item.giong}</strong>
                            </Text>
                            <Text size="sm" c="dimmed">
                              Trồng {item.ngayTrong} · dự kiến thu hoạch{' '}
                              {item.ngayDuKienThuHoach}
                            </Text>
                            <Text size="sm">
                              Sản lượng dự kiến: {dinhDangSo(item.sanLuongDuKienKg)} kg
                            </Text>
                          </Stack>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </>
                ) : (
                  <EmptyState
                    tieuDe="Chưa có mùa vụ"
                    moTa="Hệ thống chưa có dữ liệu mùa vụ cho trang trại này."
                  />
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
