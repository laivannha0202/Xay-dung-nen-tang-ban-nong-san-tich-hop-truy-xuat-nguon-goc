'use client';

import {
  useLayChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
  Badge,
  Box,
  Button,
  Card,
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
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

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

const GIOI_HAN_TRANG_CHU = 24;
const SO_SAN_PHAM_SECTION = 8;
const SO_SAN_PHAM_MOI = 4;

const DANH_MUC_TRANG_CHU = [
  { ten: 'Rau xanh', moTa: 'Rau ăn lá, rau gia vị', href: '/san-pham?q=rau' },
  { ten: 'Trái cây', moTa: 'Trái cây theo mùa', href: '/san-pham?q=trái cây' },
  { ten: 'Gạo & ngũ cốc', moTa: 'Gạo, nếp và hạt', href: '/san-pham?q=gạo' },
  { ten: 'Nông sản hữu cơ', moTa: 'Sản phẩm có chứng nhận', href: '/san-pham?certificate=Organic' },
  { ten: 'Đặc sản vùng miền', moTa: 'Sản vật địa phương', href: '/san-pham?q=đặc sản' },
  { ten: 'Mới thu hoạch', moTa: 'Ưu tiên sản phẩm mới', href: '/san-pham?sort=MOI_NHAT' },
] as const;

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
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
      {action}
    </Group>
  );
}

function anhSanPham(url: string | null, ten: string) {
  if (!url) return undefined;

  return <Image src={url} alt={ten} h="100%" w="100%" fit="cover" loading="lazy" />;
}

