'use client';

import {
  dinhDangQuyCachSanPham,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Badge, Box, Button, Card, Grid, Group, Image, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingStore,
  IconCertificate,
  IconDeviceMobile,
  IconHeadset,
  IconLeaf,
  IconMapPin,
  IconQrcode,
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

function SectionTitle({ title, description, href }: { title: string; description?: string; href?: string }) {
  return (
    <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
      <Stack gap={3}>
        <Title order={2} fz={{ base: 23, md: 28 }} fw={900} lh={1.15}>{title}</Title>
        {description ? <Text c="dimmed" size="sm">{description}</Text> : null}
      </Stack>
      {href ? <Button component={Link} href={href} variant="subtle" color="agrimarket" rightSection={<IconArrowRight size={16} />}>Xem tất cả</Button> : null}
    </Group>
  );
}

type CategoryPromo = { value: string; label: string; soSanPham: number };

function PromoDanhMuc({ item, accent }: { item: CategoryPromo; accent: string }) {
  return (
    <Card component={Link} href={`/san-pham?category=${encodeURIComponent(item.value)}`} padding={0} withBorder className="market-promo-card">
      <Image src={anhDuPhongDanhMuc(item.label)} alt={item.label} h="100%" w="100%" fit="cover" />
      <Box pos="absolute" inset={0} style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.97), rgba(255,255,255,.52) 70%, rgba(255,255,255,.02))' }} />
      <Stack pos="absolute" inset={0} justify="center" p="lg" gap={4} maw="70%">
        <Text size="xs" fw={900} c={accent}>ƯU ĐÃI THEO MÙA</Text>
        <Text fw={900} fz="lg" c="#173023" lineClamp={2}>{item.label}</Text>
        <Text size="xs" fw={800} c="agrimarket.7">Xem ngay →</Text>
      </Stack>
    </Card>
  );
}

