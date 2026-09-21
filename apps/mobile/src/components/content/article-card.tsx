import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import type { BaiVietMobile } from '@/lib/bai-viet-mobile';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

export function ArticleCardMobile({ article, onPress }: { article: BaiVietMobile; onPress?: () => void }) {
  const imageUri = chuanHoaUrlAnhMobile(article.imageUrl);

  return (
    <Pressable disabled={!onPress} onPress={onPress} className="overflow-hidden rounded-[10px] border border-[#DDE8DF] bg-white active:opacity-80">
      {imageUri ? (
        <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: '100%', height: 150 }} />
      ) : (
        <Image source={article.imageSource} contentFit="cover" style={{ width: '100%', height: 150 }} />
      )}
      <View className="p-3">
        <View className="self-start rounded-[4px] bg-[#EBF5EE] px-2 py-1">
          <Text className="text-[10px] font-bold text-[#0B7A48]">{article.tag}</Text>
        </View>
        <Text numberOfLines={2} className="mt-1.5 min-h-[38px] text-[13px] font-extrabold leading-[19px] text-[#173126]">{article.title}</Text>
        {article.moTa ? <Text numberOfLines={2} className="mt-1 text-[11px] leading-4 text-[#66736B]">{article.moTa}</Text> : null}
        {article.date ? (
          <View className="mt-2 flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={12} color="#7E8982" />
            <Text className="text-[10px] text-[#7E8982]">{article.date}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
