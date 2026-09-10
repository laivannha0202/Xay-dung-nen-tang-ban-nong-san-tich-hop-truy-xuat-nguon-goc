'use client';

import {
  dinhDangQuyCachSanPham,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
  Accordion,
  Badge,
  Box,
  Button,
  Group,
  Image,
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
import {
  IconAdjustments,
  IconMapPin,
  IconSearch,
  IconSortAscending,
} from '@tabler/icons-react';
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
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
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

  const { data, isPending, isError, isFetching, refetch } =
    useLayDanhSachSanPhamCongKhai(query);
  const facetsQuery = useLayFacetsSanPhamCongKhai();

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

  const facets = facetsQuery.data?.data;
  const danhMucOptions = useMemo(
    () =>
      facets?.danhMuc.map((item) => ({
        value: item.value,
        label: `${item.label} (${item.soSanPham})`,
      })) ?? [],
    [facets?.danhMuc],
  );
  const farmOptions = useMemo(
    () =>
      facets?.trangTrai.map((item) => ({
        value: item.value,
        label: `${item.label} (${item.soSanPham})`,
      })) ?? [],
    [facets?.trangTrai],
  );
  const certificateOptions = useMemo(
    () =>
      facets?.chungNhan.map((item) => ({
        value: item.value,
        label: `${item.label} (${item.soSanPham})`,
      })) ?? [],
    [facets?.chungNhan],
  );

  function capNhatUrl(page = 1, sort = sapXepState) {
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
    if (sort !== 'PHU_HOP') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    router.replace(qs ? `/san-pham?${qs}` : '/san-pham');
  }

  function xoaBoLoc() {
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
  }

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));
  const soBoLoc = [
    query.timKiem,
    query.danhMuc,
    query.trangTraiId,
    query.tinhThanh,
    query.chungNhan,
    query.giaTu,
    query.giaDen,
    query.thuHoachTu,
    query.thuHoachDen,
    query.khaDung !== 'TAT_CA' ? query.khaDung : undefined,
  ].filter((value) => value !== undefined && value !== null && value !== '').length;

  return (
    <>
      <Box bg="#F1FAF5" py={{ base: 28, md: 38 }}>
        <AgriContainer>
          <Stack gap={8} maw={820}>
            <Text fw={850} size="sm" c="agrimarket.7" tt="uppercase" lts={1.4}>
              Khám phá AgriMarket
            </Text>
            <Title order={1} fz={{ base: 34, md: 46 }} fw={900}>
              Tìm nông sản theo nhu cầu của bạn
            </Title>
            <Text c="dimmed" size="md">
              Tìm theo tên, danh mục, trang trại, khu vực, chứng nhận, giá và thời điểm thu hoạch.
            </Text>
          </Stack>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 24, md: 34 }}>
        <Box className="farm-list-layout">
          <Paper withBorder p="lg" style={{ borderColor: '#DCE7DF' }}>
            <Stack gap="lg">
              <Group justify="space-between">
                <Group gap={8}>
                  <IconAdjustments size={19} />
                  <Text fw={850}>Bộ lọc</Text>
                  {soBoLoc > 0 ? <Badge color="agrimarket">{soBoLoc}</Badge> : null}
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter') capNhatUrl(1);
                }}
              />

              <Select
                label="Danh mục"
                clearable
                searchable
                data={danhMucOptions}
                value={danhMuc}
                placeholder={facetsQuery.isPending ? 'Đang tải...' : 'Tất cả danh mục'}
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

              <Accordion multiple defaultValue={['nguon-goc']}>
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

              {facetsQuery.isError ? (
                <Text size="xs" c="red.7">
                  Chưa tải được danh mục, trang trại và chứng nhận. Bạn vẫn có thể tìm theo từ khóa.
                </Text>
              ) : null}

              <Button fullWidth onClick={() => capNhatUrl(1)}>
                Áp dụng bộ lọc
              </Button>
            </Stack>
          </Paper>

          <Stack gap="lg" style={{ minWidth: 0 }}>
            <Group justify="space-between" align="flex-end" wrap="wrap">
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  {isFetching && !isPending ? 'Đang cập nhật...' : `${response?.tong ?? 0} sản phẩm`}
                </Text>
                <Title order={2}>Kết quả</Title>
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
                onChange={(value) => {
                  const next = sapXep(value);
                  setSapXepState(next);
                  capNhatUrl(1, next);
                }}
                w={{ base: '100%', sm: 220 }}
              />
            </Group>

            {isPending ? (
              <AgriSkeleton soLuong={8} />
            ) : isError ? (
              <ErrorState
                tieuDe="Chưa thể tải danh sách sản phẩm"
                moTa="Hệ thống đang tạm thời không phản hồi. Hãy thử lại sau ít phút."
                onThuLai={() => void refetch()}
              />
            ) : items.length === 0 ? (
              <EmptyState
                tieuDe="Không tìm thấy nông sản phù hợp"
                moTa="Thử thay đổi từ khóa hoặc bớt điều kiện lọc."
                hanhDong={
                  <Button variant="outline" onClick={xoaBoLoc}>
                    Xóa bộ lọc
                  </Button>
                }
              />
            ) : (
              <SimpleGrid cols={{ base: 2, md: 3, xl: 4 }} spacing="md">
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    ten={item.ten}
                    tenTrangTrai={item.trangTrai.ten}
                    giaTu={item.gia.tu}
                    donVi={dinhDangQuyCachSanPham(item.quyCach)}
                    href={`/san-pham/${item.id}`}
                    anh={
                      item.anhBiaUrl ? (
                        <Image
                          src={item.anhBiaUrl}
                          alt={item.ten}
                          h="100%"
                          w="100%"
                          fit="cover"
                          loading="lazy"
                        />
                      ) : undefined
                    }
                    nhan={[
                      item.chungNhan[0]?.loai || item.danhMuc.ten,
                      item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                    ]}
                  />
                ))}
              </SimpleGrid>
            )}

            {tongTrang > 1 ? (
              <Group justify="center" pt="md">
                <Pagination value={trang} total={tongTrang} onChange={(page) => capNhatUrl(page)} />
              </Group>
            ) : null}
          </Stack>
        </Box>
      </AgriContainer>
    </>
  );
}
