'use client';

import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  OrderedListOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { apiLayBaoCaoDonHangDoanhThu } from '@/lib/api-bao-cao-don-hang-doanh-thu';
import { layDanhSach as layDanhSachDanhMucSanPham } from '@/lib/api-danh-muc-san-pham';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';
import { layDanhSach as layDanhSachTrangTrai } from '@/lib/api-trang-trai';

type BaoCao = Awaited<ReturnType<typeof apiLayBaoCaoDonHangDoanhThu>>;
type DongBaoCao = BaoCao['duLieu'][number];
type LuaChon = { label: string; value: string };
type TongQuan = Pick<
  BaoCao,
  'tongDonHang' | 'tongMuc' | 'tongSoLuong' | 'doanhThuGop'
>;

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const TRANG_THAI_DON: Record<string, { text: string; color: string }> = {
  CHO_THANH_TOAN: { text: 'Chờ thanh toán', color: 'gold' },
  DA_XAC_NHAN: { text: 'Đã xác nhận', color: 'blue' },
  DANG_CHUAN_BI: { text: 'Đang chuẩn bị', color: 'processing' },
  DA_DONG_GOI: { text: 'Đã đóng gói', color: 'cyan' },
  DANG_GIAO: { text: 'Đang giao', color: 'geekblue' },
  DA_GIAO: { text: 'Đã giao', color: 'green' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'success' },
  DA_HUY: { text: 'Đã hủy', color: 'default' },
  KHIEU_NAI: { text: 'Khiếu nại', color: 'volcano' },
  HOAN_TIEN_MOT_PHAN: { text: 'Hoàn tiền một phần', color: 'purple' },
  HOAN_TIEN_TOAN_BO: { text: 'Hoàn tiền toàn bộ', color: 'magenta' },
};

