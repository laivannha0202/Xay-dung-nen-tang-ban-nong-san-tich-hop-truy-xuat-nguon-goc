'use client';

import {
  ApartmentOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  apiLayBaoCaoTruyXuatDonHangAnhHuong,
  apiLayBaoCaoTruyXuatLo,
  apiLayBaoCaoTruyXuatThuHoi,
} from '@/lib/api-bao-cao-truy-xuat';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type LoBaoCao = Awaited<ReturnType<typeof apiLayBaoCaoTruyXuatLo>>['duLieu'][number];
type ThuHoiBaoCao = Awaited<
  ReturnType<typeof apiLayBaoCaoTruyXuatThuHoi>
>['duLieu'][number];
type DonHangAnhHuong = Awaited<
  ReturnType<typeof apiLayBaoCaoTruyXuatDonHangAnhHuong>
>['duLieu'][number];

type ParamsBaoCao = {
  current?: number;
  pageSize?: number;
  timKiem?: unknown;
  loSanPhamId?: unknown;
};

type TongQuan = {
  tongLo: number;
  tongThuHoi: number;
  tongDonHangAnhHuong: number;
  tongSoLuongPhanBo: number;
};

const TRANG_THAI_DON: Record<string, { text: string; color: string }> = {
  CHO_THANH_TOAN: { text: 'Chờ thanh toán', color: 'gold' },
  DA_XAC_NHAN: { text: 'Đã xác nhận', color: 'blue' },
  DANG_CHUAN_BI: { text: 'Đang chuẩn bị', color: 'processing' },
  DA_DONG_GOI: { text: 'Đã đóng gói', color: 'cyan' },
  DANG_GIAO: { text: 'Đang giao', color: 'geekblue' },
  DA_GIAO: { text: 'Đã giao', color: 'green' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'success' },
  DA_HUY: { text: 'Đã hủy', color: 'default' },
  KHIEU_NAI: { text: 'Khiếu nại', color: 'volcano' },
  HOAN_TIEN_MOT_PHAN: { text: 'Hoàn tiền một phần', color: 'purple' },
  HOAN_TIEN_TOAN_BO: { text: 'Hoàn tiền toàn bộ', color: 'magenta' },
};

const TRANG_THAI_LO: Record<string, { text: string; color: string }> = {
  MOI_TAO: { text: 'Mới tạo', color: 'default' },
  DANG_KIEM_DINH: { text: 'Đang kiểm định', color: 'processing' },
  DAT: { text: 'Đạt', color: 'green' },
  KHONG_DAT: { text: 'Không đạt', color: 'red' },
  SAN_SANG: { text: 'Sẵn sàng', color: 'blue' },
  DA_THU_HOI: { text: 'Đã thu hồi', color: 'volcano' },
  HET_HAN: { text: 'Hết hạn', color: 'red' },
};

function commonParams(params: ParamsBaoCao) {
  return {
    trang: typeof params.current === 'number' ? params.current : 1,
    gioiHan: typeof params.pageSize === 'number' ? params.pageSize : 20,
    timKiem:
      typeof params.timKiem === 'string' && params.timKiem.trim()
        ? params.timKiem.trim()
        : undefined,
  };
}

function tagDonHang(value: string) {
  const meta = TRANG_THAI_DON[value];
  return <Tag color={meta?.color}>{meta?.text ?? value}</Tag>;
}

function tagLo(value: string, daThuHoi = false) {
  if (daThuHoi) return <Tag color="red">Đã thu hồi</Tag>;
  const meta = TRANG_THAI_LO[value];
  return <Tag color={meta?.color}>{meta?.text ?? value}</Tag>;
}

