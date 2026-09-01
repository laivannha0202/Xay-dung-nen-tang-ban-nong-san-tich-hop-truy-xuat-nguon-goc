'use client';

import { Alert, Button, Group, Rating, Stack, Text, Textarea } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  layTrangThaiDanhGiaMucDonHangKhach,
  taoDanhGiaKhach,
  type TrangThaiDanhGiaMucDonHangKhach,
} from '@/lib/api-danh-gia';

export function DanhGiaMucDonHang({ mucDonHangId }: { mucDonHangId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['danh-gia-khach', 'muc-don-hang', mucDonHangId] as const;
  const [diem, setDiem] = useState(5);
  const [binhLuan, setBinhLuan] = useState('');

  const query = useQuery({
    queryKey,
    queryFn: () => layTrangThaiDanhGiaMucDonHangKhach(mucDonHangId),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      taoDanhGiaKhach({
        mucDonHangId,
        diem,
        ...(binhLuan.trim() ? { binhLuan: binhLuan.trim() } : {}),
      }),
    onSuccess: (danhGia) => {
      const current = query.data;
      if (current) {
        const next: TrangThaiDanhGiaMucDonHangKhach = {
          ...current,
          daGiao: true,
          coTheDanhGia: false,
          lyDo: 'Mục đơn hàng đã được đánh giá.',
          danhGia,
        };
        queryClient.setQueryData(queryKey, next);
      }
      void queryClient.invalidateQueries({
        queryKey: ['danh-gia-khach', 'san-pham', danhGia.sanPhamId],
      });
    },
  });

  if (query.isPending) {
    return (
      <Text size="xs" c="dimmed">
        Đang kiểm tra điều kiện đánh giá…
      </Text>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Alert color="red" title="Không kiểm tra được đánh giá">
        Backend chưa trả được trạng thái review của sản phẩm này.
      </Alert>
    );
  }

  const status = query.data;

  if (status.danhGia) {
    return (
      <Stack gap={4} mt="xs">
        <Group gap="xs">
          <Rating value={status.danhGia.diem} readOnly />
          <Text size="xs" fw={700} c="green.8">
            Đã đánh giá
          </Text>
        </Group>
        {status.danhGia.binhLuan ? (
          <Text size="sm">{status.danhGia.binhLuan}</Text>
        ) : (
          <Text size="xs" c="dimmed">
            Không có bình luận.
          </Text>
        )}
      </Stack>
    );
  }

  if (!status.coTheDanhGia) {
    return (
      <Text size="xs" c="dimmed" mt="xs">
        {status.lyDo ?? 'Backend chưa cho phép đánh giá mục này.'}
      </Text>
    );
  }

  return (
    <Stack gap="xs" mt="xs" maw={520}>
      <Text size="sm" fw={700}>
        Đánh giá sản phẩm
      </Text>
      <Rating value={diem} onChange={setDiem} />
      <Textarea
        value={binhLuan}
        onChange={(event) => setBinhLuan(event.currentTarget.value)}
        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
        maxLength={2000}
        autosize
        minRows={2}
        maxRows={5}
      />
      {mutation.isError ? (
        <Alert color="red">
          Không gửi được đánh giá. Backend sẽ kiểm tra lại trạng thái đã giao và review trùng.
        </Alert>
      ) : null}
      <Button
        size="xs"
        w="fit-content"
        loading={mutation.isPending}
        disabled={diem < 1 || diem > 5}
        onClick={() => mutation.mutate()}
      >
        Gửi đánh giá
      </Button>
    </Stack>
  );
}
