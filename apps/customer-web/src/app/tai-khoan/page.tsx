import { Button, Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { AgriContainer } from '@/components/agri-container';
import { HoSoKhachHangContent } from '@/components/ho-so-khach-hang-content';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';

const LOI_TAT_TAI_KHOAN = [
  {
    title: 'Đơn hàng của tôi',
    description: 'Theo dõi trạng thái đặt hàng, thanh toán và giao nhận.',
    href: '/don-hang',
    action: 'Xem đơn hàng',
  },
  {
    title: 'Gợi ý cho bạn',
    description: 'Khám phá nông sản được sắp xếp theo tín hiệu mua sắm của tài khoản.',
    href: '/goi-y',
    action: 'Xem gợi ý',
  },
  {
    title: 'Sản phẩm yêu thích',
    description: 'Quay lại nhanh những sản phẩm bạn đã lưu.',
    href: '/yeu-thich',
    action: 'Mở yêu thích',
  },
  {
    title: 'Trang trại theo dõi',
    description: 'Theo dõi các trang trại bạn quan tâm và thông tin mới liên quan.',
    href: '/theo-doi',
    action: 'Xem trang trại',
  },
  {
    title: 'Thông báo',
    description: 'Xem các đợt thu hoạch mới từ những trang trại bạn đang theo dõi.',
    href: '/thong-bao',
    action: 'Xem thông báo',
  },
  {
    title: 'Khiếu nại & hỗ trợ',
    description: 'Theo dõi các yêu cầu hỗ trợ phát sinh từ đơn hàng của bạn.',
    href: '/khieu-nai',
    action: 'Xem yêu cầu',
  },
  {
    title: 'Truy xuất nguồn gốc',
    description: 'Kiểm tra hành trình của lô nông sản bằng mã truy xuất hoặc QR.',
    href: '/truy-xuat',
    action: 'Truy xuất ngay',
  },
] as const;

export default function TrangTaiKhoan() {
  return (
    <AgriContainer py={{ base: 'lg', md: 'xl' }}>
      <Stack gap="xl">
        <Stack gap={6}>
          <Text size="xs" fw={800} c="agrimarket.7" tt="uppercase" lts={0.8}>
            Tài khoản AgriMarket
          </Text>
          <Title order={1}>Trung tâm tài khoản</Title>
          <Text c="dimmed" maw={720}>
            Quản lý hồ sơ, địa chỉ nhận hàng và truy cập nhanh các chức năng mua sắm được đồng
            bộ với ứng dụng Mobile.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {LOI_TAT_TAI_KHOAN.map((item) => (
            <Card key={item.href} withBorder radius="md" padding="lg">
              <Stack gap="md" h="100%">
                <Stack gap={5} style={{ flex: 1 }}>
                  <Text fw={850} fz="lg">
                    {item.title}
                  </Text>
                  <Text size="sm" c="dimmed" lh={1.55}>
                    {item.description}
                  </Text>
                </Stack>
                <Button
                  component="a"
                  href={item.href}
                  variant="light"
                  color="agrimarket"
                  fullWidth
                >
                  {item.action}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <HoSoKhachHangContent />
        <SoDiaChiContent />
      </Stack>
    </AgriContainer>
  );
}
