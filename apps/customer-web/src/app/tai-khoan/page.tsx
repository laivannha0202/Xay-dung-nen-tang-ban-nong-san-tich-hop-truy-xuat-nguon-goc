import { Button, Group, Stack, Text } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';

import { AgriContainer } from '@/components/agri-container';
import { HoSoKhachHangContent } from '@/components/ho-so-khach-hang-content';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';

export default function TrangTaiKhoan() {
  return (
    <AgriContainer py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={2}>
            <Text fw={850} fz="xl">
              Tài khoản của tôi
            </Text>
            <Text size="sm" c="dimmed">
              Quản lý hồ sơ, địa chỉ và trải nghiệm mua sắm trên AgriMarket.
            </Text>
          </Stack>
          <Button
            component={Link}
            href="/goi-y"
            color="agrimarket"
            variant="light"
            leftSection={<IconSparkles size={18} />}
          >
            Gợi ý cho bạn
          </Button>
        </Group>
        <HoSoKhachHangContent />
        <SoDiaChiContent />
      </Stack>
    </AgriContainer>
  );
}
