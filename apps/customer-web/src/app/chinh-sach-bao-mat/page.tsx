import type { Metadata } from 'next';
import { List, Paper, Stack, Text, Title } from '@mantine/core';

import { AgriContainer } from '@/components/agri-container';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật dữ liệu khách hàng AgriMarket.',
};

export default function TrangChinhSachBaoMat() {
  return (
    <AgriContainer py={{ base: 32, md: 56 }}>
      <Paper withBorder radius="lg" p={{ base: 'lg', md: 'xl' }}>
        <Stack gap="lg">
          <Title order={1}>Chính sách bảo mật AgriMarket</Title>
          <Text c="dimmed">
            AgriMarket chỉ sử dụng dữ liệu cần thiết để vận hành tài khoản, đơn hàng,
            giao hàng, truy xuất nguồn gốc và hỗ trợ sau bán.
          </Text>
          <List spacing="sm">
            <List.Item>Email và thông tin hồ sơ được dùng để xác thực và liên hệ về giao dịch.</List.Item>
            <List.Item>Địa chỉ nhận hàng được dùng cho checkout, giao hàng và lưu snapshot trên đơn.</List.Item>
            <List.Item>Refresh token Web được lưu bằng HttpOnly cookie; frontend không lưu mật khẩu hoặc refresh token trong JavaScript storage.</List.Item>
            <List.Item>Ảnh bằng chứng khiếu nại chỉ được gắn với tài khoản đã tải tệp và yêu cầu tương ứng.</List.Item>
            <List.Item>Thông tin đánh giá công khai được hạn chế hiển thị danh tính để giảm lộ dữ liệu không cần thiết.</List.Item>
            <List.Item>Dữ liệu nghiệp vụ có thể được giữ theo yêu cầu kiểm toán, đối soát và truy xuất nguồn gốc của hệ thống.</List.Item>
          </List>
          <Text size="sm" c="dimmed">Cập nhật: 16/09/2026.</Text>
        </Stack>
      </Paper>
    </AgriContainer>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
