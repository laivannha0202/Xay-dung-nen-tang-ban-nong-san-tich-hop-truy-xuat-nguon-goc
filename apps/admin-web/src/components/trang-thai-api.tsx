'use client';

import { useLayTrangThaiSucKhoe } from '@agrimarket/api-client';
import { Space, Tag, Typography } from 'antd';

export function TrangThaiApi() {
  const { data, isError, isPending } = useLayTrangThaiSucKhoe();
  const duLieu = data?.data;
  const mau = isPending ? 'gold' : isError ? 'red' : 'green';
  const nhan = isPending
    ? 'Đang kiểm tra hệ thống'
    : isError
      ? 'Hệ thống chưa kết nối'
      : 'Hệ thống trực tuyến';

  return (
    <Space>
      <Tag color={mau}>{nhan}</Tag>
      {!isPending && !isError && duLieu?.dichVu ? (
        <Typography.Text type="secondary">{duLieu.dichVu}</Typography.Text>
      ) : null}
    </Space>
  );
}
