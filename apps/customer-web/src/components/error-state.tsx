'use client';

import { Button, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

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
    <Paper withBorder radius="lg" p={{ base: 'xl', md: 40 }}>
      <Stack align="center" gap="sm" ta="center">
        <ThemeIcon size={52} radius="xl" variant="light" color="red" aria-hidden="true">
          !
        </ThemeIcon>

        <Title order={3}>{tieuDe}</Title>
        <Text c="dimmed" maw={520}>
          {moTa}
        </Text>

        {onThuLai ? (
          <Button variant="light" color="red" onClick={onThuLai}>
            Thử lại
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
