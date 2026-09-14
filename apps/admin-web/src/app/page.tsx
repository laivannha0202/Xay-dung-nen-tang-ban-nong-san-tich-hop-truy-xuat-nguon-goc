'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiLayBaoCaoDonHangDoanhThu } from '@/lib/api-bao-cao-don-hang-doanh-thu';
import { apiLayBaoCaoHaoHut, apiLayBaoCaoHetHan, apiLayBaoCaoSapHetHan } from '@/lib/api-bao-cao-ton-kho';
import { apiLayBaoCaoTruyXuatThuHoi } from '@/lib/api-bao-cao-truy-xuat';
import { layDanhSach as layDanhSachChungNhan } from '@/lib/api-chung-nhan';
import {
  apiLayDashboard,
  apiLayDoanhThuTheoNgay,
  type DoanhThuNgayDashboard,
} from '@/lib/api-dashboard';
import { layDanhSachDonHangAdmin } from '@/lib/api-don-hang';
import { layDanhSach as layDanhSachKiemDinh } from '@/lib/api-kiem-dinh-chat-luong';
import { layDanhSach as layDanhSachLo } from '@/lib/api-lo-san-pham';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const { RangePicker } = DatePicker;

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const so = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });

type TrangThaiTai = 'dang-tai' | 'loi' | 'xong';

type KetQuaDem = {
  trangThai: TrangThaiTai;
  loi?: string;
  tong?: number;
};

type CanhBaoItem = {
  key: string;
  nhan: string;
  moTa: string;
  href: string;
  severity: 'error' | 'warning' | 'info';
  ketQua: KetQuaDem;
};

type DonHangMoi = Awaited<ReturnType<typeof layDanhSachDonHangAdmin>>['duLieu'][number];
type ThuHoiMoi = Awaited<ReturnType<typeof apiLayBaoCaoTruyXuatThuHoi>>['duLieu'][number];
type SapHetHanMoi = Awaited<ReturnType<typeof apiLayBaoCaoSapHetHan>>['duLieu'][number];

const TRANG_THAI_DON: Record<string, string> = {
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_CHUAN_BI: 'Đang chuẩn bị',
  DA_DONG_GOI: 'Đã đóng gói',
  DANG_GIAO: 'Đang giao',
  DA_GIAO: 'Đã giao',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy',
  KHIEU_NAI: 'Khiếu nại',
  HOAN_TIEN_MOT_PHAN: 'Hoàn tiền một phần',
  HOAN_TIEN_TOAN_BO: 'Hoàn tiền toàn bộ',
};

function ngayUtc(value: Dayjs): string {
  return value.format('YYYY-MM-DD');
}

function macDinhKhoangNgay(): [Dayjs, Dayjs] {
  const den = dayjs();
  return [den.subtract(6, 'day'), den];
}

