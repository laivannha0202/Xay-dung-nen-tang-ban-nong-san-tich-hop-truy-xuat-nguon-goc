'use client';

import { Anchor, Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconLeaf, IconQrcode } from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

const cotKhamPha = [
  { nhan: 'Tất cả nông sản', href: '/san-pham' },
  { nhan: 'Nông sản mới', href: '/san-pham?sort=MOI_NHAT' },
  { nhan: 'Sản phẩm yêu thích', href: '/yeu-thich' },
  { nhan: 'Trang trại theo dõi', href: '/theo-doi' },
] as const;

const cotTaiKhoan = [
  { nhan: 'Giỏ hàng', href: '/gio-hang' },
  { nhan: 'Đơn hàng của tôi', href: '/don-hang' },
  { nhan: 'Tài khoản', href: '/tai-khoan' },
  { nhan: 'Tạo khiếu nại', href: '/khieu-nai/tao' },
] as const;

export function AgriFooter() {
  return (
    <Box component="footer" className="farm-footer">
      <AgriContainer>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 28, lg: 44 }}>
          <Stack gap="md">
            <Group gap="sm" wrap="nowrap">
              <IconLeaf size={28} stroke={1.6} />
              <Title order={3} className="farm-footer-title">
                AgriMarket
              </Title>
            </Group>
            <Text size="sm" c="inherit">
              Nền tảng mua nông sản và theo dõi nguồn gốc theo từng lô hàng, kết nối người mua với
              trang trại.
            </Text>
          </Stack>

          <Stack gap="sm" align="flex-start">
            <Text fw={850} c="white">
              Khám phá
            </Text>
            {cotKhamPha.map((item) => (
              <Anchor key={item.href} component={Link} href={item.href} size="sm">
                {item.nhan}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="sm" align="flex-start">
            <Text fw={850} c="white">
              Mua sắm
            </Text>
            {cotTaiKhoan.map((item) => (
              <Anchor key={item.href} component={Link} href={item.href} size="sm">
                {item.nhan}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="md">
            <Group gap="xs">
              <IconQrcode size={21} stroke={1.8} />
              <Text fw={850} c="white">
                Truy xuất nguồn gốc
              </Text>
            </Group>
            <Text size="sm" c="inherit">
              Dùng mã trên tem hoặc QR của lô hàng để xem mùa vụ, thu hoạch, kiểm định, chứng nhận
              và cảnh báo liên quan.
            </Text>
            <Anchor component={Link} href="/truy-xuat" fw={800} size="sm">
              Kiểm tra mã truy xuất →
            </Anchor>
          </Stack>
        </SimpleGrid>

        <Box className="farm-footer-rule" mt={36} pt={20}>
          <Group justify="space-between" wrap="wrap">
            <Text size="xs" c="inherit">
              © AgriMarket · Nông sản từ trang trại, nguồn gốc rõ ràng.
            </Text>
            <Text size="xs" c="inherit">
              Minh bạch nguồn gốc · Mua sắm thuận tiện · Theo dõi đơn hàng
            </Text>
          </Group>
        </Box>
      </AgriContainer>
    </Box>
  );
}
