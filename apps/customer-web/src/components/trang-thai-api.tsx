'use client';

import { useLayTrangThaiSucKhoe } from '@agrimarket/api-client';
import { Badge, Group, Text } from '@mantine/core';

export function TrangThaiApi() {
  const { data, isError, isPending } = useLayTrangThaiSucKhoe();
  const duLieu = data?.data;

  const nhan = isPending
    ? 'Đang kiểm tra API'
    : isError
      ? 'API chưa kết nối'
      : `API: ${duLieu?.trangThai ?? 'không rõ'}`;

  return (
    <Group gap="xs">
      <Badge color={isError ? 'red' : 'green'} variant="light">
        {nhan}
      </Badge>
      {duLieu?.dichVu ? (
        <Text size="xs" c="dimmed">
          {duLieu.dichVu}
        </Text>
      ) : null}
    </Group>
  );
}
