'use client';

import {
  dinhDangQuyCachSanPham,
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import {
  ActionIcon,
  Affix,
  Alert,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Group,
  Image,
  NumberInput,
  Paper,
  Rating,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowRight,
  IconCalendarEvent,
  IconCheck,
  IconInfoCircle,
  IconLeaf,
  IconMapPin,
  IconMinus,
  IconPackage,
  IconPlant,
  IconPlus,
  IconQrcode,
  IconShieldCheck,
  IconShoppingCart,
  IconStar,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { themMucGioHangKhach } from '@/lib/api-gio-hang';
import { anhDuPhongSanPham } from '@/lib/demo-images';
import {
  dinhDangGiaVND,
  hienThiGoiQuyCach,
  hienThiKhoangGia,
  hienThiTonKhaDung,
} from '@agrimarket/api-client';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { DanhGiaSanPham } from './danh-gia-san-pham';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';
import { SectionHeading } from './web-page';
import { WishlistButton } from './wishlist-button';

export function ChiTietSanPhamContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;

  // 1. Fetch dữ liệu sản phẩm chi tiết thật & sản phẩm liên quan
  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);
  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);
  const [soLuongMua, setSoLuongMua] = useState(1);
  const [dangThemGio, setDangThemGio] = useState(false);
  const [dangMuaNgay, setDangMuaNgay] = useState(false);
  const [gioHangMessage, setGioHangMessage] = useState<{
    loai: 'success' | 'error';
    noiDung: string;
  } | null>(null);

  const item = data?.data;

  // 2. Chọn biến thể: ưu tiên biến thể còn hàng đầu tiên nếu chưa chọn thủ công
  const bienTheDaChon = useMemo(() => {
    if (!item || !item.bienThe || item.bienThe.length === 0) return null;
    if (bienTheDaChonId) {
      const timThay = item.bienThe.find((b) => b.id === bienTheDaChonId);
      if (timThay) return timThay;
    }
    const khaDungDauTien = item.bienThe.find((b) => b.soLuongKhaDung > 0);
    return khaDungDauTien ?? item.bienThe[0];
  }, [item, bienTheDaChonId]);

  // Danh sách hình ảnh
  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort((a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu);
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;

  // Trạng thái tồn kho của biến thể đang chọn
  const conHang = Boolean(bienTheDaChon && bienTheDaChon.soLuongKhaDung > 0);
  const soLuongKhaDung = bienTheDaChon ? Math.floor(bienTheDaChon.soLuongKhaDung) : 0;

  // Thao tác Thêm vào giỏ hàng
  const themVaoGio = async () => {
    if (!bienTheDaChon || !conHang) return;
    if (!coPhienKhachHang()) {
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${id}`)}`);
      return;
    }

    setDangThemGio(true);
    setGioHangMessage(null);
    try {
      const gioHang = await themMucGioHangKhach(bienTheDaChon.id, soLuongMua);
      queryClient.setQueryData(['gio-hang-khach'], gioHang);
      setGioHangMessage({
        loai: 'success',
        noiDung: `Đã thêm ${hienThiTonKhaDung(soLuongMua)} vào giỏ hàng thành công.`,
      });
    } catch {
      setGioHangMessage({
        loai: 'error',
        noiDung: 'Số lượng sản phẩm hiện không còn đủ hoặc phiên làm việc đã hết hạn.',
      });
    } finally {
      setDangThemGio(false);
    }
  };

  // Thao tác Mua ngay
  const muaNgay = async () => {
    if (!bienTheDaChon || !conHang) return;
    if (!coPhienKhachHang()) {
      router.push(`/dang-nhap?next=${encodeURIComponent(`/san-pham/${id}`)}`);
      return;
    }

    setDangMuaNgay(true);
    setGioHangMessage(null);
    try {
      const gioHang = await themMucGioHangKhach(bienTheDaChon.id, soLuongMua);
      queryClient.setQueryData(['gio-hang-khach'], gioHang);
      router.push('/thanh-toan');
    } catch {
      setGioHangMessage({
        loai: 'error',
        noiDung: 'Không thể chuyển đến thanh toán. Vui lòng kiểm tra lại tồn kho.',
      });
    } finally {
      setDangMuaNgay(false);
    }
  };

  // 3. Trạng thái Loading với Skeleton giao diện
  if (isPending) {
    return (
      <AgriContainer py={{ base: 28, md: 48 }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 44 }}>
          <Stack gap="md">
            <Skeleton h={{ base: 330, sm: 460, md: 520 }} radius="lg" />
            <SimpleGrid cols={5} spacing="sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} h={76} radius="md" />
              ))}
            </SimpleGrid>
          </Stack>
          <Stack gap="lg">
            <Skeleton h={24} width="35%" />
            <Skeleton h={40} width="85%" />
            <Skeleton h={20} width="60%" />
            <Skeleton h={90} radius="md" />
            <Skeleton h={50} width="70%" />
            <Skeleton h={48} width="100%" />
          </Stack>
        </SimpleGrid>
      </AgriContainer>
    );
  }

  // 4. Trạng thái Lỗi hoặc 404
  if (isError || !item) {
    return (
      <AgriContainer py={{ base: 48, md: 72 }}>
        <Stack gap="lg" align="center">
          <ErrorState
            tieuDe="Sản phẩm không tồn tại hoặc không còn được bán"
            moTa="Nông sản bạn tìm kiếm có thể đã hết mùa vụ, tạm ngừng cung cấp hoặc liên kết không chính xác."
            onThuLai={() => void refetch()}
          />
          <Button component={Link} href="/san-pham" color="agrimarket" radius="md">
            Quay lại danh sách nông sản
          </Button>
        </Stack>
      </AgriContainer>
    );
  }

  const related = relatedData?.data?.duLieu ?? [];
  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;
  const coDanhGia = item.danhGia && item.danhGia.tongLuot > 0;

  return (
    <Box className="agri-page" pb={{ base: 80, sm: 48 }}>
      {/* Breadcrumb phân cấp — dùng Mantine Breadcrumbs */}
      <AgriContainer py={{ base: 16, md: 22 }}>
        <Breadcrumbs separator="›" separatorMargin="xs">
          <Anchor component={Link} href="/" fz={13} fw={500} c="dimmed">
            Trang chủ
          </Anchor>
          <Anchor component={Link} href="/san-pham" fz={13} fw={500} c="dimmed">
            Sản phẩm
          </Anchor>
          {item.danhMuc ? (
            <Anchor
              component={Link}
              href={`/san-pham?danhMuc=${encodeURIComponent(item.danhMuc.slug)}`}
              fz={13}
              fw={500}
              c="dimmed"
            >
              {item.danhMuc.ten}
            </Anchor>
          ) : null}
          <Text fz={13} fw={700} c="agrimarket.7" lineClamp={1}>
            {item.ten}
          </Text>
        </Breadcrumbs>
      </AgriContainer>

      {/* Main Grid: Gallery bên trái + Thông tin & Mua hàng bên phải */}
      <AgriContainer pb={{ base: 28, md: 44 }}>
        <Paper p={{ base: 16, sm: 24, md: 32 }} radius="lg" withBorder className="pdp-main-card">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 44 }}>
            {/* ======================================================== */}
            {/* KHU VỰC GALLERY ẢNH SẢN PHẨM                              */}
            {/* ======================================================== */}
            <Stack gap="md">
              <Paper p={0} radius="lg" withBorder className="pdp-gallery-main">
                <Image
                  src={anhDangXem?.url ?? anhDuPhongSanPham(item.ten)}
                  alt={item.ten}
                  w="100%"
                  h="100%"
                  fit="contain"
                  fallbackSrc="/images/products/carot.jpg"
                />
              </Paper>

              {/* Dải thumbnail chuyển ảnh */}
              {anhSapXep.length > 1 ? (
                <SimpleGrid cols={{ base: 4, sm: 5 }} spacing="sm">
                  {anhSapXep.map((anh) => {
                    const dangChon = anh.url === (anhDangXem?.url ?? null);
                    return (
                      <UnstyledButton
                        key={`${anh.url}-${anh.thuTu}`}
                        onClick={() => setAnhDaChonUrl(anh.url)}
                        aria-label={`Xem ảnh ${anh.thuTu + 1}`}
                        className="pdp-thumb"
                        data-active={dangChon || undefined}
                      >
                        <Image src={anh.url} alt="" h="100%" w="100%" fit="cover" />
                      </UnstyledButton>
                    );
                  })}
                </SimpleGrid>
              ) : null}
            </Stack>

            {/* ======================================================== */}
            {/* KHU VỰC THÔNG TIN SẢN PHẨM & MUA HÀNG                     */}
            {/* ======================================================== */}
            <Stack gap="lg">
              {/* Badges, Tên & Trang trại */}
              <Stack gap="xs">
                <Group gap="xs" wrap="wrap">
                  {item.danhMuc ? <AgriBadge>{item.danhMuc.ten}</AgriBadge> : null}
                  {item.chungNhan.map((cn) => (
                    <AgriBadge key={`${cn.loai}-${cn.ma}`} loai="chung-nhan">
                      {cn.loai}
                    </AgriBadge>
                  ))}
                  <AgriBadge loai={conHang ? 'tuoi-moi' : 'canh-bao'}>
                    {conHang ? 'Còn hàng' : 'Tạm hết'}
                  </AgriBadge>
                </Group>

                <Title order={1} fz={{ base: 24, sm: 30, md: 34 }} fw={900} lh={1.2}>
                  {item.ten}
                </Title>

                {/* Đánh giá sao từ API thật — dùng Mantine Rating */}
                <Group gap={12} align="center" mt={2}>
                  {coDanhGia ? (
                    <Group gap={8} align="center">
                      <Rating
                        value={item.danhGia.diemTrungBinh ?? 0}
                        fractions={2}
                        readOnly
                        size="sm"
                      />
                      <Text fz={14} fw={750}>
                        {item.danhGia.diemTrungBinh?.toFixed(1)}
                      </Text>
                      <Text fz={13} c="dimmed">
                        ({item.danhGia.tongLuot} đánh giá)
                      </Text>
                    </Group>
                  ) : (
                    <Text fz={13} c="dimmed" fw={500}>
                      Chưa có đánh giá
                    </Text>
                  )}

                  <Text c="dimmed">·</Text>

                  {/* Trang trại liên kết */}
                  <Group gap={4} wrap="nowrap">
                    <ThemeIcon size={22} radius="md" variant="light" color="agrimarket">
                      <IconMapPin size={14} />
                    </ThemeIcon>
                    <Anchor
                      component={Link}
                      href={`/trang-trai/${item.trangTrai.id}`}
                      fz={13}
                      fw={650}
                      c="agrimarket.7"
                    >
                      {item.trangTrai.ten}
                    </Anchor>
                  </Group>
                </Group>
              </Stack>

              {/* Bảng giá theo biến thể */}
              <Paper withBorder p="md" radius="md" className="pdp-price-card">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Giá theo quy cách
                  </Text>
                  <Group gap={8} align="baseline" wrap="wrap">
                    <Text fz={{ base: 28, sm: 34 }} fw={900} c="agrimarket.7" lh={1}>
                      {bienTheDaChon
                        ? `${dinhDangGiaVND(bienTheDaChon.gia)} ₫`
                        : `${dinhDangGiaVND(item.gia.tu)} ₫`}
                    </Text>
                    {bienTheDaChon ? (
                      <Text fz={14} c="dimmed" fw={600}>
                        / {hienThiGoiQuyCach(bienTheDaChon)}
                      </Text>
                    ) : null}
                  </Group>

                  {item.gia.tu !== item.gia.den ? (
                    <Text size="xs" c="dimmed">
                      Khoảng giá {hienThiKhoangGia(item.gia.tu, item.gia.den)} tùy quy cách đóng gói.
                    </Text>
                  ) : null}
                </Stack>
              </Paper>

              {/* Bộ chọn biến thể quy cách */}
              <Stack gap={8}>
                <Group justify="space-between" align="center">
                  <Text fw={800} fz={14}>
                    Quy cách đóng gói:
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.bienThe.length} lựa chọn
                  </Text>
                </Group>

                <Group gap="sm" wrap="wrap">
                  {item.bienThe.map((bienThe) => {
                    const dangChon = bienThe.id === bienTheDaChon?.id;
                    const hetHang = bienThe.soLuongKhaDung <= 0;
                    return (
                      <Button
                        key={bienThe.id}
                        variant={dangChon ? 'filled' : 'default'}
                        color={dangChon ? 'agrimarket' : undefined}
                        disabled={hetHang}
                        onClick={() => {
                          setBienTheDaChonId(bienThe.id);
                          setSoLuongMua(1);
                          setGioHangMessage(null);
                        }}
                      >
                        {dinhDangQuyCachSanPham(bienThe)}
                        {hetHang ? ' (Hết)' : ''}
                      </Button>
                    );
                  })}
                </Group>
              </Stack>

              {/* Tồn khả dụng thực tế: số GÓI/quy cách, không phải g/kg */}
              <Group justify="space-between" align="center" p="sm" className="pdp-stock-row">
                <Group gap={8}>
                  <ThemeIcon size={28} radius="md" color={conHang ? 'agrimarket' : 'red'} variant="light">
                    <IconLeaf size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">
                    Tồn khả dụng:{' '}
                    <Text span fw={800} c={conHang ? 'agrimarket.7' : 'red.7'}>
                      {bienTheDaChon
                        ? conHang
                          ? hienThiTonKhaDung(soLuongKhaDung)
                          : 'Tạm hết hàng'
                        : item.khaDung.lyDo}
                    </Text>
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Kiểm kê kho theo quy cách đã chọn
                </Text>
              </Group>

              {/* Bộ chọn số lượng & Thao tác Mua / Giỏ hàng */}
              <Stack gap="md">
                <Group gap="md" align="flex-end" wrap="wrap">
                  {/* Điều khiển số lượng */}
                  <Stack gap={4}>
                    <Text size="xs" fw={700} c="dimmed">
                      Số lượng
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        size={38}
                        variant="default"
                        disabled={!conHang || soLuongMua <= 1}
                        onClick={() => setSoLuongMua((prev) => Math.max(1, prev - 1))}
                        aria-label="Giảm số lượng"
                      >
                        <IconMinus size={15} />
                      </ActionIcon>
                      <NumberInput
                        value={soLuongMua}
                        onChange={(val) => {
                          const n = typeof val === 'number' ? val : Number(val);
                          if (!Number.isNaN(n) && n >= 1) {
                            setSoLuongMua(Math.min(n, Math.max(1, soLuongKhaDung)));
                          }
                        }}
                        min={1}
                        max={Math.max(1, soLuongKhaDung)}
                        disabled={!conHang}
                        w={70}
                        size="sm"
                        hideControls
                        styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
                      />
                      <ActionIcon
                        size={38}
                        variant="default"
                        disabled={!conHang || soLuongMua >= soLuongKhaDung}
                        onClick={() => setSoLuongMua((prev) => Math.min(soLuongKhaDung, prev + 1))}
                        aria-label="Tăng số lượng"
                      >
                        <IconPlus size={15} />
                      </ActionIcon>
                    </Group>
                  </Stack>

                  {/* Nút Thêm vào giỏ */}
                  <Button
                    size="md"
                    color="agrimarket"
                    radius="md"
                    loading={dangThemGio}
                    disabled={!conHang}
                    leftSection={<IconShoppingCart size={18} />}
                    onClick={() => void themVaoGio()}
                    className="pdp-cta"
                  >
                    Thêm vào giỏ
                  </Button>

                  {/* Nút Mua ngay */}
                  <Button
                    size="md"
                    color="orange"
                    radius="md"
                    loading={dangMuaNgay}
                    disabled={!conHang}
                    onClick={() => void muaNgay()}
                    className="pdp-cta"
                  >
                    Mua ngay
                  </Button>

                  {/* Wishlist Button */}
                  <WishlistButton sanPhamId={item.id} />
                </Group>

                {/* Thông báo kết quả thao tác giỏ hàng */}
                {gioHangMessage ? (
                  <Alert
                    color={gioHangMessage.loai === 'success' ? 'green' : 'red'}
                    radius="md"
                    withCloseButton
                    onClose={() => setGioHangMessage(null)}
                  >
                    <Group justify="space-between" align="center">
                      <Text size="sm">{gioHangMessage.noiDung}</Text>
                      {gioHangMessage.loai === 'success' ? (
                        <Button component={Link} href="/gio-hang" size="xs" variant="light" color="agrimarket">
                          Xem giỏ hàng
                        </Button>
                      ) : null}
                    </Group>
                  </Alert>
                ) : null}
              </Stack>
            </Stack>
          </SimpleGrid>
        </Paper>
      </AgriContainer>

      {/* ======================================================== */}
      {/* KHỐI TRUY XUẤT NGUỒN GỐC NỔI BẬT                         */}
      {/* ======================================================== */}
      <AgriContainer mb={{ base: 28, md: 40 }}>
        <Paper p={{ base: 'md', sm: 'xl' }} radius="lg" withBorder className="pdp-trace-card">
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Stack gap={10} maw={660}>
              <Group gap={8}>
                <Badge color="agrimarket" variant="light" size="md" fw={800}>
                  Truy xuất nguồn gốc
                </Badge>
                <Text size="xs" c="dimmed">
                  Minh bạch chuỗi cung ứng nông sản
                </Text>
              </Group>
              <Title order={2} fz={{ base: 18, sm: 22 }} fw={850} c="agrimarket.8">
                Chuỗi dữ liệu canh tác và thu hoạch được kiểm định
              </Title>
              <Group gap="md" wrap="wrap" pt={4}>
                <Group gap={6} wrap="nowrap">
                  <ThemeIcon size={26} radius="md" variant="light" color="agrimarket">
                    <IconLeaf size={15} />
                  </ThemeIcon>
                  <Text fz={13} fw={700}>
                    Trang trại đối tác
                  </Text>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <ThemeIcon size={26} radius="md" variant="light" color="agrimarket">
                    <IconCalendarEvent size={15} />
                  </ThemeIcon>
                  <Text fz={13} fw={700}>
                    Mùa vụ thu hoạch
                  </Text>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <ThemeIcon size={26} radius="md" variant="light" color="agrimarket">
                    <IconCheck size={15} />
                  </ThemeIcon>
                  <Text fz={13} fw={700}>
                    Kiểm định chất lượng
                  </Text>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <ThemeIcon size={26} radius="md" variant="light" color="agrimarket">
                    <IconPackage size={15} />
                  </ThemeIcon>
                  <Text fz={13} fw={700}>
                    Mã lô sản phẩm
                  </Text>
                </Group>
              </Group>
              <Text fz={13} c="dimmed" lh={1.6}>
                Mỗi lô xuất kho có một mã truy xuất riêng in trên tem nhãn hoặc bao bì. Nhập
                hoặc quét mã trên bao bì để xem đầy đủ hồ sơ kiểm nghiệm thực tế.
              </Text>
            </Stack>

            <Button
              component={Link}
              href="/truy-xuat"
              size="md"
              color="agrimarket"
              leftSection={<IconQrcode size={18} />}
              radius="md"
            >
              Quét / Nhập mã truy xuất
            </Button>
          </Group>
        </Paper>
      </AgriContainer>

      {/* ======================================================== */}
      {/* TABS THÔNG TIN CHI TIẾT SẢN PHẨM                          */}
      {/* ======================================================== */}
      <AgriContainer mb={{ base: 36, md: 52 }}>
        <Paper p={{ base: 16, sm: 24 }} radius="lg" withBorder>
          <Tabs defaultValue="thong-tin" color="agrimarket" radius="md">
            <Tabs.List className="pdp-tabs-list">
              <Tabs.Tab value="thong-tin" leftSection={<IconInfoCircle size={17} />}>
                Thông tin sản phẩm
              </Tabs.Tab>
              <Tabs.Tab value="nguon-goc" leftSection={<IconPlant size={17} />}>
                Nguồn gốc & Thu hoạch
              </Tabs.Tab>
              <Tabs.Tab value="chung-nhan" leftSection={<IconShieldCheck size={17} />}>
                Chứng nhận ({item.chungNhan.length})
              </Tabs.Tab>
              <Tabs.Tab value="danh-gia" leftSection={<IconStar size={17} />}>
                Đánh giá ({item.danhGia?.tongLuot ?? 0})
              </Tabs.Tab>
            </Tabs.List>

            {/* TAB 1: THÔNG TIN SẢN PHẨM */}
            <Tabs.Panel value="thong-tin" pt="xl">
              <Stack gap="lg">
                <Text lh={1.8} className="pdp-description">
                  {item.moTa || 'Thông tin mô tả sản phẩm đang được cập nhật từ nhà cung cấp.'}
                </Text>

                <Divider />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper withBorder p="md" radius="md" className="pdp-info-tile">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Danh mục sản phẩm
                      </Text>
                      <Text fw={750}>{item.danhMuc?.ten ?? 'Đang cập nhật'}</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" className="pdp-info-tile">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Đơn vị tính chính
                      </Text>
                      <Text fw={750}>{item.quyCach?.donVi ?? 'kg'}</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" className="pdp-info-tile">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Số quy cách đóng gói
                      </Text>
                      <Text fw={750}>{item.bienThe.length} quy cách đóng gói</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" className="pdp-info-tile">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Khả năng đặt hàng
                      </Text>
                      <Text fw={750} c={item.khaDung.coTheDatHang ? 'green.8' : 'red.7'}>
                        {item.khaDung.coTheDatHang ? 'Sẵn sàng giao hàng' : item.khaDung.lyDo}
                      </Text>
                    </Stack>
                  </Paper>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            {/* TAB 2: NGUỒN GỐC & THU HOẠCH */}
            <Tabs.Panel value="nguon-goc" pt="xl">
              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                  {/* Trang trại */}
                  <Card withBorder radius="md" padding="lg">
                    <Stack gap="sm">
                      <Group gap={8}>
                        <ThemeIcon color="agrimarket" variant="light" size={32} radius="md">
                          <IconPlant size={18} />
                        </ThemeIcon>
                        <Text fw={800} fz={16}>
                          Trang trại canh tác
                        </Text>
                      </Group>
                      <Text fw={750} fz={17} c="agrimarket.7">
                        {item.trangTrai.ten}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Địa chỉ: {item.trangTrai.diaChi}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Mã trang trại: {item.trangTrai.ma}
                      </Text>
                      <Button
                        component={Link}
                        href={`/trang-trai/${item.trangTrai.id}`}
                        variant="subtle"
                        color="agrimarket"
                        size="xs"
                        px={0}
                        w="fit-content"
                        rightSection={<IconArrowRight size={14} />}
                      >
                        Xem chi tiết trang trại
                      </Button>
                    </Stack>
                  </Card>

                  {/* Thu hoạch gần nhất của lô đang bán */}
                  <Card withBorder radius="md" padding="lg">
                    <Stack gap="sm">
                      <Group gap={8}>
                        <ThemeIcon color="agrimarket" variant="light" size={32} radius="md">
                          <IconLeaf size={18} />
                        </ThemeIcon>
                        <Text fw={800} fz={16}>
                          Thu hoạch gần nhất của lô đang bán
                        </Text>
                      </Group>
                      {thuHoach ? (
                        <SimpleGrid cols={2} spacing="md" pt={4}>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700}>
                              Ngày thu hoạch
                            </Text>
                            <Text fw={750}>{thuHoach.ngayThuHoach}</Text>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700}>
                              Cây trồng
                            </Text>
                            <Text fw={750}>{thuHoach.cayTrong}</Text>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700}>
                              Giống
                            </Text>
                            <Text fw={750}>{thuHoach.giong}</Text>
                          </Stack>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700}>
                              Phân loại
                            </Text>
                            <Text fw={750}>{thuHoach.phanLoai}</Text>
                          </Stack>
                        </SimpleGrid>
                      ) : (
                        <Text size="sm" c="dimmed" pt={4}>
                          Sản phẩm này chưa gắn với lô thu hoạch cụ thể. Quét mã truy xuất trên
                          bao bì để xem nguồn gốc theo lô thực tế.
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            {/* TAB 3: CHỨNG NHẬN */}
            <Tabs.Panel value="chung-nhan" pt="xl">
              {item.chungNhan.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                  {item.chungNhan.map((cn) => (
                    <Card
                      key={`${cn.loai}-${cn.ma}`}
                      withBorder
                      radius="md"
                      p="lg"
                      className="pdp-cert-card"
                    >
                      <Stack gap={8}>
                        <Group justify="space-between" align="center">
                          <Text fw={800} fz={16} c="agrimarket.7">
                            {cn.loai}
                          </Text>
                          <Badge color="agrimarket" size="sm" variant="light">
                            Đã xác minh
                          </Badge>
                        </Group>
                        <Text size="sm">
                          <strong>Mã số:</strong> {cn.ma}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Đơn vị cấp: {cn.donViCap}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Hiệu lực đến: {cn.ngayHetHan}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  tieuDe="Chưa có chứng nhận được công khai"
                  moTa="Chỉ những chứng nhận nông sản đã được xác minh và còn hiệu lực mới được hiển thị tại đây."
                />
              )}
            </Tabs.Panel>

            {/* TAB 4: ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
            <Tabs.Panel value="danh-gia" pt="xl">
              <DanhGiaSanPham sanPhamId={item.id} />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </AgriContainer>

      {/* ======================================================== */}
      {/* THẺ THÔNG TIN TRANG TRẠI ĐỐI TÁC                         */}
      {/* ======================================================== */}
      <AgriContainer mb={{ base: 36, md: 52 }}>
        <Card withBorder className="agri-surface" padding="xl" radius="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={52} radius="lg" variant="light" color="agrimarket">
                <IconLeaf size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Group gap={8} align="center">
                  <Title order={3} fz={{ base: 17, sm: 20 }}>
                    {item.trangTrai.ten}
                  </Title>
                  <Badge color="agrimarket" variant="light" size="sm">
                    Đối tác xác thực
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm">
                  {item.trangTrai.diaChi}
                </Text>
              </Stack>
            </Group>
            <Group gap="sm">
              <Button
                component={Link}
                href={`/trang-trai/${item.trangTrai.id}`}
                color="agrimarket"
                radius="md"
              >
                Xem trang trại
              </Button>
              <Button
                component={Link}
                href={`/san-pham?trangTraiId=${encodeURIComponent(item.trangTrai.id)}`}
                variant="default"
                radius="md"
              >
                Sản phẩm cùng trang trại
              </Button>
            </Group>
          </Group>
        </Card>
      </AgriContainer>

      {/* ======================================================== */}
      {/* KHỐI SẢN PHẨM LIÊN QUAN TỪ API THẬT                      */}
      {/* ======================================================== */}
      <AgriContainer>
        <SectionHeading
          eyebrow="Gợi ý thêm"
          title="Sản phẩm tương tự"
          description="Nông sản cùng phân loại hoặc liên quan từ các trang trại công khai."
          action={
            item.danhMuc ? (
              <Button
                component={Link}
                href={`/san-pham?danhMuc=${encodeURIComponent(item.danhMuc.slug)}`}
                variant="subtle"
                color="agrimarket"
                rightSection={<IconArrowRight size={15} />}
              >
                Xem toàn bộ danh mục
              </Button>
            ) : null
          }
        />
        <Box mt="lg">
          {relatedPending ? (
            <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing="lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} h={340} radius="md" />
              ))}
            </SimpleGrid>
          ) : related.length > 0 ? (
            <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing="lg">
              {related.slice(0, 4).map((sp) => (
                <ProductCard
                  key={sp.id}
                  id={sp.id}
                  ten={sp.ten}
                  tenTrangTrai={sp.trangTrai.ten}
                  giaTu={sp.gia.tu}
                  giaDen={sp.gia.den}
                  donVi={sp.quyCach?.donVi ?? 'kg'}
                  khoiLuong={sp.quyCach?.khoiLuong ?? null}
                  href={`/san-pham/${sp.id}`}
                  anhUrl={sp.anhBiaUrl ?? undefined}
                  badges={sp.chungNhan}
                  conHang={sp.khaDung.coTheDatHang}
                  danhGia={sp.danhGia?.diemTrungBinh}
                  soDanhGia={sp.danhGia?.tongLuot}
                />
              ))}
            </SimpleGrid>
          ) : (
            <EmptyState
              tieuDe="Chưa có sản phẩm liên quan"
              moTa="Hiện chưa có thêm sản phẩm cùng loại để gợi ý."
            />
          )}
        </Box>
      </AgriContainer>

      {/* ======================================================== */}
      {/* MOBILE STICKY ACTION BAR — dùng Mantine Affix             */}
      {/* ======================================================== */}
      <Affix position={{ bottom: 0, left: 0, right: 0 }} zIndex={99} hiddenFrom="sm">
        <Box bg="white" p="sm" className="pdp-mobile-bar">
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Stack gap={0}>
              <Text size="xs" c="dimmed">
                Giá / {bienTheDaChon ? hienThiGoiQuyCach(bienTheDaChon) : 'quy cách'}
              </Text>
              <Text fw={900} fz={17} c="agrimarket.7" lh={1.1}>
                {bienTheDaChon
                  ? `${dinhDangGiaVND(bienTheDaChon.gia)} ₫`
                  : `${dinhDangGiaVND(item.gia.tu)} ₫`}
              </Text>
            </Stack>
            <Group gap={8} wrap="nowrap">
              <Button
                size="sm"
                color="agrimarket"
                loading={dangThemGio}
                disabled={!conHang}
                onClick={() => void themVaoGio()}
              >
                Thêm giỏ
              </Button>
              <Button
                size="sm"
                color="orange"
                loading={dangMuaNgay}
                disabled={!conHang}
                onClick={() => void muaNgay()}
              >
                Mua ngay
              </Button>
            </Group>
          </Group>
        </Box>
      </Affix>
    </Box>
  );
}
