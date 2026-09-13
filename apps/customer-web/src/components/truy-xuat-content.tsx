'use client';

import { useLayTruyXuatCongKhai } from '@agrimarket/api-client';
import type { TruyXuatCongKhaiDto } from '@agrimarket/api-client';
import {
  Alert,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Timeline,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { PageHeader } from './web-page';

const MA_TRUY_XUAT_PATTERN = /^AGM-[A-F0-9]{32}$/;

type SuKienThat = {
  id: string;
  thoiGian: string;
  nhan: string;
  tieuDe: string;
  moTa: string;
  canhBao?: boolean;
};

function dinhDangThoiGian(value: string): string {
  const laNgay = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(laNgay ? `${value}T00:00:00.000Z` : value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    ...(laNgay ? {} : { timeStyle: 'short' as const }),
    timeZone: laNgay ? 'UTC' : undefined,
  }).format(date);
}

function suKienThat(item: TruyXuatCongKhaiDto): SuKienThat[] {
  const values: SuKienThat[] = [
    {
      id: `mua-vu-${item.muaVu.ngayTrong}`,
      thoiGian: item.muaVu.ngayTrong,
      nhan: 'Mùa vụ',
      tieuDe: `Ngày trồng theo hồ sơ mùa vụ: ${item.muaVu.cayTrong}`,
      moTa: `Giống ${item.muaVu.giong}`,
    },
    ...item.nhatKyCanhTac.map((event, index) => ({
      id: `canh-tac-${event.thoiGian}-${index}`,
      thoiGian: event.thoiGian,
      nhan: 'Nhật ký canh tác',
      tieuDe: event.loaiSuKien,
      moTa: event.noiDung,
    })),
    {
      id: `thu-hoach-${item.thuHoach.ngayThuHoach}`,
      thoiGian: item.thuHoach.ngayThuHoach,
      nhan: 'Thu hoạch',
      tieuDe: `Ngày thu hoạch theo hồ sơ: phân loại ${item.thuHoach.phanLoai}`,
      moTa: `Thuộc mùa vụ ${item.muaVu.cayTrong} · giống ${item.muaVu.giong}`,
    },
    ...item.kiemDinh.map((event, index) => ({
      id: `kiem-dinh-${event.ngayKiemDinh}-${index}`,
      thoiGian: event.ngayKiemDinh,
      nhan: 'Kiểm định',
      tieuDe: `Kết quả kiểm định: ${event.ketQua}`,
      moTa: event.phanHang ? `Phân hạng: ${event.phanHang}` : 'Không có phân hạng bổ sung.',
    })),
    ...item.suKien.map((event, index) => ({
      id: `su-kien-${event.thoiGian}-${index}`,
      thoiGian: event.thoiGian,
      nhan: 'Lưu thông',
      tieuDe: event.loai,
      moTa: event.diaDiem,
    })),
  ];

  if (item.thuHoi?.thuHoiLuc) {
    values.push({
      id: `thu-hoi-${item.thuHoi.thuHoiLuc}`,
      thoiGian: item.thuHoi.thuHoiLuc,
      nhan: 'Thu hồi',
      tieuDe: 'Lô sản phẩm bị thu hồi',
      moTa: item.thuHoi.thongBaoKhachHang,
      canhBao: true,
    });
  }

  return values.sort((a, b) => a.thoiGian.localeCompare(b.thoiGian));
}

