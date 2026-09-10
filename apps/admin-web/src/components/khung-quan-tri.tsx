'use client';

import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  BuildOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ContainerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  GiftOutlined,
  GoldOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  ProductOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Layout,
  Menu,
  Space,
  Typography,
  type MenuProps,
} from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DIEU_HUONG_ADMIN,
  coQuyenMoMucAdmin,
  coTruyCapDuongDanAdmin,
  duongDanDauTienAdmin,
  type MucDieuHuongAdmin,
} from '@/lib/quyen-admin';
import {
  SU_KIEN_HET_PHIEN_ADMIN,
  dangXuatAdmin,
  layPhienAdmin,
  type PhienAdmin,
} from '@/lib/phien-dang-nhap-admin';

const { Header, Sider, Content, Footer } = Layout;

type KhungQuanTriProps = {
  children: ReactNode;
};

const iconTheoPath: Record<string, ReactNode> = {
  '/': <DashboardOutlined />,
  '/nha-cung-cap': <ShopOutlined />,
  '/trang-trai': <HomeOutlined />,
  '/chung-nhan': <SafetyCertificateOutlined />,
  '/mua-vu': <CalendarOutlined />,
  '/nhat-ky-canh-tac': <BookOutlined />,
  '/thu-hoach': <GoldOutlined />,
  '/lo-san-pham': <ContainerOutlined />,
  '/kiem-dinh-chat-luong': <CheckCircleOutlined />,
  '/danh-muc-san-pham': <TagsOutlined />,
  '/san-pham': <ProductOutlined />,
  '/kho': <BankOutlined />,
  '/ton-kho': <DatabaseOutlined />,
  '/giao-dich-ton-kho': <OrderedListOutlined />,
  '/bao-cao-ton-kho': <BarChartOutlined />,
  '/bao-cao-truy-xuat': <FileSearchOutlined />,
  '/su-kien-truy-xuat': <AuditOutlined />,
  '/don-hang': <ShoppingCartOutlined />,
  '/khieu-nai': <ToolOutlined />,
  '/bao-cao-don-hang-doanh-thu': <BarChartOutlined />,
  '/khach-hang': <TeamOutlined />,
  '/nhan-vien': <UserOutlined />,
  '/phan-quyen': <SafetyCertificateOutlined />,
  '/nhat-ky-kiem-toan': <AuditOutlined />,
  '/cau-hinh': <SettingOutlined />,
  '/hoa-hong': <GiftOutlined />,
  '/tai-chinh': <BankOutlined />,
};

const nhomMenu: Array<{
  key: MucDieuHuongAdmin['nhom'];
  label: string;
  icon: ReactNode;
}> = [
  { key: 'nguon-cung', label: 'Nguồn cung & sản phẩm', icon: <AppstoreOutlined /> },
  { key: 'kho-van', label: 'Kho & tồn kho', icon: <DatabaseOutlined /> },
  { key: 'van-hanh', label: 'Vận hành', icon: <CarOutlined /> },
  { key: 'he-thong', label: 'Báo cáo & hệ thống', icon: <BuildOutlined /> },
];

function tenHienThi(item: MucDieuHuongAdmin): string {
  const map: Record<string, string> = {
    '/san-pham': 'Quản lý sản phẩm',
    '/danh-muc-san-pham': 'Quản lý danh mục',
    '/trang-trai': 'Quản lý trang trại',
    '/don-hang': 'Quản lý đơn hàng',
    '/khach-hang': 'Quản lý khách hàng',
    '/khieu-nai': 'Quản lý khiếu nại',
    '/kho': 'Quản lý kho',
    '/cau-hinh': 'Quản trị hệ thống',
    '/': 'Tổng quan',
  };
  return map[item.path] ?? item.name;
}

function boDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function taoMenu(quyen: string[]): MenuProps['items'] {
  const allowed = DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(quyen, item));
  const result: NonNullable<MenuProps['items']> = [];

  const tongQuan = allowed.find((item) => item.path === '/');
  if (tongQuan) {
    result.push({
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">Tổng quan</Link>,
    });
  }

  for (const group of nhomMenu) {
    const children = allowed
      .filter((item) => item.nhom === group.key)
      .map((item) => ({
        key: item.path,
        icon: iconTheoPath[item.path] ?? <AppstoreOutlined />,
        label: <Link href={item.path}>{tenHienThi(item)}</Link>,
      }));

    if (children.length) {
      result.push({
        key: `group:${group.key}`,
        icon: group.icon,
        label: group.label,
        children,
      });
    }
  }

  return result;
}

function LogoAdmin({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        height: 82,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        paddingInline: collapsed ? 0 : 18,
        color: '#fff',
      }}
    >
      <svg
        viewBox="0 0 72 58"
        width={collapsed ? 34 : 40}
        height={collapsed ? 30 : 34}
        aria-hidden="true"
        style={{ fill: 'currentColor', flex: '0 0 auto' }}
      >
        <path d="M34.5 51C19 44.8 11.2 32.4 11.1 12.7 27.8 13.1 38.3 20.1 41.6 33.8 38 38 35.8 43.4 34.5 51Z" />
        <path d="M38.4 48.2C37.7 29 46 13.2 61.1 4.7 65.3 21.1 60.7 34.1 47.2 43.8c-3 2.1-5.9 3.6-8.8 4.4Z" />
      </svg>
      {!collapsed ? (
        <div style={{ display: 'grid', lineHeight: 1.05 }}>
          <strong style={{ fontSize: 22, letterSpacing: '-0.5px' }}>AgriMarket</strong>
          <span style={{ fontSize: 12, opacity: 0.82, marginTop: 4 }}>Quản trị</span>
        </div>
      ) : null}
    </div>
  );
}

