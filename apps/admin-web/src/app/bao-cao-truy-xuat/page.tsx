'use client';

import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, Tabs, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  apiLayBaoCaoTruyXuatDonHangAnhHuong,
  apiLayBaoCaoTruyXuatLo,
  apiLayBaoCaoTruyXuatThuHoi,
} from '@/lib/api-bao-cao-truy-xuat';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type LoBaoCao = Awaited<ReturnType<typeof apiLayBaoCaoTruyXuatLo>>['duLieu'][number];
type ThuHoiBaoCao = Awaited<ReturnType<typeof apiLayBaoCaoTruyXuatThuHoi>>['duLieu'][number];
type DonHangAnhHuong = Awaited<
  ReturnType<typeof apiLayBaoCaoTruyXuatDonHangAnhHuong>
>['duLieu'][number];

type ParamsBaoCao = {
  current?: number;
  pageSize?: number;
  timKiem?: unknown;
  loSanPhamId?: unknown;
};

function commonParams(params: ParamsBaoCao) {
  return {
    trang: typeof params.current === 'number' ? params.current : 1,
    gioiHan: typeof params.pageSize === 'number' ? params.pageSize : 20,
    timKiem:
      typeof params.timKiem === 'string' && params.timKiem.trim() ? params.timKiem : undefined,
  };
}

const searchLo: ProColumns<LoBaoCao> = {
  title: 'Tìm kiếm',
  dataIndex: 'timKiem',
  hideInTable: true,
  fieldProps: { placeholder: 'Mã lô, trace code, farm, cây trồng' },
};

const loColumns: ProColumns<LoBaoCao>[] = [
  searchLo,
  {
    title: 'Batch / trace',
    search: false,
    render: (_, row) => `${row.maLo} · ${row.maTruyXuat ?? 'Chưa cấp trace code'}`,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'trangThai',
    search: false,
    render: (_, row) => <Tag color={row.daThuHoi ? 'red' : 'blue'}>{row.trangThai}</Tag>,
  },
  {
    title: 'Farm / crop',
    search: false,
    render: (_, row) =>
      `${row.trangTrai.ma} · ${row.trangTrai.ten} · ${row.cayTrong} (${row.giong})`,
  },
  { title: 'Thu hoạch', dataIndex: 'ngayThuHoach', search: false },
  { title: 'HSD', dataIndex: 'ngayHetHan', search: false },
  { title: 'SL lô', dataIndex: 'soLuong', search: false, align: 'right' },
  { title: 'Còn lại', dataIndex: 'conLai', search: false, align: 'right' },
  { title: 'Đơn ảnh hưởng', dataIndex: 'soDonHangAnhHuong', search: false, align: 'right' },
  { title: 'Đã phân bổ', dataIndex: 'soLuongDaPhanBo', search: false, align: 'right' },
];

const recallColumns: ProColumns<ThuHoiBaoCao>[] = [
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: { placeholder: 'Mã lô, trace code, lý do, farm' },
  },
  {
    title: 'Batch / trace',
    search: false,
    render: (_, row) => `${row.maLo} · ${row.maTruyXuat ?? '—'}`,
  },
  { title: 'Thu hồi lúc', dataIndex: 'thuHoiLuc', valueType: 'dateTime', search: false },
  {
    title: 'Farm',
    search: false,
    render: (_, row) => `${row.trangTrai.ma} · ${row.trangTrai.ten}`,
  },
  { title: 'Lý do', dataIndex: 'lyDo', search: false, ellipsis: true },
  {
    title: 'Người thu hồi',
    search: false,
    render: (_, row) => row.nguoiThuHoi?.email ?? '—',
  },
  { title: 'Đơn ảnh hưởng', dataIndex: 'soDonHangAnhHuong', search: false, align: 'right' },
  { title: 'SL đã phân bổ', dataIndex: 'soLuongDaPhanBo', search: false, align: 'right' },
];

const affectedColumns: ProColumns<DonHangAnhHuong>[] = [
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: { placeholder: 'Mã lô, order, SKU, farm' },
  },
  {
    title: 'Lô ID',
    dataIndex: 'loSanPhamId',
    hideInTable: true,
    fieldProps: { placeholder: 'UUID lô cần khoanh vùng' },
  },
  {
    title: 'Recalled batch',
    search: false,
    render: (_, row) => `${row.maLo} · ${row.maTruyXuat ?? '—'}`,
  },
  {
    title: 'Order',
    search: false,
    render: (_, row) => `${row.maDonHang} · ${row.maDonNhaCungCap}`,
  },
  {
    title: 'Trạng thái order',
    dataIndex: 'trangThaiDonHang',
    search: false,
    render: (_, row) => (
      <Tag color={row.trangThaiDonHang === 'DA_HUY' ? 'default' : 'blue'}>
        {row.trangThaiDonHang}
      </Tag>
    ),
  },
  { title: 'Ngày đặt', dataIndex: 'ngayDatHang', valueType: 'dateTime', search: false },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    render: (_, row) => `${row.tenSanPham} · ${row.sku}`,
  },
  {
    title: 'Farm',
    search: false,
    render: (_, row) => `${row.maTrangTrai} · ${row.tenTrangTrai}`,
  },
  { title: 'Kho', dataIndex: 'maKho', search: false },
  { title: 'SL allocation', dataIndex: 'soLuongPhanBo', search: false, align: 'right' },
];

export default function TrangBaoCaoTruyXuat() {
  const router = useRouter();
  const coXem = coQuyen('lo_san_pham.xem');

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  if (!coXem) {
    return (
      <PageContainer title="Báo cáo truy xuất">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền lo_san_pham.xem để xem Traceability Reports."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Báo cáo truy xuất"
      subTitle="PHIEN-091 · batch / recall / affected orders"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Affected orders là lịch sử allocation"
        description="Một Order đã hủy vẫn được giữ trong report nếu từng được phân bổ từ recalled batch. Report không thay đổi Order/Inventory/Recall lifecycle."
      />
      <Tabs
        items={[
          {
            key: 'batch',
            label: 'Batch',
            children: (
              <ProTable<LoBaoCao>
                rowKey="id"
                columns={loColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const response = await apiLayBaoCaoTruyXuatLo(commonParams(params));
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
          {
            key: 'recall',
            label: 'Recall',
            children: (
              <ProTable<ThuHoiBaoCao>
                rowKey="id"
                columns={recallColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const response = await apiLayBaoCaoTruyXuatThuHoi(commonParams(params));
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
          {
            key: 'affected-orders',
            label: 'Affected orders',
            children: (
              <ProTable<DonHangAnhHuong>
                rowKey="id"
                columns={affectedColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const base = commonParams(params);
                  const response = await apiLayBaoCaoTruyXuatDonHangAnhHuong({
                    ...base,
                    loSanPhamId:
                      typeof params.loSanPhamId === 'string' && params.loSanPhamId.trim()
                        ? params.loSanPhamId
                        : undefined,
                  });
                  return { data: response.duLieu, total: response.tongPhanBo, success: true };
                }}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
