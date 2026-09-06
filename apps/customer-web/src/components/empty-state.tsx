import { Box, Paper, Stack, Text, Title } from '@mantine/core';
import { IconPlant } from '@tabler/icons-react';
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
  bieuTuong,
  hanhDong,
}: EmptyStateProps) {
  return (
    <Paper withBorder p={{ base: 'xl', md: 36 }} className="farm-panel">
      <Stack align="center" gap="sm" ta="center">
        <Box c="agrimarket.7">{bieuTuong ?? <IconPlant size={34} stroke={1.5} />}</Box>
        <Title order={3} className="farm-display">
          {tieuDe}
        </Title>
        <Text c="dimmed" maw={520}>
          {moTa}
        </Text>
        {hanhDong}
      </Stack>
    </Paper>
  );
}
