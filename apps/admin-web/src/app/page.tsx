'use client';

import { usePhienAdmin } from '@/lib/use-phien-admin';
import { dinhDangNgayGio, dinhDangTien } from '@/lib/dinh-dang';

import { ReloadOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
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
import { useCallback, useEffect, useState } from 'react';

import { apiLayBaoCaoDonHangDoanhThu } from '@/lib/api-bao-cao-don-hang-doanh-thu';
import { layDanhSach as layDanhSachChungNhan } from '@/lib/api-chung-nhan';
import {
  apiLayDashboard,
  apiLayDoanhThuTheoNgay,
  type DoanhThuNgayDashboard,
} from '@/lib/api-dashboard';
import { layDanhSachDonHangAdmin } from '@/lib/api-don-hang';
import { layDanhSach as layDanhSachKiemDinh } from '@/lib/api-kiem-dinh-chat-luong';
import { layDanhSach as layDanhSachLo } from '@/lib/api-lo-san-pham';

const { RangePicker } = DatePicker;

const TRANG_THAI_DON: Record<string, { text: string; color: string }> = {
  CHO_THANH_TOAN: { text: 'Chờ thanh toán', color: 'gold' },
  DA_XAC_NHAN: { text: 'Đã xác nhận', color: 'blue' },
  DANG_CHUAN_BI: { text: 'Đang chuẩn bị', color: 'blue' },
  DA_DONG_GOI: { text: 'Đã đóng gói', color: 'cyan' },
  DANG_GIAO: { text: 'Đang giao', color: 'geekblue' },
  DA_GIAO: { text: 'Đã giao', color: 'green' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'green' },
  DA_HUY: { text: 'Đã hủy', color: 'red' },
  KHIEU_NAI: { text: 'Khiếu nại', color: 'volcano' },
  HOAN_TIEN_MOT_PHAN: { text: 'Hoàn tiền một phần', color: 'orange' },
  HOAN_TIEN_TOAN_BO: { text: 'Hoàn tiền toàn bộ', color: 'orange' },
};

function nhanDonHang(value: string): { text: string; color: string } {
  return TRANG_THAI_DON[value] ?? { text: value, color: 'default' };
}

function ngayBaoCao(value: Dayjs): string {
  return value.format('YYYY-MM-DD');
}

function macDinhKhoangNgay(): [Dayjs, Dayjs] {
  const den = dayjs();
  return [den.subtract(6, 'day'), den];
}

type TrangThaiTai = 'dang-tai' | 'loi' | 'xong';

type DonHangMoi = Awaited<ReturnType<typeof layDanhSachDonHangAdmin>>['duLieu'][number];

type ViecCanXuLy = {
  key: string;
  nhan: string;
  tong: number;
  href: string;
  color: 'red' | 'orange';
};

export default function TrangTongQuan() {
  const { phien } = usePhienAdmin();
  const coQuyenPhien = (maQuyen: string) => phien?.quyen.includes(maQuyen) ?? false;
  const coQuanLy = coQuyenPhien('phan_quyen.quan_ly');
  const coDonHang = coQuyenPhien('don_hang.xu_ly');
  const coLo = coQuyenPhien('lo_san_pham.xem');
  const coKiemDinh = coQuyenPhien('kiem_dinh_chat_luong.xem');
  const coChungNhan = coQuyenPhien('chung_nhan.xem');
  const coKho = coQuyenPhien('kho.xem');

  const [khoangNgay, setKhoangNgay] = useState<[Dayjs, Dayjs]>(macDinhKhoangNgay);
  const [lanTai, setLanTai] = useState(0);

  const [kpi, setKpi] = useState<Awaited<ReturnType<typeof apiLayDashboard>> | null>(null);
  const [kpiTai, setKpiTai] = useState<TrangThaiTai>('dang-tai');
  const [kpiLoi, setKpiLoi] = useState('');

  const [tongKy, setTongKy] = useState<{ tongDonHang: number; doanhThuGop: number } | null>(null);
  const [tongKyTai, setTongKyTai] = useState<TrangThaiTai>('dang-tai');
  const [tongKyLoi, setTongKyLoi] = useState('');

  const [theoNgay, setTheoNgay] = useState<DoanhThuNgayDashboard[]>([]);
  const [theoNgayTai, setTheoNgayTai] = useState<TrangThaiTai>('dang-tai');
  const [theoNgayLoi, setTheoNgayLoi] = useState('');

  const [dem, setDem] = useState<Record<string, number>>({});
  const [demTai, setDemTai] = useState<TrangThaiTai>('dang-tai');

  const [donMoi, setDonMoi] = useState<DonHangMoi[]>([]);
  const [donMoiTai, setDonMoiTai] = useState<TrangThaiTai>('dang-tai');
  const [donMoiLoi, setDonMoiLoi] = useState('');

  const datDem = useCallback((key: string, tong: number) => {
    setDem((prev) => ({ ...prev, [key]: tong }));
  }, []);

  useEffect(() => {
    if (!phien) return;
    if (!coQuanLy) return;

    let active = true;
    const tuNgay = ngayBaoCao(khoangNgay[0]);
    const denNgay = ngayBaoCao(khoangNgay[1]);

    setKpiTai('dang-tai');
    setKpiLoi('');
    setTongKyTai('dang-tai');
    setTongKyLoi('');
    setTheoNgayTai('dang-tai');
    setTheoNgayLoi('');
    setDonMoiTai('dang-tai');
    setDemTai('dang-tai');

    void apiLayDashboard()
      .then((data) => {
        if (!active) return;
        setKpi(data);
        setKpiTai('xong');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setKpiLoi(error instanceof Error ? error.message : 'Không tải được KPI.');
        setKpiTai('loi');
      });

    void apiLayBaoCaoDonHangDoanhThu({ trang: 1, gioiHan: 1, tuNgay, denNgay })
      .then((data) => {
        if (!active) return;
        setTongKy({ tongDonHang: data.tongDonHang, doanhThuGop: data.doanhThuGop });
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
      try {
        const res = await layDanhSachDonHangAdmin({
          trang: 1,
          gioiHan: 1,
          trangThai: trangThai as never,
        });
        if (active) datDem(key, res.tong);
      } catch {
        if (active) datDem(key, 0);
      }
    };

    const demLo = async (key: string, trangThai: string) => {
      try {
        const res = await layDanhSachLo({ trang: 1, gioiHan: 1, trangThai: trangThai as never });
        if (active) datDem(key, res.tong);
      } catch {
        if (active) datDem(key, 0);
      }
    };

    const demKiemDinh = async (key: string, ketQua: string) => {
      try {
        const res = await layDanhSachKiemDinh({ trang: 1, gioiHan: 1, ketQua: ketQua as never });
        if (active) datDem(key, res.tong);
      } catch {
        if (active) datDem(key, 0);
      }
    };

    const taiViecCanXuLy = async () => {
      const viec: Array<Promise<void>> = [];
      if (coDonHang) {
        viec.push(demDonHang('don-cho-thanh-toan', 'CHO_THANH_TOAN'));
        viec.push(demDonHang('don-dang-chuan-bi', 'DANG_CHUAN_BI'));
        viec.push(demDonHang('don-khieu-nai', 'KHIEU_NAI'));
      }
      if (coLo) {
        viec.push(demLo('lo-cho-kiem-dinh', 'CHO_KIEM_DINH'));
        viec.push(demLo('lo-tam-giu', 'TAM_GIU'));
        viec.push(demLo('lo-thu-hoi', 'THU_HOI'));
      }
      if (coKiemDinh) {
        viec.push(demKiemDinh('kiem-dinh-hold', 'HOLD'));
        viec.push(demKiemDinh('kiem-dinh-failed', 'FAILED'));
      }
      if (coChungNhan) {
        viec.push(
          (async () => {
            try {
              const res = await layDanhSachChungNhan({
                trang: 1,
                gioiHan: 1,
                trangThaiXacMinh: 'CHO_XAC_MINH',
              });
              if (active) datDem('chung-nhan-cho', res.tong);
            } catch {
              if (active) datDem('chung-nhan-cho', 0);
            }
          })(),
        );
      }
      await Promise.all(viec);
      if (active) setDemTai('xong');
    };
    void taiViecCanXuLy();

    if (coDonHang) {
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

    return () => {
      active = false;
    };
  }, [coChungNhan, coDonHang, coKiemDinh, coLo, coQuanLy, datDem, khoangNgay, lanTai, phien]);

  if (!coQuanLy) {
    return (
      <PageContainer title="Tổng quan">
        <Alert type="warning" showIcon message="Bạn chưa có quyền xem tổng quan." />
      </PageContainer>
    );
  }

  const donCanXuLy =
    (dem['don-cho-thanh-toan'] ?? 0) + (dem['don-dang-chuan-bi'] ?? 0) + (dem['don-khieu-nai'] ?? 0);
  const canhBaoTon = (kpi?.canhBaoTonKho.sapHetHan ?? 0) + (kpi?.canhBaoTonKho.hetHan ?? 0);
  const thuHoi = dem['lo-thu-hoi'] ?? 0;

  const danhSachViec: ViecCanXuLy[] = [
    { key: 'don-cho-thanh-toan', nhan: 'Đơn chờ thanh toán', tong: dem['don-cho-thanh-toan'] ?? 0, href: '/don-hang', color: 'orange' as const },
    { key: 'don-dang-chuan-bi', nhan: 'Đơn đang chuẩn bị', tong: dem['don-dang-chuan-bi'] ?? 0, href: '/don-hang', color: 'orange' },
    { key: 'don-khieu-nai', nhan: 'Đơn khiếu nại', tong: dem['don-khieu-nai'] ?? 0, href: '/don-hang', color: 'red' },
    { key: 'lo-cho-kiem-dinh', nhan: 'Lô chờ kiểm định', tong: dem['lo-cho-kiem-dinh'] ?? 0, href: '/lo-san-pham', color: 'orange' },
    { key: 'lo-tam-giu', nhan: 'Lô tạm giữ', tong: dem['lo-tam-giu'] ?? 0, href: '/lo-san-pham', color: 'red' },
    { key: 'kiem-dinh-hold', nhan: 'Kiểm định tạm giữ', tong: dem['kiem-dinh-hold'] ?? 0, href: '/kiem-dinh-chat-luong', color: 'orange' },
    { key: 'kiem-dinh-failed', nhan: 'Kiểm định không đạt', tong: dem['kiem-dinh-failed'] ?? 0, href: '/kiem-dinh-chat-luong', color: 'red' },
    { key: 'chung-nhan-cho', nhan: 'Chứng nhận chờ xác minh', tong: dem['chung-nhan-cho'] ?? 0, href: '/chung-nhan', color: 'orange' },
    ...(coKho && kpi
      ? [
          { key: 'ton-sap-het-han', nhan: 'Tồn kho sắp hết hạn', tong: kpi.canhBaoTonKho.sapHetHan, href: '/bao-cao-ton-kho', color: 'orange' },
          { key: 'ton-het-han', nhan: 'Tồn kho hết hạn', tong: kpi.canhBaoTonKho.hetHan, href: '/bao-cao-ton-kho', color: 'red' },
        ]
      : []),
  ].filter((item) => item.tong > 0) as ViecCanXuLy[];

  const dangTaiKpi = kpiTai === 'dang-tai' || tongKyTai === 'dang-tai';

  return (
    <PageContainer
      title="Tổng quan"
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
          {khoangNgay[0].format('DD/MM/YYYY')} – {khoangNgay[1].format('DD/MM/YYYY')}
        </Typography.Text>

        {kpiTai === 'loi' || tongKyTai === 'loi' ? (
          <Alert
            type="error"
            showIcon
            message="Không tải được dữ liệu tổng quan"
            description={kpiLoi || tongKyLoi}
          />
        ) : null}

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={dangTaiKpi}>
              <Statistic title="Doanh thu gộp kỳ" value={dinhDangTien(tongKy?.doanhThuGop ?? 0)} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={dangTaiKpi}>
              <Statistic title="Đơn hàng kỳ" value={tongKy?.tongDonHang ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={demTai === 'dang-tai'}>
              <Statistic title="Đơn cần xử lý" value={donCanXuLy} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card loading={kpiTai === 'dang-tai'}>
              <Statistic title="Cảnh báo tồn kho" value={canhBaoTon} />
            </Card>
          </Col>
        </Row>

        <ProCard bordered title="Doanh thu theo ngày" extra={<Link href="/bao-cao-don-hang-doanh-thu">Báo cáo</Link>}>
          {theoNgayTai === 'dang-tai' ? (
            <Space style={{ width: '100%', minHeight: 200, justifyContent: 'center' }}>
              <Spin />
            </Space>
          ) : theoNgayTai === 'loi' ? (
            <Alert type="error" showIcon message="Không tải được biểu đồ" description={theoNgayLoi} />
          ) : theoNgay.every((d) => d.doanhThu === 0) ? (
            <Typography.Text type="secondary">Chưa có doanh thu trong kỳ đã chọn.</Typography.Text>
          ) : (
            <Column
              data={theoNgay}
              xField="nhan"
              yField="doanhThu"
              height={240}
              axis={{
                y: {
                  labelFormatter: (value: string | number) =>
                    Number(value).toLocaleString('vi-VN'),
                },
              }}
              tooltip={{ title: 'ngay' }}
            />
          )}
        </ProCard>

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={12}>
            <ProCard bordered title="Việc cần xử lý">
              {demTai === 'dang-tai' ? (
                <Space style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
                  <Spin />
                </Space>
              ) : danhSachViec.length === 0 ? (
                <Typography.Text type="secondary">Không có việc cần xử lý.</Typography.Text>
              ) : (
                <Table<ViecCanXuLy>
                  rowKey="key"
                  size="small"
                  pagination={false}
                  showHeader={false}
                  dataSource={danhSachViec}
                  columns={[
                    {
                      dataIndex: 'nhan',
                      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
                    },
                    {
                      dataIndex: 'tong',
                      align: 'right',
                      width: 90,
                      render: (value: number, row: ViecCanXuLy) => (
                        <Tag color={row.color === 'red' ? 'red' : 'orange'}>{value}</Tag>
                      ),
                    },
                    {
                      width: 80,
                      align: 'right',
                      render: (_, row: ViecCanXuLy) => <Link href={row.href}>Xử lý</Link>,
                    },
                  ]}
                />
              )}
              {coKho && thuHoi > 0 ? (
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Thu hồi: {thuHoi} lô (<Link href="/bao-cao-truy-xuat">Báo cáo truy xuất</Link>)
                </Typography.Text>
              ) : null}
            </ProCard>
          </Col>
          <Col xs={24} xl={12}>
            <ProCard bordered title="Đơn hàng gần đây" extra={<Link href="/don-hang">Tất cả đơn</Link>}>
              {donMoiTai === 'dang-tai' ? (
                <Space style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
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
                  scroll={{ x: 640 }}
                  columns={[
                    { title: 'Mã đơn', dataIndex: 'maDonHang', width: 130, ellipsis: true },
                    {
                      title: 'Khách hàng',
                      width: 170,
                      ellipsis: true,
                      render: (_, row) => row.khachHang.hoTen,
                    },
                    {
                      title: 'Tổng tiền',
                      dataIndex: 'tongTien',
                      align: 'right',
                      width: 130,
                      render: (value: number) => dinhDangTien(Number(value)),
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'trangThai',
                      width: 140,
                      render: (value: string) => {
                        const nhan = nhanDonHang(value);
                        return <Tag color={nhan.color}>{nhan.text}</Tag>;
                      },
                    },
                    {
                      title: 'Thời gian',
                      dataIndex: 'createdAt',
                      width: 140,
                      render: (value: string) => dinhDangNgayGio(value),
                    },
                    {
                      title: 'Xem',
                      width: 60,
                      align: 'center',
                      render: () => <Link href="/don-hang">Xem</Link>,
                    },
                  ]}
                />
              ) : (
                <Typography.Text type="secondary">Chưa có dữ liệu.</Typography.Text>
              )}
            </ProCard>
          </Col>
        </Row>

        <ProCard bordered title="Toàn hệ thống">
          {kpiTai === 'dang-tai' ? (
            <Space style={{ width: '100%', justifyContent: 'center', padding: 16 }}>
              <Spin />
            </Space>
          ) : kpi ? (
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Statistic title="Sản phẩm hoạt động" value={kpi.sanPham} />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic title="Khách hàng hoạt động" value={kpi.khachHang} />
              </Col>
            </Row>
          ) : null}
        </ProCard>
      </Space>
    </PageContainer>
  );
}
