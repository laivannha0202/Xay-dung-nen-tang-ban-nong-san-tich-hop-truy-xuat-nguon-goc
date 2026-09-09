'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { apiLayDashboard, type DashboardAdmin } from '@/lib/api-dashboard';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

import styles from './dashboard.module.css';

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type Tone = 'green' | 'blue' | 'orange' | 'purple';

function KpiIcon({ type }: { type: Tone }) {
  if (type === 'green') {
    return <svg viewBox="0 0 24 24"><path d="M4 6h16l-1.5 9H7L5 3H2"/><circle cx="8" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>;
  }
  if (type === 'blue') {
    return <svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  }
  if (type === 'orange') {
    return <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15c3.3 0 5 1.7 5.5 5"/></svg>;
  }
  return <svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7v10l8 4 8-4V7M12 11v10"/></svg>;
}

function KpiCard({
  title,
  value,
  tone,
  note,
}: {
  title: string;
  value: string;
  tone: Tone;
  note: string;
}) {
  return (
    <article className={`${styles.kpiCard} ${styles[`tone_${tone}`]}`}>
      <div className={styles.kpiIcon}><KpiIcon type={tone} /></div>
      <div className={styles.kpiBody}>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

function OperationalLine({ dashboard }: { dashboard: DashboardAdmin }) {
  const values = [dashboard.donHang, dashboard.khachHang, dashboard.sanPham, dashboard.khieuNai];
  const labels = ['Đơn hàng', 'Khách hàng', 'Sản phẩm', 'Khiếu nại'];
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 42 + index * 170;
    const y = 170 - (value / max) * 115;
    return { x, y, value, label: labels[index]! };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `42,185 ${line} ${points.at(-1)!.x},185`;

  return (
    <div className={styles.chartWrap}>
      <svg viewBox="0 0 560 210" role="img" aria-label="Khối lượng nghiệp vụ">
        <defs>
          <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#42c987" stopOpacity=".32" />
            <stop offset="100%" stopColor="#42c987" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[50, 90, 130, 170].map((y) => <line key={y} x1="28" x2="548" y1={y} y2={y} className={styles.gridLine} />)}
        <polygon points={area} fill="url(#areaGreen)" />
        <polyline points={line} className={styles.lineSeries} />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="5" className={styles.linePoint} />
            <text x={p.x} y="204" textAnchor="middle" className={styles.axisText}>{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function AlertDonut({ dashboard }: { dashboard: DashboardAdmin }) {
  const { sapHetHan, hetHan, tong } = dashboard.canhBaoTonKho;
  const near = tong > 0 ? (sapHetHan / tong) * 100 : 0;
  const expired = tong > 0 ? (hetHan / tong) * 100 : 0;
  const background =
    tong > 0
      ? `conic-gradient(#f3a33b 0 ${near}%, #ef5966 ${near}% ${near + expired}%, #edf1ef ${near + expired}% 100%)`
      : '#edf1ef';

  return (
    <div className={styles.donutArea}>
      <div className={styles.donut} style={{ background }}>
        <div>
          <strong>{tong}</strong>
          <span>cảnh báo</span>
        </div>
      </div>
      <div className={styles.legend}>
        <div><span className={styles.dotOrange} />Sắp hết hạn <strong>{sapHetHan}</strong></div>
        <div><span className={styles.dotRed} />Đã hết hạn <strong>{hetHan}</strong></div>
        <div><span className={styles.dotGreen} />Khiếu nại <strong>{dashboard.khieuNai}</strong></div>
      </div>
    </div>
  );
}

export default function TrangTongQuan() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardAdmin | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');
  const phien = layPhienAdmin();

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;

    let active = true;
    setDangTai(true);
    void apiLayDashboard()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setLoi('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoi(error instanceof Error ? error.message : 'Không tải được Dashboard.');
      })
      .finally(() => {
        if (active) setDangTai(false);
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, lanTai, phien, router]);

  const updated = useMemo(
    () => (dashboard ? new Date(dashboard.capNhatLuc).toLocaleString('vi-VN') : ''),
    [dashboard],
  );

  if (!coQuanLy) {
    return <div className={styles.accessDenied}>Bạn chưa có quyền xem Dashboard toàn hệ thống.</div>;
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Xin chào, {phien?.nguoiDung.hoTen ?? 'Admin'}!</h1>
          <p>Chúc bạn một ngày làm việc hiệu quả. Dưới đây là tổng quan hoạt động của hệ thống AgriMarket.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.dateRange}>
            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
          <button type="button" onClick={() => setLanTai((value) => value + 1)} disabled={dangTai}>
            {dangTai ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </header>

      {loi ? <div className={styles.errorBox}>{loi}</div> : null}

      {!dashboard && dangTai ? (
        <div className={styles.loadingCard}><span /> Đang tải Dashboard...</div>
      ) : null}

      {dashboard ? (
        <>
          <section className={styles.kpiGrid}>
            <KpiCard title="Tổng doanh thu" value={tien.format(dashboard.doanhThu)} tone="green" note="Doanh thu ròng toàn hệ thống" />
            <KpiCard title="Tổng đơn hàng" value={dashboard.donHang.toLocaleString('vi-VN')} tone="blue" note="Tổng số đơn đã ghi nhận" />
            <KpiCard title="Khách hàng hoạt động" value={dashboard.khachHang.toLocaleString('vi-VN')} tone="orange" note="Tài khoản khách đang hoạt động" />
            <KpiCard title="Sản phẩm hoạt động" value={dashboard.sanPham.toLocaleString('vi-VN')} tone="purple" note="Sản phẩm đang được kinh doanh" />
          </section>

          <section className={styles.mainGrid}>
            <article className={`${styles.panel} ${styles.linePanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Khối lượng nghiệp vụ</h2>
                  <p>So sánh các chỉ số vận hành hiện tại</p>
                </div>
                <span className={styles.badge}>Realtime</span>
              </div>
              <OperationalLine dashboard={dashboard} />
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Cảnh báo tồn kho</h2>
                  <p>Theo ngưỡng hệ thống hiện hành</p>
                </div>
              </div>
              <AlertDonut dashboard={dashboard} />
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Tổng quan nhanh</h2>
                  <p>Trạng thái vận hành quan trọng</p>
                </div>
              </div>
              <div className={styles.quickList}>
                <div><span>Doanh thu ròng</span><strong>{tien.format(dashboard.doanhThu)}</strong></div>
                <div><span>Đơn hàng</span><strong>{dashboard.donHang}</strong></div>
                <div><span>Khách hàng</span><strong>{dashboard.khachHang}</strong></div>
                <div><span>Khiếu nại</span><strong>{dashboard.khieuNai}</strong></div>
              </div>
            </article>
          </section>

          <section className={styles.lowerGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Cảnh báo vận hành</h2>
                  <p>Ưu tiên xử lý theo mức độ ảnh hưởng</p>
                </div>
              </div>
              <div className={styles.activityList}>
                <div className={dashboard.canhBaoTonKho.hetHan > 0 ? styles.activityDanger : styles.activityOk}>
                  <span className={styles.activityIcon}>!</span>
                  <div>
                    <strong>{dashboard.canhBaoTonKho.hetHan} lô đã hết hạn</strong>
                    <p>Ưu tiên kiểm tra hàng đã hết hạn còn tồn vật lý.</p>
                  </div>
                </div>
                <div className={dashboard.canhBaoTonKho.sapHetHan > 0 ? styles.activityWarn : styles.activityOk}>
                  <span className={styles.activityIcon}>!</span>
                  <div>
                    <strong>{dashboard.canhBaoTonKho.sapHetHan} lô sắp hết hạn</strong>
                    <p>Kiểm tra kế hoạch xuất kho và điều phối FEFO.</p>
                  </div>
                </div>
                <div className={dashboard.khieuNai > 0 ? styles.activityInfo : styles.activityOk}>
                  <span className={styles.activityIcon}>i</span>
                  <div>
                    <strong>{dashboard.khieuNai} khiếu nại đã ghi nhận</strong>
                    <p>Theo dõi và xử lý theo quy trình chăm sóc khách hàng.</p>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Thông tin hệ thống</h2>
                  <p>Dữ liệu Dashboard lấy trực tiếp từ API</p>
                </div>
              </div>
              <div className={styles.systemInfo}>
                <div><span>Trạng thái API</span><strong className={styles.okText}>● Đã kết nối</strong></div>
                <div><span>Vai trò</span><strong>Quản trị viên</strong></div>
                <div><span>Quyền đang có</span><strong>{phien?.quyen.length ?? 0}</strong></div>
                <div><span>Cập nhật cuối</span><strong>{updated}</strong></div>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
