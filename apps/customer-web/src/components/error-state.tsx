'use client';

import { Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
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
    <Paper
      withBorder
      radius="md"
      p={{ base: 'md', md: 'lg' }}
      bg="white"
      style={{ borderColor: '#e3e3dd' }}
    >
      <Group justify="space-between" align="center" gap="lg" wrap="wrap">
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light" color="red">
            <IconAlertTriangle size={21} stroke={1.7} />
          </ThemeIcon>

          <Stack gap={2}>
            <Text fw={800}>{tieuDe}</Text>
            <Text c="dimmed" size="sm" maw={620}>
              {moTa}
            </Text>
          </Stack>
        </Group>

        {onThuLai ? (
          <Button variant="light" color="red" size="sm" onClick={onThuLai}>
            Thử lại
          </Button>
        ) : null}
      </Group>
    </Paper>
  );
}
