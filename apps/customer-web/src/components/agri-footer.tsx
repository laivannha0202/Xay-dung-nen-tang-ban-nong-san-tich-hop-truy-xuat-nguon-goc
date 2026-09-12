'use client';

import { Anchor, Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconLeaf, IconMail, IconMapPin, IconPhone, IconQrcode } from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

const cot = [
  { title: 'Về AgriMarket', links: [['Giới thiệu', '/'], ['Trang trại', '/san-pham'], ['Truy xuất nguồn gốc', '/truy-xuat'], ['Nông sản mới', '/san-pham?sort=MOI_NHAT']] },
  { title: 'Hỗ trợ khách hàng', links: [['Hướng dẫn mua hàng', '/san-pham'], ['Giỏ hàng', '/gio-hang'], ['Đơn hàng của tôi', '/don-hang'], ['Khiếu nại', '/khieu-nai/tao']] },
  { title: 'Tài khoản & chính sách', links: [['Tài khoản', '/tai-khoan'], ['Sản phẩm yêu thích', '/yeu-thich'], ['Trang trại theo dõi', '/theo-doi'], ['Đăng nhập', '/dang-nhap']] },
] as const;

export function AgriFooter() {
  return (
    <Box component="footer" className="market-footer">
      <AgriContainer>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing={{ base: 28, lg: 38 }}>
          <Stack gap="md">
            <Group gap="sm"><IconLeaf size={29} /><Title order={3} c="white">AgriMarket</Title></Group>
            <Text size="sm" c="rgba(255,255,255,.72)">Nông sản từ trang trại, mua sắm thuận tiện và truy xuất minh bạch theo từng lô hàng.</Text>
            <Anchor component={Link} href="/truy-xuat" fw={800} size="sm"><Group gap={6}><IconQrcode size={18} />Quét mã truy xuất</Group></Anchor>
          </Stack>

          {cot.map((group) => (
            <Stack key={group.title} gap="sm" align="flex-start">
              <Text fw={850} c="white">{group.title}</Text>
              {group.links.map(([label, href]) => <Anchor key={label} component={Link} href={href} size="sm">{label}</Anchor>)}
            </Stack>
          ))}

          <Stack gap="sm">
            <Text fw={850} c="white">Liên hệ với chúng tôi</Text>
            <Group gap={7} wrap="nowrap" align="flex-start"><IconPhone size={16} /><Text size="sm">1900 1234</Text></Group>
            <Group gap={7} wrap="nowrap" align="flex-start"><IconMail size={16} /><Text size="sm">cskh@agrimarket.vn</Text></Group>
            <Group gap={7} wrap="nowrap" align="flex-start"><IconMapPin size={16} /><Text size="sm">Hà Nội, Việt Nam</Text></Group>
            <Text size="sm">Thứ 2 - Chủ nhật: 8:00 - 22:00</Text>
          </Stack>
        </SimpleGrid>

        <Box className="market-footer-rule" mt={36} pt={20}>
          <Group justify="space-between" wrap="wrap">
            <Text size="xs">© 2026 AgriMarket. Tất cả quyền được bảo lưu.</Text>
            <Text size="xs">Nông sản sạch hôm nay, cuộc sống xanh ngày mai 🌱</Text>
          </Group>
        </Box>
      </AgriContainer>
    </Box>
  );
}
