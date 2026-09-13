'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Image,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconAdjustments,
  IconArrowsSort,
  IconCertificate,
  IconChevronLeft,
  IconChevronRight,
  IconCoin,
  IconDiscountCheck,
  IconFilter,
  IconLayoutGrid,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import {
  BoLocSanPhamState,
  MOCKUP_PRODUCTS,
  MockupProduct,
  locSanPhamMockup,
} from '@/lib/mockup-products-data';
import { AgriContainer } from './agri-container';
import { EmptyState } from './empty-state';
import { ProductCard } from './product-card';

/** Map slug ?category= trên URL (từ trang chủ) sang nhãn danh mục mockup. */
function nhanDanhMucTuSlug(slug: string | null): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase().trim();
  if (['rau-cu', 'rau_cu', 'rau cu'].includes(s)) return 'Rau củ';
  if (['trai-cay', 'trai_cay', 'trái cây', 'trai cay'].includes(s)) return 'Trái cây';
  if (['gao', 'gao-ngu-coc', 'gạo'].includes(s)) return 'Gạo';
  if (['dac-san', 'dac_san', 'đặc sản', 'dac san'].includes(s)) return 'Đặc sản';
  return null;
}

/** Map ?certificate= / ?chungNhan= trên URL sang nhãn chứng nhận mockup. */
function nhanChungNhanTuSlug(slug: string | null): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase().trim();
  if (s.includes('vietgap') || s.includes('viet-gap')) return 'VietGAP';
  if (s.includes('ocop')) return 'OCOP';
  if (s.includes('huu-co') || s.includes('huuco') || s.includes('hữu cơ') || s.includes('organic'))
    return 'Hữu cơ';
  if (s === 'vietgap' || s === 'ocop' || s === 'hữu cơ') return slug;
  return null;
}

