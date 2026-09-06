'use client';

import { Box, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

export type ErrorStateProps = {
  tieuDe?: string;
  moTa?: string;
  onThuLai?: () => void;
};

export function ErrorState({
  tieuDe = 'Không thể tải dữ liệu',
  moTa = 'Đã có lỗi xảy ra. Bạn có thể thử lại.',
  onThuLai,
}: ErrorStateProps) {
  return (
    <Paper withBorder p={{ base: 'xl', md: 36 }} className="farm-panel">
      <Stack align="center" gap="sm" ta="center">
        <Box c="red.7">
          <IconAlertTriangle size={34} stroke={1.5} />
        </Box>
        <Title order={3} className="farm-display">
          {tieuDe}
        </Title>
        <Text c="dimmed" maw={520}>
          {moTa}
        </Text>
        {onThuLai ? (
          <Button variant="outline" color="red" onClick={onThuLai}>
            Thử lại
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
