'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Descriptions, Drawer, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { apiLayNhatKyKiemToan, type NhatKyKiemToanAdmin } from '@/lib/api-nhat-ky-kiem-toan';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type AuditSearchParams = {
  current?: number;
  pageSize?: number;
  tacNhan?: string;
  hanhDong?: string;
  thucThe?: string;
  ngay?: string[];
};

function jsonDep(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : '—';
}

export default function TrangNhatKyKiemToan() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [chiTiet, setChiTiet] = useState<NhatKyKiemToanAdmin | null>(null);
  const coXemAudit = coQuyen('audit.xem');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
    }
  }, [router]);

  const columns: ProColumns<NhatKyKiemToanAdmin>[] = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: 'Actor',
      dataIndex: 'tacNhan',
      copyable: true,
      width: 220,
    },
    {
      title: 'Action',
      dataIndex: 'hanhDong',
      copyable: true,
      width: 220,
    },
    {
      title: 'Entity',
      dataIndex: 'thucThe',
      copyable: true,
      width: 180,
    },
    {
      title: 'Entity ID',
      dataIndex: 'thucTheId',
      search: false,
      copyable: true,
      ellipsis: true,
      width: 220,
      renderText: (value) => value ?? '—',
    },
    {
      title: 'Date',
      dataIndex: 'ngay',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      render: (_, row) => [
        <a key="detail" onClick={() => setChiTiet(row)}>
          Xem
        </a>,
      ],
    },
  ];

  if (!coXemAudit) {
    return (
      <PageContainer title="Audit Log">
        Bạn không có quyền <Typography.Text code>audit.xem</Typography.Text>.
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Audit Log" subTitle="PHIEN-080 · filter actor / action / entity / date">
      <ProTable<NhatKyKiemToanAdmin, AuditSearchParams>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        options={{ density: false }}
        scroll={{ x: 1250 }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        request={async (params) => {
          const ngay = Array.isArray(params.ngay) ? params.ngay : undefined;
          const response = await apiLayNhatKyKiemToan({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            tacNhan: typeof params.tacNhan === 'string' ? params.tacNhan : undefined,
            hanhDong: typeof params.hanhDong === 'string' ? params.hanhDong : undefined,
            thucThe: typeof params.thucThe === 'string' ? params.thucThe : undefined,
            tuNgay: ngay && typeof ngay[0] === 'string' ? `${ngay[0]}T00:00:00.000Z` : undefined,
            denNgay: ngay && typeof ngay[1] === 'string' ? `${ngay[1]}T23:59:59.999Z` : undefined,
          });

          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
      />

      <Drawer
        width={720}
        title={chiTiet ? `${chiTiet.hanhDong} · ${chiTiet.thucThe}` : 'Audit detail'}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Actor">{chiTiet.tacNhan}</Descriptions.Item>
            <Descriptions.Item label="Actor ID">{chiTiet.tacNhanId ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Action">
              <Typography.Text code>{chiTiet.hanhDong}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Entity">
              <Typography.Text code>{chiTiet.thucThe}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Entity ID">{chiTiet.thucTheId ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {new Date(chiTiet.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Before">
              <pre>{jsonDep(chiTiet.truoc)}</pre>
            </Descriptions.Item>
            <Descriptions.Item label="After">
              <pre>{jsonDep(chiTiet.sau)}</pre>
            </Descriptions.Item>
            <Descriptions.Item label="Metadata">
              <pre>{jsonDep(chiTiet.metadata)}</pre>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}
