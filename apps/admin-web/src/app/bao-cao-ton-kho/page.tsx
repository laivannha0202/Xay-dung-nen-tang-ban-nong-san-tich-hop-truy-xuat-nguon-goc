'use client';

import {
  ClockCircleOutlined,
  InboxOutlined,
  ReloadOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  apiLayBaoCaoHaoHut,
  apiLayBaoCaoHetHan,
  apiLayBaoCaoSapHetHan,
  apiLayBaoCaoTonKho,
} from '@/lib/api-bao-cao-ton-kho';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TonKho = Awaited<ReturnType<typeof apiLayBaoCaoTonKho>>['duLieu'][number];
type CanhBao = Awaited<ReturnType<typeof apiLayBaoCaoSapHetHan>>['duLieu'][number];
type HaoHut = Awaited<ReturnType<typeof apiLayBaoCaoHaoHut>>['duLieu'][number];

type ParamsBaoCao = {
  current?: number;
  pageSize?: number;
  timKiem?: unknown;
  loai?: unknown;
};

type TongQuan = {
  tonKho: number;
  sapHetHan: number;
  hetHan: number;
  haoHut: number;
};

function so(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 3,
  }).format(Number(value));
}

function commonParams(params: ParamsBaoCao) {
  return {
    trang: typeof params.current === 'number' ? params.current : 1,
    gioiHan: typeof params.pageSize === 'number' ? params.pageSize : 20,
    timKiem:
      typeof params.timKiem === 'string' && params.timKiem.trim()
        ? params.timKiem.trim()
        : undefined,
  };
}

function dinhDangHsd(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

const searchColumn: ProColumns<TonKho> = {
  title: 'Tìm kiếm',
  dataIndex: 'timKiem',
  hideInTable: true,
  fieldProps: {
    placeholder: 'Mã kho, mã lô, SKU hoặc tên sản phẩm',
  },
};

const stockColumns: ProColumns<TonKho>[] = [
  searchColumn,
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Kho',
    search: false,
    width: 175,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.kho.maKho}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.kho.ten}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Lô / HSD',
    search: false,
    width: 175,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.loSanPham.maLo}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {dinhDangHsd(row.loSanPham.ngayHetHan)}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    width: 230,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.bienThe.tenSanPham}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.bienThe.sku}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'On hand',
    dataIndex: 'onHand',
    search: false,
    align: 'right',
    width: 105,
    render: (_, row) => so(row.onHand),
  },
  {
    title: 'Reserved',
    dataIndex: 'reserved',
    search: false,
    align: 'right',
    width: 105,
    render: (_, row) => so(row.reserved),
  },
  {
    title: 'Blocked',
    dataIndex: 'blocked',
    search: false,
    align: 'right',
    width: 105,
    render: (_, row) => so(row.blocked),
  },
  {
    title: 'Available',
    dataIndex: 'available',
    search: false,
    align: 'right',
    width: 110,
    render: (_, row) => (
      <Tag color={Number(row.available) > 0 ? 'green' : 'red'}>
        {so(row.available)}
      </Tag>
    ),
  },
];

const expiryColumns: ProColumns<CanhBao>[] = [
  searchColumn as ProColumns<CanhBao>,
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Kho',
    search: false,
    width: 175,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.kho.maKho}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.kho.ten}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Lô',
    search: false,
    width: 160,
    render: (_, row) => row.loSanPham.maLo,
  },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    width: 230,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.bienThe.tenSanPham}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.bienThe.sku}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'HSD',
    search: false,
    width: 120,
    render: (_, row) => dinhDangHsd(row.loSanPham.ngayHetHan),
  },
  {
    title: 'Còn lại',
    dataIndex: 'soNgayConLai',
    search: false,
    width: 120,
    render: (_, row) => (
      <Tag color={row.soNgayConLai < 0 ? 'red' : 'orange'}>
        {row.soNgayConLai < 0
          ? `Quá ${Math.abs(row.soNgayConLai)} ngày`
          : `${row.soNgayConLai} ngày`}
      </Tag>
    ),
  },
  {
    title: 'On hand',
    dataIndex: 'onHand',
    search: false,
    align: 'right',
    width: 100,
    render: (_, row) => so(row.onHand),
  },
  {
    title: 'Available',
    dataIndex: 'available',
    search: false,
    align: 'right',
    width: 110,
    render: (_, row) => so(row.available),
  },
];

const wasteColumns: ProColumns<HaoHut>[] = [
  {
    title: 'Loại hao hụt',
    dataIndex: 'loai',
    valueType: 'select',
    hideInTable: true,
    valueEnum: {
      DAMAGE: { text: 'Hư hỏng' },
      EXPIRE: { text: 'Hết hạn' },
    },
    fieldProps: {
      placeholder: 'Tất cả loại hao hụt',
      allowClear: true,
    },
  },
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: {
      placeholder: 'Mã kho, mã lô, SKU hoặc tên sản phẩm',
    },
  },
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Loại',
    dataIndex: 'loai',
    search: false,
    width: 120,
    render: (_, row) => (
      <Tag color={row.loai === 'EXPIRE' ? 'red' : 'orange'}>
        {row.loai === 'EXPIRE' ? 'Hết hạn' : 'Hư hỏng'}
      </Tag>
    ),
  },
  {
    title: 'Kho',
    search: false,
    width: 175,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.kho.maKho}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.kho.ten}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Lô',
    search: false,
    width: 160,
    render: (_, row) => row.loSanPham.maLo,
  },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    width: 230,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.bienThe.tenSanPham}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.bienThe.sku}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Số lượng',
    dataIndex: 'soLuong',
    search: false,
    align: 'right',
    width: 110,
    render: (_, row) => so(row.soLuong),
  },
  {
    title: 'Ghi nhận lúc',
    dataIndex: 'createdAt',
    search: false,
    width: 165,
    render: (_, row) => new Date(row.createdAt).toLocaleString('vi-VN'),
  },
];

