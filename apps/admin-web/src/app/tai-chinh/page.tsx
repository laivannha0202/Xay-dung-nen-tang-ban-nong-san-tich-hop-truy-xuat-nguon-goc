'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Button, Modal, Popconfirm, Space, Tabs, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layDanhSach as layDanhSachNhaCungCap } from '@/lib/api-nha-cung-cap';
import {
  apiCapNhatTrangThaiChiTraNhaCungCap,
  apiGiaiPhongDoiSoat,
  apiHoanTienThanhToan,
  apiLayDanhSachChiTraNhaCungCap,
  apiLayDanhSachDoiSoat,
  apiLayDanhSachHoanTienTaiChinh,
  apiLayDanhSachSoDuNhaCungCap,
  apiLayDanhSachThanhToanTaiChinh,
  apiLayTheoNhaCungCapSoDu,
  apiTaoDoiSoat,
  apiTaoYeuCauChiTraNhaCungCap,
} from '@/lib/api-tai-chinh';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ThanhToan = {
  id: string;
  donHangId: string;
  maDonHang: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  tongDaHoan: number;
  createdAt: string;
  updatedAt: string;
};

type HoanTien = {
  id: string;
  thanhToanId: string;
  donHangId: string;
  maDonHang: string;
  maGiaoDich: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  thoiGian: string;
};

type DoiSoat = {
  id: string;
  nhaCungCapId: string;
  maNhaCungCap: string;
  tenNhaCungCap: string;
  batDauLuc: string;
  ketThucLuc: string;
  doanhThu: number;
  hoaHong: number;
  hoanTien: number;
  dieuChinh: number;
  phaiTra: number;
  trangThai: string;
  duDieuKienLuc: string;
  giaiPhongLuc?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SoDu = {
  nhaCungCapId: string;
  maNhaCungCap: string;
  tenNhaCungCap: string;
  dangCho: number;
  khaDung: number;
  tamGiu: number;
  daThanhToan: number;
};

type ChiTra = {
  id: string;
  maYeuCau: string;
  nhaCungCapId: string;
  maNhaCungCap: string;
  tenNhaCungCap: string;
  soTien: number;
  trangThai: 'REQUESTED' | 'PROCESSING' | 'PAID' | 'FAILED';
  yeuCauLuc: string;
  xuLyLuc: string | null;
  thanhToanLuc: string | null;
  thatBaiLuc: string | null;
  lyDoThatBai: string | null;
  createdAt: string;
  updatedAt: string;
};

type LuaChon = { label: string; value: string };
type FormHoanTien = { soTien: number; lyDo: string };
type FormDoiSoat = {
  nhaCungCapId: string;
  batDauLuc: string;
  ketThucLuc: string;
  hoanTien?: number;
  dieuChinh?: number;
};
type FormChiTra = { nhaCungCapId: string; soTien: number };
type FormThatBai = { lyDoThatBai: string };

const PAYMENT_STATES = [
  'CREATED',
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
].map((value) => ({ label: value, value }));

const PAYOUT_STATES = ['REQUESTED', 'PROCESSING', 'PAID', 'FAILED'].map((value) => ({
  label: value,
  value,
}));

const SETTLEMENT_STATES = ['DANG_CHO', 'KHA_DUNG'].map((value) => ({
  label: value,
  value,
}));

const tien = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function mauTrangThai(status: string): string {
  if (status === 'PAID' || status === 'REFUNDED' || status === 'KHA_DUNG') return 'green';
  if (status === 'FAILED' || status === 'CANCELLED') return 'red';
  if (status === 'PROCESSING' || status === 'PARTIALLY_REFUNDED' || status === 'DANG_XU_LY') return 'blue';
  if (status === 'REQUESTED' || status === 'PENDING' || status === 'DANG_CHO') return 'gold';
  return 'default';
}

function sangIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Thời điểm không hợp lệ.');
  return date.toISOString();
}