function nhanSanPham(item: { danhMuc: { ten: string }; khaDung: { coTheDatHang: boolean } }) {
  return [item.danhMuc.ten, item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng'];
}

function SanPhamMoiThuHoach({ id, fallbackTen }: { id: string; fallbackTen: string }) {
  const { data, isPending, isError } = useLayChiTietSanPhamCongKhai(id);
  const item = data?.data;

  if (isPending) {
    return (
      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Box h={180} bg="gray.1" />
          <Text fw={700}>{fallbackTen}</Text>
        </Stack>
      </Card>
    );
  }

  if (isError || !item) return null;

  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;
  if (!thuHoach) return null;

  return (
    <ProductCard
      ten={item.ten}
      tenTrangTrai={item.trangTrai.ten}
      giaTu={item.gia.tu}
      donVi="đơn vị"
      href={`/san-pham/${item.id}`}
      anh={anhSanPham(item.anhBiaUrl, item.ten)}
      nhan={[`Thu hoạch ${thuHoach.ngayThuHoach}`, thuHoach.cayTrong]}
    />
  );
}

export function TrangChuContent() {
  const { data, isPending, isError, refetch } = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: GIOI_HAN_TRANG_CHU,
  });

  const response = data?.data;
  const sanPham = response?.duLieu ?? [];
  const conHang = sanPham.filter((item) => item.khaDung.coTheDatHang);

  const noiBat = [...sanPham]
    .sort(
      (a, b) =>
        Number(b.khaDung.coTheDatHang) - Number(a.khaDung.coTheDatHang) ||
        b.chungNhan.length - a.chungNhan.length ||
        b.khaDung.soLuongKhaDung - a.khaDung.soLuongKhaDung ||
        a.gia.tu - b.gia.tu,
    )
    .slice(0, SO_SAN_PHAM_SECTION);

  const moiThuHoach = (conHang.length > 0 ? conHang : sanPham).slice(0, SO_SAN_PHAM_MOI);

  const trangTrai = Array.from(
    sanPham
      .reduce(
        (map, item) => {
          const current = map.get(item.trangTrai.id);

          map.set(item.trangTrai.id, {
            ...item.trangTrai,
            soSanPham: (current?.soSanPham ?? 0) + 1,
            daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0,
          });

          return map;
        },
        new Map<
          string,
          {
            id: string;
            ma: string;
            ten: string;
            diaChi: string;
            soSanPham: number;
            daXacMinh: boolean;
          }
        >(),
      )
      .values(),
  )
    .sort(
      (a, b) =>
        Number(b.daXacMinh) - Number(a.daXacMinh) ||
        b.soSanPham - a.soSanPham ||
        a.ten.localeCompare(b.ten, 'vi'),
    )
    .slice(0, 4);

  const cardSanPham = (item: (typeof sanPham)[number]) => (
    <ProductCard
      key={item.id}
      ten={item.ten}
      tenTrangTrai={item.trangTrai.ten}
      giaTu={item.gia.tu}
      donVi="đơn vị"
      href={`/san-pham/${item.id}`}
      anh={anhSanPham(item.anhBiaUrl, item.ten)}
      nhan={nhanSanPham(item)}
    />
  );

  return (
    <Box bg="white">
      <AgriContainer py={{ base: 18, md: 24 }}>
        <Paper
          radius="lg"
          mih={{ base: 360, md: 390 }}
          p={0}
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url("${ANH_HERO_AGRIMARKET}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box
            pos="absolute"
            inset={0}
            style={{
              background:
                'linear-gradient(90deg, rgba(15,38,23,.88) 0%, rgba(15,38,23,.72) 42%, rgba(15,38,23,.15) 72%, rgba(15,38,23,.04) 100%)',
            }}
          />

          <Stack
            pos="relative"
            justify="center"
            gap="lg"
            h="100%"
            mih={{ base: 360, md: 390 }}
            p={{ base: 26, sm: 38, md: 48 }}
            maw={640}
          >
            <Badge color="white" c="agrimarket.9" radius="sm" variant="filled" w="fit-content">
              Nông sản minh bạch
            </Badge>

            <Stack gap="sm">
              <Title
                order={1}
                c="white"
                fz={{ base: 36, sm: 44, md: 50 }}
                fw={900}
                lh={1.06}
                maw={600}
              >
                Nông sản tươi từ những trang trại bạn có thể tìm hiểu
              </Title>

              <Text c="rgba(255,255,255,.82)" size="lg" maw={560}>
                Chọn nông sản, xem nơi sản xuất và kiểm tra nguồn gốc theo từng lô hàng khi có mã
                truy xuất.
              </Text>
            </Stack>

            <Group gap="sm">
              <Button
                component={Link}
                href="/san-pham"
                size="md"
                color="white"
                c="agrimarket.9"
                rightSection={<IconArrowRight size={17} />}
              >
                Mua nông sản
              </Button>

              <Button
                component={Link}
                href="/truy-xuat"
                size="md"
                variant="outline"
                color="white"
                leftSection={<IconQrcode size={18} />}
              >
                Kiểm tra mã
              </Button>
            </Group>
          </Stack>
        </Paper>
      </AgriContainer>

      <Box py={{ base: 24, md: 30 }} style={{ borderBottom: '1px solid #ecece7' }}>
        <AgriContainer>
          <SectionTitle
            title="Danh mục nông sản"
            description="Tìm nhanh theo nhóm sản phẩm bạn thường mua."
            action={
              <Button
                component={Link}
                href="/san-pham"
                variant="subtle"
                rightSection={<IconArrowRight size={16} />}
              >
                Xem tất cả
              </Button>
            }
          />

          <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md" mt="lg">
            {DANH_MUC_TRANG_CHU.map((item) => (
              <Card
                key={item.ten}
                component={Link}
                href={item.href}
                withBorder
                radius="md"
                padding={0}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  overflow: 'hidden',
                  borderColor: '#e0e2dc',
                }}
              >
                <Image
                  src={anhDuPhongDanhMuc(item.ten)}
                  alt={item.ten}
                  h={112}
                  w="100%"
                  fit="cover"
                />

                <Stack gap={2} p="sm">
                  <Text fw={800} size="sm" lineClamp={1}>
                    {item.ten}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {item.moTa}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <Box py={{ base: 34, md: 46 }} bg="#fafaf7">
        <AgriContainer>
          {isPending ? (
            <Stack gap="lg">
              <SectionTitle title="Nông sản nổi bật" />
              <AgriSkeleton soLuong={8} />
            </Stack>
          ) : isError ? (
            <ErrorState
              tieuDe="Chưa thể tải nông sản"
              moTa="Hệ thống đang tạm thời không phản hồi. Hãy thử lại."
              onThuLai={() => void refetch()}
            />
          ) : sanPham.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có nông sản công khai"
              moTa="Sản phẩm mới sẽ xuất hiện khi được công khai trên AgriMarket."
              hanhDong={
                <Button component={Link} href="/truy-xuat" variant="light">
                  Kiểm tra truy xuất
                </Button>
              }
            />
          ) : (
            <Stack gap="lg">
              <SectionTitle
                title="Nông sản nổi bật"
                description="Những sản phẩm đang còn hàng và có thông tin rõ ràng."
                action={
                  <Button
                    component={Link}
                    href="/san-pham"
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Xem tất cả
                  </Button>
                }
              />

              <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="lg">
                {noiBat.map((item) => cardSanPham(item))}
              </SimpleGrid>
            </Stack>
          )}
        </AgriContainer>
      </Box>

      {moiThuHoach.length > 0 ? (
        <Box py={{ base: 34, md: 46 }}>
          <AgriContainer>
            <Stack gap="lg">
              <SectionTitle
                title="Mới thu hoạch"
                description="Các sản phẩm đang có thông tin thu hoạch gần nhất."
                action={
                  <Button
                    component={Link}
                    href="/san-pham?sort=MOI_NHAT"
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Xem hàng mới
                  </Button>
                }
              />

              <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg">
                {moiThuHoach.map((item) => (
                  <SanPhamMoiThuHoach key={item.id} id={item.id} fallbackTen={item.ten} />
                ))}
              </SimpleGrid>
            </Stack>
          </AgriContainer>
        </Box>
      ) : null}

      <Box py={{ base: 34, md: 46 }} bg="#f4f7f3">
        <AgriContainer>
          <Paper
            radius="lg"
            p={0}
            style={{
              overflow: 'hidden',
              border: '1px solid #dce5dc',
              background: '#ffffff',
            }}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
              <Image
                src={ANH_TRUY_XUAT_AGRIMARKET}
                alt="Truy xuất nguồn gốc nông sản"
                h={{ base: 260, md: 390 }}
                w="100%"
                fit="cover"
              />

              <Stack justify="center" gap="lg" p={{ base: 26, md: 42 }} bg="agrimarket.9">
                <ThemeIcon size={46} radius="md" variant="light" color="green">
                  <IconQrcode size={26} />
                </ThemeIcon>

                <Stack gap="sm">
                  <Title order={2} c="white" fz={{ base: 28, md: 34 }}>
                    Kiểm tra nguồn gốc theo đúng lô hàng
                  </Title>
                  <Text c="rgba(255,255,255,.78)">
                    Nhập mã trên tem hoặc QR để xem mùa vụ, thu hoạch, kiểm định, chứng nhận và các
                    mốc truy xuất đã được công khai.
                  </Text>
                </Stack>

                <SimpleGrid cols={2} spacing="sm">
                  {[
                    ['01', 'Nhập mã trên tem'],
                    ['02', 'Xác định lô hàng'],
                    ['03', 'Xem trang trại'],
                    ['04', 'Theo dõi hành trình'],
                  ].map(([so, noiDung]) => (
                    <Group
                      key={so}
                      gap="sm"
                      wrap="nowrap"
                      p="sm"
                      style={{
                        border: '1px solid rgba(255,255,255,.14)',
                        borderRadius: 8,
                      }}
                    >
                      <Text fw={900} c="green.2">
                        {so}
                      </Text>
                      <Text size="sm" fw={700} c="white">
                        {noiDung}
                      </Text>
                    </Group>
                  ))}
                </SimpleGrid>

                <Button
                  component={Link}
                  href="/truy-xuat"
                  color="white"
                  c="agrimarket.9"
                  w="fit-content"
                  rightSection={<IconArrowRight size={16} />}
                >
                  Truy xuất nguồn gốc
                </Button>
              </Stack>
            </SimpleGrid>
          </Paper>
        </AgriContainer>
      </Box>

      {trangTrai.length > 0 ? (
        <Box py={{ base: 34, md: 46 }}>
          <AgriContainer>
            <Stack gap="lg">
              <SectionTitle
                title="Trang trại trên AgriMarket"
                description="Xem nơi sản xuất và những nông sản đang được giới thiệu."
                action={
                  <Button
                    component={Link}
                    href="/theo-doi"
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Trang trại theo dõi
                  </Button>
                }
              />

              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
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
            </Stack>
          </AgriContainer>
        </Box>
      ) : null}

      <Box
        py={{ base: 28, md: 34 }}
        bg="#fafaf7"
        style={{
          borderTop: '1px solid #ecece7',
          borderBottom: '1px solid #ecece7',
        }}
      >
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={42} radius="md" variant="light">
                <IconShieldCheck size={22} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={800}>Nguồn gốc rõ ràng</Text>
                <Text size="xs" c="dimmed">
                  Thông tin sản phẩm và lô hàng được tách biệt rõ ràng.
                </Text>
              </Stack>
            </Group>

            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={42} radius="md" variant="light" color="teal">
                <IconMapPin size={22} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={800}>Biết nơi sản xuất</Text>
                <Text size="xs" c="dimmed">
                  Xem trang trại, địa chỉ và chứng nhận đang công khai.
                </Text>
              </Stack>
            </Group>

            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={42} radius="md" variant="light" color="earth">
                <IconTruckDelivery size={22} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={800}>Mua sắm thuận tiện</Text>
                <Text size="xs" c="dimmed">
                  Từ sản phẩm đến giỏ hàng và đơn hàng trong cùng hệ thống.
                </Text>
              </Stack>
            </Group>
          </SimpleGrid>
        </AgriContainer>
      </Box>
    </Box>
  );
}
