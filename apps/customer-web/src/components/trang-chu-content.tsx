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
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconShoppingCart,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  ANH_CAU_CHUYEN_TRANG_TRAI,
  ANH_HERO_AGRIMARKET,
  anhDuPhongDanhMuc,
} from '@/lib/demo-images';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FarmCard } from './farm-card';
import { ProductCard } from './product-card';

const GIOI_HAN_TRANG_CHU = 24;
const SO_SAN_PHAM_NOI_BAT = 4;
const SO_SAN_PHAM_MOI_THU_HOACH = 4;

const NHOM_KHAM_PHA = [
  { ten: 'Rau xanh', href: '/san-pham?q=rau' },
  { ten: 'Trái cây', href: '/san-pham?q=trái cây' },
  { ten: 'Gạo & ngũ cốc', href: '/san-pham?q=gạo' },
  { ten: 'Nông sản hữu cơ', href: '/san-pham?certificate=Organic' },
  { ten: 'Đặc sản vùng miền', href: '/san-pham?q=đặc sản' },
  { ten: 'Mới thu hoạch', href: '/san-pham?sort=MOI_NHAT' },
] as const;

type SectionHeadProps = {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

function SectionHead({ kicker, title, description, action }: SectionHeadProps) {
  return (
    <Group
      className="farm-section-head"
      justify="space-between"
      align="flex-end"
      gap="lg"
      wrap="wrap"
    >
      <Stack gap={5} maw={720}>
        <Text className="farm-kicker">{kicker}</Text>
        <Title order={2} className="farm-section-title">
          {title}
        </Title>
        {description ? <Text c="dimmed">{description}</Text> : null}
      </Stack>
      {action}
    </Group>
  );
}

function anhSanPham(url: string | null, ten: string) {
  if (!url) return undefined;
  return (
    <Image src={url} alt={ten} h="100%" fit="cover" loading="lazy" className="farm-product-image" />
  );
}

function labels(item: { danhMuc: { ten: string }; khaDung: { coTheDatHang: boolean } }) {
  return [item.danhMuc.ten, item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng'];
}

function SanPhamMoiThuHoach({ id, fallbackTen }: { id: string; fallbackTen: string }) {
  const { data, isPending, isError } = useLayChiTietSanPhamCongKhai(id);
  const item = data?.data;

  if (isPending) {
    return (
      <Card withBorder p="md" className="farm-panel">
        <Stack gap="sm">
          <Box h={220} bg="earth.1" />
          <Text fw={800}>{fallbackTen}</Text>
          <Text size="sm" c="dimmed">
            Đang cập nhật thông tin thu hoạch...
          </Text>
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

function EditorialCard({
  tone = 'white',
  icon,
  title,
  description,
  href,
  linkText,
}: {
  tone?: 'white' | 'green' | 'earth';
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  const className =
    tone === 'green'
      ? 'farm-editorial-card farm-editorial-card--green'
      : tone === 'white'
        ? 'farm-editorial-card farm-editorial-card--white'
        : 'farm-editorial-card';

  return (
    <Box className={className}>
      <Stack h="100%" justify="space-between" gap="xl">
        <Stack gap="md">
          <Box c={tone === 'green' ? 'white' : 'agrimarket.8'}>{icon}</Box>
          <Text
            className="farm-display"
            fw={850}
            fz="xl"
            c={tone === 'green' ? 'white' : undefined}
            style={{ lineHeight: 1.05 }}
          >
            {title}
          </Text>
          <Text size="sm" c={tone === 'green' ? 'rgba(255,255,255,.78)' : 'dimmed'}>
            {description}
          </Text>
        </Stack>

        <Button
          component={Link}
          href={href}
          variant={tone === 'green' ? 'white' : 'subtle'}
          color={tone === 'green' ? 'white' : 'agrimarket'}
          c={tone === 'green' ? 'agrimarket.9' : undefined}
          rightSection={<IconArrowRight size={16} />}
          w="fit-content"
        >
          {linkText}
        </Button>
      </Stack>
    </Box>
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

  const goiY = [...sanPham]
    .sort(
      (a, b) =>
        Number(b.khaDung.coTheDatHang) - Number(a.khaDung.coTheDatHang) ||
        b.chungNhan.length - a.chungNhan.length ||
        b.khaDung.soLuongKhaDung - a.khaDung.soLuongKhaDung ||
        a.gia.tu - b.gia.tu,
    )
    .slice(0, SO_SAN_PHAM_NOI_BAT);

  const moiThuHoach = (conHang.length > 0 ? conHang : sanPham).slice(0, SO_SAN_PHAM_MOI_THU_HOACH);

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
      nhan={labels(item)}
    />
  );

  const editorialFillers: ReactNode[] = [
    <EditorialCard
      key="trace"
      tone="green"
      icon={<IconQrcode size={30} stroke={1.6} />}
      title="Có mã trên tem? Kiểm tra nguồn gốc ngay"
      description="Xem lô hàng, mùa vụ, thu hoạch, kiểm định và chứng nhận đã được công khai."
      href="/truy-xuat"
      linkText="Truy xuất nguồn gốc"
    />,
    <EditorialCard
      key="farm"
      tone="earth"
      icon={<IconMapPin size={30} stroke={1.6} />}
      title="Mua từ trang trại bạn biết"
      description="Theo dõi trang trại và khám phá những sản phẩm đang được giới thiệu."
      href="/theo-doi"
      linkText="Xem trang trại"
    />,
    <EditorialCard
      key="fresh"
      icon={<IconLeaf size={30} stroke={1.6} />}
      title="Ưu tiên nông sản mới"
      description="Tìm nhanh những sản phẩm vừa được cập nhật và đang còn khả dụng."
      href="/san-pham?sort=MOI_NHAT"
      linkText="Xem hàng mới"
    />,
  ];

  return (
    <>
      <Box className="farm-hero">
        <AgriContainer px={0}>
          <Box className="farm-hero-grid">
            <Box className="farm-hero-photo">
              <Image
                src={ANH_HERO_AGRIMARKET}
                alt="Quầy nông sản tươi"
                h="100%"
                w="100%"
                fit="cover"
              />
              <Stack className="farm-hero-caption" gap={3}>
                <Text size="xs" fw={800} tt="uppercase" lts=".1em">
                  Rau củ · Trái cây · Nông sản địa phương
                </Text>
                <Text fw={700} size="sm">
                  Chọn thực phẩm bằng mắt, kiểm tra nguồn gốc bằng dữ liệu.
                </Text>
              </Stack>
            </Box>

            <Box className="farm-hero-copy">
              <Stack gap="xl">
                <Stack gap="md">
                  <Text className="farm-kicker">Chợ nông sản AgriMarket</Text>
                  <h1 className="farm-hero-title">Nông sản tươi từ nơi bạn có thể tìm hiểu</h1>
                  <Text size="lg" c="dimmed" maw={560}>
                    Mua nông sản từ trang trại, xem thông tin sản phẩm và kiểm tra hành trình của lô
                    hàng khi có mã truy xuất.
                  </Text>
                </Stack>

                <Group className="farm-hero-actions">
                  <Button component={Link} href="/san-pham" size="lg">
                    Đi chợ nông sản
                  </Button>
                  <Button component={Link} href="/truy-xuat" variant="outline" size="lg">
                    Kiểm tra mã QR
                  </Button>
                </Group>

                <Group gap="xl" wrap="wrap">
                  <Group gap={8} wrap="nowrap">
                    <IconShieldCheck size={20} color="#35633e" />
                    <Text size="sm" fw={700}>
                      Nguồn gốc rõ ràng
                    </Text>
                  </Group>
                  <Group gap={8} wrap="nowrap">
                    <IconLeaf size={20} color="#35633e" />
                    <Text size="sm" fw={700}>
                      Kết nối trang trại
                    </Text>
                  </Group>
                  <Group gap={8} wrap="nowrap">
                    <IconShoppingCart size={20} color="#35633e" />
                    <Text size="sm" fw={700}>
                      Mua sắm đa nền tảng
                    </Text>
                  </Group>
                </Group>
              </Stack>
            </Box>
          </Box>

          <Box className="farm-trust-row">
            <AgriContainer>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={0}>
                <Box className="farm-stat">
                  <Text fw={900} fz="xl" className="farm-display">
                    {response?.tong ?? 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    sản phẩm công khai hiện có
                  </Text>
                </Box>
                <Box className="farm-stat">
                  <Text fw={900} fz="xl" className="farm-display">
                    {trangTrai.length}
                  </Text>
                  <Text size="xs" c="dimmed">
                    trang trại đang được giới thiệu
                  </Text>
                </Box>
                <Box className="farm-stat">
                  <Text fw={900} fz="xl" className="farm-display">
                    1 mã
                  </Text>
                  <Text size="xs" c="dimmed">
                    để kiểm tra đúng lô hàng
                  </Text>
                </Box>
              </SimpleGrid>
            </AgriContainer>
          </Box>
        </AgriContainer>
      </Box>

      <Box className="farm-section">
        <AgriContainer>
          <SectionHead
            kicker="Đi chợ nhanh"
            title="Bạn đang tìm gì hôm nay?"
            description="Chọn nhóm nông sản quen thuộc để bắt đầu."
          />

          <Box className="farm-category-grid">
            {NHOM_KHAM_PHA.map((item) => (
              <Link key={item.ten} href={item.href} className="farm-category-link">
                <Box className="farm-category-image">
                  <Image
                    src={anhDuPhongDanhMuc(item.ten)}
                    alt={item.ten}
                    h="100%"
                    w="100%"
                    fit="cover"
                  />
                </Box>
                <div className="farm-category-name">{item.ten}</div>
              </Link>
            ))}
          </Box>
        </AgriContainer>
      </Box>

      <Box className="farm-section">
        <AgriContainer>
          {isPending ? (
            <Stack gap="xl">
              <SectionHead kicker="Đang cập nhật" title="Nông sản hôm nay" />
              <AgriSkeleton soLuong={4} />
            </Stack>
          ) : isError ? (
            <ErrorState
              tieuDe="Chưa thể tải nông sản"
              moTa="Hệ thống đang tạm thời không phản hồi. Hãy thử lại sau."
              onThuLai={() => void refetch()}
            />
          ) : sanPham.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có nông sản công khai"
              moTa="Sản phẩm mới sẽ xuất hiện tại đây khi được công khai trên AgriMarket."
            />
          ) : (
            <>
              <SectionHead
                kicker="Nông sản hôm nay"
                title="Lựa chọn đang có trên AgriMarket"
                description="Sản phẩm thật từ dữ liệu công khai, ưu tiên những mặt hàng đang còn khả dụng."
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

              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                {goiY.map((item) => cardSanPham(item))}
                {editorialFillers.slice(0, Math.max(0, 4 - goiY.length))}
              </SimpleGrid>
            </>
          )}
        </AgriContainer>
      </Box>

      <Box className="farm-section">
        <AgriContainer>
          <Box className="farm-story">
            <Box
              className="farm-story-photo"
              style={{ backgroundImage: `url("${ANH_CAU_CHUYEN_TRANG_TRAI}")` }}
            />
            <Box className="farm-story-copy">
              <Stack gap="lg">
                <Text className="farm-kicker">Từ nơi sản xuất</Text>
                <Title order={2} className="farm-section-title">
                  Biết mình mua từ đâu là một phần của trải nghiệm mua hàng
                </Title>
                <Text c="dimmed" size="lg">
                  AgriMarket không chỉ hiển thị tên sản phẩm. Mỗi sản phẩm có thể gắn với trang
                  trại, thông tin thu hoạch, chứng nhận và dữ liệu truy xuất của lô hàng thực tế.
                </Text>
                <Group>
                  <Button component={Link} href="/theo-doi">
                    Trang trại đang theo dõi
                  </Button>
                  <Button component={Link} href="/truy-xuat" variant="outline">
                    Cách truy xuất hoạt động
                  </Button>
                </Group>
              </Stack>
            </Box>
          </Box>
        </AgriContainer>
      </Box>

      {moiThuHoach.length > 0 ? (
        <Box className="farm-section">
          <AgriContainer>
            <SectionHead
              kicker="Theo mùa"
              title="Mới thu hoạch"
              description="Thông tin thu hoạch gần nhất của những sản phẩm đang có dữ liệu phù hợp."
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

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {moiThuHoach.map((item) => (
                <SanPhamMoiThuHoach key={item.id} id={item.id} fallbackTen={item.ten} />
              ))}
            </SimpleGrid>
          </AgriContainer>
        </Box>
      ) : null}

      <Box className="farm-section">
        <AgriContainer>
          <Box className="farm-trace-card">
            <Box className="farm-trace-grid">
              <Stack className="farm-trace-copy" gap="lg" justify="center">
                <IconQrcode size={44} stroke={1.4} />
                <Stack gap="sm">
                  <Text size="xs" fw={850} tt="uppercase" lts=".12em" c="agrimarket.1">
                    Truy xuất nguồn gốc
                  </Text>
                  <Title order={2} c="white" className="farm-display" fz={{ base: 31, md: 42 }}>
                    Một mã cho đúng một lô hàng
                  </Title>
                  <Text c="rgba(255,255,255,.76)">
                    Dùng mã trên tem hoặc QR để xem đúng hành trình của lô sản phẩm thay vì suy đoán
                    từ tên sản phẩm chung.
                  </Text>
                </Stack>
                <Button
                  component={Link}
                  href="/truy-xuat"
                  variant="white"
                  c="agrimarket.9"
                  w="fit-content"
                >
                  Kiểm tra mã truy xuất
                </Button>
              </Stack>

              <Box className="farm-trace-steps">
                {[
                  ['01', 'Mùa vụ', 'Ngày trồng, cây trồng và giống.'],
                  ['02', 'Canh tác', 'Các mốc nhật ký đã công khai.'],
                  ['03', 'Thu hoạch', 'Ngày thu hoạch và phân loại.'],
                  ['04', 'Kiểm định', 'Chứng nhận, kiểm định và cảnh báo.'],
                ].map(([so, tieuDe, moTa]) => (
                  <Box key={so} className="farm-trace-step">
                    <Stack gap="sm">
                      <Text className="farm-trace-step-number">{so}</Text>
                      <Text fw={850} fz="lg" c="white">
                        {tieuDe}
                      </Text>
                      <Text size="sm" c="rgba(255,255,255,.7)">
                        {moTa}
                      </Text>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </AgriContainer>
      </Box>

      {trangTrai.length > 0 ? (
        <Box className="farm-section">
          <AgriContainer>
            <SectionHead
              kicker="Người trồng & nơi sản xuất"
              title="Khám phá trang trại"
              description="Xem địa chỉ, sản phẩm đang giới thiệu và thông tin xác minh của từng trang trại."
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
          </AgriContainer>
        </Box>
      ) : null}

      <Box className="farm-section">
        <AgriContainer>
          <Paper withBorder p={{ base: 'lg', md: 28 }} className="farm-panel">
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              <Group gap="md" wrap="nowrap">
                <IconTruckDelivery size={30} stroke={1.5} color="#35633e" />
                <Stack gap={2}>
                  <Text fw={850}>Theo dõi đơn hàng</Text>
                  <Text size="sm" c="dimmed">
                    Xem trạng thái đơn đã đặt trong tài khoản.
                  </Text>
                </Stack>
              </Group>
              <Group gap="md" wrap="nowrap">
                <IconShieldCheck size={30} stroke={1.5} color="#35633e" />
                <Stack gap={2}>
                  <Text fw={850}>Thông tin minh bạch</Text>
                  <Text size="sm" c="dimmed">
                    Nguồn gốc và chứng nhận hiển thị theo dữ liệu công khai.
                  </Text>
                </Stack>
              </Group>
              <Group gap="md" wrap="nowrap">
                <IconQrcode size={30} stroke={1.5} color="#35633e" />
                <Stack gap={2}>
                  <Text fw={850}>Truy xuất theo lô</Text>
                  <Text size="sm" c="dimmed">
                    Mã trên lô hàng đưa bạn đến đúng hành trình liên quan.
                  </Text>
                </Stack>
              </Group>
            </SimpleGrid>
          </Paper>
        </AgriContainer>
      </Box>
    </>
  );
}
