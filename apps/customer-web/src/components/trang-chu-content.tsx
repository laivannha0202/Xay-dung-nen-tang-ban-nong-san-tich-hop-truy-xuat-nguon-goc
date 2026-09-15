'use client';

import {
  useLayDanhSachSanPhamCongKhai,
  useLayDanhSachTrangTraiCongKhai,
  useLayFlashSaleCongKhaiActive,
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
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconCertificate,
  IconLeaf,
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
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
  anhDuPhongTrangTrai,
  laSanPhamTestHomepage,
} from '@/lib/demo-images';
import {
  FALLBACK_KNOWLEDGE_ARTICLES,
  FALLBACK_REAL_NEWS_ARTICLES,
} from '@/lib/homepage-fallback';
import { AgriContainer } from './agri-container';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { BadgeGiamGia, coGiamGia, dinhDangTienVND } from './gia-san-pham';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

/** Chuẩn hoá tiếng Việt để so sánh tab lọc với tên danh mục API. */
function chuanHoaKhongDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Luồng chuẩn:
 * - Menu "Sản phẩm" -> /san-pham
 * - "Xem tất cả" ở Sản phẩm nổi bật -> /san-pham (+ filter theo tab đang chọn)
 * - Click 1 card -> /san-pham/{id}
 */
