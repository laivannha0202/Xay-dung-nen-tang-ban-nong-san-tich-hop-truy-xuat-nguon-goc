'use client';

import {
  Badge,
  Box,
  Button,
  Group,
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconGift,
  IconHistory,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  DIEM_THUONG_TONG_QUAN_QUERY_KEY,
  diemThuongGiaoDichQueryKey,
  layGiaoDichDiemThuongKhach,
  layTongQuanDiemThuongKhach,
} from '@/lib/api-diem-thuong';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const GIOI_HAN = 20;

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function dinhDangDiem(value: number): string {
  const dau = value > 0 ? '+' : '';
  return `${dau}${value.toLocaleString('vi-VN')} điểm`;
}

export function DiemThuongContent() {
  const [trang, setTrang] = useState(1);
  const daDangNhap = layPhienKhachHang() !== null;

  const tongQuanQuery = useQuery({
    queryKey: DIEM_THUONG_TONG_QUAN_QUERY_KEY,
    queryFn: layTongQuanDiemThuongKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  const giaoDichQuery = useQuery({
    queryKey: diemThuongGiaoDichQueryKey(trang, GIOI_HAN),
    queryFn: () => layGiaoDichDiemThuongKhach(trang, GIOI_HAN),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để xem điểm thưởng"
          moTa="Số dư và lịch sử điểm chỉ hiển thị cho đúng tài khoản AgriMarket."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/diem-thuong">
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (tongQuanQuery.isPending || giaoDichQuery.isPending) {
    return (
      <AgriContainer py={{ base: 40, md: 56 }}>
        <AgriSkeleton soLuong={6} />
      </AgriContainer>
    );
  }

  if (
    tongQuanQuery.isError ||
    giaoDichQuery.isError ||
    !tongQuanQuery.data ||
    !giaoDichQuery.data
  ) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không tải được điểm thưởng"
          moTa="AgriMarket chưa thể tải số dư và lịch sử điểm của tài khoản này."
          onThuLai={() => {
            void Promise.all([tongQuanQuery.refetch(), giaoDichQuery.refetch()]);
          }}
        />
      </AgriContainer>
    );
  }

  const tongQuan = tongQuanQuery.data;
  const giaoDich = giaoDichQuery.data;
  const tongTrang = Math.max(1, Math.ceil(giaoDich.tong / giaoDich.gioiHan));

  return (
    <Box bg="#F7FAF8" mih="100%">
      <AgriContainer py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Stack gap={8}>
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
            <Group gap="md" align="center">
              <ThemeIcon size={52} radius="lg" color="agrimarket" variant="light">
                <IconGift size={27} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={1}>Điểm thưởng</Title>
                <Text c="dimmed">Theo dõi số dư và các lần thay đổi điểm trong tài khoản.</Text>
              </Stack>
            </Group>
          </Stack>

          <Paper radius="xl" p={{ base: 'lg', md: 'xl' }} bg="#075E3B">
            <Group justify="space-between" align="flex-start" gap="xl">
              <Stack gap={5}>
                <Text size="xs" fw={800} tt="uppercase" lts={1} c="#CDEBDC">
                  Số dư hiện tại
                </Text>
                <Group gap="xs" align="baseline">
                  <Text fz={{ base: 42, md: 52 }} fw={900} c="white" lh={1}>
                    {tongQuan.diem.toLocaleString('vi-VN')}
                  </Text>
                  <Text fw={800} c="#DDF3E7">điểm</Text>
                </Group>
                <Text size="sm" c="#D6EADF">
                  {tongQuan.tongGiaoDich.toLocaleString('vi-VN')} giao dịch điểm đã được ghi nhận
                  {tongQuan.capNhatLuc ? ` · cập nhật ${dinhDangNgay(tongQuan.capNhatLuc)}` : ''}.
                </Text>
              </Stack>
              <ThemeIcon size={58} radius="xl" variant="white" color="agrimarket">
                <IconGift size={30} />
              </ThemeIcon>
            </Group>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Group gap="md" align="flex-start">
                <ThemeIcon size={42} radius="lg" color="agrimarket" variant="light">
                  <IconHistory size={22} />
                </ThemeIcon>
                <Stack gap={3}>
                  <Text fw={850}>Lịch sử minh bạch</Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    Mỗi biến động hiển thị số điểm tăng hoặc giảm và số dư ngay sau giao dịch.
                  </Text>
                </Stack>
              </Group>
            </Paper>
            <Paper withBorder radius="lg" p="lg" bg="white">
              <Group gap="md" align="flex-start">
                <ThemeIcon size={42} radius="lg" color="agrimarket" variant="light">
                  <IconShieldCheck size={22} />
                </ThemeIcon>
                <Stack gap={3}>
                  <Text fw={850}>Dữ liệu từ tài khoản</Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    Số điểm được lấy trực tiếp từ sổ điểm AgriMarket. Tùy chọn dùng điểm khi thanh toán chỉ hiển thị khi chương trình áp dụng hỗ trợ.
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </SimpleGrid>

          <Stack gap="md">
            <Group justify="space-between" align="end" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Title order={2}>Lịch sử điểm</Title>
                <Text size="sm" c="dimmed">
                  {giaoDich.tong.toLocaleString('vi-VN')} giao dịch
                </Text>
              </Stack>
              {giaoDich.tong > 0 ? (
                <Badge color="agrimarket" variant="light" size="lg">
                  Trang {giaoDich.trang}/{tongTrang}
                </Badge>
              ) : null}
            </Group>

            {giaoDich.items.length === 0 ? (
              <Paper withBorder radius="lg" p="xl" bg="white">
                <EmptyState
                  tieuDe="Chưa có giao dịch điểm"
                  moTa="Khi tài khoản phát sinh điểm, lịch sử thay đổi sẽ được hiển thị tại đây."
                />
              </Paper>
            ) : (
              <Stack gap="sm">
                {giaoDich.items.map((item) => {
                  const tangDiem = item.bienDongDiem >= 0;
                  return (
                    <Paper key={item.id} withBorder radius="lg" p="lg" bg="white">
                      <Group justify="space-between" align="center" gap="lg" wrap="nowrap">
                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                          <ThemeIcon
                            size={44}
                            radius="lg"
                            color={tangDiem ? 'agrimarket' : 'red'}
                            variant="light"
                          >
                            {tangDiem ? <IconArrowUp size={22} /> : <IconArrowDown size={22} />}
                          </ThemeIcon>
                          <Stack gap={3} style={{ minWidth: 0 }}>
                            <Text fw={800} lineClamp={2}>
                              {item.lyDo?.trim() || 'Điều chỉnh điểm thưởng'}
                            </Text>
                            <Text size="xs" c="dimmed">{dinhDangNgay(item.createdAt)}</Text>
                            <Text size="xs" c="dimmed">
                              Số dư sau giao dịch: {item.soDuSau.toLocaleString('vi-VN')} điểm
                            </Text>
                          </Stack>
                        </Group>
                        <Text fw={900} c={tangDiem ? 'agrimarket.7' : 'red.7'} ta="right">
                          {dinhDangDiem(item.bienDongDiem)}
                        </Text>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            {tongTrang > 1 ? (
              <Group justify="center" mt="sm">
                <Pagination
                  value={trang}
                  onChange={setTrang}
                  total={tongTrang}
                  color="agrimarket"
                  radius="md"
                />
              </Group>
            ) : null}
          </Stack>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
