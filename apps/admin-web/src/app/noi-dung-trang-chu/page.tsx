'use client';

import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import { useRef } from 'react';

import {
  danhSachNoiDung,
  doiHienThiNoiDung,
  taoNoiDung,
  xoaNoiDung,
  type NoiDungTrangChuAdmin,
} from '@/lib/api-noi-dung-trang-chu';

type FormNoiDung = {
  loai: NoiDungTrangChuAdmin['loai'];
  tieuDe: string;
  nhan?: string;
  moTa?: string;
  anhUrl?: string;
  duongDan?: string;
  viTri?: string;
  thuTu?: number;
  hienThi?: boolean;
};

export default function TrangNoiDungTrangChu() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<NoiDungTrangChuAdmin>[] = [
    { title: 'Tìm kiếm', dataIndex: 'timKiem', hideInTable: true },
    {
      title: 'Loại',
      dataIndex: 'loai',
      valueType: 'select',
      valueEnum: {
        BANNER: { text: 'Banner' },
        KIEN_THUC: { text: 'Kiến thức' },
        CAU_CHUYEN_TRANG_TRAI: { text: 'Câu chuyện trang trại' },
      },
    },
    { title: 'Tiêu đề', dataIndex: 'tieuDe', search: false },
    { title: 'Vị trí', dataIndex: 'viTri', search: false, render: (_, row) => row.viTri ?? '—' },
    { title: 'Thứ tự', dataIndex: 'thuTu', search: false },
    {
      title: 'Hiển thị',
      dataIndex: 'hienThi',
      search: false,
      render: (_, row) => (
        <Tag color={row.hienThi ? 'green' : 'default'}>{row.hienThi ? 'Hiện' : 'Ẩn'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <Button
          key="toggle"
          type="link"
          onClick={async () => {
            await doiHienThiNoiDung(row.id, !row.hienThi);
            message.success('Đã cập nhật hiển thị.');
            actionRef.current?.reload();
          }}
        >
          {row.hienThi ? 'Ẩn' : 'Hiện'}
        </Button>,
        <Popconfirm
          key="delete"
          title="Xóa nội dung?"
          onConfirm={async () => {
            await xoaNoiDung(row.id);
            message.success('Đã xóa.');
            actionRef.current?.reload();
          }}
        >
          <Button danger type="link">
            Xóa
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="Nội dung trang chủ" subTitle="CMS nội dung public của Customer Web.">
      <ProTable<NoiDungTrangChuAdmin>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const r = await danhSachNoiDung({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            loai:
              typeof params.loai === 'string'
                ? (params.loai as NoiDungTrangChuAdmin['loai'])
                : undefined,
          });
          return { data: r.duLieu, success: true, total: r.tong };
        }}
        toolBarRender={() => [
          <ModalForm<FormNoiDung>
            key="create"
            title="Tạo nội dung"
            trigger={<Button type="primary">Thêm nội dung</Button>}
            onFinish={async (v) => {
              await taoNoiDung({
                loai: v.loai,
                tieuDe: v.tieuDe.trim(),
                nhan: v.nhan?.trim() || null,
                moTa: v.moTa?.trim() || null,
                anhUrl: v.anhUrl?.trim() || null,
                duongDan: v.duongDan?.trim() || null,
                viTri: v.viTri?.trim() || null,
                thuTu: v.thuTu ?? 0,
                hienThi: v.hienThi ?? true,
              });
              message.success('Đã tạo nội dung.');
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormSelect
              name="loai"
              label="Loại"
              options={[
                { value: 'BANNER', label: 'Banner' },
                { value: 'KIEN_THUC', label: 'Kiến thức' },
                { value: 'CAU_CHUYEN_TRANG_TRAI', label: 'Câu chuyện trang trại' },
              ]}
              rules={[{ required: true }]}
            />
            <ProFormText name="tieuDe" label="Tiêu đề" rules={[{ required: true }]} />
            <ProFormText name="nhan" label="Nhãn" />
            <ProFormTextArea name="moTa" label="Mô tả" />
            <ProFormText name="anhUrl" label="URL ảnh" />
            <ProFormText name="duongDan" label="Đường dẫn" />
            <ProFormSelect
              name="viTri"
              label="Vị trí banner"
              options={[
                { value: 'HERO', label: 'Hero' },
                { value: 'RIGHT_TOP', label: 'Phải trên' },
                { value: 'RIGHT_BOTTOM', label: 'Phải dưới' },
              ]}
            />
            <ProFormDigit name="thuTu" label="Thứ tự" min={0} initialValue={0} />
            <ProFormSwitch name="hienThi" label="Hiển thị" initialValue />
          </ModalForm>,
        ]}
      />
    </PageContainer>
  );
}
