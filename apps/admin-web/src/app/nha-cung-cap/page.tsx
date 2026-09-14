'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Popconfirm, Space, Spin, Tag } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, doiTrangThai, layChiTiet, layDanhSach, taoMoi } from '@/lib/api-nha-cung-cap';
import { layDanhSach as layDanhSachTrangTrai } from '@/lib/api-trang-trai';
import { coQuyen, layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type NhaCungCap = Awaited<ReturnType<typeof layChiTiet>>;
type TrangTraiNhaCungCap = Awaited<ReturnType<typeof layDanhSachTrangTrai>>['duLieu'][number];

type FormNhaCungCap = {
  ma: string;
  ten: string;
  nguoiDaiDien?: string;
  soDienThoai?: string;
  email?: string;
  diaChi?: string;
  ghiChu?: string;
};

export default function TrangNhaCungCap() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [chiTiet, setChiTiet] = useState<NhaCungCap | null>(null);
  const [dangSua, setDangSua] = useState<NhaCungCap | null>(null);
  const [trangTraiLienQuan, setTrangTraiLienQuan] = useState<TrangTraiNhaCungCap[]>([]);
  const [dangTaiTrangTrai, setDangTaiTrangTrai] = useState(false);
  const [loiTrangTrai, setLoiTrangTrai] = useState<string | null>(null);

  useEffect(() => {
    if (!layPhienAdmin()) {
      router.replace('/dang-nhap');
    }
  }, [router]);

  const coXem = coQuyen('nha_cung_cap.xem');
  const coTao = coQuyen('nha_cung_cap.tao');
  const coSua = coQuyen('nha_cung_cap.sua');
  const coKhoa = coQuyen('nha_cung_cap.khoa');

  const moChiTiet = async (id: string) => {
    try {
      const item = await layChiTiet(id);
      setChiTiet(item);
      setTrangTraiLienQuan([]);
      setLoiTrangTrai(null);
      setDangTaiTrangTrai(true);
      try {
        const farms = await layDanhSachTrangTrai({
          trang: 1,
          gioiHan: 20,
          nhaCungCapId: id,
        });
        setTrangTraiLienQuan(farms.duLieu);
      } catch (error) {
        setLoiTrangTrai(error instanceof Error ? error.message : 'Không tải được trang trại.');
      } finally {
        setDangTaiTrangTrai(false);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không tải được chi tiết.');
    }
  };

  const columns: ProColumns<NhaCungCap>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm mã, tên, người đại diện, email, điện thoại...',
      },
    },
    {
      title: 'Mã',
      dataIndex: 'ma',
      width: 130,
      search: false,
    },
    {
      title: 'Tên nhà cung cấp',
      dataIndex: 'ten',
      ellipsis: true,
      search: false,
    },
    {
      title: 'Người đại diện',
      dataIndex: 'nguoiDaiDien',
      search: false,
      render: (_, row) => row.nguoiDaiDien ?? '—',
    },
    {
      title: 'Điện thoại',
      dataIndex: 'soDienThoai',
      search: false,
      width: 140,
      render: (_, row) => row.soDienThoai ?? '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      search: false,
      ellipsis: true,
      render: (_, row) => row.email ?? '—',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'diaChi',
      search: false,
      ellipsis: true,
      render: (_, row) => row.diaChi ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      valueType: 'select',
      valueEnum: {
        HOAT_DONG: {
          text: 'Hoạt động',
          status: 'Success',
        },
        NGUNG_HOAT_DONG: {
          text: 'Ngừng hoạt động',
          status: 'Default',
        },
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
      width: 200,
      render: (_, row) => [
        <Button key="detail" type="link" size="small" onClick={() => void moChiTiet(row.id)}>
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
            title={row.trangThai === 'HOAT_DONG' ? 'Khóa nhà cung cấp?' : 'Mở lại nhà cung cấp?'}
            onConfirm={async () => {
              await doiTrangThai(row.id, {
                trangThai: row.trangThai === 'HOAT_DONG' ? 'NGUNG_HOAT_DONG' : 'HOAT_DONG',
              });
              message.success('Đã cập nhật trạng thái.');
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
    return <PageContainer title="Nhà cung cấp">Bạn không có quyền xem nhà cung cấp.</PageContainer>;
  }

  return (
    <PageContainer title="Nhà cung cấp" subTitle="Quản lý nguồn cung AgriMarket">
      <ProTable<NhaCungCap>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params) => {
          const response = await layDanhSach({
            trang: params.current ?? 1,
            gioiHan: params.pageSize ?? 20,
            timKiem: typeof params.timKiem === 'string' ? params.timKiem : undefined,
            trangThai: params.trangThai as 'HOAT_DONG' | 'NGUNG_HOAT_DONG' | undefined,
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
        toolBarRender={() =>
          coTao
            ? [
                <ModalForm<FormNhaCungCap>
                  key="create"
                  title="Thêm nhà cung cấp"
                  trigger={<Button type="primary">Thêm nhà cung cấp</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    await taoMoi(values);
                    message.success('Đã tạo nhà cung cấp.');
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

      <ModalForm<FormNhaCungCap>
        title="Cập nhật nhà cung cấp"
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
          message.success('Đã cập nhật nhà cung cấp.');
          setDangSua(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết nhà cung cấp"
        width={640}
        open={Boolean(chiTiet)}
        onClose={() => {
          setChiTiet(null);
          setTrangTraiLienQuan([]);
          setLoiTrangTrai(null);
        }}
      >
        {chiTiet ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              bordered
              items={[
                {
                  key: 'ma',
                  label: 'Mã',
                  children: chiTiet.ma,
                },
                {
                  key: 'ten',
                  label: 'Tên',
                  children: chiTiet.ten,
                },
                {
                  key: 'dai-dien',
                  label: 'Người đại diện',
                  children: chiTiet.nguoiDaiDien ?? '—',
                },
                {
                  key: 'dien-thoai',
                  label: 'Điện thoại',
                  children: chiTiet.soDienThoai ?? '—',
                },
                {
                  key: 'email',
                  label: 'Email',
                  children: chiTiet.email ?? '—',
                },
                {
                  key: 'dia-chi',
                  label: 'Địa chỉ',
                  children: chiTiet.diaChi ?? '—',
                },
                {
                  key: 'ghi-chu',
                  label: 'Ghi chú',
                  children: chiTiet.ghiChu ?? '—',
                },
                {
                  key: 'trang-thai',
                  label: 'Trạng thái',
                  children: (
                    <Tag color={chiTiet.trangThai === 'HOAT_DONG' ? 'green' : 'default'}>
                      {chiTiet.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Tag>
                  ),
                },
              ]}
            />

            <Descriptions title={`Trang trại trực thuộc (${trangTraiLienQuan.length})`} column={1} />
            {dangTaiTrangTrai ? (
              <Spin tip="Đang tải trang trại..." />
            ) : loiTrangTrai ? (
              <span>{loiTrangTrai}</span>
            ) : trangTraiLienQuan.length ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {trangTraiLienQuan.map((farm) => (
                  <Descriptions
                    key={farm.id}
                    column={2}
                    bordered
                    size="small"
                    items={[
                      { key: 'ma', label: 'Mã', children: farm.ma },
                      {
                        key: 'trang-thai',
                        label: 'Trạng thái',
                        children: (
                          <Tag color={farm.trangThai === 'HOAT_DONG' ? 'green' : 'default'}>
                            {farm.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </Tag>
                        ),
                      },
                      { key: 'ten', label: 'Tên', children: farm.ten, span: 2 },
                      { key: 'dia-chi', label: 'Địa chỉ', children: farm.diaChi, span: 2 },
                    ]}
                  />
                ))}
                <Link href="/trang-trai">Mở quản lý trang trại</Link>
              </Space>
            ) : (
              <span>Chưa có dữ liệu</span>
            )}
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

function FormFields() {
  return (
    <>
      <ProFormText
        name="ma"
        label="Mã nhà cung cấp"
        rules={[
          {
            required: true,
            message: 'Nhập mã nhà cung cấp',
          },
        ]}
      />
      <ProFormText
        name="ten"
        label="Tên nhà cung cấp"
        rules={[
          {
            required: true,
            message: 'Nhập tên nhà cung cấp',
          },
        ]}
      />
      <ProFormText name="nguoiDaiDien" label="Người đại diện" />
      <ProFormText name="soDienThoai" label="Số điện thoại" />
      <ProFormText name="email" label="Email" />
      <ProFormText name="diaChi" label="Địa chỉ" />
      <ProFormTextArea name="ghiChu" label="Ghi chú nội bộ" />
    </>
  );
}
