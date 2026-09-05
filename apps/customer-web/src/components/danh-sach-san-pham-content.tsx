'use client';

import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import {
  Button,
  Card,
  Group,
  NumberInput,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';

const GIOI_HAN = 12;

type KhaDung = 'TAT_CA' | 'CON_HANG' | 'HET_HANG';
type SapXep = 'PHU_HOP' | 'TEN_AZ' | 'TEN_ZA' | 'GIA_TANG' | 'GIA_GIAM' | 'MOI_NHAT';

function so(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function khaDung(value: string | null): KhaDung {
  if (value === 'CON_HANG' || value === 'HET_HANG') return value;
  return 'TAT_CA';
}

function sapXep(value: string | null): SapXep {
  if (
    value === 'PHU_HOP' ||
    value === 'TEN_AZ' ||
    value === 'TEN_ZA' ||
    value === 'GIA_TANG' ||
    value === 'GIA_GIAM' ||
    value === 'MOI_NHAT'
  ) {
    return value;
  }
  return 'PHU_HOP';
}

function anh(url: string | null, ten: string) {
  if (!url) return undefined;
  return (
    <img
      src={url}
      alt={ten}
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}

export function DanhSachSanPhamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [timKiem, setTimKiem] = useState('');
  const [danhMuc, setDanhMuc] = useState<string | null>(null);
  const [trangTraiId, setTrangTraiId] = useState<string | null>(null);
  const [tinhThanh, setTinhThanh] = useState('');
  const [chungNhan, setChungNhan] = useState<string | null>(null);
  const [giaTu, setGiaTu] = useState<number | string>('');
  const [giaDen, setGiaDen] = useState<number | string>('');
  const [thuHoachTu, setThuHoachTu] = useState('');
  const [thuHoachDen, setThuHoachDen] = useState('');
  const [khaDungState, setKhaDungState] = useState<KhaDung>('TAT_CA');
  const [sapXepState, setSapXepState] = useState<SapXep>('PHU_HOP');

  const trang = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  const query = {
    trang,
    gioiHan: GIOI_HAN,
    timKiem: searchParams.get('q') || undefined,
    danhMuc: searchParams.get('category') || undefined,
    trangTraiId: searchParams.get('farm') || undefined,
    tinhThanh: searchParams.get('province') || undefined,
    chungNhan: searchParams.get('certificate') || undefined,
    giaTu: so(searchParams.get('minPrice')),
    giaDen: so(searchParams.get('maxPrice')),
    thuHoachTu: searchParams.get('harvestFrom') || undefined,
    thuHoachDen: searchParams.get('harvestTo') || undefined,
    khaDung: khaDung(searchParams.get('availability')),
    sapXep: sapXep(searchParams.get('sort')),
  };

  const { data, isPending, isError, refetch } = useLayDanhSachSanPhamCongKhai(query);

  const { data: facetData } = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 100,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  useEffect(() => {
    setTimKiem(searchParams.get('q') ?? '');
    setDanhMuc(searchParams.get('category'));
    setTrangTraiId(searchParams.get('farm'));
    setTinhThanh(searchParams.get('province') ?? '');
    setChungNhan(searchParams.get('certificate'));
    setGiaTu(searchParams.get('minPrice') ?? '');
    setGiaDen(searchParams.get('maxPrice') ?? '');
    setThuHoachTu(searchParams.get('harvestFrom') ?? '');
    setThuHoachDen(searchParams.get('harvestTo') ?? '');
    setKhaDungState(khaDung(searchParams.get('availability')));
    setSapXepState(sapXep(searchParams.get('sort')));
  }, [searchParams]);

  const facets = facetData?.data.duLieu ?? [];

  const danhMucOptions = useMemo(
    () =>
      Array.from(
        new Map(
          facets.map((item) => [
            item.danhMuc.slug,
            {
              value: item.danhMuc.slug,
              label: item.danhMuc.ten,
            },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [facets],
  );

  const farmOptions = useMemo(
    () =>
      Array.from(
        new Map(
          facets.map((item) => [
            item.trangTrai.id,
            {
              value: item.trangTrai.id,
              label: `${item.trangTrai.ten} — ${item.trangTrai.diaChi}`,
            },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [facets],
  );

  const certificateOptions = useMemo(
    () =>
      Array.from(
        new Set(facets.flatMap((item) => item.chungNhan.map((certificate) => certificate.loai))),
      )
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((value) => ({ value, label: value })),
    [facets],
  );

  const capNhatUrl = (page = 1) => {
    const params = new URLSearchParams();

    if (timKiem.trim()) params.set('q', timKiem.trim());
    if (danhMuc) params.set('category', danhMuc);
    if (trangTraiId) params.set('farm', trangTraiId);
    if (tinhThanh.trim()) params.set('province', tinhThanh.trim());
    if (chungNhan) params.set('certificate', chungNhan);
    if (giaTu !== '') params.set('minPrice', String(giaTu));
    if (giaDen !== '') params.set('maxPrice', String(giaDen));
    if (thuHoachTu) params.set('harvestFrom', thuHoachTu);
    if (thuHoachDen) params.set('harvestTo', thuHoachDen);
    if (khaDungState !== 'TAT_CA') {
      params.set('availability', khaDungState);
    }
    if (sapXepState !== 'PHU_HOP') {
      params.set('sort', sapXepState);
    }
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    router.replace(qs ? `/san-pham?${qs}` : '/san-pham');
  };

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));

  return (
    <AgriContainer py={{ base: 36, md: 56 }}>
      <Stack gap="xl">
        <Stack gap="sm">
          <AgriBadge>Search / List / Filter</AgriBadge>
          <Title order={1}>Khám phá nông sản</Title>
          <Text c="dimmed" maw={760}>
            Bộ lọc được lưu trên URL để có thể reload, bookmark và chia sẻ đúng trạng thái tìm kiếm.
          </Text>
        </Stack>

        <Card withBorder radius="lg" padding="lg">
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              <TextInput
                label="Từ khóa"
                placeholder="Tên nông sản"
                value={timKiem}
                onChange={(event) => setTimKiem(event.currentTarget.value)}
              />
              <Select
                label="Danh mục"
                clearable
                searchable
                data={danhMucOptions}
                value={danhMuc}
                onChange={setDanhMuc}
              />
              <Select
                label="Trang trại"
                clearable
                searchable
                data={farmOptions}
                value={trangTraiId}
                onChange={setTrangTraiId}
              />
              <TextInput
                label="Tỉnh / thành"
                placeholder="Ví dụ: Lâm Đồng"
                value={tinhThanh}
                onChange={(event) => setTinhThanh(event.currentTarget.value)}
              />
              <Select
                label="Chứng nhận"
                clearable
                searchable
                data={certificateOptions}
                value={chungNhan}
                onChange={setChungNhan}
              />
              <Select
                label="Đánh giá"
                disabled
                data={[
                  { value: '4', label: 'Từ 4 sao' },
                  { value: '3', label: 'Từ 3 sao' },
                ]}
                description="Ranking đã dùng rating; filter theo sao chưa thuộc PHIEN-112."
                value={null}
              />
              <NumberInput label="Giá từ" min={0} value={giaTu} onChange={setGiaTu} />
              <NumberInput label="Giá đến" min={0} value={giaDen} onChange={setGiaDen} />
              <TextInput
                type="date"
                label="Thu hoạch từ"
                value={thuHoachTu}
                onChange={(event) => setThuHoachTu(event.currentTarget.value)}
              />
              <TextInput
                type="date"
                label="Thu hoạch đến"
                value={thuHoachDen}
                onChange={(event) => setThuHoachDen(event.currentTarget.value)}
              />
              <Select
                label="Khả dụng"
                data={[
                  { value: 'TAT_CA', label: 'Tất cả' },
                  { value: 'CON_HANG', label: 'Còn hàng' },
                  { value: 'HET_HANG', label: 'Hết hàng' },
                ]}
                value={khaDungState}
                onChange={(value) => setKhaDungState(khaDung(value))}
              />
              <Select
                label="Sắp xếp"
                data={[
                  { value: 'PHU_HOP', label: 'Phù hợp' },
                  { value: 'TEN_AZ', label: 'Tên A → Z' },
                  { value: 'TEN_ZA', label: 'Tên Z → A' },
                  { value: 'GIA_TANG', label: 'Giá tăng dần' },
                  { value: 'GIA_GIAM', label: 'Giá giảm dần' },
                  { value: 'MOI_NHAT', label: 'Mới nhất' },
                ]}
                value={sapXepState}
                onChange={(value) => setSapXepState(sapXep(value))}
              />
            </SimpleGrid>

            <Group>
              <Button onClick={() => capNhatUrl(1)}>Áp dụng bộ lọc</Button>
              <Button variant="default" onClick={() => router.replace('/san-pham')}>
                Xóa bộ lọc
              </Button>
            </Group>
          </Stack>
        </Card>

        {isPending ? (
          <AgriSkeleton soLuong={6} />
        ) : isError ? (
          <ErrorState
            tieuDe="Không tải được danh sách sản phẩm"
            moTa="Kiểm tra API hoặc điều kiện bộ lọc rồi thử lại."
            onThuLai={() => {
              void refetch();
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            tieuDe="Không tìm thấy nông sản"
            moTa="Hãy thay đổi từ khóa hoặc điều kiện bộ lọc."
          />
        ) : (
          <Stack gap="xl">
            <Group justify="space-between">
              <Text c="dimmed">Tìm thấy {response?.tong ?? 0} sản phẩm</Text>
              <Text size="sm" c="dimmed">
                Trang {response?.trang ?? trang} / {tongTrang}
              </Text>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  ten={item.ten}
                  tenTrangTrai={item.trangTrai.ten}
                  giaTu={item.gia.tu}
                  donVi="đơn vị"
                  href={`/san-pham/${item.id}`}
                  anh={anh(item.anhBiaUrl, item.ten)}
                  nhan={[item.danhMuc.ten, item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng']}
                />
              ))}
            </SimpleGrid>

            {tongTrang > 1 ? (
              <Group justify="center">
                <Pagination
                  value={Math.min(trang, tongTrang)}
                  total={tongTrang}
                  onChange={(value) => {
                    capNhatUrl(value);
                  }}
                />
              </Group>
            ) : null}
          </Stack>
        )}
      </Stack>
    </AgriContainer>
  );
}
