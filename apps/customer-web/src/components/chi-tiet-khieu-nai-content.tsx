'use client';

import { metaTrangThaiVanChuyen, type SemanticTone } from '@agrimarket/api-client';
import {
  Badge,
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
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBox,
  IconExternalLink,
  IconFileDescription,
  IconMapPin,
  IconPackage,
  IconPhoto,
  IconRoute,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { layChiTietKhieuNaiKhach, nhanLyDoKhieuNaiKhach } from '@/lib/api-khieu-nai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function mauTheoTone(tone: SemanticTone): string {
  if (tone === 'success') return 'green';
  if (tone === 'danger') return 'red';
  if (tone === 'warning') return 'orange';
  if (tone === 'info') return 'blue';
  return 'gray';
}

export function ChiTietKhieuNaiContent({ khieuNaiId }: { khieuNaiId: string }) {
  const daDangNhap = layPhienKhachHang() !== null;

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'detail', khieuNaiId],
    queryFn: () => layChiTietKhieuNaiKhach(khieuNaiId),
    enabled: daDangNhap && Boolean(khieuNaiId),
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem yêu cầu hỗ trợ"
          moTa="Chi tiết yêu cầu chỉ hiển thị cho đúng chủ tài khoản."
          hanhDong={
            <Button component={Link} href={`/dang-nhap?next=/khieu-nai/${khieuNaiId}`}>
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (query.isPending) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không tải được chi tiết yêu cầu"
          moTa="Yêu cầu không tồn tại, không thuộc tài khoản hoặc hệ thống đang tạm thời không phản hồi."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  const request = query.data;

  return (
    <Box bg="#F7FAF8" mih="100%">
      <AgriContainer py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Stack gap={6}>
            <Button
              component={Link}
              href="/khieu-nai"
              variant="subtle"
              color="agrimarket"
              px={0}
              w="fit-content"
              leftSection={<IconArrowLeft size={16} />}
            >
              Quay lại yêu cầu hỗ trợ
            </Button>
            <Group gap="md" align="center" wrap="wrap">
              <ThemeIcon size={50} radius="lg" color="orange" variant="light">
                <IconFileDescription size={26} />
              </ThemeIcon>
              <Stack gap={3}>
                <Group gap="sm" wrap="wrap">
                  <Title order={1}>{request.mucDonHang.tenSanPham}</Title>
                  <Badge color="orange" variant="light" size="lg">
                    {nhanLyDoKhieuNaiKhach(request.lyDo)}
                  </Badge>
                </Group>
                <Text c="dimmed">
                  Đơn {request.donHang.maDonHang} · gửi lúc {dinhDangNgay(request.createdAt)}
                </Text>
              </Stack>
            </Group>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size={38} radius="lg" color="agrimarket" variant="light">
                    <IconPackage size={20} />
                  </ThemeIcon>
                  <Text fw={850} fz="lg">Đơn hàng và sản phẩm</Text>
                </Group>
                <Group justify="space-between" gap="md">
                  <Text c="dimmed">Mã đơn</Text>
                  <Text fw={700}>{request.donHang.maDonHang}</Text>
                </Group>
                <Group justify="space-between" gap="md">
                  <Text c="dimmed">Nhà cung cấp</Text>
                  <Text fw={700} ta="right">{request.donNhaCungCap.tenNhaCungCap}</Text>
                </Group>
                <Group justify="space-between" gap="md">
                  <Text c="dimmed">SKU</Text>
                  <Text fw={700}>{request.mucDonHang.sku}</Text>
                </Group>
                <Group justify="space-between" gap="md">
                  <Text c="dimmed">Số lượng</Text>
                  <Text fw={700}>{request.mucDonHang.soLuong}</Text>
                </Group>
                <Group justify="space-between" gap="md">
                  <Text c="dimmed">Thành tiền</Text>
                  <Text fw={850} c="agrimarket.8">{dinhDangGia(request.mucDonHang.thanhTien)}</Text>
                </Group>
                <Divider />
                <Button component={Link} href={`/don-hang/${request.donHang.id}`} variant="light">
                  Mở chi tiết đơn hàng
                </Button>
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size={38} radius="lg" color="orange" variant="light">
                    <IconFileDescription size={20} />
                  </ThemeIcon>
                  <Text fw={850} fz="lg">Nội dung yêu cầu</Text>
                </Group>
                <Badge color="orange" variant="light" w="fit-content">
                  {nhanLyDoKhieuNaiKhach(request.lyDo)}
                </Badge>
                <Text lh={1.65}>{request.moTa}</Text>
                <Text size="sm" c="dimmed">
                  Cập nhật gần nhất {dinhDangNgay(request.updatedAt)}
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>

          <Stack gap="md">
            <Group gap="sm">
              <IconPhoto size={22} />
              <Title order={2}>Ảnh bằng chứng</Title>
            </Group>
            {request.bangChung.length === 0 ? (
              <Card withBorder radius="lg" padding="lg" bg="white">
                <Text c="dimmed">Yêu cầu này không có ảnh bằng chứng đính kèm.</Text>
              </Card>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {request.bangChung.map((evidence) => (
                  <Card key={evidence.id} withBorder radius="lg" padding="sm" bg="white">
                    <Stack gap="sm">
                      {evidence.urlXem && evidence.mimeType.startsWith('image/') ? (
                        <Image
                          src={evidence.urlXem}
                          alt={evidence.tenGoc}
                          h={220}
                          radius="md"
                          fit="cover"
                        />
                      ) : (
                        <Box h={180} bg="#F0F5F2" style={{ display: 'grid', placeItems: 'center', borderRadius: 12 }}>
                          <IconPhoto size={36} color="#748078" />
                        </Box>
                      )}
                      <Text fw={700} lineClamp={2}>{evidence.tenGoc}</Text>
                      <Text size="xs" c="dimmed">{dinhDangNgay(evidence.createdAt)}</Text>
                      {evidence.urlXem ? (
                        <Button
                          component="a"
                          href={evidence.urlXem}
                          target="_blank"
                          rel="noreferrer"
                          variant="light"
                          rightSection={<IconExternalLink size={15} />}
                        >
                          Xem ảnh gốc
                        </Button>
                      ) : null}
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size={38} radius="lg" color="agrimarket" variant="light">
                    <IconRoute size={20} />
                  </ThemeIcon>
                  <Text fw={850} fz="lg">Lô hàng liên quan</Text>
                </Group>
                {request.phanBo.length === 0 ? (
                  <Text c="dimmed" size="sm">Chưa có thông tin lô hàng liên quan.</Text>
                ) : (
                  request.phanBo.map((allocation) => (
                    <Card key={allocation.tonKhoLoId} withBorder radius="md" padding="md">
                      <Stack gap="xs">
                        <Group justify="space-between" wrap="wrap">
                          <Group gap={7}>
                            <IconBox size={17} />
                            <Text fw={800}>Lô {allocation.maLo}</Text>
                          </Group>
                          <Badge variant="light">SL {allocation.soLuong}</Badge>
                        </Group>
                        <Group gap={6} c="dimmed">
                          <IconMapPin size={15} />
                          <Text size="sm">Kho {allocation.maKho}</Text>
                        </Group>
                        {allocation.maTruyXuat ? (
                          <Button
                            component={Link}
                            href={`/truy-xuat?ma=${encodeURIComponent(allocation.maTruyXuat)}`}
                            variant="light"
                            color="agrimarket"
                            size="sm"
                          >
                            Truy xuất nguồn gốc
                          </Button>
                        ) : null}
                      </Stack>
                    </Card>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="lg" bg="white">
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size={38} radius="lg" color="blue" variant="light">
                    <IconTruckDelivery size={20} />
                  </ThemeIcon>
                  <Text fw={850} fz="lg">Vận chuyển liên quan</Text>
                </Group>
                {request.vanChuyen.length === 0 ? (
                  <Text c="dimmed" size="sm">Chưa có vận đơn liên quan.</Text>
                ) : (
                  request.vanChuyen.map((shipment) => {
                    const meta = metaTrangThaiVanChuyen(shipment.trangThai);
                    return (
                      <Card key={shipment.id} withBorder radius="md" padding="md">
                        <Group justify="space-between" align="flex-start" wrap="wrap">
                          <Stack gap={3}>
                            <Text fw={800}>{shipment.maVanDon}</Text>
                            <Text size="xs" c="dimmed">Cập nhật {dinhDangNgay(shipment.updatedAt)}</Text>
                          </Stack>
                          <Badge color={mauTheoTone(meta.tone)} variant="light">
                            {meta.label}
                          </Badge>
                        </Group>
                      </Card>
                    );
                  })
                )}
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
