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
  Grid,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconSearch,
  IconShieldCheck,
  IconShoppingCart,
  IconTruckDelivery,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { ANH_HERO_AGRIMARKET, ANH_TRUY_XUAT_AGRIMARKET, anhDuPhongDanhMuc, anhDuPhongSanPham } from '@/lib/demo-images';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FarmCard } from './farm-card';
import { ProductCard } from './product-card';
import { BusinessNote, SectionHeading } from './web-page';

function ngayIsoTruoc(soNgay: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - soNgay);
  return date.toISOString().slice(0, 10);
}

function anhSanPham(url: string | null, ten: string) {
  return <Image src={url || anhDuPhongSanPham(ten)} alt={ten} h="100%" w="100%" fit="cover" loading="lazy" />;
}

function nhanSanPham(item: { danhMuc: { ten: string }; khaDung: { coTheDatHang: boolean }; chungNhan: Array<{ loai: string }> }) {
  return [item.chungNhan[0]?.loai || item.danhMuc.ten, item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng'];
}

type CategoryPromo = {
  value: string;
  label: string;
  soSanPham: number;
};

function CategoryCard({ item }: { item: CategoryPromo }) {
  return (
    <Paper
      component={Link}
      href={`/san-pham?category=${encodeURIComponent(item.value)}`}
      p={0}
      className="agri-surface"
      style={{ overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
    >
      <Box h={{ base: 105, sm: 130 }} pos="relative" style={{ overflow: 'hidden' }}>
        <Image src={anhDuPhongDanhMuc(item.label)} alt={item.label} h="100%" w="100%" fit="cover" />
        <Box pos="absolute" inset={0} style={{ background: 'linear-gradient(180deg, transparent 35%, rgba(7,54,37,.54))' }} />
        <Badge pos="absolute" top={10} right={10} color="white" c="agrimarket.8" variant="filled" size="sm">
          {item.soSanPham}
        </Badge>
      </Box>
      <Stack gap={3} p="sm">
        <Text fw={850} size="sm" lineClamp={1}>{item.label}</Text>
        <Text size="xs" c="dimmed">Xem nông sản →</Text>
      </Stack>
    </Paper>
  );
}

/* ========== Fallback data (presentation only — no fake IDs) ========== */
const categoryFallback: CategoryPromo[] = [
  { value: 'rau-cu', label: 'Rau củ', soSanPham: 0 },
  { value: 'trai-cay', label: 'Trái cây', soSanPham: 0 },
  { value: 'gao-ngu-coc', label: 'Gạo, ngũ cốc', soSanPham: 0 },
  { value: 'thit-trung', label: 'Thịt, trứng', soSanPham: 0 },
  { value: 'thuy-san', label: 'Thủy sản', soSanPham: 0 },
  { value: 'dac-san', label: 'Đặc sản vùng miền', soSanPham: 0 },
  { value: 'organic', label: 'Sản phẩm Organic', soSanPham: 0 },
  { value: 'vietgap', label: 'Sản phẩm VietGAP', soSanPham: 0 },
  { value: 'che-bien', label: 'Sản phẩm chế biến', soSanPham: 0 },
  { value: 'combo', label: 'Combo ưu đãi', soSanPham: 0 },
  { value: 'qua-tang', label: 'Quà tặng & Đặc sản', soSanPham: 0 },
  { value: 'tat-ca', label: 'Tất cả danh mục', soSanPham: 0 },
];

const flashSaleFallback = [
  { ten: 'Cà chua bi', trangTraiTen: 'Trang trại hữu cơ', giaTu: 29000, quyCach: '500g' },
  { ten: 'Rau xà lách thủy canh', trangTraiTen: 'Nông trại sạch', giaTu: 35000, quyCach: '200g' },
  { ten: 'Cam sành', trangTraiTen: 'Vườn miền Tây', giaTu: 59000, quyCach: '1kg' },
  { ten: 'Trứng gà ta', trangTraiTen: 'Hộ chăn nuôi dân dụng', giaTu: 45000, quyCach: '10 quả' },
  { ten: 'Thịt bò sạch', trangTraiTen: 'Trang trại bò hữu cơ', giaTu: 280000, quyCach: '500g' },
];

const featuredFallback = [
  { ten: 'Súp lơ xanh', trangTraiTen: 'Trang trại xanh', giaTu: 42000, quyCach: '500g' },
  { ten: 'Dâu tây Đà Lạt', trangTraiTen: 'Vườn Đà Lạt', giaTu: 129000, quyCach: '500g' },
  { ten: 'Gạo ST25', trangTraiTen: 'Nhà máy gạo Hưng Yên', giaTu: 72000, quyCach: '5kg' },
  { ten: 'Tôm thẻ tươi', trangTraiTen: 'Hồ nuôi thuỷ sản', giaTu: 195000, quyCach: '1kg' },
  { ten: 'Bơ sáp', trangTraiTen: 'Vườn bơ Miền Tây', giaTu: 85000, quyCach: '2 quả' },
  { ten: 'Cà rốt hữu cơ', trangTraiTen: 'Trang trại hữu cơ', giaTu: 38000, quyCach: '1kg' },
  { ten: 'Chuối già Nam Mỹ', trangTraiTen: 'Nguồn nhập khẩu', giaTu: 55000, quyCach: '1kg' },
  { ten: 'Nấm hương', trangTraiTen: 'Nấm sạch', giaTu: 65000, quyCach: '500g' },
];

const farmFallback = [
  { ten: 'Trang trại hữu cơ Green Farm', diaChi: 'Hưng Yên', soSanPham: 24, daXacMinh: true },
  { ten: 'Nông trại sạch Eco Farm', diaChi: 'Hưng Yên', soSanPham: 18, daXacMinh: true },
  { ten: 'Vườn rau sạch Home Farm', diaChi: 'Hà Nội', soSanPham: 12, daXacMinh: false },
];

/* ========== */

export function TrangChuContent() {
  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const moiThuHoachQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 12, khaDung: 'CON_HANG', sapXep: 'PHU_HOP', thuHoachTu: ngayIsoTruoc(45) });
  const moiNhatQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 18, khaDung: 'CON_HANG', sapXep: 'MOI_NHAT' });
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 18, khaDung: 'CON_HANG', sapXep: 'PHU_HOP' });

  const danhMuc = useMemo(
    () =>
      (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 12).map((item) => ({
        value: item.value,
        label: item.label,
        soSanPham: item.soSanPham,
      })),
    [facetsQuery.data],
  );

  const harvested = useMemo(() => moiThuHoachQuery.data?.data?.duLieu ?? [], [moiThuHoachQuery.data]);
  const moiNhat = useMemo(() => moiNhatQuery.data?.data?.duLieu ?? [], [moiNhatQuery.data]);
  const noiBat = useMemo(() => (noiBatQuery.data?.data?.duLieu ?? []).slice(0, 10), [noiBatQuery.data]);
  const coThuHoachGanDay = harvested.length > 0;
  const sanPhamMoi = (coThuHoachGanDay ? harvested : moiNhat).slice(0, 5);

  const trangTrai = useMemo(() => {
    const map = new Map<string, { ten: string; diaChi: string; soSanPham: number; daXacMinh: boolean }>();
    for (const item of [...noiBat, ...sanPhamMoi]) {
      const current = map.get(item.trangTrai.ten);
      map.set(item.trangTrai.ten, { ten: item.trangTrai.ten, diaChi: item.trangTrai.diaChi, soSanPham: (current?.soSanPham ?? 0) + 1, daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0 });
    }
    return [...map.values()]
      .sort((a, b) => Number(b.daXacMinh) - Number(a.daXacMinh) || b.soSanPham - a.soSanPham || a.ten.localeCompare(b.ten, 'vi'))
      .slice(0, 3);
  }, [noiBat, sanPhamMoi]);

  const productPending = moiThuHoachQuery.isPending && moiNhatQuery.isPending && noiBatQuery.isPending;
  const productError = moiThuHoachQuery.isError && moiNhatQuery.isError && noiBatQuery.isError;
  const categoryError = facetsQuery.isError;

  const danhMucHienThi = danhMuc.length ? danhMuc : categoryFallback;
  const hasRealFlashSale = coThuHoachGanDay && sanPhamMoi.length > 0;
  const hasRealFeatured = noiBat.length > 0;
  const hasRealFarms = trangTrai.length > 0;

  return (
    <Box className="agri-page">
      {/* Hero */}
      <Box bg="white" style={{ borderBottom: '1px solid var(--agri-border)' }}>
        <AgriContainer py={{ base: 18, md: 26 }}>
          <Grid align="stretch">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack h="100%" justify="center" gap="lg" py={{ base: 12, md: 34 }}>
                <Badge color="agrimarket" variant="light" size="lg" w="fit-content">
                  AGRIMARKET · NÔNG SẢN MINH BẠCH
                </Badge>
                <Stack gap="sm">
                  <Title order={1} fz={{ base: 38, sm: 48, md: 58 }} fw={900} lh={1.02} style={{ letterSpacing: '-0.045em' }}>
                    Mua nông sản từ trang trại, kiểm tra nguồn gốc rõ ràng.
                  </Title>
                  <Text c="dimmed" fz={{ base: 15, md: 17 }} lh={1.7} maw={650}>
                    Khám phá sản phẩm đang công khai, chọn đúng quy cách, xem tồn khả dụng và truy xuất từng lô hàng khi có mã trên tem hoặc QR.
                  </Text>
                </Stack>

                <form action="/san-pham" method="get" role="search">
                  <Group gap="sm" align="stretch" maw={640} wrap="nowrap">
                    <TextInput
                      name="q"
                      placeholder="Tìm rau củ, trái cây, gạo, trang trại..."
                      leftSection={<IconSearch size={18} />}
                      aria-label="Tìm kiếm nông sản"
                      style={{ flex: 1 }}
                      size="md"
                    />
                    <Button type="submit" color="agrimarket" size="md">Tìm kiếm</Button>
                  </Group>
                </form>

                <Group gap="sm" wrap="wrap">
                  <Button component={Link} href="/san-pham" color="agrimarket" rightSection={<IconArrowRight size={17} />}>
                    Khám phá nông sản
                  </Button>
                  <Button component={Link} href="/truy-xuat" variant="default" leftSection={<IconQrcode size={18} />}>
                    Truy xuất nguồn gốc
                  </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" maw={720}>
                  {[
                    ['Giá & tồn kho', 'Được xác nhận lại khi checkout'],
                    ['Giao hàng', 'Phạm vi hiện tại: Hưng Yên'],
                    ['Truy xuất', 'Theo đúng mã lô sản phẩm'],
                  ].map(([title, subtitle]) => (
                    <Stack key={title} gap={2}>
                      <Text size="sm" fw={850}>{title}</Text>
                      <Text size="xs" c="dimmed" lh={1.5}>{subtitle}</Text>
                    </Stack>
                  ))}
                </SimpleGrid>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper
                className="agri-surface"
                p={0}
                h="100%"
                mih={{ base: 330, md: 510 }}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                <Image src={ANH_HERO_AGRIMARKET} alt="Nông sản AgriMarket" h="100%" w="100%" fit="cover" />
                <Box pos="absolute" inset={0} style={{ background: 'linear-gradient(180deg, transparent 44%, rgba(4,63,42,.78))' }} />
                <Stack pos="absolute" left={{ base: 20, md: 28 }} right={{ base: 20, md: 28 }} bottom={{ base: 20, md: 28 }} gap={8}>
                  <Group gap="xs">
                    <ThemeIcon color="white" variant="light" radius="xl"><IconLeaf size={18} /></ThemeIcon>
                    <Text c="white" fw={850}>Từ trang trại đến bàn ăn</Text>
                  </Group>
                  <Text c="rgba(255,255,255,.82)" size="sm" maw={520}>
                    Thông tin sản phẩm, trang trại và nguồn gốc được trình bày theo dữ liệu hệ thống thay vì nội dung quảng cáo tĩnh.
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </AgriContainer>
      </Box>

      {/* Quick categories */}
      <Box className="agri-page-section" bg="white">
        <AgriContainer>
          <SectionHeading
            eyebrow="Khám phá nhanh"
            title="Danh mục nông sản"
            description="Danh mục và số lượng sản phẩm được đồng bộ trực tiếp từ dữ liệu công khai."
            action={<Button component={Link} href="/san-pham" variant="subtle" color="agrimarket">Xem tất cả</Button>}
          />

          {categoryError ? (
            <Box mt="xl"><ErrorState tieuDe="Chưa thể tải danh mục" moTa="Hệ thống đang tạm thời không phản hồi." onThuLai={() => void facetsQuery.refetch()} /></Box>
          ) : danhMuc.length > 0 ? (
            <SimpleGrid cols={{ base: 2, sm: 4, lg: 8 }} spacing="md" mt="xl">
              {danhMuc.map((item) => <CategoryCard key={item.value} item={item} />)}
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 4, lg: 8 }} spacing="md" mt="xl">
              {categoryFallback.map((item) => <CategoryCard key={item.value} item={item} />)}
            </SimpleGrid>
          )}
        </AgriContainer>
      </Box>

      {/* New harvest */}
      <Box className="agri-page-section">
        <AgriContainer>
          <SectionHeading
            eyebrow={coThuHoachGanDay ? 'Thu hoạch gần đây' : 'Sản phẩm mới'}
            title={coThuHoachGanDay ? 'Nông sản mới thu hoạch' : 'Nông sản mới công khai'}
            description={coThuHoachGanDay ? 'Sản phẩm còn hàng có dữ liệu thu hoạch trong 45 ngày gần đây.' : 'Sản phẩm mới được công khai và đang có thể đặt hàng.'}
            action={<Button component={Link} href="/san-pham?sort=MOI_NHAT" variant="subtle" color="agrimarket">Xem tất cả</Button>}
          />

          {productPending ? (
            <Box mt="xl"><AgriSkeleton soLuong={5} /></Box>
          ) : productError ? (
            <Box mt="xl">
              <ErrorState
                tieuDe="Chưa thể tải nông sản"
                moTa="Hệ thống đang tạm thời không phản hồi. Dữ liệu minh họa sẽ được hiển thị."
                onThuLai={() => {
                  void moiThuHoachQuery.refetch();
                  void moiNhatQuery.refetch();
                  void noiBatQuery.refetch();
                }}
              />
            </Box>
          ) : sanPhamMoi.length === 0 ? (
            <Box mt="xl"><EmptyState tieuDe="Chưa có nông sản phù hợp" moTa="Sản phẩm sẽ xuất hiện khi trang trại công khai dữ liệu và có hàng." /></Box>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="lg" mt="xl">
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

      {/* QR provenance banner */}
      <Box className="agri-page-section" bg="white">
        <AgriContainer>
          <Paper className="agri-surface" p={0} style={{ overflow: 'hidden' }}>
            <Grid gap={0} align="stretch">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Image src={ANH_TRUY_XUAT_AGRIMARKET} alt="Truy xuất nguồn gốc nông sản" h={{ base: 250, md: 390 }} w="100%" fit="cover" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack h="100%" justify="center" p={{ base: 26, md: 46 }} gap="lg" bg="agrimarket.8" c="white">
                  <ThemeIcon size={48} radius="lg" color="white" variant="light"><IconQrcode size={25} /></ThemeIcon>
                  <Stack gap="sm">
                    <Text size="xs" fw={850} tt="uppercase" style={{ letterSpacing: '.08em' }} c="agrimarket.2">Truy xuất nguồn gốc</Text>
                    <Title order={2} c="white" fz={{ base: 28, md: 38 }} lh={1.08}>
                      Kiểm tra đúng lô hàng bạn đang cầm trên tay
                    </Title>
                    <Text c="rgba(255,255,255,.78)" lh={1.7}>
                      Nhập mã trên tem hoặc QR để xem nơi sản xuất, mùa vụ, thu hoạch, kiểm định, chứng nhận và cảnh báo liên quan khi hệ thống có dữ liệu.
                    </Text>
                  </Stack>
                  <Button component={Link} href="/truy-xuat" color="white" c="agrimarket.8" w="fit-content" rightSection={<IconArrowRight size={16} />}>
                    Kiểm tra mã truy xuất
                  </Button>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </AgriContainer>
      </Box>

      {/* Featured products */}
      <Box className="agri-page-section">
        <AgriContainer>
          <SectionHeading
            eyebrow="Đang được quan tâm"
            title="Sản phẩm nổi bật"
            description={hasRealFeatured ? 'Danh sách dựa trên dữ liệu công khai và tình trạng sẵn sàng đặt hàng.' : 'Dữ liệu minh họa khi hệ thống chưa có sản phẩm nổi bật.'}
            action={<Button component={Link} href="/san-pham" variant="subtle" color="agrimarket">Khám phá thêm</Button>}
          />
          {hasRealFeatured ? (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg" mt="xl">
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
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg" mt="xl">
              {featuredFallback.map((item, index) => (
                <ProductCard
                  key={`fallback-featured-${index}`}
                  ten={item.ten}
                  tenTrangTrai={item.trangTraiTen}
                  giaTu={item.giaTu}
                  donVi={item.quyCach}
                  href="/san-pham"
                />
              ))}
            </SimpleGrid>
          )}
        </AgriContainer>
      </Box>

      {/* Farms */}
      {hasRealFarms || farmFallback.length > 0 ? (
        <Box className="agri-page-section" bg="white">
          <AgriContainer>
            <SectionHeading
              eyebrow="Từ nhà sản xuất"
              title="Trang trại tiêu biểu"
              description={hasRealFarms ? 'Các trang trại đang có sản phẩm công khai trong danh sách hiện tại.' : 'Dữ liệu minh họa khi hệ thống chưa có trang trại.'}
              action={<Button component={Link} href="/theo-doi" variant="subtle" color="agrimarket">Trang trại đang theo dõi</Button>}
            />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mt="xl">
              {hasRealFarms ? trangTrai.map((farm) => (
                <FarmCard
                  key={farm.ten}
                  ten={farm.ten}
                  diaChi={farm.diaChi}
                  soSanPham={farm.soSanPham}
                  daXacMinh={farm.daXacMinh}
                  href={`/trang-trai/${farm.ten}`}
                />
              )) : farmFallback.map((farm, index) => (
                <FarmCard
                  key={`fallback-farm-${index}`}
                  ten={farm.ten}
                  diaChi={farm.diaChi}
                  soSanPham={farm.soSanPham}
                  daXacMinh={farm.daXacMinh}
                  href="/theo-doi"
                />
              ))}
            </SimpleGrid>
          </AgriContainer>
        </Box>
      ) : null}

      {/* How it works */}
      <Box className="agri-page-section">
        <AgriContainer>
          <SectionHeading
            eyebrow="Quy trình mua hàng"
            title="Từ chọn sản phẩm đến nhận hàng"
            description="Giao diện bám đúng luồng nghiệp vụ hiện có của hệ thống."
          />
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mt="xl">
            {[
              { icon: <IconSearch size={22} />, title: '1. Chọn nông sản', body: 'Tìm kiếm, lọc, xem trang trại, quy cách, giá hiện tại và tồn khả dụng.' },
              { icon: <IconShieldCheck size={22} />, title: '2. Xác nhận checkout', body: 'Chọn địa chỉ Hưng Yên, áp voucher/điểm và để hệ thống tính lại phí, ưu đãi, tổng tiền.' },
              { icon: <IconTruckDelivery size={22} />, title: '3. Thanh toán & theo dõi', body: 'Chọn COD hoặc VNPay Sandbox, sau đó theo dõi trạng thái đơn và xử lý đánh giá/khiếu nại khi đủ điều kiện.' },
            ].map((step) => (
              <Paper key={step.title} className="agri-surface" withBorder p="xl">
                <Stack gap="md">
                  <ThemeIcon size={44} radius="lg" variant="light" color="agrimarket">{step.icon}</ThemeIcon>
                  <Stack gap={6}>
                    <Text fw={900} fz="lg">{step.title}</Text>
                    <Text size="sm" c="dimmed" lh={1.65}>{step.body}</Text>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
          <Box mt="lg">
            <BusinessNote icon={<IconMapPin size={18} color="#087A4B" />}>
              Phạm vi giao hàng hiện tại của đồ án là Hưng Yên; dữ liệu địa chỉ legacy Thái Bình được Backend xử lý theo chính sách tương thích đã có.
            </BusinessNote>
          </Box>
        </AgriContainer>
      </Box>
    </Box>
  );
}