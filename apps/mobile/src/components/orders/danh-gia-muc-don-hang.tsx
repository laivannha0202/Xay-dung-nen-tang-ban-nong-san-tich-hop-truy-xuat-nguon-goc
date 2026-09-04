import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/design-system';
import {
  danhGiaMucDonHangMobileQueryKey,
  layTrangThaiDanhGiaMucDonHangMobile,
  taoDanhGiaMobile,
  type TrangThaiDanhGiaMucDonHangMobile,
} from '@/lib/api-phan-hoi';

function DongSao({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row gap-1"
      accessibilityRole="adjustable"
      accessibilityLabel={`${value} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${star} sao`}
          disabled={disabled || !onChange}
          onPress={() => onChange?.(star)}
          className="px-0.5 py-1"
        >
          <Text
            className={star <= value ? 'text-2xl text-warning' : 'text-2xl text-muted-foreground'}
          >
            {star <= value ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DanhGiaMucDonHangMobile({ mucDonHangId }: { mucDonHangId: string }) {
  const queryClient = useQueryClient();
  const queryKey = danhGiaMucDonHangMobileQueryKey(mucDonHangId);

  const [diem, setDiem] = useState(5);
  const [binhLuan, setBinhLuan] = useState('');

  const query = useQuery({
    queryKey,
    queryFn: () => layTrangThaiDanhGiaMucDonHangMobile(mucDonHangId),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      taoDanhGiaMobile({
        mucDonHangId,
        diem,
        ...(binhLuan.trim() ? { binhLuan: binhLuan.trim() } : {}),
      }),
    onSuccess: (danhGia) => {
      const current = query.data;

      if (current) {
        const next: TrangThaiDanhGiaMucDonHangMobile = {
          ...current,
          daGiao: true,
          coTheDanhGia: false,
          lyDo: 'Mục đơn hàng đã được đánh giá.',
          danhGia,
        };

        queryClient.setQueryData(queryKey, next);
      }

      setBinhLuan('');
    },
  });

  if (query.isPending) {
    return <Text className="text-xs text-muted-foreground">Đang kiểm tra điều kiện đánh giá…</Text>;
  }

  if (query.isError || !query.data) {
    return (
      <View className="gap-1 rounded-xl border border-danger bg-card p-3">
        <Text className="text-xs font-semibold text-danger">Không kiểm tra được đánh giá</Text>
        <Text className="text-xs text-muted-foreground">
          Backend chưa trả được trạng thái review của mục này.
        </Text>
      </View>
    );
  }

  const status = query.data;

  if (status.danhGia) {
    return (
      <View className="gap-2 rounded-xl border border-success bg-card p-3">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge variant="success">Đã đánh giá</Badge>
          <DongSao value={status.danhGia.diem} disabled />
        </View>
        <Text className="text-sm text-foreground">
          {status.danhGia.binhLuan ?? 'Không có bình luận.'}
        </Text>
      </View>
    );
  }

  if (!status.coTheDanhGia) {
    return (
      <Text className="text-xs leading-5 text-muted-foreground">
        {status.lyDo ?? 'Backend chưa cho phép đánh giá mục này.'}
      </Text>
    );
  }

  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-3">
      <Text className="font-bold text-foreground">Đánh giá sản phẩm</Text>

      <DongSao value={diem} onChange={setDiem} />

      <TextInput
        value={binhLuan}
        onChangeText={setBinhLuan}
        placeholder="Chia sẻ trải nghiệm (không bắt buộc)"
        placeholderTextColor="#737373"
        multiline
        maxLength={2000}
        textAlignVertical="top"
        className="min-h-20 rounded-xl border border-border bg-background px-3 py-3 text-foreground"
      />

      <Text className="text-right text-[10px] text-muted-foreground">{binhLuan.length}/2000</Text>

      {mutation.isError ? (
        <Text className="text-xs leading-5 text-danger">
          Không gửi được đánh giá. Backend sẽ kiểm tra trạng thái đã giao và review trùng.
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={mutation.isPending || diem < 1 || diem > 5}
        onPress={() => mutation.mutate()}
        className={[
          'min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5',
          mutation.isPending ? 'opacity-50' : 'active:opacity-80',
        ].join(' ')}
      >
        <Text className="font-semibold text-primary-foreground">
          {mutation.isPending ? 'Đang gửi…' : `Gửi đánh giá ${diem} sao`}
        </Text>
      </Pressable>
    </View>
  );
}
