'use client';

import {
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
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
  Descriptions,
  Drawer,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  apiLayNhatKyKiemToan,
  type NhatKyKiemToanAdmin,
} from '@/lib/api-nhat-ky-kiem-toan';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type AuditSearchParams = {
  current?: number;
  pageSize?: number;
  tacNhan?: string;
  hanhDong?: string;
  thucThe?: string;
  ngay?: string[];
};

type TongQuan = {
  tong: number;
  tacNhanTrang: number;
  hanhDongTrang: number;
  thucTheTrang: number;
};

function jsonDep(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : '—';
}

function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;
}

function JsonPanel({ value }: { value: Record<string, unknown> | null }) {
  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: '#f7f9f8',
        border: '1px solid #edf0ee',
        borderRadius: 8,
        padding: 14,
        maxHeight: 460,
        overflow: 'auto',
      }}
    >
      {jsonDep(value)}
    </pre>
  );
}

export default function TrangNhatKyKiemToan() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXemAudit = phien?.quyen.includes('audit.xem') ?? false;

  const [chiTiet, setChiTiet] = useState<NhatKyKiemToanAdmin | null>(null);
  const [tongQuan, setTongQuan] = useState<TongQuan>({
    tong: 0,
    tacNhanTrang: 0,
    hanhDongTrang: 0,
    thucTheTrang: 0,
  });

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
    }
  }, [phien, router]);

  const columns: ProColumns<NhatKyKiemToanAdmin>[] = [
    {
      title: 'Tác nhân',
      dataIndex: 'tacNhan',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Email / actor...',
      },
    },
    {
      title: 'Hành động',
      dataIndex: 'hanhDong',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Ví dụ: inventory.adjust...',
      },
    },
    {
      title: 'Thực thể',
      dataIndex: 'thucThe',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Ví dụ: TonKhoLo...',
      },
    },
    {
      title: 'Khoảng ngày',
      dataIndex: 'ngay',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '#',
      width: 52,
      search: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      search: false,
      width: 165,
      render: (_, row) =>
        new Date(row.createdAt).toLocaleString('vi-VN'),
    },
    {
      title: 'Tác nhân',
      dataIndex: 'tacNhan',
      search: false,
      width: 220,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.tacNhan}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.tacNhanId ?? 'Không có actor ID'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'hanhDong',
      search: false,
      copyable: true,
      width: 220,
      render: (_, row) => (
        <Tag color="blue">
          {row.hanhDong}
        </Tag>
      ),
    },
    {
      title: 'Thực thể',
      dataIndex: 'thucThe',
      search: false,
      width: 180,
      render: (_, row) => <Tag>{row.thucThe}</Tag>,
    },
    {
      title: 'Entity ID',
      dataIndex: 'thucTheId',
      search: false,
      copyable: true,
      ellipsis: true,
      width: 220,
      render: (_, row) => row.thucTheId ?? '—',
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
          onClick={() => setChiTiet(row)}
        />,
      ],
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Nhật ký kiểm toán">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXemAudit) {
    return (
      <PageContainer title="Nhật ký kiểm toán">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền audit.xem để xem nhật ký kiểm toán."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Nhật ký kiểm toán"
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
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng sự kiện',
                value: tongQuan.tong,
                icon: <AuditOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tác nhân trên trang',
                value: tongQuan.tacNhanTrang,
                icon: <TeamOutlined style={{ color: '#378fe4' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Loại hành động trên trang',
                value: tongQuan.hanhDongTrang,
                icon: (
                  <SafetyCertificateOutlined style={{ color: '#e7992e' }} />
                ),
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Loại thực thể trên trang',
                value: tongQuan.thucTheTrang,
                icon: <AuditOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<NhatKyKiemToanAdmin, AuditSearchParams>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1250 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6, xxl: 6 },
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} sự kiện`,
            }}
            request={async (params) => {
              const dateRange = Array.isArray(params.ngay)
                ? params.ngay
                : undefined;

              const response = await apiLayNhatKyKiemToan({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                tacNhan: clean(params.tacNhan),
                hanhDong: clean(params.hanhDong),
                thucThe: clean(params.thucThe),
                tuNgay:
                  dateRange && typeof dateRange[0] === 'string'
                    ? `${dateRange[0]}T00:00:00.000Z`
                    : undefined,
                denNgay:
                  dateRange && typeof dateRange[1] === 'string'
                    ? `${dateRange[1]}T23:59:59.999Z`
                    : undefined,
              });

              setTongQuan({
                tong: response.tong,
                tacNhanTrang: new Set(
                  response.duLieu.map((item) => item.tacNhan),
                ).size,
                hanhDongTrang: new Set(
                  response.duLieu.map((item) => item.hanhDong),
                ).size,
                thucTheTrang: new Set(
                  response.duLieu.map((item) => item.thucThe),
                ).size,
              });

              return {
                data: response.duLieu,
                success: true,
                total: response.tong,
              };
            }}
          />
        </ProCard>
      </Space>

      <Drawer
        width={820}
        title={
          chiTiet
            ? `${chiTiet.hanhDong} · ${chiTiet.thucThe}`
            : 'Chi tiết Audit Log'
        }
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
        destroyOnHidden
      >
        {chiTiet ? (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                {
                  key: 'id',
                  label: 'Audit ID',
                  children: (
                    <Typography.Text copyable>{chiTiet.id}</Typography.Text>
                  ),
                },
                {
                  key: 'actor',
                  label: 'Tác nhân',
                  children: chiTiet.tacNhan,
                },
                {
                  key: 'actor-id',
                  label: 'Actor ID',
                  children: chiTiet.tacNhanId ?? '—',
                },
                {
                  key: 'action',
                  label: 'Hành động',
                  children: (
                    <Typography.Text code copyable>
                      {chiTiet.hanhDong}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'entity',
                  label: 'Thực thể',
                  children: (
                    <Typography.Text code>{chiTiet.thucThe}</Typography.Text>
                  ),
                },
                {
                  key: 'entity-id',
                  label: 'Entity ID',
                  children: chiTiet.thucTheId ?? '—',
                },
                {
                  key: 'time',
                  label: 'Thời gian',
                  children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
                },
              ]}
            />

            <Tabs
              items={[
                {
                  key: 'before',
                  label: 'Trước thay đổi',
                  children: <JsonPanel value={chiTiet.truoc} />,
                },
                {
                  key: 'after',
                  label: 'Sau thay đổi',
                  children: <JsonPanel value={chiTiet.sau} />,
                },
                {
                  key: 'metadata',
                  label: 'Metadata',
                  children: <JsonPanel value={chiTiet.metadata} />,
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
