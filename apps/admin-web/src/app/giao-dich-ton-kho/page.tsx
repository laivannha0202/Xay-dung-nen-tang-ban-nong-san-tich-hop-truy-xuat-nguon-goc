'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Descriptions, Drawer, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layChiTiet, layDanhSach } from '@/lib/api-giao-dich-ton-kho';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type GiaoDich = Awaited<ReturnType<typeof layChiTiet>>;

const LOAI = [
  'HARVEST_IN',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ORDER_RESERVE',
  'ORDER_RELEASE',
  'ORDER_SHIP',
  'RETURN_IN',
  'DAMAGE',
  'EXPIRE',
  'ADJUSTMENT',
] as const;

export default function TrangGiaoDichTonKho() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<GiaoDich | null>(null);

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  const coXem = coQuyen('kho.xem');

  const columns: ProColumns<GiaoDich>[] = [
    {
      title: 'Loại',
      dataIndex: 'loai',
      valueType: 'select',
      valueEnum: Object.fromEntries(LOAI.map((item) => [item, { text: item }])),
      render: (_, row) => <Tag>{row.loai}</Tag>,
    },
    {
      title: 'Kho',
      search: false,
      render: (_, row) => `${row.kho.maKho} · ${row.kho.ten}`,
    },
    {
      title: 'Lô',
      search: false,
      render: (_, row) => row.loSanPham.maLo,
    },
    {
      title: 'SKU / Sản phẩm',
      search: false,
      render: (_, row) => `${row.bienThe.sku} · ${row.bienThe.tenSanPham}`,
    },
    {
      title: 'Số lượng',
      dataIndex: 'soLuong',
      search: false,
      align: 'right',
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <a key="detail" onClick={async () => setChiTiet(await layChiTiet(row.id))}>
          Chi tiết
        </a>,
      ],
    },
  ];

  if (!coXem) {
    return (
      <PageContainer title="Inventory Transaction Ledger">
        Bạn không có quyền xem ledger tồn kho.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Inventory Transaction Ledger"
      subTitle="PHIEN-036 immutable/read-only; correction phải append transaction mới"
    >
      <ProTable<GiaoDich>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            loai: typeof params.loai === 'string' ? (params.loai as GiaoDich['loai']) : undefined,
          });
          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        title="Chi tiết giao dịch tồn kho"
        width={620}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              { key: 'id', label: 'ID', children: chiTiet.id },
              { key: 'type', label: 'Loại', children: chiTiet.loai },
              { key: 'qty', label: 'Số lượng', children: chiTiet.soLuong },
              {
                key: 'key',
                label: 'InventoryLot',
                children: `${chiTiet.kho.maKho} + ${chiTiet.loSanPham.maLo} + ${chiTiet.bienThe.sku}`,
              },
              {
                key: 'time',
                label: 'Created at',
                children: new Date(chiTiet.createdAt).toLocaleString('vi-VN'),
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
