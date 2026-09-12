'use client';

import {
  Anchor,
  Box,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCoin,
  IconLeaf,
  IconMapPin,
  IconPackage,
  IconQrcode,
  IconShieldCheck,
} from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

const cotMuaSam = [
  { nhan: 'Tất cả nông sản', href: '/san-pham' },
  { nhan: 'Nông sản mới', href: '/san-pham?sort=MOI_NHAT' },
  { nhan: 'Gợi ý cho bạn', href: '/goi-y' },
  { nhan: 'Sản phẩm yêu thích', href: '/yeu-thich' },
] as const;

const cotTaiKhoan = [
  { nhan: 'Giỏ hàng', href: '/gio-hang' },
  { nhan: 'Đơn hàng của tôi', href: '/don-hang' },
  { nhan: 'Điểm thưởng', href: '/diem-thuong' },
  { nhan: 'Hồ sơ & địa chỉ', href: '/tai-khoan' },
] as const;

const cotHoTro = [
  { nhan: 'Theo dõi trang trại', href: '/theo-doi' },
  { nhan: 'Thông báo', href: '/thong-bao' },
  { nhan: 'Khiếu nại của tôi', href: '/khieu-nai' },
  { nhan: 'Tạo khiếu nại', href: '/khieu-nai/tao' },
] as const;

export function AgriFooter() {
  return (
    <Box component="footer" className="farm-footer" py={{ base: 40, md: 52 }}>
      <AgriContainer>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 30, lg: 46 }}>
          <Stack gap="md">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={42} radius="md" color="white" variant="light">
                <IconLeaf size={24} stroke={1.7} />
              </ThemeIcon>
              <Stack gap={1}>
                <Title order={3} className="farm-footer-title">
                  AgriMarket
                </Title>
                <Text size="xs" c="rgba(255,255,255,.65)">
                  Nông sản sạch, nguồn gốc rõ ràng
                </Text>
              </Stack>
            </Group>
            <Text size="sm" lh={1.7}>
              Nền tảng kết nối người mua với trang trại, hỗ trợ mua nông sản, theo dõi đơn hàng,
              ưu đãi và kiểm tra nguồn gốc theo từng lô sản phẩm.
            </Text>
            <Stack gap={8}>
              <Group gap={8} wrap="nowrap">
                <IconMapPin size={17} />
                <Text size="sm">Phạm vi giao hàng hiện tại: Hưng Yên.</Text>
              </Group>
              <Group gap={8} wrap="nowrap">
                <IconShieldCheck size={17} />
                <Text size="sm">Thông tin giá và tồn kho được xác nhận lại khi checkout.</Text>
              </Group>
            </Stack>
          </Stack>

          <Stack gap="sm" align="flex-start">
            <Text fw={850} c="white">Mua sắm</Text>
            {cotMuaSam.map((item) => (
              <Anchor key={item.href} component={Link} href={item.href} size="sm">
                {item.nhan}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="sm" align="flex-start">
            <Text fw={850} c="white">Tài khoản & hỗ trợ</Text>
            {cotTaiKhoan.map((item) => (
              <Anchor key={item.href} component={Link} href={item.href} size="sm">
                {item.nhan}
              </Anchor>
            ))}
            <Divider my={4} color="rgba(255,255,255,.12)" w="100%" />
            {cotHoTro.map((item) => (
              <Anchor key={item.href} component={Link} href={item.href} size="sm">
                {item.nhan}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="md">
            <Group gap="xs">
              <IconQrcode size={21} stroke={1.8} />
              <Text fw={850} c="white">Truy xuất nguồn gốc</Text>
            </Group>
            <Text size="sm" lh={1.7}>
              Nhập mã trên tem hoặc QR của lô hàng để xem mùa vụ, thu hoạch, kiểm định, chứng nhận
              và các cảnh báo liên quan.
            </Text>
            <Anchor component={Link} href="/truy-xuat" fw={800} size="sm">
              Kiểm tra mã truy xuất →
            </Anchor>
            <Group gap="md" mt="xs" wrap="wrap">
              <Group gap={6}>
                <IconPackage size={16} />
                <Text size="xs">Theo dõi đơn</Text>
              </Group>
              <Group gap={6}>
                <IconCoin size={16} />
                <Text size="xs">Điểm thưởng</Text>
              </Group>
            </Group>
          </Stack>
        </SimpleGrid>

        <Box className="farm-footer-rule" mt={{ base: 32, md: 42 }} pt={20}>
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Text size="xs">
              © AgriMarket · Nền tảng nông sản tích hợp truy xuất nguồn gốc.
            </Text>
            <Text size="xs" maw={560} ta={{ base: 'left', sm: 'right' }}>
              Giá, tồn kho, phí giao hàng, voucher và điểm thưởng được Backend xác nhận tại thời điểm đặt hàng.
            </Text>
          </Group>
        </Box>
      </AgriContainer>
    </Box>
  );
}