'use client';

import {
  dinhDangQuyCachSanPham,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingStore,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  ANH_HERO_AGRIMARKET,
  ANH_TRUY_XUAT_AGRIMARKET,
  anhDuPhongDanhMuc,
} from '@/lib/demo-images';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FarmCard } from './farm-card';
import { ProductCard } from './product-card';

function ngayIsoTruoc(soNgay: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - soNgay);
  return date.toISOString().slice(0, 10);
}

function anhSanPham(url: string | null, ten: string) {
  if (!url) return undefined;
  return <Image src={url} alt={ten} h="100%" w="100%" fit="cover" loading="lazy" />;
}

function nhanSanPham(item: {
  danhMuc: { ten: string };
  khaDung: { coTheDatHang: boolean };
  chungNhan: Array<{ loai: string }>;
}) {
  const chungNhan = item.chungNhan[0]?.loai;
  return [
    chungNhan || item.danhMuc.ten,
    item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
  ];
}

function SectionTitle({
  title,
  description,
  href,
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
      <Stack gap={4}>
        <Title order={2} fz={{ base: 25, md: 30 }} fw={850} lh={1.15}>
          {title}
        </Title>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
      {href ? (
        <Button
          component={Link}
          href={href}
          variant="subtle"
          color="agrimarket"
          rightSection={<IconArrowRight size={16} />}
        >
          Xem tất cả
        </Button>
      ) : null}
    </Group>
  );
}

type CategoryPromo = {
  value: string;
  label: string;
  soSanPham: number;
};

function PromoDanhMuc({ item }: { item: CategoryPromo }) {
  return (
    <Card
      component={Link}
      href={`/san-pham?category=${encodeURIComponent(item.value)}`}
      padding={0}
      withBorder
      style={{
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        borderColor: '#DCE7DF',
      }}
    >
      <Box pos="relative" h={{ base: 145, lg: 185 }}>
        <Image
          src={anhDuPhongDanhMuc(item.label)}
          alt={item.label}
          h="100%"
          w="100%"
          fit="cover"
        />
        <Box
          pos="absolute"
          inset={0}
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,.96), rgba(255,255,255,.62) 62%, rgba(255,255,255,.08))',
          }}
        />
        <Stack pos="absolute" inset={0} justify="center" p="lg" gap={5} maw="76%">
          <Text fw={900} fz="lg" c="agrimarket.8" lineClamp={2}>
            {item.label}
          </Text>
          <Text size="xs" c="dimmed">
            {item.soSanPham} sản phẩm công khai
          </Text>
          <Text size="sm" fw={800} c="agrimarket.7">
            Khám phá →
          </Text>
        </Stack>
      </Box>
    </Card>
  );
}

function PromoHeThong({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: 'leaf' | 'qr';
}) {
  return (
    <Card
      component={Link}
      href={href}
      withBorder
      padding="lg"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        borderColor: '#DCE7DF',
        background: '#F1FAF5',
      }}
    >
      <Stack h="100%" justify="center" gap="sm">
        <ThemeIcon variant="light" color="agrimarket" size={42} radius="md">
          {icon === 'qr' ? <IconQrcode size={22} /> : <IconLeaf size={22} />}
        </ThemeIcon>
        <Text fw={900} fz="lg" c="agrimarket.8">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
        <Text size="sm" fw={800} c="agrimarket.7">
          Xem ngay →
        </Text>
      </Stack>
    </Card>
  );
}

