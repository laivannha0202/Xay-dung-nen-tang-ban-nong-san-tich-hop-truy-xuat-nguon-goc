'use client';

import { chuanHoaKhongDau } from '@agrimarket/api-client';
import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
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
  Spin,
  Typography,
  type MenuProps,
} from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  DIEU_HUONG_ADMIN,
  NHOM_MENU_CHI_GOM,
  ROUTE_ADMIN,
  cayMenuAdmin,
  coQuyenMoMucAdmin,
  coTruyCapDuongDanAdmin,
  duongDanDauTienAdmin,
  type MucDieuHuongAdmin,
  type MucMenuAdmin,
} from '@/lib/quyen-admin';
import {
  SU_KIEN_HET_PHIEN_ADMIN,
  damBaoPhienAdmin,
  dangXuatAdmin,
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
  // AGRIMARKET-V15-ADMIN-ICONS
  '/phieu-kho': <ContainerOutlined />,
  '/hoa-don': <FileSearchOutlined />,
  '/bao-cao-ton-kho': <BarChartOutlined />,
  '/bao-cao-truy-xuat': <FileSearchOutlined />,
  '/su-kien-truy-xuat': <AuditOutlined />,
  '/don-hang': <ShoppingCartOutlined />,
  '/flash-sale': <GiftOutlined />,
  '/danh-gia': <CheckCircleOutlined />,
  '/noi-dung-trang-chu': <HomeOutlined />,
  '/thong-bao': <AuditOutlined />,
  '/khieu-nai': <ToolOutlined />,
  '/bao-cao-don-hang-doanh-thu': <BarChartOutlined />,
  '/khach-hang': <TeamOutlined />,
  '/nhan-vien': <UserOutlined />,
  '/phan-quyen': <SafetyCertificateOutlined />,
  '/nhat-ky-kiem-toan': <AuditOutlined />,
  '/cau-hinh': <SettingOutlined />,
  '/hoa-hong': <GiftOutlined />,
  '/tai-chinh': <BankOutlined />,
  [NHOM_MENU_CHI_GOM]: <BarChartOutlined />,
};

const nhomMenu: Array<{
  key: MucDieuHuongAdmin['nhom'];
  label: string;
  icon: ReactNode;
}> = [
  { key: 'ban-hang', label: 'Bán hàng', icon: <ShoppingCartOutlined /> },
  { key: 'khuyen-mai', label: 'Khuyến mãi', icon: <GiftOutlined /> },
  { key: 'nguon-cung', label: 'Nguồn cung', icon: <AppstoreOutlined /> },
  { key: 'chat-luong', label: 'Chất lượng', icon: <CheckCircleOutlined /> },
  { key: 'kho', label: 'Kho và tồn kho', icon: <DatabaseOutlined /> },
  { key: 'truy-xuat', label: 'Truy xuất nguồn gốc', icon: <AuditOutlined /> },
  { key: 'tai-chinh', label: 'Tài chính', icon: <BankOutlined /> },
  { key: 'noi-dung', label: 'Nội dung', icon: <HomeOutlined /> },
  { key: 'he-thong', label: 'Hệ thống', icon: <SettingOutlined /> },
];

function tenHienThi(item: MucDieuHuongAdmin): string {
  return item.name;
}

function boDau(value: string): string {
  return chuanHoaKhongDau(value).trim();
}

/** Node phẳng (tablet/768px): bỏ cả nhóm lẫn submenu, chỉ giữ từng route. */
function flattenMenu(nodes: MucMenuAdmin[]): MucMenuAdmin[] {
  const out: MucMenuAdmin[] = [];
  const duyet = (list: MucMenuAdmin[]) => {
    for (const node of list) {
      out.push(node);
      duyet(node.con);
    }
  };
  duyet(nodes);
  return out;
}

