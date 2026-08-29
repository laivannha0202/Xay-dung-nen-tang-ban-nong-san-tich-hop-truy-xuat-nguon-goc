'use client';

import { useLayTrangThaiSucKhoe } from '@agrimarket/api-client';
import { Space, Tag, Typography } from 'antd';

export function TrangThaiApi() {
  const { data, isError, isPending } = useLayTrangThaiSucKhoe();
  const duLieu = data?.data;

  return (
    <Space>
      <Tag color={isError ? 'red' : 'green'}>
        {isPending
          ? 'Đang kiểm tra API'
          : isError
            ? 'API chưa kết nối'
            : `API: ${duLieu?.trangThai ?? 'không rõ'}`}
      </Tag>
      {duLieu?.dichVu ? <Typography.Text type="secondary">{duLieu.dichVu}</Typography.Text> : null}
    </Space>
  );
}