export function TrangChuContent() {
  const facetsQuery = useLayFacetsSanPhamCongKhai();

  const moiThuHoachQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 10,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
    thuHoachTu: ngayIsoTruoc(45),
  });

  const moiNhatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 16,
    khaDung: 'CON_HANG',
    sapXep: 'MOI_NHAT',
  });

  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 16,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });

  const danhMuc = useMemo(
    () =>
      (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 10).map((item) => ({
        value: item.value,
        label: item.label,
        soSanPham: item.soSanPham,
      })),
    [facetsQuery.data],
  );

  const harvested = useMemo(
    () => moiThuHoachQuery.data?.data?.duLieu ?? [],
    [moiThuHoachQuery.data],
  );
  const moiNhat = useMemo(() => moiNhatQuery.data?.data?.duLieu ?? [], [moiNhatQuery.data]);
  const coThuHoachGanDay = harvested.length > 0;
  const sanPhamMoi = (coThuHoachGanDay ? harvested : moiNhat).slice(0, 5);

  const noiBat = useMemo(
    () => (noiBatQuery.data?.data?.duLieu ?? []).slice(0, 8),
    [noiBatQuery.data],
  );

  const trangTrai = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        ten: string;
        diaChi: string;
        soSanPham: number;
        daXacMinh: boolean;
      }
    >();

    for (const item of [...noiBat, ...sanPhamMoi]) {
      const current = map.get(item.trangTrai.id);
      map.set(item.trangTrai.id, {
        id: item.trangTrai.id,
        ten: item.trangTrai.ten,
        diaChi: item.trangTrai.diaChi,
        soSanPham: (current?.soSanPham ?? 0) + 1,
        daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0,
      });
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          Number(b.daXacMinh) - Number(a.daXacMinh) ||
          b.soSanPham - a.soSanPham ||
          a.ten.localeCompare(b.ten, 'vi'),
      )
      .slice(0, 3);
  }, [noiBat, sanPhamMoi]);

  const productPending =
    moiThuHoachQuery.isPending && moiNhatQuery.isPending && noiBatQuery.isPending;
  const productError =
    moiThuHoachQuery.isError && moiNhatQuery.isError && noiBatQuery.isError;

  return (
    <Box bg="white">
      <AgriContainer py={{ base: 16, md: 20 }}>
        <Grid gap="md" align="stretch">
          <Grid.Col span={{ base: 12, lg: 2 }}>
            <Card
              withBorder
              padding={0}
              h="100%"
              visibleFrom="lg"
              style={{ overflow: 'hidden', borderColor: '#DCE7DF' }}
            >
              <Box bg="agrimarket.6" c="white" px="md" py={12}>
                <Group gap={8}>
                  <IconBuildingStore size={18} />
                  <Text fw={800} size="sm">
                    Danh mục sản phẩm
                  </Text>
                </Group>
              </Box>
              <Stack gap={0}>
                {danhMuc.length > 0 ? (
                  danhMuc.map((item) => (
                    <Link
                      key={item.value}
                      href={`/san-pham?category=${encodeURIComponent(item.value)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '10px 14px',
                        color: '#263129',
                        textDecoration: 'none',
                        borderBottom: '1px solid #F0F3F1',
                        fontSize: 13,
                      }}
                    >
                      <Text size="sm" fw={650} lineClamp={1}>
                        {item.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.soSanPham}
                      </Text>
                    </Link>
                  ))
                ) : (
                  <Box p="md">
                    <Text size="sm" c="dimmed">
                      {facetsQuery.isPending ? 'Đang tải danh mục...' : 'Chưa có danh mục công khai'}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Paper
              h="100%"
              mih={{ base: 330, md: 390 }}
              p={0}
              style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: `url("${ANH_HERO_AGRIMARKET}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #DCE7DF',
              }}
            >
              <Box
                pos="absolute"
                inset={0}
                style={{
                  background:
                    'linear-gradient(90deg, rgba(4,63,42,.86) 0%, rgba(4,63,42,.62) 48%, rgba(4,63,42,.08) 100%)',
                }}
              />
              <Stack
                pos="relative"
                justify="center"
                h="100%"
                mih={{ base: 330, md: 390 }}
                p={{ base: 24, sm: 34, md: 42 }}
                maw={610}
                gap="md"
              >
                <Badge color="agrimarket" variant="filled" w="fit-content">
                  AGRIMARKET
                </Badge>
                <Stack gap="xs">
                  <Title
                    order={1}
                    c="white"
                    fz={{ base: 34, sm: 42, md: 48 }}
                    fw={900}
                    lh={1.04}
                  >
                    Từ trang trại đến bàn ăn, nguồn gốc minh bạch
                  </Title>
                  <Text c="rgba(255,255,255,.88)" fz={{ base: 14, md: 16 }} maw={520}>
                    Chọn nông sản từ dữ liệu công khai và kiểm tra hành trình của từng lô khi có
                    mã truy xuất.
                  </Text>
                </Stack>
                <Group gap="sm">
                  <Button
                    component={Link}
                    href="/san-pham"
                    size="md"
                    color="white"
                    c="agrimarket.7"
                    rightSection={<IconArrowRight size={17} />}
                  >
                    Khám phá nông sản
                  </Button>
                  <Button
                    component={Link}
                    href="/truy-xuat"
                    size="md"
                    variant="outline"
                    color="white"
                    leftSection={<IconQrcode size={18} />}
                  >
                    Truy xuất
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 3 }}>
            <SimpleGrid cols={{ base: 2, lg: 1 }} spacing="md" h="100%">
              {danhMuc[0] ? (
                <PromoDanhMuc item={danhMuc[0]} />
              ) : (
                <PromoHeThong
                  title="Khám phá nông sản"
                  description="Tìm kiếm theo danh mục, trang trại, giá và khu vực."
                  href="/san-pham"
                  icon="leaf"
                />
              )}
              {danhMuc[1] ? (
                <PromoDanhMuc item={danhMuc[1]} />
              ) : (
                <PromoHeThong
                  title="Truy xuất nguồn gốc"
                  description="Kiểm tra đúng lô hàng bằng mã trên tem hoặc QR."
                  href="/truy-xuat"
                  icon="qr"
                />
              )}
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </AgriContainer>

      <Box style={{ borderBottom: '1px solid #EEF2EF' }}>
        <AgriContainer pb={{ base: 18, md: 22 }}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
            {[
              {
                icon: <IconShieldCheck size={22} />,
                title: 'Truy xuất nguồn gốc',
                subtitle: 'Theo đúng mã lô hoặc QR',
              },
              {
                icon: <IconBuildingStore size={22} />,
                title: 'Trang trại công khai',
                subtitle: 'Xem hồ sơ và chứng nhận',
              },
              {
                icon: <IconLeaf size={22} />,
                title: 'Thông tin sản phẩm',
                subtitle: 'Giá, quy cách và tồn khả dụng',
              },
              {
                icon: <IconTruckDelivery size={22} />,
                title: 'Theo dõi đơn hàng',
                subtitle: 'Trạng thái đồng bộ hệ thống',
              },
            ].map((item) => (
              <Group key={item.title} gap="sm" wrap="nowrap" p="sm">
                <ThemeIcon size={42} radius="md" variant="light" color="agrimarket">
                  {item.icon}
                </ThemeIcon>
                <Stack gap={1}>
                  <Text fw={800} size="sm">
                    {item.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.subtitle}
                  </Text>
                </Stack>
              </Group>
            ))}
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 26, md: 34 }}>
        <SectionTitle
          title="Danh mục nông sản"
          description="Danh mục được đồng bộ từ cùng API công khai với ứng dụng Mobile."
          href="/san-pham"
        />

        {facetsQuery.isError ? (
          <Box mt="lg">
            <ErrorState
              tieuDe="Chưa thể tải danh mục"
              moTa="Hệ thống đang tạm thời không phản hồi. Hãy thử lại."
              onThuLai={() => void facetsQuery.refetch()}
            />
          </Box>
        ) : (
          <SimpleGrid cols={{ base: 4, sm: 6, md: 8 }} spacing="sm" mt="lg">
            {danhMuc.slice(0, 8).map((item) => (
              <Card
                key={item.value}
                component={Link}
                href={`/san-pham?category=${encodeURIComponent(item.value)}`}
                padding="xs"
                withBorder
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor: '#E7ECE9',
                  textAlign: 'center',
                }}
              >
                <Image
                  src={anhDuPhongDanhMuc(item.label)}
                  alt={item.label}
                  h={62}
                  w="100%"
                  fit="cover"
                  radius="md"
                />
                <Text mt={7} size="xs" fw={750} lineClamp={1}>
                  {item.label}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </AgriContainer>

      <Box py={{ base: 28, md: 38 }} bg="#FAFCFB">
        <AgriContainer>
          <SectionTitle
            title={coThuHoachGanDay ? 'Mới thu hoạch' : 'Nông sản mới'}
            description={
              coThuHoachGanDay
                ? 'Sản phẩm còn hàng có dữ liệu thu hoạch trong 45 ngày gần đây.'
                : 'Sản phẩm mới được công khai và đang có thể đặt hàng.'
            }
            href="/san-pham?sort=MOI_NHAT"
          />

          {productPending ? (
            <Box mt="lg">
              <AgriSkeleton soLuong={5} />
            </Box>
          ) : productError ? (
            <Box mt="lg">
              <ErrorState
                tieuDe="Chưa thể tải nông sản"
                moTa="Hệ thống đang tạm thời không phản hồi. Hãy thử lại."
                onThuLai={() => {
                  void moiThuHoachQuery.refetch();
                  void moiNhatQuery.refetch();
                  void noiBatQuery.refetch();
                }}
              />
            </Box>
          ) : sanPhamMoi.length === 0 ? (
            <Box mt="lg">
              <EmptyState
                tieuDe="Chưa có nông sản phù hợp"
                moTa="Sản phẩm sẽ xuất hiện khi trang trại công khai dữ liệu và có hàng."
              />
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md" mt="lg">
              {sanPhamMoi.map((item) => (
                <ProductCard
                  key={item.id}
                  ten={item.ten}
                  tenTrangTrai={item.trangTrai.ten}
                  giaTu={item.gia.tu}
                  donVi={dinhDangQuyCachSanPham(item.quyCach)}
                  href={`/san-pham/${item.id}`}
                  anh={anhSanPham(item.anhBiaUrl, item.ten)}
                  nhan={nhanSanPham(item)}
                />
              ))}
            </SimpleGrid>
          )}
        </AgriContainer>
      </Box>

      {noiBat.length > 0 ? (
        <AgriContainer py={{ base: 30, md: 42 }}>
          <SectionTitle
            title="Sản phẩm nổi bật"
            description="Xếp hạng từ dữ liệu công khai và tình trạng sẵn sàng đặt hàng."
            href="/san-pham"
          />
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg" mt="lg">
            {noiBat.map((item) => (
              <ProductCard
                key={item.id}
                ten={item.ten}
                tenTrangTrai={item.trangTrai.ten}
                giaTu={item.gia.tu}
                donVi={dinhDangQuyCachSanPham(item.quyCach)}
                href={`/san-pham/${item.id}`}
                anh={anhSanPham(item.anhBiaUrl, item.ten)}
                nhan={nhanSanPham(item)}
              />
            ))}
          </SimpleGrid>
        </AgriContainer>
      ) : null}

      {trangTrai.length > 0 ? (
        <Box py={{ base: 30, md: 42 }} bg="#F7FAF8">
          <AgriContainer>
            <SectionTitle
              title="Trang trại tiêu biểu"
              description="Các trang trại đang có sản phẩm công khai trong danh sách hiện tại."
              href="/san-pham"
            />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="lg">
              {trangTrai.map((farm) => (
                <FarmCard
                  key={farm.id}
                  ten={farm.ten}
                  diaChi={farm.diaChi}
                  soSanPham={farm.soSanPham}
                  daXacMinh={farm.daXacMinh}
                  href={`/trang-trai/${farm.id}`}
                />
              ))}
            </SimpleGrid>
          </AgriContainer>
        </Box>
      ) : null}

      <AgriContainer py={{ base: 30, md: 42 }}>
        <Paper
          p={0}
          withBorder
          style={{ overflow: 'hidden', borderColor: '#DCE7DF', background: '#FFFFFF' }}
        >
          <Grid gap={0} align="stretch">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Image
                src={ANH_TRUY_XUAT_AGRIMARKET}
                alt="Truy xuất nguồn gốc nông sản"
                h={{ base: 240, md: 360 }}
                w="100%"
                fit="cover"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack
                h="100%"
                justify="center"
                p={{ base: 24, md: 40 }}
                gap="md"
                bg="#055235"
                c="white"
              >
                <ThemeIcon size={46} radius="md" color="agrimarket.2" c="agrimarket.8">
                  <IconQrcode size={25} />
                </ThemeIcon>
                <Title order={2} c="white" fz={{ base: 28, md: 34 }}>
                  Truy xuất đúng lô hàng bạn đang cầm trên tay
                </Title>
                <Text c="rgba(255,255,255,.82)">
                  Nhập mã trên tem hoặc QR để xem nơi sản xuất, mùa vụ, thu hoạch, kiểm định,
                  chứng nhận và cảnh báo thu hồi khi có dữ liệu công khai.
                </Text>
                <Group gap="sm">
                  <Button
                    component={Link}
                    href="/truy-xuat"
                    color="white"
                    c="agrimarket.8"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Kiểm tra mã truy xuất
                  </Button>
                  <Group gap={5}>
                    <IconMapPin size={17} />
                    <Text size="sm" fw={700}>
                      Minh bạch theo từng lô hàng
                    </Text>
                  </Group>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </AgriContainer>

      <Box py={{ base: 24, md: 30 }} bg="#F1FAF5">
        <AgriContainer>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            {[
              ['Nông sản công khai', 'Giá và quy cách rõ ràng'],
              ['Thanh toán theo hệ thống', 'Không tự suy diễn tổng tiền'],
              ['Theo dõi đơn hàng', 'Cập nhật trạng thái'],
              ['Truy xuất theo lô', 'QR gắn với lô cụ thể'],
            ].map(([title, subtitle]) => (
              <Stack key={title} gap={2} align="center">
                <Text fw={850} c="agrimarket.8" ta="center">
                  {title}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {subtitle}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </AgriContainer>
      </Box>
    </Box>
  );
}
