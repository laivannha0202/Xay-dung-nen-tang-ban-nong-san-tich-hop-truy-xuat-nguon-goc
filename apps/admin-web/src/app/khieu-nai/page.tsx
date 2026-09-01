'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { message, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ChiTietKhieuNai } from '@/components/chi-tiet-khieu-nai';
import {
  LY_DO_KHIEU_NAI_ADMIN,
  layChiTietKhieuNaiAdmin,
  layDanhSachKhieuNaiAdmin,
  type KhieuNaiChiTietAdmin,
  type TomTatKhieuNaiAdmin,
} from '@/lib/api-khieu-nai';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

const VALUE_ENUM = Object.fromEntries(
  LY_DO_KHIEU_NAI_ADMIN.map((item) => [item.value, { text: item.label }]),
);

function nhanLyDo(value: string): string {
  return LY_DO_KHIEU_NAI_ADMIN.find((item) => item.value === value)?.label ?? value;
}

export default function TrangKhieuNaiQuanTri() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<KhieuNaiChiTietAdmin | null>(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

  useEffect(() => {
    if (!layPhienAdmin()) router.replace('/dang-nhap');
  }, [router]);

  const coXem = coQuyen('don_hang.xu_ly');

  const moChiTiet = async (id: string) => {
    setDangTaiChiTiet(true);
    setChiTiet(null);
    try {
      setChiTiet(await layChiTietKhieuNaiAdmin(id));
    } catch {
      message.error('Không tải được chi tiết khiếu nại.');
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  const columns: ProColumns<TomTatKhieuNaiAdmin>[] = [
    { title: 'Mã đơn', dataIndex: 'maDonHang', copyable: true, search: false },
    { title: 'Sản phẩm', dataIndex: 'tenSanPham', search: false },
    {
      title: 'Lý do',
      dataIndex: 'lyDo',
      valueType: 'select',
      valueEnum: VALUE_ENUM,
      render: (_, row) => <Tag>{nhanLyDo(row.lyDo)}</Tag>,
    },
    { title: 'Bằng chứng', dataIndex: 'soBangChung', search: false, align: 'right' },
    { title: 'Tạo lúc', dataIndex: 'createdAt', valueType: 'dateTime', search: false },
    {
      title: 'Thao tác',
      valueType: 'option',
      render: (_, row) => [
        <a key="detail" onClick={() => void moChiTiet(row.id)}>
          Chi tiết
        </a>,
      ],
    },
  ];

  if (!coXem) {
    return (
      <PageContainer title="Khiếu nại">
        Bạn không có quyền <Typography.Text code>don_hang.xu_ly</Typography.Text>.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Khiếu nại"
      subTitle="PHIEN-069 read-only · order / item / batch / shipment / evidence / timeline / resolution"
    >
      <ProTable<TomTatKhieuNaiAdmin>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSachKhieuNaiAdmin({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            lyDo:
              typeof params.lyDo === 'string'
                ? (params.lyDo as (typeof LY_DO_KHIEU_NAI_ADMIN)[number]['value'])
                : undefined,
          });
          return {
            data: response.items,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <ChiTietKhieuNai
        data={chiTiet}
        loading={dangTaiChiTiet}
        open={dangTaiChiTiet || Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      />
    </PageContainer>
  );
}
