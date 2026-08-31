'use client';

import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhMucHoatDong,
  layDanhSach,
  layTrangTraiHoatDong,
  taoMoi,
} from '@/lib/api-san-pham';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type TrangTraiRutGon = {
  id: string;
  ma: string;
  ten: string;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
};

type DanhMucRutGon = {
  id: string;
  ten: string;
  slug: string;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
};

type SanPham = {
  id: string;
  ten: string;
  moTa: string | null;
  trangTraiId: string;
  trangTrai: TrangTraiRutGon;
  danhMucSanPhamId: string;
  danhMucSanPham: DanhMucRutGon;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  createdAt: string;
  updatedAt: string;
};

type DanhSachSanPham = {
  duLieu: SanPham[];
  tong: number;
  trang: number;
  gioiHan: number;
};

type DanhSachTrangTrai = {
  duLieu: Array<{
    id: string;
    ma: string;
    ten: string;
  }>;
};

type DanhSachDanhMuc = {
  duLieu: Array<{
    id: string;
    ten: string;
    slug: string;
  }>;
};

type FormSanPham = {
  ten: string;
  moTa?: string | null;
  trangTraiId: string;
  danhMucSanPhamId: string;
};

const TRANG_THAI = {
  HOAT_DONG: {
    text: 'Hoạt động',
    color: 'green',
  },
  NGUNG_HOAT_DONG: {
    text: 'Ngừng hoạt động',
    color: 'default',
  },
} as const;

