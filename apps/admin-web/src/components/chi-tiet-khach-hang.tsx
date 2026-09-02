'use client';

import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { Button, Descriptions, Drawer, Space, Spin, Tabs, Tag, Typography } from 'antd';

import type {
  DonHangKhachHangAdmin,
  KhachHangAdmin,
  KhieuNaiKhachHangAdmin,
} from '@/lib/api-khach-hang';

type Props = {
  open: boolean;
  loading: boolean;
  data: KhachHangAdmin | null;
  donHang: DonHangKhachHangAdmin[];
  khieuNai: KhieuNaiKhachHangAdmin[];
  onClose: () => void;
  onDoiTrangThai: () => void;
};

function nhanTrangThai(value: KhachHangAdmin['trangThai']) {
  if (value === 'HOAT_DONG') return <Tag color="green">Hoạt động</Tag>;
  if (value === 'TAM_KHOA') return <Tag color="red">Tạm khóa</Tag>;
  return <Tag>Chưa kích hoạt</Tag>;
}

export function ChiTietKhachHang({
  open,
  loading,
  data,
  donHang,
  khieuNai,
  onClose,
  onDoiTrangThai,
}: Props) {
  const orderColumns: ProColumns<DonHangKhachHangAdmin>[] = [
    { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true },
    { title: 'Trạng thái', dataIndex: 'trangThai' },
    { title: 'Tổng tiền', dataIndex: 'tongTien', valueType: 'money' },
    { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime' },
  ];
  const complaintColumns: ProColumns<KhieuNaiKhachHangAdmin>[] = [
    { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true },
    { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
    { title: 'Lý do', dataIndex: 'lyDo' },
    { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime' },
  ];

  return (
    <Drawer
      title="Chi tiết khách hàng"
      width={900}
      open={open}
      onClose={onClose}
      extra={
        data ? (
          <Button danger={data.trangThai !== 'TAM_KHOA'} onClick={onDoiTrangThai}>
            {data.trangThai === 'TAM_KHOA' ? 'Mở khóa' : 'Khóa'}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <Spin />
      ) : data ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Họ tên">{data.hoTen}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {nhanTrangThai(data.trangThai)}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{data.soDienThoai ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">{data.ngaySinh ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng ID">
              <Typography.Text copyable>{data.id}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Tabs
            items={[
              {
                key: 'orders',
                label: `Đơn hàng (${donHang.length})`,
                children: (
                  <ProTable
                    rowKey="id"
                    search={false}
                    options={false}
                    pagination={false}
                    columns={orderColumns}
                    dataSource={donHang}
                  />
                ),
              },
              {
                key: 'complaints',
                label: `Khiếu nại (${khieuNai.length})`,
                children: (
                  <ProTable
                    rowKey="id"
                    search={false}
                    options={false}
                    pagination={false}
                    columns={complaintColumns}
                    dataSource={khieuNai}
                  />
                ),
              },
            ]}
          />
        </Space>
      ) : null}
    </Drawer>
  );
}
