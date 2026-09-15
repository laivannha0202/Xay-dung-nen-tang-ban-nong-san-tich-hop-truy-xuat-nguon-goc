'use client';

import {
  Button,
  Group,
  Pagination,
  Paper,
  ScrollArea,
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
import { useMemo, useState } from 'react';

import {
  LY_DO_KHIEU_NAI,
  layDanhSachKhieuNaiKhach,
  nhanLyDoKhieuNaiKhach,
  type LyDoKhieuNaiKhach,
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
  const [tuKhoa, setTuKhoa] = useState('');
  const [moiNhatTruoc, setMoiNhatTruoc] = useState(true);

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'list', trang, lyDo],
    queryFn: () =>
      layDanhSachKhieuNaiKhach({
        trang,
        gioiHan: GIOI_HAN,
        ...(lyDo ? { lyDo } : {}),
      }),
    enabled: daDangNhap === true,
    staleTime: 15_000,
    retry: 0,
  });

  // API tự refresh + retry khi access token hết hạn; 401 tới được đây
  // nghĩa là phiên đã bị xóa tập trung và provider đã chuyển về guest
  // qua broadcast nên không tự xóa ở component nữa.

  // Số đếm thật cho từng chip lý do: mỗi lý do một query nhẹ
  // (gioiHan: 1) và lấy `tong` backend trả về.
  const demQuery = useQuery({
    queryKey: ['khieu-nai-khach', 'counts'],
    queryFn: async () => {
      const tatCa = await layDanhSachKhieuNaiKhach({ trang: 1, gioiHan: 1 });
      const theoLyDo = await Promise.all(
        LY_DO_KHIEU_NAI.map((item) =>
          layDanhSachKhieuNaiKhach({ trang: 1, gioiHan: 1, lyDo: item.value }).then((res) => ({
            giaTri: item.value,
            tong: res.tong,
          })),
        ),
      );
      const bangDem: Record<string, number> = {};
      theoLyDo.forEach((item) => {
        bangDem[item.giaTri] = item.tong;
      });
      return { tatCa: tatCa.tong, theoLyDo: bangDem };
    },
    // Chỉ đếm sau khi query chính thành công: token hỏng (401) thì khỏi
    // bắn thêm 8 request nữa, đỡ spam console.
    enabled: daDangNhap === true && query.isSuccess,
    staleTime: 15_000,
    retry: 0,
  });

  // Backend chưa hỗ trợ tìm kiếm/sắp xếp theo yêu cầu,
  // nên lọc từ khóa và đảo thứ tự trên đúng trang vừa tải về.
  const items = useMemo(() => {
    const goc = query.data?.items ?? [];
    const keyword = tuKhoa.trim().toLowerCase();
    const loc =
      keyword.length === 0
        ? goc
        : goc.filter(
            (item) =>
              item.tenSanPham.toLowerCase().includes(keyword) ||
              item.maDonHang.toLowerCase().includes(keyword) ||
              item.id.toLowerCase().includes(keyword),
          );
    return [...loc].sort((a, b) =>
      moiNhatTruoc
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [query.data, tuKhoa, moiNhatTruoc]);

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
            {tieuDeChip(dem?.tatCa, 'Tất cả')}
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
              {tieuDeChip(dem?.theoLyDo[item.value], item.label)}
            </Button>
          ))}
        </Group>
        <Group justify="flex-end">
          <TextInput
            placeholder="Tìm kiếm yêu cầu theo mã, tiêu đề..."
            leftSection={<IconSearch size={16} />}
            value={tuKhoa}
            onChange={(event) => setTuKhoa(event.currentTarget.value)}
            w={{ base: '100%', sm: 320 }}
            aria-label="Tìm kiếm yêu cầu hỗ trợ"
          />
        </Group>
      </Stack>

      {query.data.tong === 0 && !lyDo ? (
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
        <Group grow align="stretch" gap="md" wrap="wrap">
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
                <Text fw={700} size="sm" style={{ wordBreak: 'break-all' }}>
                  hotro@agrimarket.vn
                </Text>
                <Text size="xs" c="dimmed">
                  Phản hồi trong 24h
                </Text>
              </Stack>
            </Group>
          </Paper>
        </Group>
      </Stack>
    </Stack>
  );
}
