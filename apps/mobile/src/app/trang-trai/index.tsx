import {
  type LayDanhSachTrangTraiCongKhaiParams,
  useLayDanhSachTrangTraiCongKhai,
} from '@agrimarket/api-client';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { EmptyState, ErrorState, FarmCard, FarmCardSkeleton } from '@/components/design-system';
import { PageHeader } from '@/components/v2/page-kit';

const GIOI_HAN = 12;

export default function DanhSachTrangTraiMobile() {
  const router = useRouter();
  const [trang, setTrang] = useState(1);
  const query = useLayDanhSachTrangTraiCongKhai({
    trang,
    gioiHan: GIOI_HAN,
  } as unknown as LayDanhSachTrangTraiCongKhaiParams);

  const duLieu = query.data?.data.duLieu ?? [];
  const tong = query.data?.data.tong ?? 0;
  const soTrang = Math.max(1, Math.ceil(tong / GIOI_HAN));

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title="Trang trại" subtitle={`${tong.toLocaleString('vi-VN')} hồ sơ công khai`} />
      <FlatList
        data={duLieu}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 12, flexGrow: 1 }}
        refreshing={query.isFetching && !query.isPending}
        onRefresh={() => void query.refetch()}
        ListEmptyComponent={
          query.isPending ? (
            <View className="gap-3">
              {[0, 1, 2, 3].map((key) => <FarmCardSkeleton key={key} />)}
            </View>
          ) : query.isError ? (
            <ErrorState
              title="Chưa thể tải danh sách trang trại"
              description="Hệ thống chưa trả về dữ liệu trang trại công khai."
              actionLabel="Thử lại"
              onAction={() => void query.refetch()}
            />
          ) : (
            <EmptyState
              title="Chưa có trang trại công khai"
              description="Trang trại sẽ xuất hiện khi hồ sơ đủ điều kiện công khai trên AgriMarket."
            />
          )
        }
        renderItem={({ item }) => (
          <FarmCard
            name={item.ten}
            address={item.diaChi}
            imageUrl={item.anhBiaUrl}
            certification={item.chungNhan[0]?.loai ?? null}
            onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: item.id } })}
          />
        )}
        ListFooterComponent={
          soTrang > 1 ? (
            <View className="mt-3 flex-row items-center justify-center gap-3">
              <Pressable
                disabled={trang <= 1 || query.isFetching}
                onPress={() => setTrang((value) => Math.max(1, value - 1))}
                className={`rounded-xl border border-[#DCE7DF] bg-white px-4 py-3 ${trang <= 1 ? 'opacity-40' : ''}`}
              >
                <Text className="text-[12px] font-extrabold text-[#425249]">Trang trước</Text>
              </Pressable>
              <Text className="text-[12px] font-bold text-[#6E7D74]">{trang} / {soTrang}</Text>
              <Pressable
                disabled={trang >= soTrang || query.isFetching}
                onPress={() => setTrang((value) => Math.min(soTrang, value + 1))}
                className={`rounded-xl border border-[#DCE7DF] bg-white px-4 py-3 ${trang >= soTrang ? 'opacity-40' : ''}`}
              >
                <Text className="text-[12px] font-extrabold text-[#425249]">Trang sau</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
