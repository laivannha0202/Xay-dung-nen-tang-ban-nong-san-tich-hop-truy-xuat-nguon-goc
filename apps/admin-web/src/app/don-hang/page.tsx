'use client';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProDescriptions,
  ProTable,
  StatisticCard,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Col,
  Collapse,
  Drawer,
  Empty,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DongGoiDonHang } from '@/components/dong-goi-don-hang';
import {
  layChiTietDonHangAdmin,
  layDanhSachDonHangAdmin,
} from '@/lib/api-don-hang';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type DanhSach = Awaited<ReturnType<typeof layDanhSachDonHangAdmin>>;
type DonHang = DanhSach['duLieu'][number];
type ChiTiet = Awaited<ReturnType<typeof layChiTietDonHangAdmin>>;
type DonNhaCungCap = ChiTiet['donNhaCungCap'][number];
type Muc = DonNhaCungCap['muc'][number];

const TRANG_THAI = [
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

type TrangThaiDonHang = (typeof TRANG_THAI)[number];

const NHAN_TRANG_THAI: Record<
  TrangThaiDonHang,
  { text: string; color: string }
> = {
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

const VALUE_ENUM = Object.fromEntries(
  TRANG_THAI.map((state) => [
    state,
    { text: NHAN_TRANG_THAI[state].text },
  ]),
);

type ThongKeDonHang = {
  tong: number;
  canXuLy: number;
  dangGiao: number;
  hoanThanh: number;
};

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function nhanTrangThai(value: string) {
  const meta = NHAN_TRANG_THAI[value as TrangThaiDonHang];
  return meta ? (
    <Tag color={meta.color}>{meta.text}</Tag>
  ) : (
    <Tag>{value}</Tag>
  );
}

function nhanThanhToan(value: string | null | undefined) {
  if (!value) return <Tag>Chưa có</Tag>;

  const normalized = value.toUpperCase();
  if (
    normalized.includes('THANH_CONG') ||
    normalized.includes('DA_THANH_TOAN') ||
    normalized.includes('SUCCESS')
  ) {
    return <Tag color="green">Đã thanh toán</Tag>;
  }
  if (
    normalized.includes('THAT_BAI') ||
    normalized.includes('FAILED') ||
    normalized.includes('HUY')
  ) {
    return <Tag color="red">{value}</Tag>;
  }
  if (
    normalized.includes('CHO') ||
    normalized.includes('PENDING') ||
    normalized.includes('DANG')
  ) {
    return <Tag color="gold">{value}</Tag>;
  }
  return <Tag color="blue">{value}</Tag>;
}

async function demTrangThai(trangThai: TrangThaiDonHang): Promise<number> {
  const result = await layDanhSachDonHangAdmin({
    trang: 1,
    gioiHan: 1,
    trangThai,
  });
  return result.tong;
}

export default function TrangDonHangQuanTri() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('don_hang.xu_ly') ?? false;

  const [chiTiet, setChiTiet] = useState<ChiTiet | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKeDonHang>({
    tong: 0,
    canXuLy: 0,
    dangGiao: 0,
    hoanThanh: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const [
        all,
        choThanhToan,
        daXacNhan,
        dangChuanBi,
        daDongGoi,
        dangGiao,
        daGiao,
        hoanThanh,
      ] = await Promise.all([
        layDanhSachDonHangAdmin({ trang: 1, gioiHan: 1 }),
        demTrangThai('CHO_THANH_TOAN'),
        demTrangThai('DA_XAC_NHAN'),
        demTrangThai('DANG_CHUAN_BI'),
        demTrangThai('DA_DONG_GOI'),
        demTrangThai('DANG_GIAO'),
        demTrangThai('DA_GIAO'),
        demTrangThai('HOAN_THANH'),
      ]);

      setThongKe({
        tong: all.tong,
        canXuLy: choThanhToan + daXacNhan + dangChuanBi + daDongGoi,
        dangGiao,
        hoanThanh: daGiao + hoanThanh,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê đơn hàng: ${error.message}`
          : 'Không tải đủ thống kê đơn hàng.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiThongKe();
  }, [taiThongKe]);

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    try {
      setChiTiet(await layChiTietDonHangAdmin(id));
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không tải được chi tiết đơn hàng.',
      );
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const refreshAll = async () => {
    actionRef.current?.reload();
    await taiThongKe();
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
      valueEnum: VALUE_ENUM,
      fieldProps: {
        placeholder: 'Chọn trạng thái',
        allowClear: true,
      },
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Mã đơn',
      dataIndex: 'maDonHang',
      search: false,
      copyable: true,
      width: 155,
      render: (_, row) => (
        <Typography.Text strong copyable>
          {row.maDonHang}
        </Typography.Text>
      ),
    },
    {
      title: 'Khách hàng',
      search: false,
      width: 220,
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
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      search: false,
      width: 145,
      render: (_, row) => nhanTrangThai(row.trangThai),
    },
    {
      title: 'Thanh toán',
      search: false,
      width: 140,
      render: (_, row) => nhanThanhToan(row.trangThaiThanhToan),
    },
    {
      title: 'NCC / Mục',
      search: false,
      width: 100,
      align: 'center',
      render: (_, row) => `${row.soNhaCungCap} / ${row.soMuc}`,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'tongTien',
      search: false,
      align: 'right',
      width: 125,
      render: (_, row) => (
        <Typography.Text strong style={{ color: '#087a4b' }}>
          {tien(row.tongTien)}
        </Typography.Text>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      search: false,
      width: 118,
      render: (_, row) =>
        new Date(row.createdAt).toLocaleDateString('vi-VN'),
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
          onClick={() => void moChiTiet(row.id)}
        />,
      ],
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Quản lý đơn hàng">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý đơn hàng">
        Bạn không có quyền xử lý đơn hàng.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý đơn hàng"
      subTitle="Theo dõi trạng thái, thanh toán, đóng gói và chi tiết đơn hàng toàn hệ thống."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTaiThongKe}
          onClick={() => void refreshAll()}
        >
          Làm mới
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Tổng đơn hàng', value: thongKe.tong, icon: <ShoppingCartOutlined style={{ color: '#087a4b' }} /> }} style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Cần xử lý', value: thongKe.canXuLy, icon: <ClockCircleOutlined style={{ color: '#e7992e' }} /> }} style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Đang giao', value: thongKe.dangGiao, icon: <TruckOutlined style={{ color: '#378fe4' }} /> }} style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Đã giao / hoàn thành', value: thongKe.hoanThanh, icon: <CheckCircleOutlined style={{ color: '#16a365' }} /> }} style={{ background: 'linear-gradient(110deg,#f4fff7,#fff)' }} />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<DonHang>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1200 }}
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
                  typeof params.maDonHang === 'string'
                    ? params.maDonHang
                    : undefined,
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
      </Space>

      <Drawer
        title={chiTiet ? `Chi tiết · ${chiTiet.maDonHang}` : 'Chi tiết đơn hàng'}
        width={980}
        loading={dangTaiChiTiet}
        open={Boolean(chiTiet) || dangTaiChiTiet}
        onClose={() => setChiTiet(null)}
        destroyOnHidden
      >
        {chiTiet ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ProDescriptions<ChiTiet>
              title="Thông tin đơn hàng"
              bordered
              column={2}
              dataSource={chiTiet}
              columns={[
                { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true },
                { title: 'Trạng thái', dataIndex: 'trangThai', render: (_, row) => nhanTrangThai(row.trangThai) },
                { title: 'Tổng tiền', dataIndex: 'tongTien', render: (_, row) => tien(row.tongTien) },
                { title: 'Khách hàng', render: (_, row) => `${row.khachHang.hoTen} · ${row.khachHang.email}` },
                { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime' },
                { title: 'Cập nhật', dataIndex: 'updatedAt', valueType: 'dateTime' },
                { title: 'Reservation', render: (_, row) => row.datCho?.trangThai ?? 'Không có' },
              ]}
            />

            <Typography.Title level={5}>Thanh toán</Typography.Title>
            {chiTiet.thanhToan.length > 0 ? (
              <Collapse
                items={chiTiet.thanhToan.map((payment) => ({
                  key: payment.id,
                  label: (
                    <Space wrap>
                      <strong>{payment.phuongThuc}</strong>
                      {nhanThanhToan(payment.trangThai)}
                      <Typography.Text>{tien(payment.soTien)}</Typography.Text>
                    </Space>
                  ),
                  children: (
                    <ProDescriptions
                      column={2}
                      dataSource={payment}
                      columns={[
                        { title: 'Payment ID', dataIndex: 'id', copyable: true },
                        { title: 'Phương thức', dataIndex: 'phuongThuc' },
                        { title: 'Trạng thái', dataIndex: 'trangThai', render: () => nhanThanhToan(payment.trangThai) },
                        { title: 'Số tiền', dataIndex: 'soTien', render: () => tien(payment.soTien) },
                        {
                          title: 'Giao dịch',
                          render: () =>
                            payment.giaoDich.length > 0
                              ? payment.giaoDich.map((tx) => `${tx.maGiaoDich} · ${tx.trangThai}`).join(', ')
                              : 'Chưa có',
                        },
                      ]}
                    />
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thanh toán" />
            )}

            <Typography.Title level={5}>Đơn theo nhà cung cấp</Typography.Title>
            <Collapse
              items={chiTiet.donNhaCungCap.map((suborder) => ({
                key: suborder.id,
                label: (
                  <Space wrap>
                    <strong>{suborder.maDon}</strong>
                    <span>{suborder.tenNhaCungCap}</span>
                    {nhanTrangThai(suborder.trangThai)}
                    <Typography.Text strong>{tien(suborder.tamTinh)}</Typography.Text>
                  </Space>
                ),
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <DongGoiDonHang
                      donNhaCungCapId={suborder.id}
                      trangThai={suborder.trangThai}
                      onChanged={async () => {
                        actionRef.current?.reload();
                        await taiThongKe();
                        if (chiTiet) await moChiTiet(chiTiet.id);
                      }}
                    />
                    <ProDescriptions<DonNhaCungCap>
                      column={2}
                      dataSource={suborder}
                      columns={[
                        { title: 'Mã đơn NCC', dataIndex: 'maDon', copyable: true },
                        { title: 'Nhà cung cấp', dataIndex: 'tenNhaCungCap' },
                        { title: 'Trạng thái', dataIndex: 'trangThai', render: (_, row) => nhanTrangThai(row.trangThai) },
                        { title: 'Tạm tính', dataIndex: 'tamTinh', render: (_, row) => tien(row.tamTinh) },
                      ]}
                    />
                    <Table<Muc>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={suborder.muc}
                      columns={[
                        { title: 'Sản phẩm', dataIndex: 'tenSanPham' },
                        { title: 'SKU', dataIndex: 'sku' },
                        { title: 'SL', dataIndex: 'soLuong', align: 'right' },
                        { title: 'Đơn giá', dataIndex: 'donGia', align: 'right', render: (value: number) => tien(value) },
                        { title: 'Thành tiền', dataIndex: 'thanhTien', align: 'right', render: (value: number) => tien(value) },
                      ]}
                    />
                  </Space>
                ),
              }))}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
