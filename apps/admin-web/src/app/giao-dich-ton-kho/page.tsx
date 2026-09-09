'use client';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SwapOutlined,
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
  App,
  Button,
  Col,
  Descriptions,
  Drawer,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { layChiTiet, layDanhSach } from '@/lib/api-giao-dich-ton-kho';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type GiaoDich = Awaited<ReturnType<typeof layChiTiet>>;

const LOAI = [
  'HARVEST_IN',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ORDER_RESERVE',
  'ORDER_RELEASE',
  'ORDER_SHIP',
  'RETURN_IN',
  'DAMAGE',
  'EXPIRE',
  'ADJUSTMENT',
] as const;

type LoaiGiaoDich = (typeof LOAI)[number];

const NHAN: Record<LoaiGiaoDich, { text: string; color: string }> = {
  HARVEST_IN: { text: 'Nhập từ thu hoạch', color: 'green' },
  TRANSFER_IN: { text: 'Nhập chuyển kho', color: 'cyan' },
  TRANSFER_OUT: { text: 'Xuất chuyển kho', color: 'blue' },
  ORDER_RESERVE: { text: 'Giữ chỗ đơn hàng', color: 'gold' },
  ORDER_RELEASE: { text: 'Nhả giữ chỗ', color: 'lime' },
  ORDER_SHIP: { text: 'Xuất giao hàng', color: 'geekblue' },
  RETURN_IN: { text: 'Nhập hàng trả', color: 'purple' },
  DAMAGE: { text: 'Hư hỏng', color: 'volcano' },
  EXPIRE: { text: 'Hết hạn', color: 'red' },
  ADJUSTMENT: { text: 'Điều chỉnh', color: 'magenta' },
};

const VALUE_ENUM = Object.fromEntries(
  LOAI.map((value) => [value, { text: NHAN[value].text }]),
);

type ThongKe = {
  tong: number;
  nhap: number;
  xuat: number;
  dieuChinh: number;
};

async function layTatCa(): Promise<GiaoDich[]> {
  const result: GiaoDich[] = [];
  let trang = 1;
  const gioiHan = 100;

  while (true) {
    const page = await layDanhSach({ trang, gioiHan });
    result.push(...page.duLieu);

    if (result.length >= page.tong || page.duLieu.length === 0) {
      return result;
    }

    trang += 1;
  }
}

export default function TrangGiaoDichTonKho() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('kho.xem') ?? false;

  const [chiTiet, setChiTiet] = useState<GiaoDich | null>(null);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKe>({
    tong: 0,
    nhap: 0,
    xuat: 0,
    dieuChinh: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const all = await layTatCa();
      setThongKe({
        tong: all.length,
        nhap: all.filter((item) =>
          ['HARVEST_IN', 'TRANSFER_IN', 'RETURN_IN'].includes(item.loai),
        ).length,
        xuat: all.filter((item) =>
          ['TRANSFER_OUT', 'ORDER_SHIP', 'DAMAGE', 'EXPIRE'].includes(item.loai),
        ).length,
        dieuChinh: all.filter((item) =>
          ['ORDER_RESERVE', 'ORDER_RELEASE', 'ADJUSTMENT'].includes(item.loai),
        ).length,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê ledger: ${error.message}`
          : 'Không tải đủ thống kê ledger.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    void taiThongKe();
  }, [taiThongKe]);

  const columns: ProColumns<GiaoDich>[] = [
    {
      title: 'Loại giao dịch',
      dataIndex: 'loai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: VALUE_ENUM,
      fieldProps: {
        allowClear: true,
        placeholder: 'Chọn loại giao dịch',
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
      width: 165,
      render: (_, row) => {
        const meta = NHAN[row.loai as LoaiGiaoDich];
        return <Tag color={meta?.color}>{meta?.text ?? row.loai}</Tag>;
      },
    },
    {
      title: 'Kho',
      search: false,
      width: 165,
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
      width: 140,
      render: (_, row) => row.loSanPham.maLo,
    },
    {
      title: 'SKU / Sản phẩm',
      search: false,
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.bienThe.sku}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.bienThe.tenSanPham}
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
      render: (_, row) =>
        new Intl.NumberFormat('vi-VN', {
          maximumFractionDigits: 3,
        }).format(Number(row.soLuong)),
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      search: false,
      width: 165,
      render: (_, row) => new Date(row.createdAt).toLocaleString('vi-VN'),
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
          onClick={async () => setChiTiet(await layChiTiet(row.id))}
        />,
      ],
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Ledger tồn kho">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Ledger tồn kho">
        Bạn không có quyền xem ledger tồn kho.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Ledger tồn kho"
      subTitle="Sổ giao dịch tồn kho bất biến/read-only; mọi điều chỉnh được ghi bằng transaction mới."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTaiThongKe}
          onClick={async () => {
            actionRef.current?.reload();
            await taiThongKe();
          }}
        >
          Làm mới
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng giao dịch',
                value: thongKe.tong,
                icon: <HistoryOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Giao dịch nhập',
                value: thongKe.nhap,
                icon: <ArrowDownOutlined style={{ color: '#378fe4' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Giao dịch xuất',
                value: thongKe.xuat,
                icon: <ArrowUpOutlined style={{ color: '#e55662' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Giữ chỗ / điều chỉnh',
                value: thongKe.dieuChinh,
                icon: <SwapOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<GiaoDich>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1080 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await layDanhSach({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                loai:
                  typeof params.loai === 'string'
                    ? (params.loai as GiaoDich['loai'])
                    : undefined,
              });

              return {
                data: response.duLieu,
                success: true,
                total: response.tong,
              };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} giao dịch`,
            }}
          />
        </ProCard>
      </Space>

      <Drawer
        title="Chi tiết giao dịch tồn kho"
        width={680}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'id',
                label: 'Transaction ID',
                children: (
                  <Typography.Text copyable>{chiTiet.id}</Typography.Text>
                ),
              },
              {
                key: 'type',
                label: 'Loại',
                children: (
                  <Tag color={NHAN[chiTiet.loai as LoaiGiaoDich]?.color}>
                    {NHAN[chiTiet.loai as LoaiGiaoDich]?.text ?? chiTiet.loai}
                  </Tag>
                ),
              },
              {
                key: 'qty',
                label: 'Số lượng',
                children: chiTiet.soLuong,
              },
              {
                key: 'warehouse',
                label: 'Kho',
                children: `${chiTiet.kho.maKho} — ${chiTiet.kho.ten}`,
              },
              {
                key: 'lot',
                label: 'Lô',
                children: chiTiet.loSanPham.maLo,
              },
              {
                key: 'product',
                label: 'SKU / Sản phẩm',
                children: `${chiTiet.bienThe.sku} — ${chiTiet.bienThe.tenSanPham}`,
              },
              {
                key: 'time',
                label: 'Tạo lúc',
                children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
