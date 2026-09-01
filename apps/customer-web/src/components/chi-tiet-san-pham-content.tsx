'use client';

import {
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { ProductCard } from './product-card';

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function dinhDangSoLuong(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(value);
}

function anhCard(url: string | null, ten: string) {
  if (!url) return undefined;

  return <Image src={url} alt={ten} h="100%" fit="cover" loading="lazy" />;
}

export function ChiTietSanPhamContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);

  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);

  const item = data?.data;

  const bienTheDaChon = useMemo(() => {
    if (!item) return null;
    return (
      item.bienThe.find((bienThe) => bienThe.id === bienTheDaChonId) ?? item.bienThe[0] ?? null
    );
  }, [item, bienTheDaChonId]);

  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort(
      (a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu,
    );
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;

  if (isPending) {
    return (
      <AgriContainer py={{ base: 36, md: 56 }}>
        <AgriSkeleton soLuong={3} />
      </AgriContainer>
    );
  }

  if (isError || !item) {
    return (
      <AgriContainer py={{ base: 36, md: 56 }}>
        <ErrorState
          tieuDe="Không tải được sản phẩm"
          moTa="Sản phẩm có thể không còn công khai hoặc API đang tạm thời không khả dụng."
          onThuLai={() => {
            void refetch();
          }}
        />
      </AgriContainer>
    );
  }

  const related = relatedData?.data.duLieu ?? [];
  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;

  return (
    <AgriContainer py={{ base: 32, md: 52 }}>
      <Stack gap={64}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Stack gap="md">
            <Paper withBorder radius="xl" bg="gray.0" style={{ overflow: 'hidden' }}>
              <Box
                h={{ base: 320, sm: 440 }}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {anhDangXem ? (
                  <Image src={anhDangXem.url} alt={item.ten} h="100%" w="100%" fit="cover" />
                ) : (
                  <Stack align="center" gap="xs">
                    <ThemeIcon size={64} radius="xl" variant="light" color="agrimarket">
                      SP
                    </ThemeIcon>
                    <Text c="dimmed">Chưa có ảnh sản phẩm</Text>
                  </Stack>
                )}
              </Box>
            </Paper>

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
                        border: dangChon
                          ? '2px solid var(--mantine-color-agrimarket-7)'
                          : '1px solid var(--mantine-color-default-border)',
                        borderRadius: 'var(--mantine-radius-md)',
                        overflow: 'hidden',
                      }}
                    >
                      <Image src={anh.url} alt="" h={76} w="100%" fit="cover" />
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            ) : null}
          </Stack>

          <Stack gap="xl">
            <Stack gap="sm">
              <Group gap="xs">
                <AgriBadge>{item.danhMuc.ten}</AgriBadge>
                {item.chungNhan.slice(0, 2).map((chungNhan) => (
                  <AgriBadge key={`${chungNhan.loai}-${chungNhan.ma}`} loai="chung-nhan">
                    {chungNhan.loai}
                  </AgriBadge>
                ))}
              </Group>

              <Title order={1}>{item.ten}</Title>

              <Text c="dimmed">{item.moTa ?? 'Sản phẩm chưa có mô tả chi tiết.'}</Text>
            </Stack>

            <Divider />

            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Giá theo biến thể
              </Text>
              <Title order={2} c="agrimarket.8">
                {bienTheDaChon
                  ? `${dinhDangGia(bienTheDaChon.gia)} ₫`
                  : `${dinhDangGia(item.gia.tu)} ₫`}
              </Title>
              {item.gia.tu !== item.gia.den ? (
                <Text size="sm" c="dimmed">
                  Khoảng giá {dinhDangGia(item.gia.tu)} – {dinhDangGia(item.gia.den)} ₫
                </Text>
              ) : null}
            </Stack>

            <Stack gap="sm">
              <Text fw={600}>Chọn biến thể</Text>
              <Group gap="sm">
                {item.bienThe.map((bienThe) => {
                  const dangChon = bienThe.id === bienTheDaChon?.id;
                  const hetHang = bienThe.soLuongKhaDung <= 0;
                  return (
                    <Button
                      key={bienThe.id}
                      variant={dangChon ? 'filled' : 'default'}
                      color={dangChon ? 'agrimarket' : undefined}
                      disabled={hetHang}
                      onClick={() => setBienTheDaChonId(bienThe.id)}
                    >
                      {dinhDangSoLuong(bienThe.khoiLuong)} {bienThe.donVi}
                    </Button>
                  );
                })}
              </Group>
            </Stack>

            <Paper withBorder radius="lg" p="lg">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600}>Tồn khả dụng</Text>
                  <AgriBadge
                    loai={
                      bienTheDaChon && bienTheDaChon.soLuongKhaDung > 0 ? 'tuoi-moi' : 'canh-bao'
                    }
                  >
                    {bienTheDaChon && bienTheDaChon.soLuongKhaDung > 0
                      ? 'Còn hàng'
                      : 'Tạm hết hàng'}
                  </AgriBadge>
                </Group>

                <Text size="lg" fw={700}>
                  {bienTheDaChon
                    ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} khả dụng`
                    : item.khaDung.lyDo}
                </Text>

                <Text size="sm" c="dimmed">
                  Tồn do Backend tính từ InventoryLot hợp lệ; Customer Web không tự suy diễn FEFO
                  hoặc reservation.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </SimpleGrid>

        <Box component="section">
          <Stack gap="lg">
            <Title order={2}>Trang trại</Title>
            <Card withBorder radius="lg" padding="lg">
              <Group justify="space-between" align="flex-start">
                <Stack gap={6}>
                  <Title order={3}>{item.trangTrai.ten}</Title>
                  <Text c="dimmed">{item.trangTrai.diaChi}</Text>
                  <Text size="sm" c="dimmed">
                    Mã trang trại: {item.trangTrai.ma}
                  </Text>
                </Stack>

                <Button
                  component={Link}
                  href={`/san-pham?farm=${encodeURIComponent(item.trangTrai.id)}`}
                  variant="default"
                >
                  Sản phẩm cùng trang trại
                </Button>
              </Group>
            </Card>
          </Stack>
        </Box>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Box component="section">
            <Stack gap="lg">
              <Title order={2}>Thu hoạch</Title>
              {thuHoach ? (
                <Card withBorder radius="lg" padding="lg">
                  <SimpleGrid cols={2}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Ngày thu hoạch
                      </Text>
                      <Text fw={700}>{thuHoach.ngayThuHoach}</Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Cây trồng
                      </Text>
                      <Text fw={700}>{thuHoach.cayTrong}</Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Giống
                      </Text>
                      <Text fw={700}>{thuHoach.giong}</Text>
                    </Stack>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Phân loại
                      </Text>
                      <Text fw={700}>{thuHoach.phanLoai}</Text>
                    </Stack>
                  </SimpleGrid>
                </Card>
              ) : (
                <EmptyState
                  tieuDe="Chưa có thông tin thu hoạch"
                  moTa="Backend chưa trả dữ liệu thu hoạch gần nhất cho trang trại này."
                />
              )}
            </Stack>
          </Box>

          <Box component="section">
            <Stack gap="lg">
              <Title order={2}>Chứng nhận</Title>
              {item.chungNhan.length > 0 ? (
                <Stack gap="sm">
                  {item.chungNhan.map((chungNhan) => (
                    <Card
                      key={`${chungNhan.loai}-${chungNhan.ma}`}
                      withBorder
                      radius="lg"
                      padding="lg"
                    >
                      <Stack gap={6}>
                        <Group justify="space-between">
                          <Text fw={700}>{chungNhan.loai}</Text>
                          <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge>
                        </Group>
                        <Text size="sm">Mã: {chungNhan.ma}</Text>
                        <Text size="sm" c="dimmed">
                          {chungNhan.donViCap} · hết hạn {chungNhan.ngayHetHan}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  tieuDe="Chưa có chứng nhận công khai"
                  moTa="Chỉ chứng nhận đã xác minh và còn hiệu lực mới được hiển thị."
                />
              )}
            </Stack>
          </Box>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Box component="section">
            <Stack gap="lg">
              <Title order={2}>Truy xuất nguồn gốc</Title>
              <Card withBorder radius="lg" padding="lg">
                <Stack gap="sm">
                  <AgriBadge>Product ≠ Batch</AgriBadge>
                  <Text>
                    Mã truy xuất thuộc lô/QR cụ thể, không thuộc một Product chung. Vì vậy trang này
                    không gán một mã lô giả cho toàn bộ sản phẩm.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Khi có mã QR hoặc mã truy xuất trên lô hàng thực tế, người mua sẽ dùng luồng
                    truy xuất công khai để xem timeline đúng lô.
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </Box>

          <Box component="section">
            <Stack gap="lg">
              <Title order={2}>Đánh giá</Title>
              <EmptyState
                tieuDe="Chưa có đánh giá"
                moTa="Hệ thống chưa có Review Backend nên Product Detail không hiển thị sao hoặc nhận xét giả."
              />
            </Stack>
          </Box>
        </SimpleGrid>

        <Box component="section">
          <Stack gap="xl">
            <Group justify="space-between">
              <Stack gap={4}>
                <AgriBadge>Sản phẩm liên quan</AgriBadge>
                <Title order={2}>Có thể bạn cũng quan tâm</Title>
              </Stack>
              <Button
                component={Link}
                href={`/san-pham?category=${encodeURIComponent(item.danhMuc.slug)}`}
                variant="subtle"
              >
                Xem cùng danh mục
              </Button>
            </Group>

            {relatedPending ? (
              <AgriSkeleton soLuong={3} />
            ) : related.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {related.slice(0, 6).map((sanPham) => (
                  <ProductCard
                    key={sanPham.id}
                    ten={sanPham.ten}
                    tenTrangTrai={sanPham.trangTrai.ten}
                    giaTu={sanPham.gia.tu}
                    donVi="đơn vị"
                    href={`/san-pham/${sanPham.id}`}
                    anh={anhCard(sanPham.anhBiaUrl, sanPham.ten)}
                    nhan={[
                      sanPham.danhMuc.ten,
                      sanPham.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                    ]}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <EmptyState
                tieuDe="Chưa có sản phẩm liên quan"
                moTa="Backend chưa tìm thấy sản phẩm cùng danh mục hoặc trang trại."
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </AgriContainer>
  );
}
