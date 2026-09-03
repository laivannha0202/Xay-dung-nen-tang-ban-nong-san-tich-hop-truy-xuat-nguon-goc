'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Button, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { layDanhMucHoatDong } from '@/lib/api-danh-muc-san-pham';
import { layDanhSach as layDanhSachNhaCungCap } from '@/lib/api-nha-cung-cap';
import {
  apiCapNhatQuyTacHoaHong,
  apiLayDanhSachQuyTacHoaHong,
  apiTaoQuyTacHoaHong,
} from '@/lib/api-quy-tac-hoa-hong';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type QuyTacHoaHong = {
  id: string;
  tyLe: number;
  danhMucSanPhamId: string;
  tenDanhMucSanPham: string;
  nhaCungCapId: string;
  tenNhaCungCap: string;
  hieuLucTu: string;
  createdAt: string;
  updatedAt: string;
};

type FormQuyTacHoaHong = {
  tyLe: number;
  danhMucSanPhamId: string;
  nhaCungCapId: string;
  hieuLucTu: string;
};

type LuaChon = { label: string; value: string };

function sangIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Thời điểm hiệu lực không hợp lệ.');
  }
  return date.toISOString();
}

function sangDatetimeLocal(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function FormFields({ danhMuc, nhaCungCap }: { danhMuc: LuaChon[]; nhaCungCap: LuaChon[] }) {
  return (
    <>
      <ProFormDigit
        name="tyLe"
        label="Tỷ lệ hoa hồng (%)"
        min={0}
        max={100}
        fieldProps={{ precision: 2 }}
        rules={[{ required: true, message: 'Nhập tỷ lệ hoa hồng.' }]}
      />
      <ProFormSelect
        name="danhMucSanPhamId"
        label="Danh mục"
        options={danhMuc}
        rules={[{ required: true, message: 'Chọn danh mục.' }]}
        fieldProps={{ showSearch: true }}
      />
      <ProFormSelect
        name="nhaCungCapId"
        label="Nhà cung cấp"
        options={nhaCungCap}
        rules={[{ required: true, message: 'Chọn nhà cung cấp.' }]}
        fieldProps={{ showSearch: true }}
      />
      <ProFormText
        name="hieuLucTu"
        label="Hiệu lực từ"
        fieldProps={{ type: 'datetime-local' }}
        rules={[{ required: true, message: 'Chọn thời điểm hiệu lực.' }]}
        extra="Rule đã có hiệu lực sẽ không được sửa; hãy tạo rule mới cho lần thay đổi tiếp theo."
      />
    </>
  );
}

export default function TrangQuyTacHoaHong() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [danhMucOptions, setDanhMucOptions] = useState<LuaChon[]>([]);
  const [nhaCungCapOptions, setNhaCungCapOptions] = useState<LuaChon[]>([]);
  const [dangSua, setDangSua] = useState<QuyTacHoaHong | null>(null);
  const [loiLuaChon, setLoiLuaChon] = useState<string | null>(null);
  const coQuanLy = coQuyen('phan_quyen.quan_ly');

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
      return;
    }

    if (!coQuanLy) return;
    let active = true;
    void Promise.all([
      layDanhMucHoatDong(),
      layDanhSachNhaCungCap({ trang: 1, gioiHan: 100, trangThai: 'HOAT_DONG' }),
    ])
      .then(([danhMuc, nhaCungCap]) => {
        if (!active) return;
        setDanhMucOptions(danhMuc.duLieu.map((item) => ({ label: item.ten, value: item.id })));
        setNhaCungCapOptions(
          nhaCungCap.duLieu.map((item) => ({ label: `${item.ma} · ${item.ten}`, value: item.id })),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoiLuaChon(error instanceof Error ? error.message : 'Không tải được dữ liệu lựa chọn.');
      });

    return () => {
      active = false;
    };
  }, [coQuanLy, router]);

  const columns: ProColumns<QuyTacHoaHong>[] = [
    {
      title: 'Tỷ lệ',
      dataIndex: 'tyLe',
      search: false,
      width: 100,
      render: (_, row) => <Tag color="blue">{Number(row.tyLe).toFixed(2)}%</Tag>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'danhMucSanPhamId',
      valueType: 'select',
      fieldProps: { options: danhMucOptions, showSearch: true },
      render: (_, row) => row.tenDanhMucSanPham,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'nhaCungCapId',
      valueType: 'select',
      fieldProps: { options: nhaCungCapOptions, showSearch: true },
      render: (_, row) => row.tenNhaCungCap,
    },
    {
      title: 'Hiệu lực từ',
      dataIndex: 'hieuLucTu',
      valueType: 'dateTime',
      search: false,
      width: 190,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
      render: (_, row) =>
        new Date(row.hieuLucTu).getTime() > Date.now()
          ? [
              <Button key="edit" type="link" size="small" onClick={() => setDangSua(row)}>
                Sửa
              </Button>,
            ]
          : [<Tag key="effective">Đã hiệu lực</Tag>],
    },
  ];

  if (!coQuanLy) {
    return (
      <PageContainer title="Quy tắc hoa hồng">
        <Alert
          type="warning"
          showIcon
          message="Không đủ quyền"
          description="Bạn cần quyền phan_quyen.quan_ly để quản lý Commission Rules."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Quy tắc hoa hồng"
      subTitle="PHIEN-082 · percentage / category / supplier / effective date"
    >
      {loiLuaChon ? (
        <Alert type="error" showIcon message={loiLuaChon} style={{ marginBottom: 16 }} />
      ) : null}
      <ProTable<QuyTacHoaHong>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const response = await apiLayDanhSachQuyTacHoaHong({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            danhMucSanPhamId:
              typeof params.danhMucSanPhamId === 'string' ? params.danhMucSanPhamId : undefined,
            nhaCungCapId: typeof params.nhaCungCapId === 'string' ? params.nhaCungCapId : undefined,
          });
          return { data: response.duLieu, total: response.tong, success: true };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <ModalForm<FormQuyTacHoaHong>
            key="create"
            title="Tạo quy tắc hoa hồng"
            trigger={<Button type="primary">Thêm quy tắc</Button>}
            initialValues={{ hieuLucTu: sangDatetimeLocal(new Date().toISOString()) }}
            modalProps={{ destroyOnHidden: true }}
            onFinish={async (values) => {
              try {
                await apiTaoQuyTacHoaHong({ ...values, hieuLucTu: sangIso(values.hieuLucTu) });
                message.success('Đã tạo quy tắc hoa hồng.');
                actionRef.current?.reload();
                return true;
              } catch (error) {
                message.error(error instanceof Error ? error.message : 'Không tạo được quy tắc.');
                return false;
              }
            }}
          >
            <FormFields danhMuc={danhMucOptions} nhaCungCap={nhaCungCapOptions} />
          </ModalForm>,
        ]}
      />

      <ModalForm<FormQuyTacHoaHong>
        key={dangSua?.id ?? 'edit'}
        title="Cập nhật quy tắc chưa hiệu lực"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                tyLe: dangSua.tyLe,
                danhMucSanPhamId: dangSua.danhMucSanPhamId,
                nhaCungCapId: dangSua.nhaCungCapId,
                hieuLucTu: sangDatetimeLocal(dangSua.hieuLucTu),
              }
            : undefined
        }
        modalProps={{ destroyOnHidden: true, onCancel: () => setDangSua(null) }}
        onOpenChange={(open) => {
          if (!open) setDangSua(null);
        }}
        onFinish={async (values) => {
          if (!dangSua) return false;
          try {
            await apiCapNhatQuyTacHoaHong(dangSua.id, {
              ...values,
              hieuLucTu: sangIso(values.hieuLucTu),
            });
            message.success('Đã cập nhật quy tắc hoa hồng.');
            setDangSua(null);
            actionRef.current?.reload();
            return true;
          } catch (error) {
            message.error(error instanceof Error ? error.message : 'Không cập nhật được quy tắc.');
            return false;
          }
        }}
      >
        <FormFields danhMuc={danhMucOptions} nhaCungCap={nhaCungCapOptions} />
      </ModalForm>
    </PageContainer>
  );
}
