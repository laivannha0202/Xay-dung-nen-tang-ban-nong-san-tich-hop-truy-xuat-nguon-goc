import {
  hienThiTonKhaDung,
  useLayChiTietSanPhamCongKhai,
  useLayDanhSachDanhGiaSanPham,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductCardSkeleton,
  Skeleton,
} from '@/components/design-system';
import { GIO_HANG_MOBILE_QUERY_KEY, themMucGioHangMobile } from '@/lib/api-gio-hang';
import {
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  layWishlistTaiKhoanMobile,
  themWishlistTaiKhoanMobile,
  xoaWishlistTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import {
  layVaXoaHanhDongSauDangNhap,
  moDangNhap,
} from '@/lib/auth-navigation';
import { ghiNhanSanPhamDaXem } from '@/lib/da-xem-gan-day';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function dinhDangSoLuong(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function dinhDangQuyCach(khoiLuong: number, donVi: string): string {
  const unit = donVi.trim().toLowerCase();
  if (unit === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((unit === 'l' || unit === 'lít' || unit === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }
  return `${dinhDangSoLuong(khoiLuong)}${unit === 'quả' || unit === 'qua' ? ' quả' : unit}`;
}

function textBinhLuanDanhGia(binhLuan: unknown): string | null {
  if (typeof binhLuan === 'string') return binhLuan.trim() || null;
  if (binhLuan && typeof binhLuan === 'object') {
    const record = binhLuan as Record<string, unknown>;
    for (const key of ['noiDung', 'text', 'content', 'binhLuan', 'nhanXet']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}

function dinhDangNgayDanhGia(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

type BienTheHieuLucToiThieu = {
  gia?: number | null;
  giaGoc?: number | null;
  giaHieuLuc?: number | null;
  loaiGia?: string | null;
  dangGiam?: boolean | null;
  phanTramGiam?: number | null;
};

type GiaBanLienQuanToiThieu = {
  dangGiam?: boolean | null;
  loaiGia?: string | null;
  phanTramGiam?: number | null;
  giaGocDaiDien?: number | null;
  giaHieuLucDaiDien?: number | null;
};

function laSoDuongHienThi(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Giá hiệu lực customer phải thấy; fallback catalog `gia` khi thiếu/không dương. */
function giaHieuLucCuaBienThe(bienThe: BienTheHieuLucToiThieu | null | undefined): number | null {
  if (!bienThe) return null;
  if (laSoDuongHienThi(bienThe.giaHieuLuc)) return bienThe.giaHieuLuc;
  if (laSoDuongHienThi(bienThe.gia)) return bienThe.gia;
  return null;
}

/** Giá gốc hiển thị gạch ngang; null khi không có số dương. */
function giaGocCuaBienThe(bienThe: BienTheHieuLucToiThieu | null | undefined): number | null {
  if (!bienThe) return null;
  const giaGoc = bienThe.giaGoc ?? bienThe.gia ?? null;
  return laSoDuongHienThi(giaGoc) ? giaGoc : null;
}

/** Chỉ true khi backend khẳng định đang giảm (mirror web coGiamGiaBienThe). */
function coGiamGiaBienTheMobile(bienThe: BienTheHieuLucToiThieu | null | undefined): boolean {
  if (!bienThe || bienThe.dangGiam !== true) return false;
  if (bienThe.loaiGia !== 'FLASH_SALE') return false;
  if (typeof bienThe.phanTramGiam !== 'number' || bienThe.phanTramGiam <= 0) return false;
  const giaGoc = bienThe.giaGoc ?? bienThe.gia ?? null;
  return laSoDuongHienThi(giaGoc) && laSoDuongHienThi(bienThe.giaHieuLuc);
}

/** Guard sale cho card liên quan (mirror web coGiamGia trên giaBan). */
function coGiamGiaLienQuanMobile(giaBan: GiaBanLienQuanToiThieu | null | undefined): boolean {
  if (!giaBan || giaBan.dangGiam !== true) return false;
  if (giaBan.loaiGia !== 'FLASH_SALE') return false;
  if (typeof giaBan.phanTramGiam !== 'number' || giaBan.phanTramGiam <= 0) return false;
  return laSoDuongHienThi(giaBan.giaGocDaiDien) && laSoDuongHienThi(giaBan.giaHieuLucDaiDien);
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7ED]">
          <Ionicons name={icon} size={22} color={PRIMARY} />
        </View>
        <Text className="text-[21px] font-extrabold text-[#17251C]">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietSanPham() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const [soLuong, setSoLuong] = useState(1);
  const [trangDanhGia, setTrangDanhGia] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);
  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);
  const {
    data: danhGiaData,
    isPending: danhGiaPending,
    isError: danhGiaLoi,
    refetch: taiLaiDanhGia,
  } = useLayDanhSachDanhGiaSanPham(id, {
    trang: trangDanhGia,
    gioiHan: 5,
  });

  const wishlistQuery = useQuery({
    queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
    queryFn: layWishlistTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId, soLuong }: { bienTheSanPhamId: string; soLuong: number }) =>
      themMucGioHangMobile(bienTheSanPhamId, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
      setCtaMessage('Đã thêm vào giỏ hàng.');
    },
    onError: () => {
      setCtaMessage('Không thêm được vào giỏ. Hãy kiểm tra giá và tồn kho hiện tại.');
    },
  });

  const muaNgayMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId, soLuong }: { bienTheSanPhamId: string; soLuong: number }) =>
      themMucGioHangMobile(bienTheSanPhamId, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
      setCtaMessage(null);
      router.push('/thanh-toan');
    },
    onError: () => {
      setCtaMessage('Không thể chuyển đến thanh toán. Vui lòng kiểm tra lại tồn kho.');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: ({ favorite }: { favorite: boolean }) =>
      favorite ? xoaWishlistTaiKhoanMobile(id) : themWishlistTaiKhoanMobile(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!daDangNhap || !id || themGioHangMutation.isPending || muaNgayMutation.isPending) return;
    const returnTo = `/san-pham/${encodeURIComponent(id)}`;
    const pendingAction = layVaXoaHanhDongSauDangNhap(returnTo);
    if (!pendingAction) return;

    if (pendingAction.loai === 'them-gio-hang') {
      const soLuongChoPhep = Number.isInteger(pendingAction.soLuong) && pendingAction.soLuong > 0
        ? pendingAction.soLuong
        : 1;
      setSoLuong(soLuongChoPhep);
      themGioHangMutation.mutate({
        bienTheSanPhamId: pendingAction.bienTheSanPhamId,
        soLuong: soLuongChoPhep,
      });
      return;
    }

    if (pendingAction.loai === 'mua-ngay') {
      const soLuongChoPhep = Number.isInteger(pendingAction.soLuong) && pendingAction.soLuong > 0
        ? pendingAction.soLuong
        : 1;
      setSoLuong(soLuongChoPhep);
      muaNgayMutation.mutate({
        bienTheSanPhamId: pendingAction.bienTheSanPhamId,
        soLuong: soLuongChoPhep,
      });
    }
  }, [daDangNhap, id]);

  const item = data?.data;

  useEffect(() => {
    if (!item?.id) return;
    void ghiNhanSanPhamDaXem(item.id);
  }, [item?.id]);

  const favorite = useMemo(
    () => wishlistQuery.data?.duLieu.some((wishlistItem) => wishlistItem.sanPhamId === id) ?? false,
    [id, wishlistQuery.data?.duLieu],
  );

  const bienTheDaChon = useMemo(() => {
    if (!item) return null;
    const daChon = item.bienThe.find((bienThe) => bienThe.id === bienTheDaChonId);
    if (daChon) return daChon;
    return item.bienThe.find((bienThe) => bienThe.soLuongKhaDung > 0) ?? item.bienThe[0] ?? null;
  }, [item, bienTheDaChonId]);

  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort(
      (a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu,
    );
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;
  const related = relatedData?.data.duLieu ?? [];
  const thuHoach = item?.thuHoachGanNhatTaiTrangTrai ?? null;
  const coTheDatHang = Boolean(bienTheDaChon) && (bienTheDaChon?.soLuongKhaDung ?? 0) > 0;

  const giaHieuLucDaChon = giaHieuLucCuaBienThe(bienTheDaChon);
  const giamGiaDaChon = coGiamGiaBienTheMobile(bienTheDaChon);
  const giaGocDaChon = giaGocCuaBienThe(bienTheDaChon);

  const anhChinhUrl = useMemo(
    () => chuanHoaUrlAnhMobile(anhDangXem?.url ?? null),
    [anhDangXem?.url],
  );

  const giaTuHienThi = laSoDuongHienThi(item?.giaBan?.tu) ? item?.giaBan?.tu : item?.gia.tu;
  const giaDenHienThi = laSoDuongHienThi(item?.giaBan?.den) ? item?.giaBan?.den : item?.gia.den;

  const tongDanhGia = danhGiaData?.data.tong ?? 0;
  const gioiHanDanhGia =
    danhGiaData?.data.gioiHan && danhGiaData.data.gioiHan > 0 ? danhGiaData.data.gioiHan : 5;
  const tongTrangDanhGia = Math.max(1, Math.ceil(tongDanhGia / gioiHanDanhGia));
  const trangDanhGiaHienTai = danhGiaData?.data.trang ?? trangDanhGia;

  useEffect(() => {
    setTrangDanhGia(1);
  }, [id]);

  useEffect(() => {
    setImageFailed(false);
  }, [id, anhDangXem?.url]);

  function moSanPham(productId: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id: productId } });
  }

  function toggleFavorite() {
    if (!id) return;
    if (!daDangNhap) {
      moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`);
      return;
    }
    if (!wishlistMutation.isPending) wishlistMutation.mutate({ favorite });
  }

  function themVaoGioHang() {
    if (!bienTheDaChon || !coTheDatHang) return;
    const soLuongHopLe = Math.max(1, Math.min(Math.floor(soLuong) || 1, Math.max(1, Math.floor(bienTheDaChon.soLuongKhaDung))));

    if (!daDangNhap) {
      const returnTo = `/san-pham/${encodeURIComponent(id)}`;
      setCtaMessage('Hãy đăng nhập để tiếp tục thêm sản phẩm vào giỏ.');
      moDangNhap(router, returnTo, {
        loai: 'them-gio-hang',
        returnTo,
        bienTheSanPhamId: bienTheDaChon.id,
        soLuong: soLuongHopLe,
      });
      return;
    }

    themGioHangMutation.mutate({ bienTheSanPhamId: bienTheDaChon.id, soLuong: soLuongHopLe });
  }

  function muaNgay() {
    if (!bienTheDaChon || !coTheDatHang) return;
    const soLuongHopLe = Math.max(1, Math.min(Math.floor(soLuong) || 1, Math.max(1, Math.floor(bienTheDaChon.soLuongKhaDung))));

    if (!daDangNhap) {
      const returnTo = `/san-pham/${encodeURIComponent(id)}`;
      setCtaMessage('Hãy đăng nhập để tiếp tục mua sản phẩm.');
      moDangNhap(router, returnTo, {
        loai: 'mua-ngay',
        returnTo,
        bienTheSanPhamId: bienTheDaChon.id,
        soLuong: soLuongHopLe,
      });
      return;
    }

    muaNgayMutation.mutate({ bienTheSanPhamId: bienTheDaChon.id, soLuong: soLuongHopLe });
  }

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 py-3"><Skeleton height={46} borderRadius={14} /></View>
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 20, padding: 20 }}>
          <Skeleton height={340} borderRadius={24} />
          <Skeleton width="85%" height={34} />
          <Skeleton width="60%" height={24} />
          <ProductCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !item) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => quayLaiHoacVe(router, '/kham-pha')}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name="chevron-back" size={28} color={PRIMARY} />
          </Pressable>
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được sản phẩm"
            description="Sản phẩm có thể không còn công khai hoặc API đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-[#E7ECE9] bg-white px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => quayLaiHoacVe(router, '/kham-pha')}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
        >
          <Ionicons name="chevron-back" size={28} color={PRIMARY} />
        </Pressable>
        <Text numberOfLines={1} className="mx-2 flex-1 text-center text-[18px] font-extrabold text-[#17452F]">
          Chi tiết nông sản
        </Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onPress={toggleFavorite}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={25} color={favorite ? '#E6535F' : PRIMARY} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Giỏ hàng"
            onPress={() => router.push('/gio-hang')}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name="cart-outline" size={25} color={PRIMARY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 26, paddingBottom: 148 }}
      >
        <View className="gap-3">
            <View className="overflow-hidden bg-[#EFF6F1]">
            {anhDangXem && anhChinhUrl && !imageFailed ? (
              <Image
                source={{ uri: anhChinhUrl }}
                contentFit="contain"
                transition={150}
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: 280 }}
              />
            ) : (
              <View className="h-[280px] items-center justify-center bg-[#EAF5EE]">
                <Ionicons name="leaf-outline" size={58} color={PRIMARY} />
                <Text className="mt-3 font-bold text-[#075E3B]">AgriMarket</Text>
                <Text className="mt-1 text-sm text-[#7C8880]">Sản phẩm chưa có ảnh công khai</Text>
              </View>
            )}
          </View>

          {anhSapXep.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {anhSapXep.map((anh) => {
                const selected = anh.url === anhDangXem?.url;
                const thumbUrl = chuanHoaUrlAnhMobile(anh.url) ?? anh.url;
                return (
                  <Pressable
                    key={`${anh.url}-${anh.thuTu}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setAnhDaChonUrl(anh.url)}
                    className={[
                      'overflow-hidden rounded-xl border-2',
                      selected ? 'border-primary' : 'border-[#E1E8E3]',
                    ].join(' ')}
                  >
                    <Image source={{ uri: thumbUrl }} contentFit="cover" style={{ width: 70, height: 70 }} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View className="px-5">
          <View className="rounded-[12px] border border-[#E2EAE4] bg-white p-4">
            <View className="flex-row flex-wrap gap-2">
              <Badge variant="neutral">{item.danhMuc.ten}</Badge>
              <Badge variant={item.khaDung.coTheDatHang ? 'success' : 'warning'}>
                {item.khaDung.coTheDatHang ? 'Có thể đặt hàng' : 'Tạm chưa thể đặt'}
              </Badge>
            </View>

            <Text className="mt-2 text-[24px] font-extrabold leading-8 text-[#17251C]">{item.ten}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: item.trangTrai.id } })}
              className="mt-1 flex-row items-center gap-2 active:opacity-70"
            >
              <Ionicons name="storefront-outline" size={16} color={PRIMARY} />
              <Text numberOfLines={1} className="flex-1 text-[13px] font-semibold text-[#4D5C53]">{item.trangTrai.ten} · {item.trangTrai.diaChi}</Text>
              <Ionicons name="chevron-forward" size={15} color={PRIMARY} />
            </Pressable>

            {item.danhGia.tongLuot > 0 && item.danhGia.diemTrungBinh !== null ? (
              <View className="mt-2 flex-row items-center gap-1.5" accessibilityRole="text" accessibilityLabel={`Đánh giá ${item.danhGia.diemTrungBinh.toFixed(1)} trên 5 từ ${item.danhGia.tongLuot} lượt`}>
                <View className="flex-row items-center">
                  {[1, 2, 3, 4, 5].map((sao) => (
                    <Ionicons
                      key={sao}
                      name={sao <= Math.round(item.danhGia.diemTrungBinh ?? 0) ? 'star' : 'star-outline'}
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text className="text-[13px] font-bold text-[#334139]">
                  {item.danhGia.diemTrungBinh.toFixed(1)}/5
                </Text>
                <Text className="text-[12px] text-[#7C8880]">({item.danhGia.tongLuot} đánh giá)</Text>
              </View>
            ) : (
              <Text className="mt-2 text-[13px] text-[#7C8880]">Chưa có đánh giá</Text>
            )}

            <View className="mt-3 flex-row flex-wrap items-end gap-2">
              <Text className="text-[24px] font-extrabold text-[#087A4B]">
                {giaHieuLucDaChon !== null ? dinhDangGia(giaHieuLucDaChon) : dinhDangGia(item.gia.tu)}
              </Text>
              {bienTheDaChon && giamGiaDaChon && giaGocDaChon !== null ? (
                <View className="flex-row items-center gap-2 pb-0.5">
                  <Text className="text-[13px] text-[#7C8880] line-through">{dinhDangGia(giaGocDaChon)}</Text>
                  <View className="rounded-[4px] bg-[#E53935] px-1.5 py-0.5">
                    <Text className="text-[10px] font-extrabold text-white">
                      -{Math.round(bienTheDaChon.phanTramGiam ?? 0)}%
                    </Text>
                  </View>
                </View>
              ) : null}
              {bienTheDaChon ? (
                <Text className="text-[11px] text-[#7C8880]">
                  {dinhDangQuyCach(bienTheDaChon.khoiLuong, bienTheDaChon.donVi)}
                </Text>
              ) : null}
            </View>
          </View>

          {item.moTa ? <Text className="mt-4 text-[14px] leading-6 text-[#5F6D64]">{item.moTa}</Text> : null}
        </View>

        <View className="px-5">
          <Section title="Chọn quy cách" icon="options-outline">
            {item.bienThe.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {item.bienThe.map((bienThe) => {
                  const selected = bienThe.id === bienTheDaChon?.id;
                  const outOfStock = bienThe.soLuongKhaDung <= 0;
                  const giaHieuLuc = giaHieuLucCuaBienThe(bienThe) ?? bienThe.gia;
                  const giamGia = coGiamGiaBienTheMobile(bienThe);
                  const giaGoc = giaGocCuaBienThe(bienThe);
                  return (
                    <Pressable
                      key={bienThe.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: outOfStock }}
                      disabled={outOfStock}
                      onPress={() => {
                        setBienTheDaChonId(bienThe.id);
                        setSoLuong(1);
                        setCtaMessage(null);
                      }}
                      className={[
                        'min-w-[112px] rounded-[16px] border px-4 py-3',
                        selected ? 'border-primary bg-[#EAF7EF]' : 'border-[#DDE5E0] bg-white',
                        outOfStock ? 'opacity-40' : 'active:opacity-80',
                      ].join(' ')}
                    >
                      <Text className={selected ? 'font-extrabold text-[#075E3B]' : 'font-bold text-[#334139]'}>
                        {dinhDangQuyCach(bienThe.khoiLuong, bienThe.donVi)}
                      </Text>
                      <Text className="mt-1 text-[11px] text-[#7C8880]">{dinhDangGia(giaHieuLuc)}</Text>
                      {giamGia && giaGoc !== null ? (
                        <View className="mt-1 flex-row items-center gap-1.5">
                          <Text className="text-[10px] text-[#9AA5A0] line-through">{dinhDangGia(giaGoc)}</Text>
                          <Text className="text-[10px] font-extrabold text-[#E53935]">
                            -{Math.round(bienThe.phanTramGiam ?? 0)}%
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState title="Chưa có biến thể" description="Hệ thống chưa trả biến thể có thể bán cho sản phẩm này." />
            )}
          </Section>
        </View>

        <View className="px-5">
          <Section title="Số lượng" icon="calculator-outline">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center overflow-hidden rounded-xl border border-[#DDE5E0] bg-white">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Giảm số lượng"
                  disabled={soLuong <= 1 || themGioHangMutation.isPending}
                  onPress={() => setSoLuong((current) => Math.max(1, current - 1))}
                  className={[
                    'h-11 w-12 items-center justify-center',
                    soLuong <= 1 || themGioHangMutation.isPending ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                  ].join(' ')}
                >
                  <Ionicons name="remove" size={21} color="#334139" />
                </Pressable>
                <View className="h-11 min-w-14 items-center justify-center border-x border-[#DDE5E0] px-4">
                  <Text className="text-[16px] font-extrabold text-[#263129]">{soLuong}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tăng số lượng"
                  disabled={!coTheDatHang || themGioHangMutation.isPending || soLuong >= Math.max(1, Math.floor(bienTheDaChon?.soLuongKhaDung ?? 1))}
                  onPress={() => setSoLuong((current) => current + 1)}
                  className="h-11 w-12 items-center justify-center active:bg-[#F1F7F3]"
                >
                  <Ionicons name="add" size={21} color="#334139" />
                </Pressable>
              </View>
              <View className="flex-col items-end gap-1">
                <Text className="max-w-[150px] text-right text-[11px] leading-4 text-[#7C8880]">
                  {bienTheDaChon ? `Còn ${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} đơn vị khả dụng` : ''}
                </Text>
                {coTheDatHang &&
                bienTheDaChon &&
                bienTheDaChon.soLuongKhaDung > 0 &&
                bienTheDaChon.soLuongKhaDung <= 10 ? (
                  <Text className="max-w-[150px] text-right text-[11px] font-extrabold leading-4 text-[#B66A12]">
                    Chỉ còn {dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} đơn vị
                  </Text>
                ) : null}
              </View>
            </View>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Thông tin sản phẩm" icon="information-circle-outline">
            <View className="overflow-hidden rounded-[18px] border border-[#E1E8E3] bg-white">
              <View className="flex-row items-center justify-between gap-3 p-4">
                <Text className="text-[13px] text-[#718078]">Tồn khả dụng</Text>
                <Text className={coTheDatHang ? 'font-extrabold text-[#087A4B]' : 'font-extrabold text-[#D6454F]'}>
                  {bienTheDaChon ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} đơn vị` : item.khaDung.lyDo}
                </Text>
              </View>
              <View className="h-px bg-[#EEF2EF]" />
              <View className="flex-row items-center justify-between gap-3 p-4">
                <Text className="text-[13px] text-[#718078]">Mã trang trại</Text>
                <Text className="font-bold text-[#334139]">{item.trangTrai.ma}</Text>
              </View>
              {typeof giaTuHienThi === 'number' &&
              typeof giaDenHienThi === 'number' &&
              giaDenHienThi > giaTuHienThi ? (
                <>
                  <View className="h-px bg-[#EEF2EF]" />
                  <View className="flex-row items-center justify-between gap-3 p-4">
                    <Text className="text-[13px] text-[#718078]">Khoảng giá</Text>
                    <Text className="font-bold text-[#334139]">{dinhDangGia(giaTuHienThi)} – {dinhDangGia(giaDenHienThi)}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Trang trại" icon="business-outline">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: item.trangTrai.id } })}
              className="flex-row items-center gap-4 rounded-[20px] border border-[#DCE7DF] bg-[#F7FAF8] p-4 active:opacity-80"
            >
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E1F2E7]">
                <Ionicons name="leaf" size={32} color={PRIMARY} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-extrabold text-[#202A24]">{item.trangTrai.ten}</Text>
                <Text numberOfLines={2} className="mt-1 text-[12px] leading-5 text-[#718078]">{item.trangTrai.diaChi}</Text>
                <Text className="mt-2 font-bold text-[#087A4B]">Xem trang trại →</Text>
              </View>
            </Pressable>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Thu hoạch" icon="basket-outline">
            {thuHoach ? (
              <View className="gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
                    <Text className="text-[11px] text-[#859088]">Ngày thu hoạch</Text>
                    <Text className="mt-1 font-extrabold text-[#263129]">{thuHoach.ngayThuHoach}</Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
                    <Text className="text-[11px] text-[#859088]">Phân loại</Text>
                    <Text className="mt-1 font-extrabold text-[#263129]">{thuHoach.phanLoai}</Text>
                  </View>
                </View>
                <Text className="text-[13px] text-[#617168]">{thuHoach.cayTrong} · giống {thuHoach.giong}</Text>
              </View>
            ) : (
              <View className="rounded-[18px] border border-[#E1E8E3] bg-white p-4">
                <Text className="text-[13px] leading-5 text-[#5F6D64]">
                  Sản phẩm này chưa gắn với lô thu hoạch cụ thể. Quét mã truy xuất trên bao bì để xem nguồn gốc theo lô thực tế.
                </Text>
              </View>
            )}
          </Section>
        </View>

        {item.chungNhan.length > 0 ? (
          <View className="px-5">
            <Section title="Chứng nhận" icon="ribbon-outline">
              <View className="gap-3">
                {item.chungNhan.map((chungNhan) => (
                  <View key={`${chungNhan.loai}-${chungNhan.ma}`} className="flex-row items-start gap-3 rounded-[18px] border border-[#DCE7DF] bg-white p-4">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E8F7ED]">
                      <Ionicons name="shield-checkmark" size={23} color={PRIMARY} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-extrabold text-[#075E3B]">{chungNhan.loai}</Text>
                      <Text className="mt-1 text-[12px] text-[#55635A]">{chungNhan.donViCap}</Text>
                      <Text className="mt-1 text-[11px] text-[#879189]">Mã {chungNhan.ma} · hết hạn {chungNhan.ngayHetHan}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        ) : null}

        <View className="px-5">
          <Section title="Đánh giá" icon="star-outline">
            {danhGiaPending ? (
              <View className="gap-3">
                <Skeleton height={86} borderRadius={18} />
                <Skeleton height={86} borderRadius={18} />
              </View>
            ) : danhGiaLoi || !danhGiaData?.data ? (
              <View className="gap-2 rounded-[18px] border border-[#E1E8E3] bg-white p-4">
                <Text className="font-bold text-[#334139]">Không tải được đánh giá</Text>
                <Text className="text-[13px] leading-5 text-[#5F6D64]">
                  Danh sách đánh giá đang tạm thời không khả dụng.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Thử tải lại đánh giá"
                  onPress={() => void taiLaiDanhGia()}
                  className="mt-1 self-start rounded-xl bg-[#087A4B] px-4 py-2.5 active:opacity-80"
                >
                  <Text className="font-extrabold text-white">Thử lại</Text>
                </Pressable>
              </View>
            ) : danhGiaData.data.tong > 0 ? (
              <View className="gap-3">
                {danhGiaData.data.items.map((danhGia) => {
                  const noiDung = textBinhLuanDanhGia(danhGia.binhLuan);
                  return (
                    <View key={danhGia.id} className="gap-2 rounded-[18px] border border-[#E1E8E3] bg-white p-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="min-w-0 flex-1">
                          <Text numberOfLines={1} className="font-extrabold text-[#263129]">{danhGia.nguoiDanhGia}</Text>
                          <Text className="mt-0.5 text-[11px] text-[#859088]">{dinhDangNgayDanhGia(danhGia.createdAt)}</Text>
                        </View>
                        <View className="flex-row items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((sao) => (
                            <Ionicons
                              key={sao}
                              name={sao <= danhGia.diem ? 'star' : 'star-outline'}
                              size={13}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                      </View>
                      <Text className="text-[13px] leading-5 text-[#5F6D64]">
                        {noiDung ?? 'Không có bình luận.'}
                      </Text>
                    </View>
                  );
                })}
                <Text className="text-[12px] text-[#7C8880]">
                  Hiển thị {danhGiaData.data.items.length}/{danhGiaData.data.tong} đánh giá · Chỉ khách hàng đã nhận sản phẩm mới có thể gửi đánh giá.
                </Text>
                {tongTrangDanhGia > 1 ? (
                  <View className="flex-row items-center justify-between gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Trang đánh giá trước"
                      disabled={trangDanhGiaHienTai <= 1}
                      onPress={() => setTrangDanhGia((trang) => Math.max(1, trang - 1))}
                      className={[
                        'h-11 min-w-11 flex-row items-center justify-center gap-1 rounded-xl border border-[#DDE5E0] bg-white px-3',
                        trangDanhGiaHienTai <= 1 ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                      ].join(' ')}
                    >
                      <Ionicons name="chevron-back" size={18} color="#334139" />
                      <Text className="font-bold text-[#334139]">Trước</Text>
                    </Pressable>
                    <Text className="text-[12px] font-bold text-[#334139]">
                      Trang {trangDanhGiaHienTai} / {tongTrangDanhGia}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Trang đánh giá tiếp theo"
                      disabled={trangDanhGiaHienTai >= tongTrangDanhGia}
                      onPress={() => setTrangDanhGia((trang) => Math.min(tongTrangDanhGia, trang + 1))}
                      className={[
                        'h-11 min-w-11 flex-row items-center justify-center gap-1 rounded-xl border border-[#DDE5E0] bg-white px-3',
                        trangDanhGiaHienTai >= tongTrangDanhGia ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                      ].join(' ')}
                    >
                      <Text className="font-bold text-[#334139]">Sau</Text>
                      <Ionicons name="chevron-forward" size={18} color="#334139" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="rounded-[18px] border border-[#E1E8E3] bg-white p-4">
                <Text className="font-bold text-[#334139]">Chưa có đánh giá</Text>
                <Text className="mt-1 text-[13px] leading-5 text-[#5F6D64]">
                  Sản phẩm chưa có đánh giá từ khách hàng đã mua.
                </Text>
              </View>
            )}
          </Section>
        </View>

        <View className="px-5">
          <Section title="Truy xuất nguồn gốc" icon="qr-code-outline">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/quet-qr')}
              className="flex-row items-center gap-4 rounded-[20px] bg-[#075E3B] p-5 active:opacity-85"
            >
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-extrabold text-white">Quét đúng mã trên lô bạn đang cầm</Text>
                <Text className="mt-1 text-[12px] leading-5 text-white/75">Mã truy xuất thuộc từng lô/QR cụ thể, không gán giả cho toàn bộ sản phẩm.</Text>
              </View>
              <Ionicons name="chevron-forward" size={23} color="#FFFFFF" />
            </Pressable>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Có thể bạn cũng quan tâm" icon="sparkles-outline">
            {relatedPending ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <View style={{ width: 220 }}><ProductCardSkeleton /></View>
                <View style={{ width: 220 }}><ProductCardSkeleton /></View>
              </ScrollView>
            ) : related.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {related.slice(0, 4).map((product) => {
                  const giaTuLienQuan = product.giaBan?.tu ?? product.gia.tu;
                  const giaDenLienQuan = product.giaBan?.den ?? product.gia.den;
                  const giamGiaLienQuan = coGiamGiaLienQuanMobile(product.giaBan);
                  return (
                    <View key={product.id} style={{ width: 220 }}>
                      <ProductCard
                        name={product.ten}
                        farmName={product.trangTrai.ten}
                        price={giaTuLienQuan}
                        priceTo={giaDenLienQuan > giaTuLienQuan ? giaDenLienQuan : undefined}
                        originalPrice={giamGiaLienQuan ? product.giaBan.giaGocDaiDien : undefined}
                        discountPercent={giamGiaLienQuan ? product.giaBan.phanTramGiam : undefined}
                        unit={dinhDangQuyCach(product.quyCach.khoiLuong, product.quyCach.donVi)}
                        imageUrl={product.anhBiaUrl}
                        badges={product.chungNhan
                          .map((chungNhan) => ({ label: chungNhan.loai, variant: 'success' as const }))
                          .filter((badge) => badge.label)}
                        rating={product.danhGia?.diemTrungBinh ?? undefined}
                        reviewCount={product.danhGia?.tongLuot ?? 0}
                        stockText={
                          product.khaDung.coTheDatHang &&
                          product.khaDung.soLuongKhaDung > 0 &&
                          product.khaDung.soLuongKhaDung <= 10
                            ? `Chỉ còn ${hienThiTonKhaDung(product.khaDung.soLuongKhaDung)}`
                            : null
                        }
                        hetHang={!product.khaDung.coTheDatHang}
                        favorite={wishlistQuery.data?.duLieu.some((wish) => wish.sanPhamId === product.id) ?? false}
                        onFavorite={() => {
                          if (!daDangNhap) {
                            moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`);
                            return;
                          }
                          const isFavorite = wishlistQuery.data?.duLieu.some((wish) => wish.sanPhamId === product.id) ?? false;
                          const action = isFavorite ? xoaWishlistTaiKhoanMobile(product.id) : themWishlistTaiKhoanMobile(product.id);
                          void action.then(() => queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY }));
                        }}
                        onPress={() => moSanPham(product.id)}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <EmptyState title="Chưa có sản phẩm liên quan" description="Hệ thống chưa trả sản phẩm liên quan cho danh mục này." />
            )}
          </Section>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-[#E4EAE6] bg-white px-4 pb-3 pt-2.5">
        {ctaMessage ? <Text className="mb-1.5 text-center text-[11px] text-[#68756D]">{ctaMessage}</Text> : null}
        {/* ROW 1: variant + price */}
        <View className="mb-1.5 flex-row items-center gap-2">
          <Text numberOfLines={1} className="min-w-0 flex-1 text-[11px] text-[#7C8880]">
            {bienTheDaChon ? dinhDangQuyCach(bienTheDaChon.khoiLuong, bienTheDaChon.donVi) : 'Chưa có biến thể'}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Text numberOfLines={1} className="text-[16px] font-extrabold text-[#087A4B]">
              {giaHieuLucDaChon !== null ? dinhDangGia(giaHieuLucDaChon) : dinhDangGia(item.gia.tu)}
            </Text>
            {bienTheDaChon && giamGiaDaChon && giaGocDaChon !== null ? (
              <>
                <Text className="text-[11px] text-[#7C8880] line-through">{dinhDangGia(giaGocDaChon)}</Text>
                <Text className="text-[11px] font-extrabold text-[#E53935]">
                  -{Math.round(bienTheDaChon.phanTramGiam ?? 0)}%
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {/* ROW 2: CTA buttons */}
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={!coTheDatHang || themGioHangMutation.isPending}
            onPress={themVaoGioHang}
            className={[
              'min-h-[48px] flex-1 flex-row items-center justify-center gap-1 rounded-[10px] bg-[#087A4B] px-2.5',
              coTheDatHang && !themGioHangMutation.isPending ? 'active:opacity-80' : 'opacity-40',
            ].join(' ')}
          >
            <Text className="text-[12px] font-extrabold text-white">
              {themGioHangMutation.isPending ? 'Đang thêm…' : coTheDatHang ? 'Thêm vào giỏ' : 'Tạm hết hàng'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!coTheDatHang || themGioHangMutation.isPending || muaNgayMutation.isPending}
            onPress={muaNgay}
            className={[
              'min-h-[48px] flex-1 flex-row items-center justify-center gap-1 rounded-[10px] bg-[#075E3B] px-2.5',
              coTheDatHang && !themGioHangMutation.isPending && !muaNgayMutation.isPending
                ? 'active:opacity-80'
                : 'opacity-40',
            ].join(' ')}
          >
            <Text className="text-[12px] font-extrabold text-white">
              {muaNgayMutation.isPending ? 'Đang xử lý…' : coTheDatHang ? 'Thêm & thanh toán' : 'Tạm hết hàng'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