function ngay(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

function ngayGio(value: string) {
  return new Date(value).toLocaleString('vi-VN');
}

const searchLo: ProColumns<LoBaoCao> = {
  title: 'Tìm kiếm',
  dataIndex: 'timKiem',
  hideInTable: true,
  fieldProps: {
    placeholder: 'Mã lô, mã truy xuất, trang trại, cây trồng',
  },
};

const loColumns: ProColumns<LoBaoCao>[] = [
  searchLo,
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Lô / mã truy xuất',
    search: false,
    width: 200,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.maLo}</Typography.Text>
        <Typography.Text
          type={row.maTruyXuat ? undefined : 'secondary'}
          copyable={Boolean(row.maTruyXuat)}
          style={{ fontSize: 11 }}
        >
          {row.maTruyXuat ?? 'Chưa cấp mã truy xuất'}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'trangThai',
    search: false,
    width: 135,
    render: (_, row) => tagLo(row.trangThai, row.daThuHoi),
  },
  {
    title: 'Trang trại / cây trồng',
    search: false,
    width: 230,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.trangTrai.ten}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.trangTrai.ma} · {row.cayTrong} ({row.giong})
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Thu hoạch',
    dataIndex: 'ngayThuHoach',
    search: false,
    width: 115,
    render: (_, row) => ngay(row.ngayThuHoach),
  },
  {
    title: 'HSD',
    dataIndex: 'ngayHetHan',
    search: false,
    width: 115,
    render: (_, row) => ngay(row.ngayHetHan),
  },
  {
    title: 'SL lô',
    dataIndex: 'soLuong',
    search: false,
    align: 'right',
    width: 90,
  },
  {
    title: 'Còn lại',
    dataIndex: 'conLai',
    search: false,
    align: 'right',
    width: 90,
  },
  {
    title: 'Đơn ảnh hưởng',
    dataIndex: 'soDonHangAnhHuong',
    search: false,
    align: 'right',
    width: 110,
  },
  {
    title: 'Đã phân bổ',
    dataIndex: 'soLuongDaPhanBo',
    search: false,
    align: 'right',
    width: 105,
  },
];

const recallColumns: ProColumns<ThuHoiBaoCao>[] = [
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: {
      placeholder: 'Mã lô, mã truy xuất, lý do, trang trại',
    },
  },
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Lô / mã truy xuất',
    search: false,
    width: 200,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.maLo}</Typography.Text>
        <Typography.Text
          type={row.maTruyXuat ? undefined : 'secondary'}
          style={{ fontSize: 11 }}
        >
          {row.maTruyXuat ?? '—'}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Thu hồi lúc',
    dataIndex: 'thuHoiLuc',
    search: false,
    width: 150,
    render: (_, row) => ngayGio(row.thuHoiLuc),
  },
  {
    title: 'Trang trại',
    search: false,
    width: 185,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.trangTrai.ten}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.trangTrai.ma}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Lý do',
    dataIndex: 'lyDo',
    search: false,
    ellipsis: true,
    width: 240,
  },
  {
    title: 'Người thu hồi',
    search: false,
    width: 185,
    render: (_, row) => row.nguoiThuHoi?.email ?? '—',
  },
  {
    title: 'Đơn ảnh hưởng',
    dataIndex: 'soDonHangAnhHuong',
    search: false,
    align: 'right',
    width: 110,
  },
  {
    title: 'SL đã phân bổ',
    dataIndex: 'soLuongDaPhanBo',
    search: false,
    align: 'right',
    width: 110,
  },
];

const affectedColumns: ProColumns<DonHangAnhHuong>[] = [
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: {
      placeholder: 'Mã lô, đơn hàng, SKU, trang trại',
    },
  },
  {
    title: 'Lô ID',
    dataIndex: 'loSanPhamId',
    hideInTable: true,
    fieldProps: {
      placeholder: 'UUID lô cần khoanh vùng (tùy chọn)',
    },
  },
  {
    title: '#',
    width: 52,
    search: false,
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Lô thu hồi',
    search: false,
    width: 190,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.maLo}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.maTruyXuat ?? '—'}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Đơn hàng',
    search: false,
    width: 210,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong copyable>
          {row.maDonHang}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.maDonNhaCungCap}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'trangThaiDonHang',
    search: false,
    width: 135,
    render: (_, row) => tagDonHang(row.trangThaiDonHang),
  },
  {
    title: 'Ngày đặt',
    dataIndex: 'ngayDatHang',
    search: false,
    width: 150,
    render: (_, row) => ngayGio(row.ngayDatHang),
  },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    width: 215,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.tenSanPham}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.sku}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Trang trại',
    search: false,
    width: 190,
    render: (_, row) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{row.tenTrangTrai}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {row.maTrangTrai}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: 'Kho',
    dataIndex: 'maKho',
    search: false,
    width: 130,
  },
  {
    title: 'SL phân bổ',
    dataIndex: 'soLuongPhanBo',
    search: false,
    align: 'right',
    width: 105,
  },
];

