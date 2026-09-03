'use client';

import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, Tabs, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import {
  apiLayBaoCaoHaoHut,
  apiLayBaoCaoHetHan,
  apiLayBaoCaoSapHetHan,
  apiLayBaoCaoTonKho,
} from '@/lib/api-bao-cao-ton-kho';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TonKho = Awaited<ReturnType<typeof apiLayBaoCaoTonKho>>['duLieu'][number];
type CanhBao = Awaited<ReturnType<typeof apiLayBaoCaoSapHetHan>>['duLieu'][number];
type HaoHut = Awaited<ReturnType<typeof apiLayBaoCaoHaoHut>>['duLieu'][number];

const searchColumn: ProColumns<TonKho> = {
  title: 'Tìm kiếm',
  dataIndex: 'timKiem',
  hideInTable: true,
  fieldProps: { placeholder: 'Mã kho, mã lô, SKU, tên sản phẩm' },
};

const stockColumns: ProColumns<TonKho>[] = [
  searchColumn,
  { title: 'Kho', search: false, render: (_, row) => `${row.kho.maKho} · ${row.kho.ten}` },
  {
    title: 'Lô / HSD',
    search: false,
    render: (_, row) => `${row.loSanPham.maLo} · ${row.loSanPham.ngayHetHan}`,
  },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    render: (_, row) => `${row.bienThe.tenSanPham} · ${row.bienThe.sku}`,
  },
  { title: 'On hand', dataIndex: 'onHand', search: false, align: 'right' },
  { title: 'Reserved', dataIndex: 'reserved', search: false, align: 'right' },
  { title: 'Blocked', dataIndex: 'blocked', search: false, align: 'right' },
  {
    title: 'Available',
    dataIndex: 'available',
    search: false,
    align: 'right',
    render: (_, row) => <Tag color={row.available > 0 ? 'green' : 'default'}>{row.available}</Tag>,
  },
];

const expiryColumns: ProColumns<CanhBao>[] = [
  searchColumn as ProColumns<CanhBao>,
  { title: 'Kho', search: false, render: (_, row) => `${row.kho.maKho} · ${row.kho.ten}` },
  { title: 'Lô', search: false, render: (_, row) => row.loSanPham.maLo },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    render: (_, row) => `${row.bienThe.tenSanPham} · ${row.bienThe.sku}`,
  },
  { title: 'HSD', search: false, render: (_, row) => row.loSanPham.ngayHetHan },
  {
    title: 'Còn lại',
    dataIndex: 'soNgayConLai',
    search: false,
    render: (_, row) => (
      <Tag color={row.soNgayConLai < 0 ? 'red' : 'orange'}>
        {row.soNgayConLai < 0
          ? `Quá ${Math.abs(row.soNgayConLai)} ngày`
          : `${row.soNgayConLai} ngày`}
      </Tag>
    ),
  },
  { title: 'On hand', dataIndex: 'onHand', search: false, align: 'right' },
  { title: 'Available', dataIndex: 'available', search: false, align: 'right' },
];

const wasteColumns: ProColumns<HaoHut>[] = [
  {
    title: 'Loại hao hụt',
    dataIndex: 'loai',
    valueType: 'select',
    fieldProps: {
      options: [
        { label: 'Hư hỏng (DAMAGE)', value: 'DAMAGE' },
        { label: 'Hết hạn (EXPIRE)', value: 'EXPIRE' },
      ],
    },
    render: (_, row) => <Tag color={row.loai === 'EXPIRE' ? 'red' : 'orange'}>{row.loai}</Tag>,
  },
  {
    title: 'Tìm kiếm',
    dataIndex: 'timKiem',
    hideInTable: true,
    fieldProps: { placeholder: 'Mã kho, mã lô, SKU, tên sản phẩm' },
  },
  { title: 'Kho', search: false, render: (_, row) => `${row.kho.maKho} · ${row.kho.ten}` },
  { title: 'Lô', search: false, render: (_, row) => row.loSanPham.maLo },
  {
    title: 'Sản phẩm / SKU',
    search: false,
    render: (_, row) => `${row.bienThe.tenSanPham} · ${row.bienThe.sku}`,
  },
  { title: 'Số lượng', dataIndex: 'soLuong', search: false, align: 'right' },
  { title: 'Ghi nhận lúc', dataIndex: 'createdAt', valueType: 'dateTime', search: false },
];

type ParamsBaoCao = {
  current?: number;
  pageSize?: number;
  timKiem?: unknown;
  loai?: unknown;
};

function commonParams(params: ParamsBaoCao) {
  return {
    trang: typeof params.current === 'number' ? params.current : 1,
    gioiHan: typeof params.pageSize === 'number' ? params.pageSize : 20,
    timKiem:
      typeof params.timKiem === 'string' && params.timKiem.trim() ? params.timKiem : undefined,
  };
}

export default function TrangBaoCaoTonKho() {
  const router = useRouter();
  const coXem = coQuyen('kho.xem');

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  if (!coXem) {
    return (
      <PageContainer title="Báo cáo tồn kho">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền kho.xem để xem Inventory Reports."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Báo cáo tồn kho"
      subTitle="PHIEN-089 · stock / near expiry / expired / waste"
    >
      <Tabs
        items={[
          {
            key: 'stock',
            label: 'Tồn hiện tại',
            children: (
              <ProTable<TonKho>
                rowKey="id"
                columns={stockColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const response = await apiLayBaoCaoTonKho(commonParams(params));
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
          {
            key: 'near-expiry',
            label: 'Sắp hết hạn',
            children: (
              <ProTable<CanhBao>
                rowKey="id"
                columns={expiryColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const response = await apiLayBaoCaoSapHetHan(commonParams(params));
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
          {
            key: 'expired',
            label: 'Đã hết hạn',
            children: (
              <ProTable<CanhBao>
                rowKey="id"
                columns={expiryColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const response = await apiLayBaoCaoHetHan(commonParams(params));
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
          {
            key: 'waste',
            label: 'Hao hụt',
            children: (
              <ProTable<HaoHut>
                rowKey="id"
                columns={wasteColumns}
                search={{ labelWidth: 'auto' }}
                pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                request={async (params) => {
                  const base = commonParams(params);
                  const response = await apiLayBaoCaoHaoHut({
                    ...base,
                    loai:
                      params.loai === 'DAMAGE' || params.loai === 'EXPIRE'
                        ? params.loai
                        : undefined,
                  });
                  return { data: response.duLieu, total: response.tong, success: true };
                }}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
