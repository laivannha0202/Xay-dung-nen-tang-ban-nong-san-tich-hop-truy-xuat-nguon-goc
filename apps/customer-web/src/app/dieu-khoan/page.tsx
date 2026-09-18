import type { Metadata } from 'next';
import { Paper, Stack, Text, Title } from '@mantine/core';

import { AgriContainer } from '@/components/agri-container';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng nền tảng AgriMarket.',
};

export default function TrangDieuKhoan() {
  return (
    <AgriContainer py={{ base: 32, md: 56 }}>
      <Paper withBorder radius="lg" p={{ base: 'lg', md: 'xl' }}>
        <Stack gap="lg">
          <Title order={1}>Điều khoản sử dụng AgriMarket</Title>
          <Text c="dimmed">
            Điều khoản này áp dụng cho kênh khách hàng của AgriMarket trong phạm vi đồ án
            nền tảng bán nông sản tích hợp truy xuất nguồn gốc.
          </Text>
          <ul
            data-agrimarket-legal-list="v6.3"
            style={{
              margin: 0,
              paddingLeft: 22,
              display: 'grid',
              gap: 10,
              lineHeight: 1.65,
            }}
          >
            <li>Khách hàng cung cấp thông tin tài khoản và địa chỉ chính xác khi đặt hàng.</li>
            <li>Giá, tồn kho, khuyến mãi và tổng thanh toán được backend xác nhận tại thời điểm checkout.</li>
            <li>Đơn chỉ được hủy khi trạng thái đơn, thanh toán và giữ tồn kho còn cho phép.</li>
            <li>Đánh giá và yêu cầu hỗ trợ chỉ áp dụng cho sản phẩm thuộc đơn hàng của chính khách hàng.</li>
            <li>Yêu cầu hỗ trợ phải được gửi trong thời hạn hệ thống quy định và có bằng chứng phù hợp khi cần.</li>
            <li>AgriMarket có quyền từ chối thao tác bất thường, gian lận voucher/flash sale hoặc vượt tồn khả dụng.</li>
          </ul>
          <Text size="sm" c="dimmed">Cập nhật: 16/09/2026.</Text>
        </Stack>
      </Paper>
    </AgriContainer>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
