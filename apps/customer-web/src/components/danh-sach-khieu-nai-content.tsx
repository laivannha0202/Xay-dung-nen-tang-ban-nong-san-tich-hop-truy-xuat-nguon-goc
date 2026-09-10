'use client';

import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconFileDescription,
  IconPhoto,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  LY_DO_KHIEU_NAI,
  layDanhSachKhieuNaiKhach,
  nhanLyDoKhieuNaiKhach,
  type LyDoKhieuNaiKhach,
} from '@/lib/api-khieu-nai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const GIOI_HAN = 12;

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function DanhSachKhieuNaiContent() {
  const daDangNhap = layPhienKhachHang() !== null;
  const [trang, setTrang] = useState(1);
  const [lyDo, setLyDo] = useState<LyDoKhieuNaiKhach | null>(null);

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'list', trang, lyDo],
    queryFn: () =>
      layDanhSachKhieuNaiKhach({
        trang,
        gioiHan: GIOI_HAN,
        ...(lyDo ? { lyDo } : {}),
      }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem yêu cầu hỗ trợ"
          moTa="Các yêu cầu liên quan đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/khieu-nai">
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
          tieuDe="Không tải được yêu cầu hỗ trợ"
          moTa="AgriMarket chưa thể tải lịch sử yêu cầu của tài khoản này."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));

  return (
    <Box bg="#F7FAF8" mih="100%">
      <AgriContainer py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={6}>
              <Button
                component={Link}
                href="/tai-khoan"
                variant="subtle"
                color="agrimarket"
                px={0}
                w="fit-content"
                leftSection={<IconArrowLeft size={16} />}
              >
                Quay lại tài khoản
              </Button>
              <Group gap="md" align="center" wrap="nowrap">
                <ThemeIcon size={50} radius="lg" color="orange" variant="light">
                  <IconFileDescription size={26} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Title order={1}>Yêu cầu hỗ trợ</Title>
                  <Text c="dimmed">{query.data.tong} yêu cầu đã được AgriMarket ghi nhận.</Text>
                </Stack>
              </Group>
            </Stack>

            <Select
              label="Lọc theo vấn đề"
              placeholder="Tất cả lý do"
              clearable
              data={LY_DO_KHIEU_NAI.map((item) => ({ value: item.value, label: item.label }))}
              value={lyDo}
              onChange={(value) => {
                setLyDo(value as LyDoKhieuNaiKhach | null);
                setTrang(1);
              }}
              w={{ base: '100%', sm: 260 }}
            />
          </Group>

          <Card withBorder radius="lg" padding="lg" bg="white">
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon size={42} radius="lg" color="agrimarket" variant="light">
                <IconShieldCheck size={22} />
              </ThemeIcon>
              <Stack gap={3}>
                <Text fw={800}>Hỗ trợ gắn với đúng đơn hàng</Text>
                <Text size="sm" c="dimmed" maw={780}>
                  Bạn có thể gửi yêu cầu từ chi tiết đơn hàng khi sản phẩm đã giao có vấn đề và
                  đính kèm ảnh bằng chứng nếu cần.
                </Text>
              </Stack>
            </Group>
          </Card>

          {query.data.items.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có yêu cầu hỗ trợ"
              moTa={
                lyDo
                  ? 'Không có yêu cầu nào phù hợp với bộ lọc hiện tại.'
                  : 'Nếu cần hỗ trợ về sản phẩm đã mua, hãy mở chi tiết đơn hàng để gửi yêu cầu.'
              }
              hanhDong={
                <Button component={Link} href="/don-hang" variant="light">
                  Xem đơn hàng
                </Button>
              }
            />
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {query.data.items.map((item) => (
                <Card key={item.id} withBorder radius="lg" padding="lg" bg="white">
                  <Stack gap="md" h="100%">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                        <ThemeIcon size={40} radius="lg" color="orange" variant="light">
                          <IconAlertCircle size={21} />
                        </ThemeIcon>
                        <Stack gap={3} style={{ minWidth: 0 }}>
                          <Text fw={850} fz="lg" lineClamp={2}>
                            {item.tenSanPham}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Đơn {item.maDonHang}
                          </Text>
                        </Stack>
                      </Group>
                      <Badge color="orange" variant="light">
                        {nhanLyDoKhieuNaiKhach(item.lyDo)}
                      </Badge>
                    </Group>

                    <Group gap="lg" c="dimmed">
                      <Group gap={6}>
                        <IconPhoto size={16} />
                        <Text size="sm">{item.soBangChung} bằng chứng</Text>
                      </Group>
                      <Text size="sm">{dinhDangNgay(item.createdAt)}</Text>
                    </Group>

                    <Button
                      component={Link}
                      href={`/khieu-nai/${item.id}`}
                      variant="light"
                      color="agrimarket"
                      mt="auto"
                    >
                      Xem chi tiết
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {query.data.tong > query.data.gioiHan ? (
            <Group justify="center">
              <Pagination
                value={trang}
                total={tongTrang}
                onChange={setTrang}
                color="agrimarket"
              />
            </Group>
          ) : null}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
