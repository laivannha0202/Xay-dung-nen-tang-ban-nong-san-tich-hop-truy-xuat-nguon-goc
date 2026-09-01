'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Descriptions, Drawer, message, Space, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { chuyenKho, layChiTiet, layDanhSach, nhapKho, xuatKho } from '@/lib/api-ton-kho';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TonKho = Awaited<ReturnType<typeof layChiTiet>>;
type NhapForm = { khoId: string; loSanPhamId: string; bienTheSanPhamId: string; soLuong: number };
type XuatForm = { tonKhoLoId: string; soLuong: number };
type ChuyenForm = { tonKhoLoIdNguon: string; khoDichId: string; soLuong: number };

export default function TrangTonKho() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<TonKho | null>(null);
  const [apiMessage, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  const coXem = coQuyen('kho.xem');
  const coDieuChinh = coQuyen('ton_kho.dieu_chinh');

  const refresh = async (noiDung: string) => {
    apiMessage.success(noiDung);
    await actionRef.current?.reload();
  };

  const columns: ProColumns<TonKho>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: { placeholder: 'Mã kho, mã lô, SKU, tên sản phẩm' },
    },
    {
      title: 'Kho',
      search: false,
      render: (_, row) => `${row.kho.maKho} · ${row.kho.ten}`,
    },
    {
      title: 'Lô',
      search: false,
      render: (_, row) => `${row.loSanPham.maLo} · HSD ${row.loSanPham.ngayHetHan}`,
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
      render: (_, row) => (
        <Tag color={row.available > 0 ? 'green' : 'default'}>{row.available}</Tag>
      ),
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
    return <PageContainer title="Tồn kho">Bạn không có quyền xem tồn kho.</PageContainer>;
  }

  return (
    <PageContainer
      title="Tồn kho"
      subTitle="PHIEN-037: nhập/xuất/chuyển kho atomic; PHIEN-038 mới điều chỉnh tồn"
      extra={
        coDieuChinh ? (
          <Space>
            <ModalForm<NhapForm>
              title="Nhập kho"
              trigger={<Button type="primary">Nhập kho</Button>}
              onFinish={async (values) => {
                await nhapKho(values);
                await refresh('Nhập kho thành công');
                return true;
              }}
            >
              <ProFormText name="khoId" label="Kho ID" rules={[{ required: true }]} />
              <ProFormText name="loSanPhamId" label="Lô ID" rules={[{ required: true }]} />
              <ProFormText
                name="bienTheSanPhamId"
                label="Biến thể ID"
                rules={[{ required: true }]}
              />
              <ProFormDigit
                name="soLuong"
                label="Số lượng"
                min={0.001}
                fieldProps={{ precision: 3 }}
                rules={[{ required: true }]}
              />
            </ModalForm>

            <ModalForm<XuatForm>
              title="Xuất kho"
              trigger={<Button>Xuất kho</Button>}
              onFinish={async (values) => {
                await xuatKho(values);
                await refresh('Xuất kho thành công');
                return true;
              }}
            >
              <ProFormText name="tonKhoLoId" label="InventoryLot ID" rules={[{ required: true }]} />
              <ProFormDigit
                name="soLuong"
                label="Số lượng"
                min={0.001}
                fieldProps={{ precision: 3 }}
                rules={[{ required: true }]}
              />
            </ModalForm>

            <ModalForm<ChuyenForm>
              title="Chuyển kho"
              trigger={<Button>Chuyển kho</Button>}
              onFinish={async (values) => {
                await chuyenKho(values);
                await refresh('Chuyển kho thành công');
                return true;
              }}
            >
              <ProFormText
                name="tonKhoLoIdNguon"
                label="InventoryLot nguồn ID"
                rules={[{ required: true }]}
              />
              <ProFormText name="khoDichId" label="Kho đích ID" rules={[{ required: true }]} />
              <ProFormDigit
                name="soLuong"
                label="Số lượng"
                min={0.001}
                fieldProps={{ precision: 3 }}
                rules={[{ required: true }]}
              />
            </ModalForm>
          </Space>
        ) : undefined
      }
    >
      {contextHolder}
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
          return { data: response.duLieu, success: true, total: response.tong };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
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
