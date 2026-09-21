import { useLayNoiDungTrangChuCongKhai } from '@agrimarket/api-client';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArticleCardMobile } from '@/components/content/article-card';
import { EmptyState, ErrorState, ProductCardSkeleton } from '@/components/design-system';
import { PageHeader } from '@/components/v2/page-kit';
import {
  gopBaiVietKienThucMobile,
  gopBaiVietTinTucMobile,
  locBaiVietTheoTabMobile,
  type BaiVietMobile,
} from '@/lib/bai-viet-mobile';

type Mode = 'kien-thuc' | 'tin-tuc';

const CONFIG = {
  'kien-thuc': {
    title: 'Kiến thức',
    subtitle: 'Kỹ thuật trồng trọt, dinh dưỡng, mẹo chọn mua và câu chuyện nông dân.',
    defaultTab: 'tat-ca',
    tabs: [
      { id: 'tat-ca', label: 'Tất cả' },
      { id: 'ky-thuat', label: 'Kỹ thuật trồng trọt' },
      { id: 'dinh-duong', label: 'Dinh dưỡng' },
      { id: 'meo-chon', label: 'Mẹo chọn mua' },
      { id: 'cau-chuyen', label: 'Câu chuyện nông dân' },
    ],
  },
  'tin-tuc': {
    title: 'Tin tức',
    subtitle: 'Tin tức nông sản và câu chuyện từ các trang trại trên AgriMarket.',
    defaultTab: 'tin-tuc',
    tabs: [
      { id: 'tin-tuc', label: 'Tin tức' },
      { id: 'cau-chuyen', label: 'Câu chuyện trang trại' },
      { id: 'tat-ca', label: 'Tất cả' },
    ],
  },
} as const;

export function ContentListingMobile({ mode }: { mode: Mode }) {
  const router = useRouter();
  const config = CONFIG[mode];
  const [tab, setTab] = useState<string>(config.defaultTab);
  const query = useLayNoiDungTrangChuCongKhai();

  const all = useMemo(() => {
    const knowledge = query.data?.data?.kienThuc ?? [];
    if (mode === 'tin-tuc') {
      return gopBaiVietTinTucMobile(knowledge, query.data?.data?.cauChuyenTrangTrai ?? []);
    }
    return gopBaiVietKienThucMobile(knowledge);
  }, [query.data, mode]);

  const visible = useMemo(() => locBaiVietTheoTabMobile(all, tab), [all, tab]);

  async function openArticle(article: BaiVietMobile) {
    if (!article.href) return;
    if (/^https?:\/\//i.test(article.href)) {
      await Linking.openURL(article.href);
      return;
    }
    router.push(article.href as Href);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title={config.title} subtitle={config.subtitle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 14, paddingRight: 12 }}>
          {config.tabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable key={item.id} onPress={() => setTab(item.id)} className={active ? 'rounded-full bg-[#06633C] px-3 py-1.5' : 'rounded-full bg-[#EEF5F0] px-3 py-1.5'}>
                <Text className={active ? 'text-[11px] font-bold text-white' : 'text-[11px] font-semibold text-[#455E51]'}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {query.isPending ? (
          <View className="gap-3">{[0, 1, 2].map((key) => <ProductCardSkeleton key={key} />)}</View>
        ) : query.isError ? (
          <ErrorState title={`Không tải được ${config.title.toLowerCase()}`} description="Nội dung đang tạm thời không khả dụng." actionLabel="Thử lại" onAction={() => void query.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết phù hợp"
            description={all.length === 0 ? (mode === 'tin-tuc' ? 'Hiện chưa có tin tức nào. Hãy xem kiến thức nông sản trong lúc chờ cập nhật.' : 'Hiện chưa có bài viết nào. Hãy quay lại sau.') : 'Hiện chưa có bài viết cho mục đã chọn. Hãy thử mục khác.'}
            actionLabel={all.length > 0 ? 'Xem tất cả' : undefined}
            onAction={all.length > 0 ? () => setTab('tat-ca') : undefined}
          />
        ) : (
          <View className="gap-3">
            {visible.map((article) => <ArticleCardMobile key={article.id} article={article} onPress={() => void openArticle(article)} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
