'use client';

import {
  useLayChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
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
import { IconArrowRight, IconMapPin, IconQrcode, IconShieldCheck } from '@tabler/icons-react';
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
      <AgriContainer py={{ base: 16, md: 20 }}>
        <Paper
          radius="md"
          mih={{ base: 330, md: 350 }}
          p={0}
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url("${ANH_HERO_AGRIMARKET}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid #e1e3dc',
          }}
        >
          <Box
            pos="absolute"
            inset={0}
            style={{
              background:
                'linear-gradient(90deg, rgba(11,34,19,.82) 0%, rgba(11,34,19,.64) 45%, rgba(11,34,19,.18) 74%, rgba(11,34,19,.04) 100%)',
            }}
          />

          <Stack
            pos="relative"
            justify="center"
            gap="md"
            h="100%"
            mih={{ base: 330, md: 350 }}
            p={{ base: 24, sm: 34, md: 42 }}
            maw={610}
          >
            <Text size="sm" fw={800} c="green.1">
              Từ trang trại đến bữa ăn
            </Text>

            <Stack gap="xs">
              <Title
                order={1}
                c="white"
                fz={{ base: 32, sm: 39, md: 44 }}
                fw={850}
                lh={1.08}
                maw={570}
              >
                Nông sản tươi, rõ nơi sản xuất
              </Title>

              <Text c="rgba(255,255,255,.82)" size="md" maw={530}>
                Chọn sản phẩm từ trang trại và kiểm tra nguồn gốc theo đúng lô hàng khi có mã trên
                tem hoặc QR.
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
                Xem nông sản
              </Button>

              <Button
                component={Link}
                href="/truy-xuat"
                size="md"
                variant="outline"
                color="white"
                leftSection={<IconQrcode size={18} />}
              >
                Truy xuất nguồn gốc
              </Button>
            </Group>
          </Stack>
        </Paper>
      </AgriContainer>

      <Box py={{ base: 22, md: 28 }} style={{ borderBottom: '1px solid #ecece7' }}>
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
                  h={104}
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

      <Box py={{ base: 30, md: 40 }} bg="#fafaf7">
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
        <Box py={{ base: 30, md: 40 }}>
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

      <Box py={{ base: 32, md: 40 }} bg="#f6f8f5">
        <AgriContainer>
          <Paper
            radius="md"
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
                h={{ base: 230, md: 330 }}
                w="100%"
                fit="cover"
              />

              <Stack justify="center" gap="md" p={{ base: 24, md: 36 }} bg="agrimarket.9">
                <ThemeIcon size={42} radius="md" variant="light" color="green">
                  <IconQrcode size={23} />
                </ThemeIcon>

                <Stack gap={6}>
                  <Title order={2} c="white" fz={{ base: 26, md: 30 }} fw={850}>
                    Truy xuất đúng lô hàng bạn đang cầm trên tay
                  </Title>
                  <Text c="rgba(255,255,255,.76)" size="sm">
                    Dùng mã trên tem hoặc QR để xem nơi sản xuất, mùa vụ, thu hoạch, kiểm định và
                    chứng nhận liên quan.
                  </Text>
                </Stack>

                <Stack gap="xs">
                  <Group gap="sm" wrap="nowrap">
                    <IconQrcode size={18} color="#bce5c5" />
                    <Text size="sm" c="white">
                      Nhập mã trên tem hoặc nội dung QR
                    </Text>
                  </Group>
                  <Group gap="sm" wrap="nowrap">
                    <IconMapPin size={18} color="#bce5c5" />
                    <Text size="sm" c="white">
                      Xem đúng trang trại và thông tin của lô
                    </Text>
                  </Group>
                  <Group gap="sm" wrap="nowrap">
                    <IconShieldCheck size={18} color="#bce5c5" />
                    <Text size="sm" c="white">
                      Kiểm tra chứng nhận và các mốc đã công khai
                    </Text>
                  </Group>
                </Stack>

                <Button
                  component={Link}
                  href="/truy-xuat"
                  color="white"
                  c="agrimarket.9"
                  w="fit-content"
                  rightSection={<IconArrowRight size={16} />}
                >
                  Kiểm tra mã truy xuất
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
    </Box>
  );
}
