import { Box, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconPlant } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  tieuDe?: string;
  moTa?: string;
  bieuTuong?: ReactNode;
  hanhDong?: ReactNode;
};

export function EmptyState({ tieuDe = 'Chưa có dữ liệu', moTa, bieuTuong, hanhDong }: EmptyStateProps) {
  return (
    <Paper withBorder p={{ base: 28, md: 42 }} className="agri-surface">
      <Stack align="center" gap="md" ta="center">
        <ThemeIcon size={58} radius="xl" variant="light" color="agrimarket">
          <Box c="agrimarket.7">{bieuTuong ?? <IconPlant size={30} stroke={1.6} />}</Box>
        </ThemeIcon>
        <Stack gap={5} align="center">
          <Title order={3} fz={{ base: 17, md: 19 }} fw={700} lh={1.4} lts="-0.005em">
            {tieuDe}
          </Title>
          {moTa ? (
            <Text c="dimmed" maw={560} size="sm" fw={400} lh={1.6}>
              {moTa}
            </Text>
          ) : null}
        </Stack>
        {hanhDong}
      </Stack>
    </Paper>
  );
}
