'use client';

import {
  CheckCircleOutlined,
  EyeOutlined,
  LockOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserDeleteOutlined,
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

import { ChiTietKhachHang } from '@/components/chi-tiet-khach-hang';
import {
  khoaKhachHangAdmin,
  layChiTietKhachHangAdmin,
  layDanhSachKhachHangAdmin,
  layDonHangKhachHangAdmin,
  layKhieuNaiKhachHangAdmin,
  moKhoaKhachHangAdmin,
  type DonHangKhachHangAdmin,
  type KhachHangAdmin,
  type KhieuNaiKhachHangAdmin,
  type TrangThaiKhachHangAdmin,
} from '@/lib/api-khach-hang';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const TRANG_THAI = {
  HOAT_DONG: { text: 'Hoạt động' },
  TAM_KHOA: { text: 'Tạm khóa' },
  CHUA_KICH_HOAT: { text: 'Chưa kích hoạt' },
};

type ThongKeKhachHang = {
  tong: number;
  hoatDong: number;
  tamKhoa: number;
  chuaKichHoat: number;
};

export default function TrangKhachHangQuanTri() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [phien] = useState(() => layPhienAdmin());

  const coQuanLy = phien?.quyen.includes('phan_quyen.quan_ly') ?? false;

  const [chiTiet, setChiTiet] = useState<KhachHangAdmin | null>(null);
  const [donHang, setDonHang] = useState<DonHangKhachHangAdmin[]>([]);
  const [khieuNai, setKhieuNai] = useState<KhieuNaiKhachHangAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [thongKe, setThongKe] = useState<ThongKeKhachHang>({
    tong: 0,
    hoatDong: 0,
    tamKhoa: 0,
    chuaKichHoat: 0,
  });

  useEffect(() => {
    if (!phien) router.replace('/dang-nhap');
  }, [phien, router]);

  const taiThongKe = useCallback(async () => {
    if (!coQuanLy) return;

    setDangTaiThongKe(true);
    try {
      const [all, active, locked, inactive] = await Promise.all([
        layDanhSachKhachHangAdmin({ trang: 1, gioiHan: 1 }),
        layDanhSachKhachHangAdmin({
          trang: 1,
          gioiHan: 1,
          trangThai: 'HOAT_DONG',
        }),
        layDanhSachKhachHangAdmin({
          trang: 1,
          gioiHan: 1,
          trangThai: 'TAM_KHOA',
        }),
        layDanhSachKhachHangAdmin({
          trang: 1,
          gioiHan: 1,
          trangThai: 'CHUA_KICH_HOAT',
        }),
      ]);

      setThongKe({
        tong: all.tong,
        hoatDong: active.tong,
        tamKhoa: locked.tong,
        chuaKichHoat: inactive.tong,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê khách hàng: ${error.message}`
          : 'Không tải đủ thống kê khách hàng.',
      );
    } finally {
      setDangTaiThongKe(false);
    }
  }, [coQuanLy, message]);

  useEffect(() => {
    void taiThongKe();
  }, [taiThongKe]);

  const moChiTiet = async (id: string) => {
    setLoading(true);
    try {
      const [detail, orders, complaints] = await Promise.all([
        layChiTietKhachHangAdmin(id),
        layDonHangKhachHangAdmin(id),
        layKhieuNaiKhachHangAdmin(id),
      ]);
      setChiTiet(detail);
      setDonHang(orders.items);
      setKhieuNai(complaints.items);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Không tải được chi tiết khách hàng.',
      );
    } finally {
      setLoading(false);
    }
  };

  const doiTrangThai = (row: KhachHangAdmin) => {
    const dangKhoa = row.trangThai === 'TAM_KHOA';

    modal.confirm({
      title: dangKhoa ? 'Mở khóa khách hàng?' : 'Khóa khách hàng?',
      content: dangKhoa
        ? 'Khách hàng có thể đăng nhập và sử dụng tài khoản trở lại.'
        : 'Các refresh session đang hoạt động của khách hàng sẽ bị thu hồi.',
      okText: dangKhoa ? 'Mở khóa' : 'Khóa tài khoản',
      cancelText: 'Hủy',
      okButtonProps: { danger: !dangKhoa },
      async onOk() {
        if (dangKhoa) {
          await moKhoaKhachHangAdmin(row.id);
        } else {
          await khoaKhachHangAdmin(row.id);
        }

        message.success(
          dangKhoa
            ? 'Đã mở khóa khách hàng.'
            : 'Đã khóa khách hàng.',
        );
        actionRef.current?.reload();
        await taiThongKe();

        if (chiTiet?.id === row.id) {
          await moChiTiet(row.id);
        }
      },
    });
  };

  const columns: ProColumns<KhachHangAdmin>[] = [
    {
      title: 'Khách hàng',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm tên, email hoặc số điện thoại...',
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      hideInTable: true,
      valueType: 'select',
      valueEnum: TRANG_THAI,
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
      title: 'Khách hàng',
      search: false,
      width: 230,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.hoTen}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.email}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'soDienThoai',
      search: false,
      width: 130,
      render: (_, row) => row.soDienThoai ?? '—',
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'tongDonHang',
      align: 'right',
      search: false,
      width: 95,
      render: (_, row) => (
        <Typography.Text strong>{row.tongDonHang}</Typography.Text>
      ),
    },
    {
      title: 'Khiếu nại',
      dataIndex: 'tongKhieuNai',
      align: 'right',
      search: false,
      width: 95,
      render: (_, row) =>
        row.tongKhieuNai > 0 ? (
          <Tag color="volcano">{row.tongKhieuNai}</Tag>
        ) : (
          '0'
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      search: false,
      width: 130,
      render: (_, row) =>
        row.trangThai === 'HOAT_DONG' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : row.trangThai === 'TAM_KHOA' ? (
          <Tag color="red">Tạm khóa</Tag>
        ) : (
          <Tag>Chưa kích hoạt</Tag>
        ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      search: false,
      width: 120,
      render: (_, row) =>
        new Date(row.createdAt).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 118,
      fixed: 'right',
      render: (_, row) => [
        <Button
          key="detail"
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => void moChiTiet(row.id)}
        />,
        <Button
          key="lock"
          type="text"
          size="small"
          danger={row.trangThai !== 'TAM_KHOA'}
          icon={
            row.trangThai === 'TAM_KHOA' ? (
              <UnlockOutlined />
            ) : (
              <LockOutlined />
            )
          }
          onClick={() => doiTrangThai(row)}
        />,
      ],
    },
  ];

  if (!phien) {
    return (
      <PageContainer title="Quản lý khách hàng">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Quản lý khách hàng">
        Bạn không có quyền quản lý khách hàng.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Quản lý khách hàng"
      subTitle="Theo dõi tài khoản, đơn hàng, khiếu nại và trạng thái truy cập của khách hàng."
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
            <StatisticCard bordered statistic={{ title: 'Tổng khách hàng', value: thongKe.tong, icon: <TeamOutlined style={{ color: '#087a4b' }} /> }} style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Đang hoạt động', value: thongKe.hoatDong, icon: <CheckCircleOutlined style={{ color: '#378fe4' }} /> }} style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Tạm khóa', value: thongKe.tamKhoa, icon: <UserDeleteOutlined style={{ color: '#e55662' }} /> }} style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard bordered statistic={{ title: 'Chưa kích hoạt', value: thongKe.chuaKichHoat, icon: <ShoppingOutlined style={{ color: '#e7992e' }} /> }} style={{ background: 'linear-gradient(110deg,#fff9f0,#fff)' }} />
          </Col>
        </Row>

        <ProCard bordered bodyStyle={{ padding: 0 }}>
          <ProTable<KhachHangAdmin>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            cardBordered={false}
            options={false}
            scroll={{ x: 1000 }}
            search={{
              labelWidth: 'auto',
              defaultCollapsed: false,
              collapseRender: false,
              searchText: 'Tìm kiếm',
              resetText: 'Đặt lại',
              span: { xs: 24, sm: 12, md: 12, lg: 8, xl: 8, xxl: 8 },
            }}
            request={async (params) => {
              const response = await layDanhSachKhachHangAdmin({
                trang: params.current ?? 1,
                gioiHan: params.pageSize ?? 10,
                timKiem:
                  typeof params.timKiem === 'string'
                    ? params.timKiem
                    : undefined,
                trangThai:
                  typeof params.trangThai === 'string'
                    ? (params.trangThai as TrangThaiKhachHangAdmin)
                    : undefined,
              });

              return { data: response.items, success: true, total: response.tong };
            }}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} khách hàng`,
            }}
          />
        </ProCard>
      </Space>

      <ChiTietKhachHang
        open={loading || Boolean(chiTiet)}
        loading={loading}
        data={chiTiet}
        donHang={donHang}
        khieuNai={khieuNai}
        onClose={() => {
          setChiTiet(null);
          setDonHang([]);
          setKhieuNai([]);
        }}
        onDoiTrangThai={() => {
          if (chiTiet) doiTrangThai(chiTiet);
        }}
      />
    </PageContainer>
  );
}
