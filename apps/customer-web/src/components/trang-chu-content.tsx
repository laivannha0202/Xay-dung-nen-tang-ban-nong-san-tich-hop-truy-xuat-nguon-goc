'use client';

import {
  useLayChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
} from '@agrimarket/api-client';
import {
  Box,
  Button,
  Card,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { FarmCard } from './farm-card';
import { ProductCard } from './product-card';

const GIOI_HAN_TRANG_CHU = 24;
const SO_SAN_PHAM_SECTION = 6;
const SO_SAN_PHAM_MOI_THU_HOACH = 3;

type TieuDeSectionProps = {
  nhan?: string;
  tieuDe: string;
  moTa: string;
  hanhDong?: ReactNode;
};

function TieuDeSection({ nhan, tieuDe, moTa, hanhDong }: TieuDeSectionProps) {
  return (
    <Group justify="space-between" align="flex-end" gap="lg">
      <Stack gap={6} maw={680}>
        {nhan ? <AgriBadge>{nhan}</AgriBadge> : null}
        <Title order={2}>{tieuDe}</Title>
        <Text c="dimmed">{moTa}</Text>
      </Stack>
      {hanhDong}
    </Group>
  );
}

function anhSanPham(url: string | null, ten: string) {
  if (!url) return undefined;

  return <Image src={url} alt={ten} h="100%" fit="cover" loading="lazy" />;
}

function nhanSanPham(item: {
  danhMuc: { ten: string };
  chungNhan: Array<{ loai: string }>;
  khaDung: { coTheDatHang: boolean };
}) {
  const labels = [item.danhMuc.ten];
  if (item.chungNhan[0]?.loai) labels.push(item.chungNhan[0].loai);
  if (!item.khaDung.coTheDatHang) labels.push('Tạm hết hàng');
  return labels.slice(0, 2);
}

function SanPhamMoiThuHoach({ id, fallbackTen }: { id: string; fallbackTen: string }) {
  const { data, isPending, isError } = useLayChiTietSanPhamCongKhai(id);
  const item = data?.data;

  if (isPending) {
    return (
      <Card withBorder radius="lg" padding="md">
        <Stack gap="sm">
          <Box h={160} bg="agrimarket.0" />
          <Text fw={600}>{fallbackTen}</Text>
          <Text size="sm" c="dimmed">
            Đang đọc dữ liệu thu hoạch...
          </Text>
        </Stack>
      </Card>
    );
  }

  if (isError || !item) return null;

  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;
  if (!thuHoach) return null;

  return (
    <ProductCard
      ten={item.ten}
      tenTrangTrai={item.trangTrai.ten}
      giaTu={item.gia.tu}
      donVi="đơn vị"
      href={`/san-pham/${item.id}`}
      anh={anhSanPham(item.anhBiaUrl, item.ten)}
      nhan={[`Thu hoạch ${thuHoach.ngayThuHoach}`, thuHoach.cayTrong]}
    />
  );
}

function chuanHoa(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function TrangChuContent() {
  const { data, isPending, isError, refetch } = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: GIOI_HAN_TRANG_CHU,
  });

  const response = data?.data;
  const sanPham = response?.duLieu ?? [];

  const danhMuc = Array.from(
    sanPham
      .reduce(
        (map, item) => {
          const current = map.get(item.danhMuc.id);
          map.set(item.danhMuc.id, {
            ...item.danhMuc,
            soSanPham: (current?.soSanPham ?? 0) + 1,
          });
          return map;
        },
        new Map<
          string,
          {
            id: string;
            ten: string;
            slug: string;
            soSanPham: number;
          }
        >(),
      )
      .values(),
  )
    .sort((a, b) => b.soSanPham - a.soSanPham)
    .slice(0, 8);

  const trangTrai = Array.from(
    sanPham
      .reduce(
        (map, item) => {
          const current = map.get(item.trangTrai.id);
          map.set(item.trangTrai.id, {
            ...item.trangTrai,
            soSanPham: (current?.soSanPham ?? 0) + 1,
            daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0,
          });
          return map;
        },
        new Map<
          string,
          {
            id: string;
            ma: string;
            ten: string;
            diaChi: string;
            soSanPham: number;
            daXacMinh: boolean;
          }
        >(),
      )
      .values(),
  )
    .sort(
      (a, b) =>
        Number(b.daXacMinh) - Number(a.daXacMinh) ||
        b.soSanPham - a.soSanPham ||
        a.ten.localeCompare(b.ten, 'vi'),
    )
    .slice(0, 4);

  const organic = sanPham
    .filter((item) =>
      item.chungNhan.some((chungNhan) => {
        const value = chuanHoa(chungNhan.loai);
        return value.includes('organic') || value.includes('huu co');
      }),
    )
    .slice(0, SO_SAN_PHAM_SECTION);

  const conHang = sanPham.filter((item) => item.khaDung.coTheDatHang);

  const goiY = [...sanPham]
    .sort(
      (a, b) =>
        Number(b.khaDung.coTheDatHang) - Number(a.khaDung.coTheDatHang) ||
        b.chungNhan.length - a.chungNhan.length ||
        b.khaDung.soLuongKhaDung - a.khaDung.soLuongKhaDung ||
        a.gia.tu - b.gia.tu ||
        a.ten.localeCompare(b.ten, 'vi'),
    )
    .slice(0, SO_SAN_PHAM_SECTION);

  const theoMua = Array.from(
    conHang.reduce((map, item) => {
      if (!map.has(item.danhMuc.id)) {
        map.set(item.danhMuc.id, item);
      }
      return map;
    }, new Map<string, (typeof conHang)[number]>()),
  )
    .map(([, item]) => item)
    .slice(0, SO_SAN_PHAM_SECTION);

  const moiThuHoach = (conHang.length > 0 ? conHang : sanPham).slice(0, SO_SAN_PHAM_MOI_THU_HOACH);

  const cardSanPham = (item: (typeof sanPham)[number], labels = nhanSanPham(item)) => (
    <ProductCard
      key={item.id}
      ten={item.ten}
      tenTrangTrai={item.trangTrai.ten}
      giaTu={item.gia.tu}
      donVi="đơn vị"
      href={`/san-pham/${item.id}`}
      anh={anhSanPham(item.anhBiaUrl, item.ten)}
      nhan={labels}
    />
  );

  return (
    <>
      <Box
        py={{ base: 48, md: 84 }}
        bg="agrimarket.0"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 36, md: 64 }} verticalSpacing="xl">
            <Stack gap="xl" justify="center">
              <Group gap="xs">
                <AgriBadge>Nông sản minh bạch</AgriBadge>
                <AgriBadge loai="chung-nhan">Truy xuất nguồn gốc</AgriBadge>
              </Group>

              <Stack gap="md">
                <Title order={1} fz={{ base: 42, sm: 58, lg: 68 }} lh={1.04} c="agrimarket.9">
                  Nông sản rõ nguồn gốc, gần hơn với người mua
                </Title>
                <Text size="lg" c="dimmed" maw={640}>
                  Khám phá nông sản từ các trang trại, xem chứng nhận và kết nối với dữ liệu truy
                  xuất trên cùng một nền tảng.
                </Text>
              </Stack>

              <Group>
                <Button component="a" href="#goi-y" size="lg">
                  Khám phá nông sản
                </Button>
                <Button component={Link} href="/truy-xuat" variant="default" size="lg">
                  Truy xuất sản phẩm
                </Button>
              </Group>
            </Stack>

            <Paper radius="xl" p={{ base: 'xl', md: 36 }} bg="agrimarket.8" c="white">
              <Stack h="100%" justify="space-between" gap={48}>
                <ThemeIcon size={64} radius="xl" color="white" variant="light" aria-hidden="true">
                  QR
                </ThemeIcon>

                <Stack gap="sm">
                  <Title order={2} c="white">
                    Từ trang trại đến bàn ăn
                  </Title>
                  <Text c="agrimarket.0">
                    Thông tin sản phẩm, trang trại, chứng nhận và khả dụng được lấy từ Backend
                    AgriMarket.
                  </Text>
                </Stack>

                <SimpleGrid cols={3}>
                  <Stack gap={0}>
                    <Text fw={700} fz="xl">
                      {response?.tong ?? 0}
                    </Text>
                    <Text size="xs" c="agrimarket.1">
                      sản phẩm
                    </Text>
                  </Stack>
                  <Stack gap={0}>
                    <Text fw={700} fz="xl">
                      {danhMuc.length}
                    </Text>
                    <Text size="xs" c="agrimarket.1">
                      danh mục
                    </Text>
                  </Stack>
                  <Stack gap={0}>
                    <Text fw={700} fz="xl">
                      {trangTrai.length}
                    </Text>
                    <Text size="xs" c="agrimarket.1">
                      trang trại
                    </Text>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Paper>
          </SimpleGrid>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 48, md: 72 }}>
        {isPending ? (
          <Stack gap="xl">
            <TieuDeSection
              nhan="Đang tải"
              tieuDe="Nông sản từ AgriMarket"
              moTa="Đang lấy dữ liệu sản phẩm công khai."
            />
            <AgriSkeleton soLuong={6} />
          </Stack>
        ) : isError ? (
          <ErrorState
            tieuDe="Không tải được Trang chủ"
            moTa="Không thể lấy danh sách sản phẩm công khai từ API."
            onThuLai={() => {
              void refetch();
            }}
          />
        ) : sanPham.length === 0 ? (
          <EmptyState
            tieuDe="Chưa có nông sản công khai"
            moTa="Trang chủ sẽ tự hiển thị dữ liệu khi sản phẩm được công khai."
          />
        ) : (
          <Stack gap={80}>
            <Box component="section" aria-labelledby="danh-muc">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Danh mục"
                  tieuDe="Khám phá theo nhóm nông sản"
                  moTa="Các danh mục được tổng hợp trực tiếp từ sản phẩm công khai."
                />

                <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
                  {danhMuc.map((item) => (
                    <Card key={item.id} withBorder radius="lg" padding="lg">
                      <Stack gap={6}>
                        <Title order={3} fz="md">
                          {item.ten}
                        </Title>
                        <Text size="sm" c="dimmed">
                          {item.soSanPham} sản phẩm
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Box>

            <Box component="section" id="moi-thu-hoach" aria-labelledby="moi-thu-hoach-title">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Mới thu hoạch"
                  tieuDe="Thông tin thu hoạch gần nhất"
                  moTa="Section đọc chi tiết sản phẩm để hiển thị ngày thu hoạch thật từ Backend."
                />

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {moiThuHoach.map((item) => (
                    <SanPhamMoiThuHoach key={item.id} id={item.id} fallbackTen={item.ten} />
                  ))}
                </SimpleGrid>
              </Stack>
            </Box>

            <Box component="section" aria-labelledby="organic-title">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Organic"
                  tieuDe="Nông sản có chứng nhận hữu cơ"
                  moTa="Chỉ hiển thị sản phẩm có chứng nhận Organic/Hữu cơ từ API."
                />

                {organic.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {organic.map((item) => cardSanPham(item, ['Organic', item.danhMuc.ten]))}
                  </SimpleGrid>
                ) : (
                  <EmptyState
                    tieuDe="Chưa có sản phẩm Organic"
                    moTa="Không gắn nhãn Organic nếu API chưa có chứng nhận phù hợp."
                  />
                )}
              </Stack>
            </Box>

            <Box component="section" aria-labelledby="trang-trai-title">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Trang trại nổi bật"
                  tieuDe="Nguồn cung đang có nhiều nông sản"
                  moTa="Xếp hạng rule-based theo chứng nhận và số sản phẩm xuất hiện trong feed."
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                  {trangTrai.map((item) => (
                    <FarmCard
                      key={item.id}
                      ten={item.ten}
                      diaChi={item.diaChi}
                      soSanPham={item.soSanPham}
                      daXacMinh={item.daXacMinh}
                      href={`/trang-trai/${item.id}`}
                    />
                  ))}
                </SimpleGrid>
              </Stack>
            </Box>

            <Box component="section" aria-labelledby="theo-mua-title">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Theo mùa"
                  tieuDe="Lựa chọn đa dạng theo nhóm nông sản"
                  moTa="Gợi ý rule-based: ưu tiên còn hàng và mỗi danh mục một sản phẩm; không giả dữ liệu mùa vụ chưa có trong list API."
                />

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {theoMua.map((item) => cardSanPham(item, ['Theo mùa', item.danhMuc.ten]))}
                </SimpleGrid>
              </Stack>
            </Box>

            <Box component="section" id="goi-y" aria-labelledby="goi-y-title">
              <Stack gap="xl">
                <TieuDeSection
                  nhan="Gợi ý"
                  tieuDe="Gợi ý cho bạn hôm nay"
                  moTa="Recommendation MVP xếp hạng theo khả dụng, chứng nhận và lượng tồn."
                  hanhDong={
                    <Button component={Link} href="/san-pham" variant="subtle">
                      Xem tất cả
                    </Button>
                  }
                />

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  {goiY.map((item) => cardSanPham(item))}
                </SimpleGrid>
              </Stack>
            </Box>
          </Stack>
        )}
      </AgriContainer>
    </>
  );
}