export default function TrangTaiChinh() {
  const router = useRouter();
  const { message } = App.useApp();
  const paymentRef = useRef<ActionType>(null);
  const refundRef = useRef<ActionType>(null);
  const settlementRef = useRef<ActionType>(null);
  const payoutRef = useRef<ActionType>(null);
  const [nhaCungCapOptions, setNhaCungCapOptions] = useState<LuaChon[]>([]);
  const [thanhToanHoan, setThanhToanHoan] = useState<ThanhToan | null>(null);
  const [chiTraThatBai, setChiTraThatBai] = useState<ChiTra | null>(null);
  const [loiLuaChon, setLoiLuaChon] = useState<string | null>(null);
  const [soDuDangChon, setSoDuDangChon] = useState<SoDu | null>(null);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');
  const coHoanTien = coQuyen('don_hang.xu_ly');
  const coGiaiPhong = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }
    if (!coQuanLy) return;
    let active = true;
    void layDanhSachNhaCungCap({ trang: 1, gioiHan: 100, trangThai: 'HOAT_DONG' })
      .then((response) => {
        if (!active) return;
        setNhaCungCapOptions(
          response.duLieu.map((item) => ({ label: `${item.ma} · ${item.ten}`, value: item.id })),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoiLuaChon(error instanceof Error ? error.message : 'Không tải được nhà cung cấp.');
      });
    return () => {
      active = false;
    };
  }, [coQuanLy, router]);

  const paymentColumns: ProColumns<ThanhToan>[] = [
    { title: 'Mã đơn', dataIndex: 'maDonHang' },
    { title: 'Phương thức', dataIndex: 'phuongThuc' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      fieldProps: { options: PAYMENT_STATES },
      render: (_, row) => <Tag color={mauTrangThai(row.trangThai)}>{row.trangThai}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'soTien',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.soTien),
    },
    {
      title: 'Đã hoàn',
      dataIndex: 'tongDaHoan',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.tongDaHoan),
    },
    { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime', search: false },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 110,
      render: (_, row) => {
        const conLai = Math.max(0, row.soTien - row.tongDaHoan);
        if (!coHoanTien || conLai <= 0 || !['PAID', 'PARTIALLY_REFUNDED'].includes(row.trangThai)) {
          return [];
        }
        return [
          <Button key="refund" type="link" size="small" onClick={() => setThanhToanHoan(row)}>
            Hoàn tiền
          </Button>,
        ];
      },
    },
  ];

  const refundColumns: ProColumns<HoanTien>[] = [
    { title: 'Mã đơn', dataIndex: 'maDonHang', search: false },
    { title: 'Mã refund', dataIndex: 'maGiaoDich', search: false, ellipsis: true },
    { title: 'Phương thức', dataIndex: 'phuongThuc', search: false },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      fieldProps: { options: PAYMENT_STATES },
      render: (_, row) => <Tag color={mauTrangThai(row.trangThai)}>{row.trangThai}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'soTien',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.soTien),
    },
    { title: 'Thời gian', dataIndex: 'thoiGian', valueType: 'dateTime', search: false },
  ];

  const settlementColumns: ProColumns<DoiSoat>[] = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      valueType: 'select',
      fieldProps: { options: nhaCungCapOptions, showSearch: true },
      render: (_, row) => `${row.maNhaCungCap} · ${row.tenNhaCungCap}`,
    },
    {
      title: 'Kỳ',
      search: false,
      render: (_, row) =>
        `${new Date(row.batDauLuc).toLocaleString('vi-VN')} → ${new Date(row.ketThucLuc).toLocaleString('vi-VN')}`,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'doanhThu',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.doanhThu),
    },
    {
      title: 'Hoa hồng',
      dataIndex: 'hoaHong',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.hoaHong),
    },
    {
      title: 'Refund',
      dataIndex: 'hoanTien',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.hoanTien),
    },
    {
      title: 'Điều chỉnh',
      dataIndex: 'dieuChinh',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.dieuChinh),
    },
    {
      title: 'Phải trả',
      dataIndex: 'phaiTra',
      search: false,
      align: 'right',
      render: (_, row) => <strong>{tien.format(row.phaiTra)}</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      fieldProps: { options: SETTLEMENT_STATES },
      render: (_, row) => <Tag color={mauTrangThai(row.trangThai)}>{row.trangThai}</Tag>,
    },
    {
      title: 'Đủ điều kiện lúc',
      dataIndex: 'duDieuKienLuc',
      search: false,
      render: (_, row) => (row.duDieuKienLuc ? new Date(row.duDieuKienLuc).toLocaleString('vi-VN') : '—'),
    },
    {
      title: 'Giải phóng lúc',
      dataIndex: 'giaiPhongLuc',
      search: false,
      render: (_, row) => (row.giaiPhongLuc ? new Date(row.giaiPhongLuc).toLocaleString('vi-VN') : '—'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 150,
      render: (_, row) => {
        if (row.trangThai === 'DANG_CHO' && coGiaiPhong) {
          return [
            <Popconfirm
              key="release"
              title="Giải phóng settlement sang khả dụng?"
              description="Sau khi giải phóng, tiền sẽ chuyển từ đang chờ sang khả dụng của nhà cung cấp."
              onConfirm={async () => {
                try {
                  await apiGiaiPhongDoiSoat(row.id);
                  message.success('Đã giải phóng settlement.');
                  settlementRef.current?.reload();
                  payoutRef.current?.reload();
                } catch (error) {
                  message.error(error instanceof Error ? error.message : 'Không giải phóng được settlement.');
                }
              }}
            >
              <Button type="link" size="small">Giải phóng</Button>
            </Popconfirm>,
          ];
        }
        return [];
      },
    },
  ];

  const payoutColumns: ProColumns<ChiTra>[] = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      valueType: 'select',
      fieldProps: { options: nhaCungCapOptions, showSearch: true },
      render: (_, row) => `${row.maNhaCungCap} · ${row.tenNhaCungCap}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      fieldProps: { options: PAYOUT_STATES },
      render: (_, row) => <Tag color={mauTrangThai(row.trangThai)}>{row.trangThai}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'soTien',
      search: false,
      align: 'right',
      render: (_, row) => tien.format(row.soTien),
    },
    { title: 'Yêu cầu lúc', dataIndex: 'yeuCauLuc', valueType: 'dateTime', search: false },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 210,
      render: (_, row) => {
        if (row.trangThai === 'REQUESTED') {
          return [
            <Button
              key="processing"
              type="link"
              size="small"
              onClick={() => void chuyenTrangThaiChiTra(row, 'PROCESSING')}
            >
              Bắt đầu xử lý
            </Button>,
          ];
        }
        if (row.trangThai === 'PROCESSING') {
          return [
            <Popconfirm
              key="paid"
              title="Xác nhận đã chi trả?"
              onConfirm={() => void chuyenTrangThaiChiTra(row, 'PAID')}
            >
              <Button type="link" size="small">
                Đã trả
              </Button>
            </Popconfirm>,
            <Button
              key="failed"
              danger
              type="link"
              size="small"
              onClick={() => setChiTraThatBai(row)}
            >
              Thất bại
            </Button>,
          ];
        }
        return [];
      },
    },
  ];

  async function chuyenTrangThaiChiTra(
    row: ChiTra,
    trangThai: 'PROCESSING' | 'PAID' | 'FAILED',
    lyDoThatBai?: string,
  ) {
    try {
      await apiCapNhatTrangThaiChiTraNhaCungCap(row.id, { trangThai, lyDoThatBai });
      message.success(`Đã chuyển payout sang ${trangThai}.`);
      payoutRef.current?.reload();
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không cập nhật được payout.');
      return false;
    }
  }

  if (!coQuanLy) {
    return (
      <PageContainer title="Tài chính">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để truy cập Finance Admin UI."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Tài chính"
      subTitle="PHIEN-086 · payments / refunds / settlements / payouts"
    >
      {loiLuaChon ? (
        <Alert type="error" showIcon message={loiLuaChon} style={{ marginBottom: 16 }} />
      ) : null}
      <Tabs
        items={[
          {
            key: 'payments',
            label: 'Thanh toán',
            children: (
              <ProTable<ThanhToan>
                rowKey="id"
                actionRef={paymentRef}
                columns={paymentColumns}
                request={async (params) => {
                  const response = await apiLayDanhSachThanhToanTaiChinh({
                    trang: params.current ?? 1,
                    gioiHan: params.pageSize ?? 20,
                    trangThai:
                      typeof params.trangThai === 'string'
                        ? (params.trangThai as never)
                        : undefined,
                    phuongThuc:
                      typeof params.phuongThuc === 'string' ? params.phuongThuc : undefined,
                    maDonHang: typeof params.maDonHang === 'string' ? params.maDonHang : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                search={{ labelWidth: 'auto' }}
              />
            ),
          },
          {
            key: 'refunds',
            label: 'Hoàn tiền',
            children: (
              <ProTable<HoanTien>
                rowKey="id"
                actionRef={refundRef}
                columns={refundColumns}
                request={async (params) => {
                  const response = await apiLayDanhSachHoanTienTaiChinh({
                    trang: params.current ?? 1,
                    gioiHan: params.pageSize ?? 20,
                    trangThai:
                      typeof params.trangThai === 'string'
                        ? (params.trangThai as never)
                        : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                search={{ labelWidth: 'auto' }}
              />
            ),
          },
          {
            key: 'seller-balance',
            label: 'Số dư NCC',
            children: (
              <ProTable<SoDu>
                rowKey="nhaCungCapId"
                columns={[
                  { title: 'Mã NCC', dataIndex: 'maNhaCungCap', search: false },
                  { title: 'Tên NCC', dataIndex: 'tenNhaCungCap', search: false },
                  {
                    title: 'Đang chờ',
                    dataIndex: 'dangCho',
                    search: false,
                    align: 'right',
                    render: (_, row) => tien.format(row.dangCho),
                  },
                  {
                    title: 'Khả dụng',
                    dataIndex: 'khaDung',
                    search: false,
                    align: 'right',
                    render: (_, row) => tien.format(row.khaDung),
                  },
                  {
                    title: 'Tạm giữ',
                    dataIndex: 'tamGiu',
                    search: false,
                    align: 'right',
                    render: (_, row) => tien.format(row.tamGiu),
                  },
                  {
                    title: 'Đã thanh toán',
                    dataIndex: 'daThanhToan',
                    search: false,
                    align: 'right',
                    render: (_, row) => tien.format(row.daThanhToan),
                  },
                  {
                    title: 'Thao tác',
                    valueType: 'option',
                    render: (_, row) => [
                      <Button
                        key="view"
                        type="link"
                        size="small"
                        onClick={async () => {
                          try {
                            const detail = await apiLayTheoNhaCungCapSoDu(row.nhaCungCapId);
                            setSoDuDangChon(detail);
                          } catch (error) {
                            message.error(error instanceof Error ? error.message : 'Không tải chi tiết số dư.');
                          } finally {
                          }
                        }}
                      >
                        Chi tiết
                      </Button>,
                    ],
                  },
                ]}
                request={async (params) => {
                  const response = await apiLayDanhSachSoDuNhaCungCap({
                    trang: params.current ?? 1,
                    gioiHan: params.pageSize ?? 20,
                    nhaCungCapId:
                      typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                search={{ labelWidth: 'auto' }}
              />
            ),
          },
          {
            key: 'settlements',
            label: 'Đối soát',
            children: (
              <ProTable<DoiSoat>
                rowKey="id"
                actionRef={settlementRef}
                columns={settlementColumns}
                request={async (params) => {
                  const response = await apiLayDanhSachDoiSoat({
                    trang: params.current ?? 1,
                    gioiHan: params.pageSize ?? 20,
                    nhaCungCapId:
                      typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                search={{ labelWidth: 'auto' }}
                toolBarRender={() => [
                  <ModalForm<FormDoiSoat>
                    key="create-settlement"
                    title="Tạo kỳ đối soát"
                    trigger={<Button type="primary">Tạo đối soát</Button>}
                    modalProps={{ destroyOnHidden: true }}
                    initialValues={{ hoanTien: 0, dieuChinh: 0 }}
                    onFinish={async (values) => {
                      try {
                        await apiTaoDoiSoat({
                          nhaCungCapId: values.nhaCungCapId,
                          batDauLuc: sangIso(values.batDauLuc),
                          ketThucLuc: sangIso(values.ketThucLuc),
                          hoanTien: values.hoanTien ?? 0,
                          dieuChinh: values.dieuChinh ?? 0,
                        });
                        message.success('Đã tạo kỳ đối soát.');
                        settlementRef.current?.reload();
                        return true;
                      } catch (error) {
                        message.error(
                          error instanceof Error ? error.message : 'Không tạo được đối soát.',
                        );
                        return false;
                      }
                    }}
                  >
                    <ProFormSelect
                      name="nhaCungCapId"
                      label="Nhà cung cấp"
                      options={nhaCungCapOptions}
                      rules={[{ required: true }]}
                      fieldProps={{ showSearch: true }}
                    />
                    <ProFormText
                      name="batDauLuc"
                      label="Bắt đầu"
                      fieldProps={{ type: 'datetime-local' }}
                      rules={[{ required: true }]}
                    />
                    <ProFormText
                      name="ketThucLuc"
                      label="Kết thúc"
                      fieldProps={{ type: 'datetime-local' }}
                      rules={[{ required: true }]}
                    />
                    <ProFormDigit
                      name="hoanTien"
                      label="Refund đã quy thuộc NCC"
                      min={0}
                      fieldProps={{ precision: 2 }}
                    />
                    <ProFormDigit
                      name="dieuChinh"
                      label="Điều chỉnh (+ trừ / - cộng)"
                      fieldProps={{ precision: 2 }}
                    />
                  </ModalForm>,
                ]}
              />
            ),
          },
          {
            key: 'payouts',
            label: 'Chi trả',
            children: (
              <ProTable<ChiTra>
                rowKey="id"
                actionRef={payoutRef}
                columns={payoutColumns}
                request={async (params) => {
                  const response = await apiLayDanhSachChiTraNhaCungCap({
                    trang: params.current ?? 1,
                    gioiHan: params.pageSize ?? 20,
                    nhaCungCapId:
                      typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
                    trangThai:
                      typeof params.trangThai === 'string'
                        ? (params.trangThai as never)
                        : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                search={{ labelWidth: 'auto' }}
                toolBarRender={() => [
                  <ModalForm<FormChiTra>
                    key="create-payout"
                    title="Tạo yêu cầu chi trả"
                    trigger={<Button type="primary">Tạo chi trả</Button>}
                    modalProps={{ destroyOnHidden: true }}
                    onFinish={async (values) => {
                      try {
                        const balance = await apiLayDanhSachSoDuNhaCungCap({
                          trang: 1,
                          gioiHan: 1,
                          nhaCungCapId: values.nhaCungCapId,
                        });
                        const khaDung = Number(balance.duLieu[0]?.khaDung ?? 0);
                        if (values.soTien > khaDung) {
                          message.error(`Số dư khả dụng chỉ còn ${tien.format(khaDung)}.`);
                          return false;
                        }
                        await apiTaoYeuCauChiTraNhaCungCap({
                          maYeuCau: crypto.randomUUID(),
                          nhaCungCapId: values.nhaCungCapId,
                          soTien: values.soTien,
                        });
                        message.success('Đã tạo yêu cầu chi trả.');
                        payoutRef.current?.reload();
                        return true;
                      } catch (error) {
                        message.error(
                          error instanceof Error ? error.message : 'Không tạo được payout.',
                        );
                        return false;
                      }
                    }}
                  >
                    <ProFormSelect
                      name="nhaCungCapId"
                      label="Nhà cung cấp"
                      options={nhaCungCapOptions}
                      rules={[{ required: true }]}
                      fieldProps={{ showSearch: true }}
                    />
                    <ProFormDigit
                      name="soTien"
                      label="Số tiền"
                      min={0.01}
                      fieldProps={{ precision: 2 }}
                      rules={[{ required: true }]}
                    />
                  </ModalForm>,
                ]}
              />
            ),
          },
        ]}
      />

      <ModalForm<FormHoanTien>
        key={thanhToanHoan?.id ?? 'refund'}
        title={`Hoàn tiền ${thanhToanHoan?.maDonHang ?? ''}`}
        open={Boolean(thanhToanHoan)}
        modalProps={{ destroyOnHidden: true, onCancel: () => setThanhToanHoan(null) }}
        onOpenChange={(open) => {
          if (!open) setThanhToanHoan(null);
        }}
        onFinish={async (values) => {
          if (!thanhToanHoan) return false;
          try {
            await apiHoanTienThanhToan(thanhToanHoan.id, {
              maYeuCau: crypto.randomUUID(),
              soTien: values.soTien,
              lyDo: values.lyDo,
            });
            message.success('Hoàn tiền thành công.');
            setThanhToanHoan(null);
            paymentRef.current?.reload();
            refundRef.current?.reload();
            return true;
          } catch (error) {
            message.error(error instanceof Error ? error.message : 'Không hoàn tiền được.');
            return false;
          }
        }}
      >
        <ProFormDigit
          name="soTien"
          label="Số tiền hoàn"
          min={0.01}
          max={
            thanhToanHoan ? Math.max(0, thanhToanHoan.soTien - thanhToanHoan.tongDaHoan) : undefined
          }
          fieldProps={{ precision: 2 }}
          rules={[{ required: true }]}
        />
        <ProFormTextArea name="lyDo" label="Lý do" rules={[{ required: true, min: 3, max: 500 }]} />
      </ModalForm>

      <ModalForm<FormThatBai>
        key={chiTraThatBai?.id ?? 'failed'}
        title="Đánh dấu chi trả thất bại"
        open={Boolean(chiTraThatBai)}
        modalProps={{ destroyOnHidden: true, onCancel: () => setChiTraThatBai(null) }}
        onOpenChange={(open) => {
          if (!open) setChiTraThatBai(null);
        }}
        onFinish={async (values) => {
          if (!chiTraThatBai) return false;
          const ok = await chuyenTrangThaiChiTra(chiTraThatBai, 'FAILED', values.lyDoThatBai);
          if (ok) setChiTraThatBai(null);
          return ok;
        }}
      >
        <ProFormTextArea
          name="lyDoThatBai"
          label="Lý do thất bại"
          rules={[{ required: true, min: 3, max: 500 }]}
        />
      </ModalForm>

      <Modal
        title={`Số dư NCC · ${soDuDangChon?.maNhaCungCap ?? ''} · ${soDuDangChon?.tenNhaCungCap ?? ''}`}
        open={Boolean(soDuDangChon)}
        onCancel={() => setSoDuDangChon(null)}
        footer={[
          <Button key="close" onClick={() => setSoDuDangChon(null)}>
            Đóng
          </Button>,
        ]}
      >
        {soDuDangChon ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>Đang chờ: <strong>{tien.format(soDuDangChon.dangCho)}</strong></div>
            <div>Khả dụng: <strong>{tien.format(soDuDangChon.khaDung)}</strong></div>
            <div>Tạm giữ: <strong>{tien.format(soDuDangChon.tamGiu)}</strong></div>
            <div>Đã thanh toán: <strong>{tien.format(soDuDangChon.daThanhToan)}</strong></div>
          </Space>
        ) : (
          <div>Đang tải...</div>
        )}
      </Modal>
    </PageContainer>
  );
}
