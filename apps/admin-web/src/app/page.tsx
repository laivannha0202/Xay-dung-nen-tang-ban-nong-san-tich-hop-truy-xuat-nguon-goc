'use client';

import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Alert, Button, Col, Progress, Row, Space, Spin, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { apiLayDashboard, type DashboardAdmin } from '@/lib/api-dashboard';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type MucBieuDo = {
  nhan: string;
  giaTri: number;
};

type ChiSoDashboard = {
  key: string;
  tieuDe: string;
  giaTri: string | number;
  donVi?: string;
};

function BieuDoKhoiLuong({ duLieu }: { duLieu: MucBieuDo[] }) {
  const lonNhat = Math.max(1, ...duLieu.map((item) => item.giaTri));

  return (
    <ProCard title="Biểu đồ 1 · Khối lượng nghiệp vụ" bordered>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {duLieu.map((item) => {
          const percent = Math.round((item.giaTri / lonNhat) * 100);
          return (
            <div key={item.nhan}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Typography.Text>{item.nhan}</Typography.Text>
                <Typography.Text strong>{item.giaTri.toLocaleString('vi-VN')}</Typography.Text>
              </Space>
              <Progress percent={percent} showInfo={false} />
            </div>
          );
        })}
      </Space>
    </ProCard>
  );
}

function BieuDoCanhBao({ data }: { data: DashboardAdmin['canhBaoTonKho'] }) {
  const tong = data.tong;
  const sapHetHanPercent = tong > 0 ? Math.round((data.sapHetHan / tong) * 100) : 0;
  const hetHanPercent = tong > 0 ? Math.round((data.hetHan / tong) * 100) : 0;

  return (
    <ProCard title="Biểu đồ 2 · Cơ cấu cảnh báo tồn kho" bordered>
      <Row gutter={[24, 24]} justify="center">
        <Col>
          <Space direction="vertical" align="center">
            <Progress
              type="dashboard"
              percent={sapHetHanPercent}
              format={() => data.sapHetHan.toLocaleString('vi-VN')}
            />
            <Typography.Text>Sắp hết hạn</Typography.Text>
          </Space>
        </Col>
        <Col>
          <Space direction="vertical" align="center">
            <Progress
              type="dashboard"
              percent={hetHanPercent}
              status={data.hetHan > 0 ? 'exception' : 'normal'}
              format={() => data.hetHan.toLocaleString('vi-VN')}
            />
            <Typography.Text>Đã hết hạn</Typography.Text>
          </Space>
        </Col>
      </Row>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0, textAlign: 'center' }}>
        Tổng {tong.toLocaleString('vi-VN')} cảnh báo theo ngưỡng System Settings hiện hành.
      </Typography.Paragraph>
    </ProCard>
  );
}

export default function TrangTongQuan() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;

    let active = true;
    setDangTai(true);

    void apiLayDashboard()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setLoi('');
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
  }, [coQuanLy, lanTai, router]);

  const khoiLuong = useMemo<MucBieuDo[]>(
    () =>
      dashboard
        ? [
            { nhan: 'Đơn hàng', giaTri: dashboard.donHang },
            { nhan: 'Khách hàng hoạt động', giaTri: dashboard.khachHang },
            { nhan: 'Sản phẩm hoạt động', giaTri: dashboard.sanPham },
            { nhan: 'Khiếu nại', giaTri: dashboard.khieuNai },
          ]
        : [],
    [dashboard],
  );

  if (!coQuanLy) {
    return (
      <PageContainer title="Tổng quan">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để xem Dashboard toàn hệ thống."
        />
      </PageContainer>
    );
  }

  const chiSo: ChiSoDashboard[] = dashboard
    ? [
        {
          key: 'revenue',
          tieuDe: 'Doanh thu ròng',
          giaTri: tien.format(dashboard.doanhThu),
        },
        {
          key: 'orders',
          tieuDe: 'Đơn hàng',
          giaTri: dashboard.donHang,
          donVi: 'đơn',
        },
        {
          key: 'customers',
          tieuDe: 'Khách hàng',
          giaTri: dashboard.khachHang,
          donVi: 'active',
        },
        {
          key: 'products',
          tieuDe: 'Sản phẩm',
          giaTri: dashboard.sanPham,
          donVi: 'active',
        },
        {
          key: 'inventory-alerts',
          tieuDe: 'Cảnh báo tồn kho',
          giaTri: dashboard.canhBaoTonKho.tong,
          donVi: 'cảnh báo',
        },
        {
          key: 'complaints',
          tieuDe: 'Khiếu nại',
          giaTri: dashboard.khieuNai,
          donVi: 'phiếu',
        },
      ]
    : [];

  return (
    <PageContainer
      title="Tổng quan"
      subTitle="PHIEN-088 · 6 KPI / 2 charts / alerts"
      tags={<Tag color="green">Dashboard</Tag>}
      extra={[
        <Button key="refresh" loading={dangTai} onClick={() => setLanTai((value) => value + 1)}>
          Làm mới
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {loi ? <Alert type="error" showIcon message={loi} /> : null}

        {!dashboard && dangTai ? (
          <ProCard>
            <Space style={{ width: '100%', justifyContent: 'center', padding: 32 }}>
              <Spin />
              <Typography.Text type="secondary">Đang tải Dashboard...</Typography.Text>
            </Space>
          </ProCard>
        ) : null}

        {dashboard ? (
          <>
            <Row gutter={[16, 16]}>
              {chiSo.map((item) => (
                <Col key={item.key} xs={24} sm={12} xl={8}>
                  <StatisticCard
                    statistic={{
                      title: item.tieuDe,
                      value: item.giaTri,
                      suffix: item.donVi,
                    }}
                  />
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={14}>
                <BieuDoKhoiLuong duLieu={khoiLuong} />
              </Col>
              <Col xs={24} xl={10}>
                <BieuDoCanhBao data={dashboard.canhBaoTonKho} />
              </Col>
            </Row>

            <ProCard title="Cảnh báo vận hành">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  type={dashboard.canhBaoTonKho.hetHan > 0 ? 'error' : 'success'}
                  showIcon
                  message={`${dashboard.canhBaoTonKho.hetHan} lô đã hết hạn còn tồn vật lý`}
                  description="Ưu tiên xử lý hàng đã hết hạn trước khi tiếp tục phân bổ/xuất kho."
                />
                <Alert
                  type={dashboard.canhBaoTonKho.sapHetHan > 0 ? 'warning' : 'success'}
                  showIcon
                  message={`${dashboard.canhBaoTonKho.sapHetHan} lô sắp hết hạn`}
                  description="Ngưỡng cảnh báo lấy từ System Settings, không hard-code ở Dashboard."
                />
                <Alert
                  type={dashboard.khieuNai > 0 ? 'info' : 'success'}
                  showIcon
                  message={`${dashboard.khieuNai} khiếu nại đã được ghi nhận`}
                  description="Complaint domain hiện chưa có lifecycle status nên Dashboard chỉ hiển thị tổng số."
                />
              </Space>
            </ProCard>

            <Typography.Text type="secondary">
              Cập nhật lúc {new Date(dashboard.capNhatLuc).toLocaleString('vi-VN')}. Doanh thu là
              successful payment gross trừ successful refunds theo semantic PHIEN-087.
            </Typography.Text>
          </>
        ) : null}
      </Space>
    </PageContainer>
  );
}
