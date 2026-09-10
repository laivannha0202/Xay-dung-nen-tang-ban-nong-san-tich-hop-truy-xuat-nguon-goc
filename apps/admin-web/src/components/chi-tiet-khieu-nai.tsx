'use client';

import { FileImageOutlined, LinkOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function nhanTrangThaiVanChuyen(value: string): string {
  const labels: Record<string, string> = {
    CREATED: 'Đã tạo vận đơn',
    PICKED_UP: 'Đã lấy hàng',
    IN_TRANSIT: 'Đang vận chuyển',
    OUT_FOR_DELIVERY: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    FAILED: 'Giao chưa thành công',
    RETURNED: 'Đã hoàn về',
  };
  return labels[value] ?? value;
}

function mauTrangThaiVanChuyen(value: string): string {
  if (value === 'DELIVERED') return 'green';
  if (value === 'FAILED' || value === 'RETURNED') return 'red';
  if (value === 'IN_TRANSIT' || value === 'OUT_FOR_DELIVERY') return 'blue';
  return 'cyan';
}

function taoTimeline(data: KhieuNaiChiTietAdmin) {
  const items: Array<{ key: string; time: string; label: string }> = [
    {
      key: `support-${data.id}`,
      time: data.createdAt,
      label: 'Khách hàng gửi yêu cầu hỗ trợ',
    },
    ...data.bangChung.map((item) => ({
      key: `evidence-${item.id}`,
      time: item.createdAt,
      label: `Ghi nhận bằng chứng: ${item.tenGoc}`,
    })),
    ...data.vanChuyen.map((item) => ({
      key: `shipment-${item.id}`,
      time: item.updatedAt,
      label: `Vận đơn ${item.maVanDon}: ${nhanTrangThaiVanChuyen(item.trangThai)}`,
    })),
  ];

  return items
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map((item) => ({
      children: (
        <Space direction="vertical" size={0}>
          <Typography.Text>{item.label}</Typography.Text>
          <Typography.Text type="secondary">{dinhDangNgay(item.time)}</Typography.Text>
        </Space>
      ),
    }));
}

export function ChiTietKhieuNai({ data, loading, open, onClose }: Props) {
  return (
    <Drawer
      title={data ? `Yêu cầu hỗ trợ · ${data.donHang.maDonHang}` : 'Chi tiết yêu cầu hỗ trợ'}
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
                children: <Typography.Text copyable>{data.donHang.maDonHang}</Typography.Text>,
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
                label: 'Gửi lúc',
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
            title="Sản phẩm cần hỗ trợ"
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
                label: 'Nội dung yêu cầu',
                children: data.moTa || 'Không có mô tả.',
                span: 2,
              },
            ]}
          />

          <div>
            <Typography.Title level={5}>Lô hàng liên quan</Typography.Title>
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
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phân bổ lô" />
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
                    render: (value: string) => (
                      <Tag color={mauTrangThaiVanChuyen(value)}>
                        {nhanTrangThaiVanChuyen(value)}
                      </Tag>
                    ),
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
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có vận chuyển" />
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
                  {
                    title: 'Xem trước',
                    key: 'preview',
                    width: 100,
                    render: (_, row) =>
                      row.urlXem && row.mimeType.startsWith('image/') ? (
                        <Image
                          src={row.urlXem}
                          alt={row.tenGoc}
                          width={72}
                          height={54}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                        />
                      ) : (
                        <FileImageOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                      ),
                  },
                  { title: 'Tên tệp', dataIndex: 'tenGoc' },
                  {
                    title: 'Loại',
                    dataIndex: 'mimeType',
                    render: (value: string) =>
                      value.startsWith('image/') ? 'Ảnh' : 'Tệp đính kèm',
                  },
                  {
                    title: 'Tạo lúc',
                    dataIndex: 'createdAt',
                    render: (value: string) => dinhDangNgay(value),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: 110,
                    render: (_, row) =>
                      row.urlXem ? (
                        <Button
                          type="link"
                          href={row.urlXem}
                          target="_blank"
                          rel="noreferrer"
                          icon={<LinkOutlined />}
                        >
                          Mở tệp
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">Không khả dụng</Typography.Text>
                      ),
                  },
                ]}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bằng chứng" />
            )}
          </div>

          <div>
            <Typography.Title level={5}>Dòng thời gian</Typography.Title>
            <Typography.Paragraph type="secondary">
              Các mốc được tổng hợp từ thời gian gửi yêu cầu, bằng chứng và vận chuyển đã ghi nhận.
            </Typography.Paragraph>
            <Timeline items={taoTimeline(data)} />
          </div>

          <Alert
            type="info"
            showIcon
            message="Chế độ theo dõi"
            description="Màn hình hiện cho phép xem và đối chiếu yêu cầu hỗ trợ. Thao tác quyết định xử lý hoặc hoàn tiền chưa được bật để tránh ghi nhận trạng thái không có nguồn dữ liệu xác thực."
          />
        </Space>
      ) : null}
    </Drawer>
  );
}