export default function TrangBaoCaoTruyXuat() {
  const router = useRouter();
  const { message } = App.useApp();
  const daTaiLanDau = useRef(false);
  const [phien] = useState(() => layPhienAdmin());

  const coXem = phien?.quyen.includes('lo_san_pham.xem') ?? false;

  const [dangTai, setDangTai] = useState(false);
  const [tongQuan, setTongQuan] = useState<TongQuan>({
    tongLo: 0,
    tongThuHoi: 0,
    tongDonHangAnhHuong: 0,
    tongSoLuongPhanBo: 0,
  });

  const taiTongQuan = useCallback(async () => {
    if (!coXem) return;

    setDangTai(true);
    try {
      const [batch, recall, affected] = await Promise.all([
        apiLayBaoCaoTruyXuatLo({ trang: 1, gioiHan: 1 }),
        apiLayBaoCaoTruyXuatThuHoi({ trang: 1, gioiHan: 1 }),
        apiLayBaoCaoTruyXuatDonHangAnhHuong({
          trang: 1,
          gioiHan: 1,
        }),
      ]);

      setTongQuan({
        tongLo: batch.tong,
        tongThuHoi: recall.tong,
        tongDonHangAnhHuong: affected.tongDonHang,
        tongSoLuongPhanBo: affected.tongSoLuongPhanBo,
      });
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `Không tải đủ thống kê truy xuất: ${error.message}`
          : 'Không tải đủ thống kê truy xuất.',
      );
    } finally {
      setDangTai(false);
    }
  }, [coXem, message]);

  useEffect(() => {
    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coXem || daTaiLanDau.current) return;

    daTaiLanDau.current = true;
    void taiTongQuan();
  }, [coXem, phien, router, taiTongQuan]);

  const pieData = useMemo(
    () =>
      [
        { loai: 'Đã thu hồi', giaTri: tongQuan.tongThuHoi },
        {
          loai: 'Chưa thu hồi',
          giaTri: Math.max(0, tongQuan.tongLo - tongQuan.tongThuHoi),
        },
      ].filter((item) => item.giaTri > 0),
    [tongQuan],
  );

  if (!phien) {
    return (
      <PageContainer title="Báo cáo truy xuất">
        Đang kiểm tra phiên quản trị...
      </PageContainer>
    );
  }

  if (!coXem) {
    return (
      <PageContainer title="Báo cáo truy xuất">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền lo_san_pham.xem để xem báo cáo truy xuất."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      ghost
      title="Báo cáo truy xuất nguồn gốc"
      subTitle="Khoanh vùng lô, lịch sử thu hồi và các đơn hàng từng được phân bổ từ lô bị ảnh hưởng."
      extra={[
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          loading={dangTai}
          onClick={() => void taiTongQuan()}
        >
          Làm mới thống kê
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[14, 14]}>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng lô truy xuất',
                value: tongQuan.tongLo,
                icon: <ApartmentOutlined style={{ color: '#087a4b' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f2fff8,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Lô đã thu hồi',
                value: tongQuan.tongThuHoi,
                icon: <WarningOutlined style={{ color: '#e55662' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#fff4f5,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Đơn hàng ảnh hưởng',
                value: tongQuan.tongDonHangAnhHuong,
                icon: <ShoppingCartOutlined style={{ color: '#378fe4' }} />,
              }}
              style={{ background: 'linear-gradient(110deg,#f3f9ff,#fff)' }}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <StatisticCard
              bordered
              statistic={{
                title: 'Tổng SL đã phân bổ',
                value: tongQuan.tongSoLuongPhanBo,
                icon: (
                  <SafetyCertificateOutlined style={{ color: '#8c52cf' }} />
                ),
              }}
              style={{ background: 'linear-gradient(110deg,#fbf5ff,#fff)' }}
            />
          </Col>
        </Row>

        <Row gutter={[14, 14]}>
          <Col xs={24} xl={8}>
            <ProCard
              bordered
              title="Tỷ lệ lô thu hồi"
              style={{ height: '100%' }}
            >
              {pieData.length ? (
                <Pie
                  data={pieData}
                  angleField="giaTri"
                  colorField="loai"
                  height={260}
                  innerRadius={0.58}
                  label={{ text: 'giaTri', position: 'outside' }}
                  legend={{ position: 'bottom' }}
                />
              ) : (
                <Space
                  style={{
                    width: '100%',
                    minHeight: 260,
                    justifyContent: 'center',
                  }}
                >
                  <Typography.Text type="secondary">
                    Chưa có lô truy xuất.
                  </Typography.Text>
                </Space>
              )}
            </ProCard>
          </Col>

          <Col xs={24} xl={16}>
            <ProCard
              bordered
              title="Ý nghĩa báo cáo"
              style={{ height: '100%' }}
            >
              <Alert
                type="info"
                showIcon
                message="Đơn ảnh hưởng dựa trên lịch sử allocation"
                description="Một đơn đã hủy vẫn xuất hiện nếu trước đó từng được phân bổ từ lô bị thu hồi. Báo cáo chỉ phản ánh dữ liệu truy xuất và không tự thay đổi lifecycle đơn hàng, tồn kho hoặc thu hồi."
              />
            </ProCard>
          </Col>
        </Row>

        <ProCard bordered>
          <Tabs
            items={[
              {
                key: 'batch',
                label: `Lô truy xuất (${tongQuan.tongLo})`,
                children: (
                  <ProTable<LoBaoCao>
                    rowKey="id"
                    columns={loColumns}
                    cardBordered={false}
                    options={false}
                    scroll={{ x: 1250 }}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const response = await apiLayBaoCaoTruyXuatLo(
                        commonParams(params),
                      );
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
              {
                key: 'recall',
                label: `Thu hồi (${tongQuan.tongThuHoi})`,
                children: (
                  <ProTable<ThuHoiBaoCao>
                    rowKey="id"
                    columns={recallColumns}
                    cardBordered={false}
                    options={false}
                    scroll={{ x: 1300 }}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const response = await apiLayBaoCaoTruyXuatThuHoi(
                        commonParams(params),
                      );
                      return {
                        data: response.duLieu,
                        total: response.tong,
                        success: true,
                      };
                    }}
                  />
                ),
              },
              {
                key: 'affected-orders',
                label: `Đơn bị ảnh hưởng (${tongQuan.tongDonHangAnhHuong})`,
                children: (
                  <ProTable<DonHangAnhHuong>
                    rowKey="id"
                    columns={affectedColumns}
                    cardBordered={false}
                    options={false}
                    scroll={{ x: 1450 }}
                    search={{
                      labelWidth: 'auto',
                      defaultCollapsed: false,
                      collapseRender: false,
                      searchText: 'Tìm kiếm',
                      resetText: 'Đặt lại',
                    }}
                    pagination={{
                      defaultPageSize: 20,
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                    }}
                    request={async (params) => {
                      const base = commonParams(params);
                      const response =
                        await apiLayBaoCaoTruyXuatDonHangAnhHuong({
                          ...base,
                          loSanPhamId:
                            typeof params.loSanPhamId === 'string' &&
                            params.loSanPhamId.trim()
                              ? params.loSanPhamId.trim()
                              : undefined,
                        });
                      return {
                        data: response.duLieu,
                        total: response.tongPhanBo,
                        success: true,
                      };
                    }}
                  />
                ),
              },
            ]}
          />
        </ProCard>
      </Space>
    </PageContainer>
  );
}
