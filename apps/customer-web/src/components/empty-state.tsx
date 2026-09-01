import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  tieuDe?: string;
  moTa?: string;
  bieuTuong?: ReactNode;
  hanhDong?: ReactNode;
};

export function EmptyState({
  tieuDe = 'Chưa có dữ liệu',
  moTa = 'Nội dung sẽ xuất hiện tại đây khi có dữ liệu phù hợp.',
  bieuTuong = '∅',
  hanhDong,
}: EmptyStateProps) {
  return (
    <Paper withBorder radius="lg" p={{ base: 'xl', md: 40 }}>
      <Stack align="center" gap="sm" ta="center">
        <ThemeIcon size={52} radius="xl" variant="light" color="gray" aria-hidden="true">
          {bieuTuong}
        </ThemeIcon>

        <Title order={3}>{tieuDe}</Title>
        <Text c="dimmed" maw={520}>
          {moTa}
        </Text>

        {hanhDong}
      </Stack>
    </Paper>
  );
}
