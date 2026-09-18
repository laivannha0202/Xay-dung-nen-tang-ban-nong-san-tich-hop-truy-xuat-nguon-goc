'use client';

import {
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowsSort,
  IconMail,
  IconMessageCircle,
  IconPhone,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  LY_DO_KHIEU_NAI,
  TRANG_THAI_KHIEU_NAI,
  layDanhSachKhieuNaiKhach,
  layThongKeKhieuNaiKhach,
  metaTrangThaiKhieuNai,
  nhanLyDoKhieuNaiKhach,
  type LyDoKhieuNaiKhach,
  type TrangThaiKhieuNaiKhach,
} from '@/lib/api-khieu-nai';
import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';

import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

const GIOI_HAN = 10;

function dinhDangNgay(value: string): { ngay: string; gio: string } {
  const date = new Date(value);
  return {
    ngay: new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    gio: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  };
}

function maYeuCau(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function tieuDeChip(coDem: number | undefined, nhan: string): string {
  if (typeof coDem !== 'number') return nhan;
  return `${nhan} (${coDem.toLocaleString('vi-VN')})`;
}

export function DanhSachKhieuNaiContent() {
  // Trạng thái đăng nhập từ AuthProvider (đã restore im lặng khi F5/tab
  // mới). Giữ `null` khi chưa xác định để SSR/hydration khớp nhau.
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap' ? true : trangThai === 'khach' ? false : null;

  const [trang, setTrang] = useState(1);
  const [lyDo, setLyDo] = useState<LyDoKhieuNaiKhach | null>(null);
  const [trangThaiLoc, setTrangThaiLoc] = useState<TrangThaiKhieuNaiKhach | null>(null);
  const [tuKhoaNhap, setTuKhoaNhap] = useState('');
  const [tuKhoa, setTuKhoa] = useState('');
  const [moiNhatTruoc, setMoiNhatTruoc] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTuKhoa(tuKhoaNhap.trim());
      setTrang(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [tuKhoaNhap]);

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'list', trang, lyDo, trangThaiLoc, tuKhoa, moiNhatTruoc],
    queryFn: () =>
      layDanhSachKhieuNaiKhach({
        trang,
        gioiHan: GIOI_HAN,
        ...(lyDo ? { lyDo } : {}),
        ...(trangThaiLoc ? { trangThai: trangThaiLoc } : {}),
        ...(tuKhoa ? { tuKhoa } : {}),
        sapXep: moiNhatTruoc ? 'MOI_NHAT' : 'CU_NHAT',
      }),
    enabled: daDangNhap === true,
    staleTime: 15_000,
    retry: 0,
  });

  // API tự refresh + retry khi access token hết hạn; 401 tới được đây
  // nghĩa là phiên đã bị xóa tập trung và provider đã chuyển về guest
  // qua broadcast nên không tự xóa ở component nữa.

  // Một endpoint thống kê server-side, không bắn 8 request riêng.
  const demQuery = useQuery({
    queryKey: ['khieu-nai-khach', 'counts'],
    queryFn: layThongKeKhieuNaiKhach,
    enabled: daDangNhap === true && query.isSuccess,
    staleTime: 15_000,
    retry: 0,
  });

  const items = query.data?.items ?? [];

  // Chưa biết trạng thái đăng nhập (lần render đầu SSR + hydration):
  // render Skeleton ở cả 2 phía để HTML khớp nhau.
  if (daDangNhap === null || (daDangNhap && query.isPending)) {
    return <AgriSkeleton soLuong={5} />;
  }

  if (daDangNhap === false) {
    return (
      <EmptyState
        tieuDe="Đăng nhập để xem yêu cầu hỗ trợ"
        moTa="Các yêu cầu liên quan đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
        hanhDong={
          <Button component={Link} href="/dang-nhap?next=/khieu-nai">
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (query.isPending) {
    return <AgriSkeleton soLuong={5} />;
  }

  if (query.isError || !query.data) {
    // Phiên hết hạn thật (refresh cũng thất bại, phiên đã bị xóa tập
    // trung): đưa về màn đăng nhập luôn thay vì lỗi chung.
    if (query.isError && laLoiPhienHetHan(query.error)) {
      return (
        <EmptyState
          tieuDe="Phiên đăng nhập đã hết hạn"
          moTa="Vui lòng đăng nhập lại để tiếp tục xem yêu cầu hỗ trợ."
          hanhDong={
            <Button component={Link} href="/dang-nhap?next=/khieu-nai">
              Đăng nhập lại
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        tieuDe="Không tải được yêu cầu hỗ trợ"
        moTa="AgriMarket chưa thể tải lịch sử yêu cầu của tài khoản này."
        onThuLai={() => void query.refetch()}
      />
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));
  const dem = demQuery.data;
  const demTheoLyDo = Object.fromEntries(
    (dem?.theoLyDo ?? []).map((item) => [item.lyDo, item.tong]),
  ) as Partial<Record<LyDoKhieuNaiKhach, number>>;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Stack gap={2}>
          <Text fw={900} fz={{ base: 20, md: 24 }}>
            Yêu cầu hỗ trợ
          </Text>
          <Text size="sm" c="dimmed">
            Gửi yêu cầu hỗ trợ đến đội ngũ AgriMarket. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </Text>
        </Stack>
        <Button component={Link} href="/don-hang" color="agrimarket" leftSection={<IconPlus size={17} />}>
          Gửi yêu cầu mới
        </Button>
      </Group>

      <Stack gap="sm">
        <Group gap="xs" wrap="wrap" aria-label="Lọc theo lý do">
          <Button
            size="sm"
            radius="xl"
            variant={lyDo === null ? 'filled' : 'light'}
            color="agrimarket"
            onClick={() => {
              setLyDo(null);
              setTrang(1);
            }}
          >
            {tieuDeChip(dem?.tong, 'Tất cả')}
          </Button>
          {LY_DO_KHIEU_NAI.map((item) => (
            <Button
              key={item.value}
              size="sm"
              radius="xl"
              variant={lyDo === item.value ? 'filled' : 'light'}
              color="agrimarket"
              onClick={() => {
                setLyDo(item.value);
                setTrang(1);
              }}
            >
              {tieuDeChip(demTheoLyDo[item.value], item.label)}
            </Button>
          ))}
        </Group>
        <Group justify="flex-end" align="end" wrap="wrap">
          <Select
            label="Trạng thái"
            placeholder="Tất cả trạng thái"
            clearable
            data={TRANG_THAI_KHIEU_NAI.map((item) => ({ value: item.value, label: item.label }))}
            value={trangThaiLoc}
            onChange={(value) => {
              setTrangThaiLoc(value as TrangThaiKhieuNaiKhach | null);
              setTrang(1);
            }}
            w={{ base: '100%', sm: 220 }}
          />
          <TextInput
            label="Tìm kiếm"
            placeholder="Mã yêu cầu, mã đơn, sản phẩm..."
            leftSection={<IconSearch size={16} />}
            value={tuKhoaNhap}
            onChange={(event) => setTuKhoaNhap(event.currentTarget.value)}
            w={{ base: '100%', sm: 320 }}
            aria-label="Tìm kiếm yêu cầu hỗ trợ"
          />
        </Group>
      </Stack>

      {query.data.tong === 0 && !lyDo && !trangThaiLoc && !tuKhoa ? (
        <EmptyState
          tieuDe="Bạn chưa có yêu cầu hỗ trợ nào"
          moTa="Nếu cần hỗ trợ về sản phẩm đã mua, hãy mở chi tiết đơn hàng đã giao để gửi yêu cầu."
          hanhDong={
            <Button component={Link} href="/don-hang" variant="light">
              Xem đơn hàng
            </Button>
          }
        />
      ) : (
        <Paper withBorder radius="md" className="agri-surface" style={{ overflow: 'hidden' }}>
          <ScrollArea type="scroll" offsetScrollbars>
            <Table
              highlightOnHover
              verticalSpacing="md"
              horizontalSpacing="lg"
              fz="sm"
              style={{ minWidth: 820 }}
              aria-label="Danh sách yêu cầu hỗ trợ"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Mã yêu cầu
                    </Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Tiêu đề
                    </Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Danh mục
                    </Text>
                  </Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      color="gray"
                      size="xs"
                      px={0}
                      rightSection={<IconArrowsSort size={14} />}
                      onClick={() => setMoiNhatTruoc((value) => !value)}
                      aria-label={moiNhatTruoc ? 'Đang sắp xếp mới nhất trước' : 'Đang sắp xếp cũ nhất trước'}
                      styles={{ root: { fontWeight: 700 } }}
                    >
                      Ngày tạo
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Trạng thái
                    </Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Bằng chứng
                    </Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="xs" fw={700} c="dimmed">
                      Thao tác
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item) => {
                  const { ngay, gio } = dinhDangNgay(item.createdAt);
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text fw={800} style={{ whiteSpace: 'nowrap' }}>
                          {maYeuCau(item.id)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0} maw={300}>
                          <Text fw={600} lineClamp={2}>
                            {item.tenSanPham}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Đơn {item.maDonHang}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ whiteSpace: 'nowrap' }}>
                          {nhanLyDoKhieuNaiKhach(item.lyDo)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                            {ngay}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {gio}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        {(() => {
                          const meta = metaTrangThaiKhieuNai(item.trangThai);
                          return <Badge color={meta.color} variant="light">{meta.label}</Badge>;
                        })()}
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ whiteSpace: 'nowrap' }}>{item.soBangChung} ảnh</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          component={Link}
                          href={`/khieu-nai/${item.id}`}
                          variant="outline"
                          color="agrimarket"
                          size="xs"
                        >
                          Xem chi tiết
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {items.length === 0 ? (
            <EmptyState
              tieuDe="Không tìm thấy yêu cầu phù hợp"
              moTa="Thử đổi từ khóa tìm kiếm hoặc chọn lý do khác."
              hanhDong={
                <Button
                  variant="default"
                  onClick={() => {
                    setLyDo(null);
                    setTuKhoa('');
                    setTrang(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : null}
        </Paper>
      )}

      {query.data.tong > GIOI_HAN ? (
        <Group justify="center">
          <Pagination value={trang} onChange={setTrang} total={tongTrang} color="agrimarket" />
        </Group>
      ) : null}

      <Stack gap="sm" mt="xs">
        <Text fw={850} fz="md">
          Các kênh hỗ trợ khác
        </Text>
        {/* AGRIMARKET-VISUAL-MOBILE-SUPPORT-V7
            Mobile = 1 cột để hotline/email không bị ép chữ dọc.
            Từ sm = 3 cột; 768px đủ không gian cho 3 card. */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Paper withBorder radius="md" p="lg" className="agri-surface" style={{ flex: '1 1 220px' }}>
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon size={44} radius="xl" variant="light" color="agrimarket">
                <IconMessageCircle size={22} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={850}>Chat trực tuyến</Text>
                <Text size="xs" c="dimmed">
                  Hỗ trợ nhanh chóng
                </Text>
                <Text size="xs" c="dimmed">
                  Thời gian: 8:00 - 22:00
                </Text>
                <Button color="agrimarket" size="xs" mt="xs" w="fit-content">
                  Chat ngay
                </Button>
              </Stack>
            </Group>
          </Paper>

          <Paper withBorder radius="md" p="lg" className="agri-surface" style={{ flex: '1 1 220px' }}>
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon size={44} radius="xl" variant="light" color="agrimarket">
                <IconPhone size={22} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={850}>Hotline</Text>
                <Text fw={800}>1900 1234</Text>
                <Text size="xs" c="dimmed">
                  Thời gian: 8:00 - 22:00
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper withBorder radius="md" p="lg" className="agri-surface" style={{ flex: '1 1 220px' }}>
            <Group gap="md" wrap="nowrap" align="flex-start">
              <ThemeIcon size={44} radius="xl" variant="light" color="agrimarket">
                <IconMail size={22} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={850}>Email</Text>
                <Text fw={700} size="sm" style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}>
                  hotro@agrimarket.vn
                </Text>
                <Text size="xs" c="dimmed">
                  Phản hồi trong 24h
                </Text>
              </Stack>
            </Group>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
