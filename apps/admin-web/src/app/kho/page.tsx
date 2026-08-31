'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Popconfirm, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, doiTrangThai, layChiTiet, layDanhSach, taoMoi } from '@/lib/api-kho';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type Kho = Awaited<ReturnType<typeof layChiTiet>>;

type FormKho = {
  maKho: string;
  ten: string;
  diaChi: string;
};

export default function TrangKho() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [chiTiet, setChiTiet] = useState<Kho | null>(null);
  const [dangSua, setDangSua] = useState<Kho | null>(null);

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
    }
  }, [router]);

  const coXem = coQuyen('kho.xem');
  const coTao = coQuyen('kho.tao');
  const coSua = coQuyen('kho.sua');
  const coKhoa = coQuyen('kho.khoa');

  const columns: ProColumns<Kho>[] = [
    {
      title: 'Mã kho',
      dataIndex: 'maKho',
      width: 150,
    },
    {
      title: 'Tên kho',
      dataIndex: 'ten',
      ellipsis: true,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: { text: 'Hoạt động', status: 'Success' },
        NGUNG_HOAT_DONG: { text: 'Ngừng hoạt động', status: 'Default' },
      },
      render: (_, row) => (
        <Tag color={row.trangThai === 'HOAT_DONG' ? 'green' : 'default'}>
          {row.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 220,
      render: (_, row) => [
        <Button
          key="detail"
          type="link"
          size="small"
          onClick={async () => setChiTiet(await layChiTiet(row.id))}
        >
          Chi tiết
        </Button>,
        coSua ? (
          <Button key="edit" type="link" size="small" onClick={() => setDangSua(row)}>
            Sửa
          </Button>
        ) : null,
        coKhoa ? (
          <Popconfirm
            key="state"
            title={row.trangThai === 'HOAT_DONG' ? 'Khóa kho?' : 'Mở lại kho?'}
            onConfirm={async () => {
              await doiTrangThai(row.id, {
                trangThai: row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
              });
              message.success('Đã cập nhật trạng thái kho.');
              actionRef.current?.reload();
            }}
          >
            <Button danger={row.trangThai === 'HOAT_DONG'} type="link" size="small">
              {row.trangThai === 'HOAT_DONG' ? 'Khóa' : 'Mở'}
            </Button>
          </Popconfirm>
        ) : null,
      ],
    },
  ];

  if (!coXem) {
    return <PageContainer title="Kho">Bạn không có quyền xem kho.</PageContainer>;
  }

  return (
    <PageContainer
      title="Kho"
      subTitle="Master data Kho PHIEN-034; tồn kho theo lô/biến thể được triển khai ở PHIEN-035"
    >
      <ProTable<Kho>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem:
              typeof params.maKho === 'string'
                ? params.maKho
                : typeof params.ten === 'string'
                  ? params.ten
                  : undefined,
            trangThai: params.trangThai as 'HOAT_DONG' | 'NGUNG_HOAT_DONG' | undefined,
          });
          return {
            data: response.duLieu,
            success: true,
            total: response.tong,
          };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        toolBarRender={() =>
          coTao
            ? [
                <ModalForm<FormKho>
                  key="create"
                  title="Thêm kho"
                  trigger={<Button type="primary">Thêm kho</Button>}
                  modalProps={{ destroyOnHidden: true }}
                  onFinish={async (values) => {
                    await taoMoi(values);
                    message.success('Đã tạo kho.');
                    actionRef.current?.reload();
                    return true;
                  }}
                >
                  <FormFields />
                </ModalForm>,
              ]
            : []
        }
      />

      <ModalForm<FormKho>
        title="Cập nhật kho"
        open={Boolean(dangSua)}
        initialValues={dangSua ?? undefined}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setDangSua(null),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDangSua(null);
          }
        }}
        onFinish={async (values) => {
          if (!dangSua) {
            return false;
          }
          await capNhat(dangSua.id, values);
          message.success('Đã cập nhật kho.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết kho"
        width={560}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              { key: 'maKho', label: 'Mã kho', children: chiTiet.maKho },
              { key: 'ten', label: 'Tên kho', children: chiTiet.ten },
              { key: 'diaChi', label: 'Địa chỉ', children: chiTiet.diaChi },
              {
                key: 'trangThai',
                label: 'Trạng thái',
                children: chiTiet.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng hoạt động',
              },
            ]}
          />
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields() {
  return (
    <>
      <ProFormText
        name="maKho"
        label="Mã kho"
        fieldProps={{ maxLength: 50 }}
        rules={[{ required: true, whitespace: true, message: 'Nhập mã kho' }]}
      />
      <ProFormText
        name="ten"
        label="Tên kho"
        fieldProps={{ maxLength: 200 }}
        rules={[{ required: true, whitespace: true, message: 'Nhập tên kho' }]}
      />
      <ProFormTextArea
        name="diaChi"
        label="Địa chỉ"
        fieldProps={{ maxLength: 500 }}
        rules={[{ required: true, whitespace: true, message: 'Nhập địa chỉ kho' }]}
      />
    </>
  );
}
