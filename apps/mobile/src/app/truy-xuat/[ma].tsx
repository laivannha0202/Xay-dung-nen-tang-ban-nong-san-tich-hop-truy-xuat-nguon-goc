import { useLayTruyXuatCongKhai } from '@agrimarket/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';

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

function TimelineRow({ item, last }: { item: TimelineItem; last: boolean }) {
  const recall = item.nhom === 'thu-hoi';

  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View
          className={[
            'h-4 w-4 rounded-full border-2',
            recall ? 'border-danger bg-danger' : 'border-primary bg-primary',
          ].join(' ')}
        />
        {!last ? <View className="w-0.5 flex-1 bg-border" style={{ minHeight: 64 }} /> : null}
      </View>

      <View className="min-w-0 flex-1 gap-2 pb-5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge variant={recall ? 'danger' : 'info'}>{nhanNhom(item.nhom)}</Badge>
          <Text className="text-xs text-muted-foreground">{dinhDangThoiGian(item.thoiGian)}</Text>
        </View>
        <Text className="text-base font-bold text-foreground">{item.tieuDe}</Text>
        <Text className="text-sm leading-5 text-muted-foreground">{item.moTa}</Text>
      </View>
    </View>
  );
}

function TraceSkeleton() {
  return (
    <View className="gap-5">
      <Skeleton height={120} borderRadius={18} />
      <Skeleton height={170} borderRadius={18} />
      <Skeleton height={120} borderRadius={18} />
      <Skeleton height={260} borderRadius={18} />
    </View>
  );
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
    return <TraceSkeleton />;
  }

  if (isError || !item) {
    return (
      <ErrorState
        title="Không tìm thấy thông tin truy xuất"
        description="Hãy kiểm tra lại mã trên tem/QR. Mã hợp lệ có dạng AGM- theo sau bởi 32 ký tự hexadecimal."
        actionLabel="Thử lại"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <View className="gap-8">
      {item.thuHoi ? (
        <View className="gap-3 rounded-2xl border border-danger bg-card p-4">
          <View className="self-start">
            <Badge variant="danger">CẢNH BÁO THU HỒI</Badge>
          </View>
          <Text className="text-xl font-bold text-danger">Lô {item.lo.maLo} đã được thu hồi</Text>
          <Text className="leading-6 text-foreground">{item.thuHoi.thongBaoKhachHang}</Text>
          {item.thuHoi.thuHoiLuc ? (
            <Text className="text-sm text-muted-foreground">
              Công bố: {dinhDangThoiGian(item.thuHoi.thuHoiLuc)}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="gap-2 rounded-2xl border border-success bg-card p-4">
          <View className="self-start">
            <Badge variant="success">Không có cảnh báo thu hồi</Badge>
          </View>
          <Text className="text-sm leading-5 text-muted-foreground">
            Lô hiện không có thông báo thu hồi công khai từ Backend.
          </Text>
        </View>
      )}

      <View className="gap-4">
        <Text className="text-2xl font-bold text-foreground">Batch</Text>
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-lg font-bold text-foreground">{item.lo.maLo}</Text>
            <Badge variant={item.thuHoi ? 'danger' : 'info'}>{item.lo.trangThai}</Badge>
          </View>
          <Text selectable className="text-sm text-foreground">
            Mã truy xuất: {item.lo.maTruyXuat}
          </Text>
          <Text className="text-sm text-muted-foreground">Hạn sử dụng: {item.lo.ngayHetHan}</Text>
          <Text className="text-sm text-muted-foreground">
            Phân hạng: {item.lo.phanHangChatLuong ?? 'Chưa phân hạng'}
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <Text className="text-2xl font-bold text-foreground">Farm</Text>
        <View className="gap-2 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">{item.trangTrai.ten}</Text>
          <Text className="text-sm text-muted-foreground">{item.trangTrai.diaChi}</Text>
          <Text className="text-sm text-muted-foreground">
            Cây trồng: {item.muaVu.cayTrong} · giống {item.muaVu.giong}
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <Text className="text-2xl font-bold text-foreground">Certificate</Text>
        {item.chungNhan.length > 0 ? (
          <View className="gap-3">
            {item.chungNhan.map((certificate) => (
              <View
                key={`${certificate.loai}-${certificate.ma}`}
                className="gap-2 rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-lg font-bold text-foreground">
                    {certificate.loai}
                  </Text>
                  <Badge variant="success">Đã xác minh</Badge>
                </View>
                <Text className="text-sm text-foreground">Mã: {certificate.ma}</Text>
                <Text className="text-sm text-muted-foreground">{certificate.donViCap}</Text>
                <Text className="text-sm text-muted-foreground">
                  {certificate.ngayCap} → {certificate.ngayHetHan}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="Chưa có chứng nhận công khai"
            description="Lô này chưa có chứng nhận trang trại để hiển thị."
          />
        )}
      </View>

      <View className="gap-4">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">Timeline</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Dòng thời gian hợp nhất từ mùa vụ, canh tác, thu hoạch, kiểm định, sự kiện truy xuất và
            thu hồi.
          </Text>
        </View>

        {timeline.length > 0 ? (
          <View className="rounded-2xl border border-border bg-card p-4">
            {timeline.map((event, index) => (
              <TimelineRow key={event.id} item={event} last={index === timeline.length - 1} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Chưa có timeline"
            description="Backend chưa có sự kiện công khai cho mã truy xuất này."
          />
        )}
      </View>
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangTruyXuatChiTiet() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ma: string }>();
  const raw = typeof params.ma === 'string' ? params.ma : '';
  const ma = raw.trim().toUpperCase();
  const hopLe = MA_TRUY_XUAT_PATTERN.test(ma);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/quet-qr')}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-primary">Quét mã khác</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 24,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-3">
          <View className="self-start">
            <Badge variant="info">Trace Detail</Badge>
          </View>
          <Text className="text-3xl font-bold text-foreground">Hành trình nông sản</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Batch, farm, certificate, timeline và cảnh báo thu hồi từ dữ liệu công khai của Backend.
          </Text>
          <View className="rounded-xl border border-border bg-card p-3">
            <Text selectable className="text-sm font-semibold text-foreground">
              {ma || 'Không có mã truy xuất'}
            </Text>
          </View>
        </View>

        {hopLe ? (
          <KetQuaTruyXuat ma={ma} />
        ) : (
          <ErrorState
            title="Mã truy xuất không hợp lệ"
            description="Mã phải có dạng AGM- theo sau bởi đúng 32 ký tự 0-9 hoặc A-F."
            actionLabel="Quét QR"
            onAction={() => router.replace('/quet-qr')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
