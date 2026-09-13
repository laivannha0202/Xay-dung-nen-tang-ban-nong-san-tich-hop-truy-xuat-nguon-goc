'use client';

import {
  dinhDangQuyCachSanPham,
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Image,
  NumberInput,
  Paper,
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
  IconChevronRight,
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
  IconStarFilled,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { themMucGioHangKhach } from '@/lib/api-gio-hang';
import { anhDuPhongSanPham } from '@/lib/demo-images';
import { coPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { DanhGiaSanPham } from './danh-gia-san-pham';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';
import { SectionHeading } from './web-page';
import { WishlistButton } from './wishlist-button';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

function dinhDangSoLuong(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value);
}

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
        noiDung: `Đã thêm ${soLuongMua} ${bienTheDaChon.donVi} vào giỏ hàng thành công.`,
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
    <Box className="agri-page" bg="#f8faf8" pb={{ base: 80, sm: 48 }}>
      {/* Breadcrumb phân cấp */}
      <AgriContainer py={{ base: 16, md: 22 }}>
        <Group gap={6} align="center" wrap="wrap">
          <Link
            href="/"
            style={{ textDecoration: 'none', color: '#68766D', fontSize: 13, fontWeight: 500 }}
          >
            Trang chủ
          </Link>
          <IconChevronRight size={14} color="#94a3b8" />
          <Link
            href="/san-pham"
            style={{ textDecoration: 'none', color: '#68766D', fontSize: 13, fontWeight: 500 }}
          >
            Nông sản
          </Link>
          {item.danhMuc ? (
            <>
              <IconChevronRight size={14} color="#94a3b8" />
              <Link
                href={`/san-pham?danhMuc=${encodeURIComponent(item.danhMuc.slug)}`}
                style={{ textDecoration: 'none', color: '#68766D', fontSize: 13, fontWeight: 500 }}
              >
                {item.danhMuc.ten}
              </Link>
            </>
          ) : null}
          <IconChevronRight size={14} color="#94a3b8" />
          <Text fz={13} fw={700} c="#0B7A48" lineClamp={1}>
            {item.ten}
          </Text>
        </Group>
      </AgriContainer>

      {/* Main Grid: Gallery bên trái + Thông tin & Mua hàng bên phải */}
      <AgriContainer pb={{ base: 28, md: 44 }}>
        <Paper
          p={{ base: 16, sm: 24, md: 32 }}
          radius="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2eae4',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 44 }}>
            {/* ======================================================== */}
            {/* KHU VỰC GALLERY ẢNH SẢN PHẨM                              */}
            {/* ======================================================== */}
            <Stack gap="md">
              <Paper
                p={0}
                radius="lg"
                style={{
                  overflow: 'hidden',
                  backgroundColor: '#f1f5f2',
                  border: '1px solid #e3ede5',
                  aspectRatio: '1 / 1',
                  maxHeight: 520,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src={anhDangXem?.url ?? anhDuPhongSanPham(item.ten)}
                  alt={item.ten}
                  w="100%"
                  h="100%"
                  fit="contain"
                  style={{ maxHeight: 520 }}
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
                        style={{
                          border: dangChon ? '2.5px solid #0B7A48' : '1px solid #DCE6DF',
                          borderRadius: 10,
                          overflow: 'hidden',
                          boxShadow: dangChon ? '0 0 0 3px rgba(11,122,72,.15)' : 'none',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#f8faf8',
                        }}
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

                <Title order={1} fz={{ base: 24, sm: 30, md: 34 }} fw={900} lh={1.2} c="#1e293b">
                  {item.ten}
                </Title>

                {/* Đánh giá sao từ API thật */}
                <Group gap={12} align="center" mt={2}>
                  {coDanhGia ? (
                    <Group gap={6} align="center">
                      <Group gap={2}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconStarFilled
                            key={star}
                            size={16}
                            color={star <= Math.round(item.danhGia.diemTrungBinh ?? 0) ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                      </Group>
                      <Text fz={14} fw={750} c="#1e293b">
                        {item.danhGia.diemTrungBinh?.toFixed(1)}
                      </Text>
                      <Text fz={13} c="#64748b">
                        ({item.danhGia.tongLuot} đánh giá)
                      </Text>
                    </Group>
                  ) : (
                    <Text fz={13} c="#94a3b8" fw={500}>
                      Chưa có đánh giá
                    </Text>
                  )}

                  <Text c="dimmed">·</Text>

                  {/* Trang trại liên kết */}
                  <Group gap={4} wrap="nowrap">
                    <IconMapPin size={15} color="#0B7A48" />
                    <Link
                      href={`/trang-trai/${item.trangTrai.id}`}
                      style={{
                        textDecoration: 'none',
                        color: '#0B7A48',
                        fontWeight: 650,
                        fontSize: 13,
                      }}
                    >
                      {item.trangTrai.ten}
                    </Link>
                  </Group>
                </Group>
              </Stack>

              {/* Bảng giá theo biến thể */}
              <Paper
                withBorder
                p="md"
                radius="md"
                style={{
                  backgroundColor: '#f6faf7',
                  borderColor: '#d2e7d8',
                }}
              >
                <Stack gap={4}>
                  <Text size="xs" c="#68766D" fw={700} style={{ letterSpacing: '0.4px' }}>
                    GIÁ THEO QUY CÁCH
                  </Text>
                  <Group gap={10} align="baseline">
                    <Text fz={{ base: 28, sm: 34 }} fw={900} c="#0B7A48" lh={1}>
                      {bienTheDaChon ? `${dinhDangGia(bienTheDaChon.gia)} ₫` : `${dinhDangGia(item.gia.tu)} ₫`}
                    </Text>
                    {bienTheDaChon ? (
                      <Text fz={14} c="#475569" fw={600}>
                        /{bienTheDaChon.donVi}
                      </Text>
                    ) : null}
                  </Group>

                  {bienTheDaChon ? (
                    <Group gap={6} mt={2}>
                      <IconPackage size={16} color="#0B7A48" />
                      <Text size="sm" fw={750} c="#0B7A48">
                        Đóng gói: {dinhDangQuyCachSanPham(bienTheDaChon)}
                      </Text>
                    </Group>
                  ) : null}

                  {item.gia.tu !== item.gia.den ? (
                    <Text size="xs" c="dimmed">
                      Khoảng giá {dinhDangGia(item.gia.tu)} – {dinhDangGia(item.gia.den)} ₫ tùy quy cách đóng gói.
                    </Text>
                  ) : null}
                </Stack>
              </Paper>

              {/* Bộ chọn biến thể quy cách */}
              <Stack gap={8}>
                <Group justify="space-between" align="center">
                  <Text fw={800} fz={14} c="#1e293b">
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
                        style={{
                          borderColor: dangChon ? '#0B7A48' : '#d1dad4',
                          fontWeight: dangChon ? 750 : 600,
                        }}
                      >
                        {dinhDangQuyCachSanPham(bienThe)}
                        {hetHang ? ' (Hết)' : ''}
                      </Button>
                    );
                  })}
                </Group>
              </Stack>

              {/* Tồn khả dụng thực tế */}
              <Group justify="space-between" align="center" p="sm" bg="#fafcfb" style={{ borderRadius: 8 }}>
                <Group gap={8}>
                  <ThemeIcon size={28} radius="md" color={conHang ? 'green' : 'red'} variant="light">
                    <IconLeaf size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="#475569">
                    Tồn khả dụng:{' '}
                    <strong style={{ color: conHang ? '#0B7A48' : '#dc2626' }}>
                      {bienTheDaChon
                        ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} ${bienTheDaChon.donVi}`
                        : item.khaDung.lyDo}
                    </strong>
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Kiểm định kho thời gian thực
                </Text>
              </Group>

              {/* Bộ chọn số lượng & Thao tác Mua / Giỏ hàng */}
              <Stack gap="md">
                <Group gap="md" align="flex-end" wrap="wrap">
                  {/* Điều khiển số lượng */}
                  <Stack gap={4}>
                    <Text size="xs" fw={700} c="#475569">
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
                    style={{ flex: '1 1 150px' }}
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
                    style={{ flex: '1 1 130px' }}
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
                        <Button component={Link} href="/gio-hang" size="xs" variant="light" color="green">
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
        <Paper
          p={{ base: 'md', sm: 'xl' }}
          radius="lg"
          style={{
            background: 'linear-gradient(135deg, #f1f8f3 0%, #e6f4ea 100%)',
            border: '1.5px solid #cbe7d4',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Stack gap={8} style={{ maxWidth: 660 }}>
              <Group gap={8}>
                <Badge color="green" size="md" radius="sm" fw={800}>
                  TRUY XUẤT NGUỒN GỐC
                </Badge>
                <Text size="xs" c="dimmed">
                  Minh bạch chuỗi cung ứng nông sản
                </Text>
              </Group>
              <Title order={2} fz={{ base: 18, sm: 22 }} fw={850} c="#0B7A48">
                Chuỗi dữ liệu canh tác & thu hoạch được kiểm định
              </Title>
              <Group gap={14} wrap="wrap" pt={4}>
                <Text fz={13} fw={700} c="#1e293b">
                  🌱 Trang trại đối tác
                </Text>
                <Text c="dimmed">·</Text>
                <Text fz={13} fw={700} c="#1e293b">
                  🌾 Mùa vụ thu hoạch
                </Text>
                <Text c="dimmed">·</Text>
                <Text fz={13} fw={700} c="#1e293b">
                  ✓ Kiểm định chất lượng
                </Text>
                <Text c="dimmed">·</Text>
                <Text fz={13} fw={700} c="#1e293b">
                  📦 Mã lô sản phẩm
                </Text>
              </Group>
              <Text fz={12.5} c="#475569" lh={1.55}>
                * Lưu ý: Mỗi lô nông sản xuất kho có một mã truy xuất riêng in trên tem nhãn hoặc bao bì kiện hàng. Vui lòng nhập hoặc quét mã trên bao bì để xem đầy đủ hồ sơ kiểm nghiệm thực tế.
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
        <Paper
          p={{ base: 16, sm: 24 }}
          radius="lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2eae4',
          }}
        >
          <Tabs defaultValue="thong-tin" color="green" radius="md">
            <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
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
                <Text lh={1.8} c="#334155" style={{ whiteSpace: 'pre-line' }}>
                  {item.moTa || 'Thông tin mô tả sản phẩm đang được cập nhật từ nhà cung cấp.'}
                </Text>

                <Divider color="#e8efe9" />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper withBorder p="md" radius="md" bg="#fafcfb">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700}>
                        DANH MỤC SẢN PHẨM
                      </Text>
                      <Text fw={750}>{item.danhMuc?.ten ?? 'Đang cập nhật'}</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="#fafcfb">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700}>
                        ĐƠN VỊ TÍNH CHÍNH
                      </Text>
                      <Text fw={750}>{item.quyCach?.donVi ?? 'kg'}</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="#fafcfb">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700}>
                        SỐ QUY CÁCH ĐÓNG GÓI
                      </Text>
                      <Text fw={750}>{item.bienThe.length} loại biến thể</Text>
                    </Stack>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="#fafcfb">
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={700}>
                        KHẢ NĂNG ĐẶT HÀNG
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
                        <ThemeIcon color="green" variant="light" size={32} radius="md">
                          <IconPlant size={18} />
                        </ThemeIcon>
                        <Text fw={800} fz={16}>
                          Trang trại canh tác
                        </Text>
                      </Group>
                      <Text fw={750} fz={17} c="#0B7A48">
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
                      >
                        Xem chi tiết trang trại →
                      </Button>
                    </Stack>
                  </Card>

                  {/* Thu hoạch gần nhất */}
                  <Card withBorder radius="md" padding="lg">
                    <Stack gap="sm">
                      <Group gap={8}>
                        <ThemeIcon color="green" variant="light" size={32} radius="md">
                          <IconLeaf size={18} />
                        </ThemeIcon>
                        <Text fw={800} fz={16}>
                          Thu hoạch gần nhất tại trang trại
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
                          Trang trại chưa cập nhật dữ liệu thu hoạch gần nhất cho sản phẩm này.
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
                      style={{ borderTop: '3px solid #0B7A48' }}
                    >
                      <Stack gap={8}>
                        <Group justify="space-between" align="center">
                          <Text fw={800} fz={16} c="#0B7A48">
                            {cn.loai}
                          </Text>
                          <Badge color="green" size="sm" variant="light">
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
                  tieuDe="Chưa có chứng nhận công khai"
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
                  <Badge color="green" variant="light" size="sm">
                    Đối tác xác thực
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm">
                  {item.trangTrai.diaChi}
                </Text>
                <Text size="xs" c="dimmed">
                  Mã định danh trang trại: {item.trangTrai.ma}
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
              >
                Xem toàn bộ danh mục →
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
      {/* MOBILE STICKY ACTION BAR (CỐ ĐỊNH CHÂN MÀN HÌNH MOBILE)   */}
      {/* ======================================================== */}
      <Box
        hiddenFrom="sm"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        p="sm"
        style={{
          borderTop: '1px solid #e2eae4',
          zIndex: 99,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Stack gap={0}>
            <Text size="10px" c="dimmed">
              Đơn giá ({bienTheDaChon?.donVi ?? 'đơn vị'})
            </Text>
            <Text fw={900} fz={17} c="#0B7A48" lh={1.1}>
              {bienTheDaChon ? `${dinhDangGia(bienTheDaChon.gia)} ₫` : `${dinhDangGia(item.gia.tu)} ₫`}
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
    </Box>
  );
}
