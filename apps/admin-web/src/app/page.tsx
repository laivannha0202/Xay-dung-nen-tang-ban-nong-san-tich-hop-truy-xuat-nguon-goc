'use client';

import {
  AlertOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { apiLayDashboard, type DashboardAdmin } from '@/lib/api-dashboard';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export default function TrangTongQuan() {
  const router = useRouter();

  // QUAN TRỌNG:
  // layPhienAdmin() parse localStorage và trả object mới mỗi lần gọi.
  // Giữ session trong state ổn định để useEffect không fetch Dashboard vô hạn.
  const [phien] = useState(() => layPhienAdmin());
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;

    let active = true;
    setDangTai(true);
    setLoi('');

    void apiLayDashboard()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoi(error instanceof Error ? error.message : 'Không tải được Dashboard.');
      })
      .finally(() => {
        if (active) setDangTai(false);
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, lanTai, phien, router]);

  const pieData = useMemo(
    () =>
      dashboard
        ? [
            { loai: 'Sắp hết hạn', giaTri: dashboard.canhBaoTonKho.sapHetHan },
            { loai: 'Đã hết hạn', giaTri: dashboard.canhBaoTonKho.hetHan },
          ].filter((item) => item.giaTri > 0)
        : [],
    [dashboard],
  );

  if (!coQuanLy) {
    return (
      <PageContainer title="Tổng quan">
        <Alert type="warning" showIcon message="Bạn chưa có quyền xem Dashboard toàn hệ thống." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title={`Xin chào, ${phien?.nguoiDung.hoTen ?? 'Admin'}!`}
      subTitle="Chúc bạn một ngày làm việc hiệu quả. Dưới đây là tổng quan hoạt động của hệ thống AgriMarket."
      extra={[
        <Button key="date" icon={<CalendarOutlined />}>
          {new Date().toLocaleDateString('vi-VN')}
        </Button>,
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          loading={dangTai}
          onClick={() => setLanTai((value) => value + 1)}
        >
          Làm mới
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {loi ? (
          <Alert
            type="error"
            showIcon
            message="Không tải được dữ liệu Dashboard"
            description={`${loi} — API phải chạy tại http://127.0.0.1:3000.`}
            action={
              <Button size="small" onClick={() => setLanTai((value) => value + 1)}>
                Thử lại
              </Button>
            }
          />
        ) : null}

        {!dashboard && dangTai ? (
          <ProCard bordered>
            <Space style={{ width: '100%', minHeight: 180, justifyContent: 'center' }}>
              <Spin size="large" />
              <Typography.Text type="secondary">Đang tải Dashboard...</Typography.Text>
            </Space>
          </ProCard>
        ) : null}

        {dashboard ? (
          <>
            <Row gutter={[14, 14]}>
              <Col xs={24} sm={12} xl={6}>
                <StatisticCard
                  bordered
                  statistic={{
                    title: 'Tổng doanh thu',
                    value: tien.format(dashboard.doanhThu),
                    icon: <ShoppingCartOutlined style={{ color: '#087a4b' }} />,
                    description: (
                      <Typography.Text type="secondary">
                        Doanh thu ròng toàn hệ thống
                      </Typography.Text>
                    ),
                  }}
                  style={{ background: 'linear-gradient(110deg,#f1fff7,#fff)' }}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <StatisticCard
                  bordered
                  statistic={{
                    title: 'Tổng đơn hàng',
                    value: dashboard.donHang,
                    icon: <ShoppingCartOutlined style={{ color: '#3d8ddd' }} />,
                    description: (
                      <Typography.Text type="secondary">
                        Đơn hàng đã ghi nhận
                      </Typography.Text>
                    ),
                  }}
                  style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <StatisticCard
                  bordered
                  statistic={{
                    title: 'Khách hàng hoạt động',
                    value: dashboard.khachHang,
                    icon: <TeamOutlined style={{ color: '#e6922f' }} />,
                    description: (
                      <Typography.Text type="secondary">
                        Tài khoản khách đang hoạt động
                      </Typography.Text>
                    ),
                  }}
                  style={{ background: 'linear-gradient(110deg,#fff8ef,#fff)' }}
                />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <StatisticCard
                  bordered
                  statistic={{
                    title: 'Sản phẩm hoạt động',
                    value: dashboard.sanPham,
                    icon: <CheckCircleOutlined style={{ color: '#8c52cf' }} />,
                    description: (
                      <Typography.Text type="secondary">
                        Sản phẩm đang được kinh doanh
                      </Typography.Text>
                    ),
                  }}
                  style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
                />
              </Col>
            </Row>

            <Row gutter={[14, 14]}>
              <Col xs={24} xl={15}>
                <ProCard
                  bordered
                  title="Doanh thu 7 ngày gần nhất"
                  subTitle="Doanh thu gộp theo ngày UTC từ báo cáo đơn hàng có thanh toán thành công"
                  extra={<Tag color="green">Dữ liệu thật</Tag>}
                >
                  {dashboard.doanhThu7Ngay.length ? (
                    <Line
                      data={dashboard.doanhThu7Ngay}
                      xField="nhan"
                      yField="doanhThu"
                      height={300}
                      point={{ size: 5, shape: 'circle' }}
                      area={{ style: { fillOpacity: 0.12 } }}
                      style={{ lineWidth: 3 }}
                      axis={{
                        y: {
                          labelFormatter: (value: string | number) =>
                            Number(value).toLocaleString('vi-VN'),
                        },
                      }}
                      tooltip={{ title: 'nhan' }}
                    />
                  ) : (
                    <Space
                      direction="vertical"
                      align="center"
                      style={{ width: '100%', padding: 68 }}
                    >
                      <Typography.Text type="secondary">
                        Chưa có dữ liệu doanh thu 7 ngày hoặc tài khoản không có quyền xem báo cáo.
                      </Typography.Text>
                    </Space>
                  )}
                </ProCard>
              </Col>

              <Col xs={24} xl={9}>
                <ProCard
                  bordered
                  title="Cảnh báo tồn kho"
                  subTitle="Theo ngưỡng cấu hình hệ thống"
                >
                  {pieData.length ? (
                    <Pie
                      data={pieData}
                      angleField="giaTri"
                      colorField="loai"
                      innerRadius={0.62}
                      height={300}
                      label={{ text: 'loai', position: 'outside' }}
                      legend={{ color: { position: 'bottom' } }}
                      annotations={[
                        {
                          type: 'text',
                          style: {
                            text: `${dashboard.canhBaoTonKho.tong}\ncảnh báo`,
                            x: '50%',
                            y: '50%',
                            textAlign: 'center',
                            fontSize: 18,
                            fontWeight: 700,
                          },
                        },
                      ]}
                    />
                  ) : (
                    <Space
                      direction="vertical"
                      align="center"
                      style={{ width: '100%', padding: 68 }}
                    >
                      <CheckCircleOutlined style={{ fontSize: 42, color: '#16a365' }} />
                      <Typography.Text strong>
                        Không có cảnh báo tồn kho
                      </Typography.Text>
                    </Space>
                  )}
                </ProCard>
              </Col>
            </Row>

            <Row gutter={[14, 14]}>
              <Col xs={24} xl={15}>
                <ProCard bordered title="Cảnh báo vận hành">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Alert
                      type={dashboard.canhBaoTonKho.hetHan > 0 ? 'error' : 'success'}
                      showIcon
                      icon={
                        dashboard.canhBaoTonKho.hetHan > 0 ? (
                          <AlertOutlined />
                        ) : (
                          <CheckCircleOutlined />
                        )
                      }
                      message={`${dashboard.canhBaoTonKho.hetHan} lô đã hết hạn`}
                      description="Ưu tiên kiểm tra hàng đã hết hạn còn tồn vật lý."
                    />
                    <Alert
                      type={dashboard.canhBaoTonKho.sapHetHan > 0 ? 'warning' : 'success'}
                      showIcon
                      icon={
                        dashboard.canhBaoTonKho.sapHetHan > 0 ? (
                          <WarningOutlined />
                        ) : (
                          <CheckCircleOutlined />
                        )
                      }
                      message={`${dashboard.canhBaoTonKho.sapHetHan} lô sắp hết hạn`}
                      description="Kiểm tra kế hoạch xuất kho và điều phối FEFO."
                    />
                    <Alert
                      type={dashboard.khieuNai > 0 ? 'info' : 'success'}
                      showIcon
                      message={`${dashboard.khieuNai} khiếu nại đã ghi nhận`}
                      description="Theo dõi và xử lý theo quy trình chăm sóc khách hàng."
                    />
                  </Space>
                </ProCard>
              </Col>

              <Col xs={24} xl={9}>
                <ProCard bordered title="Thông tin hệ thống">
                  <Descriptions
                    column={1}
                    size="small"
                    items={[
                      {
                        key: 'api',
                        label: 'Trạng thái API',
                        children: <Tag color="success">Đã kết nối</Tag>,
                      },
                      {
                        key: 'role',
                        label: 'Vai trò',
                        children: 'Quản trị viên',
                      },
                      {
                        key: 'permissions',
                        label: 'Quyền đang có',
                        children: `${phien?.quyen.length ?? 0} quyền`,
                      },
                      {
                        key: 'updated',
                        label: 'Cập nhật cuối',
                        children: new Date(dashboard.capNhatLuc).toLocaleString('vi-VN'),
                      },
                    ]}
                  />
                </ProCard>
              </Col>
            </Row>
          </>
        ) : null}
      </Space>
    </PageContainer>
  );
}
