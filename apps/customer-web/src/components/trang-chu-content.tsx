'use client';

import {
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
  ActionIcon,
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
} from '@mantine/core';
import {
  IconApple,
  IconCertificate,
  IconEgg,
  IconFish,
  IconGift,
  IconLeaf,
  IconMapPin,
  IconPackage,
  IconPepper,
  IconSalad,
  IconShoppingBag,
  IconWheat,
  IconBolt,
  IconBuildingStore,
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconQrcode,
  IconShieldCheck,
  IconShoppingCart,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ANH_PROMO_RAU_CU,
  ANH_PROMO_TRAI_CAY,
  DANH_SACH_BANNER_HERO,
  THOI_GIAN_LUOT_BANNER_MS,
  anhDuPhongSanPham,
} from '@/lib/demo-images';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_FARMS,
  FALLBACK_FARM_STORIES,
  FALLBACK_FEATURED_PRODUCTS,
  FALLBACK_FLASH_SALE,
  FALLBACK_KNOWLEDGE_ARTICLES,
  FALLBACK_QUICK_CATEGORIES,
  SERVICE_STRIP_ITEMS,
  TRUST_STRIP_ITEMS,
} from '@/lib/homepage-fallback';
import { AgriContainer } from './agri-container';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

export function TrangChuContent() {
  const [tabNoiBat, setTabNoiBat] = useState('tat-ca');
  const [tabKienThuc, setTabKienThuc] = useState('tat-ca');
  const [chiSoBanner, setChiSoBanner] = useState(0);
  const [tamDungLuotBanner, setTamDungLuotBanner] = useState(false);
  const viTriChamBatDau = useRef<number | null>(null);

  const soLuongBanner = DANH_SACH_BANNER_HERO.length;

  const chuyenBannerTiep = useCallback(() => {
    setChiSoBanner((i) => (i + 1) % soLuongBanner);
  }, [soLuongBanner]);

  const chuyenBannerTruoc = useCallback(() => {
    setChiSoBanner((i) => (i - 1 + soLuongBanner) % soLuongBanner);
  }, [soLuongBanner]);

  useEffect(() => {
    if (tamDungLuotBanner || soLuongBanner <= 1) return;
    const id = setInterval(chuyenBannerTiep, THOI_GIAN_LUOT_BANNER_MS);
    return () => clearInterval(id);
  }, [tamDungLuotBanner, soLuongBanner, chuyenBannerTiep, chiSoBanner]);

  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 16,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });

  const apiProducts = useMemo(() => noiBatQuery.data?.data?.duLieu ?? [], [noiBatQuery.data]);
  const hasRealData = apiProducts.length > 0;

  // Flash Sale products
  const flashSaleItems = useMemo(() => {
    if (hasRealData && apiProducts.length >= 5) {
      return apiProducts.slice(0, 5).map((p, index) => {
        const fallback = FALLBACK_FLASH_SALE[index] || FALLBACK_FLASH_SALE[0];
        const discountVal = 10 + (index % 3) * 5;
        const oldGia = Math.round(p.gia.tu * (1 + discountVal / 100));
        return {
          id: p.id,
          ten: p.ten,
          trangTraiTen: p.trangTrai?.ten || fallback.trangTraiTen,
          gia: p.gia.tu,
          giaCu: oldGia,
          giam: `-${discountVal}%`,
          anh: p.anhBiaUrl || anhDuPhongSanPham(p.ten),
        };
      });
    }
    return FALLBACK_FLASH_SALE.map((item) => ({
      ...item,
      id: item.ten.toLowerCase().replace(/[,\s]+/g, '-'),
    }));
  }, [hasRealData, apiProducts]);

  // Featured products (luôn loại món đã hiện ở Flash Sale để 2 hàng khác nhau)
  const featuredItems = useMemo(() => {
    if (hasRealData) {
      const flashSaleIds = new Set(
        apiProducts.length >= 5 ? apiProducts.slice(0, 5).map((p) => p.id) : [],
      );
      const chuaHienThi = apiProducts.filter((p) => !flashSaleIds.has(p.id));
      const filtered = tabNoiBat === 'tat-ca'
        ? chuaHienThi.slice(0, 8)
        : chuaHienThi.filter((p) => {
            const cat = (p.danhMuc?.ten || '').toLowerCase();
            return cat.includes(tabNoiBat.replace(/-/g, ' '));
          }).slice(0, 8);

      if (filtered.length >= 4) {
        return filtered.map((p) => ({
          id: p.id,
          ten: p.ten,
          gia: p.gia.tu,
          anh: p.anhBiaUrl || anhDuPhongSanPham(p.ten),
          trangTraiTen: p.trangTrai?.ten || 'Trang trại chuẩn',
        }));
      }
    }

    return FALLBACK_FEATURED_PRODUCTS.map((item, idx) => ({
      ...item,
      id: `fallback-featured-${idx}`,
      trangTraiTen: 'Trang trại minh bạch',
    }));
  }, [hasRealData, apiProducts, tabNoiBat]);

  return (
    <Box bg="#F6FBF7" pb={{ base: 40, md: 60 }} pt={{ base: 12, md: 16 }}>
      <AgriContainer>
        {/* ============================================================
            SECTION 1: HERO ROW (CATEGORY RAIL + MAIN HERO + SIDE PROMOS)
           ============================================================ */}
        <Box mb={14}>
          <Grid gap={12} align="stretch">
            {/* Left Category Rail - 234px desktop */}
            <Grid.Col span={{ base: 12, md: 'content' }} visibleFrom="md">
              <Paper
                w={234}
                h="100%"
                bg="white"
                withBorder
                p={6}
                radius="sm"
                style={{
                  borderColor: '#DDE8DF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Stack gap={2}>
                  {FALLBACK_CATEGORIES.map((cat) => {
                    const railIconMap: Record<string, React.ElementType> = {
                      'rau-cu': IconSalad,
                      'trai-cay': IconApple,
                      'gao-ngu-coc': IconWheat,
                      'thit-trung': IconEgg,
                      'thuy-san': IconFish,
                      'do-kho-gia-vi': IconPepper,
                      'dac-san': IconMapPin,
                      'organic': IconLeaf,
                      'vietgap': IconCertificate,
                      'che-bien': IconPackage,
                      'combo': IconShoppingBag,
                      'qua-tang': IconGift,
                      'tat-ca': IconStar,
                    };
                    const RailIcon = railIconMap[cat.value] ?? IconStar;
                    return (
                      <Box
                        key={cat.value}
                        component={Link}
                        href={`/san-pham?category=${encodeURIComponent(cat.value)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 6,
                          textDecoration: 'none',
                          color: '#173126',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'background 0.15s ease',
                        }}
                        className="category-rail-item"
                      >
                        <RailIcon size={20} color="#0B7A48" stroke={1.8} />
                        <Text size="xs" fw={500} c="#223B2F" lineClamp={1}>
                          {cat.label}
                        </Text>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Main Hero Banner - slider 6 ảnh, tự lướt mỗi 3s */}
            <Grid.Col span={{ base: 12, md: 'auto' }} style={{ flex: 1 }}>
              <Paper
                pos="relative"
                h={{ base: 200, sm: 300, md: 470 }}
                radius="sm"
                style={{ overflow: 'hidden', background: '#EFF6F1' }}
                onMouseEnter={() => setTamDungLuotBanner(true)}
                onMouseLeave={() => setTamDungLuotBanner(false)}
                onTouchStart={(e) => {
                  viTriChamBatDau.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  const batDau = viTriChamBatDau.current;
                  const ketThuc = e.changedTouches[0]?.clientX;
                  viTriChamBatDau.current = null;
                  if (batDau == null || ketThuc == null) return;
                  const khoangCach = ketThuc - batDau;
                  if (Math.abs(khoangCach) < 40) return;
                  if (khoangCach < 0) chuyenBannerTiep();
                  else chuyenBannerTruoc();
                }}
              >
                {/* Track trượt ngang */}
                <Box
                  h="100%"
                  w="100%"
                  style={{
                    display: 'flex',
                    transform: `translateX(-${chiSoBanner * 100}%)`,
                    transition: 'transform 0.6s ease',
                  }}
                >
                  {DANH_SACH_BANNER_HERO.map((banner) => (
                    <Box
                      key={banner.src}
                      component={Link}
                      href={banner.href}
                      style={{
                        flex: '0 0 100%',
                        width: '100%',
                        height: '100%',
                        textDecoration: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        background: '#EAF3EC',
                      }}
                    >
                      {/* Nền mờ lấp đầy khoảng trống — ảnh gốc tỉ lệ ~4:1 nên không crop */}
                      <Box
                        pos="absolute"
                        inset={0}
                        style={{
                          backgroundImage: `url(${banner.src})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'blur(18px) brightness(0.96)',
                          transform: 'scale(1.15)',
                        }}
                      />
                      {/* Ảnh chính hiện trọn vẹn chữ */}
                      <Image
                        src={banner.src}
                        alt={banner.alt}
                        w="100%"
                        h="100%"
                        fit="contain"
                        pos="relative"
                        style={{ zIndex: 1 }}
                      />
                    </Box>
                  ))}
                </Box>

                {/* Left/Right carousel arrows */}
                <ActionIcon
                  pos="absolute"
                  left={12}
                  top="50%"
                  style={{ transform: 'translateY(-50%)', zIndex: 3 }}
                  variant="white"
                  radius="xl"
                  size={32}
                  color="gray"
                  aria-label="Banner trước"
                  onClick={chuyenBannerTruoc}
                >
                  <IconChevronLeft size={18} />
                </ActionIcon>
                <ActionIcon
                  pos="absolute"
                  right={12}
                  top="50%"
                  style={{ transform: 'translateY(-50%)', zIndex: 3 }}
                  variant="white"
                  radius="xl"
                  size={32}
                  color="gray"
                  aria-label="Banner tiếp theo"
                  onClick={chuyenBannerTiep}
                >
                  <IconChevronRight size={18} />
                </ActionIcon>

                {/* Dots indicator - bấm để nhảy tới ảnh */}
                <Group
                  gap={6}
                  pos="absolute"
                  bottom={12}
                  left="50%"
                  style={{ transform: 'translateX(-50%)', zIndex: 3 }}
                >
                  {DANH_SACH_BANNER_HERO.map((banner, index) => {
                    const dangHoatDong = index === chiSoBanner;
                    return (
                      <Box
                        key={banner.src}
                        component="button"
                        onClick={() => setChiSoBanner(index)}
                        aria-label={`Xem banner ${index + 1}`}
                        w={dangHoatDong ? 20 : 6}
                        h={6}
                        bg={dangHoatDong ? '#0B7A48' : 'rgba(255,255,255,0.7)'}
                        style={{
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          boxShadow: dangHoatDong
                            ? 'none'
                            : '0 1px 3px rgba(0,0,0,0.35)',
                          transition: 'width 0.3s ease, background 0.3s ease',
                        }}
                      />
                    );
                  })}
                </Group>
              </Paper>
            </Grid.Col>

            {/* Right Side Promo Banners - 2 cards (ảnh sạch, không chữ nền) */}
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={12} h="100%">
                {/* Top side promo - ảnh full nền như mẫu, chữ đè góc trái trên */}
                <Paper
                  component={Link}
                  href="/san-pham?category=rau-cu"
                  pos="relative"
                  radius="sm"
                  h={{ base: 150, md: 229 }}
                  style={{
                    overflow: 'hidden',
                    backgroundColor: '#F2F8F3',
                    backgroundImage: `url(${ANH_PROMO_RAU_CU})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '16px 18px',
                  }}
                >
                  <Box
                    pos="absolute"
                    inset={0}
                    style={{
                      background:
                        'linear-gradient(95deg, #F4FAF5 0%, rgba(244,250,245,0.95) 32%, rgba(244,250,245,0.35) 55%, rgba(244,250,245,0) 75%)',
                    }}
                  />
                  <Stack gap={3} pos="relative" style={{ zIndex: 2, maxWidth: '62%' }}>
                    <Text fw={850} fz={15} c="#173126" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                      Rau củ tươi mỗi ngày
                    </Text>
                    <Text fw={850} fz={13} c="#0B7A48">
                      Giảm đến 30%
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      bg="#06633C"
                      c="white"
                      w="fit-content"
                      px={14}
                      h={28}
                      mt={8}
                      styles={{ root: { fontSize: 11, fontWeight: 700 } }}
                    >
                      Xem ngay →
                    </Button>
                  </Stack>
                </Paper>

                {/* Bottom side promo - ảnh full nền như mẫu, chữ đè góc trái trên */}
                <Paper
                  component={Link}
                  href="/san-pham?category=trai-cay"
                  pos="relative"
                  radius="sm"
                  h={{ base: 150, md: 229 }}
                  style={{
                    overflow: 'hidden',
                    backgroundColor: '#FFF8F0',
                    backgroundImage: `url(${ANH_PROMO_TRAI_CAY})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '16px 18px',
                  }}
                >
                  <Box
                    pos="absolute"
                    inset={0}
                    style={{
                      background:
                        'linear-gradient(95deg, #FFF8F0 0%, rgba(255,248,240,0.95) 32%, rgba(255,248,240,0.35) 55%, rgba(255,248,240,0) 75%)',
                    }}
                  />
                  <Stack gap={3} pos="relative" style={{ zIndex: 2, maxWidth: '62%' }}>
                    <Text fw={850} fz={15} c="#173126" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                      Trái cây theo mùa
                    </Text>
                    <Text fw={850} fz={13} c="#0B7A48">
                      Ngọt lành tự nhiên
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      bg="#06633C"
                      c="white"
                      w="fit-content"
                      px={14}
                      h={28}
                      mt={8}
                      styles={{ root: { fontSize: 11, fontWeight: 700 } }}
                    >
                      Xem ngay →
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>

        {/* ============================================================
            SECTION 2: TRUST STRIP (4 ITEMS)
           ============================================================ */}
        <Paper
          bg="white"
          withBorder
          radius="sm"
          py={12}
          px={{ base: 14, md: 24 }}
          mb={14}
          style={{ borderColor: '#DDE8DF' }}
        >
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <Group gap={10} wrap="nowrap" align="center">
              <Box
                w={36}
                h={36}
                bg="#EBF5EE"
                style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0B7A48', flexShrink: 0 }}
              >
                <IconQrcode size={20} />
              </Box>
              <Stack gap={1}>
                <Text fw={800} size="xs" c="#173126">
                  Truy xuất nguồn gốc
                </Text>
                <Text size="11px" c="dimmed">
                  Rõ ràng, minh bạch
                </Text>
              </Stack>
            </Group>

            <Group gap={10} wrap="nowrap" align="center">
              <Box
                w={36}
                h={36}
                bg="#EBF5EE"
                style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0B7A48', flexShrink: 0 }}
              >
                <IconBuildingStore size={20} />
              </Box>
              <Stack gap={1}>
                <Text fw={800} size="xs" c="#173126">
                  Trang trại minh bạch
                </Text>
                <Text size="11px" c="dimmed">
                  Kết nối trực tiếp
                </Text>
              </Stack>
            </Group>

            <Group gap={10} wrap="nowrap" align="center">
              <Box
                w={36}
                h={36}
                bg="#EBF5EE"
                style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0B7A48', flexShrink: 0 }}
              >
                <IconShieldCheck size={20} />
              </Box>
              <Stack gap={1}>
                <Text fw={800} size="xs" c="#173126">
                  Sản phẩm an toàn
                </Text>
                <Text size="11px" c="dimmed">
                  Đạt tiêu chuẩn VietGAP
                </Text>
              </Stack>
            </Group>

            <Group gap={10} wrap="nowrap" align="center">
              <Box
                w={36}
                h={36}
                bg="#EBF5EE"
                style={{ borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0B7A48', flexShrink: 0 }}
              >
                <IconHeart size={20} />
              </Box>
              <Stack gap={1}>
                <Text fw={800} size="xs" c="#173126">
                  Vì sức khỏe cộng đồng
                </Text>
                <Text size="11px" c="dimmed">
                  Nông nghiệp bền vững
                </Text>
              </Stack>
            </Group>
          </SimpleGrid>
        </Paper>

        {/* ============================================================
            SECTION 3: QUICK CATEGORIES (HORIZONTAL COLORFUL BAR)
           ============================================================ */}
        <Paper
          bg="white"
          withBorder
          radius="sm"
          py={14}
          px={{ base: 4, md: 8 }}
          mb={20}
          style={{ borderColor: '#DDE8DF' }}
        >
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 0,
            }}
          >
            {[
              { label: 'Rau củ', slug: 'rau-cu', icon: IconSalad, bg: '#ECFDF5', iconColor: '#059669' },
              { label: 'Trái cây', slug: 'trai-cay', icon: IconApple, bg: '#FFF7ED', iconColor: '#EA580C' },
              { label: 'Gạo, ngũ cốc', slug: 'gao-ngu-coc', icon: IconWheat, bg: '#FEFCE8', iconColor: '#CA8A04' },
              { label: 'Thịt, trứng', slug: 'thit-trung', icon: IconEgg, bg: '#FEF2F2', iconColor: '#DC2626' },
              { label: 'Thủy sản', slug: 'thuy-san', icon: IconFish, bg: '#ECFEFF', iconColor: '#0891B2' },
              { label: 'Đồ khô, gia vị', slug: 'do-kho-gia-vi', icon: IconPepper, bg: '#FFF7ED', iconColor: '#C2410C' },
              { label: 'Đặc sản', slug: 'dac-san', icon: IconMapPin, bg: '#F5F3FF', iconColor: '#7C3AED' },
              { label: 'Organic', slug: 'organic', icon: IconLeaf, bg: '#ECFDF5', iconColor: '#16A34A' },
              { label: 'VietGAP', slug: 'vietgap', icon: IconCertificate, bg: '#E0F2FE', iconColor: '#0284C7' },
              { label: 'Chế biến', slug: 'che-bien', icon: IconPackage, bg: '#F3F4F6', iconColor: '#4B5563' },
              { label: 'Quà tặng', slug: 'qua-tang', icon: IconGift, bg: '#FDF2F8', iconColor: '#DB2777' },
              { label: 'Combo', slug: 'combo', icon: IconShoppingBag, bg: '#EFF6FF', iconColor: '#2563EB' },
            ].map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Box
                  key={cat.slug}
                  component={Link}
                  href={`/san-pham?category=${encodeURIComponent(cat.slug)}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    padding: '6px 2px',
                  }}
                >
                  <Box
                    w={50}
                    h={50}
                    style={{
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: cat.bg,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    }}
                  >
                    <IconComponent size={26} color={cat.iconColor} stroke={1.8} />
                  </Box>
                  <Text fz={11} fw={600} c="#223B2F" ta="center" lineClamp={1}>
                    {cat.label}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* ============================================================
            SECTION 4: FLASH SALE (full-width, 5 thẻ đồng nhất)
           ============================================================ */}
        <Box mb={24} id="flash-sale">
          {/* Header row */}
          <Group justify="space-between" align="center" mb={10}>
            <Group gap="sm" align="center">
              <IconBolt size={22} color="#E53935" fill="#E53935" />
              <Text fw={900} fz={18} c="#E53935" style={{ letterSpacing: '-0.01em' }}>
                Flash Sale
              </Text>
            </Group>
            <Link
              href="/san-pham"
              style={{
                textDecoration: 'none',
                color: '#0B7A48',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Xem tất cả &gt;
            </Link>
          </Group>

          {/* 5 Flash Sale Cards — full width, cùng 1 kiểu thẻ, cùng chiều cao */}
          <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing={10} style={{ alignItems: 'stretch' }}>
            {flashSaleItems.map((item) => (
              <Paper
                key={item.id}
                component={Link}
                href={item.id ? `/san-pham/${item.id}` : '/san-pham'}
                bg="white"
                withBorder
                p={8}
                radius="sm"
                pos="relative"
                h="100%"
                style={{
                  borderColor: '#DDE8DF',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minWidth: 0,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                {/* Discount badge */}
                <Badge
                  pos="absolute"
                  top={8}
                  left={8}
                  bg="#E53935"
                  c="white"
                  radius={4}
                  size="sm"
                  fw={800}
                  styles={{ root: { zIndex: 2 } }}
                >
                  {item.giam}
                </Badge>

                {/* Image — cố định chiều cao để mọi thẻ bằng nhau */}
                <Box h={115} style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={item.anh}
                    alt={item.ten}
                    h={105}
                    w="100%"
                    fit="contain"
                  />
                </Box>

                {/* Details — footer đẩy xuống đáy để giá + nút luôn thẳng hàng */}
                <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.35}>
                    {item.ten}
                  </Text>
                  <Text size="11px" c="dimmed" lineClamp={1}>
                    {item.trangTraiTen}
                  </Text>

                  <Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap" style={{ minWidth: 0 }}>
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text fw={900} fz={13.5} c="#0B7A48" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                        {dinhDangTien(item.gia)}
                      </Text>
                      <Text size="10px" c="dimmed" td="line-through" lh={1.1}>
                        {dinhDangTien(item.giaCu)}
                      </Text>
                    </Stack>

                    <ActionIcon
                      size={26}
                      radius={6}
                      bg="#0B7A48"
                      color="white"
                      variant="filled"
                      aria-label="Thêm vào giỏ"
                      style={{ flexShrink: 0 }}
                    >
                      <IconShoppingCart size={15} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        {/* ============================================================
            SECTION 5: SẢN PHẨM NỔI BẬT (full-width, thẻ đồng nhất)
            + TRANG TRẠI TIÊU BIỂU (hàng riêng 3 thẻ đồng nhất)
            Tách 2 khối ra để farm card không chen vào hàng sản phẩm gây lệch
           ============================================================ */}
        <Box mb={24} id="trang-trai">
          {/* ---- 5a: Featured Products full width ---- */}
          <Box mb={20}>
            {/* Header with category tabs */}
            <Group justify="space-between" align="center" mb={10} wrap="wrap">
              <Group gap={8} wrap="wrap">
                <Group gap={6}>
                  <IconStarFilled size={18} color="#E67E22" />
                  <Text fw={900} fz={18} c="#173126">
                    Sản phẩm nổi bật
                  </Text>
                </Group>

                <Group gap={4} ml={{ base: 0, sm: 8 }} wrap="wrap">
                  {[
                    { id: 'tat-ca', label: 'Tất cả' },
                    { id: 'rau-cu', label: 'Rau củ' },
                    { id: 'trai-cay', label: 'Trái cây' },
                    { id: 'thit-trung', label: 'Thịt, trứng' },
                    { id: 'thuy-san', label: 'Thủy sản' },
                    { id: 'dac-san', label: 'Đặc sản' },
                    { id: 'organic', label: 'Organic' },
                    { id: 'vietgap', label: 'VietGAP' },
                  ].map((tab) => {
                    const active = tabNoiBat === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        onClick={() => setTabNoiBat(tab.id)}
                        size="xs"
                        h={26}
                        px={10}
                        radius="xl"
                        bg={active ? '#06633C' : '#EEF5F0'}
                        c={active ? 'white' : '#455E51'}
                        variant="filled"
                        styles={{ root: { fontSize: 11, fontWeight: active ? 700 : 500 } }}
                      >
                        {tab.label}
                      </Button>
                    );
                  })}
                </Group>
              </Group>

              <Link
                href="/san-pham"
                style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
              >
                Xem tất cả &gt;
              </Link>
            </Group>

            {/* 8 Featured Product Cards — cùng 1 kiểu thẻ, cùng chiều cao */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={10} style={{ alignItems: 'stretch' }}>
              {featuredItems.map((item) => (
                <Paper
                  key={item.id}
                  component={Link}
                  href={`/san-pham/${item.id}`}
                  bg="white"
                  withBorder
                  p={8}
                  radius="sm"
                  h="100%"
                  style={{
                    borderColor: '#DDE8DF',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minWidth: 0,
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <Box h={110} style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <Image
                      src={item.anh}
                      alt={item.ten}
                      h={100}
                      w="100%"
                      fit="contain"
                    />
                  </Box>

                  <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.35}>
                      {item.ten}
                    </Text>

                    <Group justify="space-between" align="center" mt="auto" pt={4} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Text fw={850} fz={13.5} c="#0B7A48" style={{ whiteSpace: 'nowrap' }}>
                        {dinhDangTien(item.gia)}
                      </Text>

                      <ActionIcon
                        size={26}
                        radius={6}
                        bg="#0B7A48"
                        color="white"
                        variant="filled"
                        aria-label="Thêm vào giỏ"
                        style={{ flexShrink: 0 }}
                      >
                        <IconShoppingCart size={15} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>

          {/* ---- 5b: Featured Farms — hàng riêng, 3 thẻ farm đồng nhất ---- */}
          <Box>
            <Group justify="space-between" align="center" mb={10}>
              <Group gap={6}>
                <IconLeaf size={18} color="#0B7A48" />
                <Text fw={900} fz={18} c="#173126">
                  Trang trại tiêu biểu
                </Text>
              </Group>
              <Link
                href="/theo-doi"
                style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
              >
                Xem tất cả &gt;
              </Link>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={10} style={{ alignItems: 'stretch' }}>
              {FALLBACK_FARMS.map((farm) => (
                <Paper
                  key={farm.ten}
                  bg="white"
                  withBorder
                  p={8}
                  radius="sm"
                  h="100%"
                  style={{
                    borderColor: '#DDE8DF',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minWidth: 0,
                  }}
                >
                  <Link
                    href={farm.href}
                    aria-label={`Xem ${farm.ten}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <Image
                      src={farm.anh}
                      alt={farm.ten}
                      h={120}
                      w="100%"
                      fit="cover"
                      radius={4}
                      style={{ cursor: 'pointer' }}
                    />
                  </Link>
                  <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={800} size="xs" c="#173126" lineClamp={1}>
                      {farm.ten}
                    </Text>
                    <Group gap={8} wrap="nowrap" align="center">
                      <Text size="11px" c="dimmed">
                        {farm.diaChi}
                      </Text>
                      <Group gap={2} wrap="nowrap">
                        <IconStarFilled size={12} color="#F39C12" />
                        <Text size="11px" fw={700} c="#173126">
                          {farm.sao}
                        </Text>
                        <Text size="11px" c="dimmed">
                          ({farm.soDanhGia})
                        </Text>
                      </Group>
                    </Group>
                    <Button
                      component={Link}
                      href={farm.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      h={26}
                      radius={4}
                      bg="#06633C"
                      c="white"
                      fullWidth
                      mt="auto"
                      styles={{ root: { fontSize: 11, fontWeight: 600, marginTop: 8 } }}
                    >
                      Xem trang trại
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>
        </Box>

        {/* ============================================================
            SECTION 6: KIẾN THỨC NÔNG SẢN (KNOWLEDGE ARTICLES)
           ============================================================ */}
        <Box mb={24} id="kien-thuc">
          <Group justify="space-between" align="center" mb={10} wrap="wrap">
            <Group gap={8} wrap="wrap">
              <Group gap={6}>
                <IconCertificate size={20} color="#E67E22" />
                <Text fw={900} fz={18} c="#173126">
                  Kiến thức nông sản
                </Text>
              </Group>

              <Group gap={4} ml={{ base: 0, sm: 8 }} wrap="wrap">
                {[
                  { id: 'tat-ca', label: 'Tất cả' },
                  { id: 'ky-thuat', label: 'Kỹ thuật trồng trọt' },
                  { id: 'dinh-duong', label: 'Dinh dưỡng' },
                  { id: 'meo-chon', label: 'Mẹo chọn mua' },
                  { id: 'tin-tuc', label: 'Tin tức' },
                  { id: 'cau-chuyen', label: 'Câu chuyện nông dân' },
                ].map((tab) => {
                  const active = tabKienThuc === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      onClick={() => setTabKienThuc(tab.id)}
                      size="xs"
                      h={26}
                      px={10}
                      radius="xl"
                      bg={active ? '#06633C' : '#EEF5F0'}
                      c={active ? 'white' : '#455E51'}
                      variant="filled"
                      styles={{ root: { fontSize: 11, fontWeight: active ? 700 : 500 } }}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </Group>
            </Group>

            <Link
              href="/#kien-thuc"
              style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
            >
              Xem tất cả &gt;
            </Link>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={12} style={{ alignItems: 'stretch' }}>
            {FALLBACK_KNOWLEDGE_ARTICLES.map((article) => (
              <Paper
                key={article.title}
                bg="white"
                withBorder
                radius="sm"
                h="100%"
                component="a"
                href={'href' in article && article.href ? article.href : '/#kien-thuc'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderColor: '#DDE8DF',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minWidth: 0,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <Image
                  src={article.anh}
                  alt={article.title}
                  h={115}
                  w="100%"
                  fit="cover"
                />
                <Stack gap={4} p={10} style={{ flex: 1, minWidth: 0 }}>
                  <Badge
                    size="xs"
                    w="fit-content"
                    radius={4}
                    bg="#EBF5EE"
                    c="#0B7A48"
                    fw={700}
                  >
                    {article.tag}
                  </Badge>
                  <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.3}>
                    {article.title}
                  </Text>
                  <Text size="11px" c="dimmed" lineClamp={2} mih={30} lh={1.4}>
                    {article.moTa}
                  </Text>
                  <Group justify="space-between" align="center" mt="auto" pt={4}>
                    <Text size="10px" c="dimmed">
                      {article.date}
                    </Text>
                    <Text size="10px" c="dimmed">
                      👁 {article.meta}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        {/* ============================================================
            SECTION 8: CÂU CHUYỆN TỪ TRANG TRẠI (FARM STORIES)
           ============================================================ */}
        <Box mb={24} id="cau-chuyen">
          <Group justify="space-between" align="center" mb={10}>
            <Group gap={8}>
              <IconLeaf size={18} color="#0B7A48" />
              <Text fw={900} fz={18} c="#173126">
                Câu chuyện từ trang trại
              </Text>
              <Text size="xs" c="dimmed">
                Những con người thật, nông sản thật, giá trị thật
              </Text>
            </Group>
            <Link
              href="/#cau-chuyen"
              style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
            >
              Xem tất cả &gt;
            </Link>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={12} style={{ alignItems: 'stretch' }}>
            {FALLBACK_FARM_STORIES.map((story) => (
              <Paper
                key={story.title}
                bg="white"
                withBorder
                radius="sm"
                h="100%"
                component="a"
                href={'href' in story && story.href ? story.href : '/#cau-chuyen'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderColor: '#DDE8DF',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minWidth: 0,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <Image
                  src={story.anh}
                  alt={story.title}
                  h={115}
                  w="100%"
                  fit="cover"
                />
                <Stack gap={4} p={10} style={{ flex: 1, minWidth: 0 }}>
                  <Badge
                    size="xs"
                    w="fit-content"
                    radius={4}
                    bg="#EBF5EE"
                    c="#0B7A48"
                    fw={700}
                  >
                    {story.tag}
                  </Badge>
                  <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.3}>
                    {story.title}
                  </Text>
                  <Text size="11px" c="dimmed" lineClamp={2} mih={30} lh={1.4}>
                    {story.moTa}
                  </Text>
                  <Group justify="space-between" align="center" mt="auto" pt={4}>
                    <Text size="11px" fw={700} c="#0B7A48">
                      Xem câu chuyện →
                    </Text>
                    <Text size="10px" c="dimmed">
                      👁 {story.meta}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>
      </AgriContainer>
    </Box>
  );
}