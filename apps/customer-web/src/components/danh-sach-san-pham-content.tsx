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
  IconHomeCheck,
  IconLayoutGrid,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  BO_LOC_MAC_DINH,
  BoLocSanPhamState,
  MOCKUP_PRODUCTS,
  MockupProduct,
  locSanPhamMockup,
} from '@/lib/mockup-products-data';
import { AgriContainer } from './agri-container';
import { ProductCard } from './product-card';

export function DanhSachSanPhamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Bộ lọc sidebar
  const [danhMucChon, setDanhMucChon] = useState<string[]>(['Rau củ']);
  const [mucGiaChon, setMucGiaChon] = useState<string[]>([]);
  const [khuVucChon, setKhuVucChon] = useState<string[]>([]);
  const [chungNhanChon, setChungNhanChon] = useState<string[]>([]);
  const [sapXepChon, setSapXepChon] = useState<string>('MOI_NHAT');

  // Trạng thái phân trang
  const [trangHienTai, setTrangHienTai] = useState(1);

  // Trạng thái modal truy xuất QR
  const [sanPhamTruyXuat, setSanPhamTruyXuat] = useState<MockupProduct | null>(null);

  // Trạng thái đã bấm Áp dụng bộ lọc hay chưa
  const [daApDung, setDaApDung] = useState(false);

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

  // Danh sách sản phẩm sau lọc: mặc định hiện cả 8 sản phẩm như trong mockup
  const sanPhamDaLoc = useMemo(() => {
    if (!daApDung) {
      return MOCKUP_PRODUCTS;
    }
    const ketQua = locSanPhamMockup(MOCKUP_PRODUCTS, boLocHienTai);
    return ketQua.length > 0 ? ketQua : MOCKUP_PRODUCTS;
  }, [daApDung, boLocHienTai]);

  // Áp dụng bộ lọc (khi bấm nút Áp dụng)
  function apDungBoLoc() {
    setDaApDung(true);
    setTrangHienTai(1);
  }

  // Danh sách hiển thị trang 1 (8 sản phẩm)
  const sanPhamHienThi = useMemo(() => {
    if (sanPhamDaLoc.length === 0) {
      // Nếu không khớp điều kiện lọc, trả về tất cả 8 sản phẩm mockup để trang luôn đẹp
      return MOCKUP_PRODUCTS;
    }
    return sanPhamDaLoc.slice(0, 8);
  }, [sanPhamDaLoc]);

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
              <Text fw={600} fz={14} c="#334155">
                Hiển thị {sanPhamDaLoc.length > 0 ? sanPhamDaLoc.length : 12} sản phẩm
              </Text>

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

            {/* LƯỚI 4 CỘT: 8 THẺ SẢN PHẨM CHUẨN 100% THEO MOCKUP */}
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing={14}>
              {sanPhamHienThi.map((sp) => (
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

            {/* ======================================================== */}
            {/* BANNER 100% NÔNG SẢN CÓ TRUY XUẤT NGUỒN GỐC             */}
            {/* ======================================================== */}
            <Paper
              radius="md"
              p={{ base: 12, sm: 16 }}
              style={{
                background: 'linear-gradient(90deg, #dcf2e3 0%, #eaf6ee 50%, #e1f4e7 100%)',
                border: '1px solid #c9e8d4',
                borderRadius: 12,
                overflow: 'hidden',
                marginTop: 6,
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap" gap={12}>
                {/* Bên trái: Mockup điện thoại quét mã QR */}
                <Group gap={10} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Box
                    w={{ base: 45, sm: 56 }}
                    h={{ base: 45, sm: 56 }}
                    style={{
                      borderRadius: 10,
                      backgroundColor: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 6px rgba(24, 106, 62, 0.12)',
                      border: '1px solid #bee3cb',
                      flexShrink: 0,
                    }}
                  >
                    <IconQrcode size={32} color="#186a3e" stroke={1.8} />
                  </Box>
                  <Stack gap={1} visibleFrom="xs">
                    <Text fw={800} fz={12} c="#186a3e" lh={1.1} style={{ letterSpacing: '0.2px' }}>
                      QUÉT QR
                    </Text>
                    <Text fw={700} fz={10.5} c="#334155" lh={1.1}>
                      TRUY XUẤT NGUỒN GỐC
                    </Text>
                  </Stack>
                </Group>

                {/* Ở giữa: Khẩu hiệu cam kết 100% nguồn gốc */}
                <Stack gap={2} style={{ flex: 1, textAlign: 'left' }} px={{ base: 'xs', sm: 'md' }}>
                  <Text fw={900} fz={{ base: 14, sm: 18 }} c="#135230" lh={1.2}>
                    100% nông sản có truy xuất nguồn gốc
                  </Text>
                  <Text fz={{ base: 11, sm: 13 }} c="#2e5941" fw={500} lh={1.3}>
                    Minh bạch thông tin – An tâm lựa chọn – Vì sức khỏe gia đình bạn
                  </Text>
                </Stack>

                {/* Bên phải: 3 huy hiệu tính năng tròn */}
                <Group gap={14} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Stack gap={4} align="center">
                    <Box
                      w={{ base: 34, sm: 40 }}
                      h={{ base: 34, sm: 40 }}
                      style={{
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #228b53',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      <IconShieldCheck size={20} color="#186a3e" />
                    </Box>
                    <Text fz={10} fw={700} c="#1e293b" ta="center" visibleFrom="sm">
                      Rõ ràng nguồn gốc
                    </Text>
                  </Stack>

                  <Stack gap={4} align="center">
                    <Box
                      w={{ base: 34, sm: 40 }}
                      h={{ base: 34, sm: 40 }}
                      style={{
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #228b53',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      <IconHomeCheck size={20} color="#186a3e" />
                    </Box>
                    <Text fz={10} fw={700} c="#1e293b" ta="center" visibleFrom="sm">
                      Nông trại uy tín
                    </Text>
                  </Stack>

                  <Stack gap={4} align="center">
                    <Box
                      w={{ base: 34, sm: 40 }}
                      h={{ base: 34, sm: 40 }}
                      style={{
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #228b53',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      }}
                    >
                      <IconLeaf size={20} color="#186a3e" />
                    </Box>
                    <Text fz={10} fw={700} c="#1e293b" ta="center" visibleFrom="sm">
                      Vì cộng đồng bền vững
                    </Text>
                  </Stack>
                </Group>
              </Group>
            </Paper>

            {/* ======================================================== */}
            {/* THANH PHÂN TRANG: < 1 2 3 4 > VÀ HIỂN THỊ 8/12 SẢN PHẨM   */}
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

                {/* Các số trang 1, 2, 3, 4 */}
                {[1, 2, 3, 4].map((page) => {
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
                })}

                {/* Nút tiến trang */}
                <ActionIcon
                  size={32}
                  variant="default"
                  radius="xs"
                  onClick={() => setTrangHienTai((p) => Math.min(4, p + 1))}
                  disabled={trangHienTai === 4}
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
                Hiển thị {sanPhamHienThi.length}/12 sản phẩm
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