export function TrangChuContent() {
  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const moiThuHoachQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 12, khaDung: 'CON_HANG', sapXep: 'PHU_HOP', thuHoachTu: ngayIsoTruoc(45) });
  const moiNhatQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 18, khaDung: 'CON_HANG', sapXep: 'MOI_NHAT' });
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 18, khaDung: 'CON_HANG', sapXep: 'PHU_HOP' });

  const danhMuc = useMemo(() => (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 12).map((item) => ({ value: item.value, label: item.label, soSanPham: item.soSanPham })), [facetsQuery.data]);
  const harvested = useMemo(() => moiThuHoachQuery.data?.data?.duLieu ?? [], [moiThuHoachQuery.data]);
  const moiNhat = useMemo(() => moiNhatQuery.data?.data?.duLieu ?? [], [moiNhatQuery.data]);
  const noiBat = useMemo(() => (noiBatQuery.data?.data?.duLieu ?? []).slice(0, 10), [noiBatQuery.data]);
  const coThuHoachGanDay = harvested.length > 0;
  const flashSale = (coThuHoachGanDay ? harvested : moiNhat).slice(0, 5);

  const trangTrai = useMemo(() => {
    const map = new Map<string, { id: string; ten: string; diaChi: string; soSanPham: number; daXacMinh: boolean }>();
    for (const item of [...noiBat, ...flashSale]) {
      const current = map.get(item.trangTrai.id);
      map.set(item.trangTrai.id, { id: item.trangTrai.id, ten: item.trangTrai.ten, diaChi: item.trangTrai.diaChi, soSanPham: (current?.soSanPham ?? 0) + 1, daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0 });
    }
    return [...map.values()].sort((a, b) => Number(b.daXacMinh) - Number(a.daXacMinh) || b.soSanPham - a.soSanPham).slice(0, 3);
  }, [noiBat, flashSale]);

  const productPending = moiThuHoachQuery.isPending && moiNhatQuery.isPending && noiBatQuery.isPending;
  const productError = moiThuHoachQuery.isError && moiNhatQuery.isError && noiBatQuery.isError;
  const categoryFallback: CategoryPromo[] = [
    { value: 'rau-cu', label: 'Rau củ', soSanPham: 0 }, { value: 'trai-cay', label: 'Trái cây', soSanPham: 0 },
    { value: 'gao-ngu-coc', label: 'Gạo, ngũ cốc', soSanPham: 0 }, { value: 'thit-trung', label: 'Thịt, trứng', soSanPham: 0 },
    { value: 'thuy-san', label: 'Thủy sản', soSanPham: 0 }, { value: 'dac-san', label: 'Đặc sản vùng miền', soSanPham: 0 },
    { value: 'organic', label: 'Sản phẩm Organic', soSanPham: 0 }, { value: 'vietgap', label: 'Sản phẩm VietGAP', soSanPham: 0 },
  ];
  const danhMucHienThi = danhMuc.length ? danhMuc : categoryFallback;

  return (
    <Box bg="#F7F8F6" className="market-home">
      <AgriContainer py={{ base: 12, md: 18 }}>
        <Grid gap="md" align="stretch">
          <Grid.Col span={{ base: 12, lg: 2.35 }}>
            <Card withBorder padding={0} h="100%" visibleFrom="lg" className="market-category-menu">
              <Box bg="agrimarket.6" c="white" px="md" py={12}><Group gap={8}><IconBuildingStore size={18} /><Text fw={850} size="sm">Danh mục sản phẩm</Text></Group></Box>
              <Stack gap={0}>
                {danhMucHienThi.slice(0, 11).map((item) => <Link key={item.value} href={`/san-pham?category=${encodeURIComponent(item.value)}`} className="market-category-link"><Text size="sm" fw={650} lineClamp={1}>{item.label}</Text><Text c="dimmed" size="xs">›</Text></Link>)}
                <Link href="/san-pham" className="market-category-link"><Text size="sm" fw={800} c="agrimarket.7">Tất cả danh mục</Text><Text>›</Text></Link>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6.65 }}>
            <Paper className="market-hero" style={{ backgroundImage: `url("${ANH_HERO_AGRIMARKET}")` }}>
              <Box pos="absolute" inset={0} className="market-hero-overlay" />
              <Stack pos="relative" justify="center" h="100%" p={{ base: 24, sm: 34, md: 42 }} maw={570} gap="md">
                <Badge color="white" c="agrimarket.8" w="fit-content">TƯƠI MỖI NGÀY</Badge>
                <Title order={1} c="white" fz={{ base: 32, sm: 39, md: 45 }} fw={950} lh={1.04}>Từ trang trại đến bàn ăn<br />Nguồn gốc minh bạch</Title>
                <Text c="rgba(255,255,255,.9)" fz={{ base: 14, md: 16 }}>Thực phẩm an toàn cho gia đình Việt.</Text>
                <Group gap="sm"><Button component={Link} href="/san-pham" color="white" c="agrimarket.8" rightSection={<IconShoppingCart size={17} />}>Mua ngay</Button><Button component={Link} href="/truy-xuat" variant="outline" color="white" leftSection={<IconQrcode size={17} />}>Quét QR</Button></Group>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 3 }}>
            <SimpleGrid cols={{ base: 2, lg: 1 }} spacing="md" h="100%">
              <PromoDanhMuc item={danhMucHienThi[0] ?? categoryFallback[0]!} accent="#087A4B" />
              <PromoDanhMuc item={danhMucHienThi[1] ?? categoryFallback[1]!} accent="#E6535F" />
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </AgriContainer>

      <Box bg="white" className="market-strip-border">
        <AgriContainer py={12}>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xs">
            {[
              [<IconQrcode key="qr" size={20} />, 'Truy xuất nguồn gốc', 'Rõ ràng, minh bạch'],
              [<IconBuildingStore key="farm" size={20} />, 'Trang trại minh bạch', 'Kết nối trực tiếp'],
              [<IconShieldCheck key="safe" size={20} />, 'Sản phẩm an toàn', 'Thông tin công khai'],
              [<IconLeaf key="leaf" size={20} />, 'Vì sức khỏe cộng đồng', 'Nông nghiệp bền vững'],
            ].map(([icon, title, subtitle]) => <Group key={String(title)} gap="sm" wrap="nowrap" p="xs"><ThemeIcon variant="light" color="agrimarket" size={38}>{icon}</ThemeIcon><Stack gap={0}><Text fw={800} size="xs">{title}</Text><Text size="10px" c="dimmed">{subtitle}</Text></Stack></Group>)}
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 20, md: 26 }}>
        <Box className="market-category-scroller">
          {danhMucHienThi.slice(0, 10).map((item) => <Link key={item.value} href={`/san-pham?category=${encodeURIComponent(item.value)}`} className="market-quick-category"><Image src={anhDuPhongDanhMuc(item.label)} alt={item.label} w={58} h={58} radius="50%" fit="cover" /><Text size="xs" fw={750} ta="center" lineClamp={2}>{item.label}</Text></Link>)}
        </Box>
      </AgriContainer>

      <Box bg="white" py={{ base: 24, md: 32 }}>
        <AgriContainer>
          <Group justify="space-between" align="center" mb="md" wrap="wrap">
            <Group gap="md"><Title order={2} fz={{ base: 24, md: 28 }} fw={950} c="#E6535F">⚡ Flash Sale</Title><Badge color="red" variant="light" size="lg">Kết thúc sau 12 : 34 : 56</Badge></Group>
            <Button component={Link} href="/san-pham?sort=MOI_NHAT" variant="subtle" color="agrimarket">Xem tất cả</Button>
          </Group>
          {productPending ? <AgriSkeleton soLuong={5} /> : productError ? <ErrorState onThuLai={() => { void moiThuHoachQuery.refetch(); void moiNhatQuery.refetch(); void noiBatQuery.refetch(); }} /> : flashSale.length ? (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">{flashSale.map((item) => <ProductCard key={item.id} ten={item.ten} tenTrangTrai={item.trangTrai.ten} giaTu={item.gia.tu} donVi={dinhDangQuyCachSanPham(item.quyCach)} href={`/san-pham/${item.id}`} anh={anhSanPham(item.anhBiaUrl, item.ten)} nhan={nhanSanPham(item)} />)}</SimpleGrid>
          ) : <EmptyState tieuDe="Chưa có sản phẩm đang mở bán" moTa="Flash Sale sẽ tự dùng sản phẩm công khai khi dữ liệu sẵn sàng." />}
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 28, md: 38 }}>
        <Grid gap="xl" align="start">
          <Grid.Col span={{ base: 12, lg: 9 }}>
            <SectionTitle title="Sản phẩm nổi bật" description="Nông sản đang có thể đặt hàng trên AgriMarket." href="/san-pham" />
            {noiBat.length ? <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md" mt="lg">{noiBat.map((item) => <ProductCard key={item.id} ten={item.ten} tenTrangTrai={item.trangTrai.ten} giaTu={item.gia.tu} donVi={dinhDangQuyCachSanPham(item.quyCach)} href={`/san-pham/${item.id}`} anh={anhSanPham(item.anhBiaUrl, item.ten)} nhan={nhanSanPham(item)} />)}</SimpleGrid> : null}
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <SectionTitle title="Trang trại tiêu biểu" />
            <Stack gap="md" mt="lg">{trangTrai.map((farm) => <FarmCard key={farm.id} ten={farm.ten} diaChi={farm.diaChi} soSanPham={farm.soSanPham} daXacMinh={farm.daXacMinh} href={`/trang-trai/${farm.id}`} />)}
              <Card className="market-shipping-card" p="lg"><IconTruckDelivery size={34} /><Title order={3} c="white">Miễn phí vận chuyển</Title><Text size="sm" c="rgba(255,255,255,.82)">Ưu đãi vận chuyển theo chính sách đơn hàng.</Text><Button component={Link} href="/san-pham" color="white" c="agrimarket.8" mt="sm">Mua sắm ngay</Button></Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </AgriContainer>

      <Box bg="white" py={{ base: 30, md: 40 }}>
        <AgriContainer>
          <SectionTitle title="Kiến thức nông sản" description="Mẹo chọn mua, bảo quản và hiểu đúng về nguồn gốc." />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mt="lg">
            {[
              ['Rau củ', 'Cách chọn rau củ sạch, tươi ngon mỗi ngày', 'Mẹo nhận biết rau củ còn tươi và phù hợp cho bữa cơm gia đình.'],
              ['Trái cây', 'Mẹo bảo quản trái cây tươi lâu tại nhà', 'Những cách đơn giản giúp trái cây giữ hương vị lâu hơn.'],
              ['VietGAP', 'VietGAP là gì? Vì sao nên lựa chọn?', 'Hiểu nhanh tiêu chuẩn và thông tin cần kiểm tra khi mua.'],
              ['Theo mùa', 'Nông sản theo mùa có gì đặc biệt?', 'Chọn đúng mùa để có hương vị ngon và nguồn cung ổn định.'],
            ].map(([tag, title, desc]) => <Card key={title} withBorder padding={0} className="market-article"><Image src={anhDuPhongDanhMuc(tag)} alt={title} h={145} fit="cover" /><Stack p="md" gap={7}><Badge variant="light" color="agrimarket" w="fit-content">{tag}</Badge><Text fw={850} lineClamp={2}>{title}</Text><Text size="xs" c="dimmed" lineClamp={2}>{desc}</Text><Text size="xs" fw={800} c="agrimarket.7">Xem chi tiết →</Text></Stack></Card>)}
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 30, md: 40 }}>
        <SectionTitle title="Mua theo nhu cầu" description="Combo tiện lợi · Tươi ngon mỗi ngày" href="/san-pham" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mt="lg">
          {[
            ['Combo rau củ gia đình', 'Đủ rau củ cho bữa cơm gia đình', '199.000đ'],
            ['Combo bữa sáng lành mạnh', 'Gọn nhẹ cho một tuần năng động', '159.000đ'],
            ['Combo hữu cơ tuần', 'Lựa chọn xanh cho gia đình', '299.000đ'],
            ['Combo trái cây theo mùa', 'Trái cây chọn theo mùa vụ', '189.000đ'],
          ].map(([title, desc, price], index) => <Card key={title} withBorder padding={0} className="market-combo"><Box pos="relative"><Image src={anhDuPhongDanhMuc(index === 3 ? 'trái cây' : 'rau củ')} alt={title} h={165} fit="cover" /><Badge pos="absolute" top={10} left={10} color="red">Tiết kiệm</Badge></Box><Stack p="md" gap={7}><Text fw={900}>{title}</Text><Text size="xs" c="dimmed" mih={32}>{desc}</Text><Text fw={950} fz="lg" c="agrimarket.7">{price}</Text><Button component={Link} href="/san-pham" fullWidth leftSection={<IconShoppingCart size={16} />}>Chọn sản phẩm</Button></Stack></Card>)}
        </SimpleGrid>
      </AgriContainer>

      <Box bg="white" py={{ base: 30, md: 40 }}>
        <AgriContainer>
          <Paper withBorder className="market-trace-banner">
            <Grid gap={0} align="stretch">
              <Grid.Col span={{ base: 12, md: 5 }}><Image src={ANH_TRUY_XUAT_AGRIMARKET} alt="Truy xuất nguồn gốc" h={{ base: 230, md: 330 }} w="100%" fit="cover" /></Grid.Col>
              <Grid.Col span={{ base: 12, md: 7 }}><Stack h="100%" justify="center" p={{ base: 24, md: 42 }} gap="md" bg="#055235" c="white"><ThemeIcon size={48} color="white" c="agrimarket.8"><IconQrcode size={27} /></ThemeIcon><Title order={2} c="white" fz={{ base: 27, md: 34 }}>Quét mã, biết rõ nguồn gốc</Title><Text c="rgba(255,255,255,.82)" maw={650}>Nhập mã trên tem hoặc nội dung QR để xem trang trại, mùa vụ, thu hoạch, kiểm định, chứng nhận và cảnh báo liên quan.</Text><Button component={Link} href="/truy-xuat" color="white" c="agrimarket.8" w="fit-content" rightSection={<IconArrowRight size={16} />}>Kiểm tra nguồn gốc</Button></Stack></Grid.Col>
            </Grid>
          </Paper>
        </AgriContainer>
      </Box>

      <Box py={{ base: 24, md: 30 }} bg="#F1FAF5">
        <AgriContainer><SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">{[
          [<IconTruckDelivery key="a" />, 'Giao hàng thuận tiện', 'Theo trạng thái đơn hàng'],
          [<IconCertificate key="b" />, 'Truy xuất nguồn gốc', 'Theo từng lô sản phẩm'],
          [<IconHeadset key="c" />, 'Hỗ trợ khách hàng', 'Đồng hành khi cần'],
          [<IconShieldCheck key="d" />, 'Thanh toán an toàn', 'Theo hệ thống checkout'],
        ].map(([icon, title, subtitle]) => <Group key={String(title)} gap="sm" wrap="nowrap"><ThemeIcon variant="light" color="agrimarket" size={42}>{icon}</ThemeIcon><Stack gap={1}><Text fw={850} size="sm">{title}</Text><Text size="xs" c="dimmed">{subtitle}</Text></Stack></Group>)}</SimpleGrid></AgriContainer>
      </Box>

      <AgriContainer py={{ base: 28, md: 38 }}>
        <Card className="market-app-banner" p={{ base: 'lg', md: 32 }}>
          <Group justify="space-between" gap="xl" wrap="wrap"><Group gap="lg"><ThemeIcon size={62} radius="xl" color="white" c="agrimarket.8"><IconDeviceMobile size={32} /></ThemeIcon><Stack gap={4}><Title order={2} c="white" fz={{ base: 24, md: 30 }}>AgriMarket trên điện thoại</Title><Text c="rgba(255,255,255,.82)">Mua nông sản và truy xuất QR thuận tiện trên thiết bị di động.</Text></Stack></Group><Group gap="sm"><Badge size="xl" color="white" c="agrimarket.8">App Store</Badge><Badge size="xl" color="white" c="agrimarket.8">Google Play</Badge></Group></Group>
        </Card>
      </AgriContainer>

      <Box className="market-mobile-bottom" hiddenFrom="md">
        <Link href="/" className="active"><IconLeaf size={20} /><span>Trang chủ</span></Link>
        <Link href="/san-pham"><IconBuildingStore size={20} /><span>Danh mục</span></Link>
        <Link href="/truy-xuat"><IconQrcode size={20} /><span>Quét QR</span></Link>
        <Link href="/gio-hang"><IconShoppingCart size={20} /><span>Giỏ hàng</span></Link>
        <Link href="/tai-khoan"><IconMapPin size={20} /><span>Tài khoản</span></Link>
      </Box>
    </Box>
  );
}
