'use client';

import { ProLayout, type MenuDataItem } from '@ant-design/pro-components';
import { Button, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type KhungQuanTriProps = {
  children: ReactNode;
};

const routes: MenuDataItem[] = [
  { path: '/', name: 'Tổng quan' },
  { path: '/nha-cung-cap', name: 'Nhà cung cấp' },
  { path: '/trang-trai', name: 'Trang trại' },
  { path: '/chung-nhan', name: 'Chứng nhận' },
  { path: '/mua-vu', name: 'Mùa vụ' },
  { path: '/nhat-ky-canh-tac', name: 'Nhật ký canh tác' },
  { path: '/thu-hoach', name: 'Thu hoạch' },
  { path: '/lo-san-pham', name: 'Lô sản phẩm' },
  { path: '/kiem-dinh-chat-luong', name: 'Kiểm định chất lượng' },
  { path: '/danh-muc-san-pham', name: 'Danh mục sản phẩm' },
  { path: '/san-pham', name: 'Sản phẩm' },
  { path: '/su-kien-truy-xuat', name: 'Sự kiện truy xuất' },
  { path: '/don-hang', name: 'Đơn hàng' },
  { path: '/nguoi-dung', name: 'Người dùng' },
  { path: '/cau-hinh', name: 'Cấu hình' },
];

export function KhungQuanTri({ children }: KhungQuanTriProps) {
  const pathname = usePathname();

  if (pathname === '/dang-nhap') {
    return children;
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
      avatarProps={{ title: 'Admin' }}
      actionsRender={() => [
        <Space key="foundation">
          <Tag color="blue">Foundation</Tag>
          <Button size="small">Trợ giúp</Button>
        </Space>,
      ]}
      footerRender={() => <Typography.Text type="secondary">AgriMarket Admin Web</Typography.Text>}
    >
      {children}
    </ProLayout>
  );
}
