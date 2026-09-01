import { Alert, Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { AgriBadge } from '@/components/agri-badge';
import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { FarmCard } from '@/components/farm-card';
import { ProductCard } from '@/components/product-card';

const sanPhamMau = [
  {
    ten: 'Rau cải xanh',
    tenTrangTrai: 'Trang trại An Nhiên',
    giaTu: 32000,
    donVi: 'kg',
    nhan: ['Truy xuất được', 'Tươi mới'],
  },
  {
    ten: 'Cà chua hữu cơ',
    tenTrangTrai: 'Nông trại Mặt Trời',
    giaTu: 45000,
    donVi: 'kg',
    nhan: ['Có chứng nhận'],
  },
];

export default function TrangDesignSystem() {
  return (
    <AgriContainer py={{ base: 40, md: 64 }}>
      <Stack gap={56}>
        <Stack gap="lg" maw={760}>
          <Group gap="xs">
            <AgriBadge>PHIEN-041</AgriBadge>
            <AgriBadge loai="chung-nhan">Design System</AgriBadge>
          </Group>

          <Title order={1} fz={{ base: 38, sm: 52 }} lh={1.08}>
            Nền tảng giao diện Customer Web nhất quán
          </Title>

          <Text size="lg" c="dimmed" maw={680}>
            Preview các primitive dùng lại cho Customer Web. Trang chủ nghiệp vụ và dữ liệu public
            sẽ được triển khai ở PHIEN-042.
          </Text>

          <Group>
            <Button>Primary action</Button>
            <Button variant="default">Secondary action</Button>
          </Group>

          <Alert color="agrimarket" variant="light" title="Boundary PHIEN-041">
            Chưa gọi API sản phẩm, chưa xây Trang chủ thật và chưa triển khai Cart/Order.
          </Alert>
        </Stack>

        <Box>
          <Title order={2} mb="lg">
            ProductCard
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {sanPhamMau.map((item) => (
              <ProductCard key={item.ten} {...item} />
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Title order={2} mb="lg">
            FarmCard
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <FarmCard
              ten="Trang trại An Nhiên"
              diaChi="Hà Nội"
              moTa="Mô hình canh tác minh bạch, kết nối trực tiếp với dữ liệu truy xuất."
              soSanPham={12}
              daXacMinh
            />
            <FarmCard
              ten="Nông trại Mặt Trời"
              diaChi="Lâm Đồng"
              moTa="Nguồn nông sản theo mùa, ưu tiên chất lượng và độ tươi."
              soSanPham={8}
            />
          </SimpleGrid>
        </Box>

        <Box>
          <Title order={2} mb="lg">
            Skeleton
          </Title>
          <AgriSkeleton soLuong={3} />
        </Box>

        <Box>
          <Title order={2} mb="lg">
            EmptyState / ErrorState
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <EmptyState
              tieuDe="Chưa có nông sản"
              moTa="Danh sách trống được hiển thị bằng EmptyState dùng lại."
            />
            <ErrorState
              tieuDe="Không tải được nông sản"
              moTa="ErrorState sẵn sàng nhận callback thử lại từ Client Component."
            />
          </SimpleGrid>
        </Box>
      </Stack>
    </AgriContainer>
  );
}
