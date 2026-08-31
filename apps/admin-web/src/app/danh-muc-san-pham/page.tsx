'use client';

import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { App, Button, Image, Popconfirm, Space, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  capNhat,
  doiTrangThai,
  layChiTiet,
  layDanhMucHoatDong,
  layDanhSach,
  taiAnhDanhMuc,
  taoMoi,
} from '@/lib/api-danh-muc-san-pham';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type AnhDanhMuc = {
  id: string;
  tenGoc: string;
  mimeType: string;
  url: string;
};

type DanhMucRutGon = {
  id: string;
  ten: string;
  slug: string;
};

type DanhMuc = {
  id: string;
  ten: string;
  slug: string;
  danhMucChaId: string | null;
  danhMucCha: DanhMucRutGon | null;
  anhId: string | null;
  anh: AnhDanhMuc | null;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  soDanhMucCon: number;
  createdAt: string;
  updatedAt: string;
};

type DanhSach = {
  duLieu: DanhMuc[];
  tong: number;
  trang: number;
  gioiHan: number;
};

type FormDanhMuc = {
  ten: string;
  slug: string;
  danhMucChaId?: string | null;
};

type AnhDaTai = {
  id: string;
  tenGoc: string;
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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function TrangDanhMucSanPham() {
  const { message } = App.useApp();

  const actionRef = useRef<ActionType>(null);

  const phien = layPhienAdmin();

  const quyen = phien?.quyen ?? [];

  const coXem = quyen.includes('danh_muc_san_pham.xem');

  const coTao = quyen.includes('danh_muc_san_pham.tao');

  const coSua = quyen.includes('danh_muc_san_pham.sua');

  const coKhoa = quyen.includes('danh_muc_san_pham.khoa');

  const [moTao, setMoTao] = useState(false);

  const [dangSua, setDangSua] = useState<DanhMuc | null>(null);

  const [parentOptions, setParentOptions] = useState<DanhMuc[]>([]);

  const [anhTao, setAnhTao] = useState<AnhDaTai | null>(null);

  const [anhSuaId, setAnhSuaId] = useState<string | null>(null);

  const [anhSuaTen, setAnhSuaTen] = useState<string | null>(null);

  useEffect(() => {
    if (!coXem) {
      return;
    }

    void layDanhMucHoatDong()
      .then((response) => {
        const data = response as DanhSach;

        setParentOptions(data.duLieu);
      })
      .catch(() => {
        setParentOptions([]);
      });
  }, [coXem]);

  const parentSelect = useMemo(
    () =>
      parentOptions
        .filter((item) => item.id !== dangSua?.id)
        .map((item) => ({
          label: `${item.ten} (${item.slug})`,
          value: item.id,
        })),
    [parentOptions, dangSua?.id],
  );

  const uploadProps = (onUploaded: (file: AnhDaTai) => void): UploadProps => ({
    maxCount: 1,
    accept: 'image/jpeg,image/png,image/webp',
    showUploadList: false,
    customRequest: async (options) => {
      try {
        const file = options.file;

        if (!(file instanceof File)) {
          throw new Error('File ảnh không hợp lệ.');
        }

        const result = await taiAnhDanhMuc(file);

        onUploaded({
          id: result.id,
          tenGoc: result.tenGoc,
        });

        options.onSuccess?.(result);

        message.success('Đã tải ảnh danh mục.');
      } catch (error) {
        const thongBao = error instanceof Error ? error.message : 'Không tải được ảnh.';

        message.error(thongBao);

        options.onError?.(error instanceof Error ? error : new Error(thongBao));
      }
    },
  });

  const columns: ProColumns<DanhMuc>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Ảnh',
      dataIndex: 'anh',
      search: false,
      width: 80,
      render: (_, row) =>
        row.anh ? (
          <Image
            src={row.anh.url}
            alt={row.ten}
            width={48}
            height={48}
            style={{
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: 'Tên',
      dataIndex: 'ten',
      search: false,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      search: false,
      copyable: true,
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'danhMucChaId',
      valueType: 'select',
      fieldProps: {
        options: parentOptions.map((item) => ({
          label: item.ten,
          value: item.id,
        })),
      },
      render: (_, row) => row.danhMucCha?.ten ?? 'Danh mục gốc',
    },
    {
      title: 'Danh mục con',
      dataIndex: 'soDanhMucCon',
      search: false,
      width: 110,
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
      width: 210,
      render: (_, row) =>
        [
          coSua ? (
            <Button
              key="edit"
              type="link"
              size="small"
              onClick={async () => {
                const detail = (await layChiTiet(row.id)) as DanhMuc;

                setDangSua(detail);

                setAnhSuaId(detail.anhId);

                setAnhSuaTen(detail.anh?.tenGoc ?? null);
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
                  ? 'Ngừng hoạt động danh mục này?'
                  : 'Mở lại danh mục này?'
              }
              onConfirm={async () => {
                await doiTrangThai(
                  row.id,
                  row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
                );

                message.success('Đã cập nhật trạng thái.');

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
    return (
      <PageContainer title="Danh mục sản phẩm">
        Bạn không có quyền xem danh mục sản phẩm.
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Danh mục sản phẩm"
      extra={
        coTao
          ? [
              <Button
                key="create"
                type="primary"
                onClick={() => {
                  setAnhTao(null);

                  setMoTao(true);
                }}
              >
                Tạo danh mục
              </Button>,
            ]
          : undefined
      }
    >
      <ProTable<DanhMuc>
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
            trangThai:
              params.trangThai === 'HOAT_DONG' || params.trangThai === 'NGUNG_HOAT_DONG'
                ? params.trangThai
                : undefined,
            danhMucChaId: typeof params.danhMucChaId === 'string' ? params.danhMucChaId : undefined,
          })) as DanhSach;

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

      <ModalForm<FormDanhMuc>
        title="Tạo danh mục sản phẩm"
        open={moTao}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setMoTao(false),
        }}
        onOpenChange={(open) => {
          if (!open) {
            setMoTao(false);

            setAnhTao(null);
          }
        }}
        onFinish={async (values) => {
          await taoMoi({
            ten: values.ten,
            slug: values.slug,
            danhMucChaId: values.danhMucChaId ?? null,
            anhId: anhTao?.id ?? null,
          });

          message.success('Đã tạo danh mục sản phẩm.');

          setMoTao(false);

          setAnhTao(null);

          await actionRef.current?.reload();

          const refreshed = (await layDanhMucHoatDong()) as DanhSach;

          setParentOptions(refreshed.duLieu);

          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên danh mục"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập tên danh mục',
            },
            {
              max: 150,
            },
          ]}
        />

        <ProFormText
          name="slug"
          label="Slug"
          tooltip="Chữ thường không dấu, số và dấu gạch ngang"
          rules={[
            {
              required: true,
              message: 'Nhập slug',
            },
            {
              pattern: SLUG_PATTERN,
              message: 'Slug không hợp lệ',
            },
            {
              max: 191,
            },
          ]}
        />

        <ProFormSelect
          name="danhMucChaId"
          label="Danh mục cha"
          options={parentSelect}
          allowClear
          placeholder="Để trống nếu là danh mục gốc"
        />

        <Space
          direction="vertical"
          style={{
            width: '100%',
          }}
        >
          <Upload {...uploadProps(setAnhTao)}>
            <Button>Tải ảnh danh mục</Button>
          </Upload>

          {anhTao ? (
            <Tag closable onClose={() => setAnhTao(null)}>
              {anhTao.tenGoc}
            </Tag>
          ) : null}
        </Space>
      </ModalForm>

      <ModalForm<FormDanhMuc>
        key={dangSua?.id ?? 'edit-empty'}
        title="Sửa danh mục sản phẩm"
        open={Boolean(dangSua)}
        initialValues={
          dangSua
            ? {
                ten: dangSua.ten,
                slug: dangSua.slug,
                danhMucChaId: dangSua.danhMucChaId ?? undefined,
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

            setAnhSuaId(null);

            setAnhSuaTen(null);
          }
        }}
        onFinish={async (values) => {
          if (!dangSua) {
            return false;
          }

          await capNhat(dangSua.id, {
            ten: values.ten,
            slug: values.slug,
            danhMucChaId: values.danhMucChaId ?? null,
            anhId: anhSuaId,
          });

          message.success('Đã cập nhật danh mục sản phẩm.');

          setDangSua(null);

          setAnhSuaId(null);

          setAnhSuaTen(null);

          await actionRef.current?.reload();

          const refreshed = (await layDanhMucHoatDong()) as DanhSach;

          setParentOptions(refreshed.duLieu);

          return true;
        }}
      >
        <ProFormText
          name="ten"
          label="Tên danh mục"
          rules={[
            {
              required: true,
              whitespace: true,
              message: 'Nhập tên danh mục',
            },
            {
              max: 150,
            },
          ]}
        />

        <ProFormText
          name="slug"
          label="Slug"
          rules={[
            {
              required: true,
              message: 'Nhập slug',
            },
            {
              pattern: SLUG_PATTERN,
              message: 'Slug không hợp lệ',
            },
            {
              max: 191,
            },
          ]}
        />

        <ProFormSelect
          name="danhMucChaId"
          label="Danh mục cha"
          options={parentSelect}
          allowClear
          placeholder="Để trống nếu là danh mục gốc"
        />

        <Space
          direction="vertical"
          style={{
            width: '100%',
          }}
        >
          <Upload
            {...uploadProps((file) => {
              setAnhSuaId(file.id);

              setAnhSuaTen(file.tenGoc);
            })}
          >
            <Button>Thay ảnh</Button>
          </Upload>

          {anhSuaTen ? (
            <Tag
              closable
              onClose={() => {
                setAnhSuaId(null);

                setAnhSuaTen(null);
              }}
            >
              {anhSuaTen}
            </Tag>
          ) : (
            <span>Chưa có ảnh</span>
          )}
        </Space>
      </ModalForm>
    </PageContainer>
  );
}
