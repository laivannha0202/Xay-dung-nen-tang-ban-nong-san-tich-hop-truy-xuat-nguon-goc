'use client';

import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';

export default function TrangDangNhap() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Title level={2}>AgriMarket Admin</Typography.Title>
            <Typography.Text type="secondary">Đăng nhập quản trị</Typography.Text>
          </div>

          <Alert
            type="info"
            showIcon
            message="Placeholder PHIEN-008"
            description="Auth/RBAC thật sẽ được triển khai ở phiên Backend tương ứng."
          />

          <Form layout="vertical" disabled>
            <Form.Item label="Email">
              <Input placeholder="admin@agrimarket.local" />
            </Form.Item>
            <Form.Item label="Mật khẩu">
              <Input.Password placeholder="••••••••" />
            </Form.Item>
            <Button type="primary" block>
              Đăng nhập
            </Button>
          </Form>
        </Space>
      </Card>
    </main>
  );
}