export default function TrangTongQuan() {
  const router = useRouter();
  const [phien] = useState(() => layPhienAdmin());
  const coQuanLy = coQuyen('phan_quyen.quan_ly');
  const coDonHang = coQuyen('don_hang.xu_ly');
  const coLo = coQuyen('lo_san_pham.xem');
  const coKiemDinh = coQuyen('kiem_dinh_chat_luong.xem');
  const coChungNhan = coQuyen('chung_nhan.xem');
  const coKho = coQuyen('kho.xem');

  const [khoangNgay, setKhoangNgay] = useState<[Dayjs, Dayjs]>(macDinhKhoangNgay);
  const [lanTai, setLanTai] = useState(0);

  const [kpi, setKpi] = useState<Awaited<ReturnType<typeof apiLayDashboard>> | null>(null);
  const [kpiTai, setKpiTai] = useState<TrangThaiTai>('dang-tai');
  const [kpiLoi, setKpiLoi] = useState('');

  const [tongKy, setTongKy] = useState<{
    tongDonHang: number;
    tongMuc: number;
    tongSoLuong: number;
    doanhThuGop: number;
  } | null>(null);
  const [tongKyTai, setTongKyTai] = useState<TrangThaiTai>('dang-tai');
  const [tongKyLoi, setTongKyLoi] = useState('');

  const [theoNgay, setTheoNgay] = useState<DoanhThuNgayDashboard[]>([]);
  const [theoNgayTai, setTheoNgayTai] = useState<TrangThaiTai>('dang-tai');
  const [theoNgayLoi, setTheoNgayLoi] = useState('');

  const [dem, setDem] = useState<Record<string, KetQuaDem>>({});
  const [donMoi, setDonMoi] = useState<DonHangMoi[]>([]);
  const [donMoiTai, setDonMoiTai] = useState<TrangThaiTai>('dang-tai');
  const [donMoiLoi, setDonMoiLoi] = useState('');
  const [thuHoiMoi, setThuHoiMoi] = useState<ThuHoiMoi[]>([]);
  const [thuHoiTai, setThuHoiTai] = useState<TrangThaiTai>('dang-tai');
  const [thuHoiLoi, setThuHoiLoi] = useState('');
  const [hhsTai, setHhsTai] = useState<TrangThaiTai>('dang-tai');
  const [hhsLoi, setHhsLoi] = useState('');
  const [sapHetHanMoi, setSapHetHanMoi] = useState<SapHetHanMoi[]>([]);

  const datDem = useCallback((key: string, ketQua: KetQuaDem) => {
    setDem((prev) => ({ ...prev, [key]: ketQua }));
  }, []);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;

    let active = true;
    const tuNgay = ngayUtc(khoangNgay[0]);
    const denNgay = ngayUtc(khoangNgay[1]);

    setKpiTai('dang-tai');
    setKpiLoi('');
    setTongKyTai('dang-tai');
    setTongKyLoi('');
    setTheoNgayTai('dang-tai');
    setTheoNgayLoi('');
    setDonMoiTai('dang-tai');
    setThuHoiTai('dang-tai');
    setHhsTai('dang-tai');

    void apiLayDashboard()
      .then((data) => {
        if (!active) return;
        setKpi(data);
        setKpiTai('xong');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setKpiLoi(error instanceof Error ? error.message : 'Không tải được KPI tổng quan.');
        setKpiTai('loi');
      });

    void apiLayBaoCaoDonHangDoanhThu({ trang: 1, gioiHan: 1, tuNgay, denNgay })
      .then((data) => {
        if (!active) return;
        setTongKy({
          tongDonHang: data.tongDonHang,
          tongMuc: data.tongMuc,
          tongSoLuong: data.tongSoLuong,
          doanhThuGop: data.doanhThuGop,
        });
        setTongKyTai('xong');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTongKyLoi(error instanceof Error ? error.message : 'Không tải được báo cáo kỳ.');
        setTongKyTai('loi');
      });

    void apiLayDoanhThuTheoNgay(tuNgay, denNgay)
      .then((data) => {
        if (!active) return;
        setTheoNgay(data);
        setTheoNgayTai('xong');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setTheoNgayLoi(error instanceof Error ? error.message : 'Không tải được biểu đồ.');
        setTheoNgayTai('loi');
      });

    const demDonHang = async (key: string, trangThai: string) => {
      datDem(key, { trangThai: 'dang-tai' });
      try {
        const res = await layDanhSachDonHangAdmin({ trang: 1, gioiHan: 1, trangThai: trangThai as never });
        if (active) datDem(key, { trangThai: 'xong', tong: res.tong });
      } catch (error) {
        if (active) {
          datDem(key, {
            trangThai: 'loi',
            loi: error instanceof Error ? error.message : 'Không tải được.',
          });
        }
      }
    };

    const demLo = async (key: string, trangThai: string) => {
      datDem(key, { trangThai: 'dang-tai' });
      try {
        const res = await layDanhSachLo({ trang: 1, gioiHan: 1, trangThai: trangThai as never });
        if (active) datDem(key, { trangThai: 'xong', tong: res.tong });
      } catch (error) {
        if (active) {
          datDem(key, {
            trangThai: 'loi',
            loi: error instanceof Error ? error.message : 'Không tải được.',
          });
        }
      }
    };

    if (coDonHang) {
      void demDonHang('don-cho-thanh-toan', 'CHO_THANH_TOAN');
      void demDonHang('don-dang-chuan-bi', 'DANG_CHUAN_BI');
      void demDonHang('don-khieu-nai', 'KHIEU_NAI');
      void layDanhSachDonHangAdmin({ trang: 1, gioiHan: 5 })
        .then((res) => {
          if (!active) return;
          setDonMoi(res.duLieu);
          setDonMoiTai('xong');
        })
        .catch((error: unknown) => {
          if (!active) return;
          setDonMoiLoi(error instanceof Error ? error.message : 'Không tải được đơn mới.');
          setDonMoiTai('loi');
        });
    } else {
      setDonMoiTai('xong');
    }

    if (coLo) {
      void demLo('lo-cho-kiem-dinh', 'CHO_KIEM_DINH');
      void demLo('lo-tam-giu', 'TAM_GIU');
      void demLo('lo-thu-hoi', 'THU_HOI');
      datDem('thu-hoi', { trangThai: 'dang-tai' });
      void apiLayBaoCaoTruyXuatThuHoi({ trang: 1, gioiHan: 5 })
        .then((res) => {
          if (!active) return;
          setThuHoiMoi(res.duLieu);
          datDem('thu-hoi', { trangThai: 'xong', tong: res.tong });
          setThuHoiTai('xong');
        })
        .catch((error: unknown) => {
          if (!active) return;
          const loi = error instanceof Error ? error.message : 'Không tải được thu hồi.';
          datDem('thu-hoi', { trangThai: 'loi', loi });
          setThuHoiLoi(loi);
          setThuHoiTai('loi');
        });
    } else {
      setThuHoiTai('xong');
    }

    if (coKiemDinh) {
      const demKiemDinh = async (key: string, ketQua: string) => {
        datDem(key, { trangThai: 'dang-tai' });
        try {
          const res = await layDanhSachKiemDinh({ trang: 1, gioiHan: 1, ketQua: ketQua as never });
          if (active) datDem(key, { trangThai: 'xong', tong: res.tong });
        } catch (error) {
          if (active) {
            datDem(key, {
              trangThai: 'loi',
              loi: error instanceof Error ? error.message : 'Không tải được.',
            });
          }
        }
      };
      void demKiemDinh('kiem-dinh-hold', 'HOLD');
      void demKiemDinh('kiem-dinh-failed', 'FAILED');
    }

    if (coChungNhan) {
      datDem('chung-nhan-cho', { trangThai: 'dang-tai' });
      void layDanhSachChungNhan({ trang: 1, gioiHan: 1, trangThaiXacMinh: 'CHO_XAC_MINH' })
        .then((res) => {
          if (active) datDem('chung-nhan-cho', { trangThai: 'xong', tong: res.tong });
        })
        .catch((error: unknown) => {
          if (active) {
            datDem('chung-nhan-cho', {
              trangThai: 'loi',
              loi: error instanceof Error ? error.message : 'Không tải được.',
            });
          }
        });
    }

    if (coKho) {
      datDem('hao-hut', { trangThai: 'dang-tai' });
      void apiLayBaoCaoHaoHut({ trang: 1, gioiHan: 1 })
        .then((res) => {
          if (active) datDem('hao-hut', { trangThai: 'xong', tong: res.tong });
        })
        .catch((error: unknown) => {
          if (active) {
            datDem('hao-hut', {
              trangThai: 'loi',
              loi: error instanceof Error ? error.message : 'Không tải được.',
            });
          }
        });
      void apiLayBaoCaoSapHetHan({ trang: 1, gioiHan: 5 })
        .then((res) => {
          if (!active) return;
          setSapHetHanMoi(res.duLieu);
          setHhsTai('xong');
        })
        .catch((error: unknown) => {
          if (!active) return;
          setHhsLoi(error instanceof Error ? error.message : 'Không tải được cảnh báo HSD.');
          setHhsTai('loi');
        });
    } else {
      setHhsTai('xong');
    }

    return () => {
      active = false;
    };
  }, [coChungNhan, coDonHang, coKiemDinh, coKho, coLo, coQuanLy, datDem, khoangNgay, lanTai, phien, router]);

  const canhBao: CanhBaoItem[] = useMemo(() => {
    const items: CanhBaoItem[] = [];
    if (coDonHang) {
      items.push(
        {
          key: 'don-khieu-nai',
          nhan: 'Đơn khiếu nại',
          moTa: 'Đơn ở trạng thái KHIEU_NAI cần xử lý.',
          href: '/don-hang',
          severity: 'error',
          ketQua: dem['don-khieu-nai'] ?? { trangThai: 'dang-tai' },
        },
        {
          key: 'don-cho-thanh-toan',
          nhan: 'Đơn chờ thanh toán',
          moTa: 'Đơn ở trạng thái CHO_THANH_TOAN.',
          href: '/don-hang',
          severity: 'warning',
          ketQua: dem['don-cho-thanh-toan'] ?? { trangThai: 'dang-tai' },
        },
        {
          key: 'don-dang-chuan-bi',
          nhan: 'Đơn đang chuẩn bị',
          moTa: 'Đơn ở trạng thái DANG_CHUAN_BI chờ hoàn tất đóng gói.',
          href: '/don-hang',
          severity: 'warning',
          ketQua: dem['don-dang-chuan-bi'] ?? { trangThai: 'dang-tai' },
        },
      );
    }
    if (coLo) {
      items.push(
        {
          key: 'lo-cho-kiem-dinh',
          nhan: 'Lô chờ kiểm định',
          moTa: 'Lô ở trạng thái CHO_KIEM_DINH.',
          href: '/lo-san-pham',
          severity: 'warning',
          ketQua: dem['lo-cho-kiem-dinh'] ?? { trangThai: 'dang-tai' },
        },
        {
          key: 'lo-tam-giu',
          nhan: 'Lô tạm giữ',
          moTa: 'Lô ở trạng thái TAM_GIU.',
          href: '/lo-san-pham',
          severity: 'error',
          ketQua: dem['lo-tam-giu'] ?? { trangThai: 'dang-tai' },
        },
        {
          key: 'lo-thu-hoi',
          nhan: 'Lô đã thu hồi',
          moTa: 'Lô ở trạng thái THU_HOI, xem đơn ảnh hưởng tại báo cáo truy xuất.',
          href: '/bao-cao-truy-xuat',
          severity: 'error',
          ketQua: dem['lo-thu-hoi'] ?? { trangThai: 'dang-tai' },
        },
      );
    }
    if (coKiemDinh) {
      items.push(
        {
          key: 'kiem-dinh-hold',
          nhan: 'Kiểm định HOLD',
          moTa: 'Kết quả kiểm định đang giữ.',
          href: '/kiem-dinh-chat-luong',
          severity: 'warning',
          ketQua: dem['kiem-dinh-hold'] ?? { trangThai: 'dang-tai' },
        },
        {
          key: 'kiem-dinh-failed',
          nhan: 'Kiểm định FAILED',
          moTa: 'Kết quả kiểm định không đạt.',
          href: '/kiem-dinh-chat-luong',
          severity: 'error',
          ketQua: dem['kiem-dinh-failed'] ?? { trangThai: 'dang-tai' },
        },
      );
    }
    if (coChungNhan) {
      items.push({
        key: 'chung-nhan-cho',
        nhan: 'Chứng nhận chờ xác minh',
        moTa: 'Chứng nhận ở trạng thái CHO_XAC_MINH.',
        href: '/chung-nhan',
        severity: 'warning',
        ketQua: dem['chung-nhan-cho'] ?? { trangThai: 'dang-tai' },
      });
    }
    if (coKho) {
      items.push({
        key: 'hao-hut',
        nhan: 'Giao dịch hao hụt',
        moTa: 'Ledger DAMAGE/EXPIRE toàn hệ thống.',
        href: '/bao-cao-ton-kho',
        severity: 'info',
        ketQua: dem['hao-hut'] ?? { trangThai: 'dang-tai' },
      });
    }
    return items;
  }, [coChungNhan, coDonHang, coKiemDinh, coKho, coLo, dem]);

  const pieTonKho = useMemo(
    () =>
      kpi
        ? [
            { loai: 'Sắp hết hạn', giaTri: kpi.canhBaoTonKho.sapHetHan },
            { loai: 'Đã hết hạn', giaTri: kpi.canhBaoTonKho.hetHan },
          ].filter((item) => item.giaTri > 0)
        : [],
    [kpi],
  );

  if (!coQuanLy) {
    return (
      <PageContainer title="Tổng quan vận hành">
        <Alert type="warning" showIcon message="Bạn chưa có quyền xem tổng quan vận hành." />
      </PageContainer>
    );
  }

  const tuNgay = ngayUtc(khoangNgay[0]);
  const denNgay = ngayUtc(khoangNgay[1]);

  return (
    <PageContainer
      title="Tổng quan vận hành"
      subTitle="Số liệu vận hành thực tế từ các báo cáo backend."
      extra={[
        <RangePicker
          key="range"
          value={khoangNgay}
          onChange={(values) => {
            if (values?.[0] && values?.[1]) setKhoangNgay([values[0], values[1]]);
          }}
          format="DD/MM/YYYY"
          allowClear={false}
        />,
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={() => setLanTai((value) => value + 1)}
        >
          Làm mới
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Kỳ báo cáo: {tuNgay} → {denNgay} (ngày UTC, inclusive). KPI hệ thống bên dưới là toàn thời
          gian, không theo kỳ.
        </Typography.Text>

        <ProCard bordered title="Cần chú ý vận hành">
          <Row gutter={[12, 12]}>
            {canhBao.map((item) => (
              <Col key={item.key} xs={24} sm={12} xl={8}>
                <ProCard bordered size="small">
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Typography.Text strong>{item.nhan}</Typography.Text>
                      <Link href={item.href}>Xử lý</Link>
                    </Space>
                    {item.ketQua.trangThai === 'dang-tai' ? (
                      <Spin size="small" tip="Đang tải..." />
                    ) : item.ketQua.trangThai === 'loi' ? (
                      <Typography.Text type="danger">
                        Không tải được: {item.ketQua.loi}
                      </Typography.Text>
                    ) : (item.ketQua.tong ?? 0) > 0 ? (
                      <Alert
                        type={item.severity}
                        showIcon
                        message={`${so.format(item.ketQua.tong ?? 0)} mục`}
                        description={item.moTa}
                      />
                    ) : (
                      <Typography.Text type="secondary">Không có mục nào.</Typography.Text>
                    )}
                  </Space>
                </ProCard>
              </Col>
            ))}
            {kpi && coKho ? (
              <>
                <Col xs={24} sm={12} xl={8}>
                  <ProCard bordered size="small">
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text strong>Tồn kho sắp hết hạn</Typography.Text>
                        <Link href="/bao-cao-ton-kho">Xử lý</Link>
                      </Space>
                      {kpi.canhBaoTonKho.sapHetHan > 0 ? (
                        <Alert
                          type="warning"
                          showIcon
                          message={`${so.format(kpi.canhBaoTonKho.sapHetHan)} dòng tồn`}
                          description="Ngưỡng sắp hết hạn theo cấu hình hệ thống."
                        />
                      ) : (
                        <Typography.Text type="secondary">Không có mục nào.</Typography.Text>
                      )}
                    </Space>
                  </ProCard>
                </Col>
                <Col xs={24} sm={12} xl={8}>
                  <ProCard bordered size="small">
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text strong>Tồn kho đã hết hạn</Typography.Text>
                        <Link href="/bao-cao-ton-kho">Xử lý</Link>
                      </Space>
                      {kpi.canhBaoTonKho.hetHan > 0 ? (
                        <Alert
                          type="error"
                          showIcon
                          message={`${so.format(kpi.canhBaoTonKho.hetHan)} dòng tồn`}
                          description="Ưu tiên kiểm tra hàng hết hạn còn tồn vật lý."
                        />
                      ) : (
                        <Typography.Text type="secondary">Không có mục nào.</Typography.Text>
                      )}
                    </Space>
                  </ProCard>
                </Col>
              </>
            ) : null}
          </Row>
        </ProCard>

        <ProCard
          bordered
          title={`Đơn hàng & doanh thu kỳ ${tuNgay} → ${denNgay}`}
          extra={<Link href="/bao-cao-don-hang-doanh-thu">Mở báo cáo chi tiết</Link>}
        >
          {tongKyTai === 'dang-tai' ? (
            <Space style={{ width: '100%', minHeight: 120, justifyContent: 'center' }}>
              <Spin />
              <Typography.Text type="secondary">Đang tải báo cáo kỳ...</Typography.Text>
            </Space>
          ) : tongKyTai === 'loi' ? (
            <Alert
              type="error"
              showIcon
              message="Không tải được báo cáo kỳ"
              description={tongKyLoi}
              action={
                <Button size="small" onClick={() => setLanTai((value) => value + 1)}>
                  Thử lại
                </Button>
              }
            />
          ) : tongKy ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} xl={6}>
                  <Statistic title="Doanh thu gộp kỳ" value={tien.format(tongKy.doanhThuGop)} />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Gross của đơn có thanh toán thành công; chưa trừ hoàn tiền payment-level.
                  </Typography.Text>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Statistic title="Đơn hàng phân biệt" value={tongKy.tongDonHang} />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Số parent order sau filter.
                  </Typography.Text>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Statistic title="Dòng sản phẩm" value={tongKy.tongMuc} />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <Statistic title="Tổng số lượng" value={tongKy.tongSoLuong} />
                </Col>
              </Row>
              {theoNgayTai === 'dang-tai' ? (
                <Space style={{ width: '100%', minHeight: 200, justifyContent: 'center' }}>
                  <Spin />
                  <Typography.Text type="secondary">Đang tải biểu đồ...</Typography.Text>
                </Space>
              ) : theoNgayTai === 'loi' ? (
                <Alert type="error" showIcon message="Không tải được biểu đồ" description={theoNgayLoi} />
              ) : theoNgay.every((d) => d.doanhThu === 0) ? (
                <Typography.Text type="secondary">
                  Chưa có doanh thu trong kỳ đã chọn.
                </Typography.Text>
              ) : (
                <Column
                  data={theoNgay}
                  xField="nhan"
                  yField="doanhThu"
                  height={260}
                  axis={{
                    y: {
                      labelFormatter: (value: string | number) =>
                        Number(value).toLocaleString('vi-VN'),
                    },
                  }}
                  tooltip={{ title: 'ngay' }}
                />
              )}
            </Space>
          ) : null}
        </ProCard>

        <Row gutter={[14, 14]}>
          <Col xs={24} xl={15}>
            <ProCard bordered title="KPI toàn hệ thống" subTitle="Không theo kỳ báo cáo">
              {kpiTai === 'dang-tai' ? (
                <Space style={{ width: '100%', minHeight: 160, justifyContent: 'center' }}>
                  <Spin />
                  <Typography.Text type="secondary">Đang tải KPI...</Typography.Text>
                </Space>
              ) : kpiTai === 'loi' ? (
                <Alert type="error" showIcon message="Không tải được KPI" description={kpiLoi} />
              ) : kpi ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={12}>
                      <Statistic title="Doanh thu thuần" value={tien.format(kpi.doanhThu)} />
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        Thanh toán thành công trừ hoàn tiền thành công.
                      </Typography.Text>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Tổng đơn hàng" value={kpi.donHang} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Khách hàng hoạt động" value={kpi.khachHang} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Sản phẩm hoạt động" value={kpi.sanPham} />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Khiếu nại đã ghi nhận" value={kpi.khieuNai} />
                    </Col>
                  </Row>
                  <Descriptions
                    column={1}
                    size="small"
                    items={[
                      {
                        key: 'updated',
                        label: 'Dữ liệu lúc',
                        children: new Date(kpi.capNhatLuc).toLocaleString('vi-VN'),
                      },
                    ]}
                  />
                </Space>
              ) : null}
            </ProCard>
          </Col>
          <Col xs={24} xl={9}>
            <ProCard bordered title="Cơ cấu cảnh báo tồn kho" extra={<Link href="/bao-cao-ton-kho">Chi tiết</Link>}>
              {kpiTai === 'dang-tai' ? (
                <Space style={{ width: '100%', minHeight: 200, justifyContent: 'center' }}>
                  <Spin />
                </Space>
              ) : kpiTai === 'loi' ? (
                <Alert type="error" showIcon message="Không tải được cảnh báo" description={kpiLoi} />
              ) : pieTonKho.length ? (
                <Pie
                  data={pieTonKho}
                  angleField="giaTri"
                  colorField="loai"
                  innerRadius={0.62}
                  height={260}
                  label={{ text: 'loai', position: 'outside' }}
                  legend={{ color: { position: 'bottom' } }}
                  annotations={[
                    {
                      type: 'text',
                      style: {
                        text: `${kpi?.canhBaoTonKho.tong}\ncảnh báo`,
                        x: '50%',
                        y: '50%',
                        textAlign: 'center',
                        fontSize: 18,
                        fontWeight: 700,
                      },
                    },
                  ]}
                />
              ) : (
                <Typography.Text type="secondary">Không có cảnh báo tồn kho.</Typography.Text>
              )}
            </ProCard>
          </Col>
        </Row>

        <Row gutter={[14, 14]}>
          {coDonHang ? (
            <Col xs={24} xl={8}>
              <ProCard bordered title="Đơn mới nhất" extra={<Link href="/don-hang">Tất cả đơn</Link>}>
                {donMoiTai === 'dang-tai' ? (
                  <Space style={{ width: '100%', justifyContent: 'center', padding: 24 }}>
                    <Spin />
                  </Space>
                ) : donMoiTai === 'loi' ? (
                  <Alert type="error" showIcon message="Không tải được" description={donMoiLoi} />
                ) : donMoi.length ? (
                  <Table<DonHangMoi>
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={donMoi}
                    columns={[
                      {
                        title: 'Mã đơn',
                        dataIndex: 'maDonHang',
                        render: (value: string) => (
                          <Typography.Text strong style={{ fontSize: 12 }}>
                            {value}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'trangThai',
                        render: (value: string) => <Tag>{TRANG_THAI_DON[value] ?? value}</Tag>,
                      },
                      {
                        title: 'Tổng tiền',
                        dataIndex: 'tongTien',
                        align: 'right',
                        render: (value: number) => tien.format(Number(value)),
                      },
                    ]}
                  />
                ) : (
                  <Typography.Text type="secondary">Chưa có dữ liệu.</Typography.Text>
                )}
              </ProCard>
            </Col>
          ) : null}
          {coLo ? (
            <Col xs={24} xl={8}>
              <ProCard bordered title="Thu hồi mới nhất" extra={<Link href="/bao-cao-truy-xuat">Báo cáo truy xuất</Link>}>
                {thuHoiTai === 'dang-tai' ? (
                  <Space style={{ width: '100%', justifyContent: 'center', padding: 24 }}>
                    <Spin />
                  </Space>
                ) : thuHoiTai === 'loi' ? (
                  <Alert type="error" showIcon message="Không tải được" description={thuHoiLoi} />
                ) : thuHoiMoi.length ? (
                  <Table<ThuHoiMoi>
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={thuHoiMoi}
                    columns={[
                      {
                        title: 'Mã lô',
                        dataIndex: 'maLo',
                        render: (value: string) => (
                          <Typography.Text strong style={{ fontSize: 12 }}>
                            {value}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Đơn ảnh hưởng',
                        dataIndex: 'soDonHangAnhHuong',
                        align: 'right',
                      },
                      {
                        title: 'Thu hồi lúc',
                        dataIndex: 'thuHoiLuc',
                        render: (value: string) => new Date(value).toLocaleString('vi-VN'),
                      },
                    ]}
                  />
                ) : (
                  <Typography.Text type="secondary">Chưa có dữ liệu.</Typography.Text>
                )}
              </ProCard>
            </Col>
          ) : null}
          {coKho ? (
            <Col xs={24} xl={8}>
              <ProCard bordered title="Sắp hết hạn mới nhất" extra={<Link href="/bao-cao-ton-kho">Báo cáo tồn kho</Link>}>
                {hhsTai === 'dang-tai' ? (
                  <Space style={{ width: '100%', justifyContent: 'center', padding: 24 }}>
                    <Spin />
                  </Space>
                ) : hhsTai === 'loi' ? (
                  <Alert type="error" showIcon message="Không tải được" description={hhsLoi} />
                ) : sapHetHanMoi.length ? (
                  <Table<SapHetHanMoi>
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={sapHetHanMoi}
                    columns={[
                      {
                        title: 'Lô',
                        dataIndex: ['loSanPham', 'maLo'],
                        render: (_: unknown, row: SapHetHanMoi) => (
                          <Typography.Text strong style={{ fontSize: 12 }}>
                            {row.loSanPham.maLo}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Còn lại',
                        dataIndex: 'soNgayConLai',
                        align: 'right',
                        render: (value: number) => (
                          <Tag color={value < 0 ? 'red' : 'orange'}>{value} ngày</Tag>
                        ),
                      },
                      {
                        title: 'Available',
                        dataIndex: 'available',
                        align: 'right',
                        render: (value: number) => so.format(Number(value)),
                      },
                    ]}
                  />
                ) : (
                  <Typography.Text type="secondary">Chưa có dữ liệu.</Typography.Text>
                )}
              </ProCard>
            </Col>
          ) : null}
        </Row>
      </Space>
    </PageContainer>
  );
}