function chuanHoaTimKiem(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function DanhSachSanPhamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tham số từ URL (do trang chủ truyền sang):
  // /san-pham?category=rau-cu | ?certificate=vietgap | ?q=... | ?farm=... | ?sapXep=...
  const categorySlug = searchParams.get('category') ?? searchParams.get('danhMuc');
  const certificateSlug =
    searchParams.get('certificate') ??
    searchParams.get('chungNhan') ??
    searchParams.get('chung-nhan');
  const tuKhoaUrl = (searchParams.get('q') ?? searchParams.get('timKiem') ?? '').trim();
  const farmIdUrl =
    searchParams.get('farm') ?? searchParams.get('trangTraiId') ?? searchParams.get('trang-trai');
  const sapXepUrl = searchParams.get('sapXep') ?? searchParams.get('sort');

  // Bộ lọc sidebar — khởi tạo từ URL để "Xem tất cả" mang filter hoạt động đúng.
  const [danhMucChon, setDanhMucChon] = useState<string[]>(() => {
    const nhan = nhanDanhMucTuSlug(categorySlug);
    if (categorySlug && !nhan) return [];
    return nhan ? [nhan] : [];
  });
  const [mucGiaChon, setMucGiaChon] = useState<string[]>([]);
  const [khuVucChon, setKhuVucChon] = useState<string[]>([]);
  const [chungNhanChon, setChungNhanChon] = useState<string[]>(() => {
    const nhan = nhanChungNhanTuSlug(certificateSlug);
    return nhan ? [nhan] : [];
  });
  const [sapXepChon, setSapXepChon] = useState<string>(() => {
    const s = (sapXepUrl ?? '').toUpperCase();
    return ['MOI_NHAT', 'GIA_TANG', 'GIA_GIAM', 'DANH_GIA'].includes(s) ? s : 'MOI_NHAT';
  });

  // Đồng bộ lại khi URL đổi (bấm tab khác ở trang chủ rồi sang đây).
  useEffect(() => {
    const nhanDm = nhanDanhMucTuSlug(categorySlug);
    if (categorySlug && !nhanDm) {
      setDanhMucChon([]);
    } else if (nhanDm) {
      setDanhMucChon([nhanDm]);
    } else if (!categorySlug) {
      setDanhMucChon([]);
    }
    const nhanCn = nhanChungNhanTuSlug(certificateSlug);
    setChungNhanChon(nhanCn ? [nhanCn] : []);
    if (sapXepUrl) {
      const s = sapXepUrl.toUpperCase();
      if (['MOI_NHAT', 'GIA_TANG', 'GIA_GIAM', 'DANH_GIA'].includes(s)) setSapXepChon(s);
    }
    setTrangHienTai(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, certificateSlug, sapXepUrl]);

  // Trạng thái phân trang
  const [trangHienTai, setTrangHienTai] = useState(1);

  // Trạng thái modal truy xuất QR
  const [sanPhamTruyXuat, setSanPhamTruyXuat] = useState<MockupProduct | null>(null);

  // Toggle checkbox helper
  function toggleGiaTri(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  // Lọc sản phẩm
  const boLocHienTai: BoLocSanPhamState = useMemo(
    () => ({
      danhMuc: danhMucChon,
      mucGia: mucGiaChon,
      khuVuc: khuVucChon,
      chungNhan: chungNhanChon,
      sapXep: sapXepChon,
    }),
    [danhMucChon, mucGiaChon, khuVucChon, chungNhanChon, sapXepChon],
  );

  // Query API thật (ưu tiên). Khi có dữ liệu thật thì hiển thị dữ liệu thật,
  // kèm đúng id để click card đi tới /san-pham/{id}.
  const sapXepApi = (['MOI_NHAT', 'GIA_TANG', 'GIA_GIAM'].includes(sapXepChon)
    ? sapXepChon
    : 'MOI_NHAT') as 'MOI_NHAT' | 'GIA_TANG' | 'GIA_GIAM';
  const sanPhamApiQuery = useLayDanhSachSanPhamCongKhai({
    trang: trangHienTai,
    gioiHan: 8,
    timKiem: tuKhoaUrl || undefined,
    danhMuc: categorySlug && categorySlug !== 'tat-ca' ? categorySlug : undefined,
    trangTraiId: farmIdUrl || undefined,
    chungNhan: certificateSlug || undefined,
    sapXep: sapXepApi,
  });
  const duLieuApi = useMemo(
    () => sanPhamApiQuery.data?.data?.duLieu ?? [],
    [sanPhamApiQuery.data],
  );
  const tongApi = sanPhamApiQuery.data?.data?.tong ?? 0;
  const dangTaiApi = sanPhamApiQuery.isPending;
  const coDuLieuApi = duLieuApi.length > 0;

  // Danh sách mockup sau lọc (fallback khi chưa có API / API trống).
  const sanPhamMockupDaLoc = useMemo(() => {
    let ketQua = locSanPhamMockup(MOCKUP_PRODUCTS, boLocHienTai);
    if (tuKhoaUrl) {
      const tk = chuanHoaTimKiem(tuKhoaUrl);
      ketQua = ketQua.filter((sp) => chuanHoaTimKiem(sp.ten).includes(tk));
    }
    // Slug danh mục lạ (vd thit-trung, thuy-san) chưa có trong mockup:
    // giữ kết quả rỗng để hiển thị EmptyState trung thực thay vì tự trả về tất cả.
    return ketQua;
  }, [boLocHienTai, tuKhoaUrl]);

  // Áp dụng bộ lọc (khi bấm nút Áp dụng)
  function apDungBoLoc() {
    setTrangHienTai(1);
  }

  function xoaBoLoc() {
    setDanhMucChon([]);
    setMucGiaChon([]);
    setKhuVucChon([]);
    setChungNhanChon([]);
    setSapXepChon('MOI_NHAT');
    setTrangHienTai(1);
    router.push('/san-pham');
  }

  // Phân trang cho mockup (8 / trang).
  const KICH_THUOC_TRANG = 8;
  const tongTrangMockup = Math.max(1, Math.ceil(sanPhamMockupDaLoc.length / KICH_THUOC_TRANG));
  const trangMockupHienTai = Math.min(trangHienTai, tongTrangMockup);
  const sanPhamMockupHienThi = useMemo(
    () =>
      sanPhamMockupDaLoc.slice(
        (trangMockupHienTai - 1) * KICH_THUOC_TRANG,
        trangMockupHienTai * KICH_THUOC_TRANG,
      ),
    [sanPhamMockupDaLoc, trangMockupHienTai],
  );
  const tongTrangHienThi = coDuLieuApi
    ? Math.max(1, Math.ceil(tongApi / 8))
    : tongTrangMockup;
  const soLuongHienThi = coDuLieuApi ? tongApi : sanPhamMockupDaLoc.length;

  return (
    <Box bg="#f8faf8" py={{ base: 20, md: 32 }} style={{ minHeight: 'calc(100vh - 120px)' }}>
      <AgriContainer>
        {/* Layout 2 cột: Sidebar bên trái (240px) + Danh sách bên phải */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(230px, 240px) 1fr',
            gap: 24,
            alignItems: 'start',
          }}
          className="mockup-page-grid"
        >
          {/* ======================================================== */}
          {/* CỘT TRÁI: BỘ LỌC SẢN PHẨM                                */}
          {/* ======================================================== */}
          <Paper
            p={18}
            radius="md"
            style={{
              backgroundColor: '#f6f9f6',
              border: '1px solid #e3ede5',
              borderRadius: 12,
              boxShadow: '0 1px 4px rgba(24, 106, 62, 0.04)',
            }}
          >
            <Stack gap={16}>
              {/* Tiêu đề Bộ lọc sản phẩm */}
              <Group gap={8} align="center">
                <IconFilter size={20} color="#186a3e" stroke={2.2} />
                <Text fw={800} fz={17} c="#186a3e" style={{ letterSpacing: '-0.2px' }}>
                  Bộ lọc sản phẩm
                </Text>
              </Group>

              <Divider color="#e3ede5" />

              {/* 1. Nhóm Danh mục */}
              <Stack gap={10}>
                <Group gap={6} align="center">
                  <IconLayoutGrid size={16} color="#186a3e" stroke={2} />
                  <Text fw={750} fz={14} c="#186a3e">
                    Danh mục
                  </Text>
                </Group>
                <Stack gap={8} pl={4}>
                  <Checkbox
                    label="Rau củ (12)"
                    checked={danhMucChon.includes('Rau củ')}
                    onChange={() => setDanhMucChon(toggleGiaTri(danhMucChon, 'Rau củ'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Trái cây (18)"
                    checked={danhMucChon.includes('Trái cây')}
                    onChange={() => setDanhMucChon(toggleGiaTri(danhMucChon, 'Trái cây'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Gạo (6)"
                    checked={danhMucChon.includes('Gạo')}
                    onChange={() => setDanhMucChon(toggleGiaTri(danhMucChon, 'Gạo'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Đặc sản (9)"
                    checked={danhMucChon.includes('Đặc sản')}
                    onChange={() => setDanhMucChon(toggleGiaTri(danhMucChon, 'Đặc sản'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                </Stack>
              </Stack>

              <Divider color="#e3ede5" />

              {/* 2. Nhóm Mức giá */}
              <Stack gap={10}>
                <Group gap={6} align="center">
                  <IconCoin size={16} color="#186a3e" stroke={2} />
                  <Text fw={750} fz={14} c="#186a3e">
                    Mức giá
                  </Text>
                </Group>
                <Stack gap={8} pl={4}>
                  <Checkbox
                    label="Dưới 50.000đ"
                    checked={mucGiaChon.includes('DUOI_50K')}
                    onChange={() => setMucGiaChon(toggleGiaTri(mucGiaChon, 'DUOI_50K'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="50.000đ - 100.000đ"
                    checked={mucGiaChon.includes('50K_100K')}
                    onChange={() => setMucGiaChon(toggleGiaTri(mucGiaChon, '50K_100K'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="100.000đ - 200.000đ"
                    checked={mucGiaChon.includes('100K_200K')}
                    onChange={() => setMucGiaChon(toggleGiaTri(mucGiaChon, '100K_200K'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Trên 200.000đ"
                    checked={mucGiaChon.includes('TREN_200K')}
                    onChange={() => setMucGiaChon(toggleGiaTri(mucGiaChon, 'TREN_200K'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                </Stack>
              </Stack>

              <Divider color="#e3ede5" />

              {/* 3. Nhóm Khu vực */}
              <Stack gap={10}>
                <Group gap={6} align="center">
                  <IconMapPin size={16} color="#186a3e" stroke={2} />
                  <Text fw={750} fz={14} c="#186a3e">
                    Khu vực
                  </Text>
                </Group>
                <Stack gap={8} pl={4}>
                  <Checkbox
                    label="Sơn La"
                    checked={khuVucChon.includes('Sơn La')}
                    onChange={() => setKhuVucChon(toggleGiaTri(khuVucChon, 'Sơn La'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Đà Lạt"
                    checked={khuVucChon.includes('Đà Lạt')}
                    onChange={() => setKhuVucChon(toggleGiaTri(khuVucChon, 'Đà Lạt'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Tiền Giang"
                    checked={khuVucChon.includes('Tiền Giang')}
                    onChange={() => setKhuVucChon(toggleGiaTri(khuVucChon, 'Tiền Giang'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Bến Tre"
                    checked={khuVucChon.includes('Bến Tre')}
                    onChange={() => setKhuVucChon(toggleGiaTri(khuVucChon, 'Bến Tre'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Khác"
                    checked={khuVucChon.includes('Khác')}
                    onChange={() => setKhuVucChon(toggleGiaTri(khuVucChon, 'Khác'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                </Stack>
              </Stack>

              <Divider color="#e3ede5" />

              {/* 4. Nhóm Chứng nhận */}
              <Stack gap={10}>
                <Group gap={6} align="center">
                  <IconShieldCheck size={16} color="#186a3e" stroke={2} />
                  <Text fw={750} fz={14} c="#186a3e">
                    Chứng nhận
                  </Text>
                </Group>
                <Stack gap={8} pl={4}>
                  <Checkbox
                    label="VietGAP"
                    checked={chungNhanChon.includes('VietGAP')}
                    onChange={() => setChungNhanChon(toggleGiaTri(chungNhanChon, 'VietGAP'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="OCOP"
                    checked={chungNhanChon.includes('OCOP')}
                    onChange={() => setChungNhanChon(toggleGiaTri(chungNhanChon, 'OCOP'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                  <Checkbox
                    label="Hữu cơ"
                    checked={chungNhanChon.includes('Hữu cơ')}
                    onChange={() => setChungNhanChon(toggleGiaTri(chungNhanChon, 'Hữu cơ'))}
                    color="#186a3e"
                    styles={{ label: { fontSize: 13, color: '#334155', cursor: 'pointer' } }}
                  />
                </Stack>
              </Stack>

              <Divider color="#e3ede5" />

              {/* 5. Nhóm Sắp xếp trong sidebar */}
              <Stack gap={10}>
                <Group gap={6} align="center">
                  <IconArrowsSort size={16} color="#186a3e" stroke={2} />
                  <Text fw={750} fz={14} c="#186a3e">
                    Sắp xếp
                  </Text>
                </Group>
                <Select
                  value={sapXepChon}
                  onChange={(val) => setSapXepChon(val || 'MOI_NHAT')}
                  data={[
                    { value: 'MOI_NHAT', label: 'Mới nhất' },
                    { value: 'GIA_TANG', label: 'Giá thấp đến cao' },
                    { value: 'GIA_GIAM', label: 'Giá cao đến thấp' },
                    { value: 'DANH_GIA', label: 'Đánh giá cao nhất' },
                  ]}
                  radius="sm"
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      fontSize: 13,
                      height: 38,
                    },
                  }}
                />
              </Stack>

              {/* Nút Áp dụng bộ lọc full-width */}
              <Button
                fullWidth
                h={42}
                radius="sm"
                onClick={apDungBoLoc}
                leftSection={<IconFilter size={16} />}
                style={{
                  backgroundColor: '#186a3e',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  marginTop: 6,
                }}
              >
                Áp dụng
              </Button>
            </Stack>
          </Paper>

          {/* ======================================================== */}
          {/* CỘT PHẢI: LƯỚI SẢN PHẨM, BANNER & PHÂN TRANG             */}
          {/* ======================================================== */}
          <Stack gap={18} style={{ minWidth: 0 }}>
            {/* Thanh trên cùng: Đếm sản phẩm & Sắp xếp theo */}
            <Group justify="space-between" align="center" wrap="wrap">
              <Stack gap={6}>
                <Text fw={600} fz={14} c="#334155">
                  {dangTaiApi
                    ? 'Đang tải sản phẩm…'
                    : `Hiển thị ${coDuLieuApi ? duLieuApi.length : sanPhamMockupHienThi.length}/${soLuongHienThi} sản phẩm`}
                </Text>
                {(categorySlug && categorySlug !== 'tat-ca') ||
                certificateSlug ||
                tuKhoaUrl ||
                farmIdUrl ? (
                  <Group gap={6} wrap="wrap">
                    {categorySlug && categorySlug !== 'tat-ca' ? (
                      <Badge color="#186a3e" variant="light" radius="xl">
                        Danh mục: {categorySlug}
                      </Badge>
                    ) : null}
                    {certificateSlug ? (
                      <Badge color="#186a3e" variant="light" radius="xl">
                        Chứng nhận: {certificateSlug}
                      </Badge>
                    ) : null}
                    {tuKhoaUrl ? (
                      <Badge color="#186a3e" variant="light" radius="xl">
                        Tìm: {tuKhoaUrl}
                      </Badge>
                    ) : null}
                    {farmIdUrl ? (
                      <Badge color="#186a3e" variant="light" radius="xl">
                        Trang trại
                      </Badge>
                    ) : null}
                    <Button size="compact-xs" variant="subtle" color="#186a3e" onClick={xoaBoLoc}>
                      Xóa lọc
                    </Button>
                  </Group>
                ) : null}
              </Stack>

              <Group gap={8} align="center">
                <Text fz={13} c="#475569" fw={500}>
                  Sắp xếp theo:
                </Text>
                <Select
                  value={sapXepChon}
                  onChange={(val) => setSapXepChon(val || 'MOI_NHAT')}
                  data={[
                    { value: 'MOI_NHAT', label: 'Mới nhất' },
                    { value: 'GIA_TANG', label: 'Giá thấp đến cao' },
                    { value: 'GIA_GIAM', label: 'Giá cao đến thấp' },
                    { value: 'DANH_GIA', label: 'Đánh giá cao nhất' },
                  ]}
                  w={130}
                  radius="sm"
                  styles={{
                    input: {
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      fontSize: 13,
                      height: 34,
                      minHeight: 34,
                    },
                  }}
                />
              </Group>
            </Group>

            {/* LƯỚI 4 CỘT: click card -> /san-pham/{id} (xem ProductCard href) */}
            {dangTaiApi ? (
              <Text fz={13} c="#64748b">
                Đang tải danh sách nông sản…
              </Text>
            ) : coDuLieuApi ? (
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing={14}>
                {duLieuApi.map((sp) => (
                  <ProductCard
                    key={sp.id}
                    id={sp.id}
                    ten={sp.ten}
                    anhUrl={sp.anhBiaUrl ?? undefined}
                    chungNhan={sp.chungNhan[0]?.loai ?? sp.danhMuc.ten}
                    danhGia={4.8}
                    soDanhGia={100}
                    giaTu={sp.gia.tu}
                    donVi={sp.quyCach?.donVi ?? 'kg'}
                    xuatXu={sp.trangTrai.diaChi}
                    tenTrangTrai={sp.trangTrai.ten}
                    onQuetQR={() => router.push('/truy-xuat')}
                  />
                ))}
              </SimpleGrid>
            ) : sanPhamMockupHienThi.length === 0 ? (
              <EmptyState
                tieuDe="Không tìm thấy sản phẩm phù hợp"
                moTa={
                  tuKhoaUrl
                    ? `Không có kết quả cho "${tuKhoaUrl}" với bộ lọc hiện tại. Thử xóa bộ lọc hoặc tìm từ khóa khác.`
                    : 'Thử nới lỏng điều kiện lọc hoặc xóa bộ lọc để xem thêm nông sản.'
                }
                hanhDong={
                  <Button color="#186a3e" onClick={xoaBoLoc}>
                    Xóa bộ lọc
                  </Button>
                }
              />
            ) : (
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing={14}>
                {sanPhamMockupHienThi.map((sp) => (
                  <ProductCard
                    key={sp.id}
                    id={sp.id}
                    ten={sp.ten}
                    anhUrl={sp.anh}
                    chungNhan={sp.chungNhan}
                    danhGia={sp.danhGia}
                    soDanhGia={sp.soDanhGia}
                    giaTu={sp.gia}
                    donVi={sp.donVi}
                    xuatXu={sp.xuatXu}
                    tenTrangTrai={sp.trangTraiTen}
                    onQuetQR={() => setSanPhamTruyXuat(sp)}
                  />
                ))}
              </SimpleGrid>
            )}

            {/* ======================================================== */}
            {/* THANH PHÂN TRANG                                          */}
            {/* ======================================================== */}
            <Group justify="space-between" align="center" pt={4} wrap="wrap">
              {/* Box trống để cân bằng bên trái */}
              <Box w={{ base: 0, sm: 120 }} visibleFrom="sm" />

              {/* Nút số trang trung tâm */}
              <Group gap={6} justify="center">
                {/* Nút lùi trang */}
                <ActionIcon
                  size={32}
                  variant="default"
                  radius="xs"
                  onClick={() => setTrangHienTai((p) => Math.max(1, p - 1))}
                  disabled={trangHienTai === 1}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    borderRadius: 6,
                  }}
                >
                  <IconChevronLeft size={16} />
                </ActionIcon>

                {/* Các số trang động */}
                {Array.from({ length: Math.min(4, tongTrangHienThi) }, (_, i) => i + 1).map(
                  (page) => {
                    const isActive = page === trangHienTai;
                    return (
                      <Button
                        key={page}
                        size="compact-sm"
                        onClick={() => setTrangHienTai(page)}
                        style={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          backgroundColor: isActive ? '#186a3e' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          border: isActive ? 'none' : '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontWeight: isActive ? 750 : 500,
                          fontSize: 13,
                          boxShadow: isActive ? '0 2px 5px rgba(24, 106, 62, 0.25)' : 'none',
                        }}
                      >
                        {page}
                      </Button>
                    );
                  },
                )}

                {/* Nút tiến trang */}
                <ActionIcon
                  size={32}
                  variant="default"
                  radius="xs"
                  onClick={() => setTrangHienTai((p) => Math.min(tongTrangHienThi, p + 1))}
                  disabled={trangHienTai === tongTrangHienThi}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    borderRadius: 6,
                  }}
                >
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Group>

              {/* Nhãn hiển thị bên phải */}
              <Text fz={13} c="#64748b" fw={500} ta={{ base: 'center', sm: 'right' }}>
                Hiển thị {coDuLieuApi ? duLieuApi.length : sanPhamMockupHienThi.length}/
                {soLuongHienThi} sản phẩm
              </Text>
            </Group>
          </Stack>
        </Box>
      </AgriContainer>

      {/* ======================================================== */}
      {/* MODAL QUÉT QR TRUY XUẤT NGUỒN GỐC                         */}
      {/* ======================================================== */}
      <Modal
        opened={sanPhamTruyXuat !== null}
        onClose={() => setSanPhamTruyXuat(null)}
        title={
          <Group gap={8}>
            <IconShieldCheck size={22} color="#186a3e" />
            <Text fw={800} fz={17} c="#186a3e">
              Thông tin truy xuất nguồn gốc
            </Text>
          </Group>
        }
        size="md"
        radius="lg"
        centered
      >
        {sanPhamTruyXuat ? (
          <Stack gap={14}>
            {/* Header sản phẩm */}
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text fw={800} fz={18} c="#1e293b">
                  {sanPhamTruyXuat.ten}
                </Text>
                <Text fz={13} c="#64748b">
                  {sanPhamTruyXuat.trangTraiTen}
                </Text>
              </Stack>
              <Badge color="#186a3e" size="lg" radius="xl">
                {sanPhamTruyXuat.chungNhan}
              </Badge>
            </Group>

            {/* Khung mã QR & trạng thái xác thực */}
            <Paper
              p={14}
              radius="md"
              style={{
                backgroundColor: '#f1f8f3',
                border: '1.5px dashed #186a3e',
                textAlign: 'center',
              }}
            >
              <Group justify="center" gap={16} align="center">
                <Box
                  p={8}
                  bg="#ffffff"
                  style={{ borderRadius: 8, border: '1px solid #d1e7d8', display: 'inline-block' }}
                >
                  <IconQrcode size={100} color="#186a3e" />
                </Box>
                <Stack gap={4} align="flex-start" ta="left">
                  <Badge color="green" variant="filled" size="sm">
                    Mã QR hợp lệ ✓
                  </Badge>
                  <Text fz={12} c="#334155" fw={600}>
                    Mã lô: {sanPhamTruyXuat.maLo}
                  </Text>
                  <Text fz={11} c="#64748b">
                    Hệ thống xác thực minh bạch AgriMarket
                  </Text>
                  <Text fz={11} c="#186a3e" fw={700}>
                    Tiêu chuẩn: {sanPhamTruyXuat.chungNhan}
                  </Text>
                </Stack>
              </Group>
            </Paper>

            {/* Chi tiết thông tin nông trại & canh tác */}
            <Stack gap={8} fz={13}>
              <Group justify="space-between" py={4} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <Text c="#64748b">Vùng canh tác:</Text>
                <Text fw={600} c="#1e293b">
                  {sanPhamTruyXuat.diaChiTrangTrai}
                </Text>
              </Group>
              <Group justify="space-between" py={4} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <Text c="#64748b">Ngày thu hoạch:</Text>
                <Text fw={600} c="#1e293b">
                  {sanPhamTruyXuat.ngayThuHoach}
                </Text>
              </Group>
              <Group justify="space-between" py={4} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <Text c="#64748b">Ngày đóng gói:</Text>
                <Text fw={600} c="#1e293b">
                  {sanPhamTruyXuat.ngayDongGoi}
                </Text>
              </Group>
              <Stack gap={2} py={4}>
                <Text c="#64748b">Phương pháp canh tác:</Text>
                <Text fw={600} c="#1e293b" fz={12.5}>
                  {sanPhamTruyXuat.phuongPhapCanhTac}
                </Text>
              </Stack>
            </Stack>

            {/* Nút xem nhật ký canh tác chi tiết */}
            <Button
              fullWidth
              color="#186a3e"
              radius="md"
              onClick={() => {
                setSanPhamTruyXuat(null);
                router.push(`/truy-xuat?q=${sanPhamTruyXuat.maLo}`);
              }}
              style={{ backgroundColor: '#186a3e', marginTop: 8 }}
            >
              Xem toàn bộ chuỗi nhật ký truy xuất
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </Box>
  );
}
