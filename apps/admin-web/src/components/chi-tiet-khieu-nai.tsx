'use client';

import {
  Alert,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';

import {
  LY_DO_KHIEU_NAI_ADMIN,
  type KhieuNaiChiTietAdmin,
} from '@/lib/api-khieu-nai';

type Props = {
  data: KhieuNaiChiTietAdmin | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
};

function nhanLyDo(value: string): string {
  return LY_DO_KHIEU_NAI_ADMIN.find((item) => item.value === value)?.label ?? value;
}

function dinhDangNgay(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function taoTimeline(data: KhieuNaiChiTietAdmin) {
  const items: Array<{ key: string; time: string; label: string }> = [
    {
      key: `complaint-${data.id}`,
      time: data.createdAt,
      label: 'Khiếu nại được tạo',
    },
    ...data.bangChung.map((item) => ({
      key: `evidence-${item.id}`,
      time: item.createdAt,
      label: `Ghi nhận bằng chứng: ${item.tenGoc}`,
    })),
    ...data.vanChuyen.map((item) => ({
      key: `shipment-${item.id}`,
      time: item.updatedAt,
      label: `Vận đơn ${item.maVanDon}: ${item.trangThai}`,
    })),
  ];

  return items
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map((item) => ({
      children: (
        <Space direction="vertical" size={0}>
          <Typography.Text>{item.label}</Typography.Text>
          <Typography.Text type="secondary">
            {dinhDangNgay(item.time)}
          </Typography.Text>
        </Space>
      ),
    }));
}

export function ChiTietKhieuNai({ data, loading, open, onClose }: Props) {
  return (
    <Drawer
      title={data ? `Chi tiết khiếu nại · ${data.donHang.maDonHang}` : 'Chi tiết khiếu nại'}
      width={980}
      loading={loading}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      {data ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions
            title="Đơn hàng"
            bordered
            column={2}
            items={[
              {
                key: 'order',
                label: 'Mã đơn',
                children: (
                  <Typography.Text copyable>{data.donHang.maDonHang}</Typography.Text>
                ),
              },
              {
                key: 'supplier-order',
                label: 'Đơn nhà cung cấp',
                children: data.donNhaCungCap.maDon,
              },
              {
                key: 'supplier',
                label: 'Nhà cung cấp',
                children: data.donNhaCungCap.tenNhaCungCap,
              },
              {
                key: 'reason',
                label: 'Lý do',
                children: <Tag color="volcano">{nhanLyDo(data.lyDo)}</Tag>,
              },
              {
                key: 'created',
                label: 'Tạo lúc',
                children: dinhDangNgay(data.createdAt),
              },
              {
                key: 'updated',
                label: 'Cập nhật',
                children: dinhDangNgay(data.updatedAt),
              },
            ]}
          />

          <Descriptions
            title="Sản phẩm khiếu nại"
            bordered
            column={2}
            items={[
              {
                key: 'product',
                label: 'Sản phẩm',
                children: data.mucDonHang.tenSanPham,
              },
              {
                key: 'sku',
                label: 'SKU',
                children: data.mucDonHang.sku,
              },
              {
                key: 'qty',
                label: 'Số lượng',
                children: data.mucDonHang.soLuong,
              },
              {
                key: 'unit-price',
                label: 'Đơn giá',
                children: tien(data.mucDonHang.donGia),
              },
              {
                key: 'total',
                label: 'Thành tiền',
                children: tien(data.mucDonHang.thanhTien),
              },
              {
                key: 'farm',
                label: 'Trang trại',
                children: `${data.mucDonHang.tenTrangTrai} (${data.mucDonHang.maTrangTrai})`,
              },
              {
                key: 'description',
                label: 'Mô tả khiếu nại',
                children: data.moTa || 'Không có mô tả.',
                span: 2,
              },
            ]}
          />

          <div>
            <Typography.Title level={5}>Lô / phân bổ tồn kho</Typography.Title>
            {data.phanBo.length > 0 ? (
              <Table
                rowKey="tonKhoLoId"
                size="small"
                pagination={false}
                dataSource={data.phanBo}
                columns={[
                  { title: 'Kho', dataIndex: 'maKho' },
                  { title: 'Lô', dataIndex: 'maLo' },
                  {
                    title: 'Mã truy xuất',
                    dataIndex: 'maTruyXuat',
                    render: (value: string | null) => value ?? 'Chưa có',
                  },
                  {
                    title: 'Số lượng',
                    dataIndex: 'soLuong',
                    align: 'right',
                  },
                ]}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có phân bổ lô"
              />
            )}
          </div>

          <div>
            <Typography.Title level={5}>Vận chuyển</Typography.Title>
            {data.vanChuyen.length > 0 ? (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.vanChuyen}
                columns={[
                  { title: 'Mã vận đơn', dataIndex: 'maVanDon' },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'trangThai',
                    render: (value: string) => <Tag>{value}</Tag>,
                  },
                  {
                    title: 'Tạo lúc',
                    dataIndex: 'createdAt',
                    render: (value: string) => dinhDangNgay(value),
                  },
                  {
                    title: 'Cập nhật',
                    dataIndex: 'updatedAt',
                    render: (value: string) => dinhDangNgay(value),
                  },
                ]}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có vận chuyển"
              />
            )}
          </div>

          <div>
            <Typography.Title level={5}>Bằng chứng</Typography.Title>
            {data.bangChung.length > 0 ? (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.bangChung}
                columns={[
                  { title: 'Tên file', dataIndex: 'tenGoc' },
                  { title: 'Định dạng', dataIndex: 'mimeType' },
                  {
                    title: 'Tạo lúc',
                    dataIndex: 'createdAt',
                    render: (value: string) => dinhDangNgay(value),
                  },
                ]}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có bằng chứng"
              />
            )}
          </div>

          <div>
            <Typography.Title level={5}>Dòng thời gian</Typography.Title>
            <Typography.Paragraph type="secondary">
              Chỉ sử dụng timestamp có thật từ khiếu nại, bằng chứng và vận chuyển.
            </Typography.Paragraph>
            <Timeline items={taoTimeline(data)} />
          </div>

          <Alert
            type="info"
            showIcon
            message="Chưa có API quyết định xử lý khiếu nại"
            description="Domain hiện tại chỉ hỗ trợ xem danh sách và chi tiết; Admin không tự tạo trạng thái xử lý hoặc hoàn tiền giả."
          />
        </Space>
      ) : null}
    </Drawer>
  );
}
