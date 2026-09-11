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
    <Paper withBorder p={{ base: 'lg', md: 'xl' }} className="agri-surface">
      <Group justify="space-between" align="center" gap="lg" wrap="wrap">
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon size={46} radius="lg" variant="light" color="red">
            <IconAlertTriangle size={23} stroke={1.7} />
          </ThemeIcon>

          <Stack gap={4}>
            <Text fw={850} fz="lg">{tieuDe}</Text>
            <Text c="dimmed" size="sm" maw={640} lh={1.6}>{moTa}</Text>
          </Stack>
        </Group>

        {onThuLai ? (
          <Button variant="light" color="red" onClick={onThuLai}>
            Thử lại
          </Button>
        ) : null}
      </Group>
    </Paper>
  );
}