function chuoi(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function tagTrangThai(value: string) {
  const meta = TRANG_THAI_DON[value];
  return <Tag color={meta?.color}>{meta?.text ?? value}</Tag>;
}

export default function TrangBaoCaoDonHangDoanhThu() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const daTaiBoLoc = useRef(false);
  const [phien] = useState(() => layPhienAdmin());

  const coQuanLy = phien?.quyen.includes('phan_quyen.quan_ly') ?? false;

  const [trangTraiOptions, setTrangTraiOptions] = useState<LuaChon[]>([]);
  const [danhMucOptions, setDanhMucOptions] = useState<LuaChon[]>([]);
  const [loiBoLoc, setLoiBoLoc] = useState('');
  const [dangTaiBoLoc, setDangTaiBoLoc] = useState(false);
  const [tongQuan, setTongQuan] = useState<TongQuan>({
    tongDonHang: 0,
    tongMuc: 0,
    tongSoLuong: 0,
    doanhThuGop: 0,
  });

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy || daTaiBoLoc.current) return;

    daTaiBoLoc.current = true;
    let active = true;
    setDangTaiBoLoc(true);

    void Promise.all([
      layDanhSachTrangTrai({ trang: 1, gioiHan: 100 }),
      layDanhSachDanhMucSanPham({ trang: 1, gioiHan: 100 }),
    ])
      .then(([trangTrai, danhMuc]) => {
        if (!active) return;
        setTrangTraiOptions(
          trangTrai.duLieu.map((item) => ({
            label: `${item.ma} · ${item.ten}`,
            value: item.id,
          })),
        );
        setDanhMucOptions(
          danhMuc.duLieu.map((item) => ({
            label: item.ten,
            value: item.id,
          })),
        );
        setLoiBoLoc('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoiBoLoc(
          error instanceof Error
            ? error.message
            : 'Không tải được danh sách bộ lọc.',
        );
      })
      .finally(() => {
        if (active) setDangTaiBoLoc(false);
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, phien, router]);

  const columns: ProColumns<DongBaoCao>[] = [
    {
      title: 'Từ ngày',
      dataIndex: 'tuNgay',
      valueType: 'date',
      hideInTable: true,
      fieldProps: { placeholder: 'Chọn ngày bắt đầu' },
    },
    {
      title: 'Đến ngày',
      dataIndex: 'denNgay',
      valueType: 'date',
      hideInTable: true,
      fieldProps: { placeholder: 'Chọn ngày kết thúc' },
    },
    {
      title: 'Trang trại',
      dataIndex: 'trangTraiId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        options: trangTraiOptions,
        showSearch: true,
        allowClear: true,
        loading: dangTaiBoLoc,
        optionFilterProp: 'label',
        placeholder: 'Tất cả trang trại',
      },
    },
    {
      title: 'Danh mục',
      dataIndex: 'danhMucSanPhamId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        options: danhMucOptions,
        showSearch: true,
        allowClear: true,
        loading: dangTaiBoLoc,
        optionFilterProp: 'label',
        placeholder: 'Tất cả danh mục',
      },
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Đơn hàng',
      search: false,
      width: 185,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong copyable>
            {row.maDonHang}
          </Typography.Text>
          {tagTrangThai(row.trangThaiDonHang)}
        </Space>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'ngayDatHang',
      search: false,
      width: 145,
      render: (_, row) =>
        new Date(row.ngayDatHang).toLocaleString('vi-VN'),
    },
    {
      title: 'Nhà cung cấp',
      search: false,
      width: 190,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.nhaCungCap.ten}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.nhaCungCap.ma}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trang trại',
      search: false,
      width: 190,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.tenTrangTrai}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.maTrangTrai}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      search: false,
      width: 150,
      render: (_, row) =>
        row.tenDanhMucSanPham ?? row.danhMucSanPhamId,
    },
    {
      title: 'Sản phẩm / SKU',
      search: false,
      width: 210,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.tenSanPham}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.sku}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'SL',
      dataIndex: 'soLuong',
      search: false,
      align: 'right',
      width: 70,
    },
    {
      title: 'Đơn giá',
      dataIndex: 'donGia',
      search: false,
      align: 'right',
      width: 125,
      render: (_, row) => tien.format(row.donGia),
    },
    {
      title: 'Doanh thu gộp',
      dataIndex: 'doanhThuGop',
      search: false,
      align: 'right',
      width: 145,
      render: (_, row) => (
        <Typography.Text strong style={{ color: '#087a4b' }}>
          {tien.format(row.doanhThuGop)}
        </Typography.Text>
      ),
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Báo cáo đơn hàng & doanh thu">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Báo cáo đơn hàng & doanh thu">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để xem báo cáo doanh thu toàn hệ thống."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Báo cáo đơn hàng & doanh thu"
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
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {loiBoLoc ? (
          <Alert
            type="warning"
            showIcon
            message="Không tải đủ bộ lọc"
            description={loiBoLoc}
          />
        ) : null}

        <Alert
          type="info"
          showIcon
          message="Ngữ nghĩa số liệu"
          description="Doanh thu gộp = tổng tiền hàng các dòng đơn thuộc đơn có thanh toán thành công (PAID/PARTIALLY_REFUNDED/REFUNDED); chưa trừ hoàn tiền ở tầng thanh toán. Đơn hàng = số parent order phân biệt; Dòng sản phẩm = số order item. Ngày lọc theo UTC."
        />

        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Đơn hàng',
                value: tongQuan.tongDonHang,
                icon: <OrderedListOutlined style={{ color: '#087a4b' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Dòng sản phẩm',
                value: tongQuan.tongMuc,
                icon: <AppstoreOutlined style={{ color: '#378fe4' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng số lượng',
                value: tongQuan.tongSoLuong,
                icon: <CalendarOutlined style={{ color: '#e7992e' }} />,
              }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Doanh thu gộp',
                value: tien.format(tongQuan.doanhThuGop),
                icon: <DollarOutlined style={{ color: '#8c52cf' }} />,
              }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<DongBaoCao>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1650 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Lọc báo cáo',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6, xxl: 6 },
            }}
            request={async (params) => {
              const response = await apiLayBaoCaoDonHangDoanhThu({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                tuNgay: chuoi(params.tuNgay),
                denNgay: chuoi(params.denNgay),
                trangTraiId: chuoi(params.trangTraiId),
                danhMucSanPhamId: chuoi(params.danhMucSanPhamId),
              });

              setTongQuan({
                tongDonHang: response.tongDonHang,
                tongMuc: response.tongMuc,
                tongSoLuong: response.tongSoLuong,
                doanhThuGop: response.doanhThuGop,
              });

              return {
                data: response.duLieu,
                success: true,
                total: response.tongMuc,
              };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} dòng sản phẩm`,
            }}
          />
        </ProCard>
      </Space>
    </PageContainer>
  );
}
