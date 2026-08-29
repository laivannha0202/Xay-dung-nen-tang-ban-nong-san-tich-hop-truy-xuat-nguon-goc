'use client';

import { dangNhap, layPhanQuyenCuaToi } from '@agrimarket/api-client';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { App, Card } from 'antd';
import { useRouter } from 'next/navigation';

import { luuPhienAdmin } from '@/lib/phien-dang-nhap-admin';

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

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
        }}
      >
        <LoginForm<{
          email: string;
          matKhau: string;
        }>
          title="AgriMarket Admin"
          subTitle="Đăng nhập vận hành"
          onFinish={async (values) => {
            try {
              const loginResponse = await dangNhap(
                {
                  email: values.email,
                  matKhau: values.matKhau,
                  nenTang: 'WEB',
                },
                {
                  credentials: 'include',
                },
              );

              const login = duLieu(loginResponse);

              const token = (
                login as {
                  accessToken: string;
                }
              ).accessToken;

              const permissionResponse = await layPhanQuyenCuaToi({
                credentials: 'include',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const permission = duLieu(permissionResponse) as {
                quyen: string[];
              };

              const duocQuanLy = permission.quyen.some((quyen) =>
                [
                  'nha_cung_cap.xem',
                  'trang_trai.xem',
                  'chung_nhan.xem',
                  'mua_vu.xem',
                  'nhat_ky_canh_tac.xem',
                ].includes(quyen),
              );

              if (!duocQuanLy) {
                message.error('Tài khoản không có quyền quản trị nguồn cung.');
                return false;
              }

              luuPhienAdmin({
                accessToken: token,
                nguoiDung: (
                  login as {
                    nguoiDung: {
                      id: string;
                      email: string;
                      hoTen: string;
                    };
                  }
                ).nguoiDung,
                quyen: permission.quyen,
              });

              message.success('Đăng nhập thành công.');
              router.replace('/nha-cung-cap');
              return true;
            } catch {
              message.error('Đăng nhập thất bại.');
              return false;
            }
          }}
        >
          <ProFormText
            name="email"
            placeholder="email"
            rules={[
              {
                required: true,
                message: 'Nhập email',
              },
              {
                type: 'email',
                message: 'Email không hợp lệ',
              },
            ]}
          />
          <ProFormText.Password
            name="matKhau"
            placeholder="Mật khẩu"
            rules={[
              {
                required: true,
                message: 'Nhập mật khẩu',
              },
            ]}
          />
        </LoginForm>
      </Card>
    </main>
  );
}
