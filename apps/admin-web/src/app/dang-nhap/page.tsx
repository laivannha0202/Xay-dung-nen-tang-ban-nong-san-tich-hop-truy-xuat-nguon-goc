'use client';

import { dangNhap, layPhanQuyenCuaToi } from '@agrimarket/api-client';
import { App, Button, Checkbox, Form, Input } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { duongDanDauTienAdmin } from '@/lib/quyen-admin';
import { layPhienAdmin, luuPhienAdmin } from '@/lib/phien-dang-nhap-admin';

import styles from './login.module.css';

type HttpResponse<T> = {
  data: T;
};

type LoginValues = {
  email: string;
  matKhau: string;
  ghiNho?: boolean;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }
  return response as T;
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <path
        d="M4 5.75h16A1.75 1.75 0 0 1 21.75 7.5v9A1.75 1.75 0 0 1 20 18.25H4A1.75 1.75 0 0 1 2.25 16.5v-9A1.75 1.75 0 0 1 4 5.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m3.4 7.1 7.37 5.55a2.04 2.04 0 0 0 2.46 0L20.6 7.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <rect
        x="4.5"
        y="10"
        width="15"
        height="10.25"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <path
        d="M14 4h3.25A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="m10.5 8 4 4-4 4M14.5 12H4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FeatureIcon({ type }: { type: 'chart' | 'shield' | 'leaf' }) {
  if (type === 'chart') {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28">
        <path d="M6 21V13M13 21V8M20 21V4" />
      </svg>
    );
  }

  if (type === 'shield') {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28">
        <path d="M14 3.5 22 7v6.1c0 5.2-3.25 8.8-8 11.4-4.75-2.6-8-6.2-8-11.4V7l8-3.5Z" />
        <path d="m10.2 14 2.4 2.4 5-5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <path d="M22.5 5.5C14 5.3 7.1 9.2 6 17c5.6 1 10.8-.4 13.6-4.2 1.5-2 2.4-4.4 2.9-7.3Z" />
      <path d="M5.5 22c2.7-5.4 6.5-8.9 12-10.7" />
    </svg>
  );
}

export default function TrangDangNhap() {
  const router = useRouter();
  const { message } = App.useApp();
  const [dangXuLy, setDangXuLy] = useState(false);

  useEffect(() => {
    const current = layPhienAdmin();
    if (!current) return;
    const first = duongDanDauTienAdmin(current.quyen);
    if (first) router.replace(first);
  }, [router]);

  const dangNhapHeThong = async (values: LoginValues) => {
    if (dangXuLy) return;

    setDangXuLy(true);
    try {
      const loginResponse = await dangNhap(
        {
          email: values.email.trim(),
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
        return;
      }

      luuPhienAdmin({
        accessToken: login.accessToken,
        nguoiDung: login.nguoiDung,
        quyen: permission.quyen,
      });

      if (values.ghiNho) {
        window.localStorage.setItem('agrimarket-admin-email', values.email.trim());
      } else {
        window.localStorage.removeItem('agrimarket-admin-email');
      }

      message.success('Đăng nhập thành công.');
      router.replace(first);
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
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.visualPanel} aria-label="AgriMarket">
        <div className={styles.visualShade} />
        <div className={styles.visualContent}>
          <div className={styles.visualBrand}>
            <Image
              src="/agrimarket-admin-logo.png"
              alt="AgriMarket"
              width={330}
              height={78}
              priority
              className={styles.visualLogo}
            />
          </div>

          <div className={styles.heroCopy}>
            <h1>Hệ thống quản trị</h1>
            <p>
              Quản lý dễ dàng - Vận hành hiệu quả
              <br />
              Vì một nền nông nghiệp bền vững
            </p>
          </div>

          <div className={styles.visualBottom}>
            <div className={styles.featureGrid}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>
                  <FeatureIcon type="chart" />
                </span>
                <strong>Quản lý toàn diện</strong>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>
                  <FeatureIcon type="shield" />
                </span>
                <strong>Dữ liệu minh bạch</strong>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>
                  <FeatureIcon type="leaf" />
                </span>
                <strong>Phát triển bền vững</strong>
              </div>
            </div>
            <p className={styles.quote}>“Công nghệ kết nối nông sản Việt”</p>
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <button type="button" className={styles.languageButton} aria-label="Ngôn ngữ">
          <span aria-hidden="true">🇻🇳</span>
          <span>Tiếng Việt</span>
          <span className={styles.chevron}>⌄</span>
        </button>

        <div className={styles.loginCard}>
          <div className={styles.cardBrand}>
            <Image
              src="/agrimarket-admin-logo.png"
              alt="AgriMarket"
              width={220}
              height={52}
              priority
              className={styles.cardLogo}
            />
            <strong>Admin</strong>
          </div>

          <div className={styles.heading}>
            <h2>Đăng nhập hệ thống</h2>
            <p>Chào mừng bạn quay trở lại!</p>
          </div>

          <Form<LoginValues>
            layout="vertical"
            requiredMark={false}
            className={styles.form}
            onFinish={dangNhapHeThong}
            initialValues={{ ghiNho: true }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Nhập email hoặc tên đăng nhập' },
              ]}
            >
              <Input
                size="large"
                autoComplete="username"
                placeholder="Email hoặc tên đăng nhập"
                prefix={
                  <span className={styles.inputIcon}>
                    <MailIcon />
                  </span>
                }
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="matKhau"
              rules={[{ required: true, message: 'Nhập mật khẩu' }]}
            >
              <Input.Password
                size="large"
                autoComplete="current-password"
                placeholder="Mật khẩu"
                prefix={
                  <span className={styles.inputIcon}>
                    <LockIcon />
                  </span>
                }
                className={styles.input}
              />
            </Form.Item>

            <div className={styles.formMeta}>
              <Form.Item name="ghiNho" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <span className={styles.forgotPassword}>Quên mật khẩu?</span>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={dangXuLy}
              block
              size="large"
              className={styles.loginButton}
              icon={<SignInIcon />}
            >
              Đăng nhập
            </Button>
          </Form>
        </div>

        <footer className={styles.footer}>
          © 2026 AgriMarket. Tất cả quyền được bảo lưu.
        </footer>
      </section>
    </main>
  );
}