export function KhungQuanTri({ children }: KhungQuanTriProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [phien, setPhien] = useState<PhienAdmin | null>(null);
  const [daKhoiTao, setDaKhoiTao] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dangDangXuat, setDangDangXuat] = useState(false);
  const [timKiem, setTimKiem] = useState('');
  const [khongTimThay, setKhongTimThay] = useState(false);

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
      router.replace(duongDanDauTienAdmin(current.quyen) ?? '/dang-nhap');
    }
  }, [pathname, router]);

  useEffect(() => {
    const hetPhien = () => {
      setPhien(null);
      router.replace('/dang-nhap');
    };

    window.addEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
    return () => window.removeEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
  }, [router]);

  const menuItems = useMemo(() => taoMenu(phien?.quyen ?? []), [phien?.quyen]);
  const mucDuocPhep = useMemo(
    () => DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(phien?.quyen ?? [], item)),
    [phien?.quyen],
  );

  function moKetQuaTimKiem() {
    const keyword = boDau(timKiem);
    if (!keyword) {
      setKhongTimThay(false);
      return;
    }

    const match = mucDuocPhep.find((item) => {
      const text = boDau(`${tenHienThi(item)} ${item.name} ${item.path}`);
      return text.includes(keyword);
    });

    if (!match) {
      setKhongTimThay(true);
      return;
    }

    setKhongTimThay(false);
    setTimKiem('');
    router.push(match.path);
  }

  if (pathname === '/dang-nhap') return children;

  if (!daKhoiTao || !phien) {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#F7FAF8' }}>
        <Space direction="vertical" align="center">
          <DatabaseOutlined style={{ fontSize: 28, color: '#087A4B' }} spin />
          <Typography.Text type="secondary">Đang kiểm tra phiên quản trị...</Typography.Text>
        </Space>
      </main>
    );
  }

  const menuTaiKhoan: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: async () => {
        setDangDangXuat(true);
        try {
          await dangXuatAdmin();
          router.replace('/dang-nhap');
        } finally {
          setDangDangXuat(false);
        }
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100dvh', background: '#F7FAF8' }}>
      <Sider
        width={246}
        collapsedWidth={72}
        collapsible
        trigger={null}
        collapsed={collapsed}
        style={{
          position: 'fixed',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
          background: 'linear-gradient(180deg,#07623D 0%,#034C31 100%)',
          boxShadow: '6px 0 24px rgba(4,69,43,.08)',
        }}
      >
        <LogoAdmin collapsed={collapsed} />
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[pathname]}
          defaultOpenKeys={['group:nguon-cung', 'group:kho-van', 'group:van-hanh', 'group:he-thong']}
          items={menuItems}
          style={{
            borderInlineEnd: 0,
            background: 'transparent',
            paddingInline: 8,
            fontSize: 13,
          }}
        />
        {!collapsed ? (
          <div style={{ margin: 14, padding: 16, border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, color: '#fff', background: 'rgba(255,255,255,.05)' }}>
            <Space direction="vertical" size={2}>
              <SafetyCertificateOutlined style={{ fontSize: 26 }} />
              <Typography.Text style={{ color: '#fff', fontWeight: 700 }}>Nông sản sạch</Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Nguồn gốc minh bạch</Typography.Text>
            </Space>
          </div>
        ) : null}
      </Sider>

      <Layout style={{ marginInlineStart: collapsed ? 72 : 246, transition: 'margin .2s', minWidth: 0 }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 90,
            height: 68,
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid #DCE7DF',
            background: 'rgba(255,255,255,.98)',
          }}
        >
          <Button
            type="text"
            aria-label={collapsed ? 'Mở rộng menu quản trị' : 'Thu gọn menu quản trị'}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            style={{ fontSize: 18 }}
          />

          <div style={{ width: 490, maxWidth: '42vw' }}>
            <Input
              allowClear
              value={timKiem}
              status={khongTimThay ? 'error' : undefined}
              prefix={<SearchOutlined style={{ color: '#7A8580' }} />}
              placeholder="Mở nhanh sản phẩm, đơn hàng, khách hàng..."
              onChange={(event) => {
                setTimKiem(event.target.value);
                if (khongTimThay) setKhongTimThay(false);
              }}
              onPressEnter={moKetQuaTimKiem}
              suffix={
                khongTimThay ? (
                  <Typography.Text type="danger" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                    Không tìm thấy mục
                  </Typography.Text>
                ) : undefined
              }
            />
          </div>

          <Space size="middle" style={{ marginInlineStart: 'auto' }}>
            <Space size={8}>
              <CalendarOutlined style={{ color: '#087A4B', fontSize: 18 }} />
              <div style={{ display: 'grid', lineHeight: 1.1 }}>
                <Typography.Text type="secondary" style={{ fontSize: 10 }}>Hôm nay</Typography.Text>
                <Typography.Text strong style={{ fontSize: 12 }}>{new Date().toLocaleDateString('vi-VN')}</Typography.Text>
              </div>
            </Space>

            <Dropdown menu={{ items: menuTaiKhoan }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#DCEEE4', color: '#075C39', fontWeight: 800 }}>
                  {phien.nguoiDung.hoTen.trim().charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ display: 'grid', lineHeight: 1.1 }}>
                  <Typography.Text strong style={{ fontSize: 12 }}>{phien.nguoiDung.hoTen}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>Quản trị viên</Typography.Text>
                </div>
                {dangDangXuat ? <DatabaseOutlined spin /> : null}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 22, minHeight: 'calc(100dvh - 118px)' }}>{children}</Content>
        <Footer style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', background: '#F7FAF8', color: '#8C9691', fontSize: 11 }}>
          <span>© 2026 AgriMarket. Tất cả quyền được bảo lưu.</span>
          <span>AgriMarket Admin</span>
        </Footer>
      </Layout>
    </Layout>
  );
}