function taoMenu(quyen: string[], phang = false): MenuProps['items'] {
  const cay = cayMenuAdmin(quyen);
  const laRouteThat = (node: MucMenuAdmin) => node.muc.chiMenu !== true;

  // AGRIMARKET-ADMIN-TABLET-FLAT-MENU-V7-2
  // Ant Menu `defaultOpenKeys` của desktop khi Sider chuyển collapsed có thể
  // mở nhiều submenu popup cùng lúc. Tablet dùng danh sách phẳng để:
  // - không còn popup tự che nội dung;
  // - mỗi route vẫn truy cập được bằng icon;
  // - inlineCollapsed của Ant tự cung cấp tooltip label khi hover.
  if (phang) {
    return flattenMenu(cay)
      .filter(laRouteThat)
      .map((node) => ({
        key: node.muc.path,
        icon: iconTheoPath[node.muc.path] ?? <AppstoreOutlined />,
        label: <Link href={node.muc.path}>{tenHienThi(node.muc)}</Link>,
      }));
  }

  const nodeMenu = (node: MucMenuAdmin): NonNullable<MenuProps['items']>[number] => {
    const isRoute = laRouteThat(node);
    const children = node.con.map(nodeMenu);

    return {
      key: node.muc.path,
      icon: iconTheoPath[node.muc.path] ?? <AppstoreOutlined />,
      // Mục nhóm ảo (`menu:bao-cao`) không có route ⇒ chỉ là nhãn nhóm.
      label: isRoute ? (
        <Link href={node.muc.path}>{tenHienThi(node.muc)}</Link>
      ) : (
        tenHienThi(node.muc)
      ),
      ...(children.length ? { children } : {}),
    };
  };

  const result: NonNullable<MenuProps['items']> = [];

  const tongQuan = cay.find((node) => node.muc.path === '/');
  if (tongQuan) {
    result.push({
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">Tổng quan</Link>,
    });
  }

  for (const group of nhomMenu) {
    const children = cay
      .filter((node) => node.muc.nhom === group.key)
      .map(nodeMenu);

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
  // `daKhoiTao` = đã bootstrap phiên Admin **lần đầu** (mở app / hard reload).
  // Chỉ trạng thái này mới được phép thay toàn màn hình bằng loader.
  const [daKhoiTao, setDaKhoiTao] = useState(false);
  // `dangLamMoiPhien` = đang hậu kiểm/refresh token NỀN khi người dùng đổi route.
  // Không bao giờ chặn shell; chỉ hiện một thanh tiến trình mảnh trong Content.
  const [dangLamMoiPhien, setDangLamMoiPhien] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // AGRIMARKET-ADMIN-TABLET-RESPONSIVE-V7-1
  // 768px là viewport nghiệm thu Admin. Ở <= 991px giữ sidebar compact 72px
  // để bảng/form không bị ép còn ~500px và header không cắt thông tin.
  const [manHinhTablet, setManHinhTablet] = useState(false);
  const [dangDangXuat, setDangDangXuat] = useState(false);
  const [timKiem, setTimKiem] = useState('');
  const [khongTimThay, setKhongTimThay] = useState(false);

  // AGRIMARKET-ADMIN-SHELL-PERSIST-V8
  // Lỗi gốc: effect bootstrap gắn `pathname` và gọi `setDaKhoiTao(false)` ở
  // MỌI lần đổi route, nên mỗi lần click menu là shell bị thay bằng loader
  // toàn màn hình "Đang kiểm tra phiên quản trị..." dù `damBaoPhienAdmin()`
  // có fast-path trả về ngay từ sessionStorage.
  //
  // Cách sửa (không làm yếu bảo mật):
  // - Bootstrap đầy đủ (kèm refresh token khi sắp hết hạn) vẫn chạy MỖI lần
  //   đổi route — không bỏ refresh logic, không bỏ kiểm tra phiên.
  // - Chỉ lần bootstrap đầu tiên mới `setDaKhoiTao(false)` (full-screen loader).
  // - Các lần sau: shell giữ nguyên, chạy kiểm tra phiên + quyền nền.
  //   Nếu access token còn hạn thì `damBaoPhienAdmin()` resolve ngay ở
  //   microtask và trả về ĐÚNG object đang cache ⇒ `setPhien` là no-op ⇒
  //   không re-render shell, không refetch page.
  const daKhoiTaoRef = useRef(false);
  const pathnameDaKiemTraRef = useRef<string | null>(null);
  const phienHienTaiRef = useRef<PhienAdmin | null>(null);
  phienHienTaiRef.current = phien;

  useEffect(() => {
    if (pathname === '/dang-nhap') {
      // Sang trang đăng nhập (đăng xuất, hết phiên): hạ cờ bootstrap để lần
      // đăng nhập sau luôn hiện loader đầy đủ và không dùng nhầm phiên cũ.
      daKhoiTaoRef.current = false;
      pathnameDaKiemTraRef.current = null;
      setPhien(null);
      setDangLamMoiPhien(false);
      setDaKhoiTao(true);
      return;
    }

    // Mỗi pathname chỉ kiểm tra phiên đúng một lần (chống chạy lại do
    // `router` đổi identity).
    if (pathnameDaKiemTraRef.current === pathname && daKhoiTaoRef.current) return;
    pathnameDaKiemTraRef.current = pathname;

    const lanDau = !daKhoiTaoRef.current || phienHienTaiRef.current === null;
    if (lanDau) {
      setDaKhoiTao(false);
      setDangLamMoiPhien(false);
    } else {
      // KHÔNG setDaKhoiTao(false): Sidebar/Header/Content giữ nguyên.
      setDangLamMoiPhien(true);
    }

    let active = true;
    void damBaoPhienAdmin().then((current) => {
      if (!active) return;

      daKhoiTaoRef.current = true;
      // `current` giữ nguyên identity nhờ cache RAW trong phien-dang-nhap-admin,
      // nên setState cùng phiên sẽ bị React bỏ qua (không render lại shell).
      setPhien(current);
      setDaKhoiTao(true);
      setDangLamMoiPhien(false);

      if (!current) {
        router.replace('/dang-nhap');
      }
    });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  // Quyền theo route: kiểm tra ĐỒNG BỘ khi render (hàm thuần, không side
  // effect) để không bao giờ hiện khung dữ liệu của route mà user không có
  // quyền; effect bên dưới chỉ lo chuyển hướng.
  const routeDuocPhep = phien
    ? coTruyCapDuongDanAdmin(pathname, phien.quyen)
    : true;

  useEffect(() => {
    if (pathname === '/dang-nhap') return;
    const current = phien;
    if (!current) return;
    if (coTruyCapDuongDanAdmin(pathname, current.quyen)) return;

    router.replace(duongDanDauTienAdmin(current.quyen) ?? '/dang-nhap');
  }, [pathname, phien, router]);

  useEffect(() => {
    const hetPhien = () => {
      setPhien(null);
      router.replace('/dang-nhap');
    };

    window.addEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
    return () => window.removeEventListener(SU_KIEN_HET_PHIEN_ADMIN, hetPhien);
  }, [router]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 991px)');
    const dongBo = () => setManHinhTablet(media.matches);

    dongBo();
    media.addEventListener('change', dongBo);
    return () => media.removeEventListener('change', dongBo);
  }, []);

  const collapsedHieuLuc = manHinhTablet || collapsed;

  const menuItems = useMemo(
    () => taoMenu(phien?.quyen ?? [], manHinhTablet),
    [manHinhTablet, phien?.quyen],
  );
  // Ô tìm nhanh phải tìm thấy MỌI route kể cả route đã ẩn khỏi menu
  // (ledger tồn kho, audit log): chúng vẫn hợp lệ và quyền vẫn được chặn.
  const mucDuocPhep = useMemo(
    () => ROUTE_ADMIN.filter((item) => coQuyenMoMucAdmin(phien?.quyen ?? [], item)),
    [phien?.quyen],
  );

  const [openKeysMenu, setOpenKeysMenu] = useState<string[]>([
    'group:ban-hang',
    'group:khuyen-mai',
    'group:nguon-cung',
    'group:chat-luong',
    'group:kho',
    'group:truy-xuat',
    'group:tai-chinh',
    'group:noi-dung',
    'group:he-thong',
  ]);

  // Submenu chứa route hiện tại phải mở sẵn, nếu không sau khi điều hướng
  // mục con sẽ nằm trong một submenu đang đóng.
  useEffect(() => {
    const cha = DIEU_HUONG_ADMIN.find((item) => item.menuCha === pathname)?.menuCha;
    if (!cha) return;

    setOpenKeysMenu((truoc) => (truoc.includes(cha) ? truoc : [...truoc, cha]));
  }, [pathname]);

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

  // Loader toàn màn hình: CHỈ lần bootstrap Admin đầu tiên.
  if (!daKhoiTao || !phien) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#F7FAF8',
        }}
      >
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
          setPhien(null);
          daKhoiTaoRef.current = false;
          pathnameDaKiemTraRef.current = null;
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
        collapsed={collapsedHieuLuc}
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
        <LogoAdmin collapsed={collapsedHieuLuc} />
        <Menu
          key={manHinhTablet ? 'tablet-flat' : 'desktop-grouped'}
          mode="inline"
          theme="dark"
          selectedKeys={[pathname]}
          openKeys={openKeysMenu}
          onOpenChange={(keys) => setOpenKeysMenu(keys as string[])}
          items={menuItems}
          style={{
            borderInlineEnd: 0,
            background: 'transparent',
            paddingInline: 8,
            fontSize: 13,
          }}
        />
      </Sider>

      <Layout
        style={{
          marginInlineStart: collapsedHieuLuc ? 72 : 246,
          transition: 'margin .2s',
          minWidth: 0,
        }}
      >
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
            aria-label={collapsedHieuLuc ? 'Mở rộng menu quản trị' : 'Thu gọn menu quản trị'}
            icon={collapsedHieuLuc ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            style={{ fontSize: 18, display: manHinhTablet ? 'none' : undefined }}
          />

          <div
            style={{
              width: manHinhTablet ? 'auto' : 490,
              maxWidth: manHinhTablet ? 'none' : '42vw',
              flex: manHinhTablet ? 1 : undefined,
              minWidth: 0,
            }}
          >
            <Input
              allowClear
              value={timKiem}
              status={khongTimThay ? 'error' : undefined}
              prefix={<SearchOutlined style={{ color: '#7A8580' }} />}
              placeholder="Tìm chức năng"
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
            <Dropdown menu={{ items: menuTaiKhoan }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#DCEEE4', color: '#075C39', fontWeight: 800 }}>
                  {phien.nguoiDung.hoTen.trim().charAt(0).toUpperCase()}
                </Avatar>
                {!manHinhTablet ? (
                  <div style={{ display: 'grid', lineHeight: 1.1 }}>
                    <Typography.Text strong style={{ fontSize: 12 }}>
                      {phien.nguoiDung.hoTen}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                      Quản trị viên
                    </Typography.Text>
                  </div>
                ) : null}
                {dangDangXuat ? <DatabaseOutlined spin /> : null}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: manHinhTablet ? 14 : 22, minHeight: 'calc(100dvh - 118px)', position: 'relative' }}>
          {/* AGRIMARKET-ADMIN-SHELL-PERSIST-V8: thanh tiến trình mảnh nằm
              trong vùng Content, không che Sidebar/Header. Chỉ hiện khi đang hậu
              kiểm phiên (token sắp hết hạn) — không phải lúc đổi route. */}
          {dangLamMoiPhien ? (
            <div
              className="ant-admin-session-refresh"
              aria-hidden="true"
              style={{
                position: 'absolute',
                insetInline: 0,
                top: 0,
                height: 2,
                overflow: 'hidden',
                borderRadius: 2,
                background: 'rgba(8,122,75,.12)',
              }}
            >
              <div
                style={{
                  width: '38%',
                  height: '100%',
                  background: '#087A4B',
                  animation: 'agrimarket-admin-loading 900ms ease-in-out infinite',
                }}
              />
            </div>
          ) : null}
          {routeDuocPhep ? children : (
            // Route ngoài quyền: giữ shell, chỉ khoá vùng content trong lúc
            // effect chuyển hướng — không nháy trang login.
            <div
              style={{
                minHeight: '60dvh',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Space direction="vertical" align="center">
                <Spin />
                <Typography.Text type="secondary">
                  Tài khoản chưa có quyền truy cập mục này.
                </Typography.Text>
              </Space>
            </div>
          )}
        </Content>
        <Footer
          style={{
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            background: '#F7FAF8',
            color: '#8C9691',
            fontSize: 11,
          }}
        >
          <span>AgriMarket Admin</span>
        </Footer>
      </Layout>
    </Layout>
  );
}