export default function TrangSanPham() {
  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const phien = layPhienAdmin();

  const quyen = phien?.quyen ?? [];

  const coXem = quyen.includes('san_pham.xem');

  const coTao = quyen.includes('san_pham.tao');

  const coSua = quyen.includes('san_pham.sua');

  const coKhoa = quyen.includes('san_pham.khoa');

  const [moTao, setMoTao] = useState(false);

  const [dangSua, setDangSua] = useState<SanPham | null>(null);

  const [trangTraiOptions, setTrangTraiOptions] = useState<
    Array<{
      id: string;
      ma: string;
      ten: string;
    }>
  >([]);

  const [danhMucOptions, setDanhMucOptions] = useState<
    Array<{
      id: string;
      ten: string;
      slug: string;
    }>
  >([]);

  useEffect(() => {
    if (!coXem) {
      return;
    }

    void Promise.all([layTrangTraiHoatDong(), layDanhMucHoatDong()])
      .then(([farms, categories]) => {
        const farmList = farms as DanhSachTrangTrai;

        const categoryList = categories as DanhSachDanhMuc;

        setTrangTraiOptions(farmList.duLieu);

        setDanhMucOptions(categoryList.duLieu);
      })
      .catch(() => {
        setTrangTraiOptions([]);

        setDanhMucOptions([]);
      });
  }, [coXem]);

  const farmSelect = useMemo(
    () =>
      trangTraiOptions.map((item) => ({
        label: `${item.ten} (${item.ma})`,
        value: item.id,
      })),
    [trangTraiOptions],
  );

  const categorySelect = useMemo(
    () =>
      danhMucOptions.map((item) => ({
        label: `${item.ten} (${item.slug})`,
        value: item.id,
      })),
    [danhMucOptions],
  );

  const columns: ProColumns<SanPham>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'ten',
      search: false,
    },
    {
      title: 'Trang trại',
      dataIndex: 'trangTraiId',
      valueType: 'select',
      fieldProps: {
        options: farmSelect,
      },
      render: (_, row) => `${row.trangTrai.ten} (${row.trangTrai.ma})`,
    },
    {
      title: 'Danh mục',
      dataIndex: 'danhMucSanPhamId',
      valueType: 'select',
      fieldProps: {
        options: categorySelect,
      },
      render: (_, row) => row.danhMucSanPham.ten,
    },
    {
      title: 'Mô tả',
      dataIndex: 'moTa',
      search: false,
      ellipsis: true,
      render: (_, row) => row.moTa ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: {
          text: 'Hoạt động',
        },
        NGUNG_HOAT_DONG: {
          text: 'Ngừng hoạt động',
        },
      },
      render: (_, row) => {
        const config = TRANG_THAI[row.trangThai];

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 190,
      render: (_, row) =>
        [
          coSua ? (
            <Button
              key="edit"
              type="link"
              size="small"
              onClick={async () => {
                const detail = (await layChiTiet(row.id)) as SanPham;

                setDangSua(detail);
              }}
            >
              Sửa
            </Button>
          ) : null,
          coKhoa ? (
            <Popconfirm
              key="status"
              title={
                row.trangThai === 'HOAT_DONG'
                  ? 'Ngừng hoạt động sản phẩm này?'
                  : 'Mở lại sản phẩm này?'
              }
              onConfirm={async () => {
                await doiTrangThai(
                  row.id,
                  row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
                );

                message.success('Đã cập nhật trạng thái sản phẩm.');

                await actionRef.current?.reload();
              }}
            >
              <Button type="link" size="small" danger={row.trangThai === 'HOAT_DONG'}>
                {row.trangThai === 'HOAT_DONG' ? 'Khóa' : 'Mở'}
              </Button>
            </Popconfirm>
          ) : null,
        ].filter(Boolean),
    },
  ];

  if (!coXem) {
    return <PageContainer title="Sản phẩm">Bạn không có quyền xem sản phẩm.</PageContainer>;
  }

  return (
    <PageContainer
      title="Sản phẩm"
      extra={
        coTao
          ? [
              <Button key="create" type="primary" onClick={() => setMoTao(true)}>
                Tạo sản phẩm
              </Button>,
            ]
          : undefined
      }
    >
      <ProTable<SanPham>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
        }}
        request={async (params) => {
          const result = (await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            trangTraiId: typeof params.trangTraiId === 'string' ? params.trangTraiId : undefined,
            danhMucSanPhamId:
              typeof params.danhMucSanPhamId === 'string' ? params.danhMucSanPhamId : undefined,
            trangThai:
              params.trangThai === 'HOAT_DONG' || params.trangThai === 'NGUNG_HOAT_DONG'
                ? params.trangThai
                : undefined,
          })) as DanhSachSanPham;

          return {
            data: result.duLieu,
            total: result.tong,
            success: true,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
      />

      <ModalForm<FormSanPham>
        title="Tạo sản phẩm"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setMoTao(false);
          }
        }}
        onFinish={async (values) => {
          await taoMoi({
            ten: values.ten,
            moTa: values.moTa ?? null,
            trangTraiId: values.trangTraiId,
            danhMucSanPhamId: values.danhMucSanPhamId,
          });

          message.success('Đã tạo sản phẩm.');

          setMoTao(false);

          await actionRef.current?.reload();

          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên sản phẩm"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập tên sản phẩm',
            },
            {
              max: 200,
            },
          ]}
        />

        <ProFormTextArea
          name="moTa"
          label="Mô tả"
          fieldProps={{
            maxLength: 5000,
            showCount: true,
            autoSize: {
              minRows: 3,
              maxRows: 8,
            },
          }}
        />

        <ProFormSelect
          name="trangTraiId"
          label="Trang trại"
          options={farmSelect}
          rules={[
            {
              required: true,
              message: 'Chọn trang trại',
            },
          ]}
        />

        <ProFormSelect
          name="danhMucSanPhamId"
          label="Danh mục"
          options={categorySelect}
          rules={[
            {
              required: true,
              message: 'Chọn danh mục',
            },
          ]}
        />
      </ModalForm>

      <ModalForm<FormSanPham>
        key={dangSua?.id ?? 'edit-empty'}
        title="Sửa sản phẩm"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                ten: dangSua.ten,
                moTa: dangSua.moTa ?? undefined,
                trangTraiId: dangSua.trangTraiId,
                danhMucSanPhamId: dangSua.danhMucSanPhamId,
              }
            : undefined
        }
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

          await capNhat(dangSua.id, {
            ten: values.ten,
            moTa: values.moTa ?? null,
            trangTraiId: values.trangTraiId,
            danhMucSanPhamId: values.danhMucSanPhamId,
          });

          message.success('Đã cập nhật sản phẩm.');

          setDangSua(null);

          await actionRef.current?.reload();

          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên sản phẩm"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập tên sản phẩm',
            },
            {
              max: 200,
            },
          ]}
        />

        <ProFormTextArea
          name="moTa"
          label="Mô tả"
          fieldProps={{
            maxLength: 5000,
            showCount: true,
            autoSize: {
              minRows: 3,
              maxRows: 8,
            },
          }}
        />

        <ProFormSelect
          name="trangTraiId"
          label="Trang trại"
          options={farmSelect}
          rules={[
            {
              required: true,
              message: 'Chọn trang trại',
            },
          ]}
        />

        <ProFormSelect
          name="danhMucSanPhamId"
          label="Danh mục"
          options={categorySelect}
          rules={[
            {
              required: true,
              message: 'Chọn danh mục',
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
}
