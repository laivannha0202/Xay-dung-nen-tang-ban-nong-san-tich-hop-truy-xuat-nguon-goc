'use client';

import { Button, Center, Loader, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { GoiYHome } from './goi-y-home';

export function GoiYPageContent() {
  const [daDangNhap, setDaDangNhap] = useState<boolean | null>(null);

  useEffect(() => {
    setDaDangNhap(layPhienKhachHang() !== null);
  }, []);

  if (daDangNhap === null) {
    return (
      <Center mih={320}>
        <Loader color="agrimarket" />
      </Center>
    );
  }

  if (!daDangNhap) {
    return (
      <AgriContainer py={{ base: 40, md: 70 }}>
        <Paper withBorder radius="xl" p={{ base: 'xl', md: 42 }} maw={620} mx="auto">
          <Stack align="center" ta="center" gap="md">
            <ThemeIcon size={58} radius="xl" variant="light" color="agrimarket">
              <IconSparkles size={30} />
            </ThemeIcon>
            <Title order={1} fz={{ base: 28, md: 34 }}>
              Gợi ý dành cho tài khoản của bạn
            </Title>
            <Text c="dimmed" maw={520}>
              Đăng nhập để AgriMarket sắp xếp sản phẩm từ lịch sử mua hàng, yêu thích, đánh giá và
              các trang trại bạn đang theo dõi.
            </Text>
            <Button component={Link} href="/dang-nhap?returnTo=%2Fgoi-y" color="agrimarket" size="md">
              Đăng nhập
            </Button>
          </Stack>
        </Paper>
      </AgriContainer>
    );
  }

  return <GoiYHome />;
}
