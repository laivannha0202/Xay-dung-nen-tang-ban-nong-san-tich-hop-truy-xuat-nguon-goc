'use client';

import { Button, Center, Paper, Stack, Text, Title } from '@mantine/core';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <Center mih={420}>
      <Paper withBorder radius="lg" p="xl" maw={520}>
        <Stack align="center" ta="center">
          <Title order={2}>Có lỗi xảy ra</Title>
          <Text c="dimmed">AgriMarket chưa thể hiển thị nội dung này. Bạn có thể thử tải lại.</Text>
          <Button onClick={reset}>Thử lại</Button>
        </Stack>
      </Paper>
    </Center>
  );
}
