import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  dieuKienKhieuNaiMobileQueryKey,
  layDieuKienKhieuNaiMobile,
  LY_DO_KHIEU_NAI_MOBILE,
  taiBangChungKhieuNaiMobile,
  taoKhieuNaiMobile,
  type LyDoKhieuNaiMobile,
} from '@/lib/api-phan-hoi';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const SO_TEP_TOI_DA = 5;
const GIOI_HAN_TEP_BYTES = 5 * 1024 * 1024;
const MIME_HOP_LE = new Set(['image/jpeg', 'image/png', 'image/webp']);

type BangChungDaChon = ImagePicker.ImagePickerAsset;

function tenBangChung(asset: ImagePicker.ImagePickerAsset, index: number): string {
  return (
    asset.fileName ??
    `bang-chung-${index + 1}.${asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/webp' ? 'webp' : 'jpg'}`
  );
}

function validateAsset(asset: ImagePicker.ImagePickerAsset): string | null {
  if (!asset.mimeType || !MIME_HOP_LE.has(asset.mimeType)) {
    return 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP theo TepTinService Backend.';
  }

  if (typeof asset.fileSize === 'number' && asset.fileSize > GIOI_HAN_TEP_BYTES) {
    return 'Mỗi ảnh bằng chứng tối đa 5 MiB.';
  }

  return null;
}

async function assetThanhFile(asset: ImagePicker.ImagePickerAsset, index: number): Promise<File> {
  const loi = validateAsset(asset);

  if (loi) {
    throw new Error(loi);
  }

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

  return new File([blob], tenBangChung(asset, index), {
    type: asset.mimeType,
  });
}

function ComplaintSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={110} borderRadius={18} />
      <Skeleton height={160} borderRadius={18} />
      <Skeleton height={220} borderRadius={18} />
    </View>
  );
}

