'use client';

import {
  AlertOutlined,
  EyeOutlined,
  FileImageOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
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
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChiTietKhieuNai } from '@/components/chi-tiet-khieu-nai';
import {
  LY_DO_KHIEU_NAI_ADMIN,
  layChiTietKhieuNaiAdmin,
  layDanhSachKhieuNaiAdmin,
  type KhieuNaiChiTietAdmin,
  type TomTatKhieuNaiAdmin,
} from '@/lib/api-khieu-nai';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const VALUE_ENUM = Object.fromEntries(
  LY_DO_KHIEU_NAI_ADMIN.map((item) => [item.value, { text: item.label }]),
);

function nhanLyDo(value: string): string {
  return LY_DO_KHIEU_NAI_ADMIN.find((item) => item.value === value)?.label ?? value;
}

function mauLyDo(value: string): string {
  if (value === 'HET_HAN') return 'red';
  if (value === 'CHAT_LUONG') return 'volcano';
  if (value === 'CHUNG_NHAN') return 'purple';
  if (value === 'HONG' || value === 'DAP') return 'orange';
  return 'blue';
}

type ThongKe = {
  tong: number;
  coBangChung: number;
  chuaCoBangChung: number;
  chatLuongHetHan: number;
};

async function layTatCaKhieuNai(): Promise<TomTatKhieuNaiAdmin[]> {
  const result: TomTatKhieuNaiAdmin[] = [];
  let trang = 1;
  const gioiHan = 100;

  while (true) {
    const page = await layDanhSachKhieuNaiAdmin({ trang, gioiHan });
    result.push(...page.items);

    if (result.length >= page.tong || page.items.length === 0) {
      return result;
    }
    trang += 1;
  }
}

export default function TrangKhieuNaiQuanTri() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('don_hang.xu_ly') ?? false;

  const [chiTiet, setChiTiet] = useState<KhieuNaiChiTietAdmin | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKe>({
    tong: 0,
    coBangChung: 0,
    chuaCoBangChung: 0,
    chatLuongHetHan: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coXem) return;

    setDangTaiThongKe(true);
    try {
      const all = await layTatCaKhieuNai();
      const coBangChung = all.filter((item) => item.soBangChung > 0).length;

      setThongKe({
        tong: all.length,
        coBangChung,
        chuaCoBangChung: all.length - coBangChung,
        chatLuongHetHan: all.filter(
          (item) => item.lyDo === 'CHAT_LUONG' || item.lyDo === 'HET_HAN',
        ).length,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê khiếu nại: ${error.message}`
          : 'Không tải đủ thống kê khiếu nại.',
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
      setChiTiet(await layChiTietKhieuNaiAdmin(id));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Không tải được chi tiết khiếu nại.',
      );
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const columns: ProColumns<TomTatKhieuNaiAdmin>[] = [
    {
      title: 'Lý do',
      dataIndex: 'lyDo',
      hideInTable: true,
      valueType: 'select',
      valueEnum: VALUE_ENUM,
      fieldProps: {
        allowClear: true,
        placeholder: 'Chọn lý do khiếu nại',
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
      copyable: true,
      search: false,
      width: 190,
      render: (_, row) => (
        <Typography.Text strong copyable>
          {row.maDonHang}
        </Typography.Text>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'tenSanPham',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Lý do',
      dataIndex: 'lyDo',
      search: false,
      width: 155,
      render: (_, row) => (
        <Tag color={mauLyDo(row.lyDo)}>{nhanLyDo(row.lyDo)}</Tag>
      ),
    },
    {
      title: 'Bằng chứng',
      dataIndex: 'soBangChung',
      search: false,
      align: 'center',
      width: 105,
      render: (_, row) =>
        row.soBangChung > 0 ? (
          <Tag color="green" icon={<FileImageOutlined />}>
            {row.soBangChung}
          </Tag>
        ) : (
          <Tag>0</Tag>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      search: false,
      width: 150,
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
          onClick={() => void moChiTiet(row.id)}
        />,
      ],
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Quản lý khiếu nại">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Quản lý khiếu nại">
        Bạn không có quyền xử lý đơn hàng/khiếu nại.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý khiếu nại"
      subTitle="Theo dõi khiếu nại theo đơn, sản phẩm, lô, vận chuyển và bằng chứng. Domain hiện tại là read-only."
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
                title: 'Tổng khiếu nại',
                value: thongKe.tong,
                icon: <AlertOutlined style={{ color: '#e55662' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Có bằng chứng',
                value: thongKe.coBangChung,
                icon: <FileImageOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Chưa có bằng chứng',
                value: thongKe.chuaCoBangChung,
                icon: <FileImageOutlined style={{ color: '#e7992e' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Chất lượng / hết hạn',
                value: thongKe.chatLuongHetHan,
                icon: <SafetyCertificateOutlined style={{ color: '#8c52cf' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<TomTatKhieuNaiAdmin>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            options={false}
            cardBordered={false}
            scroll={{ x: 900 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await layDanhSachKhieuNaiAdmin({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 20,
                lyDo:
                  typeof params.lyDo === 'string'
                    ? (params.lyDo as (typeof LY_DO_KHIEU_NAI_ADMIN)[number]['value'])
                    : undefined,
              });

              return {
                data: response.items,
                success: true,
                total: response.tong,
              };
            }}
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} khiếu nại`,
            }}
          />
        </ProCard>
      </Space>

      <ChiTietKhieuNai
        data={chiTiet}
        loading={dangTaiChiTiet}
        open={dangTaiChiTiet || Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      />
    </PageContainer>
  );
}
