'use client';

import {
  AlertOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  ProCard,
  ProTable,
  StatisticCard,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Button,
  Col,
  Descriptions,
  Drawer,
  Row,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo } from 'react';

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

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function nhanTrangThai(value: KhachHangAdmin['trangThai']) {
  if (value === 'HOAT_DONG') return <Tag color="green">Hoạt động</Tag>;
  if (value === 'TAM_KHOA') return <Tag color="red">Tạm khóa</Tag>;
  return <Tag>Chưa kích hoạt</Tag>;
}

function nhanDonHang(value: string) {
  const map: Record<string, { text: string; color: string }> = {
    CHO_THANH_TOAN: { text: 'Chờ thanh toán', color: 'gold' },
    DA_XAC_NHAN: { text: 'Đã xác nhận', color: 'blue' },
    DANG_CHUAN_BI: { text: 'Đang chuẩn bị', color: 'processing' },
    DA_DONG_GOI: { text: 'Đã đóng gói', color: 'cyan' },
    DANG_GIAO: { text: 'Đang giao', color: 'geekblue' },
    DA_GIAO: { text: 'Đã giao', color: 'green' },
    HOAN_THANH: { text: 'Hoàn thành', color: 'success' },
    DA_HUY: { text: 'Đã hủy', color: 'red' },
    KHIEU_NAI: { text: 'Khiếu nại', color: 'volcano' },
  };

  const meta = map[value];
  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : <Tag>{value}</Tag>;
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
  const tongChiTieu = useMemo(
    () =>
      donHang
        .filter((item) => item.trangThai !== 'DA_HUY')
        .reduce((sum, item) => sum + Number(item.tongTien || 0), 0),
    [donHang],
  );

  const orderColumns: ProColumns<DonHangKhachHangAdmin>[] = [
    {
      title: 'Mã đơn',
      dataIndex: 'maDonHang',
      copyable: true,
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      render: (_, row) => nhanDonHang(row.trangThai),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      align: 'right',
      render: (_, row) => tien(row.tongTien),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (_, row) =>
        new Date(row.createdAt).toLocaleString('vi-VN'),
    },
  ];

  const complaintColumns: ProColumns<KhieuNaiKhachHangAdmin>[] = [
    {
      title: 'Mã đơn',
      dataIndex: 'maDonHang',
      copyable: true,
      width: 145,
    },
    { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
    { title: 'Lý do', dataIndex: 'lyDo' },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (_, row) =>
        new Date(row.createdAt).toLocaleString('vi-VN'),
    },
  ];

  return (
    <Drawer
      title={data ? `Chi tiết · ${data.hoTen}` : 'Chi tiết khách hàng'}
      width={920}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        data ? (
          <Button
            danger={data.trangThai !== 'TAM_KHOA'}
            onClick={onDoiTrangThai}
          >
            {data.trangThai === 'TAM_KHOA'
              ? 'Mở khóa tài khoản'
              : 'Khóa tài khoản'}
          </Button>
        ) : null
      }
    >
      {loading ? (
        <div style={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <StatisticCard
                bordered
                statistic={{
                  title: 'Đơn hàng',
                  value: data.tongDonHang,
                  icon: <ShoppingCartOutlined style={{ color: '#087a4b' }} />,
                }}
              />
            </Col>
            <Col span={8}>
              <StatisticCard
                bordered
                statistic={{
                  title: 'Tổng giá trị đơn',
                  value: tien(tongChiTieu),
                  icon: <WalletOutlined style={{ color: '#378fe4' }} />,
                }}
              />
            </Col>
            <Col span={8}>
              <StatisticCard
                bordered
                statistic={{
                  title: 'Khiếu nại',
                  value: data.tongKhieuNai,
                  icon: <AlertOutlined style={{ color: '#e7992e' }} />,
                }}
              />
            </Col>
          </Row>

          <ProCard bordered title="Thông tin khách hàng">
            <Descriptions
              bordered
              column={2}
              size="small"
              items={[
                { key: 'name', label: 'Họ tên', children: data.hoTen },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children: nhanTrangThai(data.trangThai),
                },
                { key: 'email', label: 'Email', children: data.email },
                {
                  key: 'phone',
                  label: 'Số điện thoại',
                  children: data.soDienThoai ?? '—',
                },
                {
                  key: 'birthday',
                  label: 'Ngày sinh',
                  children: data.ngaySinh ?? '—',
                },
                {
                  key: 'created',
                  label: 'Ngày tham gia',
                  children: new Date(data.createdAt).toLocaleString('vi-VN'),
                },
                {
                  key: 'customer-id',
                  label: 'Khách hàng ID',
                  span: 2,
                  children: (
                    <Typography.Text copyable>{data.id}</Typography.Text>
                  ),
                },
              ]}
            />
          </ProCard>

          <Tabs
            items={[
              {
                key: 'orders',
                label: `Đơn hàng (${donHang.length})`,
                children: (
                  <ProTable<DonHangKhachHangAdmin>
                    rowKey="id"
                    search={false}
                    options={false}
                    pagination={false}
                    columns={orderColumns}
                    dataSource={donHang}
                    scroll={{ x: 700 }}
                  />
                ),
              },
              {
                key: 'complaints',
                label: `Khiếu nại (${khieuNai.length})`,
                children: (
                  <ProTable<KhieuNaiKhachHangAdmin>
                    rowKey="id"
                    search={false}
                    options={false}
                    pagination={false}
                    columns={complaintColumns}
                    dataSource={khieuNai}
                    scroll={{ x: 700 }}
                    expandable={{
                      expandedRowRender: (row) => (
                        <Typography.Paragraph style={{ margin: 0 }}>
                          {row.moTa || 'Không có mô tả bổ sung.'}
                        </Typography.Paragraph>
                      ),
                    }}
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
