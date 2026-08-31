'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Descriptions, Drawer, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layChiTiet, layDanhSach } from '@/lib/api-ton-kho';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TonKho = Awaited<ReturnType<typeof layChiTiet>>;

export default function TrangTonKho() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<TonKho | null>(null);

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
    }
  }, [router]);

  const coXem = coQuyen('kho.xem');

  const columns: ProColumns<TonKho>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Mã kho, mã lô, SKU, tên sản phẩm',
      },
    },
    {
      title: 'Kho',
      search: false,
      render: (_, row) => (
        <span>
          {row.kho.maKho} · {row.kho.ten}
        </span>
      ),
    },
    {
      title: 'Lô',
      search: false,
      render: (_, row) => (
        <span>
          {row.loSanPham.maLo}
          <br />
          <small>HSD {row.loSanPham.ngayHetHan}</small>
        </span>
      ),
    },
    {
      title: 'Sản phẩm / SKU',
      search: false,
      render: (_, row) => (
        <span>
          {row.bienThe.tenSanPham}
          <br />
          <small>
            {row.bienThe.sku} · {row.bienThe.khoiLuong} {row.bienThe.donVi}
          </small>
        </span>
      ),
    },
    {
      title: 'On hand',
      dataIndex: 'onHand',
      search: false,
      align: 'right',
      width: 100,
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved',
      search: false,
      align: 'right',
      width: 100,
    },
    {
      title: 'Blocked',
      dataIndex: 'blocked',
      search: false,
      align: 'right',
      width: 100,
    },
    {
      title: 'Available',
      dataIndex: 'available',
      search: false,
      align: 'right',
      width: 110,
      render: (_, row) => (
        <Tag color={row.available > 0 ? 'green' : 'default'}>{row.available}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      render: (_, row) => [
        <a
          key="detail"
          onClick={async () => {
            setChiTiet(await layChiTiet(row.id));
          }}
        >
          Chi tiết
        </a>,
      ],
    },
  ];

  if (!coXem) {
    return <PageContainer title="Tồn kho">Bạn không có quyền xem tồn kho.</PageContainer>;
  }

  return (
    <PageContainer
      title="Tồn kho"
      subTitle="InventoryLot theo Kho + Lô + Biến thể; PHIEN-035 chỉ đọc, chưa ledger/mutation"
    >
      <ProTable<TonKho>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
          });

          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
      />

      <Drawer
        title="Chi tiết tồn kho theo lô"
        width={620}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'key',
                label: 'Key',
                children: `${chiTiet.kho.maKho} + ${chiTiet.loSanPham.maLo} + ${chiTiet.bienThe.sku}`,
              },
              {
                key: 'kho',
                label: 'Kho',
                children: `${chiTiet.kho.maKho} · ${chiTiet.kho.ten}`,
              },
              {
                key: 'lo',
                label: 'Lô',
                children: `${chiTiet.loSanPham.maLo} · HSD ${chiTiet.loSanPham.ngayHetHan}`,
              },
              {
                key: 'variant',
                label: 'Biến thể',
                children: `${chiTiet.bienThe.tenSanPham} · ${chiTiet.bienThe.sku}`,
              },
              { key: 'onHand', label: 'On hand', children: chiTiet.onHand },
              { key: 'reserved', label: 'Reserved', children: chiTiet.reserved },
              { key: 'blocked', label: 'Blocked', children: chiTiet.blocked },
              {
                key: 'available',
                label: 'Available',
                children: `${chiTiet.available} = ${chiTiet.onHand} - ${chiTiet.reserved} - ${chiTiet.blocked}`,
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
