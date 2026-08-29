import { useLayTrangThaiSucKhoe } from '@agrimarket/api-client';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

export function TrangThaiApi() {
  const { data, isError, isPending } = useLayTrangThaiSucKhoe();
  const duLieu = data?.data;

  const nhan = isPending
    ? 'Đang kiểm tra API'
    : isError
      ? 'API chưa kết nối'
      : `API: ${duLieu?.trangThai ?? 'không rõ'}`;

  return (
    <Box className="rounded-xl border border-outline-200 p-3">
      <Text className="font-medium">{nhan}</Text>
      {duLieu?.dichVu ? <Text className="text-typography-500">{duLieu.dichVu}</Text> : null}
    </Box>
  );
}
