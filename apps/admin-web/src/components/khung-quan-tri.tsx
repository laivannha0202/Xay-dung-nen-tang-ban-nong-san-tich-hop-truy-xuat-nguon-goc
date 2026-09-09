'use client';

import { ProLayout, type MenuDataItem } from '@ant-design/pro-components';
import { App, Button, Space, Spin, Tag, Typography } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DIEU_HUONG_ADMIN,
  coQuyenMoMucAdmin,
  coTruyCapDuongDanAdmin,
  duongDanDauTienAdmin,
} from '@/lib/quyen-admin';
import {
  SU_KIEN_HET_PHIEN_ADMIN,
  dangXuatAdmin,
  layPhienAdmin,
  type PhienAdmin,
} from '@/lib/phien-dang-nhap-admin';

type KhungQuanTriProps = {
  children: ReactNode;
};

function taoMenu(quyen: string[]): MenuDataItem[] {
  // Bản @ant-design/pro-layout hiện tại trong repo định nghĩa MenuDataItem
  // theo dạng leaf item (routes?: undefined). Vì vậy menu RBAC được render
  // phẳng theo đúng thứ tự DIEU_HUONG_ADMIN thay vì nhét routes lồng nhau.
  // Route guard vẫn dùng cùng một nguồn quyền, nên không làm giảm bảo mật.
  return DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(quyen, item)).map(
    (item) => ({
      path: item.path,
      name: item.name,
    }),
  );
}

export function KhungQuanTri({ children }: KhungQuanTriProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { message } = App.useApp();
  const [phien, setPhien] = useState<PhienAdmin | null>(null);
  const [daKhoiTao, setDaKhoiTao] = useState(false);
  const [dangDangXuat, setDangDangXuat] = useState(false);

  useEffect(() => {
    if (pathname === '/dang-nhap') {
      setDaKhoiTao(true);
      return;
    }

    const current = layPhienAdmin();
    setPhien(current);
    setDaKhoiTao(true);

    if (!current) {
      router.replace('/dang-nhap');
      return;
    }

    if (!coTruyCapDuongDanAdmin(pathname, current.quyen)) {
      const first = duongDanDauTienAdmin(current.quyen);
      if (first) router.replace(first);
      else router.replace('/dang-nhap');
    }
  }, [pathname, router]);

  useEffect(() => {
    const hetPhien = () => {
      setPhien(null);
      message.warning('Phiên quản trị đã hết. Vui lòng đăng nhập lại.');
      router.replace('/dang-nhap');
    };

    window.addEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
    return () => window.removeEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
  }, [message, router]);

  const routes = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);

  if (pathname === '/dang-nhap') return children;

  if (!daKhoiTao || !phien) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Typography.Text type="secondary">Đang kiểm tra phiên quản trị...</Typography.Text>
        </Space>
      </main>
    );
  }

  return (
    <ProLayout
      title="AgriMarket Admin"
      logo={false}
      layout="side"
      fixedHeader
      fixSiderbar
      route={{ routes }}
      location={{ pathname }}
      menuItemRender={(item, dom) => (item.path ? <Link href={item.path}>{dom}</Link> : dom)}
      avatarProps={{ title: phien.nguoiDung.hoTen }}
      actionsRender={() => [
        <Space key="admin-session" size="small">
          <Tag color="green">API connected</Tag>
          <Button
            size="small"
            loading={dangDangXuat}
            onClick={async () => {
              setDangDangXuat(true);
              try {
                await dangXuatAdmin();
                message.success('Đã đăng xuất.');
                router.replace('/dang-nhap');
              } finally {
                setDangDangXuat(false);
              }
            }}
          >
            Đăng xuất
          </Button>
        </Space>,
      ]}
      footerRender={() => (
        <Typography.Text type="secondary">
          AgriMarket · Nông sản sạch, nguồn gốc minh bạch
        </Typography.Text>
      )}
    >
      {children}
    </ProLayout>
  );
}
