'use client';

import {
  ModalForm,
  PageContainer,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Tag, Typography } from 'antd';
import { useRef, useState } from 'react';

import {
  capNhatHienThiDanhGia,
  danhSachDanhGia,
  type DanhGiaQuanTri,
} from '@/lib/api-danh-gia-quan-tri';

export default function TrangDanhGia() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [target, setTarget] = useState<DanhGiaQuanTri | null>(null);

  const columns: ProColumns<DanhGiaQuanTri>[] = [
    { title: 'Tìm kiếm', dataIndex: 'timKiem', hideInTable: true },
    {
      title: 'Sao',
      dataIndex: 'diem',
      valueType: 'select',
      valueEnum: {
        1: { text: '1 sao' },
        2: { text: '2 sao' },
        3: { text: '3 sao' },
        4: { text: '4 sao' },
        5: { text: '5 sao' },
      },
      render: (_, row) => `${row.diem}/5`,
    },
    {
      title: 'Sản phẩm',
      search: false,
      render: (_, row) => (
        <>
          <Typography.Text strong>{row.tenSanPham}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{row.sku}</Typography.Text>
        </>
      ),
    },
    { title: 'Đơn', dataIndex: 'maDonHang', search: false },
    { title: 'Khách', dataIndex: 'hoTenKhach', search: false },
    { title: 'Bình luận', dataIndex: 'binhLuan', search: false, ellipsis: true },
    {
      title: 'Public',
      dataIndex: 'hienThi',
      search: false,
      render: (_, row) => (
        <Tag color={row.hienThi ? 'green' : 'red'}>{row.hienThi ? 'Hiện' : 'Ẩn'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) =>
        row.hienThi
          ? [
              <Button key="hide" type="link" danger onClick={() => setTarget(row)}>
                Ẩn
              </Button>,
            ]
          : [
              <Button
                key="show"
                type="link"
                onClick={async () => {
                  await capNhatHienThiDanhGia(row.id, { hienThi: true });
                  message.success('Đã hiện lại đánh giá.');
                  actionRef.current?.reload();
                }}
              >
                Hiện lại
              </Button>,
            ],
    },
  ];

  return (
    <PageContainer
      title="Quản trị đánh giá"
      subTitle="Chỉ moderation ẩn/hiện; không sửa nội dung hoặc số sao của khách."
    >
      <ProTable<DanhGiaQuanTri>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const r = await danhSachDanhGia({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            diem: typeof params.diem === 'number' ? params.diem : undefined,
          });
          return { data: r.duLieu, success: true, total: r.tong };
        }}
      />

      <ModalForm<{ lyDo: string }>
        title="Ẩn đánh giá"
        open={Boolean(target)}
        modalProps={{ destroyOnHidden: true, onCancel: () => setTarget(null) }}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        onFinish={async (v) => {
          if (!target) return false;
          await capNhatHienThiDanhGia(target.id, { hienThi: false, lyDo: v.lyDo.trim() });
          message.success('Đã ẩn đánh giá và ghi Audit Log.');
          setTarget(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormTextArea
          name="lyDo"
          label="Lý do ẩn"
          fieldProps={{ maxLength: 500, showCount: true, rows: 4 }}
          rules={[{ required: true, whitespace: true }]}
        />
      </ModalForm>
    </PageContainer>
  );
}