export default function TrangTaoKhieuNai() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mucDonHangId?: string | string[];
  }>();

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
        throw new Error('Dữ liệu khiếu nại chưa hợp lệ.');
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
        ...(uploaded.length > 0
          ? {
              tepTinIds: uploaded.map((item) => item.id),
            }
          : {}),
      });
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

    if (!result.canceled) {
      themAssets(result.assets);
    }
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

    if (!result.canceled) {
      themAssets(result.assets);
    }
  }

  if (!mucDonHangId) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Chưa chọn sản phẩm cần khiếu nại"
            description="Mở khiếu nại từ một sản phẩm trong chi tiết đơn hàng."
            actionLabel="Xem đơn hàng"
            onAction={() => router.replace('/don-hang')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <View className="flex-1 px-5 py-4">
          <ComplaintSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để gửi khiếu nại"
            description="Backend sẽ xác minh sản phẩm thuộc đúng tài khoản và đã được giao."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không kiểm tra được điều kiện khiếu nại"
            description="Order item không tồn tại, không thuộc tài khoản này hoặc API đang tạm lỗi."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dieuKien = query.data;

  if (mutation.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            gap: 20,
            padding: 20,
          }}
        >
          <View className="gap-4 rounded-3xl border border-success bg-card p-5">
            <Badge variant="success">Đã gửi khiếu nại</Badge>
            <Text className="text-2xl font-bold text-foreground">
              {mutation.data.mucDonHang.tenSanPham}
            </Text>
            <Text className="text-sm text-foreground">Đơn: {mutation.data.donHang.maDonHang}</Text>
            <Text className="text-sm text-foreground">Lý do: {nhanLyDo}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{mutation.data.moTa}</Text>
            <Text className="text-sm text-muted-foreground">
              Backend đã gắn {mutation.data.bangChung.length} bằng chứng.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.replace({
                  pathname: '/don-hang/[id]',
                  params: {
                    id: mutation.data.donHang.id,
                  },
                })
              }
              className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-primary-foreground">Về chi tiết đơn hàng</Text>
            </Pressable>
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>
        <Badge variant={dieuKien.coTheKhieuNai ? 'success' : 'warning'}>
          {dieuKien.coTheKhieuNai ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
        </Badge>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: 24,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Gửi khiếu nại</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Backend xác minh quyền sở hữu item, trạng thái đã giao, MIME file và bằng chứng trước
            khi tạo complaint.
          </Text>
        </View>

        <View className="gap-2 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">{dieuKien.tenSanPham}</Text>
          <Text className="text-sm text-muted-foreground">SKU {dieuKien.sku}</Text>
          <Text
            className={dieuKien.coTheKhieuNai ? 'text-sm text-success' : 'text-sm text-warning'}
          >
            {dieuKien.coTheKhieuNai
              ? 'Backend xác nhận item đủ điều kiện khiếu nại.'
              : (dieuKien.lyDo ?? 'Backend chưa cho phép khiếu nại item này.')}
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">1. Lý do</Text>
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
                    selected ? 'border-primary bg-primary' : 'border-border bg-card',
                  ].join(' ')}
                >
                  <Text
                    className={
                      selected
                        ? 'font-semibold text-primary-foreground'
                        : 'font-semibold text-foreground'
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">2. Mô tả</Text>
          <TextInput
            value={moTa}
            onChangeText={setMoTa}
            placeholder="Mô tả tình trạng sản phẩm và vấn đề bạn gặp phải"
            placeholderTextColor="#737373"
            multiline
            maxLength={2000}
            textAlignVertical="top"
            className="min-h-32 rounded-2xl border border-border bg-card px-4 py-4 text-foreground"
          />
          <Text
            className={
              moTa.trim().length >= 10
                ? 'text-right text-xs text-muted-foreground'
                : 'text-right text-xs text-warning'
            }
          >
            {moTa.trim().length}/2000 · tối thiểu 10 ký tự
          </Text>
        </View>

        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-lg font-bold text-foreground">3. Camera / thư viện ảnh</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              Không bắt buộc · tối đa 5 ảnh · mỗi ảnh tối đa 5 MiB · chỉ JPEG/PNG/WebP theo
              TepTinService.
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void chupAnh();
              }}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-primary bg-card px-3 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-primary">Chụp ảnh</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void chonTuThuVien();
              }}
              className="min-h-12 flex-1 items-center justify-center rounded-xl border border-primary bg-card px-3 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-primary">Chọn thư viện</Text>
            </Pressable>
          </View>

          {loiBangChung ? (
            <Text className="text-sm leading-5 text-danger">{loiBangChung}</Text>
          ) : null}

          {bangChung.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {bangChung.map((asset, index) => (
                <View
                  key={`${asset.uri}-${index}`}
                  className="w-36 gap-2 rounded-2xl border border-border bg-card p-2"
                >
                  <Image
                    source={{ uri: asset.uri }}
                    style={{
                      width: '100%',
                      height: 104,
                      borderRadius: 12,
                    }}
                    contentFit="cover"
                  />
                  <Text numberOfLines={2} className="text-xs text-foreground">
                    {tenBangChung(asset, index)}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    {asset.fileSize ? `${Math.ceil(asset.fileSize / 1024)} KiB` : asset.mimeType}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setBangChung((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    className="items-center rounded-lg border border-danger px-2 py-1.5 active:opacity-80"
                  >
                    <Text className="text-xs font-semibold text-danger">Bỏ ảnh</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text className="text-sm text-muted-foreground">Chưa có bằng chứng đính kèm.</Text>
          )}
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">4. Xác nhận</Text>
          <Text className="text-sm text-foreground">Lý do: {nhanLyDo}</Text>
          <Text className="text-sm text-foreground">Bằng chứng: {bangChung.length}/5 ảnh</Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            Ảnh sẽ upload trước qua `taiTepTin`; sau đó complaint chỉ gửi các `tepTinIds` Backend đã
            ghi nhận.
          </Text>

          {mutation.isError ? (
            <Text className="text-sm leading-5 text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Không gửi được khiếu nại.'}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!formHopLe || mutation.isPending}
            onPress={() => mutation.mutate()}
            className={[
              'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
              !formHopLe || mutation.isPending ? 'opacity-40' : 'active:opacity-80',
            ].join(' ')}
          >
            <Text className="font-semibold text-primary-foreground">
              {mutation.isPending ? 'Đang upload và gửi…' : 'Gửi khiếu nại'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
