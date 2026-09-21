import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/v2/page-kit';

const ITEMS = [
  'Email và thông tin hồ sơ được dùng để xác thực và liên hệ về giao dịch.',
  'Địa chỉ nhận hàng được dùng cho checkout, giao hàng và lưu snapshot trên đơn.',
  'Ứng dụng mobile không lưu mật khẩu; refresh token được lưu qua SecureStore và access token chỉ giữ trong phiên chạy ứng dụng.',
  'Ảnh bằng chứng khiếu nại chỉ được gắn với tài khoản đã tải tệp và yêu cầu tương ứng.',
  'Thông tin đánh giá công khai được hạn chế hiển thị danh tính để giảm lộ dữ liệu không cần thiết.',
  'Dữ liệu nghiệp vụ có thể được giữ theo yêu cầu kiểm toán, đối soát và truy xuất nguồn gốc của hệ thống.',
];

export default function BaoMatMobile() {
  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title="Chính sách bảo mật" subtitle="Dữ liệu khách hàng trên AgriMarket Mobile" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <View className="rounded-[18px] border border-[#DCE7DF] bg-white p-5">
          <Text className="text-[20px] font-black leading-7 text-[#17251C]">Chính sách bảo mật AgriMarket</Text>
          <Text className="mt-3 text-[12px] leading-5 text-[#66736B]">AgriMarket chỉ sử dụng dữ liệu cần thiết để vận hành tài khoản, đơn hàng, giao hàng, truy xuất nguồn gốc và hỗ trợ sau bán.</Text>
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
