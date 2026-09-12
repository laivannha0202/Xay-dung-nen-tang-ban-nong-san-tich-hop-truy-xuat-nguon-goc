'use client';

import {
  ActionIcon,
  Anchor,
  Box,
  Divider,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandYoutube,
  IconClock,
  IconLeaf,
  IconMail,
  IconMapPin,
  IconPhone,
} from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

const cotVeChungToi = [
  { nhan: 'Giới thiệu', href: '/#ve-chung-toi' },
  { nhan: 'Sứ mệnh - Tầm nhìn', href: '/#su-menh' },
  { nhan: 'Đối tác', href: '/#doi-tac' },
  { nhan: 'Tin tức', href: '/#tin-tuc' },
  { nhan: 'Tuyển dụng', href: '/#tuyen-dung' },
] as const;

const cotHoTro = [
  { nhan: 'Hướng dẫn mua hàng', href: '/#huong-dan' },
  { nhan: 'Chính sách giao hàng', href: '/#chinh-sach-giao-hang' },
  { nhan: 'Chính sách đổi trả', href: '/khieu-nai' },
  { nhan: 'Câu hỏi thường gặp', href: '/#faq' },
  { nhan: 'Hướng dẫn truy xuất nguồn gốc', href: '/truy-xuat' },
] as const;

