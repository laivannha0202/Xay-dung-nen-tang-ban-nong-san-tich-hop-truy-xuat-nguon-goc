'use client';

import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProDescriptions,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { DongGoiDonHang } from '@/components/dong-goi-don-hang';
import {
  capNhatTrangThaiVanChuyenAdmin,
  hoanTienThanhToanAdmin,
  layChiTietDonHangAdmin,
  layDanhSachDonHangAdmin,
  type TrangThaiVanChuyenAdmin,
} from '@/lib/api-don-hang';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type DanhSach = Awaited<ReturnType<typeof layDanhSachDonHangAdmin>>;
type DonHang = DanhSach['duLieu'][number];
type ChiTiet = Awaited<ReturnType<typeof layChiTietDonHangAdmin>>;
type DonNhaCungCap = ChiTiet['donNhaCungCap'][number];
type Muc = DonNhaCungCap['muc'][number];
type ThanhToan = ChiTiet['thanhToan'][number];

// Exact enums từ backend (Prisma schema). Key phải khớp backend, label chỉ để hiển thị.
const TRANG_THAI_DON_HANG = [
  'CHO_THANH_TOAN',
  'DA_XAC_NHAN',
  'DANG_CHUAN_BI',
  'DA_DONG_GOI',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_THANH',
  'DA_HUY',
  'KHIEU_NAI',
  'HOAN_TIEN_MOT_PHAN',
  'HOAN_TIEN_TOAN_BO',
] as const;

type TrangThaiDonHang = (typeof TRANG_THAI_DON_HANG)[number];

const NHAN_TRANG_THAI_DON: Record<TrangThaiDonHang, { text: string; color: string }> = {
  CHO_THANH_TOAN: { text: 'Chờ thanh toán', color: 'gold' },
  DA_XAC_NHAN: { text: 'Đã xác nhận', color: 'blue' },
  DANG_CHUAN_BI: { text: 'Đang chuẩn bị', color: 'processing' },
  DA_DONG_GOI: { text: 'Đã đóng gói', color: 'cyan' },
  DANG_GIAO: { text: 'Đang giao', color: 'geekblue' },
  DA_GIAO: { text: 'Đã giao', color: 'green' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'success' },
  DA_HUY: { text: 'Đã hủy', color: 'red' },
  KHIEU_NAI: { text: 'Khiếu nại', color: 'volcano' },
  HOAN_TIEN_MOT_PHAN: { text: 'Hoàn tiền một phần', color: 'purple' },
  HOAN_TIEN_TOAN_BO: { text: 'Hoàn tiền toàn bộ', color: 'magenta' },
};

// Exact enum TrangThaiThanhToan từ backend.
const NHAN_THANH_TOAN: Record<string, { text: string; color: string }> = {
  CREATED: { text: 'Đã tạo', color: 'default' },
  PENDING: { text: 'Chờ thanh toán', color: 'gold' },
  PAID: { text: 'Đã thanh toán', color: 'green' },
  FAILED: { text: 'Thanh toán thất bại', color: 'red' },
  CANCELLED: { text: 'Đã hủy', color: 'red' },
  PARTIALLY_REFUNDED: { text: 'Hoàn tiền một phần', color: 'purple' },
  REFUNDED: { text: 'Đã hoàn tiền', color: 'blue' },
};

// Exact enum TrangThaiVanChuyen từ backend.
const NHAN_VAN_CHUYEN: Record<string, { text: string; color: string }> = {
  CREATED: { text: 'Đã tạo vận đơn', color: 'default' },
  PICKED_UP: { text: 'Đã lấy hàng', color: 'blue' },
  IN_TRANSIT: { text: 'Đang vận chuyển', color: 'processing' },
  OUT_FOR_DELIVERY: { text: 'Đang giao hàng', color: 'geekblue' },
  DELIVERED: { text: 'Đã giao', color: 'green' },
  FAILED: { text: 'Giao thất bại', color: 'red' },
  RETURNED: { text: 'Đã hoàn về', color: 'orange' },
};

