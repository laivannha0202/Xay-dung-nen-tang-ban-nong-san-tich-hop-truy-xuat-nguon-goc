'use client';

import {
  ModalForm,
  PageContainer,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Drawer, Popconfirm, Space, Table, Tag } from 'antd';
import { useRef, useState } from 'react';

import {
  chiTietFlashSale,
  danhSachFlashSale,
  doiTrangThaiChienDich,
  taoChienDich,
  themMucChienDich,
  xoaMucChienDich,
  type FlashSale,
  type FlashSaleChiTiet,
} from '@/lib/api-flash-sale';

type TaoForm = { ten: string; moTa?: string; batDauLuc: string; ketThucLuc: string };
type MucForm = {
  bienTheSanPhamId: string;
  giaFlash: number;
  gioiHanTong?: number;
  gioiHanMoiKhach?: number;
};

export default function TrangFlashSale() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [detail, setDetail] = useState<FlashSaleChiTiet | null>(null);

  const columns: ProColumns<FlashSale>[] = [
    { title: 'Chiến dịch', dataIndex: 'ten', search: false },
    {
      title: 'Bắt đầu',
      dataIndex: 'batDauLuc',
      search: false,
      render: (_, row) => new Date(row.batDauLuc).toLocaleString('vi-VN'),
    },
    {
      title: 'Kết thúc',
      dataIndex: 'ketThucLuc',
      search: false,
      render: (_, row) => new Date(row.ketThucLuc).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động' },
        NGUNG_HOAT_DONG: { text: 'Tạm dừng' },
      },
      render: (_, row) => (
        <Tag color={row.trangThai === 'HOAT_DONG' ? 'green' : 'default'}>
          {row.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <Button
          key="detail"
          type="link"
          onClick={async () => setDetail(await chiTietFlashSale(row.id))}
        >
          Chi tiết
        </Button>,
        <Popconfirm
          key="toggle"
          title="Xác nhận đổi trạng thái?"
          onConfirm={async () => {
            await doiTrangThaiChienDich(
              row.id,
              row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
            );
            message.success('Đã cập nhật Flash Sale.');
            actionRef.current?.reload();
          }}
        >
          <Button type="link">{row.trangThai === 'HOAT_DONG' ? 'Tạm dừng' : 'Kích hoạt'}</Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="Flash Sale" subTitle="Giá và quota do backend kiểm soát.">
      <ProTable<FlashSale>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const r = await danhSachFlashSale({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            trangThai:
              typeof params.trangThai === 'string'
                ? (params.trangThai as FlashSale['trangThai'])
                : undefined,
          });
          return { data: r.duLieu, success: true, total: r.tong };
        }}
        toolBarRender={() => [
          <ModalForm<TaoForm>
            key="create"
            title="Tạo Flash Sale"
            trigger={<Button type="primary">Tạo chiến dịch</Button>}
            onFinish={async (v) => {
              await taoChienDich({
                ten: v.ten.trim(),
                moTa: v.moTa?.trim() || null,
                batDauLuc: new Date(v.batDauLuc).toISOString(),
                ketThucLuc: new Date(v.ketThucLuc).toISOString(),
              });
              message.success('Đã tạo Flash Sale.');
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormText name="ten" label="Tên chiến dịch" rules={[{ required: true }]} />
            <ProFormTextArea name="moTa" label="Mô tả" />
            <ProFormDateTimePicker name="batDauLuc" label="Bắt đầu" rules={[{ required: true }]} />
            <ProFormDateTimePicker
              name="ketThucLuc"
              label="Kết thúc"
              rules={[{ required: true }]}
            />
          </ModalForm>,
        ]}
      />

      <Drawer
        title={detail ? `Flash Sale · ${detail.ten}` : 'Flash Sale'}
        width={760}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <ModalForm<MucForm>
              title="Thêm SKU vào Flash Sale"
              trigger={<Button type="primary">Thêm SKU</Button>}
              onFinish={async (v) => {
                setDetail(
                  await themMucChienDich(detail.id, {
                    bienTheSanPhamId: v.bienTheSanPhamId.trim(),
                    giaFlash: v.giaFlash,
                    gioiHanTong: v.gioiHanTong ?? null,
                    gioiHanMoiKhach: v.gioiHanMoiKhach ?? null,
                  }),
                );
                message.success('Đã thêm SKU.');
                return true;
              }}
            >
              <ProFormText
                name="bienTheSanPhamId"
                label="ID biến thể / SKU"
                tooltip="V14 giữ API hiện tại; có thể nâng thành picker tìm kiếm SKU ở vòng UI tiếp theo."
                rules={[{ required: true }]}
              />
              <ProFormDigit
                name="giaFlash"
                label="Giá Flash"
                min={0.01}
                fieldProps={{ precision: 2 }}
                rules={[{ required: true }]}
              />
              <ProFormDigit name="gioiHanTong" label="Giới hạn tổng" min={1} />
              <ProFormDigit name="gioiHanMoiKhach" label="Giới hạn mỗi khách" min={1} />
            </ModalForm>

            <Table
              rowKey="id"
              pagination={false}
              dataSource={detail.muc}
              columns={[
                { title: 'Variant ID', dataIndex: 'bienTheSanPhamId' },
                {
                  title: 'Giá Flash',
                  dataIndex: 'giaFlash',
                  render: (v: number) => `${Number(v).toLocaleString('vi-VN')}đ`,
                },
                { title: 'Đã bán', dataIndex: 'soLuongDaBan' },
                {
                  title: 'Quota',
                  dataIndex: 'gioiHanTong',
                  render: (v: number | null) => v ?? '∞',
                },
                {
                  title: '',
                  render: (_, row) => (
                    <Popconfirm
                      title="Gỡ SKU?"
                      onConfirm={async () => {
                        setDetail(await xoaMucChienDich(detail.id, row.id));
                        message.success('Đã gỡ SKU.');
                      }}
                    >
                      <Button danger type="link">
                        Gỡ
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
