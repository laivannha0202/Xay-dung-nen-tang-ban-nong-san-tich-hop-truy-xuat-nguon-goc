'use client';

import { useLayTruyXuatCongKhai } from '@agrimarket/api-client';
import {
  Alert,
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
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

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

  if (isPending) {
    return <AgriSkeleton soLuong={4} />;
  }

  if (isError || !item) {
    return (
      <ErrorState
        tieuDe="Không tìm thấy thông tin truy xuất"
        moTa="Hãy kiểm tra lại mã trên tem/QR. Mã truy xuất hợp lệ có dạng AGM- theo sau bởi 32 ký tự hexadecimal."
        onThuLai={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <Stack gap={48}>
      {item.thuHoi ? (
        <Alert color="red" variant="light" title="CẢNH BÁO THU HỒI">
          <Stack gap={4}>
            <Text fw={700}>Lô {item.lo.maLo} đã được thu hồi.</Text>
            <Text>{item.thuHoi.thongBaoKhachHang}</Text>
            {item.thuHoi.thuHoiLuc ? (
              <Text size="sm">Thời điểm công bố: {dinhDangThoiGian(item.thuHoi.thuHoiLuc)}</Text>
            ) : null}
          </Stack>
        </Alert>
      ) : (
        <Alert color="green" variant="light" title="Không có cảnh báo thu hồi">
          Lô hiện không có thông báo thu hồi công khai từ Backend.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={2}>Batch</Title>
              <AgriBadge loai={item.thuHoi ? 'canh-bao' : 'truy-xuat'}>
                {item.lo.trangThai}
              </AgriBadge>
            </Group>
            <Text>
              <strong>Mã lô:</strong> {item.lo.maLo}
            </Text>
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

        <Card withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Title order={2}>Farm</Title>
            <Text fw={700}>{item.trangTrai.ten}</Text>
            <Text c="dimmed">{item.trangTrai.diaChi}</Text>
            <Text size="sm">
              Cây trồng: {item.muaVu.cayTrong} · giống {item.muaVu.giong}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="lg">
        <Title order={2}>Certificate</Title>
        {item.chungNhan.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {item.chungNhan.map((certificate) => (
              <Card
                key={`${certificate.loai}-${certificate.ma}`}
                withBorder
                radius="lg"
                padding="lg"
              >
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text fw={700}>{certificate.loai}</Text>
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
            moTa="Lô này chưa có chứng nhận trang trại để hiển thị."
          />
        )}
      </Stack>

      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={2}>Timeline</Title>
          <Text c="dimmed">
            Dòng thời gian hợp nhất từ dữ liệu công khai của mùa vụ, canh tác, thu hoạch, kiểm định
            và sự kiện truy xuất.
          </Text>
        </Stack>

        {timeline.length > 0 ? (
          <Paper withBorder radius="lg" p={{ base: 'lg', md: 'xl' }}>
            <Timeline active={timeline.length} bulletSize={24} lineWidth={2}>
              {timeline.map((event) => (
                <Timeline.Item
                  key={event.id}
                  title={event.tieuDe}
                  color={event.nhom === 'thu-hoi' ? 'red' : 'agrimarket'}
                >
                  <Stack gap={4} mt={4}>
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
            tieuDe="Chưa có timeline"
            moTa="Backend chưa có sự kiện công khai cho mã truy xuất này."
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
      setLoiDinhDang('Mã phải có dạng AGM- theo sau bởi 32 ký tự 0-9 hoặc A-F.');
      return;
    }

    setLoiDinhDang(null);
    router.replace(`/truy-xuat?ma=${encodeURIComponent(normalized)}`);
  };

  return (
    <AgriContainer py={{ base: 36, md: 56 }}>
      <Stack gap={48}>
        <Stack gap="md" maw={760}>
          <AgriBadge>Truy xuất nguồn gốc</AgriBadge>
          <Title order={1}>Kiểm tra hành trình nông sản</Title>
          <Text size="lg" c="dimmed">
            Nhập mã truy xuất in trên tem hoặc lấy từ nội dung QR để xem batch, farm, certificate,
            timeline và cảnh báo thu hồi.
          </Text>
        </Stack>

        <Paper withBorder radius="xl" p={{ base: 'lg', md: 'xl' }}>
          <form onSubmit={submit}>
            <Stack gap="md">
              <TextInput
                label="Mã truy xuất"
                description="Ví dụ: AGM-0123456789ABCDEF0123456789ABCDEF"
                placeholder="AGM-..."
                value={ma}
                error={loiDinhDang}
                onChange={(event) => {
                  setMa(event.currentTarget.value.toUpperCase());
                  if (loiDinhDang) setLoiDinhDang(null);
                }}
              />
              <Group>
                <Button type="submit">Tra cứu</Button>
                {maTrenUrl ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      setMa('');
                      setLoiDinhDang(null);
                      router.replace('/truy-xuat');
                    }}
                  >
                    Tra cứu mã khác
                  </Button>
                ) : null}
              </Group>
            </Stack>
          </form>
        </Paper>

        {MA_TRUY_XUAT_PATTERN.test(maTrenUrl) ? (
          <KetQuaTruyXuat ma={maTrenUrl} />
        ) : (
          <EmptyState
            tieuDe="Nhập mã để bắt đầu"
            moTa="Kết quả chỉ được tải sau khi URL chứa mã truy xuất đúng định dạng."
          />
        )}
      </Stack>
    </AgriContainer>
  );
}