export default function TrangBaoCaoTonKho() {
  const router = useRouter();
  const { message } = App.useApp();
  const daTaiLanDau = useRef(false);
  const [phien] = useState(() => layPhienAdmin());
  const coXem = phien?.quyen.includes('kho.xem') ?? false;

  const [dangTai, setDangTai] = useState(false);
  const [tongQuan, setTongQuan] = useState<TongQuan>({
    tonKho: 0,
    sapHetHan: 0,
    hetHan: 0,
    haoHut: 0,
  });

  const taiTongQuan = useCallback(async () => {
    if (!coXem) return;

    setDangTai(true);
    try {
      const [ton, sapHetHan, hetHan, haoHut] = await Promise.all([
        apiLayBaoCaoTonKho({ trang: 1, gioiHan: 1 }),
        apiLayBaoCaoSapHetHan({ trang: 1, gioiHan: 1 }),
        apiLayBaoCaoHetHan({ trang: 1, gioiHan: 1 }),
        apiLayBaoCaoHaoHut({ trang: 1, gioiHan: 1 }),
      ]);

      setTongQuan({
        tonKho: ton.tong,
        sapHetHan: sapHetHan.tong,
        hetHan: hetHan.tong,
        haoHut: haoHut.tong,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê tồn kho: ${error.message}`
          : 'Không tải đủ thống kê tồn kho.',
      );
    } finally {
      setDangTai(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coXem || daTaiLanDau.current) return;

    daTaiLanDau.current = true;
    void taiTongQuan();
  }, [coXem, phien, router, taiTongQuan]);

  const pieData = useMemo(
    () =>
      [
        { loai: 'Sắp hết hạn', giaTri: tongQuan.sapHetHan },
        { loai: 'Đã hết hạn', giaTri: tongQuan.hetHan },
        { loai: 'Hao hụt', giaTri: tongQuan.haoHut },
      ].filter((item) => item.giaTri > 0),
    [tongQuan],
  );

  if (!phien) {
    return (
      <PageContainer title="Báo cáo tồn kho">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Báo cáo tồn kho">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền kho.xem để xem báo cáo tồn kho."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Báo cáo tồn kho"
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTai}
          onClick={() => void taiTongQuan()}
        >
          Làm mới thống kê
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Dòng tồn hiện tại',
                value: tongQuan.tonKho,
                icon: <InboxOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Sắp hết hạn',
                value: tongQuan.sapHetHan,
                icon: <ClockCircleOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Đã hết hạn',
                value: tongQuan.hetHan,
                icon: <StopOutlined style={{ color: '#e55662' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Giao dịch hao hụt',
                value: tongQuan.haoHut,
                icon: <WarningOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <Row gutter={[14, 14]}>
          <Col xs={24}>
            <ProCard
              bordered
              title="Cơ cấu cảnh báo"
              style={{ height: '100%' }}
            >
              {pieData.length ? (
                <Pie
                  data={pieData}
                  angleField="giaTri"
                  colorField="loai"
                  height={260}
                  innerRadius={0.58}
                  label={{ text: 'giaTri', position: 'outside' }}
                  legend={{ position: 'bottom' }}
                />
              ) : (
                <Space
                  style={{
                    width: '100%',
                    minHeight: 260,
                    justifyContent: 'center',
                  }}
                >
                  <Typography.Text type="secondary">
                    Hiện chưa có cảnh báo hoặc hao hụt.
                  </Typography.Text>
                </Space>
              )}
            </ProCard>
          </Col>
        </Row>

        <ProCard bordered>
          <Tabs
            items={[
              {
                key: 'stock',
                label: `Tồn hiện tại (${tongQuan.tonKho})`,
                children: (
                  <ProTable<TonKho>
                    rowKey="id"
                    columns={stockColumns}
                    cardBordered={false}
                    options={false}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    scroll={{ x: 1100 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const response = await apiLayBaoCaoTonKho(
                        commonParams(params),
                      );
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
              {
                key: 'near-expiry',
                label: `Sắp hết hạn (${tongQuan.sapHetHan})`,
                children: (
                  <ProTable<CanhBao>
                    rowKey="id"
                    columns={expiryColumns}
                    cardBordered={false}
                    options={false}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    scroll={{ x: 1050 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const response = await apiLayBaoCaoSapHetHan(
                        commonParams(params),
                      );
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
              {
                key: 'expired',
                label: `Đã hết hạn (${tongQuan.hetHan})`,
                children: (
                  <ProTable<CanhBao>
                    rowKey="id"
                    columns={expiryColumns}
                    cardBordered={false}
                    options={false}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    scroll={{ x: 1050 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const response = await apiLayBaoCaoHetHan(
                        commonParams(params),
                      );
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
              {
                key: 'waste',
                label: `Hao hụt (${tongQuan.haoHut})`,
                children: (
                  <ProTable<HaoHut>
                    rowKey="id"
                    columns={wasteColumns}
                    cardBordered={false}
                    options={false}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    scroll={{ x: 1100 }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const base = commonParams(params);
                      const response = await apiLayBaoCaoHaoHut({
                        ...base,
                        loai:
                          params.loai === 'DAMAGE' ||
                          params.loai === 'EXPIRE'
                            ? params.loai
                            : undefined,
                      });
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
            ]}
          />
        </ProCard>
      </Space>
    </PageContainer>
  );
}
