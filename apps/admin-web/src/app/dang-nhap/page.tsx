'use client';

import { dangNhap, layPhanQuyenCuaToi } from '@agrimarket/api-client';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { App, Card, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { duongDanDauTienAdmin } from '@/lib/quyen-admin';
import { layPhienAdmin, luuPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

export default function TrangDangNhap() {
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    const current = layPhienAdmin();
    if (!current) return;
    const first = duongDanDauTienAdmin(current.quyen);
    if (first) router.replace(first);
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at top left, rgba(11,143,77,0.16), transparent 34%), #F4F7F5',
      }}
    >
      <Card
        styles={{ body: { padding: 32 } }}
        style={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 18,
          boxShadow: '0 22px 70px rgba(19, 54, 36, 0.10)',
        }}
      >
        <div style={{ marginBottom: 18, textAlign: 'center' }}>
          <Tag color="green">AGRIMARKET OPERATIONS</Tag>
          <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 4, color: '#0B6F43' }}>
            Quản trị AgriMarket
          </Typography.Title>
          <Typography.Text type="secondary">
            Vận hành nguồn cung, kho, đơn hàng và truy xuất trên một hệ thống.
          </Typography.Text>
        </div>

        <LoginForm<{
          email: string;
          matKhau: string;
        }>
          title=""
          subTitle="Đăng nhập bằng tài khoản nhân sự được phân quyền"
          submitter={{ searchConfig: { submitText: 'Đăng nhập' } }}
          onFinish={async (values) => {
            try {
              const loginResponse = await dangNhap(
                {
                  email: values.email,
                  matKhau: values.matKhau,
                  nenTang: 'WEB',
                },
                { credentials: 'include' },
              );

              const login = duLieu(loginResponse) as {
                accessToken: string;
                nguoiDung: {
                  id: string;
                  email: string;
                  hoTen: string;
                };
              };

              const permissionResponse = await layPhanQuyenCuaToi({
                credentials: 'include',
                headers: { Authorization: `Bearer ${login.accessToken}` },
              });

              const permission = duLieu(permissionResponse) as { quyen: string[] };
              const first = duongDanDauTienAdmin(permission.quyen);

              if (!first) {
                message.error('Tài khoản chưa được cấp quyền truy cập Admin Web.');
                return false;
              }

              luuPhienAdmin({
                accessToken: login.accessToken,
                nguoiDung: login.nguoiDung,
                quyen: permission.quyen,
              });

              message.success('Đăng nhập thành công.');
              router.replace(first);
              return true;
            } catch (error: unknown) {
              const status =
                typeof error === 'object' && error !== null && 'status' in error
                  ? Number((error as { status?: unknown }).status)
                  : undefined;
              message.error(
                status === 401
                  ? 'Email hoặc mật khẩu không đúng.'
                  : 'Không thể đăng nhập. Kiểm tra API và thử lại.',
              );
              return false;
            }
          }}
        >
          <ProFormText
            name="email"
            placeholder="email@agrimarket.vn"
            rules={[
              { required: true, message: 'Nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          />
          <ProFormText.Password
            name="matKhau"
            placeholder="Mật khẩu"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          />
        </LoginForm>
      </Card>
    </main>
  );
}
