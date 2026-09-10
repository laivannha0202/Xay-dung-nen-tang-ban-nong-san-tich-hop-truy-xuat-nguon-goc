import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  dieuKienKhieuNaiMobileQueryKey,
  layDieuKienKhieuNaiMobile,
  LY_DO_KHIEU_NAI_MOBILE,
  taiBangChungKhieuNaiMobile,
  taoKhieuNaiMobile,
  type LyDoKhieuNaiMobile,
} from '@/lib/api-phan-hoi';
import {
  KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY,
  khieuNaiTaiKhoanDetailQueryKey,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const SO_TEP_TOI_DA = 5;
const GIOI_HAN_TEP_BYTES = 5 * 1024 * 1024;
const MIME_HOP_LE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PRIMARY = '#087A4B';

type BangChungDaChon = ImagePicker.ImagePickerAsset;

function tenBangChung(asset: ImagePicker.ImagePickerAsset, index: number): string {
  return (
    asset.fileName ??
    `bang-chung-${index + 1}.${
      asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/webp' ? 'webp' : 'jpg'
    }`
  );
}

function validateAsset(asset: ImagePicker.ImagePickerAsset): string | null {
  if (!asset.mimeType || !MIME_HOP_LE.has(asset.mimeType)) {
    return 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.';
  }

  if (typeof asset.fileSize === 'number' && asset.fileSize > GIOI_HAN_TEP_BYTES) {
    return 'Mỗi ảnh bằng chứng tối đa 5 MiB.';
  }

  return null;
}

async function assetThanhFile(asset: ImagePicker.ImagePickerAsset, index: number): Promise<File> {
  const loi = validateAsset(asset);
  if (loi) throw new Error(loi);

  if (asset.file) {
    if (asset.file.size > GIOI_HAN_TEP_BYTES) {
      throw new Error('Mỗi ảnh bằng chứng tối đa 5 MiB.');
    }
    return asset.file;
  }

  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new Error('Không đọc được ảnh bằng chứng trên thiết bị.');
  }

  const blob = await response.blob();
  if (blob.size > GIOI_HAN_TEP_BYTES) {
    throw new Error('Mỗi ảnh bằng chứng tối đa 5 MiB.');
  }

  return new File([blob], tenBangChung(asset, index), { type: asset.mimeType });
}

function ComplaintSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={110} borderRadius={22} />
      <Skeleton height={170} borderRadius={22} />
      <Skeleton height={240} borderRadius={22} />
    </View>
  );
}

