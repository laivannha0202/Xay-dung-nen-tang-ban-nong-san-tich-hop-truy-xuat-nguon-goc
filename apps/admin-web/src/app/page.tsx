'use client';

import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Col, Row, Space, Tag, Typography } from 'antd';

const chiSo = [
  { tieuDe: 'Đơn hàng hôm nay', giaTri: 0, donVi: 'đơn' },
  { tieuDe: 'Lô đang theo dõi', giaTri: 0, donVi: 'lô' },
  { tieuDe: 'Sản phẩm hoạt động', giaTri: 0, donVi: 'sản phẩm' },
  { tieuDe: 'Cảnh báo tồn kho', giaTri: 0, donVi: 'cảnh báo' },
];

export default function TrangTongQuan() {
  return (
    <PageContainer
      title="Tổng quan"
      subTitle="Admin Web foundation"
      tags={<Tag color="green">Sẵn sàng</Tag>}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ProCard>
          <Typography.Title level={4}>Trung tâm vận hành AgriMarket</Typography.Title>
          <Typography.Paragraph type="secondary">
            Dashboard hiện là placeholder. Dữ liệu thật sẽ được tích hợp qua generated API client ở
            các phiên tiếp theo.
          </Typography.Paragraph>
        </ProCard>

        <Row gutter={[16, 16]}>
          {chiSo.map((item) => (
            <Col key={item.tieuDe} xs={24} sm={12} xl={6}>
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
      </Space>
    </PageContainer>
  );
}
