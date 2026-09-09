'use client';

import { dangNhap, layPhanQuyenCuaToi } from '@agrimarket/api-client';
import { App, Button, Checkbox, Form, Input } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { duongDanDauTienAdmin } from '@/lib/quyen-admin';
import { layPhienAdmin, luuPhienAdmin } from '@/lib/phien-dang-nhap-admin';

import styles from './login.module.css';

type HttpResponse<T> = { data: T };

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

function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        styles.brand,
        light ? styles.brandLight : '',
        compact ? styles.brandCompact : '',
      ].join(' ')}
    >
      <svg
        className={styles.brandMark}
        aria-hidden="true"
        viewBox="0 0 72 58"
        role="img"
      >
        <path d="M34.5 51C19 44.8 11.2 32.4 11.1 12.7 27.8 13.1 38.3 20.1 41.6 33.8 38 38 35.8 43.4 34.5 51Z" />
        <path d="M38.4 48.2C37.7 29 46 13.2 61.1 4.7 65.3 21.1 60.7 34.1 47.2 43.8c-3 2.1-5.9 3.6-8.8 4.4Z" />
        <path
          className={styles.brandVein}
          d="M34.8 49.3c.7-12.2 6.5-25.3 18.4-36.1M33.5 46.4c-3.2-10.2-7.8-17.4-14.9-23.2"
        />
      </svg>
      <div className={styles.brandWords}>
        <strong>AgriMarket</strong>
        {!compact ? <span>Nông sản sạch, cuộc sống xanh</span> : null}
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3.3" y="5.3" width="17.4" height="13.4" rx="2.2" />
      <path d="m4.5 7 6.1 4.8a2.25 2.25 0 0 0 2.8 0L19.5 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4.6" y="10.2" width="14.8" height="10" rx="2.1" />
      <path d="M8.1 10.2V7.6a3.9 3.9 0 0 1 7.8 0v2.6" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14.3 4h3.1A2.6 2.6 0 0 1 20 6.6v10.8a2.6 2.6 0 0 1-2.6 2.6h-3.1" />
      <path d="m10.6 8 4 4-4 4M14.6 12H4" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: 'chart' | 'shield' | 'leaf' }) {
  if (type === 'chart') {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28">
        <path d="M6 21V14M13 21V9M20 21V5" />
      </svg>
    );
  }
  if (type === 'shield') {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28">
        <path d="M14 3.7 22 7.1v6c0 5.1-3.2 8.7-8 11.2-4.8-2.5-8-6.1-8-11.2v-6l8-3.4Z" />
        <path d="m10.2 14.1 2.4 2.4 5.1-5.1" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <path d="M22.8 5.2C14 5.5 7 9.3 6 17.3c5.6.9 10.8-.5 13.6-4.3 1.5-2 2.5-4.5 3.2-7.8Z" />
      <path d="M5.3 22.6c2.7-5.6 6.8-9.3 12.6-11.3" />
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
        nguoiDung: { id: string; email: string; hoTen: string };
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
          ? 'Tài khoản hoặc mật khẩu không đúng.'
          : 'Không thể đăng nhập. Kiểm tra API và thử lại.',
      );
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.visualPanel} aria-label="AgriMarket">
        <div className={styles.visualOverlay} />
        <div className={styles.visualContent}>
          <div className={styles.leftBrand}>
            <Brand />
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
        <button type="button" className={styles.languageButton}>
          <span aria-hidden="true">🇻🇳</span>
          <span>Tiếng Việt</span>
          <span className={styles.chevron}>⌄</span>
        </button>

        <div className={styles.loginCard}>
          <div className={styles.cardBrand}>
            <Brand compact />
            <strong className={styles.adminLabel}>Admin</strong>
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
            initialValues={{
              ghiNho: true,
              email:
                typeof window !== 'undefined'
                  ? window.localStorage.getItem('agrimarket-admin-email') ?? ''
                  : '',
            }}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Nhập tài khoản' }]}
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
