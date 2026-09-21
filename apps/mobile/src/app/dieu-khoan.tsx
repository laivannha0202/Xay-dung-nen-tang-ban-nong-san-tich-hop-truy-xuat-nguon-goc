import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/v2/page-kit';

const ITEMS = [
  'Khách hàng cung cấp thông tin tài khoản và địa chỉ chính xác khi đặt hàng.',
  'Giá, tồn kho, khuyến mãi và tổng thanh toán được backend xác nhận tại thời điểm checkout.',
  'Đơn chỉ được hủy khi trạng thái đơn, thanh toán và giữ tồn kho còn cho phép.',
  'Đánh giá và yêu cầu hỗ trợ chỉ áp dụng cho sản phẩm thuộc đơn hàng của chính khách hàng.',
  'Yêu cầu hỗ trợ phải được gửi trong thời hạn hệ thống quy định và có bằng chứng phù hợp khi cần.',
  'AgriMarket có quyền từ chối thao tác bất thường, gian lận voucher/flash sale hoặc vượt tồn khả dụng.',
];

export default function DieuKhoanMobile() {
  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title="Điều khoản sử dụng" subtitle="Điều khoản kênh khách hàng AgriMarket" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <View className="rounded-[18px] border border-[#DCE7DF] bg-white p-5">
          <Text className="text-[20px] font-black leading-7 text-[#17251C]">Điều khoản sử dụng AgriMarket</Text>
          <Text className="mt-3 text-[12px] leading-5 text-[#66736B]">Điều khoản này áp dụng cho kênh khách hàng của AgriMarket trong phạm vi đồ án nền tảng bán nông sản tích hợp truy xuất nguồn gốc.</Text>
          <View className="mt-4 gap-3">
            {ITEMS.map((item, index) => (
              <View key={item} className="flex-row gap-3">
                <View className="mt-1 h-6 w-6 items-center justify-center rounded-full bg-[#EAF7EF]"><Text className="text-[10px] font-black text-[#087A4B]">{index + 1}</Text></View>
                <Text className="flex-1 text-[12px] leading-5 text-[#425249]">{item}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-5 text-[10px] text-[#8A958E]">Cập nhật: 16/09/2026.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