const HANH_DONG_VAN_CHUYEN: Record<
  string,
  Array<{
    trangThai: TrangThaiVanChuyenAdmin;
    nhan: string;
    danger?: boolean;
    primary?: boolean;
  }>
> = {
  CREATED: [
    { trangThai: 'PICKED_UP', nhan: 'Xác nhận đã lấy hàng', primary: true },
  ],
  PICKED_UP: [
    { trangThai: 'IN_TRANSIT', nhan: 'Bắt đầu vận chuyển', primary: true },
    { trangThai: 'FAILED', nhan: 'Báo giao thất bại', danger: true },
  ],
  IN_TRANSIT: [
    { trangThai: 'OUT_FOR_DELIVERY', nhan: 'Bắt đầu giao tới khách', primary: true },
    { trangThai: 'FAILED', nhan: 'Báo giao thất bại', danger: true },
  ],
  OUT_FOR_DELIVERY: [
    { trangThai: 'DELIVERED', nhan: 'Xác nhận đã giao', primary: true },
    { trangThai: 'FAILED', nhan: 'Báo giao thất bại', danger: true },
  ],
  FAILED: [
    { trangThai: 'RETURNED', nhan: 'Xác nhận đã hoàn về', danger: true },
  ],
  DELIVERED: [],
  RETURNED: [],
};

const NHAN_DAT_CHO: Record<string, { text: string; color: string }> = {
  DANG_GIU: { text: 'Đang giữ hàng', color: 'gold' },
  DA_BAN: { text: 'Đã ghi nhận bán', color: 'green' },
  DA_GIAI_PHONG: { text: 'Đã giải phóng', color: 'default' },
  HET_HAN: { text: 'Đã hết hạn', color: 'red' },
};