function hrefXemTatCaNoiBat(tab: string): string {
  switch (tab) {
    case 'rau-cu':
      return '/san-pham?category=rau-cu';
    case 'trai-cay':
      return '/san-pham?category=trai-cay';
    case 'thit-trung':
      return '/san-pham?category=thit-trung';
    case 'thuy-san':
      return '/san-pham?category=thuy-san';
    case 'dac-san':
      return '/san-pham?category=dac-san';
    case 'organic':
      return '/san-pham?certificate=organic';
    case 'vietgap':
      return '/san-pham?certificate=vietgap';
    case 'tat-ca':
    default:
      return '/san-pham';
  }
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

  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 16,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });
  // Flash Sale SERVER-AUTHORITATIVE: giá/tồn/discount đều từ
  // GET /api/v1/flash-sale-cong-khai/active. Không suy ra từ product list,
  // không tự tính phần trăm, không fallback sản phẩm tĩnh.
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  // Trang trại tiêu biểu trang chủ từ API thật (noiBat=true).
  // Lưu ý: OpenAPI backend mô tả sai kiểu trang/gioiHan (Object) ở endpoint
  // này nên ép kiểu transport-only; giá trị runtime vẫn là số đúng contract.
  const farmsQuery = useLayDanhSachTrangTraiCongKhai({
    trang: 1 as unknown as never,
    gioiHan: 6 as unknown as never,
    noiBat: true,
  });

  const apiProducts = useMemo(
    () => (noiBatQuery.data?.data?.duLieu ?? []).filter((p) => !laSanPhamTestHomepage(p.ten ?? '')),
    [noiBatQuery.data],
  );

  // Mọi giá/tồn/discount Flash Sale đều từ server (muc.*). Không chiến dịch
  // active → ẩn section. Lỗi → error/retry. Không bao giờ fake giá/discount.
  const flashSaleMuc = useMemo(
    () => (flashSaleQuery.data?.data ?? []).flatMap((chienDich) => chienDich.muc ?? []),
    [flashSaleQuery.data],
  );

  // Sản phẩm nổi bật CHỈ từ API thật. Loại món đang chạy Flash Sale
  // (theo sanPhamId server) để 2 hàng không trùng. Không có data → empty,
  // không dùng fixture tĩnh làm catalog.
  const featuredItems = useMemo(() => {
    const flashSaleIds = new Set(flashSaleMuc.map((muc) => muc.sanPhamId));
    const chuaHienThi = apiProducts.filter((p) => !flashSaleIds.has(p.id));
    const filtered =
      tabNoiBat === 'tat-ca'
        ? chuaHienThi.slice(0, 8)
        : chuaHienThi
            .filter((p) => {
              const slug = (p.danhMuc?.slug || '').toLowerCase();
              if (slug === tabNoiBat) return true;
              const cat = chuanHoaKhongDau(p.danhMuc?.ten || '');
              const tabNorm = tabNoiBat.replace(/-/g, ' ');
              if (tabNoiBat === 'organic') {
                const certs = (p.chungNhan ?? []).map((c) =>
                  chuanHoaKhongDau(c.loai || ''),
                );
                return (
                  certs.some(
                    (c) => c.includes('huu co') || c.includes('organic'),
                  ) || cat.includes('organic') || cat.includes('huu co')
                );
              }
              if (tabNoiBat === 'vietgap') {
                const certs = (p.chungNhan ?? []).map((c) =>
                  chuanHoaKhongDau(c.loai || ''),
                );
                return certs.some((c) => c.includes('vietgap'));
              }
              return cat.includes(tabNorm);
            })
            .slice(0, 8);

    // Giá hiển thị customer PHẢI là giá bán hiệu lực (giaBan) từ backend —
    // cùng nguồn GiaHieuLucService với Flash Sale. Không dùng gia.tu (giá gốc).
    return filtered.map((p) => ({
      id: p.id,
      href: `/san-pham/${p.id}`,
      ten: p.ten,
      giaBan: p.giaBan ?? null,
      giaFallback: p.gia.tu,
      anh: p.anhBiaUrl || anhDuPhongSanPham(p.ten),
      trangTraiTen: p.trangTrai?.ten?.trim() || null,
    }));
  }, [apiProducts, flashSaleMuc, tabNoiBat]);

  // Trang trại tiêu biểu CHỈ từ API thật (noiBat=true). Rỗng/lỗi → ẩn section,
  // không dùng fixture tĩnh.
  const farmsHienThi = useMemo(
    () => farmsQuery.data?.data?.duLieu ?? [],
    [farmsQuery.data],
  );

  const hrefXemTatCa = hrefXemTatCaNoiBat(tabNoiBat);

  // AGRIMARKET_HOME_4_KNOWLEDGE_4_NEWS_V1
  // Trang chủ chỉ preview tối đa 4 bài cho mỗi section.
  const kienThucTrangChu = useMemo(() => {
    const items = FALLBACK_KNOWLEDGE_ARTICLES;

    if (tabKienThuc === 'tat-ca') {
      return items.slice(0, 4);
    }

    const tuKhoa: Record<string, string[]> = {
      'ky-thuat': ['ky thuat', 'trong trot', 'canh tac', 'thuy canh', 'nha mang'],
      'dinh-duong': ['dinh duong', 'suc khoe', 'vitamin', 'khau phan'],
      'meo-chon': ['meo', 'chon', 'bao quan', 'an toan', 'mua'],
      'cau-chuyen': ['cau chuyen', 'nong dan', 'ky su', 'trang trai'],
    };

    const keys = tuKhoa[tabKienThuc] ?? [];

    return items
      .filter((article) => {
        const text = chuanHoaKhongDau(
          `${article.tag} ${article.title} ${article.moTa}`,
        );
        return keys.some((key) => text.includes(key));
      })
      .slice(0, 4);
  }, [tabKienThuc]);

  const tinTucTrangChu = useMemo(
    () => FALLBACK_REAL_NEWS_ARTICLES.slice(0, 4),
    [],
  );

  return (
    <Box bg="#F6FBF7" pb={{ base: 40, md: 60 }} pt={{ base: 12, md: 16 }}>
      <AgriContainer>
        {/* ============================================================
            SECTION 1: HERO ROW (MAIN HERO + SIDE PROMOS)
           ============================================================ */}
        <Box mb={14}>
          <Grid gap={12} align="stretch">
            {/* Main Hero Banner - slider 6 ảnh, MỘT ảnh sắc nét mỗi slide, tỉ lệ 4:1 */}
            <Grid.Col span={{ base: 12, md: 'auto' }} style={{ flex: 1 }}>
              <Paper
                pos="relative"
                radius="sm"
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 1',
                  overflow: 'hidden',
                  background: '#EFF6F1',
                }}
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
                      {/* MỘT ảnh banner duy nhất — full width, sắc nét */}
                      <Image
                        src={banner.src}
                        alt={banner.alt}
                        w="100%"
                        h="100%"
                        fit="cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

            {/* Right Side Promo Banners - giữ bên phải hero, chia đôi chiều cao hero */}
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={12} h="100%">
                {/* Top side promo - ảnh full nền như mẫu, chữ đè góc trái trên */}
                <Paper
                  component={Link}
                  href="/san-pham?category=rau-cu"
                  pos="relative"
                  radius="sm"
                  mih={{ base: 130, md: 0 }}
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
                    padding: '10px 14px',
                    flex: '1 1 0',
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
                  <Stack gap={2} pos="relative" style={{ zIndex: 2, maxWidth: '62%' }}>
                    <Text fw={850} fz={13} c="#173126" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                      Rau củ tươi mỗi ngày
                    </Text>
                    <Text fw={850} fz={12} c="#0B7A48">
                      Tươi ngon mỗi ngày
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      bg="#06633C"
                      c="white"
                      w="fit-content"
                      px={12}
                      h={24}
                      mt={6}
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
                  mih={{ base: 130, md: 0 }}
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
                    padding: '10px 14px',
                    flex: '1 1 0',
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
                  <Stack gap={2} pos="relative" style={{ zIndex: 2, maxWidth: '62%' }}>
                    <Text fw={850} fz={13} c="#173126" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                      Trái cây theo mùa
                    </Text>
                    <Text fw={850} fz={12} c="#0B7A48">
                      Ngọt lành tự nhiên
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      bg="#06633C"
                      c="white"
                      w="fit-content"
                      px={12}
                      h={24}
                      mt={6}
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

        {/* TRUST STRIP, SIDEBAR và QUICK CATEGORIES đã gỡ theo yêu cầu — trang đi thẳng vào Flash Sale */}

        {/* ============================================================
            SECTION 4: FLASH SALE — 100% SERVER-AUTHORITATIVE từ
            /api/v1/flash-sale-cong-khai/active. Không chiến dịch → ẩn section.
            Lỗi → error/retry. Không bao giờ fake giá/discount.
           ============================================================ */}
        {flashSaleQuery.isPending ? (
        <Box mb={24} id="flash-sale">
          <Group gap="sm" align="center" mb={10}>
            <IconBolt size={22} color="#E53935" fill="#E53935" />
            <Text fw={900} fz={18} c="#E53935" style={{ letterSpacing: '-0.01em' }}>
              Flash Sale
            </Text>
          </Group>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 220px))',
              gap: 10,
              justifyContent: 'start',
            }}
          >
            {[0, 1, 2, 3].map((key) => (
              <Paper key={key} bg="white" withBorder p={8} radius="sm" style={{ borderColor: '#DDE8DF' }}>
                <Skeleton h={105} radius={4} />
                <Skeleton h={12} mt={8} radius={4} />
                <Skeleton h={12} mt={6} w="60%" radius={4} />
              </Paper>
            ))}
          </Box>
        </Box>
        ) : flashSaleQuery.isError ? (
        <Box mb={24} id="flash-sale">
          <ErrorState
            tieuDe="Không tải được Flash Sale"
            moTa="Chương trình giảm giá đang tạm thời không khả dụng."
            onThuLai={() => void flashSaleQuery.refetch()}
          />
        </Box>
        ) : flashSaleMuc.length === 0 ? null : (
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
              href="/khuyen-mai"
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

          {/* Flash Sale Cards — giá/tồn/discount đều từ server (muc.*).
              Grid co theo nội dung, 1 item gọn trái, không ép cột trống. */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 220px))',
              gap: 10,
              justifyContent: 'start',
              alignItems: 'stretch',
            }}
          >
            {flashSaleMuc.map((muc) => {
              const hetHang = muc.soLuongKhaDung <= 0;
              return (
              <Paper
                key={muc.bienTheSanPhamId}
                component={Link}
                href={`/san-pham/${muc.sanPhamId}`}
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
                {/* Discount badge — phanTramGiam server-side */}
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
                  {`-${muc.phanTramGiam}%`}
                </Badge>

                {/* Image — cố định chiều cao để mọi thẻ bằng nhau */}
                <Box h={115} style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                    alt={muc.ten}
                    h={105}
                    w="100%"
                    fit="contain"
                  />
                </Box>

                {/* Details — footer đẩy xuống đáy để giá luôn thẳng hàng */}
                <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.35}>
                    {muc.ten}
                  </Text>
                  <Text size="11px" c="dimmed" lineClamp={1}>
                    {`${muc.trangTrai.ten} · ${muc.khoiLuong} ${muc.donVi}`}
                  </Text>

                  <Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap" style={{ minWidth: 0 }}>
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text fw={900} fz={13.5} c="#0B7A48" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                        {dinhDangTien(muc.giaFlash)}
                      </Text>
                      <Text size="10px" c="dimmed" td="line-through" lh={1.1}>
                        {dinhDangTien(muc.giaGoc)}
                      </Text>
                    </Stack>

                    {hetHang ? (
                      <Badge size="xs" radius={4} bg="#F1F5F2" c="#64748B" style={{ flexShrink: 0 }}>
                        Hết hàng
                      </Badge>
                    ) : null}
                  </Group>
                </Stack>
              </Paper>
              );
            })}
          </Box>
        </Box>
        )}

        {/* ============================================================
            SECTION 5: SẢN PHẨM NỔI BẬT (full-width, thẻ đồng nhất)
            + TRANG TRẠI TIÊU BIỂU (hàng riêng 3 thẻ đồng nhất)
            Tách 2 khối ra để farm card không chen vào hàng sản phẩm gây lệch
           ============================================================ */}
        <Box mb={24}>
          {/* ---- 5a: Featured Products full width ---- */}
          <Box mb={20} id="san-pham-noi-bat" style={{ scrollMarginTop: 130 }}>
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
                href={hrefXemTatCa}
                style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
              >
                Xem tất cả &gt;
              </Link>
            </Group>

            {/* Featured Product Cards — CHỈ từ API thật, không fixture tĩnh */}
            {noiBatQuery.isPending ? (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={10}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
                <Paper key={key} bg="white" withBorder p={8} radius="sm" style={{ borderColor: '#DDE8DF' }}>
                  <Skeleton h={100} radius={4} />
                  <Skeleton h={12} mt={8} radius={4} />
                  <Skeleton h={12} mt={6} w="60%" radius={4} />
                </Paper>
              ))}
            </SimpleGrid>
            ) : noiBatQuery.isError ? (
            <ErrorState
              tieuDe="Không tải được sản phẩm nổi bật"
              moTa="Danh sách sản phẩm đang tạm thời không khả dụng."
              onThuLai={() => void noiBatQuery.refetch()}
            />
            ) : featuredItems.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có sản phẩm nổi bật"
              moTa="Hiện chưa có sản phẩm phù hợp với bộ lọc đã chọn."
            />
            ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={10} style={{ alignItems: 'stretch' }}>
              {featuredItems.map((item) => {
                const giaHienTai =
                  typeof item.giaBan?.tu === 'number' && item.giaBan.tu > 0
                    ? item.giaBan.tu
                    : item.giaFallback;
                const dangGiam = coGiamGia(item.giaBan);
                return (
                <Paper
                  key={item.href + item.ten}
                  component={Link}
                  href={item.href}
                  bg="white"
                  withBorder
                  p={8}
                  radius="sm"
                  h="100%"
                  pos="relative"
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
                  {dangGiam ? (
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
                    {`-${Math.round(item.giaBan?.phanTramGiam as number)}%`}
                  </Badge>
                  ) : null}
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
                    {item.trangTraiTen ? (
                    <Text size="11px" c="dimmed" lineClamp={1}>
                      {item.trangTraiTen}
                    </Text>
                    ) : null}

                    <Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text fw={850} fz={13.5} c="#0B7A48" lh={1.2} style={{ whiteSpace: 'nowrap' }}>
                          {dinhDangTien(giaHienTai)}
                        </Text>
                        {dangGiam ? (
                        <Text size="10px" c="dimmed" td="line-through" lh={1.1}>
                          {dinhDangTienVND(item.giaBan?.giaGocDaiDien as number)}
                        </Text>
                        ) : null}
                      </Stack>
                      {dangGiam ? (
                      <BadgeGiamGia phanTram={item.giaBan?.phanTramGiam} />
                      ) : null}
                    </Group>
                  </Stack>
                </Paper>
                );
              })}
            </SimpleGrid>
            )}
          </Box>

          {/* ---- 5b: Featured Farms — CHỈ từ API thật (noiBat=true); rỗng/lỗi → ẩn ---- */}
          {farmsQuery.isPending ? (
          <Box id="trang-trai" style={{ scrollMarginTop: 130 }}>
            <Group gap={6} mb={10}>
              <IconLeaf size={18} color="#0B7A48" />
              <Text fw={900} fz={18} c="#173126">
                Trang trại tiêu biểu
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={10}>
              {[0, 1, 2].map((key) => (
                <Paper key={key} bg="white" withBorder p={8} radius="sm" style={{ borderColor: '#DDE8DF' }}>
                  <Skeleton h={120} radius={4} />
                  <Skeleton h={12} mt={8} radius={4} />
                  <Skeleton h={12} mt={6} w="60%" radius={4} />
                </Paper>
              ))}
            </SimpleGrid>
          </Box>
          ) : farmsQuery.isError || farmsHienThi.length === 0 ? null : (
          <Box id="trang-trai" style={{ scrollMarginTop: 130 }}>
            <Group justify="space-between" align="center" mb={10}>
              <Group gap={6}>
                <IconLeaf size={18} color="#0B7A48" />
                <Text fw={900} fz={18} c="#173126">
                  Trang trại tiêu biểu
                </Text>
              </Group>
              <Link
                href="/trang-trai"
                style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
              >
                Xem tất cả &gt;
              </Link>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={10} style={{ alignItems: 'stretch' }}>
              {farmsHienThi.map((farm) => (
                <Paper
                  key={farm.id}
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
                    href={`/trang-trai/${farm.id}`}
                    aria-label={`Xem ${farm.ten}`}
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <Image
                      src={farm.anhBiaUrl || anhDuPhongTrangTrai(farm.ten)}
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
                    </Group>
                    {farm.chungNhan.length > 0 ? (
                    <Group gap={4} wrap="wrap">
                      <Badge size="xs" radius={4} bg="#EBF5EE" c="#0B7A48" fw={700}>
                        {farm.chungNhan[0]?.loai}
                      </Badge>
                      {farm.chungNhan.length > 1 ? (
                      <Text size="10px" c="dimmed">
                        {`+${farm.chungNhan.length - 1} chứng nhận`}
                      </Text>
                      ) : null}
                    </Group>
                    ) : null}
                    <Button
                      component={Link}
                      href={`/trang-trai/${farm.id}`}
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
          )}
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
              href="/kien-thuc"
              style={{ textDecoration: 'none', color: '#0B7A48', fontSize: 13, fontWeight: 600 }}
            >
              Xem tất cả &gt;
            </Link>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={12} style={{ alignItems: 'stretch' }}>
            {kienThucTrangChu.map((article) => (
              <Paper
                key={article.title}
                bg="white"
                withBorder
                radius="sm"
                h="100%"
                component="a"
                href={'href' in article && article.href ? article.href : '/kien-thuc'}
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
                  <Group justify="flex-start" align="center" mt="auto" pt={4}>
                    <Text size="10px" c="dimmed">
                      {article.date}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>


        {/* ============================================================
            SECTION 7: TIN TỨC — PREVIEW 4 BÀI
           ============================================================ */}
        <Box mb={24} id="tin-tuc-home">
          <Group justify="space-between" align="center" mb={10}>
            <Text fw={900} fz={18} c="#173126">
              Tin tức
            </Text>

            <Link
              href="/tin-tuc"
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

          <SimpleGrid
            cols={{ base: 1, sm: 2, md: 4 }}
            spacing={12}
            style={{ alignItems: 'stretch' }}
          >
            {tinTucTrangChu.map((article) => (
              <Paper
                key={article.id}
                bg="white"
                withBorder
                radius="sm"
                h="100%"
                component="a"
                href={article.href}
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

                  <Text
                    fw={750}
                    size="xs"
                    c="#173126"
                    lineClamp={2}
                    mih={32}
                    lh={1.3}
                  >
                    {article.title}
                  </Text>

                  <Text
                    size="11px"
                    c="dimmed"
                    lineClamp={2}
                    mih={30}
                    lh={1.4}
                  >
                    {article.moTa}
                  </Text>

                  <Group justify="flex-start" align="center" mt="auto" pt={4}>
                    <Text size="10px" c="dimmed">
                      {article.date}
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