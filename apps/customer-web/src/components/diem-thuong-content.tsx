'use client';

import {
  Badge,
  Box,
  Button,
  Group,
  Pagination,
  Paper,
  Stack,
  Text,
  ThemeIcon,
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
import { BusinessNote, PageHeader, SectionHeading, StatGrid } from './web-page';

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
      <AgriContainer py="xl">
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

  const dangTai = tongQuanQuery.isPending || giaoDichQuery.isPending;
  const coLoi =
    tongQuanQuery.isError ||
    giaoDichQuery.isError ||
    !tongQuanQuery.data ||
    !giaoDichQuery.data;

  const tongQuan = tongQuanQuery.data;
  const giaoDich = giaoDichQuery.data;
  const tongTrang = giaoDich ? Math.max(1, Math.ceil(giaoDich.tong / giaoDich.gioiHan)) : 1;

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Quyền lợi tài khoản"
        title="Điểm thưởng"
        description="Theo dõi số dư hiện tại và toàn bộ biến động điểm được ghi nhận trong sổ điểm AgriMarket."
        actions={
          <Button
            component={Link}
            href="/tai-khoan"
            variant="subtle"
            color="agrimarket"
            leftSection={<IconArrowLeft size={16} />}
          >
            Quay lại tài khoản
          </Button>
        }
        meta={
          tongQuan ? (
            <Badge color="agrimarket" variant="light">
              {tongQuan.tongGiaoDich.toLocaleString('vi-VN')} giao dịch điểm
            </Badge>
          ) : undefined
        }
      />

      <AgriContainer py="xl">
        {dangTai ? (
          <AgriSkeleton soLuong={6} />
        ) : coLoi || !tongQuan || !giaoDich ? (
          <ErrorState
            tieuDe="Không tải được điểm thưởng"
            moTa="AgriMarket chưa thể tải số dư và lịch sử điểm của tài khoản này."
            onThuLai={() => {
              void Promise.all([tongQuanQuery.refetch(), giaoDichQuery.refetch()]);
            }}
          />
        ) : (
          <Stack gap="xl">
            <StatGrid
              items={[
                {
                  label: 'Số dư hiện tại',
                  value: `${tongQuan.diem.toLocaleString('vi-VN')} điểm`,
                  description: tongQuan.capNhatLuc ? `Cập nhật ${dinhDangNgay(tongQuan.capNhatLuc)}` : 'Số dư hiện tại của tài khoản',
                  icon: <IconGift size={21} />,
                },
                {
                  label: 'Tổng giao dịch điểm',
                  value: tongQuan.tongGiaoDich.toLocaleString('vi-VN'),
                  description: 'Bao gồm cả giao dịch cộng và trừ điểm',
                  icon: <IconHistory size={21} />,
                },
              ]}
            />

            <BusinessNote icon={<IconShieldCheck size={18} color="#087A4B" />}>
              Số điểm được lấy trực tiếp từ sổ điểm AgriMarket. Mỗi giao dịch hiển thị biến động và số dư ngay sau khi ghi nhận để bạn có thể đối chiếu.
            </BusinessNote>

            <Stack gap="md">
              <SectionHeading
                title="Lịch sử điểm"
                description={`${giaoDich.tong.toLocaleString('vi-VN')} giao dịch đã được ghi nhận`}
                action={
                  giaoDich.tong > 0 ? (
                    <Badge color="agrimarket" variant="light" size="lg">
                      Trang {giaoDich.trang}/{tongTrang}
                    </Badge>
                  ) : undefined
                }
              />

              {giaoDich.items.length === 0 ? (
                <EmptyState
                  tieuDe="Chưa có giao dịch điểm"
                  moTa="Khi tài khoản phát sinh điểm, lịch sử thay đổi sẽ được hiển thị tại đây."
                />
              ) : (
                <Stack gap="sm">
                  {giaoDich.items.map((item) => {
                    const tangDiem = item.bienDongDiem >= 0;
                    return (
                      <Paper key={item.id} withBorder className="agri-surface" p="lg">
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
        )}
      </AgriContainer>
    </Box>
  );
}
