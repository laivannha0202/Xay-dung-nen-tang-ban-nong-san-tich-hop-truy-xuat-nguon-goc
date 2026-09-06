'use client';

import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import {
  Accordion,
  Box,
  Button,
  Group,
  NumberInput,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAdjustments, IconMapPin, IconSearch, IconSortAscending } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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
      className="farm-product-image"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            { value: item.danhMuc.slug, label: item.danhMuc.ten },
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
    if (khaDungState !== 'TAT_CA') params.set('availability', khaDungState);
    if (sapXepState !== 'PHU_HOP') params.set('sort', sapXepState);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    router.replace(qs ? `/san-pham?${qs}` : '/san-pham');
  };

  const xoaBoLoc = () => {
    setTimKiem('');
    setDanhMuc(null);
    setTrangTraiId(null);
    setTinhThanh('');
    setChungNhan(null);
    setGiaTu('');
    setGiaDen('');
    setThuHoachTu('');
    setThuHoachDen('');
    setKhaDungState('TAT_CA');
    setSapXepState('PHU_HOP');
    router.replace('/san-pham');
  };

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));

  return (
    <>
      <Box className="farm-page-hero">
        <AgriContainer>
          <Stack gap="sm" maw={760}>
            <Text className="farm-kicker">Chợ nông sản</Text>
            <Title order={1} className="farm-display" fz={{ base: 36, md: 48 }}>
              Rau củ, trái cây và nông sản từ trang trại
            </Title>
            <Text c="dimmed" size="lg">
              Tìm kiếm theo tên, danh mục, khu vực, trang trại, chứng nhận và thời điểm thu hoạch.
            </Text>
          </Stack>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 28, md: 38 }}>
        <Box className="farm-list-layout">
          <Paper withBorder p="lg" className="farm-filter">
            <Stack gap="lg">
              <Group justify="space-between">
                <Group gap={8}>
                  <IconAdjustments size={19} stroke={1.8} />
                  <Text fw={850}>Bộ lọc</Text>
                </Group>
                <Button variant="subtle" size="compact-sm" onClick={xoaBoLoc}>
                  Xóa hết
                </Button>
              </Group>

              <TextInput
                label="Tìm kiếm"
                placeholder="Tên nông sản..."
                leftSection={<IconSearch size={16} />}
                value={timKiem}
                onChange={(event) => setTimKiem(event.currentTarget.value)}
              />

              <Select
                label="Danh mục"
                clearable
                searchable
                data={danhMucOptions}
                value={danhMuc}
                placeholder="Tất cả danh mục"
                onChange={setDanhMuc}
              />

              <Select
                label="Tình trạng"
                data={[
                  { value: 'TAT_CA', label: 'Tất cả sản phẩm' },
                  { value: 'CON_HANG', label: 'Còn hàng' },
                  { value: 'HET_HANG', label: 'Tạm hết hàng' },
                ]}
                value={khaDungState}
                onChange={(value) => setKhaDungState(khaDung(value))}
              />

              <Accordion variant="default" multiple defaultValue={['nguon-goc']}>
                <Accordion.Item value="nguon-goc">
                  <Accordion.Control>Nguồn gốc</Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
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
                        leftSection={<IconMapPin size={16} />}
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
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="gia">
                  <Accordion.Control>Khoảng giá</Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <NumberInput label="Giá từ" min={0} value={giaTu} onChange={setGiaTu} />
                      <NumberInput label="Giá đến" min={0} value={giaDen} onChange={setGiaDen} />
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="thu-hoach">
                  <Accordion.Control>Ngày thu hoạch</Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <TextInput
                        type="date"
                        label="Từ ngày"
                        value={thuHoachTu}
                        onChange={(event) => setThuHoachTu(event.currentTarget.value)}
                      />
                      <TextInput
                        type="date"
                        label="Đến ngày"
                        value={thuHoachDen}
                        onChange={(event) => setThuHoachDen(event.currentTarget.value)}
                      />
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              <Button fullWidth onClick={() => capNhatUrl(1)}>
                Lọc sản phẩm
              </Button>
            </Stack>
          </Paper>

          <Stack gap="lg">
            <Group
              className="farm-result-toolbar"
              justify="space-between"
              align="flex-end"
              wrap="wrap"
            >
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  {response?.tong ?? 0} sản phẩm
                </Text>
                <Title order={2} className="farm-display">
                  Kết quả
                </Title>
              </Stack>

              <Select
                leftSection={<IconSortAscending size={16} />}
                label="Sắp xếp"
                data={[
                  { value: 'PHU_HOP', label: 'Phù hợp nhất' },
                  { value: 'MOI_NHAT', label: 'Mới nhất' },
                  { value: 'GIA_TANG', label: 'Giá thấp đến cao' },
                  { value: 'GIA_GIAM', label: 'Giá cao đến thấp' },
                  { value: 'TEN_AZ', label: 'Tên A → Z' },
                  { value: 'TEN_ZA', label: 'Tên Z → A' },
                ]}
                value={sapXepState}
                onChange={(value) => setSapXepState(sapXep(value))}
                w={{ base: '100%', sm: 220 }}
              />
            </Group>

            {isPending ? (
              <AgriSkeleton soLuong={6} />
            ) : isError ? (
              <ErrorState
                tieuDe="Chưa thể tải danh sách sản phẩm"
                moTa="Hãy kiểm tra kết nối hoặc thử lại sau."
                onThuLai={() => void refetch()}
              />
            ) : items.length === 0 ? (
              <EmptyState
                tieuDe="Không tìm thấy nông sản phù hợp"
                moTa="Thử thay đổi từ khóa hoặc bớt một số điều kiện lọc."
                hanhDong={
                  <Button variant="outline" onClick={xoaBoLoc}>
                    Xóa bộ lọc
                  </Button>
                }
              />
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                  {items.map((item) => (
                    <ProductCard
                      key={item.id}
                      ten={item.ten}
                      tenTrangTrai={item.trangTrai.ten}
                      giaTu={item.gia.tu}
                      donVi="đơn vị"
                      href={`/san-pham/${item.id}`}
                      anh={anh(item.anhBiaUrl, item.ten)}
                      nhan={[
                        item.danhMuc.ten,
                        item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                      ]}
                    />
                  ))}
                </SimpleGrid>

                {tongTrang > 1 ? (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={Math.min(trang, tongTrang)}
                      total={tongTrang}
                      onChange={(value) => capNhatUrl(value)}
                    />
                  </Group>
                ) : null}
              </>
            )}
          </Stack>
        </Box>
      </AgriContainer>
    </>
  );
}