function KetQuaTruyXuat({ ma }: { ma: string }) {
  const { data, isPending, isError, refetch } = useLayTruyXuatCongKhai(ma);
  const item = data?.data;

  const timeline = useMemo<SuKienThat[]>(() => {
    if (!item) return [];
    return suKienThat(item);
  }, [item]);

  if (isPending) return <AgriSkeleton soLuong={4} />;

  if (isError || !item) {
    return (
      <ErrorState
        tieuDe="Không tìm thấy thông tin truy xuất"
        moTa="Mã không tồn tại trên AgriMarket. Kiểm tra lại mã trên tem của lô sản phẩm rồi thử lại."
        onThuLai={() => void refetch()}
      />
    );
  }

  return (
    <Stack gap="xl">
      {item.thuHoi ? (
        <Alert
          color="red"
          variant="light"
          title="Cảnh báo thu hồi"
          icon={<IconAlertTriangle size={20} />}
        >
          <Stack gap={4}>
            <Text fw={800}>Lô {item.lo.maLo} đã được công bố thu hồi.</Text>
            <Text>{item.thuHoi.thongBaoKhachHang}</Text>
            {item.thuHoi.thuHoiLuc ? (
              <Text size="sm">Công bố lúc {dinhDangThoiGian(item.thuHoi.thuHoiLuc)}</Text>
            ) : null}
          </Stack>
        </Alert>
      ) : (
        <Alert
          color="green"
          variant="light"
          title="Không có cảnh báo thu hồi"
          icon={<IconShieldCheck size={20} />}
        >
          Hiện chưa có thông báo thu hồi công khai cho lô hàng này.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder p="xl" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={700}>
                  LÔ SẢN PHẨM
                </Text>
                <Title order={2}>{item.lo.maLo}</Title>
              </Stack>
              <AgriBadge loai={item.thuHoi ? 'canh-bao' : 'truy-xuat'}>
                {item.lo.trangThai}
              </AgriBadge>
            </Group>

            <Text>
              <strong>Mã truy xuất:</strong> <Code>{item.lo.maTruyXuat}</Code>
            </Text>
            <Text>
              <strong>Hạn sử dụng:</strong> {dinhDangThoiGian(item.lo.ngayHetHan)}
            </Text>
            <Text>
              <strong>Phân hạng:</strong> {item.lo.phanHangChatLuong ?? 'Chưa phân hạng'}
            </Text>
          </Stack>
        </Card>

        <Card withBorder p="xl" radius="md">
          <Stack gap="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={700}>
                NƠI SẢN XUẤT
              </Text>
              <Title order={2}>{item.trangTrai.ten}</Title>
            </Stack>

            <Text c="dimmed">{item.trangTrai.diaChi}</Text>
            <Text>
              <strong>Cây trồng:</strong> {item.muaVu.cayTrong}
            </Text>
            <Text>
              <strong>Giống:</strong> {item.muaVu.giong}
            </Text>
            <Text>
              <strong>Ngày trồng (hồ sơ mùa vụ):</strong>{' '}
              {dinhDangThoiGian(item.muaVu.ngayTrong)}
            </Text>
            <Text>
              <strong>Ngày thu hoạch (hồ sơ thu hoạch):</strong>{' '}
              {dinhDangThoiGian(item.thuHoach.ngayThuHoach)} · phân loại{' '}
              {item.thuHoach.phanLoai}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="md">
        <Title order={2}>Chứng nhận liên quan</Title>

        {item.chungNhan.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {item.chungNhan.map((certificate) => (
              <Card
                key={`${certificate.loai}-${certificate.ma}`}
                withBorder
                p="lg"
                radius="md"
              >
                <Stack gap={7}>
                  <Group justify="space-between">
                    <Text fw={850}>{certificate.loai}</Text>
                    <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge>
                  </Group>
                  <Text>Mã: {certificate.ma}</Text>
                  <Text c="dimmed">{certificate.donViCap}</Text>
                  <Text size="sm" c="dimmed">
                    {dinhDangThoiGian(certificate.ngayCap)} →{' '}
                    {dinhDangThoiGian(certificate.ngayHetHan)}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <EmptyState
            tieuDe="Chưa có chứng nhận công khai"
            moTa="Lô hàng này chưa có chứng nhận phù hợp để hiển thị."
          />
        )}
      </Stack>

      <Stack gap="md">
        <Title order={2}>Nhật ký canh tác đã công khai</Title>
        {item.nhatKyCanhTac.length > 0 ? (
          <Stack gap="sm">
            {item.nhatKyCanhTac.map((event, index) => (
              <Paper key={`canh-tac-${event.thoiGian}-${index}`} withBorder p="md" radius="md">
                <Group justify="space-between" wrap="wrap" gap="sm">
                  <Stack gap={2}>
                    <Text fw={700}>{event.loaiSuKien}</Text>
                    <Text size="sm">{event.noiDung}</Text>
                  </Stack>
                  <Text size="sm" c="dimmed">
                    {dinhDangThoiGian(event.thoiGian)}
                  </Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            tieuDe="Chưa có nhật ký công khai"
            moTa="Lô hàng này chưa có nhật ký canh tác được công khai."
          />
        )}
      </Stack>

      <Stack gap="md">
        <Title order={2}>Kiểm định</Title>
        {item.kiemDinh.length > 0 ? (
          <Stack gap="sm">
            {item.kiemDinh.map((event, index) => (
              <Paper key={`kiem-dinh-${event.ngayKiemDinh}-${index}`} withBorder p="md" radius="md">
                <Group justify="space-between" wrap="wrap" gap="sm">
                  <Stack gap={2}>
                    <Text fw={700}>Kết quả: {event.ketQua}</Text>
                    <Text size="sm" c="dimmed">
                      {event.phanHang ? `Phân hạng: ${event.phanHang}` : 'Không có phân hạng bổ sung.'}
                    </Text>
                  </Stack>
                  <Text size="sm" c="dimmed">
                    {dinhDangThoiGian(event.ngayKiemDinh)}
                  </Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            tieuDe="Chưa có kiểm định công khai"
            moTa="Lô hàng này chưa có kết quả kiểm định được công khai."
          />
        )}
      </Stack>

      <Stack gap="md">
        <Title order={2}>Hành trình theo hồ sơ đã lưu</Title>
        <Text size="sm" c="dimmed">
          Mỗi mốc bên dưới tương ứng một bản ghi có thật trong hệ thống, sắp xếp theo thời
          gian đã lưu.
        </Text>

        {timeline.length > 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Timeline active={timeline.length} bulletSize={26} lineWidth={2}>
              {timeline.map((event) => (
                <Timeline.Item
                  key={event.id}
                  title={event.tieuDe}
                  color={event.canhBao ? 'red' : 'agrimarket'}
                >
                  <Stack gap={4} mt={5}>
                    <Group gap="xs">
                      <AgriBadge loai={event.canhBao ? 'canh-bao' : 'truy-xuat'}>
                        {event.nhan}
                      </AgriBadge>
                      <Text size="sm" c="dimmed">
                        {dinhDangThoiGian(event.thoiGian)}
                      </Text>
                    </Group>
                    <Text>{event.moTa}</Text>
                  </Stack>
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        ) : (
          <EmptyState
            tieuDe="Chưa có hành trình công khai"
            moTa="Các mốc truy xuất sẽ xuất hiện khi lô hàng có dữ liệu phù hợp."
          />
        )}
      </Stack>
    </Stack>
  );
}

export function TruyXuatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const maTrenUrl = (searchParams.get('ma') ?? '').trim().toUpperCase();
  const maUrlKhongHopLe = Boolean(maTrenUrl) && !MA_TRUY_XUAT_PATTERN.test(maTrenUrl);

  const [ma, setMa] = useState(maTrenUrl);
  const [loiDinhDang, setLoiDinhDang] = useState<string | null>(
    maUrlKhongHopLe ? 'Mã trong liên kết không đúng định dạng AgriMarket.' : null,
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = ma.trim().toUpperCase();
    setMa(normalized);

    if (!MA_TRUY_XUAT_PATTERN.test(normalized)) {
      setLoiDinhDang('Mã cần có dạng AGM- theo sau bởi 32 ký tự 0-9 hoặc A-F.');
      return;
    }

    setLoiDinhDang(null);
    router.replace(`/truy-xuat?ma=${encodeURIComponent(normalized)}`);
  };

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Minh bạch nguồn gốc"
        title="Truy xuất nguồn gốc"
        description="Nhập mã truy xuất trên tem của lô sản phẩm để xem nơi sản xuất, mùa vụ, thu hoạch, kiểm định và chứng nhận liên quan."
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label="Điều hướng truy xuất nguồn gốc">
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              Truy xuất nguồn gốc
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py="xl">
        <Stack gap="xl">
          <Paper withBorder p="xl" radius="md">
            <form onSubmit={submit}>
              <Stack gap="md">
                <Stack gap={2}>
                  <Text fw={850}>Nhập mã truy xuất</Text>
                  <Text size="sm" c="dimmed">
                    Mã thường nằm trên tem đi cùng lô nông sản.
                  </Text>
                </Stack>

                <Group align="flex-start" wrap="wrap">
                  <TextInput
                    aria-label="Mã truy xuất"
                    placeholder="AGM-..."
                    value={ma}
                    error={loiDinhDang}
                    size="lg"
                    style={{ flex: 1, minWidth: 270 }}
                    onChange={(event) => {
                      setMa(event.currentTarget.value.toUpperCase());
                      if (loiDinhDang) setLoiDinhDang(null);
                    }}
                  />
                  <Button type="submit" size="lg" color="agrimarket">
                    Tra cứu
                  </Button>
                  {maTrenUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setMa('');
                        setLoiDinhDang(null);
                        router.replace('/truy-xuat');
                      }}
                    >
                      Mã khác
                    </Button>
                  ) : null}
                </Group>

                <Text size="xs" c="dimmed">
                  Ví dụ: AGM-0123456789ABCDEF0123456789ABCDEF
                </Text>
              </Stack>
            </form>
          </Paper>

          {MA_TRUY_XUAT_PATTERN.test(maTrenUrl) ? (
            <KetQuaTruyXuat ma={maTrenUrl} />
          ) : maUrlKhongHopLe ? (
            <ErrorState
              tieuDe="Mã truy xuất chưa đúng định dạng"
              moTa="Mã AgriMarket có dạng AGM- theo sau bởi 32 ký tự 0-9 hoặc A-F."
              onThuLai={() => router.replace('/truy-xuat')}
            />
          ) : (
            <EmptyState
              tieuDe="Chưa có mã cần tra cứu"
              moTa="Nhập mã trên tem của lô sản phẩm rồi chọn Tra cứu để xem nguồn gốc."
            />
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
