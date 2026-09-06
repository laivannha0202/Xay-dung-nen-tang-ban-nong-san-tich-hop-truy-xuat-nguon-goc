'use client';

import { useLayTruyXuatCongKhai } from '@agrimarket/api-client';
import {
  Alert,
  Box,
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
import {
  IconAlertTriangle,
  IconCertificate,
  IconLeaf,
  IconMapPin,
  IconQrcode,
  IconShieldCheck,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { ANH_TRUY_XUAT_AGRIMARKET } from '@/lib/demo-images';

import { AgriBadge } from './agri-badge';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const MA_TRUY_XUAT_PATTERN = /^AGM-[A-F0-9]{32}$/;

type TimelineItem = {
  id: string;
  thoiGian: string;
  tieuDe: string;
  moTa: string;
  nhom: 'mua-vu' | 'canh-tac' | 'thu-hoach' | 'kiem-dinh' | 'trace' | 'thu-hoi';
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

function nhanNhom(nhom: TimelineItem['nhom']): string {
  if (nhom === 'mua-vu') return 'Mùa vụ';
  if (nhom === 'canh-tac') return 'Canh tác';
  if (nhom === 'thu-hoach') return 'Thu hoạch';
  if (nhom === 'kiem-dinh') return 'Kiểm định';
  if (nhom === 'thu-hoi') return 'Thu hồi';
  return 'Truy xuất';
}

function KetQuaTruyXuat({ ma }: { ma: string }) {
  const { data, isPending, isError, refetch } = useLayTruyXuatCongKhai(ma);
  const item = data?.data;

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!item) return [];

    const values: TimelineItem[] = [
      {
        id: `mua-vu-${item.muaVu.ngayTrong}`,
        thoiGian: item.muaVu.ngayTrong,
        tieuDe: 'Bắt đầu mùa vụ',
        moTa: `${item.muaVu.cayTrong} · giống ${item.muaVu.giong}`,
        nhom: 'mua-vu',
      },
      ...item.nhatKyCanhTac.map((event, index) => ({
        id: `canh-tac-${event.thoiGian}-${index}`,
        thoiGian: event.thoiGian,
        tieuDe: event.loaiSuKien,
        moTa: event.noiDung,
        nhom: 'canh-tac' as const,
      })),
      {
        id: `thu-hoach-${item.thuHoach.ngayThuHoach}`,
        thoiGian: item.thuHoach.ngayThuHoach,
        tieuDe: 'Thu hoạch',
        moTa: `Phân loại: ${item.thuHoach.phanLoai}`,
        nhom: 'thu-hoach',
      },
      ...item.kiemDinh.map((event, index) => ({
        id: `kiem-dinh-${event.ngayKiemDinh}-${index}`,
        thoiGian: event.ngayKiemDinh,
        tieuDe: `Kiểm định: ${event.ketQua}`,
        moTa: event.phanHang ? `Phân hạng: ${event.phanHang}` : 'Không có phân hạng bổ sung.',
        nhom: 'kiem-dinh' as const,
      })),
      ...item.suKien.map((event, index) => ({
        id: `trace-${event.thoiGian}-${index}`,
        thoiGian: event.thoiGian,
        tieuDe: event.loai,
        moTa: event.diaDiem,
        nhom: 'trace' as const,
      })),
    ];

    if (item.thuHoi?.thuHoiLuc) {
      values.push({
        id: `thu-hoi-${item.thuHoi.thuHoiLuc}`,
        thoiGian: item.thuHoi.thuHoiLuc,
        tieuDe: 'Lô sản phẩm bị thu hồi',
        moTa: item.thuHoi.thongBaoKhachHang,
        nhom: 'thu-hoi',
      });
    }

    return values.sort((a, b) => a.thoiGian.localeCompare(b.thoiGian));
  }, [item]);

  if (isPending) return <AgriSkeleton soLuong={4} />;

  if (isError || !item) {
    return (
      <ErrorState
        tieuDe="Không tìm thấy thông tin truy xuất"
        moTa="Kiểm tra lại mã trên tem hoặc QR rồi thử lại."
        onThuLai={() => void refetch()}
      />
    );
  }

  return (
    <Stack gap={38}>
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
        <Card withBorder p="xl" className="farm-panel">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text className="farm-kicker">Lô hàng</Text>
                <Title order={2} className="farm-display">
                  {item.lo.maLo}
                </Title>
              </Stack>
              <AgriBadge loai={item.thuHoi ? 'canh-bao' : 'truy-xuat'}>
                {item.lo.trangThai}
              </AgriBadge>
            </Group>

            <Box className="farm-rule" />

            <Text>
              <strong>Mã truy xuất:</strong> <Code>{item.lo.maTruyXuat}</Code>
            </Text>
            <Text>
              <strong>Hạn sử dụng:</strong> {item.lo.ngayHetHan}
            </Text>
            <Text>
              <strong>Phân hạng:</strong> {item.lo.phanHangChatLuong ?? 'Chưa phân hạng'}
            </Text>
          </Stack>
        </Card>

        <Card withBorder p="xl" className="farm-panel">
          <Stack gap="md">
            <Group gap="sm">
              <IconMapPin size={22} stroke={1.6} color="#35633e" />
              <Stack gap={1}>
                <Text className="farm-kicker">Nơi sản xuất</Text>
                <Title order={2} className="farm-display">
                  {item.trangTrai.ten}
                </Title>
              </Stack>
            </Group>

            <Box className="farm-rule" />

            <Text c="dimmed">{item.trangTrai.diaChi}</Text>
            <Text>
              <strong>Cây trồng:</strong> {item.muaVu.cayTrong}
            </Text>
            <Text>
              <strong>Giống:</strong> {item.muaVu.giong}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="lg">
        <Group gap="sm">
          <IconCertificate size={24} stroke={1.6} color="#35633e" />
          <Stack gap={2}>
            <Text className="farm-kicker">Xác minh</Text>
            <Title order={2} className="farm-display">
              Chứng nhận liên quan
            </Title>
          </Stack>
        </Group>

        {item.chungNhan.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {item.chungNhan.map((certificate) => (
              <Card
                key={`${certificate.loai}-${certificate.ma}`}
                withBorder
                p="lg"
                className="farm-panel"
              >
                <Stack gap={7}>
                  <Group justify="space-between">
                    <Text fw={850}>{certificate.loai}</Text>
                    <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge>
                  </Group>
                  <Text>Mã: {certificate.ma}</Text>
                  <Text c="dimmed">{certificate.donViCap}</Text>
                  <Text size="sm" c="dimmed">
                    {certificate.ngayCap} → {certificate.ngayHetHan}
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

      <Stack gap="xl">
        <Group gap="sm">
          <IconLeaf size={24} stroke={1.6} color="#35633e" />
          <Stack gap={2}>
            <Text className="farm-kicker">Hành trình</Text>
            <Title order={2} className="farm-display">
              Từ gieo trồng đến lưu thông
            </Title>
          </Stack>
        </Group>

        {timeline.length > 0 ? (
          <Paper withBorder p={{ base: 'lg', md: 'xl' }} className="farm-panel">
            <Timeline active={timeline.length} bulletSize={26} lineWidth={2}>
              {timeline.map((event) => (
                <Timeline.Item
                  key={event.id}
                  title={event.tieuDe}
                  color={event.nhom === 'thu-hoi' ? 'red' : 'agrimarket'}
                >
                  <Stack gap={4} mt={5}>
                    <Group gap="xs">
                      <AgriBadge loai={event.nhom === 'thu-hoi' ? 'canh-bao' : 'truy-xuat'}>
                        {nhanNhom(event.nhom)}
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

  const [ma, setMa] = useState(maTrenUrl);
  const [loiDinhDang, setLoiDinhDang] = useState<string | null>(null);

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
    <>
      <Box className="farm-page-hero">
        <AgriContainer>
          <Box className="farm-trace-hero-page">
            <Box className="farm-trace-hero-page__copy">
              <Stack gap="lg">
                <IconQrcode size={42} stroke={1.4} color="#244b2c" />
                <Stack gap="sm">
                  <Text className="farm-kicker">Truy xuất nguồn gốc</Text>
                  <Title order={1} className="farm-display" fz={{ base: 38, md: 52 }}>
                    Kiểm tra đúng lô hàng bạn đang cầm trên tay
                  </Title>
                  <Text size="lg" c="dimmed">
                    Nhập mã trên tem hoặc nội dung QR để xem nơi sản xuất, mùa vụ, thu hoạch, kiểm
                    định, chứng nhận và cảnh báo liên quan.
                  </Text>
                </Stack>
              </Stack>
            </Box>

            <Box
              className="farm-trace-hero-page__photo"
              style={{ backgroundImage: `url("${ANH_TRUY_XUAT_AGRIMARKET}")` }}
            />
          </Box>
        </AgriContainer>
      </Box>

      <AgriContainer py={{ base: 32, md: 42 }}>
        <Stack gap={38}>
          <Paper withBorder p={{ base: 'lg', md: 'xl' }} className="farm-panel">
            <form onSubmit={submit}>
              <Stack gap="md">
                <Stack gap={2}>
                  <Text fw={850}>Nhập mã truy xuất</Text>
                  <Text size="sm" c="dimmed">
                    Mã thường nằm trên tem hoặc được chứa trong QR của lô sản phẩm.
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
                  <Button type="submit" size="lg">
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
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              {[
                ['01', 'Tìm mã trên tem', 'Xem tem hoặc QR đi cùng lô nông sản.'],
                ['02', 'Nhập đúng mã', 'Mã AgriMarket bắt đầu bằng AGM-.'],
                ['03', 'Đọc hành trình', 'Theo dõi các mốc và thông tin đã công khai.'],
              ].map(([so, tieuDe, moTa]) => (
                <Paper key={so} withBorder p="lg" className="farm-panel">
                  <Stack gap="sm">
                    <Text className="farm-display" fz="32px" fw={850} c="agrimarket.8">
                      {so}
                    </Text>
                    <Text fw={850}>{tieuDe}</Text>
                    <Text size="sm" c="dimmed">
                      {moTa}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </AgriContainer>
    </>
  );
}