const VALUE_ENUM_TRANG_THAI = Object.fromEntries(
  TRANG_THAI_DON_HANG.map((state) => [state, { text: NHAN_TRANG_THAI_DON[state].text }]),
);

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function dinhDangNgay(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function nhanTrangThaiDon(value: string) {
  const meta = NHAN_TRANG_THAI_DON[value as TrangThaiDonHang];
  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : <Tag>{value}</Tag>;
}

function nhanTrangThaiThanhToan(value: string | null | undefined) {
  if (!value) return <Tag>Chưa có</Tag>;
  const meta = NHAN_THANH_TOAN[value];
  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : <Tag>{value}</Tag>;
}

function nhanTrangThaiVanChuyen(value: string) {
  const meta = NHAN_VAN_CHUYEN[value];
  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : <Tag>{value}</Tag>;
}

function nhanDatCho(value: string | null | undefined) {
  if (!value) return <Tag>Không có</Tag>;
  const meta = NHAN_DAT_CHO[value];
  return meta ? <Tag color={meta.color}>{meta.text}</Tag> : <Tag>{value}</Tag>;
}

export default function TrangDonHangQuanTri() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('don_hang.xu_ly') ?? false;

  const [chiTiet, setChiTiet] = useState<ChiTiet | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [hoanTienCho, setHoanTienCho] = useState<ThanhToan | null>(null);
  const [dangHoanTien, setDangHoanTien] = useState(false);
  const [dangCapNhatVanChuyen, setDangCapNhatVanChuyen] = useState<string | null>(null);
  const [formHoanTien] = Form.useForm();

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    try {
      setChiTiet(await layChiTietDonHangAdmin(id));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không tải được chi tiết đơn hàng.',
      );
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const taiLaiChiTiet = async (id: string) => {
    try {
      setChiTiet(await layChiTietDonHangAdmin(id));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không tải lại được chi tiết đơn hàng.',
      );
    }
  };

  const moHoanTien = (payment: ThanhToan) => {
    setHoanTienCho(payment);
    formHoanTien.setFieldsValue({ soTien: payment.soTien, lyDo: '' });
  };

  const thucHienHoanTien = async () => {
    if (!hoanTienCho || !chiTiet) return;
    try {
      const values = await formHoanTien.validateFields();
      setDangHoanTien(true);
      await hoanTienThanhToanAdmin(hoanTienCho.id, {
        maYeuCau: crypto.randomUUID(),
        soTien: values.soTien as number,
        lyDo: values.lyDo as string,
      });
      message.success('Đã gửi yêu cầu hoàn tiền.');
      setHoanTienCho(null);
      actionRef.current?.reload();
      await taiLaiChiTiet(chiTiet.id);
    } catch (error) {
      if (error instanceof Error && 'errorFields' in error) return;
      message.error(error instanceof Error ? error.message : 'Hoàn tiền thất bại.');
    } finally {
      setDangHoanTien(false);
    }
  };

  const thucHienCapNhatVanChuyen = async (
    vanChuyenId: string,
    trangThai: TrangThaiVanChuyenAdmin,
  ) => {
    if (!chiTiet) return;

    const key = `${vanChuyenId}:${trangThai}`;
    setDangCapNhatVanChuyen(key);

    try {
      const result = await capNhatTrangThaiVanChuyenAdmin(vanChuyenId, {
        trangThai,
        viTri: 'AgriMarket Demo',
      });

      if (trangThai === 'DELIVERED' && result.codDaThanhToan) {
        message.success(
          'Đã giao toàn bộ đơn và đã ghi nhận COD là Đã thanh toán.',
        );
      } else {
        message.success('Đã cập nhật trạng thái vận chuyển.');
      }

      actionRef.current?.reload();
      await taiLaiChiTiet(chiTiet.id);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không cập nhật được trạng thái vận chuyển.',
      );
      throw error;
    } finally {
      setDangCapNhatVanChuyen(null);
    }
  };

  const capNhatVanChuyen = (
    vanChuyenId: string,
    trangThai: TrangThaiVanChuyenAdmin,
  ) => {
    if (trangThai !== 'DELIVERED') {
      void thucHienCapNhatVanChuyen(vanChuyenId, trangThai).catch(() => undefined);
      return;
    }

    const laCod = chiTiet?.thanhToan.some(
      (payment) =>
        payment.phuongThuc === 'COD' &&
        (payment.trangThai === 'CREATED' || payment.trangThai === 'PENDING'),
    );

    modal.confirm({
      title: 'Xác nhận đã giao hàng thành công?',
      content: laCod
        ? 'Đây là đơn COD. Khi tất cả phần hàng của đơn đã giao, hệ thống sẽ tự chuyển thanh toán COD sang “Đã thanh toán”.'
        : 'Hệ thống sẽ ghi nhận vận đơn là đã giao và cập nhật trạng thái đơn tương ứng.',
      okText: 'Xác nhận đã giao',
      cancelText: 'Chưa',
      onOk: () => thucHienCapNhatVanChuyen(vanChuyenId, trangThai),
    });
  };

  const columns: ProColumns<DonHang>[] = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'maDonHang',
      hideInTable: true,
      fieldProps: { placeholder: 'Tìm theo mã đơn...' },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: VALUE_ENUM_TRANG_THAI,
      fieldProps: { placeholder: 'Chọn trạng thái', allowClear: true },
    },
    {
      title: '#',
      width: 48,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã đơn',
      dataIndex: 'maDonHang',
      search: false,
      copyable: true,
      width: 150,
      render: (_, row) => <Typography.Text strong copyable>{row.maDonHang}</Typography.Text>,
    },
    {
      title: 'Khách hàng',
      search: false,
      width: 210,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.khachHang.hoTen}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.khachHang.email}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Thời gian tạo',
      dataIndex: 'createdAt',
      search: false,
      width: 150,
      render: (_, row) => dinhDangNgay(row.createdAt as unknown as string),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      search: false,
      align: 'right',
      width: 125,
      render: (_, row) => (
        <Typography.Text strong>{tien(row.tongTien)}</Typography.Text>
      ),
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'trangThai',
      search: false,
      width: 150,
      render: (_, row) => nhanTrangThaiDon(row.trangThai),
    },
    {
      title: 'Thanh toán',
      search: false,
      width: 150,
      render: (_, row) => nhanTrangThaiThanhToan(row.trangThaiThanhToan),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, row) => [
        <Button
          key="detail"
          type="text"
          size="small"
          icon={<EyeOutlined />}
          aria-label={`Xem chi tiết đơn ${row.maDonHang}`}
          onClick={() => void moChiTiet(row.id)}
        />,
      ],
    },
  ];

  if (!phien) {
    return <PageContainer title="Quản lý đơn hàng">Đang kiểm tra phiên quản trị...</PageContainer>;
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý đơn hàng">
        Bạn không có quyền xử lý đơn hàng.
      </PageContainer>
    );
  }

  const daHuy = chiTiet?.trangThai === 'DA_HUY';

  return (
    <PageContainer
      title="Quản lý đơn hàng"
      subTitle="Theo dõi trạng thái, thanh toán, đóng gói và vận chuyển toàn hệ thống."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          onClick={() => actionRef.current?.reload()}
        >
          Làm mới
        </Button>,
      ]}
    >
      <ProCard bordered bodyStyle={{ padding: 0 }}>
        <ProTable<DonHang>
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          cardBordered={false}
          options={false}
          scroll={{ x: 1100 }}
          search={{
            labelWidth: 'auto',
            defaultCollapsed: false,
            collapseRender: false,
            searchText: 'Tìm kiếm',
            resetText: 'Đặt lại',
            span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
          }}
          request={async (params) => {
            const response = await layDanhSachDonHangAdmin({
              trang: params.current ?? 1,
              gioiHan: params.pageSize ?? 10,
              trangThai:
                typeof params.trangThai === 'string'
                  ? (params.trangThai as TrangThaiDonHang)
                  : undefined,
              maDonHang:
                typeof params.maDonHang === 'string' ? params.maDonHang : undefined,
            });
            return { data: response.duLieu, success: true, total: response.tong };
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} đơn hàng`,
          }}
        />
      </ProCard>

      <Drawer
        title={chiTiet ? `Chi tiết · ${chiTiet.maDonHang}` : 'Chi tiết đơn hàng'}
        width={1024}
        loading={dangTaiChiTiet}
        open={Boolean(chiTiet) || dangTaiChiTiet}
        onClose={() => setChiTiet(null)}
        destroyOnHidden
      >
        {chiTiet ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {daHuy ? (
              <Alert
                type="error"
                showIcon
                message="Đơn đã hủy — không còn thao tác đóng gói hay vận chuyển."
              />
            ) : null}

            <Card size="small" title="A. Tổng quan đơn hàng (snapshot)">
              <ProDescriptions<ChiTiet>
                column={2}
                dataSource={chiTiet}
                columns={[
                  { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true },
                  {
                    title: 'Trạng thái đơn',
                    dataIndex: 'trangThai',
                    render: (_, row) => nhanTrangThaiDon(row.trangThai),
                  },
                  {
                    title: 'Tổng thanh toán',
                    dataIndex: 'tongTien',
                    render: (_, row) => <Typography.Text strong>{tien(row.tongTien)}</Typography.Text>,
                  },
                  {
                    title: 'Khách hàng',
                    render: (_, row) => `${row.khachHang.hoTen} · ${row.khachHang.email}`,
                  },
                  {
                    title: 'Tạo lúc',
                    dataIndex: 'createdAt',
                    render: (_, row) => dinhDangNgay(row.createdAt as unknown as string),
                  },
                  {
                    title: 'Cập nhật',
                    dataIndex: 'updatedAt',
                    render: (_, row) => dinhDangNgay(row.updatedAt as unknown as string),
                  },
                  {
                    title: 'Giữ kho',
                    render: (_, row) => nhanDatCho(row.datCho?.trangThai ?? null),
                  },
                ]}
              />
            </Card>

            <Card size="small" title="Địa chỉ giao hàng (snapshot)">
              {chiTiet.diaChiGiaoHang &&
              (chiTiet.diaChiGiaoHang.tenNguoiNhan ||
                chiTiet.diaChiGiaoHang.soDienThoai ||
                chiTiet.diaChiGiaoHang.diaChi) ? (
                <ProDescriptions column={2} dataSource={chiTiet.diaChiGiaoHang}>
                  <ProDescriptions.Item dataIndex="tenNguoiNhan" title="Người nhận" />
                  <ProDescriptions.Item dataIndex="soDienThoai" title="Số điện thoại" />
                  <ProDescriptions.Item dataIndex="diaChi" title="Địa chỉ" span={2} />
                </ProDescriptions>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có địa chỉ snapshot cho đơn này"
                />
              )}
            </Card>

            <Card size="small" title="Cơ cấu giá đã chốt (snapshot)">
              <ProDescriptions<ChiTiet> column={2} dataSource={chiTiet}>
                <ProDescriptions.Item
                  dataIndex="tamTinhHangHoa"
                  title="Tạm tính hàng hóa"
                  render={(_, row) => tien(row.tamTinhHangHoa ?? 0)}
                />
                <ProDescriptions.Item
                  dataIndex="phiVanChuyen"
                  title="Phí vận chuyển"
                  render={(_, row) => tien(row.phiVanChuyen ?? 0)}
                />
                <ProDescriptions.Item
                  dataIndex="maKhuyenMai"
                  title="Mã khuyến mãi"
                  render={(_, row) => row.maKhuyenMai || 'Không áp dụng'}
                />
                <ProDescriptions.Item
                  dataIndex="giamKhuyenMai"
                  title="Giảm khuyến mãi"
                  render={(_, row) =>
                    (row.giamKhuyenMai ?? 0) > 0 ? `-${tien(row.giamKhuyenMai ?? 0)}` : tien(0)
                  }
                />
                <ProDescriptions.Item
                  dataIndex="diemDaDung"
                  title="Điểm đã dùng"
                  render={(_, row) =>
                    `${new Intl.NumberFormat('vi-VN').format(row.diemDaDung ?? 0)} điểm`
                  }
                />
                <ProDescriptions.Item
                  dataIndex="giaTriDiemDaDung"
                  title="Giá trị điểm"
                  render={(_, row) =>
                    (row.giaTriDiemDaDung ?? 0) > 0
                      ? `-${tien(row.giaTriDiemDaDung ?? 0)}`
                      : tien(0)
                  }
                />
              </ProDescriptions>
            </Card>

            <Card size="small" title="B. Mục hàng (snapshot, không dùng giá hiện tại)">
              {chiTiet.donNhaCungCap.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có mục hàng" />
              ) : (
                <Collapse
                  items={chiTiet.donNhaCungCap.map((suborder) => ({
                    key: suborder.id,
                    label: (
                      <Space wrap>
                        <strong>{suborder.maDon}</strong>
                        <span>{suborder.tenNhaCungCap}</span>
                        {nhanTrangThaiDon(suborder.trangThai)}
                        <Typography.Text strong>{tien(suborder.tamTinh)}</Typography.Text>
                      </Space>
                    ),
                    children: (
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {!daHuy ? (
                          <DongGoiDonHang
                            donNhaCungCapId={suborder.id}
                            trangThai={suborder.trangThai}
                            onChanged={async () => {
                              actionRef.current?.reload();
                              await taiLaiChiTiet(chiTiet.id);
                            }}
                          />
                        ) : null}
                        <Table<Muc>
                          rowKey="id"
                          size="small"
                          pagination={false}
                          dataSource={suborder.muc}
                          expandable={{
                            expandedRowRender: (item) =>
                              item.phanBo.length === 0 ? (
                                <Typography.Text type="secondary">
                                  Chưa có allocation cho mục này.
                                </Typography.Text>
                              ) : (
                                <Table
                                  rowKey="tonKhoLoId"
                                  size="small"
                                  pagination={false}
                                  dataSource={item.phanBo}
                                  columns={[
                                    { title: 'Kho', dataIndex: 'maKho' },
                                    { title: 'Mã lô', dataIndex: 'maLo' },
                                    {
                                      title: 'SL phân bổ',
                                      dataIndex: 'soLuong',
                                      align: 'right',
                                    },
                                    {
                                      title: 'Mã truy xuất',
                                      dataIndex: 'maTruyXuat',
                                      render: (value: string | null) =>
                                        value ? (
                                          <Typography.Text copyable code>
                                            {value}
                                          </Typography.Text>
                                        ) : (
                                          <Tag>Chưa có</Tag>
                                        ),
                                    },
                                  ]}
                                />
                              ),
                          }}
                          columns={[
                            {
                              title: 'Sản phẩm (snapshot)',
                              render: (_, item) => (
                                <Space direction="vertical" size={0}>
                                  <Typography.Text strong>{item.tenSanPham}</Typography.Text>
                                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {item.sku} · {item.khoiLuong} {item.donVi}
                                  </Typography.Text>
                                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {item.maTrangTrai} · {item.tenTrangTrai}
                                  </Typography.Text>
                                </Space>
                              ),
                            },
                            { title: 'SL', dataIndex: 'soLuong', align: 'right', width: 60 },
                            {
                              title: 'Đơn giá (snapshot)',
                              dataIndex: 'donGia',
                              align: 'right',
                              width: 130,
                              render: (value: number) => tien(value),
                            },
                            {
                              title: 'Thành tiền',
                              dataIndex: 'thanhTien',
                              align: 'right',
                              width: 130,
                              render: (value: number) => tien(value),
                            },
                          ]}
                        />
                      </Space>
                    ),
                  }))}
                />
              )}
            </Card>

            <Card size="small" title="Thanh toán (độc lập với trạng thái đơn)">
              {chiTiet.thanhToan.length > 0 ? (
                <Collapse
                  items={chiTiet.thanhToan.map((payment) => ({
                    key: payment.id,
                    label: (
                      <Space wrap>
                        <strong>{payment.phuongThuc}</strong>
                        {nhanTrangThaiThanhToan(payment.trangThai)}
                        <Typography.Text>{tien(payment.soTien)}</Typography.Text>
                      </Space>
                    ),
                    children: (
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <ProDescriptions column={2} dataSource={payment}>
                          <ProDescriptions.Item dataIndex="id" title="Payment ID" copyable />
                          <ProDescriptions.Item dataIndex="phuongThuc" title="Phương thức" />
                          <ProDescriptions.Item
                            title="Trạng thái"
                            render={() => nhanTrangThaiThanhToan(payment.trangThai)}
                          />
                          <ProDescriptions.Item
                            title="Số tiền"
                            render={() => tien(payment.soTien)}
                          />
                          <ProDescriptions.Item
                            title="Tạo lúc"
                            render={() => dinhDangNgay(payment.createdAt as unknown as string)}
                          />
                          <ProDescriptions.Item
                            title="Giao dịch"
                            render={() =>
                              payment.giaoDich.length > 0
                                ? payment.giaoDich
                                    .map((tx) => `${tx.maGiaoDich} · ${tx.trangThai} · ${tien(tx.soTien)}`)
                                    .join('; ')
                                : 'Chưa có'
                            }
                          />
                        </ProDescriptions>
                        {payment.trangThai === 'PAID' ||
                        payment.trangThai === 'PARTIALLY_REFUNDED' ? (
                          <Button size="small" onClick={() => moHoanTien(payment)}>
                            Hoàn tiền
                          </Button>
                        ) : null}
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thanh toán" />
              )}
            </Card>

            <Card size="small" title="Vận chuyển (độc lập với trạng thái đơn)">
              {chiTiet.vanChuyen.length > 0 ? (
                <Collapse
                  items={chiTiet.vanChuyen.map((shipment) => ({
                    key: shipment.id,
                    label: (
                      <Space wrap>
                        <strong>{shipment.maVanDon}</strong>
                        {nhanTrangThaiVanChuyen(shipment.trangThai)}
                        <Typography.Text type="secondary">
                          {shipment.maDonNhaCungCap} · {shipment.tenNhaCungCap}
                        </Typography.Text>
                      </Space>
                    ),
                    children: (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Typography.Text type="secondary">
                          Tạo lúc {dinhDangNgay(shipment.createdAt as unknown as string)} · Cập
                          nhật {dinhDangNgay(shipment.updatedAt as unknown as string)}
                        </Typography.Text>

                        {!daHuy && (HANH_DONG_VAN_CHUYEN[shipment.trangThai]?.length ?? 0) > 0 ? (
                          <Space wrap>
                            {HANH_DONG_VAN_CHUYEN[shipment.trangThai]?.map((action) => {
                              const loadingKey = `${shipment.id}:${action.trangThai}`;
                              return (
                                <Button
                                  key={action.trangThai}
                                  size="small"
                                  type={action.primary ? 'primary' : 'default'}
                                  danger={action.danger}
                                  loading={dangCapNhatVanChuyen === loadingKey}
                                  disabled={
                                    dangCapNhatVanChuyen !== null &&
                                    dangCapNhatVanChuyen !== loadingKey
                                  }
                                  onClick={() =>
                                    capNhatVanChuyen(shipment.id, action.trangThai)
                                  }
                                >
                                  {action.nhan}
                                </Button>
                              );
                            })}
                          </Space>
                        ) : null}

                        {shipment.suKien.length > 0 ? (
                          <Timeline
                            items={shipment.suKien.map((event) => ({
                              children: (
                                <Space direction="vertical" size={0}>
                                  <Space wrap>
                                    {nhanTrangThaiVanChuyen(event.trangThai)}
                                    <Typography.Text>
                                      {event.moTa || event.trangThai}
                                    </Typography.Text>
                                  </Space>
                                  <Typography.Text type="secondary">
                                    {event.viTri ? `${event.viTri} · ` : ''}
                                    {dinhDangNgay(event.thoiGian as unknown as string)}
                                  </Typography.Text>
                                </Space>
                              ),
                            }))}
                          />
                        ) : (
                          <Typography.Text type="secondary">
                            Chưa có sự kiện theo dõi.
                          </Typography.Text>
                        )}
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có vận đơn cho đơn này"
                />
              )}
            </Card>

            <Card
              size="small"
              title="Yêu cầu hỗ trợ / khiếu nại liên quan"
              extra={
                <Button size="small" onClick={() => router.push('/khieu-nai')}>
                  Mở quản lý khiếu nại
                </Button>
              }
            >
              {chiTiet.khieuNaiLienQuan.length > 0 ? (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={chiTiet.khieuNaiLienQuan}
                  columns={[
                    { title: 'Lý do', dataIndex: 'lyDo' },
                    { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
                    {
                      title: 'Bằng chứng',
                      dataIndex: 'soBangChung',
                      align: 'center',
                      width: 100,
                    },
                    {
                      title: 'Tạo lúc',
                      dataIndex: 'createdAt',
                      width: 160,
                      render: (value: string) => dinhDangNgay(value),
                    },
                  ]}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có khiếu nại liên quan"
                />
              )}
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={hoanTienCho ? `Hoàn tiền · ${hoanTienCho.phuongThuc} · ${tien(hoanTienCho.soTien)}` : 'Hoàn tiền'}
        open={Boolean(hoanTienCho)}
        confirmLoading={dangHoanTien}
        okText="Xác nhận hoàn tiền"
        onOk={() => void thucHienHoanTien()}
        onCancel={() => setHoanTienCho(null)}
      >
        <Form form={formHoanTien} layout="vertical">
          <Form.Item
            name="soTien"
            label="Số tiền hoàn"
            rules={[
              { required: true, message: 'Nhập số tiền hoàn.' },
              {
                validator: (_, value: number) => {
                  if (typeof value !== 'number' || !(value > 0)) {
                    return Promise.reject(new Error('Số tiền phải lớn hơn 0.'));
                  }
                  if (hoanTienCho && value - hoanTienCho.soTien > 1e-9) {
                    return Promise.reject(
                      new Error('Số tiền hoàn không được vượt quá số tiền đã thanh toán.'),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="lyDo"
            label="Lý do"
            rules={[
              { required: true, message: 'Nhập lý do hoàn tiền.' },
              { min: 3, message: 'Lý do tối thiểu 3 ký tự.' },
              { max: 500, message: 'Lý do tối đa 500 ký tự.' },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Lý do hoàn tiền cho đơn hàng..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
