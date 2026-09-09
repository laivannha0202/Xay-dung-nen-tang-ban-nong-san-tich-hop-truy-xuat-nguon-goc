'use client';

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

import styles from './khung-quan-tri.module.css';

type KhungQuanTriProps = {
  children: ReactNode;
};

type IconName =
  | 'home'
  | 'box'
  | 'folder'
  | 'farm'
  | 'order'
  | 'users'
  | 'star'
  | 'alert'
  | 'gift'
  | 'warehouse'
  | 'chart'
  | 'settings'
  | 'leaf';

function Icon({ name }: { name: IconName }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'home') {
    return <svg viewBox="0 0 24 24" {...common}><path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6"/></svg>;
  }
  if (name === 'box') {
    return <svg viewBox="0 0 24 24" {...common}><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7v10l8 4 8-4V7M12 11v10"/></svg>;
  }
  if (name === 'folder') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M3 7.5h6l2-2h10v14H3v-12Z"/></svg>;
  }
  if (name === 'farm') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M3 20h18M5 20V9l7-5 7 5v11M8 20v-6h8v6"/><path d="M8 10h.01M16 10h.01"/></svg>;
  }
  if (name === 'order') {
    return <svg viewBox="0 0 24 24" {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  }
  if (name === 'users') {
    return <svg viewBox="0 0 24 24" {...common}><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15c3.3 0 5 1.7 5.5 5"/></svg>;
  }
  if (name === 'star') {
    return <svg viewBox="0 0 24 24" {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>;
  }
  if (name === 'alert') {
    return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>;
  }
  if (name === 'gift') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M4 10h16v11H4zM3 7h18v3H3zM12 7v14"/><path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7Zm0 0h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z"/></svg>;
  }
  if (name === 'warehouse') {
    return <svg viewBox="0 0 24 24" {...common}><path d="m3 9 9-5 9 5v11H3V9Z"/><path d="M7 20v-7h10v7M7 16h10"/></svg>;
  }
  if (name === 'chart') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/></svg>;
  }
  if (name === 'settings') {
    return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 2.4-2.4 2.4-2.4-1.4-.1-.1a8 8 0 0 1-2 .8V22h-4v-2.8a8 8 0 0 1-2-.8l-.1.1-2.4 1.4-2.4-2.4 1.4-2.4.1-.1a8 8 0 0 1-.8-2H2V9h2.8a8 8 0 0 1 .8-2l-.1-.1-1.4-2.4 2.4-2.4 2.4 1.4.1.1a8 8 0 0 1 2-.8V2h4v2.8a8 8 0 0 1 2 .8l.1-.1 2.4-1.4 2.4 2.4-1.4 2.4-.1.1a8 8 0 0 1 .8 2H22v4h-2.8a8 8 0 0 1-.8 2Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path d="M20.5 4.5C12 4.8 5.4 8.6 4.5 16.2c5.4.8 10.4-.5 13.1-4.1 1.4-1.9 2.3-4.3 2.9-7.6Z"/><path d="M4 20c2.6-5.2 6.4-8.7 11.8-10.5"/></svg>;
}

function iconChoPath(path: string): IconName {
  if (path === '/') return 'home';
  if (path.includes('san-pham') || path.includes('lo-san-pham')) return 'box';
  if (path.includes('danh-muc')) return 'folder';
  if (path.includes('trang-trai') || path.includes('nha-cung-cap') || path.includes('mua-vu') || path.includes('thu-hoach')) return 'farm';
  if (path.includes('don-hang')) return 'order';
  if (path.includes('khach-hang') || path.includes('nhan-vien') || path.includes('phan-quyen')) return 'users';
  if (path.includes('chung-nhan') || path.includes('kiem-dinh')) return 'star';
  if (path.includes('khieu-nai')) return 'alert';
  if (path.includes('khuyen-mai') || path.includes('hoa-hong')) return 'gift';
  if (path.includes('kho') || path.includes('ton-kho')) return 'warehouse';
  if (path.includes('bao-cao') || path.includes('tai-chinh') || path.includes('su-kien')) return 'chart';
  if (path.includes('cau-hinh') || path.includes('audit') || path.includes('nhat-ky-kiem-toan')) return 'settings';
  return 'leaf';
}

