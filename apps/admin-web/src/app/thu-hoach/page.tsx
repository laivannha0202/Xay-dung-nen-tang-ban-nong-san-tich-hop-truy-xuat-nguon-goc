'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { capNhat, layChiTiet, layDanhSach, layMuaVu, taoMoi } from '@/lib/api-thu-hoach';
import { layPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ThuHoachChiTiet = Awaited<ReturnType<typeof layChiTiet>>;

type ThuHoachTomTat = Awaited<ReturnType<typeof layDanhSach>>['duLieu'][number];

type FormThuHoach = {
  muaVuId: string;
  ngayThuHoach: string;
  soLuong: number;
  donVi: string;
  phanLoai: string;
  ghiChu?: string;
};

export default function TrangThuHoach() {
  const router = useRouter();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);

  const [quyen, setQuyen] = useState<string[] | null>(null);

  const [chiTiet, setChiTiet] = useState<ThuHoachChiTiet | null>(null);

  const [dangSua, setDangSua] = useState<ThuHoachChiTiet | null>(null);

  useEffect(() => {
    const phien = layPhienAdmin();

    if (!phien) {
      router.replace('/dang-nhap');
      return;
    }

    setQuyen(phien.quyen);
  }, [router]);

  if (quyen === null) {
    return <PageContainer title="Thu hoạch">Đang tải quyền quản trị...</PageContainer>;
  }

  const coXem = quyen.includes('thu_hoach.xem');

  const coTao = quyen.includes('thu_hoach.tao');

  const coSua = quyen.includes('thu_hoach.sua');

  if (!coXem) {
    return <PageContainer title="Thu hoạch">Bạn không có quyền xem thu hoạch.</PageContainer>;
  }

  const columns: ProColumns<ThuHoachTomTat>[] = [
    {
      title: 'Tìm kiếm',
      dataIndex: 'timKiem',
      hideInTable: true,
    },
    {
      title: 'Ngày thu hoạch',
      dataIndex: 'ngayThuHoach',
      search: false,
      width: 135,
    },
    {
      title: 'Mùa vụ',
      dataIndex: 'muaVuId',
      hideInTable: true,
      valueType: 'select',
      request: danhSachLuaChonMuaVu,
    },
    {
      title: 'Trang trại',
      dataIndex: ['muaVu', 'trangTrai', 'ten'],
      search: false,
      ellipsis: true,
    },
    {
      title: 'Cây trồng / giống',
      key: 'mua-vu',
      search: false,
      render: (_, row) => `${row.muaVu.cayTrong} / ${row.muaVu.giong}`,
    },
    {
      title: 'Số lượng',
      dataIndex: 'soLuong',
      search: false,
      width: 115,
      render: (_, row) =>
        row.soLuong.toLocaleString('vi-VN', {
          maximumFractionDigits: 3,
        }),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'donVi',
      width: 90,
    },
    {
      title: 'Phân loại',
      dataIndex: 'phanLoai',
      width: 120,
      render: (_, row) => <Tag>{row.phanLoai}</Tag>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'ghiChu',
      search: false,
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 150,
      render: (_, row) => [
        <Button
          key="detail"
          type="link"
          size="small"
          onClick={async () => {
            setChiTiet(await layChiTiet(row.id));
          }}
        >
          Chi tiết
        </Button>,
        coSua ? (
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={async () => {
              setDangSua(await layChiTiet(row.id));
            }}
          >
            Sửa
          </Button>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer title="Thu hoạch" subTitle="Ghi nhận sản lượng thu hoạch thực tế theo mùa vụ">
      <ProTable<ThuHoachTomTat>
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
            muaVuId: typeof params.muaVuId === 'string' ? params.muaVuId : undefined,
            donVi: typeof params.donVi === 'string' ? params.donVi : undefined,
            phanLoai: typeof params.phanLoai === 'string' ? params.phanLoai : undefined,
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
                <ModalForm<FormThuHoach>
                  key="create"
                  title="Ghi nhận thu hoạch"
                  trigger={<Button type="primary">Thêm thu hoạch</Button>}
                  modalProps={{
                    destroyOnHidden: true,
                  }}
                  onFinish={async (values) => {
                    await taoMoi({
                      muaVuId: values.muaVuId,
                      ngayThuHoach: values.ngayThuHoach,
                      soLuong: values.soLuong,
                      donVi: values.donVi,
                      phanLoai: values.phanLoai,
                      ghiChu: chuanHoaGhiChu(values.ghiChu),
                    });

                    message.success('Đã ghi nhận thu hoạch.');

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

      <ModalForm<FormThuHoach>
        title="Cập nhật thu hoạch"
        open={Boolean(dangSua)}
        initialValues={dangSua ? taoGiaTriSua(dangSua) : undefined}
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
            muaVuId: values.muaVuId,
            ngayThuHoach: values.ngayThuHoach,
            soLuong: values.soLuong,
            donVi: values.donVi,
            phanLoai: values.phanLoai,
            ghiChu: chuanHoaGhiChu(values.ghiChu),
          });

          message.success('Đã cập nhật thu hoạch.');

          setDangSua(null);

          actionRef.current?.reload();

          return true;
        }}
      >
        <FormFields />
      </ModalForm>

      <Drawer
        title="Chi tiết thu hoạch"
        width={680}
        open={Boolean(chiTiet)}
        onClose={() => setChiTiet(null)}
      >
        {chiTiet ? (
          <Descriptions
            column={1}
            bordered
            items={[
              {
                key: 'farm',
                label: 'Trang trại',
                children: `${chiTiet.muaVu.trangTrai.ma} — ${chiTiet.muaVu.trangTrai.ten}`,
              },
              {
                key: 'season',
                label: 'Mùa vụ',
                children: `${chiTiet.muaVu.cayTrong} / ${chiTiet.muaVu.giong}`,
              },
              {
                key: 'date',
                label: 'Ngày thu hoạch',
                children: chiTiet.ngayThuHoach,
              },
              {
                key: 'quantity',
                label: 'Số lượng',
                children: `${chiTiet.soLuong.toLocaleString('vi-VN', {
                  maximumFractionDigits: 3,
                })} ${chiTiet.donVi}`,
              },
              {
                key: 'grade',
                label: 'Phân loại',
                children: chiTiet.phanLoai,
              },
              {
                key: 'note',
                label: 'Ghi chú',
                children: chiTiet.ghiChu ?? '—',
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
      <ProFormSelect
        name="muaVuId"
        label="Mùa vụ"
        rules={[
          {
            required: true,
            message: 'Chọn mùa vụ',
          },
        ]}
        request={danhSachLuaChonMuaVu}
      />

      <ProFormText
        name="ngayThuHoach"
        label="Ngày thu hoạch"
        fieldProps={{
          type: 'date',
        }}
        rules={[
          {
            required: true,
            message: 'Chọn ngày thu hoạch',
          },
        ]}
      />

      <ProFormDigit
        name="soLuong"
        label="Số lượng"
        min={0.001}
        fieldProps={{
          precision: 3,
        }}
        rules={[
          {
            required: true,
            message: 'Nhập số lượng',
          },
        ]}
      />

      <ProFormText
        name="donVi"
        label="Đơn vị"
        placeholder="Ví dụ: KG"
        rules={[
          {
            required: true,
            message: 'Nhập đơn vị',
          },
        ]}
      />

      <ProFormText
        name="phanLoai"
        label="Phân loại"
        placeholder="Ví dụ: Loại A"
        rules={[
          {
            required: true,
            message: 'Nhập phân loại',
          },
        ]}
      />

      <ProFormTextArea
        name="ghiChu"
        label="Ghi chú"
        fieldProps={{
          rows: 4,
          maxLength: 5000,
          showCount: true,
        }}
      />
    </>
  );
}

async function danhSachLuaChonMuaVu() {
  const response = await layMuaVu();

  return response.duLieu
    .filter((item) => item.trangThai !== 'HUY')
    .map((item) => ({
      label: `${item.trangTrai.ten} — ${item.cayTrong} / ${item.giong} — ${tenTrangThaiMuaVu(item.trangThai)}`,
      value: item.id,
    }));
}

function tenTrangThaiMuaVu(
  value: Awaited<ReturnType<typeof layMuaVu>>['duLieu'][number]['trangThai'],
): string {
  switch (value) {
    case 'KE_HOACH':
      return 'Kế hoạch';
    case 'DANG_CANH_TAC':
      return 'Đang canh tác';
    case 'CHO_THU_HOACH':
      return 'Chờ thu hoạch';
    case 'DA_KET_THUC':
      return 'Đã kết thúc';
    case 'HUY':
      return 'Hủy';
  }
}

function chuanHoaGhiChu(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.trim();
}

function taoGiaTriSua(item: ThuHoachChiTiet): FormThuHoach {
  return {
    muaVuId: item.muaVu.id,
    ngayThuHoach: item.ngayThuHoach,
    soLuong: item.soLuong,
    donVi: item.donVi,
    phanLoai: item.phanLoai,
    ghiChu: item.ghiChu ?? undefined,
  };
}
