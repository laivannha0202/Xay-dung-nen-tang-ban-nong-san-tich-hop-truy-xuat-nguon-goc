import { Box, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconBell,
  IconCoins,
  IconHeart,
  IconHelpCircle,
  IconLeaf,
  IconQrcode,
  IconShoppingBag,
  IconUser,
} from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from '@/components/agri-container';
import { HoSoKhachHangContent } from '@/components/ho-so-khach-hang-content';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';
import { PageHeader } from '@/components/web-page';

const LOI_TAT_TAI_KHOAN = [
  { title: 'Đơn hàng của tôi', description: 'Theo dõi trạng thái đặt hàng, thanh toán và giao nhận.', href: '/don-hang', action: 'Xem đơn hàng', icon: IconShoppingBag },
  { title: 'Điểm thưởng', description: 'Xem số dư và lịch sử cộng/trừ điểm của tài khoản.', href: '/diem-thuong', action: 'Xem điểm', icon: IconCoins },
  { title: 'Gợi ý cho bạn', description: 'Khám phá nông sản được sắp xếp theo tín hiệu mua sắm.', href: '/goi-y', action: 'Xem gợi ý', icon: IconLeaf },
  { title: 'Sản phẩm yêu thích', description: 'Quay lại nhanh những sản phẩm bạn đã lưu.', href: '/yeu-thich', action: 'Mở yêu thích', icon: IconHeart },
  { title: 'Trang trại theo dõi', description: 'Theo dõi trang trại và thông tin mới liên quan.', href: '/theo-doi', action: 'Xem trang trại', icon: IconUser },
  { title: 'Thông báo', description: 'Xem các cập nhật thu hoạch mới từ trang trại đang theo dõi.', href: '/thong-bao', action: 'Xem thông báo', icon: IconBell },
  { title: 'Yêu cầu hỗ trợ', description: 'Theo dõi khiếu nại và yêu cầu hỗ trợ phát sinh từ đơn hàng.', href: '/khieu-nai', action: 'Xem yêu cầu', icon: IconHelpCircle },
  { title: 'Truy xuất nguồn gốc', description: 'Kiểm tra hành trình của lô nông sản bằng mã hoặc QR.', href: '/truy-xuat', action: 'Truy xuất ngay', icon: IconQrcode },
] as const;

export default function TrangTaiKhoan() {
  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow="Tài khoản AgriMarket"
        title="Trung tâm tài khoản"
        description="Quản lý hồ sơ, địa chỉ nhận hàng và truy cập nhanh toàn bộ nghiệp vụ sau đăng nhập: đơn hàng, điểm thưởng, yêu thích, theo dõi, thông báo, khiếu nại và truy xuất."
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap={{ base: 36, md: 48 }}>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {LOI_TAT_TAI_KHOAN.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.href} withBorder className="agri-surface" padding="lg">
                  <Stack gap="md" h="100%">
                    <Group justify="space-between" align="flex-start">
                      <ThemeIcon size={42} radius="lg" variant="light" color="agrimarket"><Icon size={20} /></ThemeIcon>
                    </Group>
                    <Stack gap={5} style={{ flex: 1 }}>
                      <Text fw={900} fz="lg">{item.title}</Text>
                      <Text size="sm" c="dimmed" lh={1.6}>{item.description}</Text>
                    </Stack>
                    <Button component={Link} href={item.href} variant="light" color="agrimarket" fullWidth>{item.action}</Button>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>

          <HoSoKhachHangContent />
          <SoDiaChiContent />
        </Stack>
      </AgriContainer>
    </Box>
  );
}
