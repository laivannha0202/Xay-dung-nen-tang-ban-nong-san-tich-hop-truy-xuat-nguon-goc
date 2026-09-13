import { useLayTruyXuatCongKhai } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';

const MA_TRUY_XUAT_PATTERN = /^AGM-[A-F0-9]{32}$/;
const PRIMARY = '#087A4B';

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

function metaNhom(nhom: TimelineItem['nhom']): {
  nhan: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
} {
  if (nhom === 'mua-vu') return { nhan: 'Canh tác', icon: 'leaf-outline' };
  if (nhom === 'canh-tac') return { nhan: 'Nhật ký', icon: 'book-outline' };
  if (nhom === 'thu-hoach') return { nhan: 'Thu hoạch', icon: 'basket-outline' };
  if (nhom === 'kiem-dinh') return { nhan: 'Kiểm định', icon: 'flask-outline' };
  if (nhom === 'thu-hoi') return { nhan: 'Thu hồi', icon: 'warning-outline' };
  return { nhan: 'Truy xuất', icon: 'cube-outline' };
}

function TimelineRow({ item, last }: { item: TimelineItem; last: boolean }) {
  const recall = item.nhom === 'thu-hoi';
  const meta = metaNhom(item.nhom);

  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View
          className={[
            'h-11 w-11 items-center justify-center rounded-full border-4 border-white',
            recall ? 'bg-[#E6535F]' : 'bg-primary',
          ].join(' ')}
          style={{ shadowColor: '#0B3D26', shadowOpacity: 0.08, shadowRadius: 8 }}
        >
          <Ionicons name={meta.icon} size={21} color="#FFFFFF" />
        </View>
        {!last ? <View className="w-[2px] flex-1 bg-[#BDE6CC]" style={{ minHeight: 68 }} /> : null}
      </View>

      <View className="min-w-0 flex-1 pb-5 pt-1">
        <View className="rounded-[18px] border border-[#E1E9E4] bg-white p-4">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className={recall ? 'font-extrabold text-[#C93445]' : 'font-extrabold text-[#075E3B]'}>
              {meta.nhan}
            </Text>
            <Text className="text-[11px] text-[#859088]">{dinhDangThoiGian(item.thoiGian)}</Text>
          </View>
          <Text className="mt-2 text-[16px] font-extrabold text-[#202A24]">{item.tieuDe}</Text>
          <Text className="mt-1 text-[13px] leading-5 text-[#69766E]">{item.moTa}</Text>
        </View>
      </View>
    </View>
  );
}

function TraceSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={225} borderRadius={22} />
      <Skeleton height={80} borderRadius={18} />
      <Skeleton height={380} borderRadius={18} />
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

  if (isPending) return <TraceSkeleton />;

  if (isError || !item) {
    return (
      <ErrorState
        title="Không tìm thấy thông tin truy xuất"
        description="Hãy kiểm tra lại mã trên tem hoặc QR rồi thử lại."
        actionLabel="Thử lại"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <View className="gap-5">
      <View className="overflow-hidden rounded-[22px] border border-[#D8E9DF] bg-[#F1FAF5]">
        <View className="flex-row">
          <View className="w-[34%] items-center justify-center bg-[#DFF2E6] p-4">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
              <Ionicons name="leaf" size={50} color={PRIMARY} />
            </View>
            <Text className="mt-3 text-center text-[11px] font-bold text-[#48705B]">NGUỒN GỐC RÕ RÀNG</Text>
          </View>

          <View className="min-w-0 flex-1 gap-3 p-4">
            <View>
              <Text className="text-[25px] font-extrabold text-[#075E3B]">{item.muaVu.cayTrong}</Text>
              <Text className="mt-1 text-[13px] text-[#647269]">Từ {item.trangTrai.ten}</Text>
            </View>

            <View className="gap-2 rounded-xl bg-white p-3">
              <View className="flex-row justify-between gap-2">
                <Text className="text-[11px] text-[#859088]">Số lô</Text>
                <Text className="text-right text-[12px] font-extrabold text-[#263129]">{item.lo.maLo}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-[11px] text-[#859088]">Trang trại</Text>
                <Text numberOfLines={1} className="max-w-[70%] text-right text-[12px] font-extrabold text-[#263129]">{item.trangTrai.ten}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-[11px] text-[#859088]">Trạng thái lô</Text>
                <Text className="text-right text-[12px] font-extrabold text-[#263129]">{item.lo.trangThai}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 border-t border-[#D8E9DF] bg-white px-4 py-3">
          {item.chungNhan.slice(0, 3).map((certificate) => (
            <View key={`${certificate.loai}-${certificate.ma}`} className="flex-row items-center gap-1.5 rounded-full bg-[#E8F7ED] px-3 py-2">
              <Ionicons name="shield-checkmark" size={15} color={PRIMARY} />
              <Text className="text-[11px] font-bold text-[#075E3B]">{certificate.loai}</Text>
            </View>
          ))}
          {!item.thuHoi ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-[#E8F7ED] px-3 py-2">
              <Ionicons name="checkmark-circle" size={15} color={PRIMARY} />
              <Text className="text-[11px] font-bold text-[#075E3B]">Không có cảnh báo thu hồi</Text>
            </View>
          ) : null}
        </View>
      </View>

      {item.thuHoi ? (
        <View className="gap-2 rounded-[18px] border border-[#F1C5CA] bg-[#FFF5F6] p-4">
          <Badge variant="danger">CẢNH BÁO THU HỒI</Badge>
          <Text className="text-[18px] font-extrabold text-[#C93445]">Lô {item.lo.maLo} đã được thu hồi</Text>
          <Text className="text-[13px] leading-5 text-[#5C6460]">{item.thuHoi.thongBaoKhachHang}</Text>
          {item.thuHoi.thuHoiLuc ? (
            <Text className="text-xs text-[#8A7779]">Công bố: {dinhDangThoiGian(item.thuHoi.thuHoiLuc)}</Text>
          ) : null}
        </View>
      ) : null}

      <View>
        <Text className="text-[23px] font-extrabold text-[#17251C]">Hành trình từ nông trại đến tay bạn</Text>
        <Text className="mt-1 text-[13px] text-[#7C8880]">Các mốc được tổng hợp trực tiếp từ dữ liệu truy xuất công khai</Text>
      </View>

      {timeline.length > 0 ? (
        <View>
          {timeline.map((event, index) => (
            <TimelineRow key={event.id} item={event} last={index === timeline.length - 1} />
          ))}
        </View>
      ) : (
        <EmptyState title="Chưa có timeline" description="Hệ thống chưa có sự kiện công khai cho mã truy xuất này." />
      )}

      <View className="rounded-[20px] border border-[#DCE7DF] bg-white p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-[#E8F7ED]">
            <Ionicons name="location" size={24} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[17px] font-extrabold text-[#202A24]">Vị trí trang trại</Text>
            <Text className="mt-1 font-bold text-[#075E3B]">{item.trangTrai.ten}</Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#748078]">{item.trangTrai.diaChi}</Text>
          </View>
        </View>
        <View className="mt-4 flex-row gap-3 border-t border-[#EEF2EF] pt-4">
          <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
            <Text className="text-[11px] text-[#859088]">Ngày thu hoạch</Text>
            <Text className="mt-1 text-[13px] font-extrabold text-[#263129]">{dinhDangThoiGian(item.thuHoach.ngayThuHoach)}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
            <Text className="text-[11px] text-[#859088]">Hạn sử dụng</Text>
            <Text className="mt-1 text-[13px] font-extrabold text-[#263129]">{dinhDangThoiGian(item.lo.ngayHetHan)}</Text>
          </View>
        </View>
      </View>

      {item.chungNhan.length > 0 ? (
        <View className="gap-3">
          <Text className="text-[20px] font-extrabold text-[#17251C]">Chứng nhận công khai</Text>
          {item.chungNhan.map((certificate) => (
            <View key={`${certificate.loai}-${certificate.ma}`} className="flex-row items-start gap-3 rounded-[18px] border border-[#DCE7DF] bg-white p-4">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E8F7ED]">
                <Ionicons name="ribbon-outline" size={23} color={PRIMARY} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-extrabold text-[#075E3B]">{certificate.loai}</Text>
                <Text className="mt-1 text-[12px] text-[#56645B]">{certificate.donViCap}</Text>
                <Text className="mt-1 text-[11px] text-[#859088]">Mã {certificate.ma} · {certificate.ngayCap} → {certificate.ngayHetHan}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-4 rounded-[20px] bg-[#EAF7EF] p-5">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
          <Ionicons name={item.thuHoi ? 'alert-circle' : 'shield-checkmark'} size={36} color={item.thuHoi ? '#E6535F' : PRIMARY} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-bold text-[#4C5B52]">Trạng thái truy xuất</Text>
          <Text className={item.thuHoi ? 'mt-1 text-[28px] font-extrabold text-[#C93445]' : 'mt-1 text-[28px] font-extrabold text-[#075E3B]'}>
            {item.thuHoi ? 'Cần lưu ý' : 'Minh bạch'}
          </Text>
          <Text className="mt-1 text-[12px] leading-5 text-[#68756D]">Thông tin hiển thị được lấy từ hồ sơ lô và các mốc hệ thống đã công khai.</Text>
        </View>
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

  async function chiaSe() {
    if (!hopLe) return;
    await Share.share({
      message: `Mã truy xuất AgriMarket: ${ma}`,
      title: 'Truy xuất nguồn gốc AgriMarket',
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-3 border-b border-[#E7ECE9] bg-white px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => quayLaiHoacVe(router, '/quet-qr')}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
        >
          <Ionicons name="chevron-back" size={28} color={PRIMARY} />
        </Pressable>
        <View className="min-w-0 flex-1 items-center">
          <Text className="text-[22px] font-extrabold text-[#075E3B]">Truy xuất nguồn gốc</Text>
          <Text className="text-[12px] text-[#7C8880]">Minh bạch từ trang trại đến bàn ăn</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ mã truy xuất"
          disabled={!hopLe}
          onPress={() => void chiaSe()}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
        >
          <Ionicons name="share-social-outline" size={25} color={hopLe ? PRIMARY : '#B3BBB6'} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, padding: 16, paddingBottom: 40 }}
      >
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
