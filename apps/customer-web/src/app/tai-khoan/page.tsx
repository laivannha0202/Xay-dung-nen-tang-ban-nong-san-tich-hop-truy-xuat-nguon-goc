import { Stack } from '@mantine/core';

import { AgriContainer } from '@/components/agri-container';
import { HoSoKhachHangContent } from '@/components/ho-so-khach-hang-content';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';

export default function TrangTaiKhoan() {
  return (
    <AgriContainer py="xl">
      <Stack gap="xl">
        <HoSoKhachHangContent />
        <SoDiaChiContent />
      </Stack>
    </AgriContainer>
  );
}
