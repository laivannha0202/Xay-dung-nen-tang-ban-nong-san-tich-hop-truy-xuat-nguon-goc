'use client';

import {
  dinhDangQuyCachSanPham,
  useLayChiTietTrangTraiCongKhai,
  useLaySanPhamTheoTrangTraiCongKhai,
} from '@agrimarket/api-client';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Card,
  Grid,
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
import {
  IconBuildingStore,
  IconCertificate,
  IconMapPin,
  IconPhoto,
  IconPlant,
  IconShieldCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FollowFarmButton } from './follow-farm-button';
import { ProductCard } from './product-card';

const ANH_TRANG_TRAI_MAC_DINH = '/images/farms/farm-placeholder.svg';

const TRANG_THAI_MUA_VU: Record<string, { label: string; color: string }> = {
  KE_HOACH: { label: 'Kế hoạch', color: 'teal' },
  DANG_CANH_TAC: { label: 'Đang canh tác', color: 'green' },
  CHO_THU_HOACH: { label: 'Chờ thu hoạch', color: 'yellow' },
  DA_KET_THUC: { label: 'Đã kết thúc', color: 'gray' },
  HUY: { label: 'Đã hủy', color: 'red' },
};

function dinhDangSo(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(value);
}

function dinhDangNgay(value: string): string {
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function trangThaiMuaVu(value: string) {
  return (
    TRANG_THAI_MUA_VU[value] ?? {
      label: value
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(' '),
      color: 'gray',
    }
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <Paper withBorder radius="md" px="md" py="sm" bg="#fbfdfb" style={{ borderColor: '#e2e9e4' }}>
      <Text fw={800} fz="lg" c="#15251a">
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
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
      <AgriContainer py="xl">
        <ErrorState
          tieuDe="Không tải được trang trại"
          moTa="Trang trại có thể không còn công khai hoặc hệ thống đang tạm thời không phản hồi."
          onThuLai={() => void refetch()}
        />
      </AgriContainer>
    );
  }

  const anhBia = farm.anh[0]?.url ?? ANH_TRANG_TRAI_MAC_DINH;
  const anhPhu = farm.anh.slice(1, 4);
  const coGps = farm.viDo !== null && farm.kinhDo !== null;

  return (
    <Box bg="#f7f9f7" py={{ base: 18, md: 26 }} style={{ minHeight: 'calc(100vh - 110px)' }}>
      <AgriContainer>
        <Breadcrumbs fz="sm" mb="lg" aria-label="Điều hướng chi tiết trang trại">
          <Anchor component={Link} href="/" c="dimmed">
            Trang chủ
          </Anchor>
          <Anchor component={Link} href="/trang-trai" c="dimmed">
            Trang trại
          </Anchor>
          <Text fw={700} c="#1f2f24">
            {farm.ten}
          </Text>
        </Breadcrumbs>

        <Paper
          withBorder
          radius="lg"
          p={{ base: 'md', md: 'lg' }}
          bg="white"
          style={{ borderColor: '#dfe7e1' }}
        >
          <Stack gap="lg">
            {/* Ảnh trang trại: chỉ dùng ảnh thật từ API */}
            <Grid gap="sm">
              <Grid.Col span={{ base: 12, md: anhPhu.length > 0 ? 9 : 12 }}>
                <Box pos="relative">
                  <Image
                    src={anhBia}
                    fallbackSrc={ANH_TRANG_TRAI_MAC_DINH}
                    alt={farm.ten}
                    h={{ base: 260, md: 390 }}
                    fit="cover"
                    radius="md"
                  />
                  <Badge
                    pos="absolute"
                    bottom={10}
                    left={10}
                    color="dark"
                    variant="filled"
                    radius="sm"
                    leftSection={<IconPhoto size={12} />}
                    style={{ opacity: 0.82 }}
                  >
                    {farm.anh.length > 0 ? `${farm.anh.length} ảnh` : 'Chưa có ảnh công khai'}
                  </Badge>
                </Box>
              </Grid.Col>

              {anhPhu.length > 0 ? (
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <SimpleGrid cols={{ base: 3, md: 1 }} spacing="sm">
                    {anhPhu.map((anh, index) => (
                      <Image
                        key={anh.tepTinId}
                        src={anh.url}
                        fallbackSrc={ANH_TRANG_TRAI_MAC_DINH}
                        alt={`${farm.ten} - ảnh ${index + 2}`}
                        h={{ base: 96, md: 122 }}
                        fit="cover"
                        radius="md"
                      />
                    ))}
                  </SimpleGrid>
                </Grid.Col>
              ) : null}
            </Grid>

            {/* Tên + dữ liệu chính */}
            <Group justify="space-between" align="flex-start" gap="xl" wrap="wrap">
              <Stack gap="xs" style={{ flex: 1, minWidth: 280 }}>
                <Badge variant="light" color="agrimarket" w="fit-content">
                  Trang trại
                </Badge>

                <Title order={1} fz={{ base: 28, md: 34 }} c="#14261a">
                  {farm.ten}
                </Title>

                <Group gap={7} wrap="nowrap">
                  <IconMapPin size={17} color="#66756b" />
                  <Text c="dimmed" size="sm">
                    {farm.diaChi}
                  </Text>
                </Group>

                <Group gap={7} wrap="nowrap">
                  <IconBuildingStore size={17} color="#66756b" />
                  <Text c="dimmed" size="sm">
                    {farm.nhaCungCap.ten}
                  </Text>
                </Group>

                <Box mt="xs" maw={230}>
                  <FollowFarmButton trangTraiId={farm.id} />
                </Box>
              </Stack>

              <SimpleGrid
                cols={{ base: 2, sm: 4 }}
                spacing="sm"
                style={{ minWidth: 460, maxWidth: 620, flex: 1 }}
              >
                <StatItem
                  value={farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : '—'}
                  label="Diện tích"
                />
                <StatItem value={tongSanPham} label="Sản phẩm" />
                <StatItem value={farm.chungNhan.length} label="Chứng nhận" />
                <StatItem value={farm.muaVu.length} label="Mùa vụ" />
              </SimpleGrid>
            </Group>
          </Stack>
        </Paper>

        <Tabs defaultValue="gioi-thieu" keepMounted={false} mt="lg" color="agrimarket">
          <Paper
            withBorder
            radius="md"
            bg="white"
            px="sm"
            style={{ borderColor: '#dfe7e1', overflowX: 'auto' }}
          >
            <Tabs.List
              style={{
                borderBottom: 0,
                flexWrap: 'nowrap',
                minWidth: 'max-content',
              }}
            >
              <Tabs.Tab value="gioi-thieu" py="md">
                Giới thiệu
              </Tabs.Tab>
              <Tabs.Tab value="san-pham" py="md">
                Sản phẩm ({tongSanPham})
              </Tabs.Tab>
              <Tabs.Tab value="chung-nhan" py="md">
                Chứng nhận ({farm.chungNhan.length})
              </Tabs.Tab>
              <Tabs.Tab value="mua-vu" py="md">
                Mùa vụ ({farm.muaVu.length})
              </Tabs.Tab>
            </Tabs.List>
          </Paper>

          <Tabs.Panel value="gioi-thieu" pt="xl">
            <Stack gap="lg">
              <Title order={2} fz={{ base: 22, md: 26 }}>
                Giới thiệu trang trại
              </Title>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Card withBorder radius="md" padding="lg" bg="white">
                  <Stack gap="md">
                    <Group gap="sm">
                      <ThemeIcon size={36} radius="md" variant="light" color="agrimarket">
                        <IconBuildingStore size={19} />
                      </ThemeIcon>
                      <Title order={3} fz="md">
                        Thông tin chung
                      </Title>
                    </Group>

                    <Box style={{ height: 1, background: '#edf1ee' }} />

                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Mã trang trại
                      </Text>
                      <Text size="sm" fw={700} ta="right">
                        {farm.ma}
                      </Text>
                    </Group>

                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Địa chỉ
                      </Text>
                      <Text size="sm" fw={700} ta="right">
                        {farm.diaChi}
                      </Text>
                    </Group>

                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Nhà cung cấp
                      </Text>
                      <Text size="sm" fw={700} ta="right">
                        {farm.nhaCungCap.ten}
                      </Text>
                    </Group>

                    <Group justify="space-between" gap="md" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        Diện tích
                      </Text>
                      <Text size="sm" fw={700} ta="right">
                        {farm.dienTichHa !== null
                          ? `${dinhDangSo(farm.dienTichHa)} ha`
                          : 'Chưa cập nhật'}
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                <Card withBorder radius="md" padding="lg" bg="white">
                  <Stack gap="md">
                    <Group gap="sm">
                      <ThemeIcon size={36} radius="md" variant="light" color="agrimarket">
                        <IconMapPin size={19} />
                      </ThemeIcon>
                      <Title order={3} fz="md">
                        Vị trí trang trại
                      </Title>
                    </Group>

                    <Box style={{ height: 1, background: '#edf1ee' }} />

                    {coGps ? (
                      <>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">
                            Vĩ độ
                          </Text>
                          <Text size="sm" fw={700}>
                            {farm.viDo}
                          </Text>
                        </Group>

                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">
                            Kinh độ
                          </Text>
                          <Text size="sm" fw={700}>
                            {farm.kinhDo}
                          </Text>
                        </Group>

                        <Anchor
                          href={`https://www.google.com/maps?q=${farm.viDo},${farm.kinhDo}`}
                          target="_blank"
                          rel="noreferrer"
                          fw={700}
                          fz="sm"
                        >
                          Xem vị trí trên bản đồ
                        </Anchor>
                      </>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Trang trại chưa cập nhật tọa độ GPS công khai.
                      </Text>
                    )}
                  </Stack>
                </Card>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="san-pham" pt="xl">
            <Stack gap="lg">
              <Stack gap={3}>
                <Title order={2} fz={{ base: 22, md: 26 }}>
                  Sản phẩm của trang trại
                </Title>
                <Text size="sm" c="dimmed">
                  {tongSanPham} sản phẩm đang được công khai.
                </Text>
              </Stack>

              {productPending ? (
                <AgriSkeleton soLuong={8} />
              ) : productError ? (
                <ErrorState
                  tieuDe="Không tải được sản phẩm"
                  moTa="Danh sách sản phẩm của trang trại hiện chưa thể tải."
                  onThuLai={() => void refetchProducts()}
                />
              ) : products.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing="lg">
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      ten={item.ten}
                      tenTrangTrai={item.trangTrai.ten}
                      giaTu={item.gia.tu}
                      giaDen={item.gia.den}
                      giaBan={item.giaBan ?? null}
                      donVi={dinhDangQuyCachSanPham(item.quyCach)}
                      href={`/san-pham/${item.id}`}
                      anhUrl={item.anhBiaUrl ?? undefined}
                      nhan={[item.danhMuc.ten]}
                      conHang={item.khaDung.coTheDatHang}
                      soLuongKhaDung={item.khaDung.soLuongKhaDung}
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

          <Tabs.Panel value="chung-nhan" pt="xl">
            <Stack gap="lg">
              <Stack gap={3}>
                <Title order={2} fz={{ base: 22, md: 26 }}>
                  Chứng nhận
                </Title>
                <Text size="sm" c="dimmed">
                  Chỉ hiển thị chứng nhận đã xác minh và còn hiệu lực.
                </Text>
              </Stack>

              {farm.chungNhan.length > 0 ? (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  {farm.chungNhan.map((item) => (
                    <Card key={item.id} withBorder radius="md" padding="lg" bg="white">
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap">
                            <ThemeIcon size={42} radius="md" variant="light" color="agrimarket">
                              <IconCertificate size={22} />
                            </ThemeIcon>
                            <Stack gap={1}>
                              <Text fw={800} fz="lg">
                                {item.loai}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Mã: {item.ma}
                              </Text>
                            </Stack>
                          </Group>

                          <Badge
                            color="teal"
                            variant="light"
                            leftSection={<IconShieldCheck size={12} />}
                          >
                            Đã xác minh
                          </Badge>
                        </Group>

                        <Box style={{ height: 1, background: '#edf1ee' }} />

                        <Group justify="space-between" gap="md" wrap="nowrap">
                          <Text size="sm" c="dimmed">
                            Đơn vị cấp
                          </Text>
                          <Text size="sm" fw={700} ta="right">
                            {item.donViCap}
                          </Text>
                        </Group>

                        <Group justify="space-between" gap="md" wrap="nowrap">
                          <Text size="sm" c="dimmed">
                            Ngày cấp
                          </Text>
                          <Text size="sm" fw={700}>
                            {dinhDangNgay(item.ngayCap)}
                          </Text>
                        </Group>

                        <Group justify="space-between" gap="md" wrap="nowrap">
                          <Text size="sm" c="dimmed">
                            Ngày hết hạn
                          </Text>
                          <Text size="sm" fw={700}>
                            {dinhDangNgay(item.ngayHetHan)}
                          </Text>
                        </Group>
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

          <Tabs.Panel value="mua-vu" pt="xl">
            <Stack gap="lg">
              <Stack gap={3}>
                <Title order={2} fz={{ base: 22, md: 26 }}>
                  Mùa vụ
                </Title>
                <Text size="sm" c="dimmed">
                  Thông tin kế hoạch và tình trạng canh tác công khai của trang trại.
                </Text>
              </Stack>

              {farm.muaVu.length > 0 ? (
                <Stack gap="sm">
                  {farm.muaVu.map((item) => {
                    const status = trangThaiMuaVu(item.trangThai);

                    return (
                      <Paper
                        key={item.id}
                        withBorder
                        radius="md"
                        p="md"
                        bg="white"
                        style={{ borderColor: '#e1e8e3' }}
                      >
                        <Group justify="space-between" align="center" gap="lg" wrap="wrap">
                          <Group gap="sm" wrap="nowrap" style={{ minWidth: 220 }}>
                            <ThemeIcon size={38} radius="md" variant="light" color="agrimarket">
                              <IconPlant size={20} />
                            </ThemeIcon>
                            <Stack gap={0}>
                              <Text fw={800}>{item.cayTrong}</Text>
                              <Text size="sm" c="dimmed">
                                Giống: {item.giong}
                              </Text>
                            </Stack>
                          </Group>

                          <Stack gap={2} style={{ flex: 1, minWidth: 280 }}>
                            <Text size="sm">
                              Trồng: <b>{dinhDangNgay(item.ngayTrong)}</b>
                            </Text>
                            <Text size="sm" c="dimmed">
                              Dự kiến thu hoạch: {dinhDangNgay(item.ngayDuKienThuHoach)}
                            </Text>
                          </Stack>

                          <Text fw={700} size="sm">
                            {dinhDangSo(item.sanLuongDuKienKg)} kg
                          </Text>

                          <Badge color={status.color} variant="light">
                            {status.label}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <EmptyState
                  tieuDe="Chưa có mùa vụ"
                  moTa="Hệ thống chưa có dữ liệu mùa vụ công khai cho trang trại này."
                />
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </AgriContainer>
    </Box>
  );
}

// AGRIMARKET-STOCK-FARM-V2
