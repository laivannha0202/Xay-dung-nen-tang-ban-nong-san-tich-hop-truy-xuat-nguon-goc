'use client';

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAdjustments,
  IconArrowsSort,
  IconCheck,
  IconChevronRight,
  IconCoin,
  IconFilter,
  IconFilterOff,
  IconLayoutGrid,
  IconMapPin,
  IconSearch,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useId, useMemo, useState } from 'react';

import {
  LayDanhSachSanPhamCongKhaiSapXep,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { AgriContainer } from './agri-container';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';

const SO_SAN_PHAM_MOI_TRANG = 16;

const CAC_LUA_CHON_SAP_XEP = [
  { value: 'PHU_HOP', label: 'Phù hợp nhất' },
  { value: 'MOI_NHAT', label: 'Mới nhất' },
  { value: 'TEN_AZ', label: 'Tên A → Z' },
  { value: 'TEN_ZA', label: 'Tên Z → A' },
  { value: 'GIA_TANG', label: 'Giá thấp → cao' },
  { value: 'GIA_GIAM', label: 'Giá cao → thấp' },
] as const;

const MUC_GIA_GOI_Y = [
  { id: 'all', label: 'Tất cả mức giá', giaTu: undefined, giaDen: undefined },
  { id: 'duoi-50k', label: 'Dưới 50.000đ', giaTu: undefined, giaDen: 50000 },
  { id: '50k-100k', label: '50.000đ – 100.000đ', giaTu: 50000, giaDen: 100000 },
  { id: '100k-200k', label: '100.000đ – 200.000đ', giaTu: 100000, giaDen: 200000 },
  { id: 'tren-200k', label: 'Trên 200.000đ', giaTu: 200000, giaDen: undefined },
] as const;

export function DanhSachSanPhamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const farmSelectId = useId();

  // Drawer bộ lọc trên mobile
  const [moDrawerLoc, { open: moDrawer, close: dongDrawer }] = useDisclosure(false);

  // 1. Đọc URL Search Params (Source of Truth)
  const timKiem = (searchParams.get('timKiem') ?? searchParams.get('q') ?? '').trim();
  const danhMuc = (searchParams.get('danhMuc') ?? searchParams.get('category') ?? '').trim();
  const trangTraiId = (searchParams.get('trangTraiId') ?? searchParams.get('farm') ?? '').trim();
  const tinhThanh = (searchParams.get('tinhThanh') ?? '').trim();
  const chungNhan = (searchParams.get('chungNhan') ?? searchParams.get('certificate') ?? '').trim();
  const giaTuParam = searchParams.get('giaTu');
  const giaDenParam = searchParams.get('giaDen');
  const giaTu = giaTuParam ? Number(giaTuParam) : undefined;
  const giaDen = giaDenParam ? Number(giaDenParam) : undefined;
  const sapXepRaw = (searchParams.get('sapXep') ?? searchParams.get('sort') ?? 'MOI_NHAT').toUpperCase();
  const sapXep = (
    ['PHU_HOP', 'MOI_NHAT', 'TEN_AZ', 'TEN_ZA', 'GIA_TANG', 'GIA_GIAM'].includes(sapXepRaw)
      ? sapXepRaw
      : 'MOI_NHAT'
  ) as LayDanhSachSanPhamCongKhaiSapXep;
  const trang = Math.max(1, parseInt(searchParams.get('trang') ?? '1', 10) || 1);

  // Local state cho khoảng giá tùy chỉnh
  const [giaTuInput, setGiaTuInput] = useState<number | string>(giaTu ?? '');
  const [giaDenInput, setGiaDenInput] = useState<number | string>(giaDen ?? '');

  // 2. Query Facets thật từ backend
  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const facets = facetsQuery.data?.data;

  // 3. Query Danh sách sản phẩm thật từ backend
  const sanPhamApiQuery = useLayDanhSachSanPhamCongKhai({
    trang,
    gioiHan: SO_SAN_PHAM_MOI_TRANG,
    timKiem: timKiem || undefined,
    danhMuc: danhMuc && danhMuc !== 'tat-ca' ? danhMuc : undefined,
    trangTraiId: trangTraiId || undefined,
    tinhThanh: tinhThanh || undefined,
    chungNhan: chungNhan || undefined,
    giaTu: typeof giaTu === 'number' && !Number.isNaN(giaTu) ? giaTu : undefined,
    giaDen: typeof giaDen === 'number' && !Number.isNaN(giaDen) ? giaDen : undefined,
    sapXep,
  });

  const duLieuApi = useMemo(() => sanPhamApiQuery.data?.data?.duLieu ?? [], [sanPhamApiQuery.data]);
  const tongApi = sanPhamApiQuery.data?.data?.tong ?? 0;
  const dangTaiApi = sanPhamApiQuery.isPending;
  const loiApi = sanPhamApiQuery.isError;
  const tongTrang = Math.max(1, Math.ceil(tongApi / SO_SAN_PHAM_MOI_TRANG));

  // Hàm cập nhật URL search parameters (giữ đồng bộ trạng thái URL)
  function capNhatParams(thayDoi: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [k, v] of Object.entries(thayDoi)) {
      if (v === null || v === undefined || v === '') {
        params.delete(k);
        // Xóa alias cũ nếu có
        if (k === 'timKiem') params.delete('q');
        if (k === 'danhMuc') params.delete('category');
        if (k === 'trangTraiId') params.delete('farm');
        if (k === 'chungNhan') params.delete('certificate');
        if (k === 'sapXep') params.delete('sort');
      } else {
        params.set(k, String(v));
        if (k === 'timKiem') params.delete('q');
        if (k === 'danhMuc') params.delete('category');
        if (k === 'trangTraiId') params.delete('farm');
        if (k === 'chungNhan') params.delete('certificate');
        if (k === 'sapXep') params.delete('sort');
      }
    }

    // Nếu đổi bất kỳ bộ lọc/từ khóa/sắp xếp nào (ngoại trừ click trang cụ thể), reset trang về 1
    if (!('trang' in thayDoi)) {
      params.delete('trang');
    }

    const qs = params.toString();
    router.push(qs ? `/san-pham?${qs}` : '/san-pham');
  }

  function xoaTatCaBoLoc() {
    setGiaTuInput('');
    setGiaDenInput('');
    router.push('/san-pham');
  }

  function handleChuyenTrang(trangMoi: number) {
    capNhatParams({ trang: trangMoi > 1 ? trangMoi : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleApDungKhoangGia() {
    const tuVal = typeof giaTuInput === 'number' ? giaTuInput : Number(giaTuInput);
    const denVal = typeof giaDenInput === 'number' ? giaDenInput : Number(giaDenInput);
    capNhatParams({
      giaTu: !Number.isNaN(tuVal) && tuVal > 0 ? tuVal : null,
      giaDen: !Number.isNaN(denVal) && denVal > 0 ? denVal : null,
    });
  }

  // Nhận diện mức giá gợi ý đang kích hoạt
  const mucGiaHienTaiId = useMemo(() => {
    if (giaTu === undefined && giaDen === undefined) return 'all';
    if (giaTu === undefined && giaDen === 50000) return 'duoi-50k';
    if (giaTu === 50000 && giaDen === 100000) return '50k-100k';
    if (giaTu === 100000 && giaDen === 200000) return '100k-200k';
    if (giaTu === 200000 && giaDen === undefined) return 'tren-200k';
    return 'custom';
  }, [giaTu, giaDen]);

  // Đếm số lượng bộ lọc đang hoạt động
  const soBoLocHoatDong = useMemo(() => {
    let count = 0;
    if (timKiem) count++;
    if (danhMuc && danhMuc !== 'tat-ca') count++;
    if (trangTraiId) count++;
    if (tinhThanh) count++;
    if (chungNhan) count++;
    if (giaTu !== undefined || giaDen !== undefined) count++;
    return count;
  }, [timKiem, danhMuc, trangTraiId, tinhThanh, chungNhan, giaTu, giaDen]);

  // Tiêu đề danh mục đang chọn nếu có
  const tenDanhMucHienTai = useMemo(() => {
    if (!danhMuc || danhMuc === 'tat-ca') return null;
    const found = facets?.danhMuc.find((dm) => dm.value === danhMuc);
    return found ? found.label : danhMuc;
  }, [danhMuc, facets]);

  // Dữ liệu bộ lọc trang trại cho Select Mantine
  const optionsTrangTrai = useMemo(() => {
    const list = facets?.trangTrai ?? [];
    return [
      { value: '', label: 'Tất cả trang trại' },
      ...list.map((tt) => ({
        value: tt.value,
        label: `${tt.label} (${tt.soSanPham})`,
      })),
    ];
  }, [facets?.trangTrai]);

  // Nội dung bộ lọc dùng chung cho cả Sidebar Desktop lẫn Drawer Mobile
  const NoiDungBoLoc = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Stack gap={20}>
      {/* 1. Danh mục sản phẩm */}
      <Stack gap={10}>
        <Group gap={6} align="center">
          <IconLayoutGrid size={18} color="#0B7A48" stroke={2.2} />
          <Text fw={750} fz={14} c="#1e293b">
            Danh mục
          </Text>
        </Group>
        <Stack gap={6} pl={4}>
          <UnstyledButton
            onClick={() => {
              capNhatParams({ danhMuc: null });
              if (isMobile) dongDrawer();
            }}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              backgroundColor: !danhMuc || danhMuc === 'tat-ca' ? '#EBF5EE' : 'transparent',
              color: !danhMuc || danhMuc === 'tat-ca' ? '#0B7A48' : '#334155',
              fontWeight: !danhMuc || danhMuc === 'tat-ca' ? 700 : 500,
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Tất cả danh mục</span>
            {!danhMuc || danhMuc === 'tat-ca' ? <IconCheck size={14} color="#0B7A48" /> : null}
          </UnstyledButton>

          {facets?.danhMuc && facets.danhMuc.length > 0
            ? facets.danhMuc.map((dm) => {
                const active = danhMuc === dm.value;
                return (
                  <UnstyledButton
                    key={dm.value}
                    onClick={() => {
                      capNhatParams({ danhMuc: active ? null : dm.value });
                      if (isMobile) dongDrawer();
                    }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      backgroundColor: active ? '#EBF5EE' : 'transparent',
                      color: active ? '#0B7A48' : '#334155',
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    <span
                      style={{
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={dm.label}
                    >
                      {dm.label}
                    </span>
                    <Badge size="xs" variant="light" color={active ? 'agrimarket' : 'gray'}>
                      {dm.soSanPham}
                    </Badge>
                  </UnstyledButton>
                );
              })
            : facetsQuery.isPending
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={26} radius="sm" />)
              : null}
        </Stack>
      </Stack>

      <Divider color="#e8efe9" />

      {/* 2. Mức giá */}
      <Stack gap={10}>
        <Group gap={6} align="center">
          <IconCoin size={18} color="#0B7A48" stroke={2.2} />
          <Text fw={750} fz={14} c="#1e293b">
            Mức giá
          </Text>
        </Group>
        <Stack gap={6} pl={4}>
          {MUC_GIA_GOI_Y.map((item) => {
            const active = mucGiaHienTaiId === item.id;
            return (
              <UnstyledButton
                key={item.id}
                onClick={() => {
                  capNhatParams({
                    giaTu: item.giaTu ?? null,
                    giaDen: item.giaDen ?? null,
                  });
                  setGiaTuInput(item.giaTu ?? '');
                  setGiaDenInput(item.giaDen ?? '');
                  if (isMobile) dongDrawer();
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  backgroundColor: active ? '#EBF5EE' : 'transparent',
                  color: active ? '#0B7A48' : '#334155',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{item.label}</span>
                {active ? <IconCheck size={14} color="#0B7A48" /> : null}
              </UnstyledButton>
            );
          })}
        </Stack>

        {/* Nhập khoảng giá tùy chỉnh */}
        <Stack gap={6} mt={4}>
          <Text fz={12} fw={600} c="#64748b">
            Tự chọn khoảng giá (₫):
          </Text>
          <Group gap={6} wrap="nowrap">
            <TextInput
              placeholder="Từ"
              size="xs"
              value={giaTuInput}
              onChange={(e) => setGiaTuInput(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Text c="dimmed" size="xs">
              –
            </Text>
            <TextInput
              placeholder="Đến"
              size="xs"
              value={giaDenInput}
              onChange={(e) => setGiaDenInput(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
          </Group>
          <Button
            size="xs"
            variant="light"
            color="agrimarket"
            onClick={() => {
              handleApDungKhoangGia();
              if (isMobile) dongDrawer();
            }}
          >
            Áp dụng giá
          </Button>
        </Stack>
      </Stack>

      <Divider color="#e8efe9" />

      {/* 3. Chứng nhận */}
      <Stack gap={10}>
        <Group gap={6} align="center">
          <IconShieldCheck size={18} color="#0B7A48" stroke={2.2} />
          <Text fw={750} fz={14} c="#1e293b">
            Chứng nhận
          </Text>
        </Group>
        <Stack gap={6} pl={4}>
          {facets?.chungNhan && facets.chungNhan.length > 0 ? (
            facets.chungNhan.map((cn) => {
              const active = chungNhan === cn.value;
              return (
                <UnstyledButton
                  key={cn.value}
                  onClick={() => {
                    capNhatParams({ chungNhan: active ? null : cn.value });
                    if (isMobile) dongDrawer();
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    backgroundColor: active ? '#EBF5EE' : 'transparent',
                    color: active ? '#0B7A48' : '#334155',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{cn.label}</span>
                  <Badge size="xs" variant="light" color={active ? 'agrimarket' : 'gray'}>
                    {cn.soSanPham}
                  </Badge>
                </UnstyledButton>
              );
            })
          ) : (
            <Text fz={12} c="dimmed">
              Chưa có dữ liệu chứng nhận
            </Text>
          )}
        </Stack>
      </Stack>

      <Divider color="#e8efe9" />

      {/* 4. Khu vực / Tỉnh thành */}
      {facets?.tinhThanh && facets.tinhThanh.length > 0 ? (
        <>
          <Stack gap={10}>
            <Group gap={6} align="center">
              <IconMapPin size={18} color="#0B7A48" stroke={2.2} />
              <Text fw={750} fz={14} c="#1e293b">
                Khu vực trang trại
              </Text>
            </Group>
            <ScrollArea.Autosize mah={180} type="auto">
              <Stack gap={4} pl={4}>
                {facets.tinhThanh.map((tt) => {
                  const active = tinhThanh === tt.value;
                  return (
                    <UnstyledButton
                      key={tt.value}
                      onClick={() => {
                        capNhatParams({ tinhThanh: active ? null : tt.value });
                        if (isMobile) dongDrawer();
                      }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        backgroundColor: active ? '#EBF5EE' : 'transparent',
                        color: active ? '#0B7A48' : '#334155',
                        fontWeight: active ? 700 : 500,
                        fontSize: 12.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={tt.label}
                      >
                        {tt.label}
                      </span>
                      <Badge size="xs" variant="light" color={active ? 'agrimarket' : 'gray'}>
                        {tt.soSanPham}
                      </Badge>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </ScrollArea.Autosize>
          </Stack>
          <Divider color="#e8efe9" />
        </>
      ) : null}

      {/* 5. Trang trại đối tác */}
      <Stack gap={10}>
        <Group gap={6} align="center">
          <IconSearch size={18} color="#0B7A48" stroke={2.2} />
          <Text fw={750} fz={14} c="#1e293b">
            Trang trại
          </Text>
        </Group>
        <Select
          id={farmSelectId}
          placeholder="Chọn trang trại..."
          size="xs"
          data={optionsTrangTrai}
          value={trangTraiId}
          onChange={(val) => {
            capNhatParams({ trangTraiId: val || null });
            if (isMobile) dongDrawer();
          }}
          clearable
          searchable
          maxDropdownHeight={220}
          styles={{
            input: {
              backgroundColor: '#ffffff',
              fontSize: 13,
            },
          }}
        />
      </Stack>

      {/* Nút Xóa tất cả lọc */}
      {soBoLocHoatDong > 0 ? (
        <Button
          variant="subtle"
          color="red"
          size="xs"
          leftSection={<IconFilterOff size={15} />}
          onClick={() => {
            xoaTatCaBoLoc();
            if (isMobile) dongDrawer();
          }}
          fullWidth
          mt={6}
        >
          Xóa tất cả bộ lọc ({soBoLocHoatDong})
        </Button>
      ) : null}
    </Stack>
  );

  return (
    <Box bg="#f8faf8" py={{ base: 16, md: 28 }} style={{ minHeight: 'calc(100vh - 120px)' }}>
      <AgriContainer>
        {/* Breadcrumb phân cấp rõ ràng */}
        <Group gap={6} align="center" mb={{ base: 14, md: 20 }}>
          <Link
            href="/"
            style={{ textDecoration: 'none', color: '#68766D', fontSize: 13, fontWeight: 500 }}
          >
            Trang chủ
          </Link>
          <IconChevronRight size={14} color="#94a3b8" />
          <Text fz={13} fw={700} c="#0B7A48">
            {tenDanhMucHienTai || 'Tất cả nông sản'}
          </Text>
        </Group>

        {/* Bố cục Desktop: Sidebar 260px cố định, Cột kết quả mở rộng chiếm 100% không gian còn lại */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 28,
            alignItems: 'start',
          }}
          className="san-pham-main-layout"
        >
          <Group align="flex-start" wrap="nowrap" gap={28}>
            {/* ======================================================== */}
            {/* CỘT TRÁI: SIDEBAR FILTER DESKTOP                         */}
            {/* ======================================================== */}
            <Paper
              visibleFrom="md"
              w={260}
              p={18}
              radius="md"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2eae4',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(11, 122, 72, 0.04)',
                position: 'sticky',
                top: 88,
                flexShrink: 0,
              }}
            >
              <Group justify="space-between" align="center" mb={14}>
                <Group gap={8} align="center">
                  <IconFilter size={20} color="#0B7A48" stroke={2.4} />
                  <Text fw={800} fz={16} c="#0B7A48">
                    Bộ lọc tìm kiếm
                  </Text>
                </Group>
                {soBoLocHoatDong > 0 ? (
                  <Badge size="sm" color="agrimarket" radius="xl">
                    {soBoLocHoatDong}
                  </Badge>
                ) : null}
              </Group>

              <Divider color="#e8efe9" mb={16} />

              <NoiDungBoLoc />
            </Paper>

            {/* ======================================================== */}
            {/* CỘT PHẢI: TOOLBAR, LƯỚI SẢN PHẨM, BANNER & PHÂN TRANG    */}
            {/* ======================================================== */}
            <Stack gap={20} style={{ flex: 1, minWidth: 0 }}>
              {/* Thanh Toolbar phía trên Grid: Title, Đếm & Sắp xếp */}
              <Paper
                p={{ base: 14, sm: 16 }}
                radius="md"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2eae4',
                  borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <Stack gap={12}>
                  <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                    {/* Tiêu đề */}
                    <Title order={2} fz={{ base: 18, sm: 22 }} fw={850} c="#1e293b">
                      {tenDanhMucHienTai || (timKiem ? `Kết quả cho "${timKiem}"` : 'Tất cả nông sản')}
                    </Title>

                    {/* Sắp xếp duy nhất trên Toolbar */}
                    <Group gap={10} align="center" wrap="nowrap">
                      {/* Nút mở bộ lọc mobile (< md) */}
                      <Button
                        hiddenFrom="md"
                        variant="light"
                        color="agrimarket"
                        size="xs"
                        leftSection={<IconAdjustments size={15} />}
                        onClick={moDrawer}
                      >
                        Bộ lọc {soBoLocHoatDong > 0 ? `(${soBoLocHoatDong})` : ''}
                      </Button>

                      <Group gap={6} align="center" wrap="nowrap">
                        <IconArrowsSort size={16} color="#68766D" />
                        <Text fz={13} c="#475569" fw={600} visibleFrom="xs">
                          Sắp xếp:
                        </Text>
                        <Select
                          size="xs"
                          w={{ base: 140, sm: 165 }}
                          value={sapXep}
                          onChange={(val) => {
                            if (val) capNhatParams({ sapXep: val });
                          }}
                          data={CAC_LUA_CHON_SAP_XEP.map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                          }))}
                          styles={{
                            input: {
                              backgroundColor: '#f8faf8',
                              borderColor: '#cbd5e1',
                              fontWeight: 600,
                              fontSize: 12.5,
                            },
                          }}
                        />
                      </Group>
                    </Group>
                  </Group>

                  {/* Thanh chip các bộ lọc đang kích hoạt */}
                  {soBoLocHoatDong > 0 ? (
                    <Group gap={6} wrap="wrap" pt={4}>
                      <Text fz={12} c="#64748b" fw={600}>
                        Đang lọc:
                      </Text>
                      {timKiem ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => {
                                capNhatParams({ timKiem: null });
                              }}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          Từ khóa: {timKiem}
                        </Badge>
                      ) : null}
                      {danhMuc && danhMuc !== 'tat-ca' ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => capNhatParams({ danhMuc: null })}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          {tenDanhMucHienTai || danhMuc}
                        </Badge>
                      ) : null}
                      {chungNhan ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => capNhatParams({ chungNhan: null })}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          {chungNhan}
                        </Badge>
                      ) : null}
                      {tinhThanh ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => capNhatParams({ tinhThanh: null })}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          Khu vực: {tinhThanh}
                        </Badge>
                      ) : null}
                      {trangTraiId ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => capNhatParams({ trangTraiId: null })}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          Trang trại đã chọn
                        </Badge>
                      ) : null}
                      {giaTu !== undefined || giaDen !== undefined ? (
                        <Badge
                          color="agrimarket"
                          variant="light"
                          radius="md"
                          rightSection={
                            <ActionIcon
                              size={14}
                              color="agrimarket"
                              variant="transparent"
                              onClick={() => {
                                setGiaTuInput('');
                                setGiaDenInput('');
                                capNhatParams({ giaTu: null, giaDen: null });
                              }}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          {giaTu !== undefined && giaDen !== undefined
                            ? `${giaTu.toLocaleString('vi-VN')}₫ – ${giaDen.toLocaleString('vi-VN')}₫`
                            : giaTu !== undefined
                              ? `≥ ${giaTu.toLocaleString('vi-VN')}₫`
                              : `≤ ${giaDen!.toLocaleString('vi-VN')}₫`}
                        </Badge>
                      ) : null}

                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        onClick={xoaTatCaBoLoc}
                      >
                        Xóa tất cả
                      </Button>
                    </Group>
                  ) : null}
                </Stack>
              </Paper>

              {/* LƯỚI SẢN PHẨM: 4 CỘT TRÊN DESKTOP, 3 TRÊN TABLET, 2 TRÊN MOBILE */}
              {dangTaiApi ? (
                <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing={{ base: 12, sm: 16 }}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <Card
                      key={idx}
                      padding={0}
                      radius="md"
                      style={{ border: '1px solid #e5eae6', height: 350 }}
                    >
                      <Skeleton h={190} radius={0} />
                      <Stack p={14} gap={8}>
                        <Skeleton h={18} width="85%" />
                        <Skeleton h={14} width="50%" />
                        <Skeleton h={22} width="40%" mt={4} />
                        <Skeleton h={34} mt="auto" radius="md" />
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : loiApi ? (
                <ErrorState
                  tieuDe="Không thể tải danh sách sản phẩm"
                  moTa="Hệ thống máy chủ tạm thời không phản hồi hoặc kết nối mạng bị gián đoạn. Vui lòng thử lại."
                  onThuLai={() => void sanPhamApiQuery.refetch()}
                />
              ) : duLieuApi.length === 0 ? (
                <EmptyState
                  tieuDe="Không tìm thấy sản phẩm phù hợp"
                  moTa={
                    timKiem
                      ? `Không có nông sản nào khớp với từ khóa "${timKiem}" và các bộ lọc đã chọn.`
                      : 'Thử nới lỏng hoặc xóa các tiêu chí bộ lọc để xem toàn bộ danh mục nông sản.'
                  }
                  hanhDong={
                    <Button color="agrimarket" onClick={xoaTatCaBoLoc}>
                      Xóa tất cả bộ lọc
                    </Button>
                  }
                />
              ) : (
                <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing={{ base: 12, sm: 16 }}>
                  {duLieuApi.map((sp) => (
                    <ProductCard
                      key={sp.id}
                      id={sp.id}
                      ten={sp.ten}
                      anhUrl={sp.anhBiaUrl ?? undefined}
                      badges={sp.chungNhan}
                      danhGia={sp.danhGia?.diemTrungBinh}
                      soDanhGia={sp.danhGia?.tongLuot}
                      giaTu={sp.gia.tu}
                      giaDen={sp.gia.den}
                      giaBan={sp.giaBan ?? null}
                      donVi={sp.quyCach?.donVi ?? 'kg'}
                      khoiLuong={sp.quyCach?.khoiLuong ?? null}
                      xuatXu={sp.trangTrai.diaChi}
                      tenTrangTrai={sp.trangTrai.ten}
                      conHang={sp.khaDung.coTheDatHang}
                      href={`/san-pham/${sp.id}`}
                    />
                  ))}
                </SimpleGrid>
              )}

              {/* THANH PHÂN TRANG (Nằm sát kết quả hơn, dùng dữ liệu phân trang thật từ API) */}
              {!dangTaiApi && !loiApi && tongApi > SO_SAN_PHAM_MOI_TRANG ? (
                <Paper
                  p={14}
                  radius="md"
                  mt={10}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2eae4',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Pagination
                    value={trang}
                    total={tongTrang}
                    onChange={handleChuyenTrang}
                    color="agrimarket"
                    size="md"
                    radius="md"
                  />
                </Paper>
              ) : null}
            </Stack>
          </Group>
        </Box>

        {/* DRAWER BỘ LỌC CHO THIẾT BỊ MOBILE / TABLET NHỎ */}
        <Drawer
          opened={moDrawerLoc}
          onClose={dongDrawer}
          title={
            <Group gap={8}>
              <IconFilter size={20} color="#0B7A48" />
              <Text fw={800} fz={16} c="#0B7A48">
                Bộ lọc sản phẩm
              </Text>
            </Group>
          }
          padding="md"
          size="sm"
          position="left"
        >
          <ScrollArea.Autosize mah="calc(100vh - 120px)">
            <NoiDungBoLoc isMobile />
          </ScrollArea.Autosize>
          <Box pt="md" style={{ borderTop: '1px solid #e8efe9' }}>
            <Button fullWidth color="agrimarket" onClick={dongDrawer}>
              Xem kết quả
            </Button>
          </Box>
        </Drawer>
      </AgriContainer>
    </Box>
  );
}
