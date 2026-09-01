import { Card, SimpleGrid, Skeleton, Stack } from '@mantine/core';

export type AgriSkeletonProps = {
  soLuong?: number;
};

export function AgriSkeleton({ soLuong = 3 }: AgriSkeletonProps) {
  const items = Array.from({ length: Math.max(1, Math.min(soLuong, 6)) }, (_, index) => index);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" aria-label="Đang tải nội dung">
      {items.map((item) => (
        <Card key={item} withBorder radius="lg" padding="md">
          <Stack gap="md">
            <Skeleton height={180} radius="md" />
            <Skeleton height={20} width="72%" />
            <Skeleton height={14} width="48%" />
            <Skeleton height={18} width="38%" />
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
