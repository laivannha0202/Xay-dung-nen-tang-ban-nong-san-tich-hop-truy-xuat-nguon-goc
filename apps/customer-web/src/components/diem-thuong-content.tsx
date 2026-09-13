'use client';

import {
  Button,
  Group,
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconClock,
  IconCoins,
  IconHistory,
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

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { SectionHeading } from './web-page';

const GIOI_HAN = 20;

type BoLocDiem = 'tat-ca' | 'da-nhan' | 'da-dung';

const BO_LOC: Array<{ key: BoLocDiem; label: string }> = [
  { key: 'tat-ca', label: 'Tất cả' },
  { key: 'da-nhan', label: 'Đã nhận' },
  { key: 'da-dung', label: 'Đã dùng' },
];

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function dinhDangNgayNgan(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function dinhDangDiem(value: number): string {
  const dau = value > 0 ? '+' : '';
  return `${dau}${value.toLocaleString('vi-VN')} điểm`;
}

export function DiemThuongContent() {
  const [trang, setTrang] = useState(1);
  const [boLoc, setBoLoc] = useState<BoLocDiem>('tat-ca');
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
      <Stack gap="lg" w="100%">
        <EmptyState
          tieuDe="Đăng nhập để xem điểm thưởng"
          moTa="Số dư và lịch sử điểm chỉ hiển thị cho đúng tài khoản AgriMarket."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/diem-thuong" color="agrimarket">
              Đăng nhập
            </Button>
          }
        />
      </Stack>
    );
  }

  const dangTai = tongQuanQuery.isPending || giaoDichQuery.isPending;
  const coLoi =
    tongQuanQuery.isError ||
    giaoDichQuery.isError ||
    !tongQuanQuery.data ||
    !giaoDichQuery.data;

  if (dangTai) return <AgriSkeleton soLuong={6} />;

  if (coLoi || !tongQuanQuery.data || !giaoDichQuery.data) {
    return (
      <ErrorState
        tieuDe="Không tải được điểm thưởng"
        moTa="AgriMarket chưa thể tải số dư và lịch sử điểm của tài khoản này."
        onThuLai={() => {
          void Promise.all([tongQuanQuery.refetch(), giaoDichQuery.refetch()]);
        }}
      />
    );
  }

  const tongQuan = tongQuanQuery.data;
  const giaoDich = giaoDichQuery.data;
  const tongTrang = Math.max(1, Math.ceil(giaoDich.tong / giaoDich.gioiHan));

  // Lọc theo dấu biến động trên trang hiện tại (dữ liệu thật từ API).
  const mucHienThi = giaoDich.items.filter((item) => {
    if (boLoc === 'da-nhan') return item.bienDongDiem > 0;
    if (boLoc === 'da-dung') return item.bienDongDiem < 0;
    return true;
  });

  const chonBoLoc = (key: BoLocDiem) => {
    setBoLoc(key);
    setTrang(1);
  };

  return (
    <Stack gap="lg" w="100%">
      <SectionHeading
        title="Điểm thưởng"
        description="Theo dõi số dư điểm và lịch sử tích điểm của bạn."
      />

      {/* Thẻ tổng quan: chỉ số liệu thật từ sổ điểm */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Paper withBorder className="agri-surface" p="lg" radius="md">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <ThemeIcon size={44} radius="xl" variant="light" color="agrimarket" style={{ flex: '0 0 auto' }}>
              <IconCoins size={22} />
            </ThemeIcon>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" c="dimmed" fw={600}>Điểm hiện có</Text>
              <Text fz={24} fw={900} c="agrimarket.8" lh={1.1}>
                {tongQuan.diem.toLocaleString('vi-VN')} điểm
              </Text>
              <Text size="xs" c="dimmed">Số dư hiện tại của tài khoản</Text>
            </Stack>
          </Group>
        </Paper>

        <Paper withBorder className="agri-surface" p="lg" radius="md">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <ThemeIcon size={44} radius="xl" variant="light" color="blue" style={{ flex: '0 0 auto' }}>
              <IconHistory size={22} />
            </ThemeIcon>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" c="dimmed" fw={600}>Tổng giao dịch điểm</Text>
              <Text fz={24} fw={900} lh={1.1}>
                {tongQuan.tongGiaoDich.toLocaleString('vi-VN')}
              </Text>
              <Text size="xs" c="dimmed">Gồm cả giao dịch cộng và trừ điểm</Text>
            </Stack>
          </Group>
        </Paper>

        <Paper withBorder className="agri-surface" p="lg" radius="md">
          <Group gap="md" wrap="nowrap" align="flex-start">
            <ThemeIcon size={44} radius="xl" variant="light" color="orange" style={{ flex: '0 0 auto' }}>
              <IconClock size={22} />
            </ThemeIcon>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text size="sm" c="dimmed" fw={600}>Cập nhật lúc</Text>
              <Text fz={20} fw={900} lh={1.2}>
                {tongQuan.capNhatLuc ? dinhDangNgayNgan(tongQuan.capNhatLuc) : '—'}
              </Text>
              <Text size="xs" c="dimmed">
                {tongQuan.capNhatLuc ? dinhDangNgay(tongQuan.capNhatLuc) : 'Chưa phát sinh giao dịch'}
              </Text>
            </Stack>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Lịch sử điểm */}
      <Paper withBorder className="agri-surface" p={{ base: 'md', md: 'lg' }} radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Text fw={850} fz="lg">Lịch sử điểm</Text>
            <Group gap="xs" wrap="wrap">
              {BO_LOC.map((item) => (
                <Button
                  key={item.key}
                  size="xs"
                  radius="xl"
                  variant={boLoc === item.key ? 'filled' : 'light'}
                  color="agrimarket"
                  onClick={() => chonBoLoc(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </Group>
          </Group>

          <Group gap="lg" wrap="nowrap" px={4} visibleFrom="sm" aria-hidden>
            <Text size="xs" c="dimmed" fw={700} style={{ flex: 1 }}>Nội dung</Text>
            <Text size="xs" c="dimmed" fw={700} w={110} ta="right">Điểm</Text>
            <Text size="xs" c="dimmed" fw={700} w={130} ta="right">Ngày</Text>
          </Group>

          {giaoDich.items.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có giao dịch điểm"
              moTa="Khi tài khoản phát sinh điểm, lịch sử thay đổi sẽ được hiển thị tại đây."
            />
          ) : mucHienThi.length === 0 ? (
            <EmptyState
              tieuDe="Không có giao dịch phù hợp"
              moTa={boLoc === 'da-nhan' ? 'Trang này chưa có giao dịch cộng điểm.' : 'Trang này chưa có giao dịch trừ điểm.'}
              hanhDong={
                <Button variant="light" color="agrimarket" size="xs" onClick={() => chonBoLoc('tat-ca')}>
                  Xem tất cả
                </Button>
              }
            />
          ) : (
            <Stack gap="xs">
              {mucHienThi.map((item) => {
                const tangDiem = item.bienDongDiem >= 0;
                return (
                  <Group
                    key={item.id}
                    justify="space-between"
                    align="center"
                    gap="md"
                    wrap="nowrap"
                    py="sm"
                    px={4}
                    style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
                  >
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                      <ThemeIcon
                        size={38}
                        radius="xl"
                        color={tangDiem ? 'agrimarket' : 'red'}
                        variant="light"
                        style={{ flex: '0 0 auto' }}
                      >
                        {tangDiem ? <IconArrowUp size={18} /> : <IconArrowDown size={18} />}
                      </ThemeIcon>
                      <Stack gap={1} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={750} lineClamp={2}>
                          {item.lyDo?.trim() || 'Điều chỉnh điểm thưởng'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Số dư sau giao dịch: {item.soDuSau.toLocaleString('vi-VN')} điểm
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="sm" fw={850} c={tangDiem ? 'agrimarket.7' : 'red.7'} w={110} ta="right" style={{ flex: '0 0 auto' }}>
                      {dinhDangDiem(item.bienDongDiem)}
                    </Text>
                    <Text size="xs" c="dimmed" w={130} ta="right" style={{ flex: '0 0 auto' }}>
                      {dinhDangNgayNgan(item.createdAt)}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          )}

          {tongTrang > 1 ? (
            <Group justify="center" mt="xs">
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
      </Paper>
    </Stack>
  );
}