export default function TrangTaoKhieuNai() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mucDonHangId?: string | string[] }>();
  const mucDonHangId = Array.isArray(params.mucDonHangId)
    ? (params.mucDonHangId[0] ?? '')
    : (params.mucDonHangId ?? '');

  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [lyDo, setLyDo] = useState<LyDoKhieuNaiMobile | null>(null);
  const [moTa, setMoTa] = useState('');
  const [bangChung, setBangChung] = useState<BangChungDaChon[]>([]);
  const [loiBangChung, setLoiBangChung] = useState<string | null>(null);

  const query = useQuery({
    queryKey: dieuKienKhieuNaiMobileQueryKey(mucDonHangId),
    queryFn: () => layDieuKienKhieuNaiMobile(mucDonHangId),
    enabled: daDangNhap && mucDonHangId.length > 0,
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !lyDo ||
        moTa.trim().length < 10 ||
        moTa.trim().length > 2000 ||
        !query.data?.coTheKhieuNai
      ) {
        throw new Error('Vui lòng kiểm tra lại lý do và nội dung yêu cầu.');
      }

      const files = await Promise.all(
        bangChung.map((asset, index) => assetThanhFile(asset, index)),
      );
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await taiBangChungKhieuNaiMobile(file));
      }

      return taoKhieuNaiMobile({
        mucDonHangId,
        lyDo,
        moTa: moTa.trim(),
        ...(uploaded.length > 0 ? { tepTinIds: uploaded.map((item) => item.id) } : {}),
      });
    },
    onSuccess: (complaint) => {
      queryClient.setQueryData(khieuNaiTaiKhoanDetailQueryKey(complaint.id), complaint);
      void queryClient.invalidateQueries({ queryKey: KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY });
    },
  });

  const nhanLyDo = useMemo(
    () => LY_DO_KHIEU_NAI_MOBILE.find((item) => item.value === lyDo)?.label ?? 'Chưa chọn',
    [lyDo],
  );

  function themAssets(assets: ImagePicker.ImagePickerAsset[]) {
    setLoiBangChung(null);
    const remaining = SO_TEP_TOI_DA - bangChung.length;

    if (remaining <= 0) {
      setLoiBangChung(`Tối đa ${SO_TEP_TOI_DA} ảnh bằng chứng.`);
      return;
    }

    const hopLe: ImagePicker.ImagePickerAsset[] = [];
    for (const asset of assets) {
      const loi = validateAsset(asset);
      if (loi) {
        setLoiBangChung(loi);
        continue;
      }
      if (
        bangChung.some((current) => current.uri === asset.uri) ||
        hopLe.some((current) => current.uri === asset.uri)
      ) {
        continue;
      }
      hopLe.push(asset);
    }

    const next = [...bangChung, ...hopLe.slice(0, remaining)];
    if (hopLe.length > remaining) {
      setLoiBangChung(`Chỉ giữ tối đa ${SO_TEP_TOI_DA} ảnh bằng chứng.`);
    }
    setBangChung(next);
  }

  async function chupAnh() {
    if (bangChung.length >= SO_TEP_TOI_DA) {
      setLoiBangChung(`Tối đa ${SO_TEP_TOI_DA} ảnh bằng chứng.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setLoiBangChung('Cần quyền camera để chụp ảnh bằng chứng.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled) themAssets(result.assets);
  }

  async function chonTuThuVien() {
    const remaining = SO_TEP_TOI_DA - bangChung.length;
    if (remaining <= 0) {
      setLoiBangChung(`Tối đa ${SO_TEP_TOI_DA} ảnh bằng chứng.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setLoiBangChung('Cần quyền thư viện ảnh để chọn bằng chứng.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (!result.canceled) themAssets(result.assets);
  }

  if (!mucDonHangId) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Chưa chọn sản phẩm cần hỗ trợ"
            description="Hãy mở một sản phẩm trong chi tiết đơn hàng để gửi yêu cầu."
            actionLabel="Xem đơn hàng"
            onAction={() => router.replace('/don-hang')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="px-5 py-5">
          <ComplaintSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để gửi yêu cầu hỗ trợ"
            description="AgriMarket sẽ kiểm tra sản phẩm thuộc đúng tài khoản và đã được giao."
            actionLabel="Đăng nhập"
            onAction={() =>
              moDangNhap(
                router,
                `/khieu-nai/tao?mucDonHangId=${encodeURIComponent(mucDonHangId)}`,
              )
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không kiểm tra được điều kiện hỗ trợ"
            description="Sản phẩm không tồn tại, không thuộc tài khoản hoặc hệ thống đang tạm thời không phản hồi."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dieuKien = query.data;

  if (mutation.data) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 20, padding: 20 }}
        >
          <View className="items-center gap-4 rounded-[26px] border border-[#B8DFC6] bg-white p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E4F5EA]">
              <Ionicons name="checkmark-circle" size={36} color={PRIMARY} />
            </View>
            <Badge variant="success">Đã gửi thành công</Badge>
            <View className="items-center gap-2">
              <Text className="text-center text-[24px] font-extrabold text-[#17251C]">
                Yêu cầu đã được ghi nhận
              </Text>
              <Text className="text-center text-[13px] leading-5 text-[#748078]">
                AgriMarket đã nhận yêu cầu về {mutation.data.mucDonHang.tenSanPham} cùng {mutation.data.bangChung.length} ảnh bằng chứng.
              </Text>
            </View>
            <View className="w-full gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.replace({
                    pathname: '/tai-khoan/khieu-nai/[id]',
                    params: { id: mutation.data.id },
                  })
                }
                className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 active:opacity-80"
              >
                <Ionicons name="document-text-outline" size={19} color="#FFFFFF" />
                <Text className="font-extrabold text-white">Xem yêu cầu vừa gửi</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.replace({
                    pathname: '/don-hang/[id]',
                    params: { id: mutation.data.donHang.id },
                  })
                }
                className="min-h-[52px] items-center justify-center rounded-2xl border border-[#DCE7DF] bg-white px-4 active:opacity-80"
              >
                <Text className="font-extrabold text-[#087A4B]">Về chi tiết đơn hàng</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const formHopLe =
    dieuKien.coTheKhieuNai &&
    lyDo !== null &&
    moTa.trim().length >= 10 &&
    moTa.trim().length <= 2000 &&
    loiBangChung === null;

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 22, paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="pt-2">
          <MobileBrandBar />
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => quayLaiHoacVe(router, '/don-hang')}
            className="flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
          >
            <Ionicons name="chevron-back" size={18} color={PRIMARY} />
            <Text className="text-[13px] font-bold text-[#087A4B]">Đơn hàng</Text>
          </Pressable>
          <Badge variant={dieuKien.coTheKhieuNai ? 'success' : 'warning'}>
            {dieuKien.coTheKhieuNai ? 'Có thể gửi yêu cầu' : 'Chưa thể gửi yêu cầu'}
          </Badge>
        </View>

        <View className="gap-2">
          <Text className="text-[29px] font-extrabold tracking-[-0.5px] text-[#17251C]">
            Yêu cầu hỗ trợ
          </Text>
          <Text className="text-[13px] leading-5 text-[#748078]">
            Chia sẻ vấn đề bạn gặp phải. Thông tin đơn hàng sẽ được AgriMarket kiểm tra trước khi ghi nhận.
          </Text>
        </View>

        <View className="flex-row items-start gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7EF]">
            <Ionicons name="bag-check-outline" size={23} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={2} className="text-[16px] font-extrabold text-[#263129]">
              {dieuKien.tenSanPham}
            </Text>
            <Text className="text-[11px] text-[#89948D]">SKU {dieuKien.sku}</Text>
            <Text className={dieuKien.coTheKhieuNai ? 'text-[12px] font-bold text-[#168556]' : 'text-[12px] font-bold text-[#B76A00]'}>
              {dieuKien.coTheKhieuNai
                ? 'Sản phẩm đủ điều kiện gửi yêu cầu.'
                : (dieuKien.lyDo ?? 'Sản phẩm chưa đủ điều kiện gửi yêu cầu.')}
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Text className="text-[12px] font-extrabold text-white">1</Text>
            </View>
            <Text className="text-[18px] font-extrabold text-[#17251C]">Chọn vấn đề</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {LY_DO_KHIEU_NAI_MOBILE.map((option) => {
              const selected = option.value === lyDo;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setLyDo(option.value)}
                  className={[
                    'rounded-full border px-4 py-2.5',
                    selected ? 'border-primary bg-primary' : 'border-[#DCE7DF] bg-white',
                  ].join(' ')}
                >
                  <Text className={selected ? 'font-bold text-white' : 'font-bold text-[#405047]'}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Text className="text-[12px] font-extrabold text-white">2</Text>
            </View>
            <Text className="text-[18px] font-extrabold text-[#17251C]">Mô tả tình trạng</Text>
          </View>
          <TextInput
            value={moTa}
            onChangeText={setMoTa}
            placeholder="Ví dụ: sản phẩm bị dập nhiều khi mở hộp..."
            placeholderTextColor="#99A29D"
            multiline
            maxLength={2000}
            textAlignVertical="top"
            className="min-h-36 rounded-[20px] border border-[#DCE7DF] bg-white px-4 py-4 text-[14px] leading-5 text-[#263129]"
          />
          <Text className={moTa.trim().length >= 10 ? 'text-right text-[11px] text-[#89948D]' : 'text-right text-[11px] text-[#B76A00]'}>
            {moTa.trim().length}/2000 · tối thiểu 10 ký tự
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Text className="text-[12px] font-extrabold text-white">3</Text>
            </View>
            <Text className="text-[18px] font-extrabold text-[#17251C]">Thêm ảnh bằng chứng</Text>
          </View>
          <Text className="text-[12px] leading-5 text-[#748078]">
            Không bắt buộc · tối đa {SO_TEP_TOI_DA} ảnh JPEG, PNG hoặc WebP · mỗi ảnh tối đa 5 MiB.
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => void chupAnh()}
              className="min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-[#B9DCC7] bg-white px-3 active:opacity-80"
            >
              <Ionicons name="camera-outline" size={20} color={PRIMARY} />
              <Text className="font-extrabold text-[#087A4B]">Chụp ảnh</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void chonTuThuVien()}
              className="min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-[#B9DCC7] bg-white px-3 active:opacity-80"
            >
              <Ionicons name="images-outline" size={20} color={PRIMARY} />
              <Text className="font-extrabold text-[#087A4B]">Thư viện</Text>
            </Pressable>
          </View>

          {loiBangChung ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
              <Ionicons name="alert-circle-outline" size={19} color="#C93445" />
              <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">{loiBangChung}</Text>
            </View>
          ) : null}

          {bangChung.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {bangChung.map((asset, index) => (
                <View key={`${asset.uri}-${index}`} className="w-36 overflow-hidden rounded-[18px] border border-[#DCE7DF] bg-white">
                  <Image source={{ uri: asset.uri }} style={{ width: '100%', height: 108 }} contentFit="cover" />
                  <View className="gap-2 p-2.5">
                    <Text numberOfLines={2} className="text-[11px] font-bold text-[#405047]">
                      {tenBangChung(asset, index)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ ảnh ${index + 1}`}
                      onPress={() =>
                        setBangChung((current) => current.filter((_, currentIndex) => currentIndex !== index))
                      }
                      className="flex-row items-center justify-center gap-1 rounded-lg bg-[#FFF0F1] px-2 py-1.5 active:opacity-75"
                    >
                      <Ionicons name="trash-outline" size={14} color="#C93445" />
                      <Text className="text-[11px] font-bold text-[#C93445]">Bỏ ảnh</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="flex-row items-center gap-2 rounded-2xl bg-[#F1F5F2] p-3">
              <Ionicons name="image-outline" size={18} color="#7A857E" />
              <Text className="text-[12px] text-[#748078]">Chưa có ảnh bằng chứng.</Text>
            </View>
          )}
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Text className="text-[12px] font-extrabold text-white">4</Text>
            </View>
            <Text className="text-[18px] font-extrabold text-[#17251C]">Xác nhận</Text>
          </View>
          <View className="gap-2 rounded-2xl bg-[#F7FAF8] p-3">
            <Text className="text-[13px] text-[#56645B]">Lý do: <Text className="font-extrabold text-[#263129]">{nhanLyDo}</Text></Text>
            <Text className="text-[13px] text-[#56645B]">Ảnh bằng chứng: <Text className="font-extrabold text-[#263129]">{bangChung.length}/{SO_TEP_TOI_DA}</Text></Text>
          </View>

          {mutation.isError ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
              <Ionicons name="alert-circle-outline" size={19} color="#C93445" />
              <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">
                {thongBaoLoiApi(mutation.error, 'Không gửi được yêu cầu hỗ trợ.')}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !formHopLe, busy: mutation.isPending }}
            disabled={!formHopLe || mutation.isPending}
            onPress={() => mutation.mutate()}
            className={[
              'min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4',
              !formHopLe || mutation.isPending ? 'opacity-40' : 'active:opacity-80',
            ].join(' ')}
          >
            <Ionicons name="send-outline" size={20} color="#FFFFFF" />
            <Text className="text-[15px] font-extrabold text-white">
              {mutation.isPending ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu hỗ trợ'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