function LeafMark() {
  return (
    <svg className={styles.logoMark} viewBox="0 0 72 58" aria-hidden="true">
      <path d="M34.5 51C19 44.8 11.2 32.4 11.1 12.7 27.8 13.1 38.3 20.1 41.6 33.8 38 38 35.8 43.4 34.5 51Z" />
      <path d="M38.4 48.2C37.7 29 46 13.2 61.1 4.7 65.3 21.1 60.7 34.1 47.2 43.8c-3 2.1-5.9 3.6-8.8 4.4Z" />
      <path className={styles.logoVein} d="M34.8 49.3c.7-12.2 6.5-25.3 18.4-36.1M33.5 46.4c-3.2-10.2-7.8-17.4-14.9-23.2" />
    </svg>
  );
}

function nhomLabel(path: string) {
  if (path === '/') return null;
  if (['/nha-cung-cap', '/trang-trai', '/chung-nhan', '/mua-vu', '/nhat-ky-canh-tac', '/thu-hoach', '/lo-san-pham', '/kiem-dinh-chat-luong', '/danh-muc-san-pham', '/san-pham'].includes(path)) return 'Nguồn cung & sản phẩm';
  if (['/kho', '/ton-kho', '/giao-dich-ton-kho', '/bao-cao-ton-kho'].includes(path)) return 'Kho vận';
  if (['/bao-cao-truy-xuat', '/su-kien-truy-xuat', '/don-hang', '/khieu-nai'].includes(path)) return 'Vận hành';
  return 'Hệ thống';
}

export function KhungQuanTri({ children }: KhungQuanTriProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [phien, setPhien] = useState<PhienAdmin | null>(null);
  const [daKhoiTao, setDaKhoiTao] = useState(false);
  const [dangDangXuat, setDangDangXuat] = useState(false);
  const [thuGon, setThuGon] = useState(false);

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
      router.replace(first ?? '/dang-nhap');
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

  const mucHienThi = useMemo(
    () => DIEU_HUONG_ADMIN.filter((item) => coQuyenMoMucAdmin(phien?.quyen ?? [], item)),
    [phien?.quyen],
  );

  if (pathname === '/dang-nhap') return children;

  if (!daKhoiTao || !phien) {
    return (
      <main className={styles.loading}>
        <span className={styles.spinner} />
        <span>Đang kiểm tra phiên quản trị...</span>
      </main>
    );
  }

  let lastGroup: string | null = null;

  return (
    <div className={`${styles.shell} ${thuGon ? styles.shellCollapsed : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <LeafMark />
          {!thuGon ? (
            <div>
              <strong>AgriMarket</strong>
              <span>Admin</span>
            </div>
          ) : null}
        </div>

        <nav className={styles.nav}>
          {mucHienThi.map((item) => {
            const group = nhomLabel(item.path);
            const showGroup = group && group !== lastGroup;
            if (group) lastGroup = group;
            const active = item.path === '/' ? pathname === '/' : pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <div key={item.path}>
                {showGroup && !thuGon ? <div className={styles.navGroup}>{group}</div> : null}
                <Link
                  href={item.path}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  title={thuGon ? item.name : undefined}
                >
                  <span className={styles.navIcon}><Icon name={iconChoPath(item.path)} /></span>
                  {!thuGon ? <span>{item.name}</span> : null}
                </Link>
              </div>
            );
          })}
        </nav>

        {!thuGon ? (
          <div className={styles.sidebarBottom}>
            <div className={styles.greenCard}>
              <LeafMark />
              <strong>Nông sản sạch</strong>
              <span>Cuộc sống xanh</span>
            </div>
          </div>
        ) : null}
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setThuGon((value) => !value)}
            aria-label="Thu gọn menu"
          >
            <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>

          <div className={styles.searchBox}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
            <input placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..." />
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.today}>
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
              <div>
                <span>Hôm nay</span>
                <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
              </div>
            </div>
            <button type="button" className={styles.bellButton} aria-label="Thông báo">
              <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8M10 21h4"/></svg>
            </button>
            <div className={styles.account}>
              <div className={styles.avatar}>{phien.nguoiDung.hoTen.trim().charAt(0).toUpperCase()}</div>
              <div className={styles.accountText}>
                <strong>{phien.nguoiDung.hoTen}</strong>
                <span>Quản trị viên</span>
              </div>
              <button
                type="button"
                className={styles.logoutButton}
                disabled={dangDangXuat}
                onClick={async () => {
                  setDangDangXuat(true);
                  try {
                    await dangXuatAdmin();
                    router.replace('/dang-nhap');
                  } finally {
                    setDangDangXuat(false);
                  }
                }}
              >
                {dangDangXuat ? '...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>

        <footer className={styles.footer}>
          <span>© 2026 AgriMarket. Tất cả quyền được bảo lưu.</span>
          <span>Phiên bản Admin 1.0</span>
        </footer>
      </div>
    </div>
  );
}