export function AgriFooter() {
  return (
    <Box
      component="footer"
      id="footer"
      pos="relative"
      style={{
        backgroundColor: '#ebf6ef',
        borderTop: '1px solid #d5e9dc',
        overflow: 'hidden',
      }}
    >
      {/* Nền SVG họa tiết đồi thoai thoải mềm mại như ảnh mockup */}
      <Box
        pos="absolute"
        bottom={0}
        left={0}
        right={0}
        h={120}
        style={{
          pointerEvents: 'none',
          opacity: 0.45,
          zIndex: 0,
        }}
      >
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M0,60 C320,100 480,20 800,50 C1120,80 1280,30 1440,55 L1440,120 L0,120 Z"
            fill="#d1ebd8"
          />
          <path
            d="M0,80 C360,40 600,95 960,70 C1200,50 1350,85 1440,75 L1440,120 L0,120 Z"
            fill="#c2e4cc"
            opacity={0.6}
          />
        </svg>
      </Box>

      {/* Nội dung các cột Footer */}
      <Box py={{ base: 28, md: 36 }} pos="relative" style={{ zIndex: 1 }}>
        <AgriContainer>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing={{ base: 20, md: 24 }}>
            {/* Cột 1: Logo & Thông điệp Nông Sạch Việt */}
            <Stack gap={10} style={{ maxWidth: 280 }}>
              <Group gap={8} align="center" wrap="nowrap">
                <Box
                  w={36}
                  h={36}
                  style={{
                    borderRadius: 10,
                    backgroundColor: '#186a3e',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  <IconLeaf size={22} stroke={2.2} />
                </Box>
                <Stack gap={0}>
                  <Text fw={850} fz={18} c="#135230" lh={1.1}>
                    Nông Sạch Việt
                  </Text>
                  <Text fz={10.5} c="#1e6b3f" fw={600} lh={1.2}>
                    Từ nông trại đến bàn ăn Việt
                  </Text>
                </Stack>
              </Group>

              <Text fz={12} c="#334155" lh={1.55} mt={2}>
                Kết nối nông sản Việt chất lượng cao đến mọi gia đình. Minh bạch nguồn gốc – Vì một
                nền nông nghiệp xanh và bền vững.
              </Text>

              {/* 4 Icon Mạng xã hội hình tròn nền xanh */}
              <Group gap={8} mt={4}>
                <ActionIcon
                  size={28}
                  radius="xl"
                  variant="filled"
                  color="#186a3e"
                  component="a"
                  href="https://facebook.com"
                  target="_blank"
                  aria-label="Facebook"
                  style={{ backgroundColor: '#186a3e' }}
                >
                  <IconBrandFacebook size={16} />
                </ActionIcon>
                <ActionIcon
                  size={28}
                  radius="xl"
                  variant="filled"
                  color="#186a3e"
                  component="a"
                  href="https://youtube.com"
                  target="_blank"
                  aria-label="YouTube"
                  style={{ backgroundColor: '#186a3e' }}
                >
                  <IconBrandYoutube size={16} />
                </ActionIcon>
                <ActionIcon
                  size={28}
                  radius="xl"
                  variant="filled"
                  color="#186a3e"
                  component="a"
                  href="https://zalo.me"
                  target="_blank"
                  aria-label="Zalo"
                  style={{ backgroundColor: '#186a3e' }}
                >
                  <Text fz={9} fw={850} c="#ffffff">
                    Zalo
                  </Text>
                </ActionIcon>
                <ActionIcon
                  size={28}
                  radius="xl"
                  variant="filled"
                  color="#186a3e"
                  component="a"
                  href="https://tiktok.com"
                  target="_blank"
                  aria-label="TikTok"
                  style={{ backgroundColor: '#186a3e' }}
                >
                  <IconBrandTiktok size={15} />
                </ActionIcon>
              </Group>
            </Stack>

            {/* Cột 2: Về chúng tôi */}
            <Stack gap={8} align="flex-start">
              <Text fw={750} fz={14} c="#135230">
                Về chúng tôi
              </Text>
              {cotVeChungToi.map((item) => (
                <Anchor
                  key={item.nhan}
                  component={Link}
                  href={item.href}
                  fz={12.5}
                  c="#475569"
                  style={{ textDecoration: 'none', transition: 'color 120ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#186a3e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                >
                  {item.nhan}
                </Anchor>
              ))}
            </Stack>

            {/* Cột 3: Hỗ trợ */}
            <Stack gap={8} align="flex-start">
              <Text fw={750} fz={14} c="#135230">
                Hỗ trợ
              </Text>
              {cotHoTro.map((item) => (
                <Anchor
                  key={item.nhan}
                  component={Link}
                  href={item.href}
                  fz={12.5}
                  c="#475569"
                  style={{ textDecoration: 'none', transition: 'color 120ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#186a3e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                >
                  {item.nhan}
                </Anchor>
              ))}
            </Stack>

            {/* Cột 4: Liên hệ */}
            <Stack gap={8} align="flex-start">
              <Text fw={750} fz={14} c="#135230">
                Liên hệ
              </Text>
              <Group gap={6} wrap="nowrap" align="flex-start">
                <IconMapPin size={15} color="#186a3e" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text fz={12} c="#475569" lh={1.4}>
                  Số 123, Đường Nông Nghiệp, Quận Cầu Giấy, Hà Nội
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap" align="center">
                <IconPhone size={15} color="#186a3e" style={{ flexShrink: 0 }} />
                <Text fz={12} fw={700} c="#186a3e">
                  1900 6868
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap" align="center">
                <IconMail size={15} color="#186a3e" style={{ flexShrink: 0 }} />
                <Text fz={12} c="#475569">
                  hotro@nongsachviet.vn
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap" align="center">
                <IconClock size={15} color="#186a3e" style={{ flexShrink: 0 }} />
                <Text fz={12} c="#475569">
                  Thứ 2 - Chủ nhật: 8:00 - 17:00
                </Text>
              </Group>
            </Stack>

            {/* Cột 5: Đồ họa thư pháp Vì nông sản Việt / Vì tương lai xanh */}
            <Stack gap={4} align="flex-start" justify="center">
              <Image
                src="/images/mockup-products/footer-slogan.png"
                alt="Vì nông sản Việt Vì tương lai xanh"
                fit="contain"
                w={{ base: 180, md: 210 }}
                fallbackSrc="/images/banners/hero-01-nguon-goc-minh-bach.png"
              />
            </Stack>
          </SimpleGrid>
        </AgriContainer>
      </Box>

      {/* Dòng bản quyền dưới cùng */}
      <Box
        py={10}
        pos="relative"
        style={{
          borderTop: '1px solid #d8ebd0',
          backgroundColor: 'rgba(235, 246, 239, 0.9)',
          zIndex: 1,
        }}
      >
        <AgriContainer>
          <Group justify="space-between" align="center" wrap="wrap" gap={8}>
            <Text fz={11.5} c="#526558">
              © 2024 Nông Sạch Việt. Tất cả quyền được bảo lưu.
            </Text>
            <Group gap={16} wrap="wrap">
              <Anchor component={Link} href="/#chinh-sach" fz={11.5} c="#526558">
                Điều khoản sử dụng
              </Anchor>
              <Text fz={11.5} c="#8da595">
                |
              </Text>
              <Anchor component={Link} href="/#chinh-sach" fz={11.5} c="#526558">
                Chính sách bảo mật
              </Anchor>
              <Text fz={11.5} c="#8da595">
                |
              </Text>
              <Anchor component={Link} href="/#chinh-sach" fz={11.5} c="#526558">
                Sơ đồ website
              </Anchor>
            </Group>
          </Group>
        </AgriContainer>
      </Box>
    </Box>
  );
}